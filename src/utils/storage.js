const KEYS = {
  currentPlan: 'mp_currentPlan',
  settings: 'mp_settings',
  ratings: 'mp_ratings',
  history: 'mp_history',
  cupboard: 'mp_cupboard',
  shoppingChecked: 'mp_shoppingChecked',
}

const DEFAULTS = {
  settings: { calorieTarget: 1600, defaultBatchSize: 1, useImperial: false, proteinTarget: 120, treatsPerWeek: 3, cuisineWeights: {} },
  ratings: {},
  history: [],
  currentPlan: null,
  cupboard: [],
}

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function clear(key) {
  localStorage.removeItem(key)
}

export function loadSettings() {
  return { ...DEFAULTS.settings, ...(read(KEYS.settings) ?? {}) }
}

export function saveSettings(settings) {
  write(KEYS.settings, settings)
}

export function loadCurrentPlan() {
  return read(KEYS.currentPlan) ?? DEFAULTS.currentPlan
}

export function saveCurrentPlan(plan) {
  write(KEYS.currentPlan, plan)
}

export function loadRatings() {
  return read(KEYS.ratings) ?? DEFAULTS.ratings
}

export function saveRatings(ratings) {
  write(KEYS.ratings, ratings)
}

export function loadHistory() {
  return read(KEYS.history) ?? DEFAULTS.history
}

export function archiveCurrentPlan(plan, weekLabel) {
  const history = loadHistory()
  history.unshift({ weekLabel, plan, archivedAt: Date.now() })
  write(KEYS.history, history.slice(0, 52)) // keep up to 1 year
}

export function clearCurrentPlan() {
  clear(KEYS.currentPlan)
}

export function clearHistory() {
  write(KEYS.history, [])
}

export function loadCupboard() {
  return read(KEYS.cupboard) ?? DEFAULTS.cupboard
}

export function saveCupboard(items) {
  write(KEYS.cupboard, items)
}

export function addToCupboard(ingredients) {
  const current = loadCupboard()
  const updated = [...current]
  for (const ing of ingredients) {
    const key = ing.name.toLowerCase()
    const existing = updated.find(i => i.name.toLowerCase() === key)
    if (existing && existing.unit === ing.unit) {
      existing.quantity = +(existing.quantity + ing.quantity).toFixed(2)
    } else {
      updated.push({ name: ing.name, quantity: ing.quantity, unit: ing.unit, addedOn: Date.now() })
    }
  }
  saveCupboard(updated)
  return updated
}

export function consumeFromCupboard(ingredients) {
  const current = loadCupboard()
  const updated = current.map(item => {
    const ing = ingredients.find(i => i.name.toLowerCase() === item.name.toLowerCase() && i.unit === item.unit)
    if (!ing) return item
    const remaining = item.quantity - ing.quantity
    return remaining > 0 ? { ...item, quantity: +remaining.toFixed(2) } : null
  }).filter(Boolean)
  saveCupboard(updated)
  return updated
}

export function loadShoppingChecked() {
  return read(KEYS.shoppingChecked) ?? {}
}

export function saveShoppingChecked(checked) {
  write(KEYS.shoppingChecked, checked)
}

export function clearShoppingChecked() {
  clear(KEYS.shoppingChecked)
}

export { KEYS, DEFAULTS }
