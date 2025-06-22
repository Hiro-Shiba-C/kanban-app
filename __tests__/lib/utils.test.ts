import { isOverdue, getOverdueDays, formatOverdueText, cn } from '@/lib/utils'

describe('Date utility functions', () => {
  // Mock current date to ensure consistent test results
  const mockDate = new Date('2024-01-15T10:00:00Z')
  
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockDate)
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('isOverdue', () => {
    it('returns false for empty due date', () => {
      expect(isOverdue('')).toBe(false)
    })

    it('returns false for future date', () => {
      expect(isOverdue('2024-01-20')).toBe(false)
    })

    it('returns false for today', () => {
      expect(isOverdue('2024-01-15')).toBe(false)
    })

    it('returns true for past date', () => {
      expect(isOverdue('2024-01-10')).toBe(true)
    })

    it('returns true for yesterday', () => {
      expect(isOverdue('2024-01-14')).toBe(true)
    })

    it('handles ISO date strings correctly', () => {
      expect(isOverdue('2024-01-10T15:30:00Z')).toBe(true)
      expect(isOverdue('2024-01-20T15:30:00Z')).toBe(false)
    })
  })

  describe('getOverdueDays', () => {
    it('returns 0 for empty due date', () => {
      expect(getOverdueDays('')).toBe(0)
    })

    it('returns correct value for future date (negative means future)', () => {
      expect(getOverdueDays('2024-01-20')).toBeLessThan(0)
    })

    it('returns 0 for today', () => {
      expect(getOverdueDays('2024-01-15')).toBe(0)
    })

    it('returns correct days for past dates', () => {
      expect(getOverdueDays('2024-01-14')).toBe(1) // yesterday
      expect(getOverdueDays('2024-01-10')).toBe(5) // 5 days ago
      expect(getOverdueDays('2024-01-01')).toBe(14) // 14 days ago
    })

    it('handles ISO date strings correctly', () => {
      expect(getOverdueDays('2024-01-10T15:30:00Z')).toBeGreaterThan(0)
    })
  })

  describe('formatOverdueText', () => {
    it('formats single day correctly', () => {
      expect(formatOverdueText(1)).toBe('1日前に期限切れ')
    })

    it('formats multiple days correctly', () => {
      expect(formatOverdueText(2)).toBe('2日前に期限切れ')
      expect(formatOverdueText(5)).toBe('5日前に期限切れ')
      expect(formatOverdueText(30)).toBe('30日前に期限切れ')
    })

    it('handles zero days', () => {
      expect(formatOverdueText(0)).toBe('0日前に期限切れ')
    })
  })
})

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'conditional', false && 'not-included')).toBe('base conditional')
  })

  it('removes duplicates and resolves conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles arrays and objects', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
    expect(cn({ 'class1': true, 'class2': false })).toBe('class1')
  })

  it('handles undefined and null values', () => {
    expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2')
  })
})