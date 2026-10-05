import {getDatabase} from '@netlify/database';

const [emailInput,...flags]=process.argv.slice(2);
const email=emailInput?.trim().toLowerCase();
if(!email||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||flags.length){
  console.error('Usage: NETLIFY_DB_URL=<connection string> npm run admin:grant -- email@example.com');process.exit(1);
}
const {pool}=getDatabase();
const client=await pool.connect();
try{
  await client.query('BEGIN');
  const result=await client.query("UPDATE auth_users SET role='admin' WHERE email=$1 RETURNING id,email",[email]);
  if(!result.rowCount){await client.query('ROLLBACK');console.error('Account not found. Register the intended account before granting administrator access.');process.exitCode=1;}
  else{await client.query('DELETE FROM auth_sessions WHERE user_id=$1',[result.rows[0].id]);await client.query('COMMIT');console.log('Administrator access granted to '+result.rows[0].email+'. Sign in again to use it.');}
}catch(error){await client.query('ROLLBACK').catch(()=>{});console.error(error.message||'Could not grant administrator access.');process.exitCode=1;}
finally{client.release();await pool.end();}
