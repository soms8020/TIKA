'use client';

// =============================================================
// 컴포넌트 프리뷰 갤러리 — http://localhost:3000/preview
//
// 목적: 프론트엔드 컴포넌트를 DB 연결 없이 목 데이터로 시각 확인.
// 사용: npm run dev → /preview 접속.
// 진행: Phase 개발 완료 → npm test(그린) → 이 페이지에서 화면 확인 → 다음 Phase.
//
// 추가 방법: 각 Phase 섹션의 TODO 주석 위치에 <Specimen>으로 컴포넌트를 넣는다.
// 목 데이터는 '@/client/mocks/tickets'에서 가져온다.
// =============================================================

import { useState, type ReactNode } from 'react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { Button } from '@/client/components/ui/Button';
import { PriorityBadge, DueDateBadge } from '@/client/components/ui/Badge';
import { Modal } from '@/client/components/ui/Modal';
import { ConfirmDialog } from '@/client/components/ui/ConfirmDialog';
import { TicketCard } from '@/client/components/ticket/TicketCard';
import { TicketForm } from '@/client/components/ticket/TicketForm';
import { TicketModal } from '@/client/components/ticket/TicketModal';
import { Board } from '@/client/components/board/Board';
import { mockTickets, mockBoard } from '@/client/mocks/tickets';
import type { TicketWithMeta } from '@/shared/types';

