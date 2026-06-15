import { createTicketSchema } from '@/shared/validations/ticket';

function firstError(input: unknown): string | undefined {
  const result = createTicketSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
}

describe('createTicketSchema', () => {
  it('제목만 있으면 통과한다', () => {
    expect(createTicketSchema.safeParse({ title: '유효한 제목' }).success).toBe(
      true
    );
  });

  it('모든 유효 필드가 있으면 통과한다', () => {
    const result = createTicketSchema.safeParse({
      title: '제목',
      description: '설명',
      priority: 'HIGH',
      plannedStartDate: '2026-01-01',
      dueDate: '2999-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('제목 누락 시 "제목을 입력해주세요"', () => {
    expect(firstError({})).toBe('제목을 입력해주세요');
  });

  it('공백만 있는 제목은 "제목을 입력해주세요"', () => {
    expect(firstError({ title: '   ' })).toBe('제목을 입력해주세요');
  });

  it('제목 200자 초과는 거부한다', () => {
    expect(firstError({ title: 'a'.repeat(201) })).toBe(
      '제목은 200자 이내로 입력해주세요'
    );
  });

  it('설명 1000자 초과는 거부한다', () => {
    expect(firstError({ title: '제목', description: 'a'.repeat(1001) })).toBe(
      '설명은 1000자 이내로 입력해주세요'
    );
  });

  it('잘못된 우선순위는 거부한다', () => {
    expect(firstError({ title: '제목', priority: 'URGENT' })).toBe(
      '우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요'
    );
  });

  it('과거 종료예정일은 거부한다', () => {
    expect(firstError({ title: '제목', dueDate: '2000-01-01' })).toBe(
      '종료예정일은 오늘 이후 날짜를 선택해주세요'
    );
  });
});
