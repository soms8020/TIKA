import { NextResponse } from 'next/server';

// 통일된 에러 응답 형식 — docs/API_SPEC.md §공통 규칙, 헌법 III.
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TICKET_NOT_FOUND: 'TICKET_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
  };
}

// { error: { code, message } } 형식의 에러 응답을 생성한다.
export function errorResponse(
  status: number,
  code: ErrorCode,
  message: string
): NextResponse<ErrorBody> {
  return NextResponse.json({ error: { code, message } }, { status });
}
