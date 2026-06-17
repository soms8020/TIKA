// 홈 — 서버 컴포넌트. 서버에서 보드 데이터를 조회해 BoardContainer 에 주입한다.
// 명세: COMPONENT_SPEC §1 계층, FRONTEND_TASKS 6.1, FR-001/002
import { getBoard } from '@/server/services/ticketService';
import { BoardContainer } from '@/client/components/board/BoardContainer';

export default async function Home() {
  const { board } = await getBoard();
  return (
    <main className="min-h-screen">
      <BoardContainer initialData={board} />
    </main>
  );
}
