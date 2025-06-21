'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createBoard, createDefaultColumns, createCard, updateCardPosition } from './data';
import { Priority } from './types';

export async function createBoardAction(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  
  if (!title?.trim()) {
    throw new Error('タイトルは必須です');
  }
  
  let boardId: string;
  
  try {
    console.log('Creating board with title:', title);
    
    const board = await createBoard({
      title: title.trim(),
      description: description?.trim() || undefined,
    });
    
    console.log('Board created:', board);
    boardId = board.id;
    
    await createDefaultColumns(board.id);
    
    console.log('Default columns created for board:', board.id);
    
    revalidatePath('/');
  } catch (error) {
    console.error('Error creating board:', error);
    if (error instanceof Error) {
      throw new Error(`ボードの作成に失敗しました: ${error.message}`);
    }
    throw new Error('ボードの作成に失敗しました');
  }
  
  // redirect を try-catch の外で実行
  redirect(`/boards/${boardId}`);
}

export async function createCardAction(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const columnId = formData.get('columnId') as string;
  const priority = formData.get('priority') as Priority;
  const dueDate = formData.get('dueDate') as string;
  const boardId = formData.get('boardId') as string;
  
  if (!title?.trim()) {
    throw new Error('タイトルは必須です');
  }
  
  if (!columnId) {
    throw new Error('カラムIDが必要です');
  }
  
  try {
    await createCard({
      title: title.trim(),
      description: description?.trim() || undefined,
      columnId,
      priority: priority || 'medium',
      dueDate: dueDate || undefined,
    });
    
    revalidatePath(`/boards/${boardId}`);
  } catch (error) {
    console.error('Error creating card:', error);
    if (error instanceof Error) {
      throw new Error(`タスクの作成に失敗しました: ${error.message}`);
    }
    throw new Error('タスクの作成に失敗しました');
  }
}

export async function moveCardAction(cardId: string, newColumnId: string, newOrder: number, boardId: string) {
  if (!cardId || !newColumnId || newOrder < 0 || !boardId) {
    throw new Error('無効なパラメータです');
  }
  
  try {
    await updateCardPosition(cardId, newColumnId, newOrder);
    revalidatePath(`/boards/${boardId}`);
  } catch (error) {
    console.error('Error moving card:', error);
    if (error instanceof Error) {
      throw new Error(`カードの移動に失敗しました: ${error.message}`);
    }
    throw new Error('カードの移動に失敗しました');
  }
}