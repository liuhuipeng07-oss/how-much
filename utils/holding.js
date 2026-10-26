const DAY = 86400000
function dateText(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function calendarTime(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null
  const [year, month, day] = value.split('-').map(Number)
  const time = Date.UTC(year, month - 1, day)
  const date = new Date(time)
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? time : null
}
function holdingStats(asset, asOf = dateText()) {
  const start = calendarTime(asset.acquiredAt)
  const end = calendarTime(asOf)
  if (start === null || end === null || start > end) return { hasHoldingDate: false, holdingDays: 0, dailyCostText: '' }
  const holdingDays = Math.max(1, Math.round((end - start) / DAY))
  const dailyCost = Math.max(0, Number(asset.cost) || 0) / holdingDays
  return { hasHoldingDate: true, holdingDays, dailyCost, dailyCostText: dailyCost.toFixed(2) }
}
module.exports = { dateText, calendarTime, holdingStats }
