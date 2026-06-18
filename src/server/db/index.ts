import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';

// 연결 문자열: Vercel(Neon) 통합은 POSTGRES_URL 을 제공한다.
// 로컬/타 환경 호환을 위해 DATABASE_URL 도 fallback 으로 허용한다.
// Next.js 런타임은 .env.local 을 자동 로드한다.
const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'POSTGRES_URL(또는 DATABASE_URL) 환경변수가 설정되어 있지 않습니다. .env.local / Vercel 환경변수를 확인하세요.',
  );
}

const sql = postgres(connectionString, {
  // Neon/Vercel Postgres 는 SSL 이 필수다(로컬에서 클라우드 DB 에 붙을 때도 동일).
  ssl: 'require',
});

export const db = drizzle(sql);

export default db;
