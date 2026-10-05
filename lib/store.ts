import { env } from 'cloudflare:workers';
import { ApiError } from './errors';
export function database() {
  if (!env.DB) throw new ApiError(503, 'Chưa kết nối cơ sở dữ liệu.');
  return env.DB;
}
export function bucket() {
  if (!env.BUCKET) throw new ApiError(503, 'Chưa kết nối kho ảnh.');
  return env.BUCKET;
}
export async function one(sql: string, ...args: any[]) { return database().prepare(sql).bind(...args).first<any>(); }
export async function rows(sql: string, ...args: any[]) { return (await database().prepare(sql).bind(...args).all<any>()).results; }
export async function run(sql: string, ...args: any[]) { return database().prepare(sql).bind(...args).run(); }
