// lib/date — 날짜 유틸 + 이번주 판정 (COMPONENT_SPEC §2.3, FR-014)
// UTC 기준으로 계산해 실행 환경 타임존과 무관하게 결정적으로 동작한다.
import { TICKET_STATUS, type TicketWithMeta } from '@/shared/types';

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// today 가 속한 주의 월요일(UTC 00:00)
export function getMonday(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay(); // 0=일 ~ 6=토
  const diff = (day + 6) % 7; // 월요일까지 거슬러 갈 일수
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

// today 가 속한 주의 일요일
export function getSunday(date: Date): Date {
  const sunday = getMonday(date);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return sunday;
}

// 이번 주 업무: 이번 주(월~일) dueDate 를 가진 TODO/IN_PROGRESS 티켓
export function isThisWeek(
  ticket: TicketWithMeta,
  today: Date = new Date(),
): boolean {
  if (!ticket.dueDate) return false;
  if (
    ticket.status === TICKET_STATUS.BACKLOG ||
    ticket.status === TICKET_STATUS.DONE
  ) {
    return false;
  }
  const monday = toDateString(getMonday(today));
  const sunday = toDateString(getSunday(today));
  return ticket.dueDate >= monday && ticket.dueDate <= sunday;
}
