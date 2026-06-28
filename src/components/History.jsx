import { useState } from 'react'
import { loadHistory } from '../utils/storage'
import { getRecipe } from '../utils/planStore'

const SLOT_LABEL = { lunch: 'L', dinner: 'D', treat: 'T' }
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function History() {
  const history = loadHistory()
  const [expanded, setExpanded] = useState(null)

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
      {history.map((entry, idx) => (
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
            <div className="border-t border-gray-100 p-4 space-y-3">
              {entry.plan?.map(day => (
                <div key={day.day}>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">{DAY_NAMES[day.day]}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['lunch', 'dinner', 'treat'].map(slot => {
                      const e = day.slots[slot]
                      const recipe = e ? getRecipe(e.recipeId) : null
                      return (
                        <div key={slot} className="bg-gray-50 rounded-lg p-2 text-xs">
                          <span className="text-gray-400 font-semibold uppercase text-[10px]">{SLOT_LABEL[slot]}</span>
                          <p className="text-gray-800 font-medium leading-tight mt-0.5 truncate">
                            {recipe?.name ?? '—'}
                          </p>
                          {e?.isBatchRepeat && <span className="text-gray-400">(batch)</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
