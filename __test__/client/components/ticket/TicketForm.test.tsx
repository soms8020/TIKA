// TDD Red — TicketForm (TC-COMP-004 변환)
// 명세: docs/TEST_CASES.md TC-COMP-004, COMPONENT_SPEC 2.8, US-001/US-002
// 대상(미구현): src/client/components/ticket/TicketForm.tsx
//
// 계약(contract):
//   Props:
//     mode: 'create' | 'edit'
//     initialData?: Partial<Ticket>           // 수정 모드 초기값
//     onSubmit: (data: CreateTicketInput | UpdateTicketInput) => void
//     onCancel: () => void
//     isLoading?: boolean
//
//   폼 필드(라벨로 접근 — label htmlFor/id 연결 필수):
//     제목      → text input      (라벨 텍스트에 "제목" 포함)
//     설명      → textarea        (라벨 텍스트에 "설명" 포함)
//     우선순위  → select 3옵션     (라벨 텍스트에 "우선순위" 포함, 기본 MEDIUM)
//     시작예정일 → date input      (라벨 텍스트에 "시작예정일" 포함)
//     종료예정일 → date input      (라벨 텍스트에 "종료예정일" 포함)
//
//   제출/취소 버튼:
//     제출: data-testid="ticket-form-submit", type="submit"
//           (생성 모드 "생성" / 수정 모드 "수정", isLoading 시 disabled)
//     취소: data-testid="ticket-form-cancel"
//
//   검증: src/shared/validations/ticket.ts 의 createTicketSchema 공유.
//         에러 메시지는 인라인으로 표시되고, 검증 실패 시 onSubmit 미호출.
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type Ticket,
} from '@/shared/types';

import { TicketForm } from '@/client/components/ticket/TicketForm';

// 검증에 사용되는 미래 날짜(오늘 이후). 스키마는 dueDate >= 오늘 을 요구한다.
const FUTURE_DATE = '2099-12-31';
const PAST_DATE = '2020-01-01';

const editTicket: Partial<Ticket> = {
  id: 7,
  title: '기존 제목',
  description: '기존 설명',
  priority: TICKET_PRIORITY.HIGH,
  status: TICKET_STATUS.TODO,
  plannedStartDate: '2026-06-10',
  dueDate: FUTURE_DATE,
};

const noop = () => {};

describe('TicketForm (TC-COMP-004)', () => {
  // C004-1: 빈 폼 렌더링 (생성 모드) → 빈 필드, 우선순위 MEDIUM 기본값
  it('C004-1: 생성 모드는 빈 필드와 우선순위 MEDIUM 기본값으로 렌더한다', () => {
    render(<TicketForm mode="create" onSubmit={noop} onCancel={noop} />);

    expect(screen.getByLabelText(/제목/)).toHaveValue('');
    expect(screen.getByLabelText(/설명/)).toHaveValue('');
    expect(screen.getByLabelText(/우선순위/)).toHaveValue(TICKET_PRIORITY.MEDIUM);
    expect(screen.getByLabelText(/시작예정일/)).toHaveValue('');
    expect(screen.getByLabelText(/종료예정일/)).toHaveValue('');
  });

  // C004-2: 기존 데이터 표시 (수정 모드) → initialData 반영
  it('C004-2: 수정 모드는 initialData 를 각 필드에 반영한다', () => {
    render(
      <TicketForm
        mode="edit"
        initialData={editTicket}
        onSubmit={noop}
        onCancel={noop}
      />,
    );

    expect(screen.getByLabelText(/제목/)).toHaveValue('기존 제목');
    expect(screen.getByLabelText(/설명/)).toHaveValue('기존 설명');
    expect(screen.getByLabelText(/우선순위/)).toHaveValue(TICKET_PRIORITY.HIGH);
    expect(screen.getByLabelText(/시작예정일/)).toHaveValue('2026-06-10');
    expect(screen.getByLabelText(/종료예정일/)).toHaveValue(FUTURE_DATE);
  });

  // C004-3: 빈 제목 제출 → "제목을 입력해주세요" 에러, onSubmit 미호출
  it('C004-3: 빈 제목으로 제출하면 "제목을 입력해주세요" 에러를 표시한다', async () => {
    const onSubmit = jest.fn();
    render(<TicketForm mode="create" onSubmit={onSubmit} onCancel={noop} />);

    fireEvent.click(screen.getByTestId('ticket-form-submit'));

    expect(await screen.findByText('제목을 입력해주세요')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // C004-4: 과거 종료예정일 → "종료예정일은 오늘 이후 날짜를 선택해주세요" 에러, onSubmit 미호출
  it('C004-4: 과거 종료예정일로 제출하면 날짜 에러를 표시한다', async () => {
    const onSubmit = jest.fn();
    render(<TicketForm mode="create" onSubmit={onSubmit} onCancel={noop} />);

    fireEvent.change(screen.getByLabelText(/제목/), {
      target: { value: '유효한 제목' },
    });
    fireEvent.change(screen.getByLabelText(/종료예정일/), {
      target: { value: PAST_DATE },
    });
    fireEvent.click(screen.getByTestId('ticket-form-submit'));

    expect(
      await screen.findByText('종료예정일은 오늘 이후 날짜를 선택해주세요'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // C004-5: 시작예정일(plannedStartDate) date input 렌더링
  it('C004-5: 시작예정일 date input 을 렌더한다', () => {
    render(<TicketForm mode="create" onSubmit={noop} onCancel={noop} />);

    const plannedStart = screen.getByLabelText(/시작예정일/);
    expect(plannedStart).toBeInTheDocument();
    expect(plannedStart).toHaveAttribute('type', 'date');
  });

  // C004-6: 정상 제출 → onSubmit 호출 + 전달 데이터 확인
  it('C004-6: 모든 필드 정상 입력 후 제출하면 입력값으로 onSubmit 을 호출한다', async () => {
    const onSubmit = jest.fn();
    render(<TicketForm mode="create" onSubmit={onSubmit} onCancel={noop} />);

    fireEvent.change(screen.getByLabelText(/제목/), {
      target: { value: '새 업무' },
    });
    fireEvent.change(screen.getByLabelText(/설명/), {
      target: { value: '업무 설명' },
    });
    fireEvent.change(screen.getByLabelText(/우선순위/), {
      target: { value: TICKET_PRIORITY.HIGH },
    });
    fireEvent.change(screen.getByLabelText(/시작예정일/), {
      target: { value: '2026-06-16' },
    });
    fireEvent.change(screen.getByLabelText(/종료예정일/), {
      target: { value: FUTURE_DATE },
    });

    fireEvent.click(screen.getByTestId('ticket-form-submit'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '새 업무',
        description: '업무 설명',
        priority: TICKET_PRIORITY.HIGH,
        plannedStartDate: '2026-06-16',
        dueDate: FUTURE_DATE,
      }),
    );
  });

  // C004-7: 로딩 상태 → 제출 버튼 비활성화
  it('C004-7: isLoading=true 면 제출 버튼이 비활성화된다', () => {
    render(
      <TicketForm mode="create" onSubmit={noop} onCancel={noop} isLoading />,
    );

    expect(screen.getByTestId('ticket-form-submit')).toBeDisabled();
  });
});
