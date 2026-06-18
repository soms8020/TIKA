const dotenv = require('dotenv');
const { defineConfig } = require('drizzle-kit');

// .env.local 파일을 명시적으로 로드
dotenv.config({ path: '.env.local' });

// 런타임과 동일하게 환경별 분리: 프로덕션 → Neon(POSTGRES_URL), 그 외 → 로컬(DATABASE_URL)
const isProduction = process.env.NODE_ENV === 'production';
const url = isProduction
  ? process.env.POSTGRES_URL || process.env.DATABASE_URL
  : process.env.DATABASE_URL || process.env.POSTGRES_URL;

module.exports = defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
});