/** 개별 컴포넌트 1개를 라벨과 함께 보여주는 칸 */
function Specimen({
  title,
  description,
  wide = false,
  children,
}: {
  title: string;
  description?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border border-[var(--color-border)] bg-white p-4${
        wide ? ' md:col-span-2 xl:col-span-3' : ''
      }`}
    >
      <div className="mb-3">
        <p className="text-sm font-semibold">{title}</p>
        {description && (
          <p className="text-xs text-[var(--color-muted)]">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </div>
  );
}

/** Phase 단위 섹션 묶음 */
function GallerySection({
  phase,
  title,
  children,
}: {
  phase: string;
  title: string;
  children?: ReactNode;
}) {
  const isEmpty =
    children === undefined ||
    children === null ||
    (Array.isArray(children) && children.length === 0);

  return (
    <section className="mb-10">
      <header className="mb-4 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
        <span className="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
          {phase}
        </span>
        <h2 className="text-base font-bold">{title}</h2>
      </header>

      {isEmpty ? (
        <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-white/50 px-4 py-8 text-center text-sm text-[var(--color-muted)]">
          아직 추가된 컴포넌트가 없습니다. 이 Phase 구현 후 여기에 추가합니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {children}
        </div>
      )}
    </section>
  );
}

export default function PreviewPage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [confirmResult, setConfirmResult] = useState<string>('—');
  const [clickedTitle, setClickedTitle] = useState<string>('—');

  // Phase 3 — 티켓 생성 폼 모달
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [createResult, setCreateResult] = useState<string>('—');

  // Phase 3 — 카드 클릭 시 여는 상세/수정 모달
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMeta | null>(
    null,
  );
  const [modalAction, setModalAction] = useState<string>('—');

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Tika 컴포넌트 프리뷰</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          목 데이터로 컴포넌트를 시각 확인하는 갤러리. DB 연결 불필요. (
          <code>/preview</code>)
        </p>
      </header>

      {/* Phase 1 — 원자(Atoms) */}
      <GallerySection phase="Phase 1" title="원자 컴포넌트 (Atoms)">
        <Specimen
          title="Button — variant"
          description="primary / secondary / danger / ghost"
        >
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
        </Specimen>

        <Specimen
          title="Button — isLoading"
          description="로딩 시 비활성 + '처리중...' 표시"
        >
          <Button onClick={() => {}}>일반</Button>
          <Button isLoading onClick={() => {}}>
            저장
          </Button>
          <Button variant="danger" isLoading onClick={() => {}}>
            삭제
          </Button>
        </Specimen>

        <Specimen title="Badge" description="우선순위 뱃지 + 종료예정일 칩">
          <PriorityBadge priority="LOW" />
          <PriorityBadge priority="MEDIUM" />
          <PriorityBadge priority="HIGH" />
          <DueDateBadge date="2026-06-20" />
          <DueDateBadge date="2026-06-01" isOverdue />
        </Specimen>

        <Specimen
          title="Modal"
          description="버튼으로 열기/닫기 (ESC·바깥 클릭으로도 닫힘)"
        >
          <Button onClick={() => setModalOpen(true)}>모달 열기</Button>
          <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
            <div className="p-6">
              <h3 className="text-lg font-bold">모달 제목</h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                ESC 키, 바깥(오버레이) 클릭, 아래 닫기 버튼으로 닫을 수 있습니다.
                패널 내부 클릭으로는 닫히지 않습니다.
              </p>
              <div className="mt-4 flex justify-end">
                <Button variant="secondary" onClick={() => setModalOpen(false)}>
                  닫기
                </Button>
              </div>
            </div>
          </Modal>
        </Specimen>

        <Specimen
          title="ConfirmDialog"
          description="버튼으로 열기 → 확인/취소 결과 표시"
        >
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            삭제 다이얼로그 열기
          </Button>
          <span className="text-xs text-[var(--color-muted)]">
            마지막 동작: {confirmResult}
          </span>
          {isConfirmOpen && (
            <ConfirmDialog
              message="정말 삭제하시겠습니까?"
              onConfirm={() => {
                setConfirmResult('확인(onConfirm)');
                setConfirmOpen(false);
              }}
              onCancel={() => {
                setConfirmResult('취소(onCancel)');
                setConfirmOpen(false);
              }}
            />
          )}
        </Specimen>
      </GallerySection>

      {/* Phase 2 — 티켓 분자 */}
      <GallerySection phase="Phase 2" title="티켓 분자 (Molecules)">
        <Specimen
          title="TicketCard"
          description="HIGH / 오버듀 / 완료(DONE) 카드"
          wide
        >
          {/* useSortable 사용 → DndContext/SortableContext로 감싼다 */}
          <DndContext>
            <SortableContext items={mockTickets.map((t) => t.id)}>
              <div className="flex flex-wrap gap-3">
                {[mockTickets[0], mockTickets[2], mockTickets[6]].map((t) => (
                  <div key={t.id} className="w-64">
                    <TicketCard
                      ticket={t}
                      onClick={() => setClickedTitle(t.title)}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <span className="w-full text-xs text-[var(--color-muted)]">
            마지막 클릭: {clickedTitle}
          </span>
        </Specimen>

        <Specimen
          title="TicketForm (생성)"
          description='"티켓 생성" 버튼 → Modal + TicketForm(mode="create")'
        >
          <Button onClick={() => setCreateOpen(true)}>티켓 생성</Button>
          <span className="text-xs text-[var(--color-muted)]">
            마지막 제출: {createResult}
          </span>
          <Modal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)}>
            <div className="p-6">
              <h3 className="mb-4 text-lg font-bold">새 티켓 생성</h3>
              <TicketForm
                mode="create"
                onSubmit={(data) => {
                  setCreateResult(JSON.stringify(data));
                  setCreateOpen(false);
                }}
                onCancel={() => setCreateOpen(false)}
              />
            </div>
          </Modal>
        </Specimen>
      </GallerySection>

      {/* Phase 3 — 섹션 */}
      <GallerySection phase="Phase 3" title="섹션 (Sections)">
        {/* TODO Phase 3 */}
      </GallerySection>

      {/* Phase 4 — DnD 컨테이너 */}
      <GallerySection phase="Phase 4" title="DnD 컨테이너 (Containers)">
        <Specimen
          title="Board — 4칼럼 레이아웃"
          description="Backlog 사이드바 + TODO / In Progress / Done (mockBoard)"
          wide
        >
          <div className="w-full">
            <Board
              board={mockBoard}
              onTicketClick={(t) => {
                setClickedTitle(t.title);
                setSelectedTicket(t);
              }}
            />
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              카드를 클릭하면 상세/수정 모달(TicketModal)이 열립니다. 마지막 동작:{' '}
              {modalAction}
            </p>
          </div>
        </Specimen>
      </GallerySection>

      {/* Phase 5 — 상태/오케스트레이션 */}
      <GallerySection phase="Phase 5" title="오케스트레이션 (Orchestration)">
        {/* TODO Phase 5 */}
      </GallerySection>

      {/* 카드 클릭으로 열리는 상세/수정 모달 (TicketModal) */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          isOpen
          onClose={() => setSelectedTicket(null)}
          onUpdate={(id, data) => {
            setModalAction(`수정 #${id}: ${JSON.stringify(data)}`);
            setSelectedTicket(null);
          }}
          onDelete={(id) => {
            setModalAction(`삭제 #${id}`);
            setSelectedTicket(null);
          }}
        />
      )}
    </main>
  );
}
