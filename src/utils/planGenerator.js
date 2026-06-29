import recipes from '../data/recipes.json'
import { getCupboardScore } from './cupboard'

/**
 * Returns a weight for a recipe based on its rating and cupboard availability.
 * Uses exponential scaling so a 10-upvote recipe is ~7.6x more likely than neutral,
 * and a 10-downvote recipe is ~0.13x (very rarely shown).
 */
export function getWeight(recipeId, ratings, cupboard = []) {
  const score = ratings[recipeId] ?? 0
  const ratingWeight = Math.max(0.05, 1.5 ** (score * 0.5))
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
 * After picking lunch/dinner/treat, try to find the best lunch+dinner pair
 * that brings the total within ±100 of calorieTarget without exceeding it.
 * Among pairs that hit the target window, prefers highest combined rating weight.
 * Falls back to the closest-calorie pair if no pair reaches the window.
 * treat may be null on no-treat days.
 */
function upgradeCalories(lunch, dinner, treat, lunchPool, dinnerPool, calorieTarget, ratings, cupboard) {
  const treatCal = treat?.macrosPerServing?.calories ?? 0
  const currentTotal = sumCalories(lunch, dinner, treat)
  if (currentTotal >= calorieTarget - 100) return { lunch, dinner }

  let bestInWindow = null
  let bestWindowScore = -Infinity
  let bestBelow = { lunch, dinner }
  let bestBelowCal = currentTotal

  for (const l of lunchPool) {
    for (const d of dinnerPool) {
      if (l.id === d.id) continue
      const t = l.macrosPerServing.calories + d.macrosPerServing.calories + treatCal
      if (t > calorieTarget) continue

      if (t >= calorieTarget - 100) {
        const score = getWeight(l.id, ratings, cupboard) * getWeight(d.id, ratings, cupboard)
        if (score > bestWindowScore) {
          bestWindowScore = score
          bestInWindow = { lunch: l, dinner: d }
        }
      } else if (t > bestBelowCal) {
        bestBelowCal = t
        bestBelow = { lunch: l, dinner: d }
      }
    }
  }

  return bestInWindow ?? bestBelow
}

/**
 * Picks an optional Sides/Snacks recipe to supplement protein when the day's meals
 * fall short of the protein target. Sides are additive — they may take the total
 * slightly above the calorie target, but the primary goal is hitting protein.
 * Returns null if protein target is already met (within 15g).
 */
export function pickSideForDay(daySlots, calorieTarget, proteinTarget) {
  if (!proteinTarget) return null

  const sidesPool = recipes.filter(r => r.mealTypes.includes('sides'))
  if (!sidesPool.length) return null

  const totalProtein = ['lunch', 'dinner', 'treat'].reduce((s, slot) => {
    const r = recipes.find(x => x.id === daySlots[slot]?.recipeId)
    return s + (r?.macrosPerServing?.protein ?? 0)
  }, 0)

  if (proteinTarget - totalProtein <= 15) return null

  // Pick the most protein-efficient side (protein per calorie)
  return [...sidesPool].sort((a, b) =>
    (b.macrosPerServing.protein / b.macrosPerServing.calories) -
    (a.macrosPerServing.protein / a.macrosPerServing.calories)
  )[0]
}

export function generatePlan(settings, ratings = {}, cupboard = []) {
  const { calorieTarget = 1600, defaultBatchSize = 4, proteinTarget, treatsPerWeek = 3 } = settings

  const lunchPool = recipes.filter(r => r.mealTypes.includes('lunch'))
  const dinnerPool = recipes.filter(r => r.mealTypes.includes('dinner'))
  const treatPool = recipes.filter(r => r.mealTypes.includes('treat'))

  // Randomly distribute treats across the week
  const treatDays = new Set(
    [...Array(7).keys()].sort(() => Math.random() - 0.5).slice(0, Math.min(treatsPerWeek, 7))
  )

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

    const treat = treatDays.has(day) ? weightedPick(treatPool, ratings, new Set(), cupboard) : null

    // Cap at target if over
    const total = sumCalories(lunch, dinner, treat)
    if (total > calorieTarget) {
      const treatCal = treat?.macrosPerServing?.calories ?? 0
      const sorted = [
        { recipe: lunch, pool: lunchPool, slot: 'lunch' },
        { recipe: dinner, pool: dinnerPool, slot: 'dinner' },
      ].sort((a, b) => b.recipe.macrosPerServing.calories - a.recipe.macrosPerServing.calories)

      for (const item of sorted) {
        const budget = calorieTarget - treatCal -
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

    // Upgrade toward target using rating-weighted pair selection
    ;({ lunch, dinner } = upgradeCalories(lunch, dinner, treat, lunchPool, dinnerPool, calorieTarget, ratings, cupboard))

    recentCuisines.push(lunch.cuisine, dinner.cuisine)

    const slots = {
      lunch: makePlanEntry(day, 'lunch', lunch, defaultBatchSize),
      dinner: makePlanEntry(day, 'dinner', dinner, defaultBatchSize),
      treat: treat ? makePlanEntry(day, 'treat', treat, defaultBatchSize) : null,
    }

    const sideRecipe = pickSideForDay(slots, calorieTarget, proteinTarget)
    slots.sides = sideRecipe ? makePlanEntry(day, 'sides', sideRecipe, 1) : null

    days.push({ day, slots })
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

  const budgeted = pool.filter(r => !exclude.has(r.id) && r.macrosPerServing.calories <= budget)
  const pickPool = budgeted.length > 0 ? budgeted : pool.filter(r => !exclude.has(r.id))

  return weightedPick(pickPool.length > 0 ? pickPool : pool, ratings, new Set([entry.recipeId]), cupboard)
}

function makePlanEntry(day, slot, recipe, batchSize) {
  const isNoBatch = recipe.mealTypes.includes('treat') || recipe.mealTypes.includes('sides')
  return {
    day,
    slot,
    recipeId: recipe.id,
    batchSize: isNoBatch ? 1 : batchSize,
    batchGroupId: null,
    isBatchRepeat: false,
    adjustments: null,
    locked: false,
  }
}
