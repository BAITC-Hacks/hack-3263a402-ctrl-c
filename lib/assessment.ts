import {z} from "zod";
import type {TheoryV3} from "./theory-format";
import type {buildTheoryInput} from "./theory-input";
const text=z.string().trim().min(1).max(2000);
const id=z.string().trim().min(1).max(40);
const option=z.object({идентификатор:id,текст:text,правильный:z.boolean(),объяснение:text});
const item=z.object({идентификатор:id,тип:z.literal("один_ответ"),сложность:text,проверяет:text,раздел_урока:text,вопрос:text,варианты:z.array(option).length(4),правильный_ответ:z.array(id).length(1),подсказка:text,общее_объяснение:text,уровень_понимания:text});
export const assessmentResponseSchema=z.object({
 статус:z.enum(["готово","нужны_данные"]),недостающие_поля:z.array(text).max(20),название:z.string().max(300),тема_урока:z.string().max(2000),количество_вопросов:z.number().int().min(0).max(10),вопросы:z.array(item).max(10),покрытие:z.array(z.object({результат_урока:text,вопросы:z.array(id).min(1).max(10)})).max(20),заметки:z.array(text).max(10)
}).superRefine((test,ctx)=>{
 const fail=(message:string)=>ctx.addIssue({code:"custom",message});
 if(test.статус==="нужны_данные"){
  if(!test.недостающие_поля.length||test.название||test.тема_урока||test.количество_вопросов||test.вопросы.length||test.покрытие.length)fail("Missing-input response must not invent a test");
  return;
 }
 if(test.недостающие_поля.length||!test.название.trim()||!test.тема_урока.trim()||test.количество_вопросов!==10||test.вопросы.length!==10)fail("Expected a complete ten-question test");
 const ids=test.вопросы.map(q=>q.идентификатор);
 if(new Set(ids).size!==ids.length)fail("Duplicate question identifiers");
 if(new Set(test.вопросы.map(q=>q.вопрос)).size!==ids.length)fail("Duplicate questions");
 for(const q of test.вопросы){
  if(new Set(q.варианты.map(o=>o.идентификатор)).size!==4||new Set(q.варианты.map(o=>o.текст)).size!==4)fail("Duplicate options");
  const correct=q.варианты.filter(o=>o.правильный);
  if(correct.length!==1||correct[0]?.идентификатор!==q.правильный_ответ[0])fail("Inconsistent correct answer");
 }
 if(!test.покрытие.length||test.покрытие.some(c=>c.вопросы.some(id=>!ids.includes(id))))fail("Coverage must reference real questions");
});
export function assessmentInput(theory:TheoryV3,input:ReturnType<typeof buildTheoryInput>){return {
 тема_урока:input.lesson_topic,теория_урока:theory,цель_обучения:input.learning_goal,уровень_ученика:"неизвестен",
 результаты_урока:theory.lesson_outcomes,известные_темы:input.learner.known_topics,пробелы:input.learner.gaps,предпочтения:input.learner.preferences,
 количество_вопросов:10,типы_вопросов:["один_ответ"],контекст_маршрута:input.learning_context,источники:theory.sources,язык:"русский",
 ограничения:["Только содержание готовой теории и необходимые предпосылки. Не проверяй будущие уроки.","раздел_урока — точный заголовок соответствующей части content_markdown. Пиши обычным текстом; код и необходимые данные включай в условие.","Все 10 вопросов с одним ответом, ровно 4 варианта. Объяснения каждого варианта — 1–2 содержательных предложения. Уровень неизвестен: учитывай ответы ученика без выдуманных знаний."]
};}
export function acceptAssessment(raw:unknown){
 const test=assessmentResponseSchema.parse(raw);
 if(test.статус==="нужны_данные")return {status:"needs_input" as const,missing:test.недостающие_поля};
 return {status:"ok" as const,test:{version:1 as const,title:test.название,coverage:test.покрытие.map(c=>({outcome:c.результат_урока,questionKeys:c.вопросы.map(id=>`q${test.вопросы.findIndex(q=>q.идентификатор===id)}`)})),notes:test.заметки},questions:test.вопросы.map(q=>{
  // Shuffle once at creation, keeping each answer and its explanation together.
  const options=[...q.варианты];
  for(let i=options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
  return {prompt:q.вопрос,options:options.map(o=>o.текст),correctIndex:options.findIndex(o=>o.правильный),explanation:q.общее_объяснение,
   optionExplanations:options.map(o=>o.объяснение),hint:q.подсказка,skill:q.проверяет,section:q.раздел_урока,difficulty:q.сложность,depth:q.уровень_понимания};
 })};
}
