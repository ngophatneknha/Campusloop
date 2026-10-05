import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
const cost = { N: 16384, r: 8, p: 5, maxmem: 32 * 1024 * 1024 };
const prefix = 'scrypt$16384$8$5$';
const dummy = prefix + Buffer.alloc(16).toString('base64') + '$' + Buffer.alloc(32).toString('base64');
const derive = (password: string, salt: Buffer) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 32, cost, (error, key) => error ? reject(error) : resolve(key));
});
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return prefix + salt.toString('base64') + '$' + (await derive(password, salt)).toString('base64');
}
export async function verifyPassword(password: string, encoded?: string) {
  const valid = !!encoded && /^scrypt\$16384\$8\$5\$[A-Za-z0-9+/]{22}==\$[A-Za-z0-9+/]{43}=$/.test(encoded);
  const parts = (valid ? encoded! : dummy).split('$');
  const actual = await derive(password, Buffer.from(parts[4], 'base64'));
  const matches = timingSafeEqual(actual, Buffer.from(parts[5], 'base64'));
  return valid && matches;
}
