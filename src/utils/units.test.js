import { describe, it, expect } from 'vitest'
import { convertToImperial, formatQuantity } from './units'

describe('convertToImperial', () => {
  it('converts grams to oz', () => {
    const result = convertToImperial(100, 'g')
    expect(result.unit).toBe('oz')
    expect(result.quantity).toBeCloseTo(3.5, 1)
  })

  it('converts kg to lb', () => {
    const result = convertToImperial(1, 'kg')
    expect(result.unit).toBe('lb')
    expect(result.quantity).toBeCloseTo(2.2, 1)
  })

  it('converts ml to fl oz', () => {
    const result = convertToImperial(200, 'ml')
    expect(result.unit).toBe('fl oz')
    expect(result.quantity).toBeCloseTo(7, 0)
  })

  it('passes through non-convertible units unchanged', () => {
    const result = convertToImperial(2, 'whole')
    expect(result).toEqual({ quantity: 2, unit: 'whole' })
  })
})

describe('formatQuantity', () => {
  it('returns metric format by default', () => {
    expect(formatQuantity(200, 'g')).toBe('200g')
  })

  it('returns imperial format when useImperial is true', () => {
    const result = formatQuantity(100, 'g', true)
    expect(result).toContain('oz')
  })

  it('formats whole numbers without decimal', () => {
    expect(formatQuantity(300, 'g', false)).toBe('300g')
  })
})
