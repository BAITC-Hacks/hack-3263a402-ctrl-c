import {readFileSync,writeFileSync,existsSync,copyFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {projectRoot} from './sites-env.mjs';
const major=Number(process.versions.node.split('.')[0]);
if(major<22)throw Error('Нужен Node.js 22.13 или новее.');
if(!existsSync(path.join(projectRoot,'node_modules/wrangler/bin/wrangler.js')))throw Error('Сначала выполните npm run install:ci');
if(!existsSync('.env.local'))copyFileSync('.env.example','.env.local');
// Local-only bootstrap. The current migrations contain additive CREATE statements.
// Re-running is safe for existing databases; production uses the original migrations.
const files=readdirSync('drizzle').filter(f=>/^\d+.*\.sql$/.test(f)).sort();
const sql=files.map(f=>readFileSync(path.join('drizzle',f),'utf8')).join('\n');
if(/^(?:ALTER|DROP|DELETE|UPDATE|INSERT)\s/im.test(sql))throw Error('Обнаружена миграция данных: примените её отдельно, без повторного bootstrap.');
const target=path.join(projectRoot,'.sites-runtime/local-schema.sql');
writeFileSync(target,sql.replace(/CREATE TABLE\s/gi,'CREATE TABLE IF NOT EXISTS ').replace(/CREATE (UNIQUE )?INDEX\s/gi,(_,u)=>`CREATE ${u||''}INDEX IF NOT EXISTS `));
const config=path.join(projectRoot,'.sites-runtime/local-db.json');
writeFileSync(config,JSON.stringify({name:'blitz-local',compatibility_date:'2026-05-15',d1_databases:[{binding:'DB',database_name:'site-creator-d1',database_id:'00000000-0000-4000-8000-000000000000'}]}));
const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config',config,'--persist-to',path.join(projectRoot,'.wrangler/state'),'--file',target],{stdio:'inherit'});
if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
console.log('BLITZ готов. Укажите OPENAI_API_KEY в .env.local для генерации. Запуск: npm run dev → http://localhost:5173');
