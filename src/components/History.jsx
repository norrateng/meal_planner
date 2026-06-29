import { useState } from 'react'
import { loadHistory, clearHistory } from '../utils/storage'
import { getRecipe } from '../utils/planStore'
import { getEffectiveMacros } from '../utils/nutritionAdjuster'

const SLOT_LABEL = { lunch: 'L', dinner: 'D', treat: 'T', sides: 'S' }
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function computeWeekStats(plan) {
  let totalCal = 0, totalProt = 0
  for (const day of plan) {
    for (const slot of Object.values(day.slots)) {
      if (!slot?.eaten) continue
      const macros = getEffectiveMacros(slot.recipeId, slot.adjustments)
      if (!macros) continue
      totalCal += macros.calories
      totalProt += macros.protein
    }
  }
  const days = plan.length || 7
  return {
    totalCal: Math.round(totalCal),
    totalProt: Math.round(totalProt),
    avgCal: Math.round(totalCal / days),
    avgProt: Math.round(totalProt / days),
  }
}

export default function History() {
  const [history, setHistory] = useState(() => loadHistory())
  const [expanded, setExpanded] = useState(null)

  function handleClear() {
    if (!window.confirm('Clear all history? This cannot be undone.')) return
    clearHistory()
    setHistory([])
  }

  if (history.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="text-4xl mb-3">📅</p>
        <p className="font-medium">No history yet</p>
        <p className="text-sm mt-1">Previous weeks will appear here once you archive them from the week view.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <h2 className="font-bold text-gray-900 text-lg">History</h2>
      {history.map((entry, idx) => {
        const stats = entry.plan ? computeWeekStats(entry.plan) : null
        return (
          <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setExpanded(expanded === idx ? null : idx)}
            >
              <div>
                <p className="font-semibold text-gray-900 text-sm">{entry.weekLabel ?? `Week ${idx + 1}`}</p>
                <p className="text-xs text-gray-500">{formatDate(entry.archivedAt)}</p>
              </div>
              <span className="text-gray-400">{expanded === idx ? '▲' : '▼'}</span>
            </button>

            {expanded === idx && (
              <div className="border-t border-gray-100">
                {stats && (
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-600 grid grid-cols-2 gap-2">
                    <div><span className="font-medium">Consumed:</span> {stats.totalCal} kcal · {stats.totalProt}g P</div>
                    <div><span className="font-medium">Daily avg:</span> {stats.avgCal} kcal · {stats.avgProt}g P</div>
                  </div>
                )}
                <div className="p-4 space-y-3">
                  {entry.plan?.map(day => (
                    <div key={day.day}>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">{DAY_NAMES[day.day]}</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['lunch', 'dinner', 'treat', 'sides'].map(slot => {
                          const e = day.slots[slot]
                          const recipe = e ? getRecipe(e.recipeId) : null
                          if (!recipe && slot === 'sides') return null
                          return (
                            <div key={slot} className="bg-gray-50 rounded-lg p-2 text-xs">
                              <span className="text-gray-400 font-semibold uppercase text-[10px]">{SLOT_LABEL[slot]}</span>
                              <p className="text-gray-800 font-medium leading-tight mt-0.5 truncate">
                                {recipe?.name ?? '—'}
                              </p>
                              {e?.eaten && <span className="text-green-500 text-[9px]">eaten</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      <button
        onClick={handleClear}
        className="w-full mt-2 text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-2.5 rounded-xl"
      >
        Clear all history
      </button>
    </div>
  )
}
