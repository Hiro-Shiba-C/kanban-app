import { getBoardById, getColumnsByBoardId } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        
        <div className="flex gap-6 overflow-x-auto">
          {columns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className="bg-gray-100 rounded-lg p-4">
                <h2 className="font-semibold text-lg mb-4">{column.title}</h2>
                <div className="space-y-3">
                  <div className="text-center py-8 text-gray-500 text-sm">
                    カードはまだありません
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {columns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">このボードにはまだカラムがありません</p>
          </div>
        )}
      </div>
    </div>
  );
}