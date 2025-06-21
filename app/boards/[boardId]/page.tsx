import { getBoardById, getColumnsByBoardId, getCardsByColumnId } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DraggableBoard } from '@/components/draggable-board';

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  
  const board = await getBoardById(boardId);
  if (!board) {
    notFound();
  }
  
  const columns = await getColumnsByBoardId(boardId);
  
  // 各カラムのカードを取得
  const columnsWithCards = await Promise.all(
    columns.map(async (column) => {
      const cards = await getCardsByColumnId(column.id);
      return { ...column, cards };
    })
  );
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{board.title}</h1>
            {board.description && (
              <p className="text-gray-600 mt-1">{board.description}</p>
            )}
          </div>
        </div>
        
        <DraggableBoard board={board} initialColumnsWithCards={columnsWithCards} />
        
        {columnsWithCards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">このボードにはまだカラムがありません</p>
          </div>
        )}
      </div>
    </div>
  );
}