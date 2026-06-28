import recipes from '../data/recipes.json'

const SLOTS = ['lunch', 'dinner', 'treat']

function getWeight(recipeId, ratings) {
  const score = ratings[recipeId] ?? 0
  return Math.max(0.1, Math.min(3.0, 1.0 + score * 0.3))
}

function weightedPick(pool, ratings, exclude = new Set()) {
  const candidates = pool.filter(r => !exclude.has(r.id))
  if (candidates.length === 0) return pool[Math.floor(Math.random() * pool.length)]
  const weights = candidates.map(r => getWeight(r.id, ratings))
  const total = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  for (let i = 0; i < candidates.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}

function dailyCalories(daySlots) {
  return daySlots.reduce((sum, s) => sum + (s?.macrosPerServing?.calories ?? 0), 0)
}

export function generatePlan(settings, ratings = {}) {
  const { calorieTarget = 1600, defaultBatchSize = 4 } = settings

  const lunchPool = recipes.filter(r => r.mealTypes.includes('lunch'))
  const dinnerPool = recipes.filter(r => r.mealTypes.includes('dinner'))
  const treatPool = recipes.filter(r => r.mealTypes.includes('treat'))

  const days = []
  const recentCuisines = [] // tracks last 2 days of cuisines

  for (let day = 0; day < 7; day++) {
    const recentSet = new Set(recentCuisines.slice(-4)) // 2 days × 2 meals

    // Pick lunch avoiding recent cuisines
    let lunch = weightedPick(lunchPool, ratings, new Set(
      lunchPool.filter(r => recentSet.has(r.cuisine)).map(r => r.id)
    ))

    // Pick dinner avoiding recent cuisines and lunch's cuisine
    const avoidForDinner = new Set([
      ...lunchPool.filter(r => recentSet.has(r.cuisine)).map(r => r.id),
      ...dinnerPool.filter(r => r.cuisine === lunch.cuisine).map(r => r.id),
    ])
    let dinner = weightedPick(dinnerPool, ratings, avoidForDinner)

    // Pick treat
    const treat = weightedPick(treatPool, ratings)

    // Calorie check — swap highest-cal meal if over target
    let total = (lunch.macrosPerServing.calories + dinner.macrosPerServing.calories + treat.macrosPerServing.calories)
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
