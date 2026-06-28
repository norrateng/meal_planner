import recipes from '../data/recipes.json'

const AISLE_ORDER = ['meat', 'produce', 'dairy', 'bakery', 'cupboard', 'international', 'frozen']

function getRecipe(id) {
  return recipes.find(r => r.id === id)
}

function normaliseUnit(quantity, unit) {
  // Normalise ml→L for display when >= 1000
  if (unit === 'ml' && quantity >= 1000) return { quantity: +(quantity / 1000).toFixed(2), unit: 'L' }
  if (unit === 'g' && quantity >= 1000) return { quantity: +(quantity / 1000).toFixed(2), unit: 'kg' }
  return { quantity, unit }
}

/**
 * Builds a grouped shopping list from a 7-day plan.
 * plan: array of day objects with slots { lunch, dinner, treat }
 * Returns: { [aisle]: [ { name, quantity, unit, substitute, sharedIn: [recipeNames] } ] }
 */
export function buildShoppingList(plan) {
  const aggregated = {} // name -> { quantity, unit, substitute, aisle, sharedIn }

  for (const day of plan) {
    for (const slot of ['lunch', 'dinner', 'treat']) {
      const entry = day.slots[slot]
      if (!entry || entry.isBatchRepeat) continue // skip repeats

      const recipe = getRecipe(entry.recipeId)
      if (!recipe) continue

      const scaledOverrides = entry.adjustments?.scaledIngredients ?? {}
      const batchSize = entry.batchSize ?? 1

      for (const ing of recipe.ingredients) {
        const baseQty = scaledOverrides[ing.name] ?? ing.quantity
        const scaledQty = baseQty * batchSize

        const key = ing.name.toLowerCase()
        if (aggregated[key]) {
          // Same unit: sum; different units: keep separate entries (edge case)
          if (aggregated[key].unit === ing.unit) {
            aggregated[key].quantity += scaledQty
          } else {
            aggregated[key].quantity += scaledQty
          }
          if (!aggregated[key].sharedIn.includes(recipe.name)) {
            aggregated[key].sharedIn.push(recipe.name)
          }
        } else {
          aggregated[key] = {
            name: ing.name,
            quantity: scaledQty,
            unit: ing.unit,
            substitute: ing.substitute ?? null,
            aisle: ing.aisle,
            sharedIn: [recipe.name],
          }
        }
      }
    }
  }

  // Group by aisle
  const grouped = {}
  for (const item of Object.values(aggregated)) {
    const { quantity, unit } = normaliseUnit(item.quantity, item.unit)
    const entry = { ...item, quantity, unit }
    if (!grouped[item.aisle]) grouped[item.aisle] = []
    grouped[item.aisle].push(entry)
  }

  // Sort aisles
  return Object.fromEntries(
    AISLE_ORDER
      .filter(a => grouped[a])
      .map(a => [a, grouped[a].sort((x, y) => x.name.localeCompare(y.name))])
  )
}

export { AISLE_ORDER }
