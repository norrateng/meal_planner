import { useState } from 'react'
import { adjustProtein } from '../utils/nutritionAdjuster'

export default function NutritionAdjuster({ recipeId, currentAdjustments, onSave, onCancel }) {
  const [proteinDelta, setProteinDelta] = useState(currentAdjustments?.proteinDeltaG ?? 0)
  const [preview, setPreview] = useState(null)

  function recalculate(delta) {
    setProteinDelta(delta)
    if (delta === 0) {
      setPreview(null)
      return
    }
    try {
      const result = adjustProtein(recipeId, delta, currentAdjustments)
      setPreview(result)
    } catch {
      setPreview(null)
    }
  }

  function handleSave() {
    if (proteinDelta === 0) {
      onSave(null)
      return
    }
    const result = adjustProtein(recipeId, proteinDelta, currentAdjustments)
    onSave({ proteinDeltaG: proteinDelta, ...result })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Adjust Nutrition</h3>
        <p className="text-xs text-gray-500">Change the protein target and the recipe will scale accordingly.</p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Protein adjustment: <span className="text-green-700 font-bold">{proteinDelta > 0 ? '+' : ''}{proteinDelta}g</span></label>
        <input
          type="range"
          min={-20}
          max={50}
          step={5}
          value={proteinDelta}
          onChange={e => recalculate(Number(e.target.value))}
          className="w-full accent-green-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>−20g</span><span>0</span><span>+50g</span>
        </div>
      </div>

      {preview && (
        <div className="bg-green-50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">Preview</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Calories', value: preview.newMacros.calories, unit: 'kcal' },
              { label: 'Protein', value: preview.newMacros.protein, unit: 'g' },
              { label: 'Carbs', value: preview.newMacros.carbs, unit: 'g' },
              { label: 'Fat', value: preview.newMacros.fat, unit: 'g' },
            ].map(m => (
              <div key={m.label}>
                <p className="text-sm font-bold text-gray-900">{m.value}<span className="text-xs font-normal text-gray-500">{m.unit}</span></p>
                <p className="text-xs text-gray-500">{m.label}</p>
              </div>
            ))}
          </div>
          {preview.suggestion && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              Suggestion: {preview.suggestion}
            </p>
          )}
          <div className="text-xs text-gray-600">
            <p className="font-medium text-gray-700 mb-0.5">Ingredient changes:</p>
            {Object.entries(preview.scaledIngredients).map(([name, qty]) => (
              <p key={name}>{name}: {qty}g</p>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={handleSave} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium">Save</button>
        <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-xl text-sm">Cancel</button>
      </div>
    </div>
  )
}
