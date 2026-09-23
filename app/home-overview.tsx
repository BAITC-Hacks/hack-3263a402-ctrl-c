"use client";
import {ArrowRight, BookOpen, CheckCircle2, Code2, Flag, Layers, Plus, Sparkles, Target, Trophy, Zap} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {courseStats,lessonComplete,levelOpen,type Course,type LearningState,type Lesson} from '@/lib/types';
import {PlayerBar,GamePanel} from './game-panel';

type Props={state:LearningState;course:Course;onContinue:()=>void;onMap:()=>void;onCreate:()=>void;onErrors:()=>void;onProjects:()=>void;onProgress:()=>void;onLesson:(lesson:Lesson)=>void};
export function HomeOverview({state,course,onContinue,onMap,onCreate,onErrors,onProjects,onProgress,onLesson}:Props){
  const stats=courseStats(state,course);
  const next=course.levels.flatMap((l,i)=>levelOpen(state,course,i)?l.lessons:[]).find(l=>!lessonComplete(state,course,l));
  const current=next||course.levels[0].lessons[0];
  const levelIndex=course.levels.findIndex(l=>l.lessons.some(x=>x.id===current.id));
  const reviewCount=new Set(state.attempts.filter(a=>!a.correct&&!a.resolved&&a.question_key!=='transfer').map(a=>JSON.stringify([a.course_id,a.lesson_id,a.question_key]))).size;
  return <>
    <div className="page-heading home-heading"><div><div className="eyebrow"><span className="welcome-dot"/> ТВОЁ ПРОСТРАНСТВО РОСТА</div><h1>Прокачай свою реальность<span>.</span></h1><p>Один понятный шаг сегодня — новый навык завтра.</p></div><button className="button outline" onClick={onCreate}><Plus size={18}/>Новый блиц</button></div>
    <div className="overview-grid"><div className="overview-main">
      <article className="campaign-card">
        <div className="campaign-top"><div className="course-symbol"><Code2 size={28}/></div><div><span className="card-kicker">ТВОЙ УЧЕБНЫЙ БЛИЦ</span><span className="course-category">{course.source} · {stats.total} уроков</span></div><span className="availability"><span/>{stats.completed===stats.total?'Пройден':stats.completed?'В процессе':'Можно начать'}</span></div>
        <h2>{course.title}</h2><p className="campaign-description">{course.levels[levelIndex].subtitle}</p>
        <div className="course-meta"><span><Layers size={16}/>{course.levels.length} уровня</span><span><BookOpen size={16}/>Теория и практика</span><span><Flag size={16}/>{course.levels.length} проекта</span></div>
        <div className="next-lesson"><span className="lesson-step">{String(levelIndex+1).padStart(2,'0')}</span><div><span className="card-kicker">{next?'ТВОЙ СЛЕДУЮЩИЙ УРОК':'ВСЕ УРОКИ ПРОЙДЕНЫ'}</span><h3>{next?current.title:'Отличная работа! Закрепим результат?'}</h3><span className="next-lesson-detail">{next?'Изучи идею → реши задания → получи опыт':'Повтори материалы или создай новый блиц'}</span></div><span className="xp-tag"><Zap size={14}/>{next?'+25 XP / задание':'Навык освоен'}</span></div>
        <div className="campaign-actions"><button className="button primary" onClick={onContinue}>{!next?'Повторить материалы':stats.completed?'Продолжить миссию':'Начать миссию'}<ArrowRight size={18}/></button><button className="text-button" onClick={onMap}>Программа курса <ArrowRight size={16}/></button></div>
        <div className="campaign-progress"><div><span><CheckCircle2 size={16}/>Навыки подтверждены</span><b>{stats.completed} из {stats.total}</b></div><Progress value={stats.percent} aria-label="Подтверждённые навыки курса"/></div>
      </article>
      <section className="study-tools"><div className="section-heading"><h2>Учиться в своём ритме</h2><span>Каждый шаг имеет значение</span></div><div className="tool-grid">
        <button className="study-tool" onClick={()=>onLesson(current)}><span className="tool-icon blue"><BookOpen size={22}/></span><strong>Разобраться в теме</strong><p>Теория, примеры и карточки в одном уроке.</p><span className="tool-link">Открыть урок <ArrowRight size={16}/></span></button>
        <button className="study-tool" onClick={onErrors}><span className="tool-icon green"><Target size={22}/></span><strong>Закрепить знания</strong><p>{reviewCount?`Заданий для повторения: ${reviewCount}. Разберись и попробуй снова.`:'Здесь появятся задания, которые стоит повторить.'}</p><span className="tool-link">К практике <ArrowRight size={16}/></span></button>
        <button className="study-tool" onClick={onProjects}><span className="tool-icon amber"><Flag size={22}/></span><strong>Сделать проект</strong><p>Преврати изученное в свою первую работу.</p><span className="tool-link">Посмотреть проекты <ArrowRight size={16}/></span></button>
      </div></section>
      <div className="learning-note"><span className="note-icon"><Sparkles size={21}/></span><div><strong>Не нужно знать всё сразу</strong><p>Начни с одного урока. Ошибки — часть обучения, а не повод останавливаться.</p></div></div>
    </div><aside className="overview-aside"><div className="section-heading"><h2>Твой прогресс</h2><button className="icon-button" aria-label="Открыть статистику" onClick={onProgress}><ArrowRight size={18}/></button></div><PlayerBar state={state}/><GamePanel state={state} onPlay={onContinue} showQuest={false}/><div className="progress-tip"><Trophy size={19}/><p>Трофеи открываются за реальные результаты. Начни с первого задания.</p></div></aside></div>
  </>;
}
