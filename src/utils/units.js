// Conversion factors from metric to imperial
const CONVERSIONS = {
  g: { factor: 0.0353174, unit: 'oz' },
  kg: { factor: 2.20462, unit: 'lb' },
  ml: { factor: 0.0351951, unit: 'fl oz' },
  L: { factor: 1.75975, unit: 'pt' },
}

export function convertToImperial(quantity, unit) {
  const conv = CONVERSIONS[unit]
  if (!conv) return { quantity, unit } // whole, clove, etc. — unchanged
  return {
    quantity: +(quantity * conv.factor).toFixed(1),
    unit: conv.unit,
  }
}

export function formatQuantity(quantity, unit, useImperial = false) {
  if (useImperial) {
    const converted = convertToImperial(quantity, unit)
    return `${converted.quantity}${converted.unit}`
  }
  // Format metric: avoid trailing .0 for whole numbers
  const rounded = Number.isInteger(quantity) ? quantity : +quantity.toFixed(1)
  return `${rounded}${unit}`
}
