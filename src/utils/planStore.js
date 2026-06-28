import { useState, useCallback } from 'react'
import { generatePlan } from './planGenerator'
import { applyBatchSchedule } from './batchScheduler'
import { loadCurrentPlan, saveCurrentPlan, loadRatings, saveRatings, loadSettings, archiveCurrentPlan } from './storage'
import recipes from '../data/recipes.json'

export function getRecipe(id) {
  return recipes.find(r => r.id === id) ?? null
}

export function usePlanStore(settings) {
  const [plan, setPlanState] = useState(() => {
    const stored = loadCurrentPlan()
    if (stored) return stored
    const ratings = loadRatings()
    const generated = generatePlan(settings, ratings)
    const scheduled = applyBatchSchedule(generated)
    saveCurrentPlan(scheduled)
    return scheduled
  })

  const [ratings, setRatingsState] = useState(() => loadRatings())

  const regenerate = useCallback(() => {
    const newPlan = applyBatchSchedule(generatePlan(settings, ratings))
    saveCurrentPlan(newPlan)
    setPlanState(newPlan)
  }, [settings, ratings])

  const updateSlot = useCallback((day, slot, patch) => {
    setPlanState(prev => {
      const next = prev.map(d =>
        d.day === day ? { ...d, slots: { ...d.slots, [slot]: { ...d.slots[slot], ...patch } } } : d
      )
      saveCurrentPlan(next)
      return next
    })
  }, [])

  const rateRecipe = useCallback((recipeId, delta) => {
    setRatingsState(prev => {
      const next = { ...prev, [recipeId]: Math.max(-10, Math.min(10, (prev[recipeId] ?? 0) + delta)) }
      saveRatings(next)
      return next
    })
  }, [])

  const archiveAndRegenerate = useCallback((weekLabel) => {
    archiveCurrentPlan(plan, weekLabel)
    const newPlan = applyBatchSchedule(generatePlan(settings, ratings))
    saveCurrentPlan(newPlan)
    setPlanState(newPlan)
  }, [plan, settings, ratings])

  return { plan, ratings, regenerate, updateSlot, rateRecipe, archiveAndRegenerate }
}
