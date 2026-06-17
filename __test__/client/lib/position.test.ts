// TDD Red — computeInsertPosition (FRONTEND_TASKS 0.4, REQUIREMENTS FR-007)
// 대상(미구현): src/client/lib/position.ts
//
// 계약: computeInsertPosition(list, index) — list 에 index 위치로 삽입할 때의 position
//   - 빈 리스트       → 0
//   - 맨 앞(index 0)  → list[0].position - 1024
//   - 맨 뒤(index>=len) → last.position + 1024
//   - 사이            → (prev.position + next.position) / 2
import { computeInsertPosition } from '@/client/lib/position';

const list = (...positions: number[]) => positions.map((position) => ({ position }));

describe('computeInsertPosition', () => {
  it('빈 칼럼이면 0 을 반환한다', () => {
    expect(computeInsertPosition([], 0)).toBe(0);
  });

  it('맨 앞(index 0) 삽입은 첫 카드 position - 1024 이다', () => {
    expect(computeInsertPosition(list(0, 1024, 2048), 0)).toBe(-1024);
  });

  it('맨 뒤(index = 길이) 삽입은 마지막 카드 position + 1024 이다', () => {
    expect(computeInsertPosition(list(0, 1024, 2048), 3)).toBe(3072);
  });

  it('두 카드 사이 삽입은 (prev + next) / 2 이다', () => {
    expect(computeInsertPosition(list(0, 1024, 2048), 1)).toBe(512);
    expect(computeInsertPosition(list(0, 1024, 2048), 2)).toBe(1536);
  });

  it('index 가 길이를 초과해도 맨 뒤로 간주한다', () => {
    expect(computeInsertPosition(list(0, 1024), 99)).toBe(2048);
  });
});
