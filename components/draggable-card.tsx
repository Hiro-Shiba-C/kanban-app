'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType, Priority } from '@/lib/types';
import { Calendar, Flag, AlertTriangle } from 'lucide-react';
import { cn, isOverdue, getOverdueDays, formatOverdueText } from '@/lib/utils';

interface DraggableCardProps {
  card: CardType;
}

const priorityColors: Record<Priority, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

const priorityLabels: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '緊急',
};

export function DraggableCard({ card }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCardOverdue = card.dueDate ? isOverdue(card.dueDate) : false;
  const overdueDays = isCardOverdue ? getOverdueDays(card.dueDate!) : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-white rounded-lg p-3 shadow-sm cursor-grab',
        'hover:shadow-md transition-shadow duration-200',
        isDragging && 'opacity-50 shadow-lg scale-105',
        isCardOverdue ? 'border-2 border-red-500 bg-red-50' : 'border'
      )}
    >
      <h3 className="font-medium mb-2">{card.title}</h3>
      {card.description && (
        <p className="text-sm text-gray-600 mb-2">{card.description}</p>
      )}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Flag className={`h-3 w-3 ${priorityColors[card.priority]}`} />
          <span className={priorityColors[card.priority]}>
            {priorityLabels[card.priority]}
          </span>
        </div>
        {card.dueDate && (
          <div className={cn(
            "flex items-center gap-1",
            isCardOverdue ? "text-red-600" : "text-gray-500"
          )}>
            {isCardOverdue ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <Calendar className="h-3 w-3" />
            )}
            <span>
              {isCardOverdue 
                ? formatOverdueText(overdueDays)
                : new Date(card.dueDate).toLocaleDateString('ja-JP')
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
}