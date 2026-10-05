import { headers } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { database, one, run } from './store';
import { ApiError } from './errors';
import { hashPassword, verifyPassword } from './password';

const lifetime = 7 * 24 * 60 * 60;
const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex');
const localHost = (host: string) => /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host);
const cookieName = (host: string) => localHost(host) ? 'campusloop_session' : '__Host-campusloop_session';
function sessionToken(cookie: string, host: string) {
  const name = cookieName(host);
  const token = cookie.split(';').map(item => item.trim()).find(item => item.startsWith(name + '='))?.slice(name.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export async function getSessionUser() {
  const requestHeaders = await headers();
  const token = sessionToken(requestHeaders.get('cookie') || '', requestHeaders.get('host') || '');
  if (!token) return null;
  const user = await one(`SELECT a.id userId, a.email, a.role, p.name fullName FROM auth_sessions s
    JOIN auth_users a ON a.id=s.user_id JOIN profiles p ON p.id=a.id
    WHERE s.token_hash=? AND s.expires_at>?`, tokenHash(token), new Date().toISOString());
  return user || null;
}
function cookie(req: Request, token: string, maxAge = lifetime) {
  const url = new URL(req.url);
  return `${cookieName(url.host)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${localHost(url.host) && url.protocol !== 'https:' ? '' : '; Secure'}`;
}
async function startSession(req: Request, userId: string, passwordHash: string) {
  const token = randomBytes(32).toString('hex');
  const result = await run(`INSERT INTO auth_sessions (token_hash,user_id,expires_at,created_at)
    SELECT ?,a.id,?,? FROM auth_users a JOIN profiles p ON p.id=a.id
    WHERE a.id=? AND a.password_hash=? AND p.blocked=0`,
    tokenHash(token), new Date(Date.now() + lifetime * 1000).toISOString(), new Date().toISOString(), userId, passwordHash);
  if (!result.meta.changes) throw new ApiError(401, 'Tài khoản đã thay đổi. Vui lòng đăng nhập lại.');
  await run('DELETE FROM auth_sessions WHERE expires_at<=?', new Date().toISOString());
  return cookie(req, token);
}
async function throttle(scope: string, subject: string, maximum: number, seconds: number) {
  const start = Math.floor(Date.now() / (seconds * 1000)) * seconds * 1000;
  const key = tokenHash(scope + ':' + subject + ':' + start);
  const record = await one(`INSERT INTO auth_rate_limits (key,count,expires_at) VALUES (?,1,?)
    ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count`, key, new Date(start + seconds * 1000).toISOString());
  if (record.count > maximum) throw new ApiError(429, 'Bạn thử quá nhiều lần. Vui lòng thử lại sau.');
  await run('DELETE FROM auth_rate_limits WHERE expires_at<=?', new Date().toISOString());
}
function emailAddress(value: unknown) {
  if (typeof value !== 'string') throw new ApiError(400, 'Email không hợp lệ.');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Email không hợp lệ.');
  return email;
}
function passwordValue(value: unknown, registration = false) {
  if (typeof value !== 'string' || value.length > 128 || value.length < (registration ? 12 : 1))
    throw new ApiError(400, registration ? 'Mật khẩu cần từ 12 đến 128 ký tự.' : 'Vui lòng nhập mật khẩu.');
  return value;
}
async function readBody(req: Request) {
  const reader = req.body?.getReader();
  if (!reader) throw new ApiError(400, 'Yêu cầu không hợp lệ.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > 4096) { await reader.cancel(); throw new ApiError(413, 'Yêu cầu quá lớn.'); }
    chunks.push(chunk.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)); }
  catch { throw new ApiError(400, 'Nội dung yêu cầu không hợp lệ.'); }
}
export async function handleAuth(req: Request, action: string) {
  if (req.method !== 'POST') return Response.json({error:'Phương thức không được hỗ trợ.'}, {status:405, headers:{Allow:'POST'}});
  if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new ApiError(415, 'Yêu cầu không hợp lệ.');
  if (Number(req.headers.get('content-length') || 0) > 4096) throw new ApiError(413, 'Yêu cầu quá lớn.');
  const body: any = await readBody(req);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Yêu cầu không hợp lệ.');
  const ip = req.headers.get('cf-connecting-ip') || 'unknown';
  const respond = (setCookie: string, status = 200) => Response.json({ok:true}, {status, headers:{'Set-Cookie':setCookie, 'Cache-Control':'no-store'}});
  if (action === 'logout') {
    const token = sessionToken(req.headers.get('cookie') || '', new URL(req.url).host);
    if (token) await run('DELETE FROM auth_sessions WHERE token_hash=?', tokenHash(token));
    return respond(cookie(req, '', 0));
  }
  if (action === 'register' || action === 'login') {
    const email = emailAddress(body.email);
    const password = passwordValue(body.password, action === 'register');
    await throttle(action + '-ip', ip, action === 'register' ? 5 : 30, action === 'register' ? 3600 : 900);
    await throttle(action + '-email', email, 12, 900);
    if (action === 'register') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (name.length < 2 || name.length > 80) throw new ApiError(400, 'Họ tên cần từ 2 đến 80 ký tự.');
      if (await one('SELECT id FROM auth_users WHERE email=?', email)) throw new ApiError(409, 'Email đã được đăng ký.');
      const id = crypto.randomUUID(), now = new Date().toISOString();
      const passwordHash = await hashPassword(password);
      try { await database().batch([
        database().prepare('INSERT INTO auth_users (id,email,password_hash,created_at) VALUES (?,?,?,?)').bind(id,email,passwordHash,now),
        database().prepare('INSERT INTO profiles (id,email,name,created_at) VALUES (?,?,?,?)').bind(id,email,name,now),
      ]); } catch(error) {
        if (await one('SELECT id FROM auth_users WHERE email=?',email)) throw new ApiError(409, 'Email đã được đăng ký.');
        throw error;
      }
      return respond(await startSession(req,id,passwordHash),201);
    }
    const user = await one('SELECT a.id,a.password_hash,p.blocked FROM auth_users a JOIN profiles p ON p.id=a.id WHERE a.email=?',email);
    const correct = await verifyPassword(password,user?.password_hash);
    if (!user || !correct || user.blocked) throw new ApiError(401, 'Email hoặc mật khẩu không đúng.');
    const token = sessionToken(req.headers.get('cookie') || '',new URL(req.url).host);
    if (token) await run('DELETE FROM auth_sessions WHERE token_hash=?',tokenHash(token));
    return respond(await startSession(req,user.id,user.password_hash));
  }
  if (action === 'password') {
    const user = await getSessionUser();
    if (!user) throw new ApiError(401, 'Vui lòng đăng nhập để tiếp tục.');
    const account = await one('SELECT a.password_hash,p.blocked FROM auth_users a JOIN profiles p ON p.id=a.id WHERE a.id=?',user.userId);
    if (!account || account.blocked) throw new ApiError(403, 'Tài khoản không được phép thực hiện thao tác này.');
    await throttle('password-account',user.userId,6,900);
    const currentPassword = passwordValue(body.current_password);
    const password = passwordValue(body.password,true);
    if (!await verifyPassword(currentPassword,account.password_hash)) throw new ApiError(401, 'Mật khẩu hiện tại không đúng.');
    const passwordHash = await hashPassword(password);
    const changed = await database().batch([
      database().prepare(`UPDATE auth_users SET password_hash=? WHERE id=? AND password_hash=?
        AND EXISTS (SELECT 1 FROM profiles WHERE id=? AND blocked=0)`).bind(passwordHash,user.userId,account.password_hash,user.userId),
      database().prepare('DELETE FROM auth_sessions WHERE user_id=? AND changes()=1').bind(user.userId),
    ]);
    if (!changed[0].meta.changes) throw new ApiError(409, 'Tài khoản đã thay đổi. Vui lòng đăng nhập lại.');
    return respond(await startSession(req,user.userId,passwordHash));
  }
  throw new ApiError(404, 'Không tìm thấy chức năng.');
}
