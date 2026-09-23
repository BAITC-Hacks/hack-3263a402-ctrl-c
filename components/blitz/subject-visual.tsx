"use client";
import {useState} from "react";
import type {LessonVisual} from "@/lib/teaching";
export function SubjectVisual({visual:v}:{visual:LessonVisual}){
 const [selected,setSelected]=useState(0);
 if(v.kind==="data_table")return <div className="visual-table-scroll"><table><thead><tr>{v.columns.map((c,i)=><th key={i} scope="col">{c}</th>)}</tr></thead><tbody>{v.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>j===0?<th key={j} scope="row">{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
 if(v.kind==="number_line"){
 const x=(n:number)=>60+(n-v.min)/(v.max-v.min)*520;
 const ticks=Array.from({length:Math.min(21,Math.floor((v.max-v.min)/v.step)+1)},(_,i)=>v.min+i*v.step);
 return <div className="subject-chart"><svg viewBox="0 0 640 180" role="img" aria-label={`${v.title}. ${v.points.map(p=>`${p.label}: ${p.value}`).join('; ')}`}><line x1="45" x2="598" y1="100" y2="100" stroke="currentColor" strokeWidth="2"/>{ticks.map((t,i)=><g key={i}><line x1={x(t)} x2={x(t)} y1="95" y2="105" stroke="currentColor"/><text x={x(t)} y="130" textAnchor="middle">{Number(t.toFixed(6))}</text></g>)}{v.points.map((p,i)=><g key={i}><line x1={x(p.value)} x2={x(p.value)} y1={i%2?65:35} y2="95" stroke="#6246eb" strokeDasharray="4 4"/><circle cx={x(p.value)} cy="100" r="6" fill="#6246eb"/><text x={x(p.value)} y={i%2?55:25} textAnchor="middle" fill="#6246eb">{p.label}</text></g>)}</svg></div>;
 }
 if(v.kind!=="bar_chart"&&v.kind!=="line_chart")return null;
 const index=Math.min(selected,v.data.length-1),active=v.data[index];
 const x=(i:number)=>v.kind==="bar_chart"?70+(i+.5)*510/v.data.length:70+i*510/Math.max(1,v.data.length-1);
 const y=(value:number)=>265-value/v.yMax*210;
 const ticks=Array.from({length:Math.min(13,Math.round(v.yMax/v.step)+1)},(_,i)=>i*v.step);
 return <div className="subject-chart"><div className="chart-unit">{v.unit}</div><svg viewBox="0 0 640 330" role="img" aria-label={`${v.title}. ${v.data.map(p=>`${p.label}: ${p.value}`).join('; ')}. Шкала от 0 до ${v.yMax}, шаг ${v.step}.`}>{ticks.map((t,i)=><g key={i}><line x1="70" x2="596" y1={y(t)} y2={y(t)} stroke="#e5e2ef"/><text x="55" y={y(t)+5} textAnchor="end">{Number(t.toFixed(6))}</text></g>)}<line x1="70" x2="596" y1="265" y2="265" stroke="#777086"/>{v.kind==="line_chart"&&<polyline points={v.data.map((d,i)=>`${x(i)},${y(d.value)}`).join(' ')} fill="none" stroke="#6246eb" strokeWidth="3"/>}{v.data.map((d,i)=><g key={i}>{v.kind==="bar_chart"?<rect x={x(i)-Math.min(35,170/v.data.length)} y={y(d.value)} width={Math.min(70,340/v.data.length)} height={265-y(d.value)} rx="4" fill={i===index?'#6246eb':'#cec5fa'}/>:<circle cx={x(i)} cy={y(d.value)} r={i===index?7:5} fill={i===index?'#6246eb':'#a18bef'}/>}<text x={x(i)} y={y(d.value)-12} textAnchor="middle" fill="#40316c" fontWeight="700">{d.value}</text><text x={x(i)} y="291" textAnchor="middle" fontSize="12">{d.label.length>13?d.label.slice(0,12)+'…':d.label}</text></g>)}<line x1="70" x2={x(index)} y1={y(active.value)} y2={y(active.value)} stroke="#6246eb" strokeWidth="2" strokeDasharray="5 4"/></svg><div className="chart-controls" aria-label="Выбрать значение на графике">{v.data.map((d,i)=><button key={i} onClick={()=>setSelected(i)} aria-pressed={index===i}>{d.label}</button>)}</div><p className="chart-reading" aria-live="polite"><strong>{active.label}: {active.value}</strong><span>{v.unit} · пунктир связывает значение со шкалой</span></p></div>;
}
