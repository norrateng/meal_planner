import MealCard from './MealCard'
import { getEffectiveMacros } from '../utils/nutritionAdjuster'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function dayTotals(slots) {
  return ['lunch', 'dinner', 'treat', 'sides'].reduce((acc, s) => {
    if (!slots[s]) return acc
    const macros = getEffectiveMacros(slots[s]?.recipeId, slots[s]?.adjustments)
    return {
      calories: acc.calories + (macros?.calories ?? 0),
      protein: acc.protein + (macros?.protein ?? 0),
    }
  }, { calories: 0, protein: 0 })
}

export default function DayCard({ dayData, ratings, onOpenMeal, onRate, onSwap, onMarkEaten, calorieTarget, proteinTarget }) {
  const { day, slots } = dayData
  const { calories, protein } = dayTotals(slots)
  const calOver = calories > calorieTarget
  const proteinMet = proteinTarget ? protein >= proteinTarget : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-2.5 py-1.5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <span className="text-sm font-bold text-gray-800">{DAY_NAMES[day]}</span>
        <div className="text-right">
          <span className={`text-xs font-semibold ${calOver ? 'text-red-500' : 'text-gray-500'}`}>
            {calories} kcal
          </span>
          {proteinTarget && (
            <span className={`ml-2 text-xs font-semibold ${proteinMet ? 'text-green-600' : 'text-orange-500'}`}>
              {protein}g P
            </span>
          )}
        </div>
      </div>

      <div className="p-1.5 flex flex-col gap-1">
        {['lunch', 'dinner', 'treat', 'sides'].map(slot => (
          slots[slot] && (
            <MealCard
              key={slot}
              entry={slots[slot]}
              slot={slot}
              rating={ratings[slots[slot].recipeId]}
              onOpen={() => onOpenMeal(day, slot)}
              onRate={(delta) => onRate(slots[slot].recipeId, delta)}
              onSwap={() => onSwap(day, slot)}
              onMarkEaten={(value) => onMarkEaten(day, slot, value)}
            />
          )
        ))}
      </div>
    </div>
  )
}
