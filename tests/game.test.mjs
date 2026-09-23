import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gameStats} from '../lib/game.ts';

const empty={courses:[],attempts:[],projects:[],signedIn:true,aiReady:false};
const answer={course_id:'python',lesson_id:'one',question_key:'q0',correct:1,resolved:0};
test('new players start at level one with no earned trophies',()=>{
  const g=gameStats(empty);assert.equal(g.xp,0);assert.equal(g.level,1);assert.ok(g.badges.every(b=>!b.earned));
});
test('duplicate answers and project submissions do not farm XP',()=>{
  const project={course_id:'python',level_id:'one',status:'accepted'};
  const g=gameStats({...empty,attempts:[answer,answer,{...answer,correct:0},{...answer,question_key:'transfer'}],projects:[project,project,{...project,level_id:'two',status:'rejected'}]});
  assert.equal(g.xp,175);assert.equal(g.solved,1);assert.equal(g.projects,1);
});
test('rank boundary, cross-course questions and recovery badge',()=>{
  const attempts=Array.from({length:10},(_,i)=>({...answer,course_id:String(i),resolved:i===0?1:0}));
  const g=gameStats({...empty,attempts});assert.equal(g.xp,250);assert.equal(g.level,2);assert.equal(g.inLevel,0);assert.equal(g.badges.filter(b=>b.earned).length,3);
});
