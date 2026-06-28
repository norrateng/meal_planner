import recipes from '../data/recipes.json'
import { getCupboardScore } from './cupboard'

const PROTEIN_ADDONS = [
  { name: 'Fried eggs (2)', proteinG: 12, calories: 160 },
  { name: 'Greek yoghurt (150g)', proteinG: 10, calories: 90 },
  { name: 'Cottage cheese (100g)', proteinG: 12, calories: 100 },
  { name: 'Protein shake', proteinG: 25, calories: 120 },
  { name: 'Bacon (2 rashers)', proteinG: 8, calories: 100 },
]

export function computeProteinAddons(daySlots, calorieTarget, proteinTarget) {
  if (!proteinTarget) return []
  const slotProtein = ['lunch', 'dinner', 'treat'].reduce((s, slot) => {
    const r = recipes.find(x => x.id === daySlots[slot]?.recipeId)
    return s + (r?.macrosPerServing?.protein ?? 0)
  }, 0)
  const slotCalories = ['lunch', 'dinner', 'treat'].reduce((s, slot) => {
    const r = recipes.find(x => x.id === daySlots[slot]?.recipeId)
    return s + (r?.macrosPerServing?.calories ?? 0)
  }, 0)
  let deficit = proteinTarget - slotProtein
  if (deficit <= 0) return []
  let calBudget = calorieTarget - slotCalories
  const sorted = [...PROTEIN_ADDONS].sort((a, b) => (b.proteinG / b.calories) - (a.proteinG / a.calories))
  const chosen = []
  for (const addon of sorted) {
    if (chosen.length >= 2 || deficit <= 0) break
    if (addon.calories > calBudget) continue
    chosen.push(addon)
    deficit -= addon.proteinG
    calBudget -= addon.calories
  }
  return chosen
}

export function getWeight(recipeId, ratings, cupboard = []) {
  const score = ratings[recipeId] ?? 0
  const ratingWeight = Math.max(0.1, Math.min(3.0, 1.0 + score * 0.3))
  const recipe = recipes.find(r => r.id === recipeId)
  const cupboardBonus = recipe ? 1 + getCupboardScore(recipe, cupboard) * 2 : 1
  return ratingWeight * cupboardBonus
}

