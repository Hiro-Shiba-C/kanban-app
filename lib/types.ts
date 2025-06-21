export interface Board {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
}

export interface Column {
  id: string;
  title: string;
  boardId: string;
  order: number;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  order: number;
  createdAt: Date;
}