// Next.js와 동일하게 .env.local을 우선 로드한다 (없으면 기본 .env).
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const postgres = require('postgres');

(async () => {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    const r = await sql`select now()`;
    console.log('DB 연결 성공:', r);
  } catch (e) {
    console.error('DB 연결 실패:', e.message);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
})();