function weightedPick(pool, ratings, exclude = new Set(), cupboard = []) {
  const candidates = pool.filter(r => !exclude.has(r.id))
  if (candidates.length === 0) return pool[Math.floor(Math.random() * pool.length)]
  const weights = candidates.map(r => getWeight(r.id, ratings, cupboard))
  const total = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  for (let i = 0; i < candidates.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}

function sumCalories(...mealRecipes) {
  return mealRecipes.reduce((s, r) => s + (r?.macrosPerServing?.calories ?? 0), 0)
}


/**
 * After picking lunch/dinner/treat, try to find the best-calorie combination
 * of lunch+dinner that brings the total within ±100 of calorieTarget.
 * Tries pairs from the top-calorie candidates to close multi-slot gaps.
 */
function upgradeCalories(lunch, dinner, treat, lunchPool, dinnerPool, calorieTarget) {
  const treatCal = treat.macrosPerServing.calories
  const total = sumCalories(lunch, dinner, treat)
  if (total >= calorieTarget - 100) return { lunch, dinner }

  const lunchTop = [...lunchPool].sort((a, b) => b.macrosPerServing.calories - a.macrosPerServing.calories).slice(0, 10)
  const dinnerTop = [...dinnerPool].sort((a, b) => b.macrosPerServing.calories - a.macrosPerServing.calories).slice(0, 10)

  let bestLunch = lunch, bestDinner = dinner, bestTotal = total

  for (const l of lunchTop) {
    for (const d of dinnerTop) {
      if (l.id === d.id) continue
      const t = l.macrosPerServing.calories + d.macrosPerServing.calories + treatCal
      if (t <= calorieTarget && t > bestTotal) {
        bestLunch = l
        bestDinner = d
        bestTotal = t
        if (t >= calorieTarget - 100) return { lunch: bestLunch, dinner: bestDinner }
      }
    }
  }

  return { lunch: bestLunch, dinner: bestDinner }
}


export function generatePlan(settings, ratings = {}, cupboard = []) {
  const { calorieTarget = 1600, defaultBatchSize = 4, proteinTarget } = settings

  const lunchPool = recipes.filter(r => r.mealTypes.includes('lunch'))
  const dinnerPool = recipes.filter(r => r.mealTypes.includes('dinner'))
  const treatPool = recipes.filter(r => r.mealTypes.includes('treat'))

  const days = []
  const recentCuisines = []

  for (let day = 0; day < 7; day++) {
    const recentSet = new Set(recentCuisines.slice(-4))

    let lunch = weightedPick(lunchPool, ratings,
      new Set(lunchPool.filter(r => recentSet.has(r.cuisine)).map(r => r.id)),
      cupboard)

    const avoidForDinner = new Set([
      ...dinnerPool.filter(r => recentSet.has(r.cuisine)).map(r => r.id),
      ...dinnerPool.filter(r => r.cuisine === lunch.cuisine).map(r => r.id),
    ])
    let dinner = weightedPick(dinnerPool, ratings, avoidForDinner, cupboard)

    const treat = weightedPick(treatPool, ratings, new Set(), cupboard)

    // Cap at target (over)
    let total = sumCalories(lunch, dinner, treat)
    if (total > calorieTarget) {
      const sorted = [
        { recipe: lunch, pool: lunchPool, slot: 'lunch' },
        { recipe: dinner, pool: dinnerPool, slot: 'dinner' },
      ].sort((a, b) => b.recipe.macrosPerServing.calories - a.recipe.macrosPerServing.calories)

      for (const item of sorted) {
        const budget = calorieTarget - treat.macrosPerServing.calories -
          (item.slot === 'lunch' ? dinner : lunch).macrosPerServing.calories
        const cheaper = item.pool
          .filter(r => r.macrosPerServing.calories <= budget && r.id !== item.recipe.id)
          .sort((a, b) => b.macrosPerServing.calories - a.macrosPerServing.calories)
        if (cheaper.length > 0) {
          if (item.slot === 'lunch') lunch = cheaper[0]
          else dinner = cheaper[0]
          break
        }
      }
    }

    // Upgrade toward target (under by more than 100)
    ;({ lunch, dinner } = upgradeCalories(lunch, dinner, treat, lunchPool, dinnerPool, calorieTarget))

    recentCuisines.push(lunch.cuisine, dinner.cuisine)

    days.push({
      day,
      slots: {
        lunch: makePlanEntry(day, 'lunch', lunch, defaultBatchSize),
        dinner: makePlanEntry(day, 'dinner', dinner, defaultBatchSize),
        treat: makePlanEntry(day, 'treat', treat, defaultBatchSize),
      },
    })
  }

  return days
}

/**
 * Pick a replacement recipe for a single slot without touching the rest of the plan.
 */
export function pickReplacement(plan, day, slotName, settings, ratings = {}, cupboard = []) {
  const { calorieTarget = 1600 } = settings
  const entry = plan[day]?.slots[slotName]
  if (!entry) return null

  const pool = recipes.filter(r => r.mealTypes.includes(slotName))
  if (pool.length === 0) return null

  // Collect cuisines from adjacent days
  const adjacentCuisines = new Set()
  for (const adj of [day - 1, day + 1]) {
    if (adj >= 0 && adj < 7) {
      const adjSlots = plan[adj]?.slots
      if (adjSlots?.lunch) {
        const r = recipes.find(x => x.id === adjSlots.lunch.recipeId)
        if (r) adjacentCuisines.add(r.cuisine)
      }
      if (adjSlots?.dinner) {
        const r = recipes.find(x => x.id === adjSlots.dinner.recipeId)
        if (r) adjacentCuisines.add(r.cuisine)
      }
    }
  }

  // Budget: calorieTarget minus the other two slots' calories
  const otherCal = ['lunch', 'dinner', 'treat']
    .filter(s => s !== slotName)
    .reduce((sum, s) => {
      const r = recipes.find(x => x.id === plan[day]?.slots[s]?.recipeId)
      return sum + (r?.macrosPerServing?.calories ?? 0)
    }, 0)
  const budget = calorieTarget - otherCal

  const exclude = new Set([
    entry.recipeId,
    ...pool.filter(r => adjacentCuisines.has(r.cuisine)).map(r => r.id),
  ])

  // Filter to budget-fitting candidates
  const budgeted = pool.filter(r => !exclude.has(r.id) && r.macrosPerServing.calories <= budget)
  const pickPool = budgeted.length > 0 ? budgeted : pool.filter(r => !exclude.has(r.id))

  return weightedPick(pickPool.length > 0 ? pickPool : pool, ratings, new Set([entry.recipeId]), cupboard)
}

function makePlanEntry(day, slot, recipe, batchSize) {
  return {
    day,
    slot,
    recipeId: recipe.id,
    batchSize: recipe.mealTypes.includes('treat') ? 1 : batchSize,
    batchGroupId: null,
    isBatchRepeat: false,
    adjustments: null,
    locked: false,
  }
}
