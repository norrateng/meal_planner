import { getRecipe } from '../utils/planStore'
import { getEffectiveMacros } from '../utils/nutritionAdjuster'

const SLOT_LABEL = { lunch: 'Lunch', dinner: 'Dinner', treat: 'Treat' }
const SLOT_COLOR = { lunch: 'bg-amber-50 border-amber-200', dinner: 'bg-blue-50 border-blue-200', treat: 'bg-pink-50 border-pink-200' }

export default function MealCard({ entry, slot, rating, onOpen, onRate, onSwap, onLock }) {
  const recipe = getRecipe(entry.recipeId)
  if (!recipe) return null

  const macros = getEffectiveMacros(entry.recipeId, entry.adjustments)

  return (
    <div className={`rounded-xl border p-3 ${SLOT_COLOR[slot]} relative`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0" onClick={onOpen} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onOpen()}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{SLOT_LABEL[slot]}</span>
            {entry.isBatchRepeat && <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">Batch</span>}
          </div>
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{recipe.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{recipe.cuisine} · {macros.calories} kcal · {macros.protein}g protein</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button onClick={onLock} title={entry.locked ? 'Unlock' : 'Lock'} className="text-gray-400 hover:text-gray-700 text-lg leading-none">
            {entry.locked ? '🔒' : '🔓'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
        <div className="flex gap-1">
          <button onClick={() => onRate(1)} className={`px-2 py-0.5 rounded text-sm ${(rating ?? 0) > 0 ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            👍 {(rating ?? 0) > 0 ? rating : ''}
          </button>
          <button onClick={() => onRate(-1)} className={`px-2 py-0.5 rounded text-sm ${(rating ?? 0) < 0 ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            👎
          </button>
        </div>
        {!entry.isBatchRepeat && (
          <button onClick={onSwap} className="text-xs text-blue-600 border border-blue-200 bg-white px-2 py-0.5 rounded">
            Swap
          </button>
        )}
      </div>
    </div>
  )
}
