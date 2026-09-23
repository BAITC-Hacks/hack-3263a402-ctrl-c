import {z} from 'zod';
import {db,getCourse,state,AppError} from '@/lib/server';
import {identity} from '@/lib/identity';
import {publicCourse,type FullCourse} from '@/lib/course';
import {publicationSnapshot,enrollmentCourse} from '@/lib/community-snapshot';
import {requireBrowserMutation} from '@/lib/request-security';
export const dynamic='force-dynamic';
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const fail=(e:unknown)=>{if(e instanceof AppError)return response({error:e.message},e.status);if(e instanceof z.ZodError)return response({error:'Проверь заполненные поля.'},400);console.error('Community operation failed',e instanceof Error?e.message:'unknown');return response({error:'Не удалось обновить публичные блицы. Попробуй ещё раз.'},503);};
const profileDTO=(p:any)=>({id:p.id,name:p.name,bio:p.bio,createdAt:p.created_at});
const projection=`p.id,p.title,p.description,p.subject,p.lesson_count,p.stage_count,p.ready_count,p.created_at,p.updated_at,p.published,p.profile_id,f.name,f.bio,f.created_at AS profile_created,
 (SELECT count(*) FROM publication_likes WHERE publication_id=p.id) AS likes,
 EXISTS(SELECT 1 FROM publication_likes WHERE publication_id=p.id AND owner=?) AS liked,p.owner=? AS own,
 (SELECT course_id FROM enrollments WHERE owner=? AND publication_id=p.id) AS enrolled`;
function dto(p:any){return {id:p.id,title:p.title,description:p.description,subject:p.subject,lessonCount:p.lesson_count,stageCount:p.stage_count,readyCount:p.ready_count,createdAt:p.created_at,updatedAt:p.updated_at,published:!!p.published,likes:p.likes,liked:!!p.liked,own:!!p.own,enrolledCourseId:p.enrolled||null,author:{id:p.profile_id,name:p.name,bio:p.bio,createdAt:p.profile_created}};}
async function one(id:string,user:string){return db().prepare(`SELECT ${projection},p.snapshot FROM publications p JOIN public_profiles f ON f.id=p.profile_id WHERE p.id=? AND (p.published=1 OR p.owner=?)`).bind(user,user,user,id,user).first<any>();}
export async function GET(req:Request){try{
 const current=await identity(),user=current?.ownerId||'',url=new URL(req.url),id=url.searchParams.get('id'),profile=url.searchParams.get('profile'),mine=url.searchParams.get('mine');
 if(mine){if(!current)throw new AppError('Войди в аккаунт.',401);const ownProfile=await db().prepare('SELECT id,name,bio,created_at FROM public_profiles WHERE owner=?').bind(user).first();const items=await db().prepare(`SELECT ${projection},p.course_id FROM publications p JOIN public_profiles f ON f.id=p.profile_id WHERE p.owner=? ORDER BY p.created_at DESC`).bind(user,user,user,user).all<any>();return response({profile:ownProfile?profileDTO(ownProfile):null,items:items.results.map(p=>({...dto(p),courseId:p.course_id}))});}
 if(id){const p=await one(z.string().uuid().parse(id),user);if(!p)throw new AppError('Этот блиц не опубликован или снят с публикации.',404);return response({item:{...dto(p),course:publicCourse(JSON.parse(p.snapshot))}});}
 const offset=z.coerce.number().int().min(0).max(10000).parse(url.searchParams.get('offset')||0);let author:any=null;
 if(profile){z.string().uuid().parse(profile);author=await db().prepare('SELECT id,name,bio,created_at FROM public_profiles WHERE id=?').bind(profile).first();if(!author)throw new AppError('Профиль не найден.',404);}
 const condition=profile?'p.published=1 AND p.profile_id=?':'p.published=1';const args=profile?[user,user,user,profile,offset]:[user,user,user,offset];
 const rows=await db().prepare(`SELECT ${projection} FROM publications p JOIN public_profiles f ON f.id=p.profile_id WHERE ${condition} ORDER BY p.created_at DESC,p.id LIMIT 25 OFFSET ?`).bind(...args).all<any>();
 const stats=profile?await db().prepare('SELECT count(*) AS total,coalesce(sum((SELECT count(*) FROM publication_likes l WHERE l.publication_id=p.id)),0) AS likes FROM publications p WHERE p.profile_id=? AND p.published=1').bind(profile).first():null;
 return response({items:rows.results.slice(0,24).map(dto),hasMore:rows.results.length>24,...(author?{profile:profileDTO(author),...stats}:{})});
 }catch(e){return fail(e);}}
