// TicketForm — 티켓 생성/수정 폼 (COMPONENT_SPEC §2.8, TC-COMP-004)
// 검증: src/shared/validations/ticket.ts 의 createTicketSchema 로 클라이언트 사이드 검증
// 스타일: globals.css 의 .ticket-form / .field / .field-label / .field-input
//         / .field-textarea / .field-error / .form-actions
'use client';

import { useState, type FormEvent } from 'react';
import {
  TICKET_PRIORITY,
  type Ticket,
  type TicketPriority,
  type CreateTicketInput,
  type UpdateTicketInput,
} from '@/shared/types';
import { createTicketSchema } from '@/shared/validations/ticket';
import { Button } from '@/client/components/ui/Button';

type Mode = 'create' | 'edit';

interface TicketFormProps {
  mode: Mode;
  initialData?: Partial<Ticket>;
  onSubmit: (data: CreateTicketInput | UpdateTicketInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type FieldName = 'title' | 'description' | 'priority' | 'plannedStartDate' | 'dueDate';
type FieldErrors = Partial<Record<FieldName, string>>;

export const TicketForm = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: TicketFormProps) => {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [priority, setPriority] = useState<TicketPriority>(
    initialData?.priority ?? TICKET_PRIORITY.MEDIUM,
  );
  const [plannedStartDate, setPlannedStartDate] = useState(
    initialData?.plannedStartDate ?? '',
  );
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 옵션 필드는 값이 있을 때만 검증 대상에 포함 (빈 값은 미입력으로 취급)
    const candidate: CreateTicketInput = { title, priority };
    if (description.trim() !== '') candidate.description = description;
    if (plannedStartDate !== '') candidate.plannedStartDate = plannedStartDate;
    if (dueDate !== '') candidate.dueDate = dueDate;

    const result = createTicketSchema.safeParse(candidate);
    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as FieldName | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    onSubmit(result.data);
  };

  return (
    <form className="ticket-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="field-label" htmlFor="ticket-title">
          제목
        </label>
        <input
          id="ticket-title"
          className="field-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {errors.title && <p className="field-error">{errors.title}</p>}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="ticket-description">
          설명
        </label>
        <textarea
          id="ticket-description"
          className="field-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {errors.description && (
          <p className="field-error">{errors.description}</p>
        )}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="ticket-priority">
          우선순위
        </label>
        <select
          id="ticket-priority"
          className="field-input"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TicketPriority)}
        >
          <option value={TICKET_PRIORITY.LOW}>낮음</option>
          <option value={TICKET_PRIORITY.MEDIUM}>보통</option>
          <option value={TICKET_PRIORITY.HIGH}>높음</option>
        </select>
        {errors.priority && <p className="field-error">{errors.priority}</p>}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="ticket-planned-start">
          시작예정일
        </label>
        <input
          id="ticket-planned-start"
          className="field-input"
          type="date"
          value={plannedStartDate}
          onChange={(e) => setPlannedStartDate(e.target.value)}
        />
        {errors.plannedStartDate && (
          <p className="field-error">{errors.plannedStartDate}</p>
        )}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="ticket-due-date">
          종료예정일
        </label>
        <input
          id="ticket-due-date"
          className="field-input"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        {errors.dueDate && <p className="field-error">{errors.dueDate}</p>}
      </div>

      <div className="form-actions">
        <Button
          variant="secondary"
          onClick={onCancel}
          data-testid="ticket-form-cancel"
        >
          취소
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          data-testid="ticket-form-submit"
        >
          {mode === 'create' ? '생성' : '수정'}
        </Button>
      </div>
    </form>
  );
};
