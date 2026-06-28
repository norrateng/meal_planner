import recipes from '../data/recipes.json'

// Approximate protein content (g per 100g) for common primary protein ingredients
const PROTEIN_DENSITY = {
  'chicken breast': 25,
  'chicken thigh': 22,
  'beef mince': 20,
  'lamb mince': 18,
  'pork mince': 19,
  'turkey mince': 22,
  'salmon fillet': 20,
  'cod fillet': 18,
  'tuna steak': 24,
  'prawns': 20,
  'eggs': 13,
  'greek yoghurt': 10,
  'cottage cheese': 11,
}

function getDensity(ingredientName) {
  const key = ingredientName.toLowerCase()
  for (const [k, v] of Object.entries(PROTEIN_DENSITY)) {
    if (key.includes(k)) return v
  }
  return 20 // default assumption
}

/**
 * Adjusts a recipe's ingredients to hit a protein delta.
 * Returns { scaledIngredients, newMacros, suggestion }
 *   scaledIngredients: { [ingredientName]: newQuantityG }
 *   newMacros: updated macrosPerServing
 *   suggestion: string or null (if additive needed)
 */
export function adjustProtein(recipeId, proteinDeltaG, existingAdjustments = null) {
  const recipe = recipes.find(r => r.id === recipeId)
  if (!recipe) throw new Error(`Recipe ${recipeId} not found`)

  // Use adjusted macros as the baseline if prior adjustments exist
  const baseMacros = existingAdjustments?.newMacros
    ? { ...existingAdjustments.newMacros }
    : { ...recipe.macrosPerServing }

  const baseIngredients = recipe.ingredients.reduce((acc, ing) => {
    acc[ing.name] = ing.quantity
    return acc
  }, {})

  // Apply any existing adjustments
  const currentIngredients = { ...baseIngredients, ...(existingAdjustments?.scaledIngredients ?? {}) }

  const primaryProtein = recipe.ingredients.find(i => i.isPrimaryProtein)
  let scaledIngredients = { ...currentIngredients }
  let suggestion = null
  let actualProteinGain = 0

  if (primaryProtein) {
    const density = getDensity(primaryProtein.name) // g protein per 100g ingredient
    const currentQty = currentIngredients[primaryProtein.name] ?? primaryProtein.quantity
    const extraGrams = (proteinDeltaG / density) * 100
    const newQty = Math.round(currentQty + extraGrams)
    scaledIngredients[primaryProtein.name] = newQty
    actualProteinGain = proteinDeltaG
  } else {
    // No scalable protein — suggest additive
    const needed = proteinDeltaG
    const yoghurtG = Math.round((needed / 10) * 100) // greek yoghurt ~10g/100g
    suggestion = `Add ${yoghurtG}g Greek yoghurt as a side (+${needed}g protein, ~${Math.round(yoghurtG * 0.6)}kcal)`
    actualProteinGain = needed
  }

  // Recalculate calories from the primary protein scale
  const newProtein = baseMacros.protein + actualProteinGain
  const proteinCalorieIncrease = actualProteinGain * 4 // 4 kcal/g protein
  let newCalories = baseMacros.calories + proteinCalorieIncrease

  // If calories drift > 5%, reduce the main carb ingredient proportionally
  const calorieDrift = Math.abs(newCalories - baseMacros.calories) / baseMacros.calories
  let newCarbs = baseMacros.carbs

  if (calorieDrift > 0.05) {
    const carbIngredient = recipe.ingredients
      .filter(i => !i.isPrimaryProtein)
      .sort((a, b) => (b.carbContent ?? 0) - (a.carbContent ?? 0))[0]

    if (carbIngredient) {
      const caloriesToRemove = newCalories - baseMacros.calories - (baseMacros.calories * 0.05)
      const carbGramsToRemove = caloriesToRemove / 4 // rough: 4 kcal/g carbs
      const currentQty = scaledIngredients[carbIngredient.name] ?? carbIngredient.quantity
      const reduction = Math.min(currentQty * 0.3, (carbGramsToRemove / 0.8) * 100) // 80g carb per 100g for rice/pasta est
      scaledIngredients[carbIngredient.name] = Math.round(Math.max(0, currentQty - reduction))
      const carbReduced = reduction * 0.8 / 100
      newCarbs = Math.max(0, baseMacros.carbs - carbReduced)
      newCalories = baseMacros.calories + (actualProteinGain * 4) - (carbReduced * 4)
    }
  }

  return {
    scaledIngredients,
    newMacros: {
      calories: Math.round(newCalories),
      protein: Math.round(newProtein),
      carbs: Math.round(newCarbs),
      fat: baseMacros.fat,
    },
    suggestion,
  }
}

/**
 * Get effective macros for a plan entry (applying any stored adjustments).
 */
export function getEffectiveMacros(recipeId, adjustments) {
  const recipe = recipes.find(r => r.id === recipeId)
  if (!recipe) return null
  if (!adjustments?.newMacros) return recipe.macrosPerServing
  return adjustments.newMacros
}
