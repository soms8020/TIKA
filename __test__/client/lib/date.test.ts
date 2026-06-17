// TDD Red — lib/date (FRONTEND_TASKS 0.2, COMPONENT_SPEC §2.3)
// 대상(미구현): src/client/lib/date.ts
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type TicketWithMeta,
} from '@/shared/types';
import {
  toDateString,
  getMonday,
  getSunday,
  isThisWeek,
} from '@/client/lib/date';

const card = (overrides: Partial<TicketWithMeta>): TicketWithMeta => ({
  id: 1,
  title: 't',
  description: null,
  status: TICKET_STATUS.TODO,
  priority: TICKET_PRIORITY.MEDIUM,
  position: 0,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date('2026-06-01'),
  updatedAt: new Date('2026-06-01'),
  isOverdue: false,
  ...overrides,
});

describe('lib/date', () => {
  it('toDateString 은 YYYY-MM-DD 를 반환한다', () => {
    expect(toDateString(new Date('2026-06-17T12:34:00Z'))).toBe('2026-06-17');
  });

  it('getMonday/getSunday 는 today 를 포함하는 월~일 주를 반환한다', () => {
    const today = new Date('2026-06-17T12:00:00Z');
    const monday = getMonday(today);
    const sunday = getSunday(today);

    expect(monday.getUTCDay()).toBe(1); // 월요일
    expect(sunday.getUTCDay()).toBe(0); // 일요일
    expect(toDateString(monday) <= toDateString(today)).toBe(true);
    expect(toDateString(sunday) >= toDateString(today)).toBe(true);
    // 월요일 + 6일 = 일요일
    const sixDaysLater = new Date(monday);
    sixDaysLater.setUTCDate(sixDaysLater.getUTCDate() + 6);
    expect(toDateString(sunday)).toBe(toDateString(sixDaysLater));
  });

  describe('isThisWeek', () => {
    const today = new Date('2026-06-17T12:00:00Z');
    const monday = toDateString(getMonday(today));
    const sunday = toDateString(getSunday(today));
    const afterSunday = toDateString(
      new Date(Date.parse(`${sunday}T00:00:00Z`) + 86400000),
    );

    it('이번 주 dueDate 를 가진 TODO 티켓은 true', () => {
      expect(isThisWeek(card({ dueDate: monday }), today)).toBe(true);
      expect(isThisWeek(card({ dueDate: sunday }), today)).toBe(true);
    });

    it('dueDate 가 없으면 false', () => {
      expect(isThisWeek(card({ dueDate: null }), today)).toBe(false);
    });

    it('BACKLOG/DONE 는 false', () => {
      expect(isThisWeek(card({ dueDate: monday, status: TICKET_STATUS.BACKLOG }), today)).toBe(false);
      expect(isThisWeek(card({ dueDate: monday, status: TICKET_STATUS.DONE }), today)).toBe(false);
    });

    it('이번 주 범위를 벗어난 dueDate 는 false', () => {
      expect(isThisWeek(card({ dueDate: afterSunday }), today)).toBe(false);
    });
  });
});
