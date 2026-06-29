import { getRecipe } from '../utils/planStore'
import { getEffectiveMacros } from '../utils/nutritionAdjuster'

const SLOT_LABEL = { lunch: 'Lunch', dinner: 'Dinner', treat: 'Treat', sides: 'Sides' }
const SLOT_DOT = { lunch: 'bg-amber-400', dinner: 'bg-blue-400', treat: 'bg-pink-400', sides: 'bg-purple-400' }

export default function MealCard({ entry, slot, rating, onOpen, onRate, onSwap, onMarkEaten }) {
  const recipe = getRecipe(entry.recipeId)
  if (!recipe) return null

  const macros = getEffectiveMacros(entry.recipeId, entry.adjustments)
  const r = rating ?? 0

  return (
    <div className={`rounded-lg border border-gray-100 overflow-hidden ${entry.eaten ? 'bg-green-50' : 'bg-white'}`}>
      <div className="flex items-center gap-2 px-2 py-2 cursor-pointer" onClick={onOpen} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onOpen()}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${SLOT_DOT[slot]}`} />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-10 shrink-0">{SLOT_LABEL[slot]}</span>
        <p className={`flex-1 min-w-0 text-sm font-medium truncate ${entry.eaten ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {recipe.name}
          {entry.isBatchRepeat && <span className="ml-1 text-[10px] text-gray-400">(batch)</span>}
        </p>
        <span className="text-xs text-gray-500 shrink-0">{macros.calories} kcal · {macros.protein}g P</span>
      </div>

      <div className="flex items-center gap-1 px-2 pb-1.5 border-t border-gray-50">
        <button
          onClick={() => onMarkEaten?.(!entry.eaten)}
          className={`px-1.5 py-0.5 rounded text-xs ${entry.eaten ? 'bg-green-100 text-green-700 font-semibold' : 'text-gray-300 hover:text-gray-500'}`}
          title={entry.eaten ? 'Mark as not eaten' : 'Mark as eaten'}
        >
          ✓
        </button>
        <button
          onClick={() => onRate(1)}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs ${r > 0 ? 'bg-green-100 text-green-700 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
        >
          👍{r > 0 ? <span>{r}</span> : null}
        </button>
        <button
          onClick={() => onRate(-1)}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs ${r < 0 ? 'bg-red-100 text-red-700 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
        >
          👎{r < 0 ? <span>{Math.abs(r)}</span> : null}
        </button>
        <span className="flex-1" />
        {!entry.isBatchRepeat && (
          <button
            onClick={onSwap}
            className="text-[11px] text-blue-600 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded"
          >
            Swap
          </button>
        )}
      </div>
    </div>
  )
}
