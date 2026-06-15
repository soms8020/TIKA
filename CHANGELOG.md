# Changelog

이 파일은 `/changelog` 스킬로 자동 기록된다. 최신 항목이 위에 온다.

## [main] - 2026-06-15 13:55

### Prompt
> "매번 프롬프트 입력 후 코드를 수정하고 git에 반영할 때, 1. 내가 입력한 프롬프트 내용 2. 변경된 파일 목록과 라인 수 3. 작업 날짜/시간, 브랜치명 4. 테스트 결과를 자동으로 기록하는 시스템을 만들어줘. CHANGELOG.md에 상세 이력, CLAUDE.md에 최근 변경사항 요약, /changelog \"요약\" 명령어로 실행, Hook 보다는 Skill 방식으로 구현."
> "지금 수정한 내용을 반영한 뒤 커밋 메시지를 만들어서 푸시하고 기록해줘. changelog를 통해 update문서나 코드들 리스트업해서 알려줘."

### Changes
- **Added**: `/changelog` 스킬 — 변경 데이터 수집 → CHANGELOG/CLAUDE 기록 절차 정의 (`.claude/skills/changelog/SKILL.md`)
- **Added**: git 변경 데이터 수집기(브랜치/시간/파일별 +/- 라인/상태 JSON 출력) (`scripts/changelog.mjs`)
- **Added**: Changelog 상세 이력 파일 (`CHANGELOG.md`)
- **Modified**: 최근 변경사항 요약 마커 블록 추가 (`CLAUDE.md`)
- **Modified**: 빌드 산출물 `*.tsbuildinfo` 무시 추가 (`.gitignore`)
- **Modified**: 사용하지 않는 `baseUrl` 옵션 제거 (Bundler 해석 영향 없음) (`tsconfig.json`)

### Files Modified
- `.claude/skills/changelog/SKILL.md` (+124, -0 lines)
- `scripts/changelog.mjs` (+134, -0 lines)
- `CLAUDE.md` (+5, -0 lines)
- `.gitignore` (+1, -0 lines)
- `tsconfig.json` (+0, -1 lines)

### Tests
- npm test: 70 passed / 0 failed (tsconfig 변경 영향 검증)
