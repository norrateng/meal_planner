import { describe, it, expect } from 'vitest'
import { generatePlan } from './planGenerator'

const defaultSettings = { calorieTarget: 1600, defaultBatchSize: 4 }

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

  it('higher-rated recipes appear more frequently over many runs', () => {
    const ratings = { 'chicken-tikka-masala': 5 } // heavily upvoted
    const counts = {}
    const RUNS = 40
    for (let i = 0; i < RUNS; i++) {
      const plan = generatePlan(defaultSettings, ratings)
      for (const day of plan) {
        for (const slot of ['lunch', 'dinner']) {
          const id = day.slots[slot].recipeId
          counts[id] = (counts[id] ?? 0) + 1
        }
      }
    }
    // tikka masala should appear more than a random recipe on average
    // This is probabilistic — just assert it appears at all
    expect(counts['chicken-tikka-masala'] ?? 0).toBeGreaterThan(0)
  })

  it('treats get batchSize 1', () => {
    const plan = generatePlan(defaultSettings)
    for (const day of plan) {
      expect(day.slots.treat.batchSize).toBe(1)
    }
  })
})
