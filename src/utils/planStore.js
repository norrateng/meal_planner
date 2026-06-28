import { useState, useCallback } from 'react'
import { generatePlan, pickReplacement, computeProteinAddons } from './planGenerator'
import { applyBatchSchedule } from './batchScheduler'
import { loadCurrentPlan, saveCurrentPlan, loadRatings, saveRatings, archiveCurrentPlan } from './storage'
import recipes from '../data/recipes.json'

export function getRecipe(id) {
  return recipes.find(r => r.id === id) ?? null
}

function applyProteinAddons(plan, settings) {
  return plan.map(d => ({
    ...d,
    proteinAddons: computeProteinAddons(d.slots, settings.calorieTarget ?? 1600, settings.proteinTarget),
  }))
}

export function usePlanStore(settings, cupboard = []) {
  const [plan, setPlanState] = useState(() => {
    const stored = loadCurrentPlan()
    if (stored) return stored
    const ratings = loadRatings()
    const generated = applyProteinAddons(applyBatchSchedule(generatePlan(settings, ratings, cupboard)), settings)
    saveCurrentPlan(generated)
    return generated
  })

  const [ratings, setRatingsState] = useState(() => loadRatings())

  const regenerate = useCallback(() => {
    const newPlan = applyProteinAddons(applyBatchSchedule(generatePlan(settings, ratings, cupboard)), settings)
    saveCurrentPlan(newPlan)
    setPlanState(newPlan)
  }, [settings, ratings, cupboard])

  const updateSlot = useCallback((day, slot, patch) => {
    setPlanState(prev => {
      const next = prev.map(d =>
        d.day === day ? { ...d, slots: { ...d.slots, [slot]: { ...d.slots[slot], ...patch } } } : d
      )
      saveCurrentPlan(next)
      return next
    })
  }, [])

  const swapSlot = useCallback((day, slot, recipeId) => {
    setPlanState(prev => {
      const original = prev[day]?.slots[slot]
      if (!original) return prev

      const recipe = recipeId
        ? getRecipe(recipeId)
        : pickReplacement(prev, day, slot, settings, ratings, cupboard)
      if (!recipe) return prev

      const groupId = original.batchGroupId
      let next

      if (groupId) {
        // Propagate to all entries sharing this batchGroupId (cook day + repeats)
        next = prev.map(d => ({
          ...d,
          slots: Object.fromEntries(
            Object.entries(d.slots).map(([s, entry]) => {
              if (entry?.batchGroupId === groupId) {
                return [s, { ...entry, recipeId: recipe.id, adjustments: null, eaten: false }]
              }
              return [s, entry]
            })
          ),
        }))
      } else {
        next = prev.map(d =>
          d.day === day
            ? { ...d, slots: { ...d.slots, [slot]: { ...original, recipeId: recipe.id, adjustments: null, eaten: false } } }
            : d
        )
      }

      const withAddons = applyProteinAddons(next, settings)
      saveCurrentPlan(withAddons)
      return withAddons
    })
  }, [settings, ratings, cupboard])

  const rateRecipe = useCallback((recipeId, delta) => {
    setRatingsState(prev => {
      const next = { ...prev, [recipeId]: Math.max(-10, Math.min(10, (prev[recipeId] ?? 0) + delta)) }
      saveRatings(next)
      return next
    })
  }, [])

  const markEaten = useCallback((day, slot, value) => {
    updateSlot(day, slot, { eaten: value })
  }, [updateSlot])

  const archiveAndRegenerate = useCallback((weekLabel) => {
    archiveCurrentPlan(plan, weekLabel)
    const newPlan = applyProteinAddons(applyBatchSchedule(generatePlan(settings, ratings, cupboard)), settings)
    saveCurrentPlan(newPlan)
    setPlanState(newPlan)
  }, [plan, settings, ratings, cupboard])

  return { plan, ratings, regenerate, updateSlot, swapSlot, rateRecipe, markEaten, archiveAndRegenerate }
}
