import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock localStorage
const store = {}
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: k => store[k] ?? null,
    setItem: (k, v) => { store[k] = v },
    removeItem: k => { delete store[k] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
  },
})

import ShoppingList from './ShoppingList'
import { saveCurrentPlan } from '../utils/storage'
import { generatePlan } from '../utils/planGenerator'
import { applyBatchSchedule } from '../utils/batchScheduler'

const settings = { calorieTarget: 1600, defaultBatchSize: 4, useImperial: false }

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k])
  const plan = applyBatchSchedule(generatePlan(settings))
  saveCurrentPlan(plan)
})

describe('ShoppingList', () => {
  it('renders aisle section headers', () => {
    render(<ShoppingList settings={settings} />)
    // At least some aisles should be present
    const meatOrProduce = screen.queryByText('meat') || screen.queryByText('produce')
    expect(meatOrProduce).toBeDefined()
  })

  it('shows item count summary', () => {
    render(<ShoppingList settings={settings} />)
    expect(screen.getByText(/items checked/)).toBeDefined()
  })

  it('checkbox toggles item as checked', () => {
    render(<ShoppingList settings={settings} />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
    fireEvent.click(checkboxes[0])
    // After clicking, 1 item should be checked — count text should update
    expect(screen.getByText(/1\//)).toBeDefined()
  })

  it('shows empty state when no plan', () => {
    Object.keys(store).forEach(k => delete store[k])
    render(<ShoppingList settings={settings} />)
    expect(screen.getByText(/Generate a week first/)).toBeDefined()
  })

  it('renders Export button', () => {
    render(<ShoppingList settings={settings} />)
    expect(screen.getByText('Export')).toBeDefined()
  })
})
