function uid() {
  return Math.random().toString(36).slice(2, 10)
}

/**
 * Takes a 7-day plan array and assigns batchGroupIds.
 * For each non-repeat meal slot (lunch/dinner only), if batchSize >= 2,
 * auto-schedules repeat appearances on day+1 and day+4 or day+5.
 * Treats are never batch-scheduled.
 */
export function applyBatchSchedule(days) {
  const result = days.map(d => ({
    ...d,
    slots: {
      lunch: { ...d.slots.lunch },
      dinner: { ...d.slots.dinner },
      treat: { ...d.slots.treat },
      sides: d.slots.sides ? { ...d.slots.sides } : null,
    },
  }))

  for (let day = 0; day < 7; day++) {
    for (const slot of ['lunch', 'dinner']) {
      const entry = result[day].slots[slot]
      if (entry.isBatchRepeat || entry.batchGroupId || entry.locked) continue
      if (entry.batchSize < 2) continue

      const groupId = uid()
      entry.batchGroupId = groupId

      // Servings remaining after eating one on cook day
      let remaining = entry.batchSize - 1

      // Try to fill next-day slot first, then +4/+5
      const repeatDays = [day + 1, day + 4, day + 5, day + 2, day + 3, day + 6]

      for (const targetDay of repeatDays) {
        if (remaining <= 0) break
        if (targetDay >= 7) continue
        const target = result[targetDay].slots[slot]
        if (target.isBatchRepeat || target.locked || target.batchGroupId) continue

        result[targetDay].slots[slot] = {
          ...entry,
          day: targetDay,
          isBatchRepeat: true,
          locked: false,
        }
        remaining--
      }
    }
  }

  return result
}
