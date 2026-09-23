"use client";
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Globe,Layers,Sparkles,Zap} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import type {LearningState} from '@/lib/types';
const steps=[
 {icon:Zap,title:'Одна цель — твой блиц',body:'Выбери любую тему и расскажи, чему хочешь научиться. Три уточняющих вопроса помогут составить карту тем под твой опыт и время.',labels:['Тема','Твоя цель','Карта тем']},
 {icon:Layers,title:'Выбирай, с чего начать',body:'Все этапы доступны сразу. Начни с основ или открой нужную тему — порядок в карте помогает ориентироваться, но не ограничивает тебя.',labels:['Основы','Нужная тема','Практика']},
 {icon:BookOpen,title:'Пойми, попробуй, вспомни',body:'В уроке есть теория, тест, карточки и самостоятельный ответ. Кнопка «Подробнее» раскрывает фрагмент, а наставник помогает разобраться в конкретной ошибке.',labels:['Теория','Практика','Повторение']},
 {icon:Sparkles,title:'Замечай свой рост',body:'За учебные действия начисляется опыт. Уровень и путь к следующему видны рядом с профилем. Повтор одного задания не позволяет бесконечно набирать опыт.',labels:['Опыт','30 уровней','Твой прогресс']},
 {icon:Globe,title:'Учись вместе с другими',body:'В публичных блицах можно найти маршруты других людей, поставить лайк и сохранить блиц себе. Своим маршрутом тоже можно поделиться — личные ответы и прогресс остаются у тебя.',labels:['Открывай','Сохраняй','Делись']}
];
export function Onboarding({state,ready,replay,onState,request}:{state:LearningState;ready:boolean;replay:number;onState:(s:LearningState)=>void;request:(data:Record<string,unknown>)=>Promise<any>}){
 const [open,setOpen]=useState(false),[step,setStep]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState('');const seen=useRef(false),replayed=useRef(replay);
 useEffect(()=>{if(!ready||seen.current)return;seen.current=true;let local=false;try{local=localStorage.getItem('blitz-welcome-v1')==='done';}catch{}if(state.signedIn?!state.onboardingDone:!local)setOpen(true);},[ready,state.signedIn,state.onboardingDone]);
 useEffect(()=>{if(replayed.current!==replay){replayed.current=replay;setStep(0);setError('');setOpen(true);}},[replay]);
 async function finish(){if(busy)return;setBusy(true);setError('');try{if(state.signedIn){const r=await request({action:'onboarding'});onState(r.state);}try{localStorage.setItem('blitz-welcome-v1','done');}catch{}setOpen(false);}catch(e){setError(e instanceof Error?e.message:'Не удалось сохранить. Попробуй снова.');}finally{setBusy(false);}}
 const item=steps[step],Icon=item.icon;
 return <Dialog open={open} onOpenChange={v=>{if(!v)void finish();}}><DialogContent className="welcome-dialog" showCloseButton={!busy}><div className="welcome-art" aria-hidden="true"><span className="welcome-icon"><Icon size={42}/></span><div className="welcome-path">{item.labels.map((s,i)=><span key={s}><b>{i+1}</b>{s}</span>)}</div></div><DialogHeader><span className="card-kicker">ЗНАКОМСТВО · {step+1} / {steps.length}</span><DialogTitle>{item.title}</DialogTitle><DialogDescription>{item.body}</DialogDescription></DialogHeader><div className="welcome-dots" aria-label={`Шаг ${step+1} из ${steps.length}`}>{steps.map((s,i)=><span key={s.title} className={i===step?'active':''}/>)}</div>{error&&<p role="alert" className="form-error">{error}</p>}<div className="welcome-actions"><button className="text-button" disabled={busy} onClick={()=>void finish()}>Пропустить</button><div>{step>0&&<button className="button outline" disabled={busy} aria-label="Предыдущий шаг" onClick={()=>setStep(n=>n-1)}><ArrowLeft size={17}/></button>}<button className="button primary" disabled={busy} onClick={()=>step===steps.length-1?void finish():setStep(n=>n+1)}>{busy?'Сохраняем…':step===steps.length-1?'Начать обучение':'Дальше'}<ArrowRight size={17}/></button></div></div></DialogContent></Dialog>;
}
