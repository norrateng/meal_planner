import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MealCard from './MealCard'

const mockEntry = {
  recipeId: 'cottage-pie',
  batchSize: 4,
  isBatchRepeat: false,
  locked: false,
  adjustments: null,
}

describe('MealCard', () => {
  it('renders the recipe name', () => {
    render(<MealCard entry={mockEntry} slot="lunch" rating={0} onOpen={vi.fn()} onRate={vi.fn()} onSwap={vi.fn()} onLock={vi.fn()} />)
    expect(screen.getByText('Cottage Pie')).toBeDefined()
  })

  it('shows Batch badge for repeat entries', () => {
    render(<MealCard entry={{ ...mockEntry, isBatchRepeat: true }} slot="dinner" rating={0} onOpen={vi.fn()} onRate={vi.fn()} onSwap={vi.fn()} onLock={vi.fn()} />)
    expect(screen.getByText('Batch')).toBeDefined()
  })

  it('calls onRate(1) when thumbs up clicked', () => {
    const onRate = vi.fn()
    render(<MealCard entry={mockEntry} slot="lunch" rating={0} onOpen={vi.fn()} onRate={onRate} onSwap={vi.fn()} onLock={vi.fn()} />)
    fireEvent.click(screen.getByTitle(/lock/i) ? screen.getAllByRole('button')[0] : screen.getAllByRole('button')[0])
    // Find thumbs up button
    const thumbsUp = screen.getAllByRole('button').find(b => b.textContent.includes('👍'))
    fireEvent.click(thumbsUp)
    expect(onRate).toHaveBeenCalledWith(1)
  })

  it('calls onLock when lock button clicked', () => {
    const onLock = vi.fn()
    render(<MealCard entry={mockEntry} slot="lunch" rating={0} onOpen={vi.fn()} onRate={vi.fn()} onSwap={vi.fn()} onLock={onLock} />)
    const lockBtn = screen.getAllByRole('button').find(b => b.textContent.includes('🔓'))
    fireEvent.click(lockBtn)
    expect(onLock).toHaveBeenCalled()
  })

  it('hides Swap button for batch repeats', () => {
    render(<MealCard entry={{ ...mockEntry, isBatchRepeat: true }} slot="dinner" rating={0} onOpen={vi.fn()} onRate={vi.fn()} onSwap={vi.fn()} onLock={vi.fn()} />)
    const swapBtn = screen.queryByText('Swap')
    expect(swapBtn).toBeNull()
  })
})
