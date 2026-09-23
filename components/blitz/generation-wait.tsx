"use client";

import { useEffect, useState } from "react";
import { BookOpen, Layers, Sparkles, Target, Zap } from "lucide-react";

const copy = {
 cards: {title:"Собираем карточки для памяти",detail:"Выделяем главное в уроке и готовим вопросы на понимание и применение.",tags:["Главные идеи","Вспомнить","Применить"]},
  clarify: { title: "Знакомимся с твоей целью", detail: "Готовим вопросы и варианты ответов, которые помогут выбрать подходящий путь.", tags: ["Твой опыт", "Твоя цель", "Твой темп"] },
  generate: { title: "Твой блиц обретает форму", detail: "Связываем темы в последовательные уровни: от основ к твоему результату.", tags: ["Основа", "Новые навыки", "Твой результат"] },
  lesson: { title: "Собираем понятный урок", detail: "Готовим объяснение, наглядные схемы и практику по твоей теме.", tags: ["Понятия", "Примеры", "Практика"] },
};

export function GenerationWait({ mode, topic }: { mode: keyof typeof copy; topic?: string }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    setSeconds(0);
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [mode, topic]);
  const content = copy[mode];
  return <div className="generation-wait" aria-busy="true">
    <div className="generation-stage" aria-hidden="true">
      <div className="generation-halo" /><div className="generation-orbit"><span /><span /><span /></div>
      <div className="generation-bolt"><Zap size={47} fill="currentColor" /></div>
      <span className="generation-tile tile-book"><BookOpen size={23} /><i /><i /></span>
      <span className="generation-tile tile-layers"><Layers size={23} /><i /><i /></span>
      <span className="generation-star"><Sparkles size={27} /></span>
    </div>
    <div role="status" aria-live="polite"><h3>{content.title}</h3><p>{content.detail}</p></div>
    {topic && <div className="generation-topic"><Target size={15} /><span>{topic}</span></div>}
    <div className="generation-track" aria-hidden="true"><span /></div>
    <div className="generation-tags" aria-hidden="true">{content.tags.map((tag, i) => <span key={tag}><b>{String(i + 1).padStart(2, "0")}</b>{tag}</span>)}</div>
    <p className="generation-time" aria-live="off">Прошло {seconds} сек. · {seconds < 60 ? "Собираем материал под тебя" : "Нужно чуть больше времени — дождись результата"}</p>
  </div>;
}
