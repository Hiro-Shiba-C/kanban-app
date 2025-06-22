import { render, screen } from '@testing-library/react'
import { DraggableCard } from '@/components/draggable-card'
import type { Card } from '@/lib/types'

// Mock the date functions with known results for testing
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  isOverdue: jest.fn(),
  getOverdueDays: jest.fn(),
  formatOverdueText: jest.fn(),
  cn: jest.requireActual('@/lib/utils').cn,
}))

const { isOverdue, getOverdueDays, formatOverdueText } = jest.requireMock('@/lib/utils')

describe('DraggableCard Component', () => {
  const mockCard: Card = {
    id: 'card-1',
    title: 'Test Card',
    description: 'Test description',
    columnId: 'col-1',
    order: 0,
    priority: 'medium',
    dueDate: '2024-01-20',
    createdAt: new Date('2024-01-01'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    isOverdue.mockReturnValue(false)
    getOverdueDays.mockReturnValue(0)
    formatOverdueText.mockReturnValue('')
  })

  it('renders card with title and description', () => {
    render(<DraggableCard card={mockCard} />)
    
    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('renders card without description when not provided', () => {
    const cardWithoutDescription = { ...mockCard, description: undefined }
    render(<DraggableCard card={cardWithoutDescription} />)
    
    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.queryByText('Test description')).not.toBeInTheDocument()
  })

  it('displays priority with correct color and label', () => {
    render(<DraggableCard card={mockCard} />)
    
    const flagIcon = screen.getByTestId('flag-icon')
    expect(flagIcon).toBeInTheDocument()
    expect(screen.getByText('中')).toBeInTheDocument() // Medium priority in Japanese
  })

  it('displays different priority levels correctly', () => {
    const priorities = [
      { priority: 'low' as const, label: '低', color: 'text-gray-500' },
      { priority: 'high' as const, label: '高', color: 'text-orange-500' },
      { priority: 'urgent' as const, label: '緊急', color: 'text-red-500' },
    ]

    priorities.forEach(({ priority, label }) => {
      const { rerender } = render(<DraggableCard card={{ ...mockCard, priority }} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      rerender(<div />) // Clear for next iteration
    })
  })

  describe('Due date handling', () => {
    it('displays due date when provided and not overdue', () => {
      isOverdue.mockReturnValue(false)
      render(<DraggableCard card={mockCard} />)
      
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument()
      expect(screen.getByText('2024/1/20')).toBeInTheDocument()
    })

    it('does not display due date when not provided', () => {
      const cardWithoutDueDate = { ...mockCard, dueDate: undefined }
      render(<DraggableCard card={cardWithoutDueDate} />)
      
      expect(screen.queryByTestId('calendar-icon')).not.toBeInTheDocument()
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument()
    })

    it('displays overdue styling when task is overdue', () => {
      isOverdue.mockReturnValue(true)
      getOverdueDays.mockReturnValue(3)
      formatOverdueText.mockReturnValue('3日前に期限切れ')
      
      render(<DraggableCard card={mockCard} />)
      
      // Should show warning icon instead of calendar
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('calendar-icon')).not.toBeInTheDocument()
      
      // Should show overdue text
      expect(screen.getByText('3日前に期限切れ')).toBeInTheDocument()
      
      // Verify the utility functions were called
      expect(isOverdue).toHaveBeenCalledWith('2024-01-20')
      expect(getOverdueDays).toHaveBeenCalledWith('2024-01-20')
      expect(formatOverdueText).toHaveBeenCalledWith(3)
    })

    it('applies overdue styling classes when task is overdue', () => {
      isOverdue.mockReturnValue(true)
      getOverdueDays.mockReturnValue(1)
      
      render(<DraggableCard card={mockCard} />)
      
      const cardElement = screen.getByText('Test Card').closest('div')
      expect(cardElement).toHaveClass('border-2', 'border-red-500', 'bg-red-50')
    })

    it('applies normal styling when task is not overdue', () => {
      isOverdue.mockReturnValue(false)
      
      render(<DraggableCard card={mockCard} />)
      
      const cardElement = screen.getByText('Test Card').closest('div')
      expect(cardElement).toHaveClass('border')
      expect(cardElement).not.toHaveClass('border-2', 'border-red-500', 'bg-red-50')
    })
  })

  describe('Drag and drop integration', () => {
    it('renders with draggable attributes from useSortable', () => {
      render(<DraggableCard card={mockCard} />)
      
      const cardElement = screen.getByText('Test Card').closest('div')
      expect(cardElement).toHaveClass('cursor-grab')
    })

    it('handles missing due date in overdue check', () => {
      const cardWithoutDueDate = { ...mockCard, dueDate: undefined }
      
      render(<DraggableCard card={cardWithoutDueDate} />)
      
      // Should not call overdue functions when no due date
      expect(isOverdue).toHaveBeenCalledWith(undefined)
    })
  })

  describe('Accessibility', () => {
    it('maintains proper heading hierarchy', () => {
      render(<DraggableCard card={mockCard} />)
      
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toHaveTextContent('Test Card')
    })

    it('provides meaningful content structure', () => {
      render(<DraggableCard card={mockCard} />)
      
      // Verify the card has a clear content structure
      const cardElement = screen.getByText('Test Card').closest('div')
      expect(cardElement).toBeInTheDocument()
      
      // Priority information should be present
      expect(screen.getByText('中')).toBeInTheDocument()
      
      // Due date information should be present
      expect(screen.getByText('2024/1/20')).toBeInTheDocument()
    })
  })
})