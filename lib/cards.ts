import {z} from "zod";
const text=z.string().trim().min(1).max(2000),id=z.string().min(1).max(60);
const rawCard=z.object({идентификатор:id,тип:z.enum(["понятие","термин_по_описанию","связь","причина","следствие","сравнение","правило","формула","применение","последовательность","ошибка","пример","обратная"]),уровень:z.enum(["воспроизведение","понимание","применение"]),приоритет:z.enum(["высокий","средний","низкий"]),раздел_урока:text,проверяет:text,лицевая_сторона:text,обратная_сторона:text,допустимые_формулировки:z.array(text).max(12),пояснение:text,типичная_ошибка:z.string().max(2000),теги:z.array(text).min(1).max(8)});
const response=z.object({статус:z.enum(["готово","нужны_данные"]),недостающие_поля:z.array(text),название:z.string().max(300),тема_урока:z.string().max(2000),количество_карточек:z.number().int().min(0).max(20),карточки:z.array(rawCard).max(20),покрытие:z.array(z.object({результат_урока:text,карточки:z.array(id).min(1)})),заметки:z.array(text).max(10)}).superRefine((v,ctx)=>{
 const fail=(message:string)=>ctx.addIssue({code:"custom",message});
 if(v.статус==="нужны_данные"){if(!v.недостающие_поля.length||v.карточки.length||v.количество_карточек||v.название||v.покрытие.length)fail("Missing-input response cannot contain cards");return;}
 if(v.недостающие_поля.length||!v.название.trim()||v.карточки.length<12||v.количество_карточек!==v.карточки.length)fail("Expected 12–20 complete cards");
 const ids=v.карточки.map(c=>c.идентификатор);
 if(new Set(ids).size!==ids.length||new Set(v.карточки.map(c=>c.лицевая_сторона)).size!==ids.length)fail("Duplicate cards");
 if(!v.покрытие.length||v.покрытие.some(p=>p.карточки.some(id=>!ids.includes(id))))fail("Invalid coverage references");
});
export type StudyCard={id:string;type:string;depth:string;priority:string;section:string;skill:string;front:string;back:string;acceptedAnswers:string[];explanation:string;commonError:string;tags:string[]};
export type CardDeck={version:1;title:string;cards:StudyCard[]};
export type PublicCard=Pick<StudyCard,"id"|"type"|"depth"|"priority"|"section"|"front"|"tags">;
export type PublicDeck={courseId:string;lessonId:string;title:string;cards:PublicCard[]};
export type CardReview={course_id:string;lesson_id:string;card_id:string;next_review_at:number;stage:number;successful_reviews:number;last_correct:number;last_review_at:number};
export function parseCards(raw:unknown):CardDeck{
 const v=response.parse(raw);if(v.статус!=="готово")throw new Error("Missing card inputs: "+v.недостающие_поля.join(", "));
 return {version:1,title:v.название,cards:v.карточки.map(c=>({id:c.идентификатор,type:c.тип,depth:c.уровень,priority:c.приоритет,section:c.раздел_урока,skill:c.проверяет,front:c.лицевая_сторона,back:c.обратная_сторона,acceptedAnswers:c.допустимые_формулировки,explanation:c.пояснение,commonError:c.типичная_ошибка,tags:c.теги}))};
}
export function publicDeck(deck:CardDeck,courseId:string,lessonId:string):PublicDeck{return {courseId,lessonId,title:deck.title,cards:deck.cards.map(c=>({id:c.id,type:c.type,depth:c.depth,priority:c.priority,section:c.section,front:c.front,tags:c.tags}))};}
export const DAY=86400000;
export function scheduleReview(previous:Pick<CardReview,"next_review_at"|"stage"|"successful_reviews">|null,correct:boolean,now:number){
 const due=!previous||now>=previous.next_review_at;
 if(!due)return {due:false,points:0,stage:previous.stage,successful:previous.successful_reviews,next:previous.next_review_at};
 const successful=(previous?.successful_reviews||0)+(correct?1:0),stage=correct?Math.min((previous?.stage||0)+1,6):0;
 const days=correct?[3,7,14,30,60,90][stage-1]:1;
 return {due:true,points:correct?(previous?.successful_reviews?5:3):0,stage,successful,next:now+days*DAY};
}
