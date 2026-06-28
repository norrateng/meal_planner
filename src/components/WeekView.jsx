import { useState } from 'react'
import DayCard from './DayCard'
import SwapPicker from './SwapPicker'
import { usePlanStore } from '../utils/planStore'

export default function WeekView({ settings, cupboard, onOpenMeal }) {
  const { plan, ratings, regenerate, swapSlot, rateRecipe, markEaten, archiveAndRegenerate } = usePlanStore(settings, cupboard)
  const [pickerTarget, setPickerTarget] = useState(null)

  function handleArchive() {
    const label = window.prompt('Label for this week (e.g. "Week of 28 Jun"):') ?? 'Unnamed week'
    archiveAndRegenerate(label)
  }

  function handleOpenSwap(day, slot) {
    setPickerTarget({ day, slot })
  }

  function handleConfirmSwap(recipeId) {
    swapSlot(pickerTarget.day, pickerTarget.slot, recipeId)
    setPickerTarget(null)
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-end mb-3 gap-2">
        <button onClick={handleArchive} className="border border-gray-300 text-gray-700 text-sm px-3 py-1.5 rounded-lg font-medium">
          Archive
        </button>
        <button onClick={regenerate} className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg font-medium">
          Regenerate
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {plan.map(dayData => (
          <DayCard
            key={dayData.day}
            dayData={dayData}
            ratings={ratings}
            calorieTarget={settings.calorieTarget}
            proteinTarget={settings.proteinTarget}
            onOpenMeal={onOpenMeal}
            onRate={rateRecipe}
            onSwap={handleOpenSwap}
            onMarkEaten={markEaten}
          />
        ))}
      </div>

      {pickerTarget && (
        <SwapPicker
          day={pickerTarget.day}
          slot={pickerTarget.slot}
          plan={plan}
          ratings={ratings}
          cupboard={cupboard}
          onSelect={handleConfirmSwap}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  )
}
