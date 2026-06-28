import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MealCard from './MealCard'

const mockEntry = {
  recipeId: 'cottage-pie',
  batchSize: 4,
  isBatchRepeat: false,
  adjustments: null,
}

describe('MealCard', () => {
  it('renders the recipe name', () => {
    render(<MealCard entry={mockEntry} slot="lunch" rating={0} onOpen={vi.fn()} onRate={vi.fn()} onSwap={vi.fn()} />)
    expect(screen.getByText('Cottage Pie')).toBeDefined()
  })

  it('shows batch badge for repeat entries', () => {
    render(<MealCard entry={{ ...mockEntry, isBatchRepeat: true }} slot="dinner" rating={0} onOpen={vi.fn()} onRate={vi.fn()} onSwap={vi.fn()} />)
    expect(screen.getByText('(batch)')).toBeDefined()
  })

  it('calls onRate(1) when thumbs up clicked', () => {
    const onRate = vi.fn()
    render(<MealCard entry={mockEntry} slot="lunch" rating={0} onOpen={vi.fn()} onRate={onRate} onSwap={vi.fn()} />)
    const thumbsUp = screen.getAllByRole('button').find(b => b.textContent.includes('👍'))
    fireEvent.click(thumbsUp)
    expect(onRate).toHaveBeenCalledWith(1)
  })

  it('calls onRate(-1) when thumbs down clicked', () => {
    const onRate = vi.fn()
    render(<MealCard entry={mockEntry} slot="lunch" rating={0} onOpen={vi.fn()} onRate={onRate} onSwap={vi.fn()} />)
    const thumbsDown = screen.getAllByRole('button').find(b => b.textContent.includes('👎'))
    fireEvent.click(thumbsDown)
    expect(onRate).toHaveBeenCalledWith(-1)
  })

  it('shows upvote count when rating is positive', () => {
    render(<MealCard entry={mockEntry} slot="lunch" rating={3} onOpen={vi.fn()} onRate={vi.fn()} onSwap={vi.fn()} />)
    const thumbsUp = screen.getAllByRole('button').find(b => b.textContent.includes('👍'))
    expect(thumbsUp.textContent).toContain('3')
  })

  it('shows downvote count when rating is negative', () => {
    render(<MealCard entry={mockEntry} slot="lunch" rating={-2} onOpen={vi.fn()} onRate={vi.fn()} onSwap={vi.fn()} />)
    const thumbsDown = screen.getAllByRole('button').find(b => b.textContent.includes('👎'))
    expect(thumbsDown.textContent).toContain('2')
  })

  it('hides Swap button for batch repeats', () => {
    render(<MealCard entry={{ ...mockEntry, isBatchRepeat: true }} slot="dinner" rating={0} onOpen={vi.fn()} onRate={vi.fn()} onSwap={vi.fn()} />)
    expect(screen.queryByText('Swap')).toBeNull()
  })

  it('shows Swap button for non-repeat entries', () => {
    render(<MealCard entry={mockEntry} slot="lunch" rating={0} onOpen={vi.fn()} onRate={vi.fn()} onSwap={vi.fn()} />)
    expect(screen.getByText('Swap')).toBeDefined()
  })
})
