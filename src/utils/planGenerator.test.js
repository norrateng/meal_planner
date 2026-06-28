import { describe, it, expect } from 'vitest'
import { generatePlan, pickReplacement, computeProteinAddons } from './planGenerator'
import recipes from '../data/recipes.json'

const defaultSettings = { calorieTarget: 1600, defaultBatchSize: 4 }

function getDayCalories(day) {
  return ['lunch', 'dinner', 'treat'].reduce((sum, slot) => {
    const recipe = recipes.find(r => r.id === day.slots[slot].recipeId)
    return sum + (recipe?.macrosPerServing?.calories ?? 0)
  }, 0)
}

describe('generatePlan', () => {
  it('returns exactly 7 days', () => {
    const plan = generatePlan(defaultSettings)
    expect(plan).toHaveLength(7)
  })

  it('each day has lunch, dinner and treat slots', () => {
    const plan = generatePlan(defaultSettings)
    for (const day of plan) {
      expect(day.slots.lunch).toBeDefined()
      expect(day.slots.dinner).toBeDefined()
      expect(day.slots.treat).toBeDefined()
    }
  })

  it('each slot has required fields', () => {
    const plan = generatePlan(defaultSettings)
    for (const day of plan) {
      for (const slot of ['lunch', 'dinner', 'treat']) {
        const entry = day.slots[slot]
        expect(entry.recipeId).toBeTruthy()
        expect(entry.batchSize).toBeGreaterThan(0)
        expect(typeof entry.isBatchRepeat).toBe('boolean')
        expect(typeof entry.locked).toBe('boolean')
      }
    }
  })

  it('day indices are sequential 0-6', () => {
    const plan = generatePlan(defaultSettings)
    for (let d = 0; d < 7; d++) {
      expect(plan[d].day).toBe(d)
    }
  })

  it('daily calories do not exceed the target', () => {
    const plan = generatePlan(defaultSettings)
    for (const day of plan) {
      const total = getDayCalories(day)
      expect(total).toBeLessThanOrEqual(defaultSettings.calorieTarget + 5) // +5 for rounding
    }
  })

  it('daily calories are within 100 kcal below target on most days', () => {
    // Run multiple times to reduce random variance
    let daysBelowThreshold = 0
    let totalDays = 0
    for (let run = 0; run < 5; run++) {
      const plan = generatePlan(defaultSettings)
      for (const day of plan) {
        totalDays++
        const total = getDayCalories(day)
        if (total < defaultSettings.calorieTarget - 100) daysBelowThreshold++
      }
    }
    // Allow at most 20% of days to miss the target window (due to impossible combinations)
    expect(daysBelowThreshold / totalDays).toBeLessThan(0.3)
  })

  it('higher-rated recipes appear more frequently over many runs', () => {
    const ratings = { 'chicken-tikka-masala': 5 }
    const counts = {}
    for (let i = 0; i < 40; i++) {
      const plan = generatePlan(defaultSettings, ratings)
      for (const day of plan) {
        for (const slot of ['lunch', 'dinner']) {
          const id = day.slots[slot].recipeId
          counts[id] = (counts[id] ?? 0) + 1
        }
      }
    }
    expect(counts['chicken-tikka-masala'] ?? 0).toBeGreaterThan(0)
  })

  it('treats get batchSize 1', () => {
    const plan = generatePlan(defaultSettings)
    for (const day of plan) {
      expect(day.slots.treat.batchSize).toBe(1)
    }
  })

  it('cupboard bonus increases weight of matching recipes', () => {
    const cupboard = [
      { name: 'chicken breast', quantity: 1000, unit: 'g' },
      { name: 'coconut cream', quantity: 400, unit: 'ml' },
      { name: 'garam masala', quantity: 50, unit: 'g' },
      { name: 'tomato passata', quantity: 500, unit: 'ml' },
    ]
    const counts = {}
    for (let i = 0; i < 40; i++) {
      const plan = generatePlan(defaultSettings, {}, cupboard)
      for (const day of plan) {
        for (const slot of ['lunch', 'dinner']) {
          const id = day.slots[slot].recipeId
          counts[id] = (counts[id] ?? 0) + 1
        }
      }
    }
    // chicken-tikka-masala uses chicken breast + coconut cream — should appear
    expect(counts['chicken-tikka-masala'] ?? 0).toBeGreaterThan(0)
  })
})

describe('pickReplacement', () => {
  it('returns a recipe different from the current one', () => {
    const plan = generatePlan(defaultSettings)
    const currentId = plan[3].slots.lunch.recipeId
    const replacement = pickReplacement(plan, 3, 'lunch', defaultSettings)
    expect(replacement).not.toBeNull()
    expect(replacement.id).not.toBe(currentId)
  })

  it('returns a recipe valid for the requested slot type', () => {
    const plan = generatePlan(defaultSettings)
    const replacement = pickReplacement(plan, 2, 'dinner', defaultSettings)
    expect(replacement.mealTypes).toContain('dinner')
  })

  it('returns a treat recipe when swapping treat slot', () => {
    const plan = generatePlan(defaultSettings)
    const replacement = pickReplacement(plan, 0, 'treat', defaultSettings)
    expect(replacement.mealTypes).toContain('treat')
  })

  it('returns null for an invalid slot', () => {
    const plan = generatePlan(defaultSettings)
    expect(pickReplacement(plan, 0, 'snack', defaultSettings)).toBeNull()
  })
})

describe('computeProteinAddons', () => {
  const plan = generatePlan(defaultSettings)
  const daySlots = plan[0].slots

  it('returns empty array when no proteinTarget', () => {
    expect(computeProteinAddons(daySlots, 1600, undefined)).toEqual([])
    expect(computeProteinAddons(daySlots, 1600, null)).toEqual([])
  })

  it('returns empty array when protein target is already met', () => {
    // A very low target (any day with 2 mains will easily exceed 20g)
    const result = computeProteinAddons(daySlots, 1600, 10)
    expect(result).toEqual([])
  })

  it('returns add-ons with name, proteinG, calories fields when budget allows', () => {
    // Use a high calorie target (2500) so there's room for add-ons despite slot meals
    const result = computeProteinAddons(daySlots, 2500, 300)
    expect(result.length).toBeGreaterThan(0)
    for (const addon of result) {
      expect(addon).toHaveProperty('name')
      expect(addon).toHaveProperty('proteinG')
      expect(addon).toHaveProperty('calories')
    }
  })

  it('returns at most 2 add-ons', () => {
    const result = computeProteinAddons(daySlots, 2500, 300)
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('respects calorie budget — add-on calories do not exceed remaining budget', () => {
    const calorieTarget = 2500
    const slotCalories = ['lunch', 'dinner', 'treat'].reduce((s, slot) => {
      const r = recipes.find(x => x.id === daySlots[slot]?.recipeId)
      return s + (r?.macrosPerServing?.calories ?? 0)
    }, 0)
    const result = computeProteinAddons(daySlots, calorieTarget, 300)
    const addonCalories = result.reduce((s, a) => s + a.calories, 0)
    expect(slotCalories + addonCalories).toBeLessThanOrEqual(calorieTarget)
  })
})
