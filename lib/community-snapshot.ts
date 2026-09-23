import {lessonSchema,pendingLesson,type FullCourse} from './course';
// Only teaching content may cross the publication boundary. Never spread a private course.
export function publicationSnapshot(course:FullCourse,title:string):FullCourse{return {
 id:course.id,title,subject:course.subject||'Разные темы',source:'Публичный блиц',
 ...(course.origin?{origin:{publicationId:course.origin.publicationId,authorId:course.origin.authorId,authorName:course.origin.authorName}}:{}),
 levels:course.levels.map(level=>({id:level.id,title:level.title,subtitle:level.subtitle,
 project:level.project?{title:level.project.title,task:level.project.task,criteria:[...level.project.criteria],size:level.project.size,complexity:level.project.complexity}:null,
 lessons:level.lessons.map(l=>l.ready===false?pendingLesson(l.id,l.title):lessonSchema.parse(l))}))
};}
export function enrollmentCourse(snapshot:FullCourse,id:string,origin:{publicationId:string;authorId:string;authorName:string}):FullCourse{return {...publicationSnapshot(snapshot,snapshot.title),id,origin,source:`Из публичных блицев · ${origin.authorName}`,brief:{topic:snapshot.subject||snapshot.title,goal:snapshot.title,clarifications:[]}};}
