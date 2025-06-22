import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from '@/components/task-form'
import { createCardAction } from '@/lib/actions'

// Mock the server action
jest.mock('@/lib/actions')
const mockCreateCardAction = createCardAction as jest.MockedFunction<typeof createCardAction>

describe('TaskForm Component', () => {
  const defaultProps = {
    columnId: 'col-1',
    boardId: 'board-1',
    onSuccess: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(<TaskForm {...defaultProps} />)
    
    // Check form elements
    expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument()
    expect(screen.getByLabelText(/説明/)).toBeInTheDocument()
    expect(screen.getByLabelText(/優先度/)).toBeInTheDocument()
    expect(screen.getByLabelText(/期限/)).toBeInTheDocument()
    
    // Check submit button
    expect(screen.getByRole('button', { name: /タスクを作成/ })).toBeInTheDocument()
  })

  it('has title field marked as required', () => {
    render(<TaskForm {...defaultProps} />)
    
    const titleInput = screen.getByLabelText(/タイトル/)
    expect(titleInput).toBeRequired()
    expect(screen.getByText('*')).toBeInTheDocument() // Required indicator
  })

  it('has default priority set to medium', () => {
    render(<TaskForm {...defaultProps} />)
    
    const prioritySelect = screen.getByLabelText(/優先度/) as HTMLSelectElement
    expect(prioritySelect.value).toBe('medium')
  })

  it('displays all priority options', () => {
    render(<TaskForm {...defaultProps} />)
    
    const priorityOptions = screen.getAllByRole('option')
    const priorityLabels = priorityOptions.map(option => option.textContent)
    
    expect(priorityLabels).toEqual(['低', '中', '高', '緊急'])
  })

  it('includes hidden fields for columnId and boardId', () => {
    render(<TaskForm {...defaultProps} />)
    
    const columnIdInput = document.querySelector('input[name="columnId"]') as HTMLInputElement
    const boardIdInput = document.querySelector('input[name="boardId"]') as HTMLInputElement
    
    expect(columnIdInput).toBeInTheDocument()
    expect(columnIdInput.value).toBe('col-1')
    expect(columnIdInput.type).toBe('hidden')
    
    expect(boardIdInput).toBeInTheDocument()
    expect(boardIdInput.value).toBe('board-1')
    expect(boardIdInput.type).toBe('hidden')
  })

  describe('Form submission', () => {
    it('calls createCardAction with form data on submission', async () => {
      const user = userEvent.setup()
      mockCreateCardAction.mockResolvedValue(undefined)
      
      render(<TaskForm {...defaultProps} />)
      
      // Fill out the form
      await user.type(screen.getByLabelText(/タイトル/), 'Test Task')
      await user.type(screen.getByLabelText(/説明/), 'Test Description')
      await user.selectOptions(screen.getByLabelText(/優先度/), 'high')
      await user.type(screen.getByLabelText(/期限/), '2024-12-31')
      
      // Submit the form
      await user.click(screen.getByRole('button', { name: /タスクを作成/ }))
      
      await waitFor(() => {
        expect(mockCreateCardAction).toHaveBeenCalledTimes(1)
      })
      
      // Verify FormData was passed correctly
      const formDataCall = mockCreateCardAction.mock.calls[0][0]
      expect(formDataCall).toBeInstanceOf(FormData)
      expect(formDataCall.get('title')).toBe('Test Task')
      expect(formDataCall.get('description')).toBe('Test Description')
      expect(formDataCall.get('priority')).toBe('high')
      expect(formDataCall.get('dueDate')).toBe('2024-12-31')
      expect(formDataCall.get('columnId')).toBe('col-1')
      expect(formDataCall.get('boardId')).toBe('board-1')
    })

    it('calls onSuccess callback when submission succeeds', async () => {
      const user = userEvent.setup()
      const onSuccess = jest.fn()
      mockCreateCardAction.mockResolvedValue(undefined)
      
      render(<TaskForm {...defaultProps} onSuccess={onSuccess} />)
      
      await user.type(screen.getByLabelText(/タイトル/), 'Success Task')
      await user.click(screen.getByRole('button', { name: /タスクを作成/ }))
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1)
      })
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      let resolveAction: () => void
      const actionPromise = new Promise<void>((resolve) => {
        resolveAction = resolve
      })
      mockCreateCardAction.mockReturnValue(actionPromise)
      
      render(<TaskForm {...defaultProps} />)
      
      await user.type(screen.getByLabelText(/タイトル/), 'Loading Task')
      await user.click(screen.getByRole('button', { name: /タスクを作成/ }))
      
      // Check loading state
      expect(screen.getByText('作成中...')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
      
      // Complete the action
      resolveAction!()
      
      await waitFor(() => {
        expect(screen.getByText('タスクを作成')).toBeInTheDocument()
      })
    })

    it('disables form fields during submission', async () => {
      const user = userEvent.setup()
      let resolveAction: () => void
      const actionPromise = new Promise<void>((resolve) => {
        resolveAction = resolve
      })
      mockCreateCardAction.mockReturnValue(actionPromise)
      
      render(<TaskForm {...defaultProps} />)
      
      await user.type(screen.getByLabelText(/タイトル/), 'Disabled Task')
      await user.click(screen.getByRole('button', { name: /タスクを作成/ }))
      
      // Check that form fields are disabled
      expect(screen.getByLabelText(/タイトル/)).toBeDisabled()
      expect(screen.getByLabelText(/説明/)).toBeDisabled()
      expect(screen.getByLabelText(/優先度/)).toBeDisabled()
      expect(screen.getByLabelText(/期限/)).toBeDisabled()
      
      resolveAction!()
      
      await waitFor(() => {
        expect(screen.getByLabelText(/タイトル/)).not.toBeDisabled()
      })
    })

    it('handles submission errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
      
      mockCreateCardAction.mockRejectedValue(new Error('Submission failed'))
      
      render(<TaskForm {...defaultProps} />)
      
      await user.type(screen.getByLabelText(/タイトル/), 'Error Task')
      await user.click(screen.getByRole('button', { name: /タスクを作成/ }))
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error creating task:', expect.any(Error))
        expect(alertSpy).toHaveBeenCalledWith('タスクの作成に失敗しました')
      })
      
      // Form should be re-enabled after error
      expect(screen.getByLabelText(/タイトル/)).not.toBeDisabled()
      expect(screen.getByText('タスクを作成')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
      alertSpy.mockRestore()
    })
  })

  describe('Form validation', () => {
    it('prevents submission with empty title', async () => {
      const user = userEvent.setup()
      render(<TaskForm {...defaultProps} />)
      
      // Try to submit without filling title
      await user.click(screen.getByRole('button', { name: /タスクを作成/ }))
      
      // Browser validation should prevent submission
      const titleInput = screen.getByLabelText(/タイトル/)
      expect(titleInput).toBeInvalid()
      expect(mockCreateCardAction).not.toHaveBeenCalled()
    })

    it('allows submission with only title filled', async () => {
      const user = userEvent.setup()
      mockCreateCardAction.mockResolvedValue(undefined)
      
      render(<TaskForm {...defaultProps} />)
      
      await user.type(screen.getByLabelText(/タイトル/), 'Minimal Task')
      await user.click(screen.getByRole('button', { name: /タスクを作成/ }))
      
      await waitFor(() => {
        expect(mockCreateCardAction).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Accessibility', () => {
    it('associates labels with form controls', () => {
      render(<TaskForm {...defaultProps} />)
      
      expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument()
      expect(screen.getByLabelText(/説明/)).toBeInTheDocument()
      expect(screen.getByLabelText(/優先度/)).toBeInTheDocument()
      expect(screen.getByLabelText(/期限/)).toBeInTheDocument()
    })

    it('has proper form structure', () => {
      render(<TaskForm {...defaultProps} />)
      
      const form = screen.getByRole('form') || document.querySelector('form')
      expect(form).toBeInTheDocument()
      
      const submitButton = screen.getByRole('button', { name: /タスクを作成/ })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })
})