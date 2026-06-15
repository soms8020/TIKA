# create_db.ps1
# Windows 환경에서 psql을 사용하여 scripts\create_db.sql을 실행하는 간단 안내 스크립트입니다.
# 사용법: 관리자 권한으로 PowerShell을 연 뒤 이 파일을 실행하세요.

Write-Host "이 스크립트는 'scripts/create_db.sql'을 psql로 실행하는 방법을 안내합니다." -ForegroundColor Cyan
Write-Host "psql이 설치되어 있고 PATH에 등록되어 있어야 합니다." -ForegroundColor Yellow
Write-Host "다음 명령을 실행하거나, 아래 명령을 복사하여 관리자 권한 PowerShell에서 실행하세요:" -ForegroundColor Green
Write-Host "`psql -U postgres -h localhost -f scripts/create_db.sql`" -ForegroundColor White
Write-Host "postgres 슈퍼유저 비밀번호를 요구할 수 있습니다." -ForegroundColor Yellow

# 자동 실행을 원하면 아래 주석을 해제하고 적절한 슈퍼유저 비밀번호를 설정하세요.
# $env:PGPASSWORD = 'your_postgres_password'
# & psql -U postgres -h localhost -f scripts/create_db.sql
