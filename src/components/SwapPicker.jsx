import { useState } from 'react'
import recipes from '../data/recipes.json'
import { getWeight } from '../utils/planGenerator'

const SLOT_LABEL = { lunch: 'Lunch', dinner: 'Dinner', treat: 'Treat', sides: 'Sides' }

export default function SwapPicker({ day, slot, plan, ratings, cupboard, onSelect, onClose }) {
  const [search, setSearch] = useState('')

  const currentId = plan[day]?.slots[slot]?.recipeId

  const candidates = recipes
    .filter(r => r.mealTypes.includes(slot) && r.id !== currentId)
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => getWeight(b.id, ratings, cupboard) - getWeight(a.id, ratings, cupboard))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-2xl rounded-t-2xl max-h-[85vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Choose a {SLOT_LABEL[slot]}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="px-4 pt-3 pb-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recipes..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            autoFocus
          />
        </div>

        <div className="divide-y divide-gray-100 pb-4">
          {candidates.map(recipe => (
            <button
              key={recipe.id}
              onClick={() => onSelect(recipe.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{recipe.name}</p>
                <p className="text-xs text-gray-400">
                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px] mr-1">{recipe.cuisine}</span>
                  {recipe.mealTypes.join(' / ')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-gray-700">{recipe.macrosPerServing.calories} kcal</p>
                <p className="text-xs text-gray-400">{recipe.macrosPerServing.protein}g P</p>
              </div>
            </button>
          ))}
          {candidates.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No recipes match your search.</p>
          )}
        </div>
      </div>
    </div>
  )
}
