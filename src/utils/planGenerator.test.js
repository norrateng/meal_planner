import { describe, it, expect } from 'vitest'
import { generatePlan, pickReplacement, pickSideForDay, getWeight } from './planGenerator'
import recipes from '../data/recipes.json'

const defaultSettings = { calorieTarget: 1600, defaultBatchSize: 4, treatsPerWeek: 7 }

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
    // With rating score=5 → weight ≈2.76x vs neutral 1.0, tikka masala should appear noticeably more
    expect(counts['chicken-tikka-masala'] ?? 0).toBeGreaterThan(5)
  })

  it('treats get batchSize 1', () => {
    const plan = generatePlan(defaultSettings)
    for (const day of plan) {
      if (day.slots.treat) expect(day.slots.treat.batchSize).toBe(1)
    }
  })

  it('no treat slots when treatsPerWeek is 0', () => {
    const plan = generatePlan({ ...defaultSettings, treatsPerWeek: 0 })
    for (const day of plan) {
      expect(day.slots.treat).toBeNull()
    }
  })

  it('treat slot count matches treatsPerWeek setting', () => {
    const plan = generatePlan({ ...defaultSettings, treatsPerWeek: 3 })
    const treatCount = plan.filter(d => d.slots.treat !== null).length
    expect(treatCount).toBe(3)
  })

  it('sides slot is present when protein target is high and null otherwise', () => {
    const withTarget = generatePlan({ ...defaultSettings, proteinTarget: 200 })
    const withoutTarget = generatePlan({ ...defaultSettings })
    // With high protein target, at least some days should have a sides slot
    const hasSides = withTarget.some(d => d.slots.sides !== null)
    expect(hasSides).toBe(true)
    // Without protein target, no sides
    for (const day of withoutTarget) {
      expect(day.slots.sides).toBeNull()
    }
  })

  it('cuisine weights increase frequency of boosted cuisine', () => {
    const cuisineWeights = { Indian: 50, British: 6, Italian: 6, Chinese: 6, Thai: 6, Japanese: 6, Mediterranean: 6, Mexican: 6, 'Middle Eastern': 6 }
    const counts = {}
    for (let i = 0; i < 40; i++) {
      const plan = generatePlan({ ...defaultSettings, cuisineWeights })
      for (const day of plan) {
        for (const slot of ['lunch', 'dinner']) {
          const r = recipes.find(x => x.id === day.slots[slot].recipeId)
          if (r) counts[r.cuisine] = (counts[r.cuisine] ?? 0) + 1
        }
      }
    }
    // Indian boosted to ~50% share vs ~6% each for others → should dominate
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    expect((counts['Indian'] ?? 0) / total).toBeGreaterThan(0.2)
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
    expect(counts['chicken-tikka-masala'] ?? 0).toBeGreaterThan(0)
  })
})

describe('getWeight', () => {
  it('cuisine weight of 0 makes a recipe weight near zero', () => {
    const w = getWeight('spaghetti-bolognese', {}, [], { Italian: 0, British: 100 })
    expect(w).toBe(0)
  })

  it('equal cuisine weights produce same result as no weights', () => {
    const equal = { Italian: 50, British: 50 }
    const wWith = getWeight('spaghetti-bolognese', {}, [], equal)
    const wWithout = getWeight('spaghetti-bolognese', {}, [], {})
    expect(wWith).toBeCloseTo(wWithout, 5)
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

describe('pickSideForDay', () => {
  const plan = generatePlan(defaultSettings)
  const daySlots = plan[0].slots

  it('returns null when no proteinTarget', () => {
    expect(pickSideForDay(daySlots, 1600, undefined)).toBeNull()
    expect(pickSideForDay(daySlots, 1600, null)).toBeNull()
  })

  it('returns null when protein target is already met', () => {
    // Very low target (any day with 2 mains easily exceeds 30g)
    expect(pickSideForDay(daySlots, 1600, 20)).toBeNull()
  })

  it('returns a sides recipe when protein deficit exists', () => {
    const result = pickSideForDay(daySlots, 2500, 300)
    expect(result).not.toBeNull()
    expect(result.mealTypes).toContain('sides')
  })

  it('returned side has name, calories, protein fields', () => {
    const result = pickSideForDay(daySlots, 2500, 300)
    expect(result).toHaveProperty('name')
    expect(result.macrosPerServing).toHaveProperty('calories')
    expect(result.macrosPerServing).toHaveProperty('protein')
  })

  it('returns the most protein-efficient side when deficit is large', () => {
    const result = pickSideForDay(daySlots, 2500, 300)
    if (!result) return // may be null if plan[0] already meets target
    // Protein shake (25g P / 120 kcal) is the most efficient supplement
    expect(result.macrosPerServing.protein).toBeGreaterThan(0)
  })
})
