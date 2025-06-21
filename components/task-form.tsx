'use client';

import { createCardAction } from '@/lib/actions';
import { Priority } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';

interface TaskFormProps {
  columnId: string;
  boardId: string;
  onSuccess?: () => void;
}

const priorityLabels: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '緊急',
};

export function TaskForm({ columnId, boardId, onSuccess }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      await createCardAction(formData);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('タスクの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>タスクを追加</DialogTitle>
      </DialogHeader>
      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="columnId" value={columnId} />
        <input type="hidden" name="boardId" value={boardId} />
        
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            タイトル <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            name="title"
            placeholder="タスクのタイトルを入力"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            説明
          </label>
          <Textarea
            id="description"
            name="description"
            placeholder="タスクの説明を入力（任意）"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium">
            優先度
          </label>
          <Select
            id="priority"
            name="priority"
            defaultValue="medium"
            disabled={isLoading}
          >
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="dueDate" className="text-sm font-medium">
            期限
          </label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '作成中...' : 'タスクを作成'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}