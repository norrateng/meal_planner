const COLORS = { protein: '#10b981', carbs: '#f59e0b', fat: '#ef4444' }

export default function MacroRing({ macros, size = 80 }) {
  const { calories, protein, carbs, fat } = macros
  const total = protein * 4 + carbs * 4 + fat * 9
  const cx = size / 2
  const r = size / 2 - 6
  const circ = 2 * Math.PI * r

  function arc(value, offset) {
    const calories = value * (value === protein ? 4 : value === carbs ? 4 : 9)
    const frac = total > 0 ? calories / total : 0
    return { strokeDasharray: `${frac * circ} ${circ}`, strokeDashoffset: -offset * circ }
  }

  const proteinCals = protein * 4
  const carbCals = carbs * 4
  const fatCals = fat * 9
  const t = proteinCals + carbCals + fatCals || 1

  const pFrac = proteinCals / t
  const cFrac = carbCals / t
  const fFrac = fatCals / t

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
          {/* protein */}
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={COLORS.protein} strokeWidth="6"
            strokeDasharray={`${pFrac * circ} ${circ}`} strokeDashoffset={0} strokeLinecap="butt" />
          {/* carbs */}
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={COLORS.carbs} strokeWidth="6"
            strokeDasharray={`${cFrac * circ} ${circ}`} strokeDashoffset={-pFrac * circ} strokeLinecap="butt" />
          {/* fat */}
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={COLORS.fat} strokeWidth="6"
            strokeDasharray={`${fFrac * circ} ${circ}`} strokeDashoffset={-(pFrac + cFrac) * circ} strokeLinecap="butt" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-900">{calories}</span>
          <span className="text-xs text-gray-500">kcal</span>
        </div>
      </div>
      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS.protein }} />{protein}g P</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS.carbs }} />{carbs}g C</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS.fat }} />{fat}g F</span>
      </div>
    </div>
  )
}
