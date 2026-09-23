"use client";
import {useState} from 'react';
import {Languages,Code2,Palette,Landmark,Microscope,MessagesSquare} from 'lucide-react';
const groups=[
 {name:'Языки',icon:Languages,topics:[['Английский для общения','Поддерживать короткий разговор в поездке'],['Казахский с нуля','Понимать и использовать повседневные фразы'],['Испанский','Представляться и задавать простые вопросы']]},
 {name:'Технологии',icon:Code2,topics:[['Программирование на Go','Написать первую полезную программу'],['Python','Обрабатывать простые таблицы'],['Основы ИИ','Понимать, как работают языковые модели']]},
 {name:'Творчество',icon:Palette,topics:[['Основы фотографии','Делать выразительные фотографии на телефон'],['Рисование','Передавать объём простыми формами'],['Музыка','Разбираться в ритме и мелодии']]},
 {name:'История',icon:Landmark,topics:[['История Казахстана','Понимать связи ключевых событий'],['Мировая история','Ориентироваться в основных эпохах'],['История искусства','Различать художественные направления']]},
 {name:'Наука',icon:Microscope,topics:[['Математика с основ','Уверенно решать повседневные задачи'],['Биология','Понимать устройство живой клетки'],['Астрономия','Ориентироваться в устройстве Солнечной системы']]},
 {name:'Жизненные навыки',icon:MessagesSquare,topics:[['Публичные выступления','Ясно объяснять свои идеи слушателям'],['Критическое мышление','Проверять аргументы и замечать ошибки рассуждения'],['Самоорганизация','Планировать день с учётом своих возможностей']]}
];
export function TopicSuggestions({onPick}:{onPick:(topic:string,goal:string)=>void}){const [selected,setSelected]=useState<number|null>(null);return <div className="topic-suggestions"><p>Или найди идею</p><div className="topic-categories">{groups.map((g,i)=><button type="button" key={g.name} aria-pressed={selected===i} onClick={()=>setSelected(selected===i?null:i)}><g.icon size={18}/><span>{g.name}</span></button>)}</div>{selected!==null&&<div className="topic-examples">{groups[selected].topics.map(([topic,goal])=><button type="button" key={topic} onClick={()=>onPick(topic,goal)}><strong>{topic}</strong><span>{goal}</span></button>)}</div>}</div>;}
