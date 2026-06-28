import { useState } from 'react'
import { getRecipe, usePlanStore } from '../utils/planStore'
import { getEffectiveMacros } from '../utils/nutritionAdjuster'
import MacroRing from './MacroRing'
import RecipeView from './RecipeView'
import NutritionAdjuster from './NutritionAdjuster'

const SLOT_LABEL = { lunch: 'Lunch', dinner: 'Dinner', treat: 'Treat' }

export default function MealDetail({ slot, settings, onBack }) {
  const { plan, updateSlot } = usePlanStore(settings)
  const [showRecipe, setShowRecipe] = useState(false)
  const [showAdjuster, setShowAdjuster] = useState(false)

  if (!slot) return null
  const { day, slot: slotName } = slot
  const entry = plan[day]?.slots[slotName]
  if (!entry) return null

  const recipe = getRecipe(entry.recipeId)
  if (!recipe) return null

  const macros = getEffectiveMacros(entry.recipeId, entry.adjustments)

  function handleAdjustmentSave(adjustments) {
    updateSlot(day, slotName, { adjustments })
    setShowAdjuster(false)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1">
          ← Back
        </button>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{SLOT_LABEL[slotName]}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h2 className="font-bold text-gray-900 text-lg mb-1">{recipe.name}</h2>
        <p className="text-sm text-gray-500 mb-4">{recipe.cuisine} · {recipe.prepTime + recipe.cookTime} min · serves {entry.batchSize}</p>

        <div className="flex justify-center mb-4">
          <MacroRing macros={macros} size={120} />
        </div>

        <div className="grid grid-cols-4 gap-2 text-center mb-4">
          {[
            { label: 'Calories', value: macros.calories, unit: 'kcal' },
            { label: 'Protein', value: macros.protein, unit: 'g' },
            { label: 'Carbs', value: macros.carbs, unit: 'g' },
            { label: 'Fat', value: macros.fat, unit: 'g' },
          ].map(m => (
            <div key={m.label} className="bg-gray-50 rounded-xl p-2">
              <p className="font-bold text-gray-900 text-base">{m.value}<span className="text-xs font-normal text-gray-500">{m.unit}</span></p>
              <p className="text-xs text-gray-500">{m.label}</p>
            </div>
          ))}
        </div>

        {entry.isBatchRepeat && (
          <div className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-3 py-2 mb-3">
            This is a batch repeat — the ingredients are already counted from the original cook day.
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setShowRecipe(true)} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium">
            View Recipe
          </button>
          <button onClick={() => setShowAdjuster(!showAdjuster)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-xl text-sm">
            Adjust Nutrition
          </button>
        </div>
      </div>

      {showAdjuster && (
        <NutritionAdjuster
          recipeId={entry.recipeId}
          currentAdjustments={entry.adjustments}
          onSave={handleAdjustmentSave}
          onCancel={() => setShowAdjuster(false)}
        />
      )}

      {showRecipe && (
        <RecipeView
          recipe={recipe}
          batchSize={entry.batchSize}
          scaledIngredients={entry.adjustments?.scaledIngredients ?? {}}
          useImperial={settings.useImperial}
          onClose={() => setShowRecipe(false)}
        />
      )}
    </div>
  )
}
