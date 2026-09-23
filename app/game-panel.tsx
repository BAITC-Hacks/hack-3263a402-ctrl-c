"use client";
import {Award, Check, Crosshair, Lock, Trophy, Zap} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {gameStats} from '@/lib/game';
import type {LearningState} from '@/lib/types';

export function PlayerBar({state}:{state:LearningState}) {
  const game = gameStats(state);
  return <section className="player-bar" aria-label="Уровень игрока">
    <div className="rank-emblem"><Zap size={26}/></div>
    <div className="player-rank"><span>ТВОЙ РАНГ</span><strong>{game.rank}</strong></div>
    <div className="player-xp"><div><b>Уровень {game.level}</b><span>{game.inLevel} / 250 XP</span></div><Progress value={game.inLevel / 2.5} aria-label="Опыт до следующего уровня"/></div>
    <div className="xp-total"><Zap size={18}/><b>{game.xp}</b><span>XP</span></div>
    <div className="badge-total"><Trophy size={18}/>{game.badges.filter(b=>b.earned).length} / 4</div>
  </section>;
}

export function GamePanel({state,onPlay,showQuest=true}:{state:LearningState;onPlay:()=>void;showQuest?:boolean}) {
  const game = gameStats(state);
  return <>
    {showQuest&&<article className="quest-card"><div className="section-heading"><h2>Твой следующий ход</h2><Crosshair size={19}/></div><span className="quest-reward">+25 XP за новое решение</span><h3>{game.solved ? 'Продолжи серию открытий' : 'Зажги первую искру'}</h3><p>Изучи урок и правильно реши задание. Каждое новое решение приближает следующий ранг.</p><button className="button primary full-width" onClick={onPlay}>К миссии <Zap size={17}/></button></article>}
    <article className="achievements"><div className="section-heading"><h2>Твои трофеи</h2><Award size={19}/></div><div className="badge-grid">{game.badges.map((b,i)=><div className={'achievement '+(b.earned?'earned':'')} key={b.name}><span className="achievement-icon">{b.earned?<Trophy size={24}/>:<Lock size={22}/>}</span><strong>{b.name}</strong><small>{b.hint}</small><span className="achievement-state">{b.earned?<><Check size={12}/> Получен</>:`0${i+1} / Закрыт`}</span></div>)}</div><p className="reward-rules">25 XP · новое решение<br/>150 XP · принятый проект<br/>Повторные решения не добавляют XP.</p></article>
  </>;
}
