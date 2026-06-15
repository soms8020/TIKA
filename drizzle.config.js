const dotenv = require('dotenv');
const { defineConfig } = require('drizzle-kit');

// .env.local 파일을 명시적으로 로드
dotenv.config({ path: '.env.local' });

module.exports = defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
