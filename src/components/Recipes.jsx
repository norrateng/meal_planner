import { useState } from 'react'
import recipes from '../data/recipes.json'
import RecipeView from './RecipeView'

const mainRecipes = recipes.filter(r => !r.mealTypes.includes('sides'))
const allCuisines = [...new Set(mainRecipes.map(r => r.cuisine))].sort()
const allMealTypes = ['lunch', 'dinner', 'treat']

export default function Recipes() {
  const [search, setSearch] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState(null)
  const [mealTypeFilter, setMealTypeFilter] = useState(null)
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  const filtered = mainRecipes
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()))
    .filter(r => !cuisineFilter || r.cuisine === cuisineFilter)
    .filter(r => !mealTypeFilter || r.mealTypes.includes(mealTypeFilter))
    .sort((a, b) => a.name.localeCompare(b.name))

  function toggleCuisine(c) {
    setCuisineFilter(prev => prev === c ? null : c)
  }

  function toggleMealType(t) {
    setMealTypeFilter(prev => prev === t ? null : t)
  }

  return (
    <div className="p-4 space-y-3">
      <h2 className="font-bold text-gray-900">Recipe Book</h2>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search recipes..."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
      />

      <div className="flex gap-1.5 flex-wrap">
        {allCuisines.map(c => (
          <button
            key={c}
            onClick={() => toggleCuisine(c)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
              cuisineFilter === c
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5">
        {allMealTypes.map(t => (
          <button
            key={t}
            onClick={() => toggleMealType(t)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${
              mealTypeFilter === t
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400">{filtered.length} recipe{filtered.length !== 1 ? 's' : ''}</p>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {filtered.map(recipe => (
          <button
            key={recipe.id}
            onClick={() => setSelectedRecipe(recipe)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{recipe.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px] mr-1">{recipe.cuisine}</span>
                {recipe.mealTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' · ')}
                {' · '}{recipe.prepTime + recipe.cookTime} min
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-gray-700">{recipe.macrosPerServing.calories} kcal</p>
              <p className="text-xs text-gray-400">{recipe.macrosPerServing.protein}g P</p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No recipes match your filters.</p>
        )}
      </div>

      {selectedRecipe && (
        <RecipeView
          recipe={selectedRecipe}
          batchSize={selectedRecipe.defaultBatchSize}
          useImperial={false}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  )
}
