import { z } from 'zod';

// POST /api/tickets 생성 검증 스키마.
// 단일 출처: docs/API_SPEC.md §검증 스키마. 프론트 폼과 백엔드 API가 공유한다.
export const createTicketSchema = z.object({
  title: z
    .string({
      required_error: '제목을 입력해주세요',
      invalid_type_error: '제목을 입력해주세요',
    })
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이내로 입력해주세요')
    .refine((val) => val.trim().length > 0, '제목을 입력해주세요'),
  description: z
    .string()
    .max(1000, '설명은 1000자 이내로 입력해주세요')
    .optional(),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH'], {
      errorMap: () => ({
        message: '우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요',
      }),
    })
    .optional(),
  plannedStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(
      (val) => val >= new Date().toISOString().split('T')[0],
      '종료예정일은 오늘 이후 날짜를 선택해주세요'
    )
    .optional(),
});

// PATCH /api/tickets/:id 수정 검증 스키마 (모든 필드 선택, description/날짜는 null 허용)
export const updateTicketSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이내로 입력해주세요')
    .refine((val) => val.trim().length > 0, '제목을 입력해주세요')
    .optional(),
  description: z
    .string()
    .max(1000, '설명은 1000자 이내로 입력해주세요')
    .nullable()
    .optional(),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH'], {
      errorMap: () => ({
        message: '우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요',
      }),
    })
    .optional(),
  plannedStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(
      (val) => !val || val >= new Date().toISOString().split('T')[0],
      '종료예정일은 오늘 이후 날짜를 선택해주세요'
    )
    .nullable()
    .optional(),
});

// PATCH /api/tickets/reorder 순서 변경 검증 스키마 (DONE은 허용하지 않음)
export const reorderTicketSchema = z.object({
  ticketId: z.number().int().positive(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS'], {
    errorMap: () => ({
      message: '상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요',
    }),
  }),
  position: z.number().int(),
});
