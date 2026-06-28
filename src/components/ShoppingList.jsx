import { useState } from 'react'
import { buildShoppingList, AISLE_ORDER } from '../utils/shoppingList'
import { loadCurrentPlan } from '../utils/storage'
import { formatQuantity } from '../utils/units'

const AISLE_ICONS = {
  meat: '🥩', produce: '🥦', dairy: '🥛', bakery: '🍞',
  cupboard: '🥫', international: '🌍', frozen: '❄️',
}

function exportAsText(grouped, useImperial) {
  let text = 'Shopping List\n\n'
  for (const aisle of AISLE_ORDER) {
    const items = grouped[aisle]
    if (!items) continue
    text += `${aisle.toUpperCase()}\n`
    for (const item of items) {
      const qty = formatQuantity(item.quantity, item.unit, useImperial)
      const sub = item.substitute ? ` (or: ${item.substitute})` : ''
      text += `  ☐ ${qty} ${item.name}${sub}\n`
    }
    text += '\n'
  }
  return text
}

export default function ShoppingList({ settings }) {
  const plan = loadCurrentPlan()
  const [checked, setChecked] = useState({})

  if (!plan) return <div className="p-6 text-center text-gray-500">No plan yet. Generate a week first.</div>

  const grouped = buildShoppingList(plan)
  const useImperial = settings?.useImperial ?? false

  function toggle(key) {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleExport() {
    const text = exportAsText(grouped, useImperial)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shopping-list.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const total = Object.values(grouped).flat().length
  const done = Object.values(checked).filter(Boolean).length

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">Shopping List</h2>
          <p className="text-xs text-gray-500">{done}/{total} items checked</p>
        </div>
        <button onClick={handleExport} className="text-sm border border-gray-200 bg-white text-gray-700 px-3 py-1.5 rounded-lg">
          Export
        </button>
      </div>

      {AISLE_ORDER.filter(a => grouped[a]).map(aisle => (
        <section key={aisle}>
          <h3 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-2">
            <span>{AISLE_ICONS[aisle]}</span>
            <span className="capitalize">{aisle}</span>
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {grouped[aisle].map((item, i) => {
              const key = `${aisle}-${item.name}`
              const qty = formatQuantity(item.quantity, item.unit, useImperial)
              return (
                <label key={i} className="flex items-start gap-3 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!checked[key]}
                    onChange={() => toggle(key)}
                    className="mt-0.5 accent-green-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${checked[key] ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.name}
                    </p>
                    {item.substitute && (
                      <p className="text-xs text-gray-400">Sub: {item.substitute}</p>
                    )}
                    {item.sharedIn.length > 1 && (
                      <p className="text-xs text-blue-500">Used in {item.sharedIn.length} recipes</p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-600 shrink-0">{qty}</span>
                </label>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
