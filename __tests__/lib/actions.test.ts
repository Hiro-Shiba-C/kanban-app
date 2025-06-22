import { 
  createBoardAction, 
  createCardAction, 
  moveCardAction 
} from '@/lib/actions'
import { 
  createBoard, 
  createDefaultColumns, 
  createCard, 
  updateCardPosition 
} from '@/lib/data'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/data')
jest.mock('next/cache')
jest.mock('next/navigation')

const mockCreateBoard = createBoard as jest.MockedFunction<typeof createBoard>
const mockCreateDefaultColumns = createDefaultColumns as jest.MockedFunction<typeof createDefaultColumns>
const mockCreateCard = createCard as jest.MockedFunction<typeof createCard>
const mockUpdateCardPosition = updateCardPosition as jest.MockedFunction<typeof updateCardPosition>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>

describe('Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console logs in tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('createBoardAction', () => {
    const createFormData = (data: Record<string, string>) => {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })
      return formData
    }

    it('creates board with title and description', async () => {
      const mockBoard = {
        id: 'board-123',
        title: 'Test Board',
        description: 'Test Description',
        createdAt: new Date(),
      }

      mockCreateBoard.mockResolvedValue(mockBoard)
      mockCreateDefaultColumns.mockResolvedValue([])

      const formData = createFormData({
        title: 'Test Board',
        description: 'Test Description',
      })

      await createBoardAction(formData)

      expect(mockCreateBoard).toHaveBeenCalledWith({
        title: 'Test Board',
        description: 'Test Description',
      })
      expect(mockCreateDefaultColumns).toHaveBeenCalledWith('board-123')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/')
      expect(mockRedirect).toHaveBeenCalledWith('/boards/board-123')
    })

    it('creates board with only title', async () => {
      const mockBoard = {
        id: 'board-456',
        title: 'Title Only Board',
        createdAt: new Date(),
      }

      mockCreateBoard.mockResolvedValue(mockBoard)
      mockCreateDefaultColumns.mockResolvedValue([])

      const formData = createFormData({
        title: 'Title Only Board',
        description: '',
      })

      await createBoardAction(formData)

      expect(mockCreateBoard).toHaveBeenCalledWith({
        title: 'Title Only Board',
        description: undefined,
      })
    })

    it('trims whitespace from inputs', async () => {
      const mockBoard = {
        id: 'board-789',
        title: 'Trimmed Board',
        description: 'Trimmed Description',
        createdAt: new Date(),
      }

      mockCreateBoard.mockResolvedValue(mockBoard)
      mockCreateDefaultColumns.mockResolvedValue([])

      const formData = createFormData({
        title: '  Trimmed Board  ',
        description: '  Trimmed Description  ',
      })

      await createBoardAction(formData)

      expect(mockCreateBoard).toHaveBeenCalledWith({
        title: 'Trimmed Board',
        description: 'Trimmed Description',
      })
    })

    it('throws error when title is empty', async () => {
      const formData = createFormData({
        title: '',
        description: 'Some description',
      })

      await expect(createBoardAction(formData)).rejects.toThrow('タイトルは必須です')
      expect(mockCreateBoard).not.toHaveBeenCalled()
    })

    it('throws error when title is only whitespace', async () => {
      const formData = createFormData({
        title: '   ',
        description: 'Some description',
      })

      await expect(createBoardAction(formData)).rejects.toThrow('タイトルは必須です')
      expect(mockCreateBoard).not.toHaveBeenCalled()
    })

    it('handles board creation error', async () => {
      mockCreateBoard.mockRejectedValue(new Error('Database error'))

      const formData = createFormData({
        title: 'Error Board',
        description: 'This will fail',
      })

      await expect(createBoardAction(formData)).rejects.toThrow(
        'ボードの作成に失敗しました: Database error'
      )
      expect(mockCreateDefaultColumns).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('handles default columns creation error', async () => {
      const mockBoard = {
        id: 'board-error',
        title: 'Board with Column Error',
        createdAt: new Date(),
      }

      mockCreateBoard.mockResolvedValue(mockBoard)
      mockCreateDefaultColumns.mockRejectedValue(new Error('Column creation failed'))

      const formData = createFormData({
        title: 'Board with Column Error',
      })

      await expect(createBoardAction(formData)).rejects.toThrow(
        'ボードの作成に失敗しました: Column creation failed'
      )
      expect(mockRevalidatePath).not.toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
    })
  })

  describe('createCardAction', () => {
    const createFormData = (data: Record<string, string>) => {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })
      return formData
    }

    it('creates card with all fields', async () => {
      const mockCard = {
        id: 'card-123',
        title: 'Test Card',
        description: 'Test Description',
        columnId: 'col-1',
        priority: 'high' as const,
        dueDate: '2024-12-31',
        order: 0,
        createdAt: new Date(),
      }

      mockCreateCard.mockResolvedValue(mockCard)

      const formData = createFormData({
        title: 'Test Card',
        description: 'Test Description',
        columnId: 'col-1',
        priority: 'high',
        dueDate: '2024-12-31',
        boardId: 'board-1',
      })

      await createCardAction(formData)

      expect(mockCreateCard).toHaveBeenCalledWith({
        title: 'Test Card',
        description: 'Test Description',
        columnId: 'col-1',
        priority: 'high',
        dueDate: '2024-12-31',
      })
      expect(mockRevalidatePath).toHaveBeenCalledWith('/boards/board-1')
    })

    it('creates card with only required fields', async () => {
      const mockCard = {
        id: 'card-456',
        title: 'Minimal Card',
        columnId: 'col-2',
        priority: 'medium' as const,
        order: 0,
        createdAt: new Date(),
      }

      mockCreateCard.mockResolvedValue(mockCard)

      const formData = createFormData({
        title: 'Minimal Card',
        description: '',
        columnId: 'col-2',
        priority: '',
        dueDate: '',
        boardId: 'board-2',
      })

      await createCardAction(formData)

      expect(mockCreateCard).toHaveBeenCalledWith({
        title: 'Minimal Card',
        description: undefined,
        columnId: 'col-2',
        priority: 'medium',
        dueDate: undefined,
      })
    })

    it('throws error when title is empty', async () => {
      const formData = createFormData({
        title: '',
        columnId: 'col-1',
        boardId: 'board-1',
      })

      await expect(createCardAction(formData)).rejects.toThrow('タイトルは必須です')
      expect(mockCreateCard).not.toHaveBeenCalled()
    })

    it('throws error when columnId is missing', async () => {
      const formData = createFormData({
        title: 'Card without column',
        columnId: '',
        boardId: 'board-1',
      })

      await expect(createCardAction(formData)).rejects.toThrow('カラムIDが必要です')
      expect(mockCreateCard).not.toHaveBeenCalled()
    })

    it('handles card creation error', async () => {
      mockCreateCard.mockRejectedValue(new Error('Card creation failed'))

      const formData = createFormData({
        title: 'Error Card',
        columnId: 'col-1',
        boardId: 'board-1',
      })

      await expect(createCardAction(formData)).rejects.toThrow(
        'タスクの作成に失敗しました: Card creation failed'
      )
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('moveCardAction', () => {
    it('moves card successfully', async () => {
      mockUpdateCardPosition.mockResolvedValue(undefined)

      await moveCardAction('card-1', 'col-2', 1, 'board-1')

      expect(mockUpdateCardPosition).toHaveBeenCalledWith('card-1', 'col-2', 1)
      expect(mockRevalidatePath).toHaveBeenCalledWith('/boards/board-1')
    })

    it('throws error for invalid parameters', async () => {
      await expect(moveCardAction('', 'col-1', 0, 'board-1')).rejects.toThrow(
        '無効なパラメータです'
      )

      await expect(moveCardAction('card-1', '', 0, 'board-1')).rejects.toThrow(
        '無効なパラメータです'
      )

      await expect(moveCardAction('card-1', 'col-1', -1, 'board-1')).rejects.toThrow(
        '無効なパラメータです'
      )

      await expect(moveCardAction('card-1', 'col-1', 0, '')).rejects.toThrow(
        '無効なパラメータです'
      )

      expect(mockUpdateCardPosition).not.toHaveBeenCalled()
    })

    it('handles move card error', async () => {
      mockUpdateCardPosition.mockRejectedValue(new Error('Position update failed'))

      await expect(moveCardAction('card-1', 'col-1', 0, 'board-1')).rejects.toThrow(
        'カードの移動に失敗しました: Position update failed'
      )
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('handles unknown error type', async () => {
      mockUpdateCardPosition.mockRejectedValue('Unknown error')

      await expect(moveCardAction('card-1', 'col-1', 0, 'board-1')).rejects.toThrow(
        'カードの移動に失敗しました'
      )
    })
  })
})