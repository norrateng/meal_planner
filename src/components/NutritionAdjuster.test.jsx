import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import NutritionAdjuster from './NutritionAdjuster'

describe('NutritionAdjuster', () => {
  it('renders the protein adjustment slider', () => {
    render(<NutritionAdjuster recipeId="cottage-pie" currentAdjustments={null} onSave={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText(/Protein adjustment/)).toBeDefined()
  })

  it('shows a preview when slider is moved away from 0', () => {
    render(<NutritionAdjuster recipeId="cottage-pie" currentAdjustments={null} onSave={vi.fn()} onCancel={vi.fn()} />)
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '20' } })
    expect(screen.getByText('Preview')).toBeDefined()
  })

  it('calls onSave when Save button clicked', () => {
    const onSave = vi.fn()
    render(<NutritionAdjuster recipeId="cottage-pie" currentAdjustments={null} onSave={onSave} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalled()
  })

  it('calls onCancel when Cancel button clicked', () => {
    const onCancel = vi.fn()
    render(<NutritionAdjuster recipeId="cottage-pie" currentAdjustments={null} onSave={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })
})
