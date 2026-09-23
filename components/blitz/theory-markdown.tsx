"use client";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {Expand} from "lucide-react";
import type {ReactNode} from "react";
import {decodeReadyVisual,type TheoryV3} from "@/lib/theory-format";
import type {LessonVisual} from "@/lib/lesson-visuals";
import {theorySectionId} from "@/lib/theory-sections";

export function TheoryMarkdown({theory,onExpand,renderVisual}:{theory:TheoryV3;onExpand:(focus:string)=>void;renderVisual:(visual:LessonVisual)=>ReactNode}){
 const sourceIds=new Set(theory.sources.map(s=>s.id));
 function citations(){return (tree:any)=>{const walk=(node:any)=>{if(!Array.isArray(node.children))return;node.children=node.children.flatMap((child:any)=>{if(child.type!=="text"){walk(child);return [child];}const text=child.value as string;let end=0;const out:any[]=[];for(const m of text.matchAll(/\[(s\d+)\]/g)){if(!sourceIds.has(m[1]))continue;if(m.index!>end)out.push({type:"text",value:text.slice(end,m.index)});out.push({type:"link",url:`#theory-source-${m[1]}`,children:[{type:"text",value:m[0]}]});end=m.index!+m[0].length;}return out.length?[...out,{type:"text",value:text.slice(end)}]:[child];});};walk(tree);};}
 function more(node:any,label="Подробнее об этом фрагменте"){const a=node?.position?.start?.offset,b=node?.position?.end?.offset;const focus=typeof a==="number"&&typeof b==="number"?theory.content_markdown.slice(a,b):"";return focus?<button type="button" className="theory-more" aria-label={label} onClick={()=>onExpand(focus.slice(0,6500))}><Expand size={13}/>Подробнее</button>:null;}
 const visualById=new Map(theory.visuals.map(v=>[v.id,v]));
 function sectionId(node:any){return theorySectionId(theory.content_markdown.slice(node.position.start.offset,node.position.end.offset));}
 function figure(id:string){const v=visualById.get(id);if(!v)return null;const ready=decodeReadyVisual(v);return <div className="theory-illustration">{ready?renderVisual(ready):<figure className="theory-description"><figcaption>{v.caption}</figcaption><span>Текстовое описание иллюстрации</span><p>{v.alternative_text}</p></figure>}{ready&&v.caption!==ready.title&&<p className="illustration-caption">{v.caption}</p>}<button type="button" className="theory-more" aria-label="Подробнее об иллюстрации" onClick={()=>onExpand(`${v.caption}\n${v.alternative_text}\n${v.content}`.slice(0,6500))}><Expand size={13}/>Подробнее</button></div>;}
 return <div className="theory-article"><div className="theory-outcomes"><span>В этом уроке</span><p>{theory.lesson_outcomes.join(" · ")}</p></div><Markdown remarkPlugins={[remarkGfm,citations]} skipHtml urlTransform={url=>url.startsWith("#theory-source-")||theory.sources.some(s=>s.url===url&&/^https?:\/\//.test(url))?url:""} components={{
  h1:({node,children})=><h2 id={sectionId(node)}>{children}{more(node,"Подробнее об этой теме")}</h2>,
  h2:({node,children})=><h3 id={sectionId(node)}>{children}{more(node,"Подробнее об этой теме")}</h3>,
  h3:({node,children})=><h4 id={sectionId(node)}>{children}{more(node,"Подробнее об этой теме")}</h4>,
  h4:({node,children})=><h5 id={sectionId(node)}>{children}{more(node,"Подробнее об этой теме")}</h5>,
  h5:({node,children})=><h6 id={sectionId(node)}>{children}{more(node,"Подробнее об этой теме")}</h6>,
  h6:({node,children})=><h6 id={sectionId(node)}>{children}{more(node,"Подробнее об этой теме")}</h6>,
  p:({node,children})=>{const value=node?.children.length===1&&node.children[0].type==="text"?node.children[0].value:"";const m=value.match(/^\{\{visual:(v\d+)\}\}$/);return m?figure(m[1]):<div className="theory-fragment"><p>{children}</p>{more(node)}</div>;},
  li:({node,children})=><li>{children}{more(node,"Подробнее об этом пункте")}</li>,
  table:({node,children})=><div className="theory-table"><div className="visual-table-scroll"><table>{children}</table></div>{more(node,"Подробнее об этой таблице")}</div>,
  pre:({node,children})=><div className="theory-code"><pre>{children}</pre>{more(node,"Подробнее об этом примере")}</div>,
  a:({href,children})=>href?<a href={href} rel="noreferrer" target={href.startsWith("#")?undefined:"_blank"}>{children}</a>:<span>{children}</span>,
  img:({alt})=><span>{alt}</span>,
 }}>{theory.content_markdown}</Markdown>{theory.sources.length>0&&<section className="theory-sources"><h3>Источники</h3><ul>{theory.sources.map(s=><li key={s.id} id={`theory-source-${s.id}`}>{s.url&&/^https?:\/\//.test(s.url)?<a href={s.url} target="_blank" rel="noreferrer">[{s.id}] {s.title}</a>:<span>[{s.id}] {s.title}</span>}{s.locator&&<small>{s.locator}</small>}</li>)}</ul></section>}{theory.notes.length>0&&<details className="theory-notes"><summary>Уточнения к уроку</summary>{theory.notes.map((n,i)=><p key={i}>{n}</p>)}</details>}</div>;
}
