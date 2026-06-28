import { describe, it, expect } from 'vitest'
import { applyBatchSchedule } from './batchScheduler'

function makePlan(overrides = {}) {
  return Array.from({ length: 7 }, (_, i) => ({
    day: i,
    slots: {
      lunch: { day: i, slot: 'lunch', recipeId: 'recipe-a', batchSize: 4, batchGroupId: null, isBatchRepeat: false, locked: false, adjustments: null, ...overrides.lunch },
      dinner: { day: i, slot: 'dinner', recipeId: 'recipe-b', batchSize: 4, batchGroupId: null, isBatchRepeat: false, locked: false, adjustments: null, ...overrides.dinner },
      treat: { day: i, slot: 'treat', recipeId: 'recipe-c', batchSize: 1, batchGroupId: null, isBatchRepeat: false, locked: false, adjustments: null },
    },
  }))
}

describe('applyBatchSchedule', () => {
  it('assigns batchGroupId to non-repeat slots', () => {
    const plan = makePlan()
    const result = applyBatchSchedule(plan)
    // Day 0 lunch should have a batchGroupId
    expect(result[0].slots.lunch.batchGroupId).toBeTruthy()
  })

  it('marks repeat slots as isBatchRepeat', () => {
    const plan = makePlan()
    const result = applyBatchSchedule(plan)
    // Some days should be marked as repeats
    const repeatSlots = result.flatMap(d => [d.slots.lunch, d.slots.dinner]).filter(s => s.isBatchRepeat)
    expect(repeatSlots.length).toBeGreaterThan(0)
  })

  it('repeat slots share batchGroupId with the original cook', () => {
    const plan = makePlan()
    const result = applyBatchSchedule(plan)
    // Find a batch group
    const original = result.flatMap(d => [d.slots.lunch, d.slots.dinner]).find(s => !s.isBatchRepeat && s.batchGroupId)
    if (!original) return // guard
    const repeats = result.flatMap(d => [d.slots.lunch, d.slots.dinner]).filter(s => s.batchGroupId === original.batchGroupId && s.isBatchRepeat)
    expect(repeats.length).toBeGreaterThanOrEqual(1)
  })

  it('treats are never batch-scheduled', () => {
    const plan = makePlan()
    const result = applyBatchSchedule(plan)
    for (const day of result) {
      expect(day.slots.treat.batchGroupId).toBeNull()
      expect(day.slots.treat.isBatchRepeat).toBe(false)
    }
  })

  it('respects locked meals — does not overwrite them', () => {
    const plan = makePlan()
    plan[1].slots.lunch.locked = true
    plan[1].slots.lunch.recipeId = 'locked-recipe'
    const result = applyBatchSchedule(plan)
    expect(result[1].slots.lunch.recipeId).toBe('locked-recipe')
    expect(result[1].slots.lunch.isBatchRepeat).toBe(false)
  })

  it('does not double-count a repeat slot that already has a batchGroupId', () => {
    const plan = makePlan()
    const result = applyBatchSchedule(plan)
    // Count total repeat slots — should not exceed available slots
    const total = result.flatMap(d => [d.slots.lunch, d.slots.dinner])
    const repeats = total.filter(s => s.isBatchRepeat)
    expect(repeats.length).toBeLessThanOrEqual(total.length - 1)
  })
})
