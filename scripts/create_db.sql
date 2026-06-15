-- create_db.sql
-- 슈퍼유저(예: postgres)로 실행하세요
-- 예: psql -U postgres -f scripts/create_db.sql

CREATE ROLE tika_user WITH LOGIN PASSWORD 'tika_password';
CREATE DATABASE tika_dev OWNER tika_user;
GRANT ALL PRIVILEGES ON DATABASE tika_dev TO tika_user;

-- 필요시 추가 권한/확장 설치를 여기에 추가하세요.
