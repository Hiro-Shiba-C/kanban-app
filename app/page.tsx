import { BoardCreationForm } from '@/components/board-creation-form';
import { getBoards } from '@/lib/data';
import Link from 'next/link';

export default async function Home() {
  const boards = await getBoards();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">看板アプリ</h1>
          <BoardCreationForm />
        </div>
        
        {boards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">まだボードがありません</p>
            <p className="text-sm text-gray-400">「新規ボード作成」ボタンから最初のボードを作成しましょう</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/boards/${board.id}`}
                className="block p-6 border rounded-lg hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2">{board.title}</h2>
                {board.description && (
                  <p className="text-gray-600 text-sm mb-4">{board.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  作成日: {new Date(board.createdAt).toLocaleDateString('ja-JP')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
