/**
 * Returns a score 0–1 representing how many of the recipe's ingredients
 * are already available in the cupboard with sufficient quantity.
 */
export function getCupboardScore(recipe, cupboard) {
  if (!cupboard || cupboard.length === 0) return 0
  if (!recipe?.ingredients?.length) return 0

  let matches = 0
  for (const ing of recipe.ingredients) {
    const inStock = cupboard.find(
      c => c.name.toLowerCase() === ing.name.toLowerCase() && c.unit === ing.unit && c.quantity >= ing.quantity * 0.5
    )
    if (inStock) matches++
  }
  return matches / recipe.ingredients.length
}

/**
 * Deducts quantities cooked from cupboard stock.
 * Only processes non-repeat slots (the actual cook day, not repeat servings).
 * Returns the updated cupboard array.
 */
export function deductCookedIngredients(plan, cupboard, recipes) {
  const toDeduct = []

  for (const day of plan) {
    for (const slotName of ['lunch', 'dinner']) {
      const entry = day.slots[slotName]
      if (!entry || entry.isBatchRepeat) continue
      const recipe = recipes.find(r => r.id === entry.recipeId)
      if (!recipe) continue

      const scaledOverrides = entry.adjustments?.scaledIngredients ?? {}
      for (const ing of recipe.ingredients) {
        const qty = (scaledOverrides[ing.name] ?? ing.quantity) * entry.batchSize
        toDeduct.push({ name: ing.name, quantity: qty, unit: ing.unit })
      }
    }
  }

  // Merge deductions
  const merged = {}
  for (const d of toDeduct) {
    const key = `${d.name.toLowerCase()}|${d.unit}`
    merged[key] = { name: d.name, quantity: (merged[key]?.quantity ?? 0) + d.quantity, unit: d.unit }
  }

  // Subtract from cupboard
  return cupboard.map(item => {
    const key = `${item.name.toLowerCase()}|${item.unit}`
    const deduct = merged[key]
    if (!deduct) return item
    const remaining = item.quantity - deduct.quantity
    return remaining > 0 ? { ...item, quantity: +remaining.toFixed(2) } : null
  }).filter(Boolean)
}
