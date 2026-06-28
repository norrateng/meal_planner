const KEYS = {
  currentPlan: 'mp_currentPlan',
  settings: 'mp_settings',
  ratings: 'mp_ratings',
  history: 'mp_history',
}

const DEFAULTS = {
  settings: { calorieTarget: 1600, defaultBatchSize: 4, viewMode: 'calendar' },
  ratings: {},
  history: [],
  currentPlan: null,
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

export { KEYS, DEFAULTS }
