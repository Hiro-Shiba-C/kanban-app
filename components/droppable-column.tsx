'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Card as CardType } from '@/lib/types';
import { DraggableCard } from './draggable-card';
import { AddTaskButton } from './add-task-button';
import { cn } from '@/lib/utils';

interface DroppableColumnProps {
  column: Column;
  cards: CardType[];
  boardId: string;
}

export function DroppableColumn({ column, cards, boardId }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  return (
    <div className="flex-shrink-0 w-80">
      <div
        ref={setNodeRef}
        className={cn(
          'bg-gray-100 rounded-lg p-4 h-fit transition-colors duration-200',
          isOver && 'bg-blue-50 ring-2 ring-blue-300'
        )}
      >
        <h2 className="font-semibold text-lg mb-4">{column.title}</h2>
        
        <SortableContext items={cards.map(card => card.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 mb-4 min-h-[100px]">
            {cards.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                カードはまだありません
              </div>
            ) : (
              cards.map((card) => (
                <DraggableCard key={card.id} card={card} />
              ))
            )}
          </div>
        </SortableContext>
        
        <AddTaskButton columnId={column.id} boardId={boardId} />
      </div>
    </div>
  );
}