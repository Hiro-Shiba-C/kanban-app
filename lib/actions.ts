'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createBoard, createDefaultColumns } from './data';

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