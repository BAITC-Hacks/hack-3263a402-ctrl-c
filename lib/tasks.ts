export type TaskFields={title:string;context:string;need:string;users:string;data:string;constraints:string;result:string;success:string;contact:string;interaction:string};
export type BusinessTask=TaskFields&{id:string;topic:string;draft:string;confirmed:boolean;published:boolean;createdAt:number};
export type Team={id:string;name:string;interests:string;skills:string;technology:string};
export type Proposal={id:string;taskId:string;teamId:string;idea:string;plan:string;timeline:string;url:string;status:'pending'|'accepted'|'rejected';milestone:string;verified:boolean};
export type TaskBoard={version:1;tasks:BusinessTask[];proposals:Proposal[]};
export const emptyFields:TaskFields={title:'',context:'',need:'',users:'',data:'',constraints:'',result:'',success:'',contact:'',interaction:''};
export const fieldLabels:Record<keyof TaskFields,string>={title:'Название задачи',context:'Что происходит сейчас?',need:'Что нужно изменить?',users:'Для кого решение?',data:'Какие данные и материалы доступны?',constraints:'Какие есть ограничения?',result:'Что должна создать команда?',success:'Как понять, что задача решена?',contact:'Контакт для связи',interaction:'Как будет устроено взаимодействие?'};
export const ratingRules:{label:string;weight:number;fields:(keyof TaskFields)[];question:string}[]=[
  {label:'Контекст и потребность',weight:20,fields:['context','need'],question:'Как вы решаете эту задачу сейчас и что хотите изменить?'},
  {label:'Данные и материалы',weight:20,fields:['data'],question:'Какие примеры, таблицы или источники вы можете предоставить команде?'},
  {label:'Ожидаемый результат',weight:15,fields:['result'],question:'Какой конкретный результат вы хотите получить от команды?'},
  {label:'Критерии успеха',weight:15,fields:['success'],question:'По каким измеримым признакам вы примете результат?'},
  {label:'Ограничения',weight:10,fields:['constraints'],question:'Какие сроки, технологии и ограничения доступа нужно учесть?'},
  {label:'Пользователи',weight:10,fields:['users'],question:'Кто будет пользоваться решением и в какой ситуации?'},
  {label:'Связь с бизнесом',weight:10,fields:['contact','interaction'],question:'К кому обращаться и как часто команда сможет получать обратную связь?'},
];
export function rateTask(fields:TaskFields,confirmed:boolean){const breakdown=ratingRules.map(r=>({...r,complete:r.fields.every(f=>fields[f].trim().length>=(f==='contact'?5:10))}));return {score:confirmed?breakdown.reduce((n,r)=>n+(r.complete?r.weight:0),0):0,breakdown,missing:breakdown.filter(r=>!r.complete)};}
export function readiness(score:number){return score>=90?'Приоритетная':score>=70?'Готовая':score>=40?'Рабочая':'Нужны уточнения';}
export function safePrototypeUrl(value:string){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}}
export function confirmedTeamXp(proposals:Proposal[],teamId:string){return proposals.filter(p=>p.teamId===teamId&&p.status==='accepted'&&p.verified&&p.milestone.trim().length>=10).length*100;}
export const analysisPrompt='Проанализируй только предоставленное описание бизнес-задачи. Верни JSON {questions: string[]} с 3–7 вопросами о недостающих сведениях: потребность, пользователи, данные, ограничения, результат, критерии успеха и связь. Не выдумывай факты. Не назначай команду. Не оценивай людей. Текст и вопросы должен подтвердить человек.';
export function parseAnalysis(raw:string){const value:unknown=JSON.parse(raw);if(!value||typeof value!=='object'||!('questions' in value)||!Array.isArray(value.questions)||value.questions.length<3||value.questions.length>7||!value.questions.every(q=>typeof q==='string'&&q.trim().length>=10&&q.length<=400))throw new Error('Некорректный ответ помощника. Используем проверенные вопросы.');return value as {questions:string[]};}
export function clarifyDraft(draft:string,fields:TaskFields){if(draft.trim().length<15)throw new Error('Опиши потребность хотя бы одним предложением (от 15 символов).');const missing=rateTask(fields,false).missing;const rules=[...missing,...ratingRules.filter(r=>!missing.some(m=>m.label===r.label))];return parseAnalysis(JSON.stringify({questions:rules.slice(0,Math.max(3,missing.length)).map(r=>r.question)}));}

