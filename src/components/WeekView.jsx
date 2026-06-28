import { useState } from 'react'
import DayCard from './DayCard'
import { usePlanStore } from '../utils/planStore'

export default function WeekView({ settings, onOpenMeal }) {
  const [viewMode, setViewMode] = useState(settings.viewMode ?? 'calendar')
  const { plan, ratings, regenerate, updateSlot, rateRecipe } = usePlanStore(settings)

  function handleSwap(day, slot) {
    // Unlock and re-roll that slot via a targeted regeneration
    updateSlot(day, slot, { locked: false })
    // For a real swap we'd need a targeted re-pick — simplified: just unlock for now
  }

  function handleLock(day, slot) {
    const current = plan[day]?.slots[slot]
    if (current) updateSlot(day, slot, { locked: !current.locked })
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm">
          <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 ${viewMode === 'calendar' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>
            Calendar
          </button>
          <button onClick={() => setViewMode('scroll')} className={`px-3 py-1.5 ${viewMode === 'scroll' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>
            Scroll
          </button>
        </div>
        <button onClick={regenerate} className="bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg font-medium">
          Regenerate
        </button>
      </div>

      <div className={viewMode === 'scroll' ? 'flex flex-col gap-4' : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7'}>
        {plan.map(dayData => (
          <DayCard
            key={dayData.day}
            dayData={dayData}
            ratings={ratings}
            calorieTarget={settings.calorieTarget}
            onOpenMeal={onOpenMeal}
            onRate={rateRecipe}
            onSwap={handleSwap}
            onLock={handleLock}
          />
        ))}
      </div>
    </div>
  )
}
