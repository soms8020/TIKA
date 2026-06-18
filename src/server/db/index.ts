import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';

// 환경별 DB 분리:
//   - 로컬 개발(NODE_ENV !== 'production'): DATABASE_URL (로컬 Postgres, 예: tika_dev)
//   - 프로덕션(Vercel, NODE_ENV === 'production'): POSTGRES_URL (Neon)
// 한쪽이 비어 있으면 다른 쪽으로 fallback 한다.
const isProduction = process.env.NODE_ENV === 'production';
const connectionString = isProduction
  ? process.env.POSTGRES_URL ?? process.env.DATABASE_URL
  : process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    'DB 연결 문자열이 없습니다. 로컬은 DATABASE_URL, 프로덕션은 POSTGRES_URL 을 설정하세요(.env.local / Vercel).',
  );
}

// localhost 가 아니면(Neon 등 클라우드) SSL 필수. 로컬 Postgres 는 SSL 을 끈다.
const isLocalHost = /@(localhost|127\.0\.0\.1|0\.0\.0\.0)[:/]/.test(connectionString);
const sql = postgres(connectionString, {
  ssl: isLocalHost ? false : 'require',
});

export const db = drizzle(sql);

export default db;