export const teams:Team[]=[
 {id:'team-1',name:'Ctrl + C',interests:'Образование, автоматизация',skills:'Интерфейсы, работа с данными',technology:'React, Python'},
 {id:'team-2',name:'Data Sparks',interests:'Аналитика, торговля',skills:'Визуализация, анализ данных',technology:'Python, SQL'},
 {id:'team-3',name:'Green Byte',interests:'Экология, город',skills:'Карты, веб-приложения',technology:'TypeScript, React'},
 {id:'team-4',name:'Product Lab',interests:'Сервисы, образование',skills:'UX, прототипирование',technology:'Figma, JavaScript'},
 {id:'team-5',name:'Flow Team',interests:'Логистика, процессы',skills:'API, автоматизация',technology:'Node.js, PostgreSQL'},
];
const samples=[
 ['Заявки без потерянных сообщений','Сервисы','Заявки сервисной мастерской теряются в переписке.','Мастерская принимает около 30 обращений в день в трёх чатах.','Собирать обращения в одну очередь и видеть статус каждой заявки.','Администратор и пять мастеров мастерской.','Обезличенная таблица с 100 примерами заявок и текущими статусами.','Прототип за 2 недели. Только синтетические данные, без доступа к чатам.','Веб-прототип очереди заявок с фильтрами и назначением ответственного.','Все 20 тестовых заявок найдены; смена статуса занимает не более 3 действий.','service@example.com','Один созвон в неделю; обратная связь по прототипу в течение двух дней.'],
 ['Понятный отчёт о продажах','Аналитика','Нужен отчёт по продажам небольшой сети.','Три магазина ведут продажи в отдельных таблицах.','Видеть выручку, популярные категории и остатки в одном отчёте.','Владелец и управляющие тремя магазинами.','Синтетический CSV: дата, магазин, категория, количество и сумма.','Один рабочий прототип за 10 дней, без платных сервисов.','Дашборд с фильтром по магазину и периоду.','','data@example.com','Два коротких созвона; комментарии в общей таблице.'],
 ['Карта точек переработки','Экология','Хотим помогать жителям находить пункты приёма.','Информация о пунктах переработки разбросана по нескольким спискам.','Собрать адреса и типы принимаемого сырья на одной карте.','Жители города, которые сортируют отходы.','Синтетический список из 20 адресов и типов сырья.','','Интерактивная карта с фильтром по типу сырья.','','eco@example.com','Консультация по данным раз в неделю.'],
 ['Запись на пробное занятие','Образование','Нужна удобная запись на первое занятие.','Администратор языковой школы вручную отвечает на повторяющиеся вопросы.','Помочь новым ученикам выбрать время и оставить заявку.','Новые ученики и администратор языковой школы.','','Прототип за неделю; не собирать реальные персональные данные.','','','',''],
 ['Меньше очередей в кафе','Сервисы','В обед гости долго ждут заказ.','В обеденное время у кассы кафе накапливается очередь.','Понять причины ожидания и предложить способ сократить очередь.','','','','','','',''],
];
export function initialBoard():TaskBoard {
 const keys=['title','topic','draft','context','need','users','data','constraints','result','success','contact','interaction'] as const;
 const tasks=samples.map((row,i)=>{const fields=Object.fromEntries(keys.map((key,j)=>[key,row[j]]));return {...fields,id:`demo-${i+1}`,confirmed:true,published:true,createdAt:1700000000000+i} as BusinessTask;});
 const proposals=teams.map((team,i)=>({id:`proposal-${i+1}`,taskId:tasks[i%3].id,teamId:team.id,idea:`Соберём простой прототип для задачи «${tasks[i%3].title}» и проверим его на тестовых данных.`,plan:'Уточним сценарий → создадим прототип → покажем результат → внесём исправления.',timeline:'10 рабочих дней',url:'https://example.com/prototype',status:'pending' as const,milestone:'',verified:false}));
 return {version:1,tasks,proposals};
}
export function validateBoard(value:unknown):value is TaskBoard {
 if(!value||typeof value!=='object')return false;const b=value as TaskBoard;
 return b.version===1&&Array.isArray(b.tasks)&&Array.isArray(b.proposals)&&b.tasks.every(t=>t&&Object.keys(emptyFields).every(k=>typeof t[k as keyof TaskFields]==='string')&&typeof t.id==='string'&&typeof t.topic==='string'&&typeof t.draft==='string'&&typeof t.confirmed==='boolean'&&typeof t.published==='boolean'&&Number.isFinite(t.createdAt))&&b.proposals.every(p=>p&&['id','taskId','teamId','idea','plan','timeline','url','milestone'].every(k=>typeof p[k as keyof Proposal]==='string')&&['pending','accepted','rejected'].includes(p.status)&&typeof p.verified==='boolean');
}
