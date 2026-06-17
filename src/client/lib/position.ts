// computeInsertPosition — 드래그앤드롭 삽입 위치의 position 계산 (REQUIREMENTS FR-007)
// 칼럼 내 카드 목록(position 오름차순)과 삽입 index 를 받아 새 position 을 반환한다.
const GAP = 1024;

export function computeInsertPosition(
  list: { position: number }[],
  index: number,
): number {
  if (list.length === 0) return 0;
  if (index <= 0) return list[0].position - GAP;
  if (index >= list.length) return list[list.length - 1].position + GAP;
  return (list[index - 1].position + list[index].position) / 2;
}
