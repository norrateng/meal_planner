import { describe, it, expect, beforeEach } from 'vitest'
import { loadCupboard, saveCupboard, addToCupboard, consumeFromCupboard } from './storage'

const store = {}
const localStorageMock = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, val) => { store[key] = val },
  removeItem: (key) => { delete store[key] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

beforeEach(() => localStorageMock.clear())

describe('loadCupboard', () => {
  it('returns empty array when nothing stored', () => {
    expect(loadCupboard()).toEqual([])
  })
})

describe('saveCupboard / loadCupboard', () => {
  it('round-trips cupboard items', () => {
    const items = [{ name: 'chicken breast', quantity: 500, unit: 'g', addedOn: 0 }]
    saveCupboard(items)
    expect(loadCupboard()).toEqual(items)
  })
})

describe('addToCupboard', () => {
  it('adds new items', () => {
    const result = addToCupboard([{ name: 'onion', quantity: 2, unit: 'whole' }])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('onion')
  })

  it('merges same-name same-unit items by summing quantity', () => {
    addToCupboard([{ name: 'rice', quantity: 500, unit: 'g' }])
    const result = addToCupboard([{ name: 'rice', quantity: 200, unit: 'g' }])
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBeCloseTo(700)
  })

  it('keeps separate entries for different units', () => {
    addToCupboard([{ name: 'milk', quantity: 500, unit: 'ml' }])
    const result = addToCupboard([{ name: 'milk', quantity: 1, unit: 'L' }])
    expect(result).toHaveLength(2)
  })

  it('is case-insensitive when merging', () => {
    addToCupboard([{ name: 'Chicken Breast', quantity: 300, unit: 'g' }])
    const result = addToCupboard([{ name: 'chicken breast', quantity: 200, unit: 'g' }])
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBeCloseTo(500)
  })
})

describe('consumeFromCupboard', () => {
  it('subtracts quantities', () => {
    saveCupboard([{ name: 'flour', quantity: 1000, unit: 'g', addedOn: 0 }])
    const result = consumeFromCupboard([{ name: 'flour', quantity: 400, unit: 'g' }])
    expect(result[0].quantity).toBeCloseTo(600)
  })

  it('removes items that reach or go below zero', () => {
    saveCupboard([{ name: 'butter', quantity: 100, unit: 'g', addedOn: 0 }])
    const result = consumeFromCupboard([{ name: 'butter', quantity: 100, unit: 'g' }])
    expect(result.find(i => i.name === 'butter')).toBeUndefined()
  })

  it('ignores items not in cupboard', () => {
    saveCupboard([{ name: 'salt', quantity: 500, unit: 'g', addedOn: 0 }])
    const result = consumeFromCupboard([{ name: 'pepper', quantity: 10, unit: 'g' }])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('salt')
  })
})
