'use client';

import { useState, useOptimistic } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Board, Column, Card as CardType } from '@/lib/types';
import { DroppableColumn } from './droppable-column';
import { DraggableCard } from './draggable-card';
import { moveCardAction } from '@/lib/actions';

interface DraggableBoardProps {
  board: Board;
  initialColumnsWithCards: Array<Column & { cards: CardType[] }>;
}

export function DraggableBoard({ board, initialColumnsWithCards }: DraggableBoardProps) {
  const [columnsWithCards, setColumnsWithCards] = useOptimistic(
    initialColumnsWithCards,
    (state, { cardId, sourceColumnId, destColumnId, destIndex }: {
      cardId: string;
      sourceColumnId: string;
      destColumnId: string;
      destIndex: number;
    }) => {
      const newState = state.map(column => ({ ...column, cards: [...column.cards] }));
      
      // ドラッグされたカードを見つける
      let draggedCard: CardType | null = null;
      const sourceColumn = newState.find(col => col.id === sourceColumnId);
      if (sourceColumn) {
        const cardIndex = sourceColumn.cards.findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
          draggedCard = sourceColumn.cards.splice(cardIndex, 1)[0];
        }
      }
      
      // 目標カラムにカードを挿入
      if (draggedCard) {
        const destColumn = newState.find(col => col.id === destColumnId);
        if (destColumn) {
          draggedCard.columnId = destColumnId;
          destColumn.cards.splice(destIndex, 0, draggedCard);
          
          // order値を更新
          destColumn.cards.forEach((card, index) => {
            card.order = index;
          });
        }
      }
      
      return newState;
    }
  );

  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'card') {
      setActiveCard(active.data.current.card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType !== 'card') return;

    // カードが他のカラムの上にある場合
    if (overType === 'column') {
      const activeCard = active.data.current?.card;
      const overColumn = over.data.current?.column;
      
      if (!activeCard || !overColumn || activeCard.columnId === overColumn.id) return;

      setColumnsWithCards({
        cardId: activeCard.id,
        sourceColumnId: activeCard.columnId,
        destColumnId: overColumn.id,
        destIndex: 0,
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeType = active.data.current?.type;
    if (activeType !== 'card') return;

    const activeCard = active.data.current?.card;
    if (!activeCard) return;

    let destColumnId = activeCard.columnId;
    let destIndex = 0;

    // ドロップ先の情報を取得
    if (over.data.current?.type === 'column') {
      destColumnId = over.data.current.column.id;
      destIndex = 0;
    } else if (over.data.current?.type === 'card') {
      const overCard = over.data.current.card;
      destColumnId = overCard.columnId;
      
      // 同じカラム内でのドロップの場合、正確な位置を計算
      const destColumn = columnsWithCards.find(col => col.id === destColumnId);
      if (destColumn) {
        const overIndex = destColumn.cards.findIndex(card => card.id === overCard.id);
        destIndex = overIndex;
        
        // 同じカラム内で上から下に移動する場合
        if (activeCard.columnId === destColumnId) {
          const activeIndex = destColumn.cards.findIndex(card => card.id === activeCard.id);
          if (activeIndex < overIndex) {
            destIndex = overIndex;
          }
        }
      }
    }

    // 位置が変わらない場合は何もしない
    const sourceColumn = columnsWithCards.find(col => col.id === activeCard.columnId);
    if (sourceColumn && activeCard.columnId === destColumnId) {
      const currentIndex = sourceColumn.cards.findIndex(card => card.id === activeCard.id);
      if (currentIndex === destIndex) return;
    }

    try {
      // 楽観的更新
      setColumnsWithCards({
        cardId: activeCard.id,
        sourceColumnId: activeCard.columnId,
        destColumnId,
        destIndex,
      });

      // サーバーアクションを実行
      await moveCardAction(activeCard.id, destColumnId, destIndex, board.id);
    } catch (error) {
      console.error('Error moving card:', error);
      // エラーが発生した場合、楽観的更新をロールバック
      setColumnsWithCards(initialColumnsWithCards);
      alert('カードの移動に失敗しました');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto">
        {columnsWithCards.map((column) => (
          <DroppableColumn
            key={column.id}
            column={column}
            cards={column.cards}
            boardId={board.id}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && <DraggableCard card={activeCard} />}
      </DragOverlay>
    </DndContext>
  );
}