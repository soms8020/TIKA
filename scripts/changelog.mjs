#!/usr/bin/env node
/**
 * changelog.mjs — /changelog 스킬용 git 변경 데이터 수집기.
 *
 * 출력: JSON (stdout). Claude가 이 데이터를 읽어 CHANGELOG.md / CLAUDE.md를 작성한다.
 *
 * 수집 대상 우선순위:
 *   1) 워킹 트리의 미커밋 변경(staged + unstaged + untracked)
 *   2) 위가 비어 있으면 직전 커밋(HEAD)
 *
 * 사용: node scripts/changelog.mjs
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const sh = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();
const shSafe = (cmd) => {
  try {
    return sh(cmd);
  } catch {
    return '';
  }
};

const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const datetime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
  now.getDate(),
)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

const branch = shSafe('git rev-parse --abbrev-ref HEAD') || 'unknown';

// 상태 코드 → 사람이 읽는 분류
const classify = (code) => {
  const c = code.trim();
  if (c === '??' || c.startsWith('A')) return 'Added';
  if (c.startsWith('D')) return 'Deleted';
  if (c.startsWith('R')) return 'Renamed';
  return 'Modified';
};

// 워킹 트리 변경 파일별 상태
const statusMap = new Map(); // path -> classification
const porcelain = shSafe('git status --porcelain');
if (porcelain) {
  for (const line of porcelain.split('\n')) {
    if (!line.trim()) continue;
    const code = line.slice(0, 2);
    let p = line.slice(3).trim();
    if (p.includes(' -> ')) p = p.split(' -> ')[1]; // rename
    statusMap.set(p.replace(/^"|"$/g, ''), classify(code));
  }
}

const files = [];

const addNumstat = (numstatOutput, defaultClassify) => {
  if (!numstatOutput) return;
  for (const line of numstatOutput.split('\n')) {
    if (!line.trim()) continue;
    const [added, deleted, ...rest] = line.split('\t');
    let path = rest.join('\t');
    if (path.includes(' => ')) {
      // rename 형태: a/{old => new}/b 또는 old => new
      path = path.replace(/\{.*? => (.*?)\}/, '$1').replace(/.* => /, '');
    }
    files.push({
      path,
      added: added === '-' ? null : Number(added),
      deleted: deleted === '-' ? null : Number(deleted),
      status: statusMap.get(path) || defaultClassify(path),
    });
  }
};

let source;
const trackedNumstat = shSafe('git diff --numstat HEAD');
const untracked = shSafe('git ls-files --others --exclude-standard');

if (trackedNumstat || untracked) {
  source = 'working-tree';
  addNumstat(trackedNumstat, (p) => statusMap.get(p) || 'Modified');
  // untracked 파일: 라인 수 직접 계산, 추가로 분류
  if (untracked) {
    for (const p of untracked.split('\n')) {
      if (!p.trim()) continue;
      let lines = 0;
      try {
        lines = readFileSync(p, 'utf8').split('\n').length;
      } catch {
        lines = 0;
      }
      files.push({ path: p, added: lines, deleted: 0, status: 'Added' });
    }
  }
} else {
  // 미커밋 변경이 없으면 직전 커밋 사용
  source = 'last-commit';
  const nameStatus = shSafe('git show --name-status --format= HEAD');
  if (nameStatus) {
    for (const line of nameStatus.split('\n')) {
      if (!line.trim()) continue;
      const [code, ...rest] = line.split('\t');
      let p = rest[rest.length - 1];
      if (p) statusMap.set(p, classify(code));
    }
  }
  addNumstat(
    shSafe('git show --numstat --format= HEAD'),
    (p) => statusMap.get(p) || 'Modified',
  );
}

const lastCommit = {
  hash: shSafe('git rev-parse --short HEAD'),
  subject: shSafe('git log -1 --format=%s'),
};

const result = {
  branch,
  datetime,
  source,
  changelogExists: existsSync('CHANGELOG.md'),
  lastCommit,
  files,
  totals: {
    fileCount: files.length,
    added: files.reduce((s, f) => s + (f.added || 0), 0),
    deleted: files.reduce((s, f) => s + (f.deleted || 0), 0),
  },
};

process.stdout.write(JSON.stringify(result, null, 2));
