import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';

// DATABASE_URL을 사용하여 Postgres에 연결합니다.
// Next.js 런타임은 .env.local을 자동 로드합니다. (.env.local에 DATABASE_URL 설정)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL 환경변수가 설정되어 있지 않습니다. .env.local을 확인하세요.');
}

const sql = postgres(connectionString, {
  // 프로덕션에서는 SSL을 켜는 것이 일반적입니다. 로컬 개발에서는 보통 false로 둡니다.
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(sql);

export default db;
