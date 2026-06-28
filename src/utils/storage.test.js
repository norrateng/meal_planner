import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadSettings,
  saveSettings,
  loadCurrentPlan,
  saveCurrentPlan,
  loadRatings,
  saveRatings,
  loadHistory,
  archiveCurrentPlan,
  clearCurrentPlan,
  DEFAULTS,
} from './storage'

// Use a simple in-memory store for localStorage in tests
const store = {}
const localStorageMock = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, val) => { store[key] = val },
  removeItem: (key) => { delete store[key] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

beforeEach(() => localStorageMock.clear())

describe('loadSettings', () => {
  it('returns defaults when nothing stored', () => {
    expect(loadSettings()).toEqual(DEFAULTS.settings)
  })

  it('merges stored values over defaults', () => {
    saveSettings({ calorieTarget: 2000 })
    expect(loadSettings().calorieTarget).toBe(2000)
    expect(loadSettings().defaultBatchSize).toBe(DEFAULTS.settings.defaultBatchSize)
  })
})

describe('currentPlan', () => {
  it('returns null when nothing stored', () => {
    expect(loadCurrentPlan()).toBeNull()
  })

  it('round-trips a plan', () => {
    const plan = [{ day: 0, slots: {} }]
    saveCurrentPlan(plan)
    expect(loadCurrentPlan()).toEqual(plan)
  })

  it('clears the plan', () => {
    saveCurrentPlan([{ day: 0 }])
    clearCurrentPlan()
    expect(loadCurrentPlan()).toBeNull()
  })
})

describe('ratings', () => {
  it('returns empty object when nothing stored', () => {
    expect(loadRatings()).toEqual({})
  })

  it('round-trips ratings', () => {
    const ratings = { 'chicken-tikka-masala': 3 }
    saveRatings(ratings)
    expect(loadRatings()).toEqual(ratings)
  })
})

describe('history', () => {
  it('returns empty array when nothing stored', () => {
    expect(loadHistory()).toEqual([])
  })

  it('archives a plan and prepends to history', () => {
    const plan = [{ day: 0 }]
    archiveCurrentPlan(plan, 'Week 1')
    const history = loadHistory()
    expect(history).toHaveLength(1)
    expect(history[0].weekLabel).toBe('Week 1')
    expect(history[0].plan).toEqual(plan)
  })

  it('limits history to 52 entries', () => {
    for (let i = 0; i < 55; i++) {
      archiveCurrentPlan([{ day: i }], `Week ${i}`)
    }
    expect(loadHistory()).toHaveLength(52)
  })
})

describe('corrupt storage', () => {
  it('returns default settings on corrupt JSON', () => {
    store['mp_settings'] = 'not-json'
    expect(loadSettings()).toEqual(DEFAULTS.settings)
  })

  it('returns null for corrupt plan', () => {
    store['mp_currentPlan'] = '{'
    expect(loadCurrentPlan()).toBeNull()
  })
})
