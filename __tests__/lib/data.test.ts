import { 
  createBoard, 
  getBoardById, 
  getBoards,
  createColumn,
  getColumnsByBoardId,
  createCard,
  getCardsByColumnId,
  updateCardPosition 
} from '@/lib/data'
import { promises as fs } from 'fs'
import path from 'path'

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  }
}))

const mockFs = fs as jest.Mocked<typeof fs>

describe('Data layer functions', () => {
  const TEST_DATA_DIR = path.join(process.cwd(), 'data')
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful directory creation
    mockFs.mkdir.mockResolvedValue(undefined)
  })

  describe('Board operations', () => {
    const mockBoards = [
      {
        id: 'board1',
        title: 'Test Board',
        description: 'Test Description',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    describe('getBoards', () => {
      it('returns empty array when file does not exist', async () => {
        mockFs.readFile.mockRejectedValue(new Error('File not found'))
        
        const result = await getBoards()
        expect(result).toEqual([])
      })

      it('returns parsed boards from file', async () => {
        mockFs.readFile.mockResolvedValue(JSON.stringify(mockBoards))
        
        const result = await getBoards()
        expect(result).toEqual(mockBoards)
      })
    })

    describe('getBoardById', () => {
      it('returns null when board not found', async () => {
        mockFs.readFile.mockResolvedValue(JSON.stringify(mockBoards))
        
        const result = await getBoardById('nonexistent')
        expect(result).toBeNull()
      })

      it('returns board when found', async () => {
        mockFs.readFile.mockResolvedValue(JSON.stringify(mockBoards))
        
        const result = await getBoardById('board1')
        expect(result).toEqual(mockBoards[0])
      })
    })

    describe('createBoard', () => {
      it('creates and returns new board with generated id', async () => {
        mockFs.readFile.mockResolvedValue('[]')
        mockFs.writeFile.mockResolvedValue(undefined)
        
        const boardData = {
          title: 'New Board',
          description: 'New Description'
        }
        
        const result = await createBoard(boardData)
        
        expect(result).toMatchObject(boardData)
        expect(result.id).toBeDefined()
        expect(result.createdAt).toBeInstanceOf(Date)
        expect(mockFs.writeFile).toHaveBeenCalled()
      })
    })
  })

  describe('Card operations', () => {
    const mockCards = [
      {
        id: 'card1',
        title: 'Test Card',
        description: 'Test Description',
        columnId: 'col1',
        order: 0,
        priority: 'medium' as const,
        dueDate: '2024-01-20',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    describe('getCardsByColumnId', () => {
      it('returns filtered and sorted cards', async () => {
        const allCards = [
          { ...mockCards[0], order: 1 },
          { ...mockCards[0], id: 'card2', order: 0 },
          { ...mockCards[0], id: 'card3', columnId: 'col2', order: 0 }
        ]
        mockFs.readFile.mockResolvedValue(JSON.stringify(allCards))
        
        const result = await getCardsByColumnId('col1')
        
        expect(result).toHaveLength(2)
        expect(result[0].id).toBe('card2') // order 0 comes first
        expect(result[1].id).toBe('card1') // order 1 comes second
      })
    })

    describe('createCard', () => {
      it('creates card with correct order when column is empty', async () => {
        mockFs.readFile.mockResolvedValue('[]')
        mockFs.writeFile.mockResolvedValue(undefined)
        
        const cardData = {
          title: 'New Card',
          columnId: 'col1',
          priority: 'high' as const,
        }
        
        const result = await createCard(cardData)
        
        expect(result.order).toBe(0)
        expect(result.id).toBeDefined()
        expect(result.createdAt).toBeInstanceOf(Date)
      })

      it('creates card with incremented order when column has cards', async () => {
        const existingCards = [
          { ...mockCards[0], order: 0 },
          { ...mockCards[0], id: 'card2', order: 1 }
        ]
        mockFs.readFile.mockResolvedValue(JSON.stringify(existingCards))
        mockFs.writeFile.mockResolvedValue(undefined)
        
        const cardData = {
          title: 'New Card',
          columnId: 'col1',
          priority: 'high' as const,
        }
        
        const result = await createCard(cardData)
        
        expect(result.order).toBe(2)
      })
    })

    describe('updateCardPosition', () => {
      it('throws error when card not found', async () => {
        mockFs.readFile.mockResolvedValue('[]')
        
        await expect(updateCardPosition('nonexistent', 'col1', 0))
          .rejects.toThrow('Card not found')
      })

      it('updates card position and reorders others', async () => {
        const cards = [
          { ...mockCards[0], id: 'card1', order: 0 },
          { ...mockCards[0], id: 'card2', order: 1 },
          { ...mockCards[0], id: 'card3', order: 2 }
        ]
        mockFs.readFile.mockResolvedValue(JSON.stringify(cards))
        mockFs.writeFile.mockResolvedValue(undefined)
        
        await updateCardPosition('card3', 'col1', 1)
        
        expect(mockFs.writeFile).toHaveBeenCalled()
        
        // Verify the written data structure (the mock doesn't capture exact data)
        const writeCall = mockFs.writeFile.mock.calls[0]
        expect(writeCall[0]).toContain('cards.json')
        
        const writtenData = JSON.parse(writeCall[1] as string)
        const updatedCard = writtenData.find((c: any) => c.id === 'card3')
        expect(updatedCard.order).toBe(1)
      })
    })
  })
})