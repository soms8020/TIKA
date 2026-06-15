---
name: "changelog"
description: "현재 작업(미커밋 변경 또는 직전 커밋)을 CHANGELOG.md에 상세 기록하고 CLAUDE.md의 최근 변경사항 요약을 갱신한다. 사용자가 /changelog \"요약\"으로 직접 실행한다."
argument-hint: "이번 변경의 한 줄 요약 (예: /changelog \"리오더 버그 수정\")"
user-invocable: true
disable-model-invocation: true
---

## User Input

```text
$ARGUMENTS
```

`$ARGUMENTS`는 이번 변경에 대한 사용자의 한 줄 요약이다. (비어 있으면 대화 맥락에서 직접 요약을 작성한다.)

---

## 목적

매 작업 단위마다 아래를 자동 기록한다.

1. 사용자가 입력한 프롬프트 내용
2. 변경된 파일 목록과 라인 수(+/-)
3. 작업 날짜/시간, 브랜치명
4. 테스트 결과 (있다면)

기록 위치:
- **CHANGELOG.md** — 상세 이력 (전체 누적)
- **CLAUDE.md** — 최근 7~14일 요약 (`<!-- RECENT_CHANGES_START -->` ~ `END` 블록)

## 실행 절차

### 1단계 — 변경 데이터 수집

다음을 실행해 git 변경 데이터(JSON)를 얻는다.

```bash
node scripts/changelog.mjs
```

반환 필드: `branch`, `datetime`, `source`(working-tree | last-commit),
`changelogExists`, `lastCommit`, `files[].{path, added, deleted, status}`, `totals`.

- `source: working-tree` → 아직 커밋되지 않은 변경을 기록하는 것이다.
- `source: last-commit` → 미커밋 변경이 없어 직전 커밋을 기록하는 것이다.

### 2단계 — 프롬프트 내용 확정

- 이번 작업 사이클에서 **사용자가 입력한 원래 요청**을 대화 맥락에서 찾아 그대로 인용한다.
  (여러 번의 요청이 있었다면 이번 변경을 유발한 핵심 요청을 1~3개 인용)
- `$ARGUMENTS`(한 줄 요약)는 제목/요약으로 활용한다.
- 프롬프트가 길면 핵심을 보존하되 과도하게 줄이지 않는다. 절대 내용을 지어내지 말 것.

### 3단계 — 테스트 결과 수집 (해당 시)

- 코드(`src/`, `app/`, `__test__/`) 변경이 포함된 경우에만 테스트를 실행한다.
- 문서/명세만 변경된 경우(docs/, specs/, *.md) 테스트를 건너뛰고 "N/A"로 기록한다.
- 실행: `npm test`. 결과에서 통과/실패 수와 핵심 라인을 기록한다.
  (이미 이번 대화에서 테스트를 돌렸다면 그 결과를 재사용하고 다시 실행하지 않아도 된다.)

### 4단계 — CHANGELOG.md 기록 (최신 항목을 맨 위에)

`changelogExists`가 false면 먼저 헤더를 만든다.

```markdown
# Changelog

이 파일은 `/changelog` 스킬로 자동 기록된다. 최신 항목이 위에 온다.
```

그 헤더 **바로 아래**에 이번 항목을 삽입한다(기존 항목들 위). 형식은 정확히 아래를 따른다.

```markdown
## [브랜치명] - YYYY-MM-DD HH:MM

### Prompt
> "사용자가 입력한 요청"

### Changes
- **Added**: 새 기능 설명 (`파일경로`)
- **Modified**: 수정 내용 설명 (`파일경로`)
- **Deleted**: 삭제 내용 설명 (`파일경로`)

### Files Modified
- `파일경로` (+10, -2 lines)

### Tests
- npm test: 12 passed / 0 failed  (또는 "N/A — 문서 변경")
```

작성 규칙:
- `### Changes`는 파일의 `status`(Added/Modified/Deleted)로 묶고, **무엇을 왜** 바꿨는지 사람이 읽을 설명을 붙인다. 단순 파일 나열이 아니라 의미 있는 한 줄로 쓴다.
- 해당 status에 파일이 없으면 그 줄은 생략한다.
- `### Files Modified`는 수집된 모든 파일을 `(+N, -M lines)`로 그대로 나열한다. (added/deleted가 null이면 `(binary)`)
- 시간/브랜치/라인 수는 1단계 JSON 값을 그대로 사용한다. 임의로 바꾸지 않는다.

### 5단계 — CLAUDE.md 최근 변경 요약 갱신

CLAUDE.md에 아래 마커 블록이 없으면, `<!-- SPECKIT START -->` **바로 위에** 새로 만든다.

```markdown
## 최근 변경사항 (최근 14일)
<!-- RECENT_CHANGES_START -->
<!-- RECENT_CHANGES_END -->
```

마커 사이를 다음 규칙으로 갱신한다.
- 이번 항목을 **맨 위에** 한 줄 요약으로 추가:
  `- **YYYY-MM-DD** [브랜치명] 한 줄 요약 (N files, +X/-Y)`
- 오늘(2026-06-15 기준 등 현재 날짜) 기준 **14일이 지난 항목은 제거**한다.
- 마커 밖의 CLAUDE.md 내용은 절대 건드리지 않는다.

### 6단계 — 보고

작성한 CHANGELOG 항목 요약과, CLAUDE.md에서 추가/제거된 줄을 사용자에게 간단히 보고한다.
커밋은 사용자가 명시적으로 요청할 때만 수행한다(이 스킬은 파일 기록까지만 한다).

## 주의사항
- 라인 수·파일 목록·브랜치·시간은 반드시 `scripts/changelog.mjs` 출력에 근거한다(추측 금지).
- 프롬프트 인용은 실제 사용자 발화여야 한다(날조 금지).
- CHANGELOG.md는 누적이므로 기존 항목을 삭제·수정하지 않는다(맨 위 삽입만).
- 테스트 코드 삭제/skip 금지 등 CLAUDE.md 규칙을 위반하지 않는다.
