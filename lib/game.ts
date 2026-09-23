import type {LearningState} from './types';

/** Rewards are derived from persisted results; retries never multiply XP. */
export function gameStats(state: LearningState) {
  const solved = new Set(state.attempts.filter(a => a.correct === 1 && a.question_key !== 'transfer').map(a => JSON.stringify([a.course_id, a.lesson_id, a.question_key])));
  const projects = new Set(state.projects.filter(p => p.status === 'accepted').map(p => JSON.stringify([p.course_id, p.level_id])));
  const recovered = new Set(state.attempts.filter(a => a.resolved === 1).map(a => JSON.stringify([a.course_id, a.lesson_id, a.question_key])));
  const xp = solved.size * 25 + projects.size * 150;
  const level = Math.floor(xp / 250) + 1;
  const badges = [
    {name: 'Первый импульс', hint: 'Реши первое задание', earned: solved.size > 0},
    {name: 'В потоке', hint: 'Реши 10 разных заданий', earned: solved.size >= 10},
    {name: 'Перезагрузка', hint: 'Исправь ошибку повторной проверкой', earned: recovered.size > 0},
    {name: 'Создатель', hint: 'Получи зачёт за мини-проект', earned: projects.size > 0},
  ];
  return {xp, level, inLevel: xp % 250, solved: solved.size, projects: projects.size, badges,
    rank: level < 3 ? 'Искатель' : level < 6 ? 'Исследователь' : level < 10 ? 'Практик' : 'Мастер'};
}
