import { Board, Column, Card } from './types';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOARDS_FILE = path.join(DATA_DIR, 'boards.json');
const COLUMNS_FILE = path.join(DATA_DIR, 'columns.json');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function getBoards(): Promise<Board[]> {
  return readJsonFile<Board>(BOARDS_FILE);
}

export async function getBoardById(id: string): Promise<Board | null> {
  const boards = await getBoards();
  return boards.find(board => board.id === id) || null;
}

export async function createBoard(board: Omit<Board, 'id' | 'createdAt'>): Promise<Board> {
  try {
    await ensureDataDir();
    const boards = await getBoards();
    const newBoard: Board = {
      ...board,
      id: generateId(),
      createdAt: new Date(),
    };
    
    boards.push(newBoard);
    await writeJsonFile(BOARDS_FILE, boards);
    
    return newBoard;
  } catch (error) {
    console.error('Error in createBoard:', error);
    throw error;
  }
}

export async function getColumnsByBoardId(boardId: string): Promise<Column[]> {
  const columns = await readJsonFile<Column>(COLUMNS_FILE);
  return columns.filter(column => column.boardId === boardId).sort((a, b) => a.order - b.order);
}

export async function createColumn(column: Omit<Column, 'id'>): Promise<Column> {
  try {
    await ensureDataDir();
    const columns = await readJsonFile<Column>(COLUMNS_FILE);
    const newColumn: Column = {
      ...column,
      id: generateId(),
    };
    
    columns.push(newColumn);
    await writeJsonFile(COLUMNS_FILE, columns);
    
    return newColumn;
  } catch (error) {
    console.error('Error in createColumn:', error);
    throw error;
  }
}

export async function createDefaultColumns(boardId: string): Promise<Column[]> {
  const defaultColumns = [
    { title: 'To Do', boardId, order: 0 },
    { title: 'In Progress', boardId, order: 1 },
    { title: 'Done', boardId, order: 2 },
  ];
  
  const columns = [];
  for (const columnData of defaultColumns) {
    const column = await createColumn(columnData);
    columns.push(column);
  }
  
  return columns;
}

export async function getCardsByColumnId(columnId: string): Promise<Card[]> {
  const cards = await readJsonFile<Card>(CARDS_FILE);
  return cards.filter(card => card.columnId === columnId).sort((a, b) => a.order - b.order);
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}