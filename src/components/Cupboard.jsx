import { useState } from 'react'
import { loadCupboard, saveCupboard } from '../utils/storage'

const UNITS = ['g', 'kg', 'ml', 'L', 'whole', 'clove', 'slice', 'cube', 'stick']

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function Cupboard({ onCupboardChange }) {
  const [items, setItems] = useState(() => loadCupboard())
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('g')
  const [editId, setEditId] = useState(null)
  const [editQty, setEditQty] = useState('')

  function persist(next) {
    saveCupboard(next)
    setItems(next)
    onCupboardChange?.(next)
  }

  function addItem(e) {
    e.preventDefault()
    if (!name.trim() || !quantity) return
    const next = [...items, { name: name.trim(), quantity: +quantity, unit, addedOn: Date.now() }]
    persist(next)
    setName('')
    setQuantity('')
    setUnit('g')
  }

  function deleteItem(idx) {
    persist(items.filter((_, i) => i !== idx))
  }

  function startEdit(idx) {
    setEditId(idx)
    setEditQty(String(items[idx].quantity))
  }

  function saveEdit(idx) {
    const next = items.map((item, i) => i === idx ? { ...item, quantity: +editQty } : item)
    persist(next)
    setEditId(null)
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="font-bold text-gray-900">Cupboard</h2>
        <p className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''} in stock</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
        Items in your cupboard are used to favour recipes that use your existing stock when the next plan is generated. Mark meals as eaten in the Week tab to automatically remove their ingredients.
      </div>

      {/* Add item form */}
      <form onSubmit={addItem} className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
        <p className="text-sm font-medium text-gray-700">Add ingredient</p>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ingredient name"
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="Qty"
            min={0}
            step={0.1}
            className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
          />
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <button type="submit" className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
            Add
          </button>
        </div>
      </form>

      {/* Cupboard items */}
      {items.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <p className="text-3xl mb-2">🗄️</p>
          <p className="text-sm">Your cupboard is empty.</p>
          <p className="text-xs mt-1">Add ingredients manually or import from the shopping list.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">Added {formatDate(item.addedOn)}</p>
              </div>
              {editId === idx ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={editQty}
                    onChange={e => setEditQty(e.target.value)}
                    className="w-16 border border-gray-200 rounded px-1 py-0.5 text-sm text-center"
                    autoFocus
                  />
                  <span className="text-xs text-gray-500">{item.unit}</span>
                  <button onClick={() => saveEdit(idx)} className="text-xs text-green-700 font-semibold px-1">✓</button>
                  <button onClick={() => setEditId(null)} className="text-xs text-gray-400 px-1">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(idx)} className="text-sm font-medium text-gray-700 hover:text-gray-900">
                    {item.quantity}{item.unit}
                  </button>
                  <button onClick={() => deleteItem(idx)} className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