const bodySchema=z.object({action:z.enum(['publish','unpublish','like','enroll','profile']),courseId:z.string().min(1).max(80).optional(),id:z.string().uuid().optional(),liked:z.boolean().optional(),title:z.string().trim().min(2).max(140).optional(),description:z.string().trim().max(600).optional(),name:z.string().trim().min(2).max(60).optional(),bio:z.string().trim().max(320).optional()});
export async function POST(req:Request){try{
 requireBrowserMutation(req);const text=await req.text();if(text.length>5000)throw new AppError('Слишком длинное описание.',413);let raw;try{raw=JSON.parse(text);}catch{throw new AppError('Некорректный запрос.',400);}const b=bodySchema.parse(raw),current=await identity();if(!current)throw new AppError('Войди в аккаунт, чтобы продолжить.',401);const user=current.ownerId,d=db(),now=Date.now();
 if(b.action==='profile'||b.action==='publish'){
  const name=z.string().trim().min(2).max(60).parse(b.name),previousProfile=await d.prepare('SELECT bio FROM public_profiles WHERE owner=?').bind(user).first<{bio:string}>(),bio=b.bio??previousProfile?.bio??'';
  if(b.action==='profile'){await d.prepare('INSERT INTO public_profiles(id,owner,name,bio,created_at) VALUES(?,?,?,?,?) ON CONFLICT(owner) DO UPDATE SET name=excluded.name,bio=excluded.bio').bind(crypto.randomUUID(),user,name,bio,now).run();const p=await d.prepare('SELECT id,name,bio,created_at FROM public_profiles WHERE owner=?').bind(user).first();return response({profile:profileDTO(p)});}
  const row=await d.prepare('SELECT data FROM courses WHERE id=? AND owner=?').bind(b.courseId||'',user).first<{data:string}>();
  let course:FullCourse;if(row)course=JSON.parse(row.data);else if(b.courseId==='python'&&await d.prepare("SELECT 1 FROM attempts WHERE owner=? AND course_id='python' LIMIT 1").bind(user).first())course=await getCourse('python',user);else throw new AppError('Можно опубликовать только свой блиц.',404);
  const title=b.title||course.title,snapshot=publicationSnapshot(course,title),json=JSON.stringify(snapshot);if(json.length>3500000)throw new AppError('Блиц слишком большой для публикации.',413);
  const id=crypto.randomUUID(),profileId=crypto.randomUUID(),lessons=snapshot.levels.flatMap(l=>l.lessons);
  await d.batch([
   d.prepare('INSERT INTO public_profiles(id,owner,name,bio,created_at) VALUES(?,?,?,?,?) ON CONFLICT(owner) DO UPDATE SET name=excluded.name,bio=excluded.bio').bind(profileId,user,name,bio,now),
   d.prepare('INSERT INTO publications(id,owner,course_id,profile_id,title,description,subject,snapshot,lesson_count,stage_count,ready_count,published,created_at,updated_at) VALUES(?,?,?,(SELECT id FROM public_profiles WHERE owner=?),?,?,?,?,?,?,?,1,?,?) ON CONFLICT(owner,course_id) DO UPDATE SET title=excluded.title,description=excluded.description,subject=excluded.subject,snapshot=excluded.snapshot,lesson_count=excluded.lesson_count,stage_count=excluded.stage_count,ready_count=excluded.ready_count,published=1,updated_at=excluded.updated_at').bind(id,user,course.id,user,title,b.description||'',snapshot.subject||'Разные темы',json,lessons.length,snapshot.levels.length,lessons.filter(l=>l.ready!==false).length,now,now)
  ]);const publication=await d.prepare('SELECT id FROM publications WHERE owner=? AND course_id=?').bind(user,course.id).first<{id:string}>();return response({item:dto(await one(publication!.id,user))});
 }
 const id=z.string().uuid().parse(b.id);
 if(b.action==='unpublish'){const r=await d.prepare('UPDATE publications SET published=0,updated_at=? WHERE id=? AND owner=?').bind(now,id,user).run();if(!r.meta.changes)throw new AppError('Публикация не найдена.',404);return response({ok:true});}
 const p=await d.prepare('SELECT id,owner,course_id,profile_id,snapshot FROM publications WHERE id=? AND published=1').bind(id).first<any>();if(!p)throw new AppError('Блиц снят с публикации.',404);
 if(b.action==='like'){if(p.owner===user)throw new AppError('Лайки оставляют другие пользователи.',400);const liked=z.boolean().parse(b.liked);if(liked)await d.prepare('INSERT OR IGNORE INTO publication_likes(id,publication_id,owner,created_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM publications WHERE id=? AND published=1)').bind(crypto.randomUUID(),id,user,now,id).run();else await d.prepare('DELETE FROM publication_likes WHERE publication_id=? AND owner=?').bind(id,user).run();const item=await one(id,user);if(!item)throw new AppError('Блиц снят с публикации.',404);return response({item:dto(item)});}
 if(b.action==='enroll'){
  if(p.owner===user)return response({courseId:p.course_id,state:await state(user)});
  const existing=await d.prepare('SELECT course_id FROM enrollments WHERE owner=? AND publication_id=?').bind(user,id).first<{course_id:string}>();if(existing)return response({courseId:existing.course_id,state:await state(user)});
  const count=await d.prepare('SELECT count(*) AS n FROM courses WHERE owner=?').bind(user).first<{n:number}>();if((count?.n||0)>=20)throw new AppError('Можно сохранить до 20 блицев.',400);
  const author=await d.prepare('SELECT name FROM public_profiles WHERE id=?').bind(p.profile_id).first<{name:string}>(),courseId=crypto.randomUUID();
  const copy=enrollmentCourse(JSON.parse(p.snapshot),courseId,{publicationId:id,authorId:p.profile_id,authorName:author!.name});
  await d.batch([
   d.prepare('INSERT OR IGNORE INTO enrollments(id,owner,publication_id,course_id,created_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM publications WHERE id=? AND published=1) AND (SELECT count(*) FROM courses WHERE owner=?)<20').bind(crypto.randomUUID(),user,id,courseId,now,id,user),
   d.prepare('INSERT INTO courses(id,owner,data,created_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM enrollments WHERE owner=? AND publication_id=? AND course_id=?)').bind(courseId,user,JSON.stringify(copy),now,user,id,courseId)
  ]);const enrolled=await d.prepare('SELECT course_id FROM enrollments WHERE owner=? AND publication_id=?').bind(user,id).first<{course_id:string}>();if(!enrolled)throw new AppError('Не удалось сохранить: блиц снят с публикации или достигнут лимит 20 блицев.',409);return response({courseId:enrolled.course_id,state:await state(user)});
 }
 throw new AppError('Неизвестное действие.',400);
 }catch(e){return fail(e);}}
