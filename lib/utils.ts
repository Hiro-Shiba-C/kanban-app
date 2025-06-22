import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isOverdue(dueDate: string): boolean {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  
  // 時間を0:00:00に設定して日付のみで比較
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  return due < today;
}

export function getOverdueDays(dueDate: string): number {
  if (!dueDate) return 0;
  const today = new Date();
  const due = new Date(dueDate);
  
  // 時間を0:00:00に設定して日付のみで比較
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatOverdueText(days: number): string {
  if (days === 1) {
    return '1日前に期限切れ';
  }
  return `${days}日前に期限切れ`;
}