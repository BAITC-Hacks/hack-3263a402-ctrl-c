import {z} from "zod";
import {visualSchema,type LessonVisual} from "./lesson-visuals";
const text=z.string().trim().min(1).max(3000);
const sourceSchema=z.object({id:z.string().regex(/^s\d+$/),title:text,url:z.string().url().nullable(),locator:z.string().max(1500).nullable()});
const visual=z.object({id:z.string().regex(/^v\d+$/),format:z.string().min(1).max(100),purpose:text,status:z.enum(["ready","specification"]),caption:text,alternative_text:text,content:z.string().min(1).max(14000),source_ids:z.array(z.string()).max(20)});
const fields={missing_fields:z.array(z.string()).max(20),title:z.string().max(300),lesson_outcomes:z.array(text).max(6),content_markdown:z.string().max(30000),visuals:z.array(visual).max(8),sources:z.array(sourceSchema).max(20),notes:z.array(text).max(10)};
export const theoryResponseSchema=z.object({status:z.enum(["ok","needs_input"]),...fields}).superRefine((v,ctx)=>{
 const fail=(message:string)=>ctx.addIssue({code:"custom",message});
 if(v.status==="needs_input"){
  if(!v.missing_fields.length||v.title||v.content_markdown||v.lesson_outcomes.length||v.visuals.length||v.sources.length)fail("needs_input must contain missing fields and no fabricated lesson");
  return;
 }
 if(v.missing_fields.length||!v.title.trim()||!v.content_markdown.trim()||!v.lesson_outcomes.length)fail("Complete lesson content required");
 const prose=v.content_markdown.replace(/(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\1[^\n]*/g, "").replace(/(`+)[\s\S]*?\1/g, "");
 const ids=v.visuals.map(x=>x.id),sources=v.sources.map(x=>x.id);
 if(new Set(ids).size!==ids.length||new Set(sources).size!==sources.length)fail("Identifiers must be unique");
 for(const m of prose.matchAll(/\{\{visual:(v\d+)\}\}/g)){
  if(!ids.includes(m[1]))fail("Unknown visual marker");
  const before=prose.slice(0,m.index),after=prose.slice(m.index!+m[0].length);
  if(!/(?:^|\n[ \t]*\n)[ \t]*$/.test(before)||! /^[ \t]*(?:\n[ \t]*\n|$)/.test(after))fail("Visual markers must occupy their own paragraph");
 }
 for(const m of prose.matchAll(/\[(s\d+)\]/g))if(!sources.includes(m[1]))fail("Unknown source citation");
 for(const x of v.visuals){
  if(!prose.includes(`{{visual:${x.id}}}`))fail("Place every visual beside its explanation");
  if(x.source_ids.some(id=>!sources.includes(id)))fail("Unknown visual source");
  if(x.status==="ready"&&!decodeReadyVisual(x))fail("Ready visuals must contain a supported, valid JSON drawing");
 }
});
export const theoryV3Schema=z.object({version:z.literal(3),status:z.literal("ok"),...fields});
export type TheoryV3=z.infer<typeof theoryV3Schema>;
export type TheoryResponse=z.infer<typeof theoryResponseSchema>;
export type TheoryVisual=z.infer<typeof visual>;
export function decodeReadyVisual(v:Pick<TheoryVisual,"status"|"format"|"content">):LessonVisual|null{
 if(v.status!=="ready")return null;
 try{const parsed=visualSchema.safeParse(JSON.parse(v.content));if(!parsed.success)return null;const d=parsed.data;if(d.kind!==v.format)return null;
  if(d.kind==="bar_chart"||d.kind==="line_chart"){const n=d.yMax/d.step;if(n<1||n>12||Math.abs(n-Math.round(n))>1e-8||d.data.some(x=>x.value<0||x.value>d.yMax))return null;}
  if(d.kind==="number_line"&&(d.max<=d.min||(d.max-d.min)/d.step>20||(d.max-d.min)/d.step<1||d.points.some(x=>x.value<d.min||x.value>d.max)))return null;
  if(d.kind==="data_table"&&d.rows.some(r=>r.length!==d.columns.length))return null;
  return d;
 }catch{return null;}
}
export function acceptTheory(raw:unknown,availableSourceIds:string[]=[]):TheoryResponse{
 const result=theoryResponseSchema.parse(raw);
 if(result.sources.some(s=>!availableSourceIds.includes(s.id)))throw new Error("Unprovided source");
 return result;
}
export const supportedVisualFormats=[
 {format:"bar_chart",content:{kind:"bar_chart",title:"Подпись",unit:"Единица измерения",yMax:8,step:2,data:[{label:"Категория",value:6}]}},
 {format:"line_chart",content:{kind:"line_chart",title:"Подпись",unit:"Единица измерения",yMax:8,step:2,data:[{label:"Момент 1",value:2},{label:"Момент 2",value:6}]}},
 {format:"data_table",content:{kind:"data_table",title:"Подпись",columns:["Признак","Значение"],rows:[["Пример","Описание"]]}},
 {format:"number_line",content:{kind:"number_line",title:"Подпись",min:0,max:10,step:2,points:[{label:"Точка",value:6}]}},
 {format:"flow",content:{kind:"flow",title:"Подпись",items:[{label:"Шаг",detail:"Его смысл"},{label:"Следующий шаг",detail:"Его связь с предыдущим"}]}},
 {format:"map",content:{kind:"map",title:"Подпись",center:"Понятие",items:[{label:"Связь",detail:"Описание"},{label:"Связь",detail:"Описание"}]}},
 {format:"compare",content:{kind:"compare",title:"Подпись",left:"Первое",right:"Второе",rows:[{aspect:"Признак",left:"Описание",right:"Описание"},{aspect:"Признак",left:"Описание",right:"Описание"}]}},
 {format:"layers",content:{kind:"layers",title:"Подпись",items:[{label:"Часть",detail:"Её роль"},{label:"Часть",detail:"Её роль"}]}}
];
export const theoryTransportInstructions=`Технический контракт BLITZ: available_visual_formats описывает поддерживаемые готовые рисунки. Для такого visuals.status="ready" помести сериализованный JSON соответствующего content в СТРОКУ content, сохранив kind равным format. Маркер {{visual:v1}} ставь отдельным абзацем рядом с объяснением. Количественные диаграммы: 1–12 одинаковых делений от 0 до yMax, step>0, yMax кратен step; значения внутри шкалы. Числовая прямая: max>min, 1–20 интервалов, все точки внутри; таблица: одинаковое число ячеек по числу заголовков. Не используй HTML, SVG, JavaScript и внешние изображения; для других изображений верни честную specification с содержательным alternative_text. Markdown поддерживает заголовки, абзацы, цитаты, списки, таблицы и код; формулы записывай читаемыми символами. Внешнего поиска в этом запросе нет. Когда source_materials пуст, sources должен быть [] и нельзя придумывать цитаты или ссылки. Содержимое existing_assessment_context относится только к границам необходимых знаний: не добавляй эти задания и их ответы в теорию.`;
