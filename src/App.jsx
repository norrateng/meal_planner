import { useState } from 'react'
import WeekView from './components/WeekView'
import ShoppingList from './components/ShoppingList'
import Settings from './components/Settings'
import History from './components/History'
import MealDetail from './components/MealDetail'
import { loadSettings } from './utils/storage'

const VIEWS = { week: 'week', shopping: 'shopping', settings: 'settings', history: 'history', meal: 'meal' }

export default function App() {
  const [view, setView] = useState(VIEWS.week)
  const [selectedSlot, setSelectedSlot] = useState(null) // { day, slot }
  const [settings, setSettings] = useState(() => loadSettings())

  function openMeal(day, slot) {
    setSelectedSlot({ day, slot })
    setView(VIEWS.meal)
  }

  function updateSettings(next) {
    setSettings(next)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">Meal Planner</h1>
        <nav className="flex gap-2 text-sm">
          <button onClick={() => setView(VIEWS.week)} className={`px-3 py-1 rounded-full ${view === VIEWS.week ? 'bg-green-600 text-white' : 'text-gray-600'}`}>Week</button>
          <button onClick={() => setView(VIEWS.shopping)} className={`px-3 py-1 rounded-full ${view === VIEWS.shopping ? 'bg-green-600 text-white' : 'text-gray-600'}`}>Shop</button>
          <button onClick={() => setView(VIEWS.history)} className={`px-3 py-1 rounded-full ${view === VIEWS.history ? 'bg-green-600 text-white' : 'text-gray-600'}`}>History</button>
          <button onClick={() => setView(VIEWS.settings)} className={`px-3 py-1 rounded-full ${view === VIEWS.settings ? 'bg-green-600 text-white' : 'text-gray-600'}`}>Settings</button>
        </nav>
      </header>

      <main className="flex-1 overflow-auto">
        {view === VIEWS.week && <WeekView settings={settings} onOpenMeal={openMeal} />}
        {view === VIEWS.meal && <MealDetail slot={selectedSlot} settings={settings} onBack={() => setView(VIEWS.week)} />}
        {view === VIEWS.shopping && <ShoppingList settings={settings} />}
        {view === VIEWS.history && <History />}
        {view === VIEWS.settings && <Settings settings={settings} onUpdate={updateSettings} />}
      </main>
    </div>
  )
}
