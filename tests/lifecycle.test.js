const assert = require('assert')
const { calculateSummary } = require('../utils/portfolio')
const { initializeStore, getAssets, findAsset, restoreAsset } = require('../utils/store')
const {
  initializeLifecycle, getWishes, createWish, findWish, voteWish, getVoteSummary, decideWish,
  purchaseWish, getIdleListings, listIdle, changeIdleStatus
} = require('../utils/lifecycle')

const memory = {}
const storage = {
  get: (key) => memory[key] === undefined ? undefined : JSON.parse(JSON.stringify(memory[key])),
  set: (key, value) => { memory[key] = JSON.parse(JSON.stringify(value)) }
}
initializeStore(storage)
initializeLifecycle(storage)
const total = () => calculateSummary(getAssets(storage)).total
const before = total()
const originalCount = getAssets(storage).length
assert.strictEqual(getWishes(storage).length, 2)
const wish = createWish(storage, { name: '出游相机', category: 'device', budget: '3299.99', reason: '旅行记录' })
assert.strictEqual(total(), before)
assert.strictEqual(getVoteSummary(wish).total, 0)
voteWish(storage, wish.id, 'buy')
voteWish(storage, wish.id, 'buy')
assert.strictEqual(getVoteSummary(findWish(storage, wish.id)).total, 1)
voteWish(storage, wish.id, 'wait')
const votes = getVoteSummary(findWish(storage, wish.id))
assert.strictEqual(votes.options.find((option) => option.key === 'buy').count, 0)
assert.strictEqual(votes.options.find((option) => option.key === 'wait').count, 1)
assert.throws(() => voteWish(storage, wish.id, 'fake'))
decideWish(storage, wish.id, 'waiting')
assert.throws(() => voteWish(storage, wish.id, 'buy'))
decideWish(storage, wish.id, 'cancelled')
assert.throws(() => purchaseWish(storage, wish.id, 3000))
assert.strictEqual(total(), before)
decideWish(storage, wish.id, 'open')
assert.throws(() => purchaseWish(storage, wish.id, '-1'))
assert.throws(() => purchaseWish(storage, wish.id, ''))
const owned = purchaseWish(storage, wish.id, '2999.99')
assert.strictEqual(total(), before + 2999.99)
assert.strictEqual(owned.cost, 2999.99)
assert.strictEqual(owned.visible, true)
assert.strictEqual(getAssets(storage).length, originalCount + 1)
assert.strictEqual(findWish(storage, wish.id).status, 'purchased')
purchaseWish(storage, wish.id, 999)
assert.strictEqual(total(), before + 2999.99)
assert.strictEqual(getAssets(storage).length, originalCount + 1)
assert.throws(() => decideWish(storage, wish.id, 'open'))

const listed = listIdle(storage, owned.id, { askingPrice: 2100, condition: '九成新', note: '附原包装' })
assert.strictEqual(total(), before + 2999.99)
listIdle(storage, owned.id, { askingPrice: 2000, condition: '九成新' })
assert.strictEqual(getIdleListings(storage).length, 1)
assert.strictEqual(findAsset(storage, owned.id).currentValue, 2999.99)
changeIdleStatus(storage, listed.id, 'withdrawn')
assert.strictEqual(total(), before + 2999.99)
assert.strictEqual(findAsset(storage, owned.id).visible, true)
listIdle(storage, owned.id, { askingPrice: 0, condition: '送给需要的人' })
changeIdleStatus(storage, listed.id, 'transferred')
assert.strictEqual(total(), before)
assert.strictEqual(findAsset(storage, owned.id).archived, true)
assert.strictEqual(findAsset(storage, owned.id).visible, false)
assert.throws(() => changeIdleStatus(storage, listed.id, 'transferred'))
assert.throws(() => listIdle(storage, owned.id, { askingPrice: 0, condition: '完好' }))
assert.throws(() => listIdle(storage, 'pet-demo-1', { askingPrice: 1, condition: '健康' }))
restoreAsset(storage, owned.id)
assert.strictEqual(getIdleListings(storage)[0].status, 'transferred')
assert.strictEqual(total(), before + 2999.99)

for (const invalid of ['', '-1', 'Infinity', 'abc', '1000000001']) {
  assert.throws(() => createWish(storage, { name: '测试', category: 'device', budget: invalid, reason: '测试' }))
}
assert.throws(() => createWish(storage, { name: '', category: 'device', budget: 10, reason: '测试' }))
assert.throws(() => createWish(storage, { name: '测试', category: 'unknown', budget: 10, reason: '测试' }))
const ownWish = createWish(storage, { name: '保留记录', category: 'collection', budget: 100, reason: '纪念' })
memory.purchaseWishesV1 = [ownWish]
initializeLifecycle(storage)
assert.strictEqual(getWishes(storage).length, 1)
memory.purchaseWishesV1 = []
initializeLifecycle(storage)
assert.deepStrictEqual(getWishes(storage), [])

const legacy = { assets: [{ id: 'old', name: '旧数据', category: 'device', currentValue: 123, cost: 99 }], incomes: [] }
const legacyStorage = { get: (key) => legacy[key], set: (key, value) => { legacy[key] = value } }
initializeStore(legacyStorage)
assert.strictEqual(getAssets(legacyStorage)[0].id, 'old')
assert.strictEqual(getAssets(legacyStorage).length, 1)
assert.strictEqual(total() > 0, true)
console.log('lifecycle tests passed: wish, vote, purchase, idle, migration')
