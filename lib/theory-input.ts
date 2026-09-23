import type {FullCourse} from "./course";
import {lessonComplete,type Course,type LearningState} from "./types";
import {supportedVisualFormats} from "./theory-format";
export function buildTheoryInput(course:FullCourse,lessonId:string,current:LearningState,publicCourse:Course){
 const level=course.levels.find(l=>l.lessons.some(x=>x.id===lessonId))!;
 const lesson=level.lessons.find(x=>x.id===lessonId)!;
 const all=course.levels.flatMap(l=>l.lessons),index=all.findIndex(x=>x.id===lessonId);
 const known=publicCourse.levels.flatMap(l=>l.lessons).filter(x=>lessonComplete(current,publicCourse,x)).map(x=>({topic:x.title,evidence:"Подтверждено заданиями этого урока"}));
 const diagnostics=current.attempts.filter(a=>a.course_id===course.id&&a.question_key!=="transfer").slice(-12).map(a=>{let s:any={};try{s=JSON.parse(a.snapshot);}catch{}return {lesson_id:a.lesson_id,question:s.prompt,example:s.code,answer:s.answerLabel??a.answer,correct:!!a.correct,remediated:!!a.resolved};});
 return {lesson_topic:lesson.title,learning_goal:course.brief?.goal||level.subtitle,
  learner:{level:"unknown",known_topics:known,gaps:diagnostics.filter(x=>!x.correct&&!x.remediated),diagnostic_results:diagnostics,preferences:{self_reported:course.brief?.clarifications||[]},language:"ru"},
  learning_context:{course_title:course.title,level_title:level.title,level_outcome:level.subtitle,lesson_position:index+1,preceding_in_route:all.slice(0,index).map(x=>x.title),completed_lessons:known,upcoming_topics:all.slice(index+1).map(x=>x.title)},
  scope:lesson.title,target_length_words:500,source_materials:[],available_visual_formats:supportedVisualFormats,
  ...(!course.brief?{context_note:"Цель восстановлена из результата уровня; исходные ответы ученика неизвестны."}:{}),
  ...(lesson.ready!==false?{existing_assessment_context:{
   questions:lesson.questions.map(x=>({prompt:x.prompt,options:x.options})),
   independent_question:{prompt:lesson.outputQuestion.prompt,conditions:lesson.outputQuestion.code},
   transfer_question:{prompt:lesson.transferQuestion.prompt,conditions:lesson.transferQuestion.code},
   flashcard_concept:lesson.flashcard.front,original_demonstration:lesson.code
  }}:{})};
}
