import {env} from "cloudflare:workers";
import {identity} from "./identity";
import {db} from "./database";
export {db} from "./database";
import {builtin,publicCourse,type FullCourse} from "./course";
import {AppError,requestModel} from "./openai";
import {syncExperience} from "./experience-store";
import {publicDeck,type CardDeck} from "./cards";
export {AppError} from "./openai";
export async function owner(){const current=await identity();if(!current)throw new AppError("Войди в аккаунт, чтобы продолжить обучение.",401);return current.ownerId;}
export function aiReady(){return Boolean((env as any).OPENAI_API_KEY);}
export async function getCourse(id:string,user:string):Promise<FullCourse>{if(id==="python")return builtin;const row=await db().prepare("SELECT data FROM courses WHERE id = ? AND owner = ?").bind(id,user).first<{data:string}>();if(!row)throw new AppError("Блиц не найден.",404);return JSON.parse(row.data);}
export async function state(user:string){const current=await identity();const d=db();const [c,a,p]=await Promise.all([d.prepare("SELECT data FROM courses WHERE owner = ? ORDER BY created_at DESC").bind(user).all<{data:string}>(),d.prepare("SELECT id,course_id,lesson_id,question_key,answer,correct,resolved,snapshot,remediate_for,created_at FROM attempts WHERE owner = ? ORDER BY rowid ASC").bind(user).all(),d.prepare("SELECT id,course_id,level_id,body,status,feedback,created_at FROM projects WHERE owner = ?").bind(user).all()]);const hasLegacyPython=[...a.results,...p.results].some((x:any)=>x.course_id==="python");const result={user:current?.ownerId===user?current.user:null,courses:[...c.results.map(x=>publicCourse(JSON.parse(x.data))),...(hasLegacyPython?[publicCourse(builtin)]:[])],attempts:a.results.map((a:any)=>{if(a.question_key!=="transfer"||a.correct)return a;const snapshot=JSON.parse(a.snapshot);return {...a,snapshot:JSON.stringify({...snapshot,correctAnswer:"",explanation:"Повтори правило и попробуй решить пример самостоятельно."})};}),projects:p.results,aiReady:aiReady(),signedIn:true};
 const [decks,reviews]=await Promise.all([d.prepare("SELECT course_id,lesson_id,data FROM card_decks WHERE owner=?").bind(user).all<{course_id:string;lesson_id:string;data:string}>(),d.prepare("SELECT course_id,lesson_id,card_id,next_review_at,stage,successful_reviews,last_correct,last_review_at FROM card_reviews WHERE owner=?").bind(user).all()]);
 const settings=await d.prepare("SELECT onboarding_version FROM learner_settings WHERE owner=?").bind(user).first<{onboarding_version:number}>();
 return {...result,onboardingDone:(settings?.onboarding_version||0)>=1,cardDecks:decks.results.map(x=>publicDeck(JSON.parse(x.data) as CardDeck,x.course_id,x.lesson_id)),cardReviews:reviews.results,experience:await syncExperience(user,result as any)};
}
export async function model(user:string,instructions:string,input:string,json=false,maxTokens=3500,timeoutMs?:number){
 const key=(env as any).OPENAI_API_KEY;
 if(!key)throw new AppError("Astra ещё не подключена. Для создания учебного пути нужен ключ OpenAI в настройках сайта.",503);
 const usageId=`${user}:${new Date().toISOString().slice(0,10)}`;
 const used=await db().prepare("INSERT INTO ai_usage(id,count) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET count=count+1 WHERE count<60 RETURNING count").bind(usageId).first();
 if(!used)throw new AppError("Дневной лимит ИИ-запросов достигнут. Продолжи завтра.",429);
 return requestModel({key,model:(env as any).OPENAI_MODEL||"gpt-6-astra",instructions,input,json,maxTokens,timeoutMs});
}
