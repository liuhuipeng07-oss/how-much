const assert = require('assert')
const {
  buildForecast,
  calculateSummary,
  createSeedAssets,
  formatMoney,
  getValueRange
} = require('../utils/portfolio')
const {
  archiveAsset,
  calculateMonthlyIncome,
  checkInToday,
  deleteIncome,
  getAssets,
  getIncomes,
  getInteractionState,
  initializeStore,
  interactWithCharacter,
  saveAsset,
  setAssetVisibility
} = require('../utils/store')

const assets = createSeedAssets()
const summary = calculateSummary(assets)

assert.strictEqual(summary.total, 3984000)
assert.strictEqual(summary.dailyChange, 3970)
assert.strictEqual(summary.count, 11)
assert.strictEqual(formatMoney(3984000), '398.4万')
assert.strictEqual(formatMoney(9800), '9,800')
assert.strictEqual(getValueRange(3984000), '100万—500万')

const forecast = buildForecast(100000, 10000, 0, 0, 3)
assert.deepStrictEqual(forecast.map((point) => point.value), [100000, 220000, 340000, 460000])

const growing = buildForecast(100000, 0, 10, 0, 2)
assert.deepStrictEqual(growing.map((point) => point.value), [100000, 110000, 121000])

const memory = {}
const storage = {
  get: (key) => memory[key],
  set: (key, value) => {
    memory[key] = value
  }
}
initializeStore(storage)
assert.ok(getAssets(storage).length > 0)
assert.ok(getIncomes(storage).length > 0)
assert.strictEqual(calculateMonthlyIncome(getIncomes(storage)), 34000)
assert.strictEqual(memory.dailySnapshots.length, 30)

const created = saveAsset(storage, {
  name: '测试档案',
  category: 'device',
  currentValue: 5000,
  cost: 6000,
  visible: true,
  countInTotal: true
})
assert.ok(getAssets(storage).some((asset) => asset.id === created.id))
assert.strictEqual(archiveAsset(storage, created.id), true)
assert.ok(!getAssets(storage).some((asset) => asset.id === created.id))
assert.ok(getAssets(storage, { includeArchived: true }).some((asset) => asset.id === created.id))

const equipAsset = saveAsset(storage, {
  name: '测试装备',
  category: 'collection',
  currentValue: 1000,
  visible: false
})
assert.strictEqual(setAssetVisibility(storage, equipAsset.id, true), true)
assert.strictEqual(getAssets(storage).find((asset) => asset.id === equipAsset.id).visible, true)

const interaction = interactWithCharacter(storage)
assert.strictEqual(interaction.touches, 1)
assert.strictEqual(interaction.energy, 13)
assert.strictEqual(getInteractionState(storage).touches, 1)
assert.strictEqual(checkInToday(storage).checkedIn, true)
assert.strictEqual(checkInToday(storage).checkedIn, false)

const incomeId = getIncomes(storage)[0].id
assert.strictEqual(deleteIncome(storage, incomeId), true)
assert.ok(!getIncomes(storage).some((income) => income.id === incomeId))

console.log('portfolio tests passed')
