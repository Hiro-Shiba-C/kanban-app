'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { TaskForm } from '@/components/task-form';

interface AddTaskButtonProps {
  columnId: string;
  boardId: string;
}

export function AddTaskButton({ columnId, boardId }: AddTaskButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full flex items-center gap-2">
          <Plus className="h-4 w-4" />
          タスクを追加
        </Button>
      </DialogTrigger>
      <TaskForm columnId={columnId} boardId={boardId} onSuccess={handleSuccess} />
    </Dialog>
  );
}