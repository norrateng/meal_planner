import { describe, it, expect } from 'vitest'
import { getCupboardScore, deductCookedIngredients } from './cupboard'

const mockRecipe = {
  id: 'test-recipe',
  ingredients: [
    { name: 'chicken breast', quantity: 300, unit: 'g' },
    { name: 'onion', quantity: 1, unit: 'whole' },
    { name: 'garlic', quantity: 2, unit: 'clove' },
  ],
}

describe('getCupboardScore', () => {
  it('returns 0 for empty cupboard', () => {
    expect(getCupboardScore(mockRecipe, [])).toBe(0)
  })

  it('returns 0 for null cupboard', () => {
    expect(getCupboardScore(mockRecipe, null)).toBe(0)
  })

  it('returns 0 for recipe without ingredients', () => {
    expect(getCupboardScore({ id: 'x', ingredients: [] }, [{ name: 'chicken breast', quantity: 300, unit: 'g' }])).toBe(0)
  })

  it('returns fraction of matched ingredients', () => {
    const cupboard = [
      { name: 'chicken breast', quantity: 300, unit: 'g' },
      { name: 'onion', quantity: 2, unit: 'whole' },
    ]
    expect(getCupboardScore(mockRecipe, cupboard)).toBeCloseTo(2 / 3)
  })

  it('returns 1 when all ingredients are in cupboard', () => {
    const cupboard = [
      { name: 'chicken breast', quantity: 500, unit: 'g' },
      { name: 'onion', quantity: 2, unit: 'whole' },
      { name: 'garlic', quantity: 4, unit: 'clove' },
    ]
    expect(getCupboardScore(mockRecipe, cupboard)).toBe(1)
  })

  it('matches case-insensitively', () => {
    const cupboard = [{ name: 'Chicken Breast', quantity: 300, unit: 'g' }]
    expect(getCupboardScore(mockRecipe, cupboard)).toBeGreaterThan(0)
  })

  it('requires at least 50% of the needed quantity', () => {
    // 150g when 300g required — exactly 50%, should match
    const cupboard = [{ name: 'chicken breast', quantity: 150, unit: 'g' }]
    expect(getCupboardScore(mockRecipe, cupboard)).toBeGreaterThan(0)

    // 149g — under 50%, should not match
    const cupboard2 = [{ name: 'chicken breast', quantity: 149, unit: 'g' }]
    expect(getCupboardScore(mockRecipe, cupboard2)).toBe(0)
  })
})

describe('deductCookedIngredients', () => {
  const recipes = [
    {
      id: 'test-recipe',
      ingredients: [
        { name: 'chicken breast', quantity: 300, unit: 'g' },
        { name: 'onion', quantity: 1, unit: 'whole' },
      ],
    },
  ]

  const plan = [
    {
      day: 0,
      slots: {
        lunch: { recipeId: 'test-recipe', batchSize: 2, isBatchRepeat: false, adjustments: null },
        dinner: null,
      },
    },
    {
      day: 1,
      slots: {
        lunch: { recipeId: 'test-recipe', batchSize: 2, isBatchRepeat: true, adjustments: null },
        dinner: null,
      },
    },
  ]

  it('deducts ingredients for non-repeat slots only', () => {
    const cupboard = [
      { name: 'chicken breast', quantity: 700, unit: 'g', addedOn: 0 },
      { name: 'onion', quantity: 5, unit: 'whole', addedOn: 0 },
    ]
    const result = deductCookedIngredients(plan, cupboard, recipes)
    const chicken = result.find(i => i.name === 'chicken breast')
    const onion = result.find(i => i.name === 'onion')
    // 300g × batchSize 2 = 600g deducted from 700g → 100g remaining
    expect(chicken.quantity).toBeCloseTo(100)
    // 1 × 2 = 2 deducted from 5 → 3
    expect(onion.quantity).toBeCloseTo(3)
  })

  it('removes items that reach zero', () => {
    const cupboard = [
      { name: 'chicken breast', quantity: 600, unit: 'g', addedOn: 0 },
    ]
    const result = deductCookedIngredients(plan, cupboard, recipes)
    expect(result.find(i => i.name === 'chicken breast')).toBeUndefined()
  })

  it('ignores batch repeat slots', () => {
    const cupboard = [{ name: 'chicken breast', quantity: 700, unit: 'g', addedOn: 0 }]
    // Only day 0 (non-repeat) should be counted — day 1 is isBatchRepeat: true
    const result = deductCookedIngredients(plan, cupboard, recipes)
    const chicken = result.find(i => i.name === 'chicken breast')
    // 600g deducted (day 0 only), 100g remaining
    expect(chicken.quantity).toBeCloseTo(100)
  })
})
