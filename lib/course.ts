import source from "@/data/python.json";
import { z } from "zod";
import type {Course} from "./types";
const short=z.string().min(1).max(2000);
const output=z.object({prompt:short,code:z.string().max(3000),expected:short,explanation:short});
export const courseSchema=z.object({title:z.string().min(2).max(140),levels:z.array(z.object({id:z.string().min(1).max(50),title:short,subtitle:short,project:z.object({title:short,task:short,criteria:z.array(short).min(2).max(5)}),lessons:z.array(z.object({id:z.string().min(1).max(60),title:short,theory:z.string().min(50).max(6000),code:z.string().max(3000),codeOutput:z.string().max(2000),flow:z.array(short).length(3),flashcard:z.object({front:short,back:short}),questions:z.array(z.object({prompt:short,options:z.array(short).min(2).max(5),correctIndex:z.number().int().min(0).max(4),explanation:short})).length(2),outputQuestion:output,transferQuestion:output})).length(3)})).length(3)}).superRefine((c,ctx)=>{const ids=c.levels.flatMap(l=>l.lessons.map(x=>x.id));if(new Set(ids).size!==ids.length||new Set(c.levels.map(l=>l.id)).size!==c.levels.length)ctx.addIssue({code:"custom",message:"IDs must be unique"});for(const l of c.levels.flatMap(x=>x.lessons))for(const q of l.questions)if(q.correctIndex>=q.options.length)ctx.addIssue({code:"custom",message:"Invalid answer index"});});
export type FullCourse=z.infer<typeof courseSchema> & {id:string;source:string};
const transfers=[
 ['print(8 - 3)','5','Вычитаем 3 из 8. print выводит результат 5.'],
 ['score = 3\nscore = score + 4\nprint(score * 2)','14','Сначала score становится равным 7, затем умножается на 2.'],
 ['word = "learn"\nprint(word[2])\nprint(len(word))','a\n5','Индекс 2 — третий символ a. Длина learn равна 5.'],
 ['x = 6\nif x >= 6:\n    print("Да")\nelse:\n    print("Нет")','Да','>= включает границу, поэтому 6 >= 6 истинно.'],
 ['values = [1, 5]\nvalues.append(8)\nprint(values[1] + values[2])','13','Список становится [1, 5, 8]. Сумма второго и третьего элементов — 13.'],
 ['total = 0\nfor n in range(2, 5):\n    total = total + n\nprint(total)','9','range даёт 2, 3, 4. Их сумма равна 9.'],
 ['def triple(n):\n    return n * 3\nprint(triple(4) + 1)','13','triple(4) возвращает 12. Прибавляем 1.'],
 ['item = {"done": 3, "total": 7}\nitem["done"] = 5\nprint(item["total"] - item["done"])','2','Значение done заменяется на 5. Разница 7 - 5 равна 2.'],
 ['def passed(x):\n    return x >= 5\ncount = 0\nfor x in [2, 5, 8]:\n    if passed(x):\n        count = count + 1\nprint(count)','2','Подходят 5 и 8, поэтому счётчик равен 2.']
];
export const builtin:FullCourse={id:"python",title:"Python: от нуля к первому проекту",source:"Готовый маршрут",levels:source.levels.map((l,li)=>({...l,lessons:l.lessons.map((x,i)=>({...x,transferQuestion:{prompt:"Реши похожее задание самостоятельно. Что выведет программа?",code:transfers[li*3+i][0],expected:transfers[li*3+i][1],explanation:transfers[li*3+i][2]}}))}))};
export function publicCourse(c:FullCourse):Course{return {id:c.id,title:c.title,source:c.source,levels:c.levels.map(l=>({...l,lessons:l.lessons.map(x=>({id:x.id,title:x.title,theory:x.theory,code:x.code,codeOutput:x.codeOutput,flow:x.flow,flashcard:x.flashcard,questions:[...x.questions.map((q,i)=>({key:`q${i}`,prompt:q.prompt,options:q.options})),{key:"output",prompt:x.outputQuestion.prompt,code:x.outputQuestion.code},{key:"transfer",prompt:x.transferQuestion.prompt,code:x.transferQuestion.code}]}))}))};}
export function question(c:FullCourse,lessonId:string,key:string){const l=c.levels.flatMap(l=>l.lessons).find(l=>l.id===lessonId);if(!l)return null;if(key==="output"||key==="transfer"){const q=key==="output"?l.outputQuestion:l.transferQuestion;return {...q,key,lesson:l,correctAnswer:q.expected};}const i=key==="q0"?0:key==="q1"?1:-1;if(i<0)return null;const q=l.questions[i];return {...q,key,lesson:l,correctAnswer:String(q.correctIndex)};}
