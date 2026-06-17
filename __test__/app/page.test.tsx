// app/page.tsx — 서버 컴포넌트 통합(경량) 테스트 (FRONTEND_TASKS 6.1)
// ticketService/BoardContainer 는 mock 으로 대체 (DB 접근/실제 렌더 회피)
import { render, screen } from '@testing-library/react';
import type { BoardData } from '@/shared/types';

jest.mock('@/server/services/ticketService', () => ({
  getBoard: jest.fn(),
}));
import { getBoard } from '@/server/services/ticketService';

jest.mock('@/client/components/board/BoardContainer', () => ({
  BoardContainer: (props: { initialData: BoardData }) => (
    <div
      data-testid="board-container"
      data-todo={props.initialData.TODO.length}
      data-backlog={props.initialData.BACKLOG.length}
    />
  ),
}));

import Home from '@/app/page';

const mockedGetBoard = getBoard as jest.MockedFunction<typeof getBoard>;

it('서버에서 ticketService.getBoard 로 조회한 board 를 BoardContainer 에 전달한다', async () => {
  const board: BoardData = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };
  // TODO 2건/Backlog 1건으로 전달 여부 확인
  board.TODO = [{} as never, {} as never];
  board.BACKLOG = [{} as never];
  mockedGetBoard.mockResolvedValue({ board, total: 3 });

  render(await Home());

  const container = screen.getByTestId('board-container');
  expect(mockedGetBoard).toHaveBeenCalledTimes(1);
  expect(container).toHaveAttribute('data-todo', '2');
  expect(container).toHaveAttribute('data-backlog', '1');
});
