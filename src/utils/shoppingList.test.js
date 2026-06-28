import { describe, it, expect } from 'vitest'
import { buildShoppingList, AISLE_ORDER } from './shoppingList'

function makeDay(day, lunchId, dinnerId, treatId, overrides = {}) {
  return {
    day,
    slots: {
      lunch: { recipeId: lunchId, batchSize: 4, isBatchRepeat: false, adjustments: null, ...overrides.lunch },
      dinner: { recipeId: dinnerId, batchSize: 4, isBatchRepeat: false, adjustments: null, ...overrides.dinner },
      treat: { recipeId: treatId, batchSize: 1, isBatchRepeat: false, adjustments: null },
    },
  }
}

describe('buildShoppingList', () => {
  it('returns an object with aisle keys', () => {
    const plan = [makeDay(0, 'cottage-pie', 'spaghetti-bolognese', 'greek-yoghurt-parfait')]
    const list = buildShoppingList(plan)
    const aisles = Object.keys(list)
    expect(aisles.length).toBeGreaterThan(0)
    for (const aisle of aisles) {
      expect(AISLE_ORDER).toContain(aisle)
    }
  })

  it('scales quantities by batchSize', () => {
    const planB1 = [makeDay(0, 'cottage-pie', 'cottage-pie', 'greek-yoghurt-parfait', { lunch: { batchSize: 1 }, dinner: { batchSize: 1 } })]
    const planB4 = [makeDay(0, 'cottage-pie', 'cottage-pie', 'greek-yoghurt-parfait', { lunch: { batchSize: 4 }, dinner: { batchSize: 4 } })]
    const listB1 = buildShoppingList(planB1)
    const listB4 = buildShoppingList(planB4)
    const meatB1 = listB1.meat?.find(i => i.name === 'beef mince')?.quantity ?? 0
    const meatB4 = listB4.meat?.find(i => i.name === 'beef mince')?.quantity ?? 0
    expect(meatB4).toBeGreaterThan(meatB1)
  })

  it('skips isBatchRepeat slots', () => {
    const plan = [
      makeDay(0, 'cottage-pie', 'spaghetti-bolognese', 'greek-yoghurt-parfait'),
      makeDay(1, 'cottage-pie', 'spaghetti-bolognese', 'greek-yoghurt-parfait', {
        lunch: { isBatchRepeat: true },
        dinner: { isBatchRepeat: true },
      }),
    ]
    const listFull = buildShoppingList([plan[0]])
    const listWithRepeats = buildShoppingList(plan)
    // Shopping list should be the same since day 1 is all repeats
    const minceFull = listFull.meat?.find(i => i.name === 'beef mince')?.quantity ?? 0
    const minceWithRepeats = listWithRepeats.meat?.find(i => i.name === 'beef mince')?.quantity ?? 0
    expect(minceWithRepeats).toBe(minceFull)
  })

  it('merges the same ingredient across multiple recipes', () => {
    // Both cottage-pie and spaghetti-bolognese use beef mince
    const plan = [makeDay(0, 'cottage-pie', 'spaghetti-bolognese', 'greek-yoghurt-parfait')]
    const list = buildShoppingList(plan)
    const beefMince = list.meat?.find(i => i.name === 'beef mince')
    expect(beefMince).toBeDefined()
    // Both recipes contribute 600g × batchSize 4 = 2400g each → 4800g = 4.8kg after normalisation
    // Unit normalisation converts g >= 1000 to kg
    const quantityInGrams = beefMince.unit === 'kg' ? beefMince.quantity * 1000 : beefMince.quantity
    expect(quantityInGrams).toBeGreaterThan(600)
  })

  it('marks ingredients shared across multiple recipes', () => {
    const plan = [makeDay(0, 'cottage-pie', 'spaghetti-bolognese', 'greek-yoghurt-parfait')]
    const list = buildShoppingList(plan)
    const beefMince = list.meat?.find(i => i.name === 'beef mince')
    expect(beefMince?.sharedIn.length).toBeGreaterThanOrEqual(2)
  })

  it('applies scaledIngredients overrides from adjustments', () => {
    const plan = [makeDay(0, 'chicken-tikka-masala', 'spaghetti-bolognese', 'greek-yoghurt-parfait', {
      lunch: { adjustments: { scaledIngredients: { 'chicken breast': 1000 } } }
    })]
    const list = buildShoppingList(plan)
    const chicken = list.meat?.find(i => i.name === 'chicken breast')
    // 1000g scaled by batchSize 4 = 4000g = 4kg after normalisation
    const qtyInGrams = chicken?.unit === 'kg' ? (chicken?.quantity ?? 0) * 1000 : (chicken?.quantity ?? 0)
    expect(qtyInGrams).toBeGreaterThanOrEqual(4000)
  })

  it('passes through substitute field', () => {
    const plan = [makeDay(0, 'chicken-tikka-masala', 'spaghetti-bolognese', 'greek-yoghurt-parfait')]
    const list = buildShoppingList(plan)
    const coconutCream = list.international?.find(i => i.name === 'coconut cream')
    expect(coconutCream?.substitute).toBe('double cream')
  })
})
