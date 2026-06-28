import { useState } from 'react'
import WeekView from './components/WeekView'
import ShoppingList from './components/ShoppingList'
import Settings from './components/Settings'
import History from './components/History'
import MealDetail from './components/MealDetail'
import Cupboard from './components/Cupboard'
import Recipes from './components/Recipes'
import { loadSettings, loadCupboard } from './utils/storage'

const VIEWS = { week: 'week', shopping: 'shopping', recipes: 'recipes', cupboard: 'cupboard', history: 'history', settings: 'settings', meal: 'meal' }

const NAV = [
  { key: 'week', label: 'Week' },
  { key: 'shopping', label: 'Shop' },
  { key: 'recipes', label: 'Recipes' },
  { key: 'cupboard', label: 'Cupboard' },
  { key: 'history', label: 'History' },
  { key: 'settings', label: 'Settings' },
]

export default function App() {
  const [view, setView] = useState(VIEWS.week)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [settings, setSettings] = useState(() => loadSettings())
  const [cupboard, setCupboard] = useState(() => loadCupboard())

  function openMeal(day, slot) {
    setSelectedSlot({ day, slot })
    setView(VIEWS.meal)
  }

  function refreshCupboard() {
    setCupboard(loadCupboard())
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      <header className="bg-white border-b border-gray-200 px-3 py-2.5 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-base font-bold text-gray-900">Meal Planner</h1>
        <nav className="flex gap-1 text-xs overflow-x-auto whitespace-nowrap">
          {NAV.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-2.5 py-1 rounded-full font-medium shrink-0 ${view === key ? 'bg-green-600 text-white' : 'text-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 overflow-auto">
        {view === VIEWS.week && <WeekView settings={settings} cupboard={cupboard} onOpenMeal={openMeal} />}
        {view === VIEWS.meal && <MealDetail slot={selectedSlot} settings={settings} onBack={() => setView(VIEWS.week)} />}
        {view === VIEWS.shopping && <ShoppingList settings={settings} onCupboardChange={refreshCupboard} />}
        {view === VIEWS.recipes && <Recipes />}
        {view === VIEWS.cupboard && <Cupboard onCupboardChange={refreshCupboard} />}
        {view === VIEWS.history && <History />}
        {view === VIEWS.settings && <Settings settings={settings} onUpdate={setSettings} />}
      </main>
    </div>
  )
}
