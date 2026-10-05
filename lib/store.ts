import { getDatabase } from '@netlify/database';
import { getStore } from '@netlify/blobs';
import { ApiError } from './errors';
type Statement = [sql: string, ...args: any[]];
type Result = { rows: any[]; meta: { changes: number } };
const placeholders = (sql: string) => { let n = 0; return sql.replace(/\?/g, () => '$' + ++n); };
export function database() {
  try { return getDatabase().pool; } catch { throw new ApiError(503, 'Chưa kết nối cơ sở dữ liệu.'); }
}
export function bucket() {
  try { return getStore({ name: 'campusloop-images', consistency: 'strong' }); } catch { throw new ApiError(503, 'Chưa kết nối kho ảnh.'); }
}
async function query(sql: string, args: any[]): Promise<Result> {
  const result = await database().query(placeholders(sql), args);
  return { rows: result.rows, meta: { changes: result.rowCount ?? 0 } };
}
export async function one(sql: string, ...args: any[]) { return (await query(sql, args)).rows[0] ?? null; }
export async function rows(sql: string, ...args: any[]) { return (await query(sql, args)).rows; }
export async function run(sql: string, ...args: any[]) { return query(sql, args); }
// Runs statements in order inside one transaction; a statement given as a function receives earlier results and may return null to skip.
export async function batch(statements: (Statement | ((results: Result[]) => Statement | null))[]) {
  const client = await database().connect();
  try {
    await client.query('BEGIN');
    const results: Result[] = [];
    for (const item of statements) {
      const statement = typeof item === 'function' ? item(results) : item;
      if (!statement) { results.push({ rows: [], meta: { changes: 0 } }); continue; }
      const [sql, ...args] = statement;
      const result = await client.query(placeholders(sql), args);
      results.push({ rows: result.rows, meta: { changes: result.rowCount ?? 0 } });
    }
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
