import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock localStorage and storage module
const store = {}
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: k => store[k] ?? null,
    setItem: (k, v) => { store[k] = v },
    removeItem: k => { delete store[k] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
  },
})

beforeEach(() => Object.keys(store).forEach(k => delete store[k]))

import WeekView from './WeekView'

const defaultSettings = { calorieTarget: 1600, defaultBatchSize: 4, viewMode: 'calendar', useImperial: false }

describe('WeekView', () => {
  it('renders 7 day sections', () => {
    render(<WeekView settings={defaultSettings} onOpenMeal={vi.fn()} />)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for (const day of days) {
      expect(screen.getByText(day)).toBeDefined()
    }
  })

  it('shows Calendar and Scroll toggle buttons', () => {
    render(<WeekView settings={defaultSettings} onOpenMeal={vi.fn()} />)
    expect(screen.getByText('Calendar')).toBeDefined()
    expect(screen.getByText('Scroll')).toBeDefined()
  })

  it('shows a Regenerate button', () => {
    render(<WeekView settings={defaultSettings} onOpenMeal={vi.fn()} />)
    expect(screen.getByText('Regenerate')).toBeDefined()
  })

  it('toggles to scroll view when Scroll button clicked', async () => {
    const user = userEvent.setup()
    render(<WeekView settings={defaultSettings} onOpenMeal={vi.fn()} />)
    const scrollBtn = screen.getByText('Scroll')
    await user.click(scrollBtn)
    // Scroll button should now be highlighted (has bg-green-600 class)
    expect(scrollBtn.className).toContain('bg-green-600')
  })
})
