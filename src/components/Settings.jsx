import { useState } from 'react'
import { saveSettings, saveRatings } from '../utils/storage'
import recipes from '../data/recipes.json'

const CUISINES = [...new Set(recipes.map(r => r.cuisine).filter(c => c !== 'Supplement'))].sort()
const DEFAULT_SHARE = Math.round(100 / CUISINES.length)

export default function Settings({ settings, onUpdate }) {
  const [local, setLocal] = useState(settings)

  function update(patch) {
    const next = { ...local, ...patch }
    setLocal(next)
    saveSettings(next)
    onUpdate(next)
  }

  function resetRatings() {
    saveRatings({})
    alert('Ratings reset. Regenerate your plan to see the effect.')
  }

  function updateCuisineWeight(cuisine, value) {
    const next = { ...(local.cuisineWeights ?? {}), [cuisine]: value }
    update({ cuisineWeights: next })
  }

  function resetCuisineWeights() {
    update({ cuisineWeights: {} })
  }

  const weightsTotal = CUISINES.reduce(
    (sum, c) => sum + (local.cuisineWeights?.[c] ?? DEFAULT_SHARE),
    0
  )

  return (
    <div className="p-4 space-y-6">
      <h2 className="font-bold text-gray-900 text-lg">Settings</h2>

      <section className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-4 py-3">
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Daily calorie target
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={800}
              max={4000}
              step={50}
              value={local.calorieTarget}
              onChange={e => update({ calorieTarget: Number(e.target.value) })}
              className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
            />
            <span className="text-sm text-gray-500">kcal / day</span>
          </div>
        </div>

        <div className="px-4 py-3">
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Daily protein target
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={50}
              max={300}
              step={5}
              value={local.proteinTarget ?? 120}
              onChange={e => update({ proteinTarget: Number(e.target.value) })}
              className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
            />
            <span className="text-sm text-gray-500">g protein / day</span>
          </div>
        </div>

        <div className="px-4 py-3">
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Treats per week
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={7}
              value={local.treatsPerWeek ?? 3}
              onChange={e => update({ treatsPerWeek: Number(e.target.value) })}
              className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
            />
            <span className="text-sm text-gray-500">days / week (0–7)</span>
          </div>
        </div>

        <div className="px-4 py-3">
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Default batch size
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={10}
              value={local.defaultBatchSize}
              onChange={e => update({ defaultBatchSize: Number(e.target.value) })}
              className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
            />
            <span className="text-sm text-gray-500">servings per cook</span>
          </div>
        </div>

        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Measurement units</p>
            <p className="text-xs text-gray-500">Metric (g/ml) or Imperial (oz/fl oz)</p>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm">
            <button onClick={() => update({ useImperial: false })} className={`px-3 py-1.5 ${!local.useImperial ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>Metric</button>
            <button onClick={() => update({ useImperial: true })} className={`px-3 py-1.5 ${local.useImperial ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>Imperial</button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Cuisine preferences</p>
            <p className="text-xs text-gray-500 mt-0.5">Set how often each cuisine appears. Values should total 100%.</p>
            <p className={`text-xs mt-1 font-semibold ${weightsTotal === 100 ? 'text-green-600' : 'text-red-500'}`}>
              Total: {weightsTotal}%
            </p>
          </div>
          <button onClick={resetCuisineWeights} className="text-xs text-gray-600 border border-gray-200 bg-gray-50 px-2.5 py-1.5 rounded-lg shrink-0">
            Reset equal
          </button>
        </div>
        {CUISINES.map(cuisine => (
          <div key={cuisine} className="px-4 py-2 flex items-center gap-3">
            <span className="text-sm text-gray-700 flex-1">{cuisine}</span>
            <input
              type="number"
              min={0}
              max={100}
              value={local.cuisineWeights?.[cuisine] ?? DEFAULT_SHARE}
              onChange={e => updateCuisineWeight(cuisine, Number(e.target.value))}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
            />
            <span className="text-sm text-gray-500 w-4">%</span>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Reset recipe ratings</p>
            <p className="text-xs text-gray-500">Clears all thumbs up/down votes</p>
          </div>
          <button onClick={resetRatings} className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg">
            Reset
          </button>
        </div>
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <h3 className="font-semibold text-amber-800 mb-1">Sports Tracking</h3>
        <p className="text-sm text-amber-700">Coming soon — log workouts, auto-adjust calorie targets based on exercise, and tag meals for post-workout recovery.</p>
        <span className="inline-block mt-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Future feature</span>
      </section>
    </div>
  )
}
