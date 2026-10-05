import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const [emailInput,...flags]=process.argv.slice(2);
const email=emailInput?.trim().toLowerCase();
if(!email||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||flags.some(flag=>!['--remote','--local'].includes(flag))||flags.length>1){
  console.error('Usage: npm run admin:grant -- email@example.com [--remote|--local]');process.exit(1);
}
const escaped=email.replaceAll("'","''");
const result=spawnSync(process.execPath,[fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js',import.meta.url)),
  'd1','execute','DB',flags.includes('--remote')?'--remote':'--local','--config','wrangler.jsonc','--persist-to','.wrangler/state','--json',
  '--command',`UPDATE auth_users SET role='admin' WHERE email='${escaped}'; DELETE FROM auth_sessions WHERE user_id IN (SELECT id FROM auth_users WHERE email='${escaped}'); SELECT email,role FROM auth_users WHERE email='${escaped}';`,
],{cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8',windowsHide:true});
if(result.status!==0){process.stderr.write(result.stderr||'Could not grant administrator access.\n');process.exit(result.status||1);}
const records=JSON.parse(result.stdout);
const account=records.flatMap(record=>record.results||[]).find(record=>record.email===email);
if(!account){console.error('Account not found. Register the intended account before granting administrator access.');process.exit(1);}
console.log('Administrator access granted to '+account.email+'. Sign in again to use it.');
