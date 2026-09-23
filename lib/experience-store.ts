import {db} from "./database";
import {earnedAwards,subjectOf,type Award,type Experience} from "./experience";
import {lessonComplete,type LearningState} from "./types";
export function awardStatement(owner:string,award:Award){return db().prepare("INSERT OR IGNORE INTO xp_events(id,owner,event_key,course_id,subject,points,label,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(),owner,award.key,award.courseId,award.subject,award.points,award.label,award.createdAt);}
export async function syncExperience(owner:string,state:LearningState):Promise<Experience>{
 const d=db();const old=await d.prepare("SELECT event_key FROM xp_events WHERE owner=?").bind(owner).all<{event_key:string}>();const known=new Set(old.results.map(r=>r.event_key));const missing=earnedAwards(state).filter(a=>!known.has(a.key));
 for(let i=0;i<missing.length;i+=40)await d.batch(missing.slice(i,i+40).map(a=>awardStatement(owner,a)));
 const rows=(await d.prepare("SELECT event_key,course_id,subject,points,label,created_at FROM xp_events WHERE owner=? ORDER BY created_at DESC,rowid DESC").bind(owner).all<{event_key:string;course_id:string;subject:string;points:number;label:string;created_at:number}>()).results;
 const subjects=new Map<string,{name:string;total:number;skills:number}>(),courses:Record<string,number>={};let total=0;const theoryCompleted:string[]=[];
 for(const r of rows){total+=r.points;courses[r.course_id]=(courses[r.course_id]||0)+r.points;const key=r.subject.toLocaleLowerCase();const subject=subjects.get(key)||{name:r.subject,total:0,skills:0};subject.total+=r.points;subjects.set(key,subject);let parts:string[]=[];try{parts=JSON.parse(r.event_key);}catch{}if(parts.at(-1)==="theory")theoryCompleted.push(r.event_key);}
 for(const c of state.courses){const name=subjectOf(c),key=name.toLocaleLowerCase(),subject=subjects.get(key)||{name,total:0,skills:0};subject.skills+=c.levels.flatMap(l=>l.lessons).filter(l=>lessonComplete(state,c,l)).length;subjects.set(key,subject);}
 return {total,subjects:[...subjects.values()].sort((a,b)=>b.total-a.total),courses,theoryCompleted,recent:rows.slice(0,12).map(r=>({points:r.points,label:r.label,createdAt:r.created_at}))};
}
