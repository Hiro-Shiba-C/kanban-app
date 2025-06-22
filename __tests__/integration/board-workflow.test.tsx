import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BoardCreationForm } from '@/components/board-creation-form'
import { AddTaskButton } from '@/components/add-task-button'
import { createBoardAction, createCardAction } from '@/lib/actions'

// Mock server actions
jest.mock('@/lib/actions')
const mockCreateBoardAction = createBoardAction as jest.MockedFunction<typeof createBoardAction>
const mockCreateCardAction = createCardAction as jest.MockedFunction<typeof createCardAction>

describe('Board and Task Creation Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Board Creation Workflow', () => {
    it('allows user to create a board with title and description', async () => {
      const user = userEvent.setup()
      mockCreateBoardAction.mockResolvedValue(undefined)
      
      render(<BoardCreationForm />)
      
      // Open the dialog
      const createButton = screen.getByText('ボードを作成')
      await user.click(createButton)
      
      // Fill out the form
      const titleInput = screen.getByLabelText(/タイトル/)
      const descriptionInput = screen.getByLabelText(/説明/)
      
      await user.type(titleInput, 'プロジェクト管理ボード')
      await user.type(descriptionInput, 'チームのタスク管理用ボード')
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /作成/ })
      await user.click(submitButton)
      
      // Verify the action was called
      await waitFor(() => {
        expect(mockCreateBoardAction).toHaveBeenCalledTimes(1)
      })
      
      const formDataCall = mockCreateBoardAction.mock.calls[0][0]
      expect(formDataCall.get('title')).toBe('プロジェクト管理ボード')
      expect(formDataCall.get('description')).toBe('チームのタスク管理用ボード')
    })

    it('shows validation error for empty title', async () => {
      const user = userEvent.setup()
      
      render(<BoardCreationForm />)
      
      // Open the dialog
      await user.click(screen.getByText('ボードを作成'))
      
      // Try to submit without title
      const submitButton = screen.getByRole('button', { name: /作成/ })
      await user.click(submitButton)
      
      // Verify form validation prevents submission
      const titleInput = screen.getByLabelText(/タイトル/)
      expect(titleInput).toBeInvalid()
      expect(mockCreateBoardAction).not.toHaveBeenCalled()
    })

    it('handles server errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
      
      mockCreateBoardAction.mockRejectedValue(new Error('Server error'))
      
      render(<BoardCreationForm />)
      
      await user.click(screen.getByText('ボードを作成'))
      await user.type(screen.getByLabelText(/タイトル/), 'Error Board')
      await user.click(screen.getByRole('button', { name: /作成/ }))
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('ボードの作成に失敗しました')
      })
      
      consoleSpy.mockRestore()
      alertSpy.mockRestore()
    })
  })

  describe('Task Creation Workflow', () => {
    it('allows user to create a task with all fields', async () => {
      const user = userEvent.setup()
      mockCreateCardAction.mockResolvedValue(undefined)
      
      render(<AddTaskButton columnId="col-1" boardId="board-1" />)
      
      // Open the task form
      const addButton = screen.getByText('タスクを追加')
      await user.click(addButton)
      
      // Fill out the task form
      await user.type(screen.getByLabelText(/タイトル/), 'APIの実装')
      await user.type(screen.getByLabelText(/説明/), 'REST APIエンドポイントを実装する')
      await user.selectOptions(screen.getByLabelText(/優先度/), 'high')
      await user.type(screen.getByLabelText(/期限/), '2024-12-31')
      
      // Submit the task
      await user.click(screen.getByRole('button', { name: /タスクを作成/ }))
      
      await waitFor(() => {
        expect(mockCreateCardAction).toHaveBeenCalledTimes(1)
      })
      
      const formDataCall = mockCreateCardAction.mock.calls[0][0]
      expect(formDataCall.get('title')).toBe('APIの実装')
      expect(formDataCall.get('description')).toBe('REST APIエンドポイントを実装する')
      expect(formDataCall.get('priority')).toBe('high')
      expect(formDataCall.get('dueDate')).toBe('2024-12-31')
      expect(formDataCall.get('columnId')).toBe('col-1')
      expect(formDataCall.get('boardId')).toBe('board-1')
    })

    it('creates minimal task with only title', async () => {
      const user = userEvent.setup()
      mockCreateCardAction.mockResolvedValue(undefined)
      
      render(<AddTaskButton columnId="col-2" boardId="board-2" />)
      
      await user.click(screen.getByText('タスクを追加'))
      await user.type(screen.getByLabelText(/タイトル/), 'シンプルタスク')
      await user.click(screen.getByRole('button', { name: /タスクを作成/ }))
      
      await waitFor(() => {
        expect(mockCreateCardAction).toHaveBeenCalledTimes(1)
      })
      
      const formDataCall = mockCreateCardAction.mock.calls[0][0]
      expect(formDataCall.get('title')).toBe('シンプルタスク')
      expect(formDataCall.get('description')).toBe('')
      expect(formDataCall.get('priority')).toBe('medium') // default
      expect(formDataCall.get('dueDate')).toBe('')
    })

    it('closes dialog after successful task creation', async () => {
      const user = userEvent.setup()
      mockCreateCardAction.mockResolvedValue(undefined)
      
      render(<AddTaskButton columnId="col-1" boardId="board-1" />)
      
      // Open and submit task
      await user.click(screen.getByText('タスクを追加'))
      await user.type(screen.getByLabelText(/タイトル/), '完了テスト')
      await user.click(screen.getByRole('button', { name: /タスクを作成/ }))
      
      // Wait for dialog to close
      await waitFor(() => {
        expect(screen.queryByText('タスクを追加')).toBeInTheDocument()
        expect(screen.queryByLabelText(/タイトル/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Interactions', () => {
    it('handles multiple dialog interactions correctly', async () => {
      const user = userEvent.setup()
      mockCreateBoardAction.mockResolvedValue(undefined)
      
      render(<BoardCreationForm />)
      
      // Open dialog
      await user.click(screen.getByText('ボードを作成'))
      expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument()
      
      // Close dialog using X button
      const closeButton = screen.getByTestId('x-icon').closest('button')
      if (closeButton) {
        await user.click(closeButton)
      }
      
      // Dialog should be closed
      expect(screen.queryByLabelText(/タイトル/)).not.toBeInTheDocument()
      
      // Open dialog again
      await user.click(screen.getByText('ボードを作成'))
      expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument()
    })

    it('resets form when dialog is reopened', async () => {
      const user = userEvent.setup()
      
      render(<BoardCreationForm />)
      
      // First interaction
      await user.click(screen.getByText('ボードを作成'))
      await user.type(screen.getByLabelText(/タイトル/), 'Test Input')
      
      // Close dialog
      const closeButton = screen.getByTestId('x-icon').closest('button')
      if (closeButton) {
        await user.click(closeButton)
      }
      
      // Reopen dialog
      await user.click(screen.getByText('ボードを作成'))
      
      // Form should be reset
      const titleInput = screen.getByLabelText(/タイトル/) as HTMLInputElement
      expect(titleInput.value).toBe('')
    })
  })

  describe('Loading States', () => {
    it('shows loading state during board creation', async () => {
      const user = userEvent.setup()
      let resolveAction: () => void
      const actionPromise = new Promise<void>((resolve) => {
        resolveAction = resolve
      })
      mockCreateBoardAction.mockReturnValue(actionPromise)
      
      render(<BoardCreationForm />)
      
      await user.click(screen.getByText('ボードを作成'))
      await user.type(screen.getByLabelText(/タイトル/), 'Loading Test')
      await user.click(screen.getByRole('button', { name: /作成/ }))
      
      // Check loading state
      expect(screen.getByText('作成中...')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
      
      // Complete the action
      resolveAction!()
      
      await waitFor(() => {
        expect(screen.queryByText('作成中...')).not.toBeInTheDocument()
      })
    })

    it('shows loading state during task creation', async () => {
      const user = userEvent.setup()
      let resolveAction: () => void
      const actionPromise = new Promise<void>((resolve) => {
        resolveAction = resolve
      })
      mockCreateCardAction.mockReturnValue(actionPromise)
      
      render(<AddTaskButton columnId="col-1" boardId="board-1" />)
      
      await user.click(screen.getByText('タスクを追加'))
      await user.type(screen.getByLabelText(/タイトル/), 'Loading Task')
      await user.click(screen.getByRole('button', { name: /タスクを作成/ }))
      
      // Check loading state
      expect(screen.getByText('作成中...')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
      
      resolveAction!()
      
      await waitFor(() => {
        expect(screen.queryByText('作成中...')).not.toBeInTheDocument()
      })
    })
  })
})