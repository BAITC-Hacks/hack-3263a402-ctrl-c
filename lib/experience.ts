import {lessonComplete,type Course,type LearningState} from "./types";
export const thresholds=[0,100,250,450,700,1000,1350,1750,2200,2700,3300,4000,4800,5700,6700,7800,9000,10300,11700,13200,14800,16500,18300,20200,22200,24300,26500,28800,31200,34000];
export const titles=["Новичок","Искатель","Ученик","Исследователь","Практик","Старатель","Знаток","Аналитик","Решатель","Специалист","Навигатор знаний","Уверенный практик","Исследователь знаний","Стратег","Эксперт","Мастер","Мастер анализа","Мастер решений","Мастер знаний","Наставник","Эрудит","Архитектор знаний","Исследователь высокого уровня","Мыслитель","Учёный","Великий мастер","Хранитель знаний","Профессор","Просветитель","Легенда BLITZ"];
export function rankFor(total:number){const xp=Math.max(0,Math.floor(total));let index=0;while(index<29&&xp>=thresholds[index+1])index++;const next=thresholds[index+1]??null;return {level:index+1,title:titles[index],group:Math.floor(index/5),stage:index%5+1,start:thresholds[index],next,total:xp,percent:next===null?100:Math.floor((xp-thresholds[index])/(next-thresholds[index])*100)};}
export type Award={key:string;courseId:string;subject:string;points:number;label:string;createdAt:number};
export type Experience={total:number;subjects:{name:string;total:number;skills:number}[];courses:Record<string,number>;recent:{points:number;label:string;createdAt:number}[];theoryCompleted:string[]};
export const eventKey=(...parts:string[])=>JSON.stringify(parts);
export function subjectOf(c:Course){return (c.subject||c.title).trim().replace(/\s+/g," ");}
export function projectPoints(project:{size?:string;complexity?:string}){const i=project.complexity==="advanced"?2:project.complexity==="simple"?0:1;return (project.size==="large"?[300,450,600]:[150,225,300])[i];}
export function earnedAwards(s:LearningState):Award[]{
 const awards:Award[]=[];
 for(const c of s.courses){const subject=subjectOf(c);const add=(parts:string[],points:number,label:string,createdAt:number)=>awards.push({key:eventKey(c.id,...parts),courseId:c.id,subject,points,label,createdAt});
  for(const level of c.levels){for(const l of level.lessons){if(l.ready===false)continue;const attempts=s.attempts.filter(a=>a.course_id===c.id&&a.lesson_id===l.id);
   const test=l.questions.filter(q=>/^q\d+$/.test(q.key));
   for(const q of test){const a=attempts.filter(a=>a.question_key===q.key),firstCorrect=a.find(x=>x.correct);if(firstCorrect)add([l.id,"answer",q.key],a[0]?.correct?10:5,"Правильный ответ в тесте",firstCorrect.created_at);}
   const first=test.map(q=>attempts.find(a=>a.question_key===q.key));
   if(test.length&&first.every(Boolean)){const at=Math.max(...first.map(a=>a!.created_at)),score=first.filter(a=>a!.correct).length/test.length;add([l.id,"test"],30,"Тест завершён",at);if(score>=.8)add([l.id,"test-bonus"],score===1?50:30,score===1?"Тест: 100% с первых ответов":"Тест: не менее 80% с первых ответов",at);}
   const practice=attempts.find(a=>a.question_key==="output"&&a.correct);if(practice)add([l.id,"practice"],30,"Практика пройдена",practice.created_at);
   const corrected=new Set(attempts.filter(a=>!a.correct&&a.resolved&&a.question_key!=="transfer").map(a=>a.question_key));for(const key of corrected){if(attempts.find(a=>a.question_key===key)?.correct)continue;const a=attempts.find(a=>a.question_key===key&&a.resolved)!;add([l.id,"remediation",key],10,"Ошибка исправлена",a.created_at);}
  }
  if(level.lessons.length&&level.lessons.every(l=>lessonComplete(s,c,l)))add([level.id,"level"],100,"Этап маршрута завершён",Math.max(0,...s.attempts.filter(a=>a.course_id===c.id&&level.lessons.some(l=>l.id===a.lesson_id)).map(a=>a.created_at)));
  const project=s.projects.find(p=>p.course_id===c.id&&p.level_id===level.id&&p.status==="accepted");if(project&&level.project)add([level.id,"project"],projectPoints(level.project),"Проект принят",project.created_at);
 }}return awards;
}
