import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
const dir=mkdtempSync(path.join(tmpdir(),'blitz-check-'));
try{for(const name of ['theory-v3','assessment','experience']){const outfile=path.join(dir,name+'.cjs');await build({entryPoints:[`tests/${name}.tsx`],bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile,logLevel:'error'});const r=spawnSync(process.execPath,[outfile],{stdio:'inherit'});if(r.status!==0)process.exitCode=1;}const r=spawnSync(process.execPath,['--experimental-strip-types','--test','tests/openai.test.mjs'],{stdio:'inherit'});if(r.status!==0)process.exitCode=1;}finally{rmSync(dir,{recursive:true,force:true});}
