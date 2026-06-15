/**
 * @jest-environment node
 *
 * TC-API-008: isOverdue 필드 계산 (docs/TEST_CASES.md, DATA_MODEL §5.3)
 * + Done 24시간 필터 isDoneVisible (DATA_MODEL §5.4)
 */
import { isOverdue, isDoneVisible } from '@/server/services/ticketService';
import type { Ticket } from '@/shared/types';

jest.mock('@/server/db', () => ({ db: {} }));

function ticket(overrides: Partial<Ticket>): Ticket {
  return {
    id: 1,
    title: 't',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    position: 0,
    plannedStartDate: null,
    dueDate: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const today = new Date().toISOString().split('T')[0];

describe('TC-API-008: isOverdue', () => {
  it('008-1 dueDate<오늘, status=TODO → true', () => {
    expect(isOverdue(ticket({ dueDate: yesterday, status: 'TODO' }))).toBe(true);
  });
  it('008-2 status=DONE → false', () => {
    expect(isOverdue(ticket({ dueDate: yesterday, status: 'DONE' }))).toBe(false);
  });
  it('008-3 dueDate=null → false', () => {
    expect(isOverdue(ticket({ dueDate: null }))).toBe(false);
  });
  it('008-4 미래 dueDate → false', () => {
    expect(isOverdue(ticket({ dueDate: tomorrow }))).toBe(false);
  });
  it('008-5 dueDate=오늘 → false', () => {
    expect(isOverdue(ticket({ dueDate: today }))).toBe(false);
  });
  it('008-6 BACKLOG 오버듀 → true', () => {
    expect(isOverdue(ticket({ dueDate: yesterday, status: 'BACKLOG' }))).toBe(true);
  });
  it('008-7 IN_PROGRESS 오버듀 → true', () => {
    expect(isOverdue(ticket({ dueDate: yesterday, status: 'IN_PROGRESS' }))).toBe(
      true
    );
  });
});

describe('isDoneVisible (Done 24시간 필터)', () => {
  it('DONE + 24시간 이내 → true', () => {
    expect(
      isDoneVisible(
        ticket({ status: 'DONE', completedAt: new Date(Date.now() - 1000) })
      )
    ).toBe(true);
  });
  it('DONE + 24시간 초과 → false', () => {
    expect(
      isDoneVisible(
        ticket({ status: 'DONE', completedAt: new Date(Date.now() - 90000000) })
      )
    ).toBe(false);
  });
  it('DONE 아님 → false', () => {
    expect(isDoneVisible(ticket({ status: 'TODO' }))).toBe(false);
  });
});
