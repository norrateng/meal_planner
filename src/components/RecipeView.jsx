import { formatQuantity } from '../utils/units'

export default function RecipeView({ recipe, batchSize = 1, scaledIngredients = {}, useImperial = false, onClose }) {
  function qty(ing) {
    const base = scaledIngredients[ing.name] ?? ing.quantity
    const scaled = base * batchSize
    return formatQuantity(scaled, ing.unit, useImperial)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">{recipe.name}</h2>
            <p className="text-xs text-gray-500">{recipe.prepTime + recipe.cookTime} min total · serves {batchSize}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-5">
          {recipe.prepNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
              <span className="font-semibold">Prep note:</span> {recipe.prepNotes}
            </div>
          )}

          <section>
            <h3 className="font-semibold text-gray-800 mb-2">Ingredients</h3>
            <ul className="space-y-1.5">
              {recipe.ingredients.map(ing => (
                <li key={ing.name} className="flex justify-between text-sm">
                  <span className="text-gray-800">
                    {ing.name}
                    {ing.substitute && <span className="text-gray-400 ml-1 text-xs">(sub: {ing.substitute})</span>}
                  </span>
                  <span className="font-medium text-gray-700 ml-4 shrink-0">{qty(ing)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-2">Method</h3>
            <ol className="space-y-2">
              {recipe.method.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="text-gray-700 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  )
}
