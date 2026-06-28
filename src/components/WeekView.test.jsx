import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

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

const defaultSettings = { calorieTarget: 1600, defaultBatchSize: 4, useImperial: false, proteinTarget: 150 }

describe('WeekView', () => {
  it('renders 7 day sections', () => {
    render(<WeekView settings={defaultSettings} cupboard={[]} onOpenMeal={vi.fn()} />)
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      expect(screen.getByText(day)).toBeDefined()
    }
  })

  it('shows a Regenerate button', () => {
    render(<WeekView settings={defaultSettings} cupboard={[]} onOpenMeal={vi.fn()} />)
    expect(screen.getByText('Regenerate')).toBeDefined()
  })

  it('shows an Archive button', () => {
    render(<WeekView settings={defaultSettings} cupboard={[]} onOpenMeal={vi.fn()} />)
    expect(screen.getByText('Archive')).toBeDefined()
  })

  it('does not show a Calendar/Scroll toggle', () => {
    render(<WeekView settings={defaultSettings} cupboard={[]} onOpenMeal={vi.fn()} />)
    expect(screen.queryByText('Calendar')).toBeNull()
    expect(screen.queryByText('Scroll')).toBeNull()
  })
})
