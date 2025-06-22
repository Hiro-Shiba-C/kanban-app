import '@testing-library/jest-dom'

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock @dnd-kit modules for testing
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => children,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: () => {},
    isOver: false,
  }),
  DragOverlay: ({ children }) => children,
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(),
  closestCorners: jest.fn(),
}))

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => children,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: jest.fn(),
}))

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Flag: () => <div data-testid="flag-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  X: () => <div data-testid="x-icon" />,
}))

// Mock server actions
jest.mock('./lib/actions', () => ({
  createBoardAction: jest.fn(),
  createCardAction: jest.fn(),
  moveCardAction: jest.fn(),
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Suppress console errors in tests unless explicitly testing error conditions
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})