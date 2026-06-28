import MealCard from './MealCard'
import { getRecipe } from '../utils/planStore'
import { getEffectiveMacros } from '../utils/nutritionAdjuster'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function totalCalories(slots) {
  return ['lunch', 'dinner', 'treat'].reduce((sum, s) => {
    const macros = getEffectiveMacros(slots[s]?.recipeId, slots[s]?.adjustments)
    return sum + (macros?.calories ?? 0)
  }, 0)
}

export default function DayCard({ dayData, ratings, onOpenMeal, onRate, onSwap, onLock, calorieTarget }) {
  const { day, slots } = dayData
  const total = totalCalories(slots)
  const over = total > calorieTarget

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <span className="font-bold text-gray-800">{DAY_NAMES[day]}</span>
        <span className={`text-sm font-semibold ${over ? 'text-red-500' : 'text-gray-500'}`}>
          {total} / {calorieTarget} kcal
        </span>
      </div>
      <div className="p-2 flex flex-col gap-2">
        {['lunch', 'dinner', 'treat'].map(slot => (
          slots[slot] && (
            <MealCard
              key={slot}
              entry={slots[slot]}
              slot={slot}
              rating={ratings[slots[slot].recipeId]}
              onOpen={() => onOpenMeal(day, slot)}
              onRate={(delta) => onRate(slots[slot].recipeId, delta)}
              onSwap={() => onSwap(day, slot)}
              onLock={() => onLock(day, slot)}
            />
          )
        ))}
      </div>
    </div>
  )
}
