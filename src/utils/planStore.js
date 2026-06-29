import { useState, useCallback } from 'react'
import { generatePlan, pickReplacement, pickSideForDay } from './planGenerator'
import { applyBatchSchedule } from './batchScheduler'
import {
  loadCurrentPlan, saveCurrentPlan, loadRatings, saveRatings, archiveCurrentPlan,
  clearShoppingChecked, consumeFromCupboard, addToCupboard,
} from './storage'
import recipes from '../data/recipes.json'

export function getRecipe(id) {
  return recipes.find(r => r.id === id) ?? null
}

function makeSideEntry(day, recipe) {
  return { day, slot: 'sides', recipeId: recipe.id, batchSize: 1, batchGroupId: null, isBatchRepeat: false, adjustments: null, locked: false }
}

function applyPickSides(plan, settings) {
  return plan.map(d => {
    const sideRecipe = pickSideForDay(d.slots, settings.calorieTarget ?? 1600, settings.proteinTarget)
    return {
      ...d,
      slots: { ...d.slots, sides: sideRecipe ? makeSideEntry(d.day, sideRecipe) : null },
    }
  })
}

export function usePlanStore(settings, cupboard = [], onCupboardChange) {
  const [plan, setPlanState] = useState(() => {
    const stored = loadCurrentPlan()
    if (stored) return stored
    const ratings = loadRatings()
    const generated = applyBatchSchedule(generatePlan(settings, ratings, cupboard))
    saveCurrentPlan(generated)
    return generated
  })

  const [ratings, setRatingsState] = useState(() => loadRatings())

  const regenerate = useCallback(() => {
    clearShoppingChecked()
    const newPlan = applyBatchSchedule(generatePlan(settings, ratings, cupboard))
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

      const result = slot !== 'sides' ? applyPickSides(next, settings) : next
      saveCurrentPlan(result)
      return result
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

    const entry = plan.find(d => d.day === day)?.slots[slot]
    const recipe = entry ? getRecipe(entry.recipeId) : null
    if (recipe?.ingredients) {
      const scaledOverrides = entry.adjustments?.scaledIngredients ?? {}
      const ings = recipe.ingredients.map(ing => ({
        name: ing.name,
        quantity: scaledOverrides[ing.name] ?? ing.quantity,
        unit: ing.unit,
      }))
      if (value) consumeFromCupboard(ings)
      else addToCupboard(ings)
      onCupboardChange?.()
    }
  }, [plan, updateSlot, onCupboardChange])

  const archiveAndRegenerate = useCallback((weekLabel) => {
    archiveCurrentPlan(plan, weekLabel)
    clearShoppingChecked()
    const newPlan = applyBatchSchedule(generatePlan(settings, ratings, cupboard))
    saveCurrentPlan(newPlan)
    setPlanState(newPlan)
  }, [plan, settings, ratings, cupboard])

  return { plan, ratings, regenerate, updateSlot, swapSlot, rateRecipe, markEaten, archiveAndRegenerate }
}
