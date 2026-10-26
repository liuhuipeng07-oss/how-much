const { CATEGORY_META } = require('./portfolio')
const { archiveAsset, findAsset, saveAsset, today } = require('./store')

const WISH_KEY = 'purchaseWishesV1'
const IDLE_KEY = 'idleListingsV1'
const VOTES = [
  { key: 'buy', label: '买！值得拥有', short: '买' },
  { key: 'wait', label: '等等再说', short: '等等' },
  { key: 'skip', label: '这次不买', short: '不买' }
]
const STATUS = { open: '问问大家', waiting: '先等等', cancelled: '这次不买', purchased: '已经拥有' }
const IDLE_CATEGORIES = ['device', 'collection', 'vehicle']
let sequence = 0

function newId(prefix) {
  sequence += 1
  return `${prefix}-${Date.now()}-${sequence}`
}

function price(value) {
  const number = Number(value)
  if (String(value).trim() === '' || !Number.isFinite(number) || number < 0 || number > 1000000000) {
    throw new Error('请输入有效金额（0～10亿元）')
  }
  return Math.round(number * 100) / 100
}

function initializeLifecycle(storage) {
  if (!Array.isArray(storage.get(WISH_KEY))) {
    storage.set(WISH_KEY, [
      { id: 'wish-demo-camera', name: '带去旅行的口袋相机', category: 'device', budget: 3299,
        reason: '想记录每一次出发，手机拍夜景有些吃力。', alternative: '也可以先用现有手机练习拍照。',
        status: 'open', sampleVotes: { buy: 12, wait: 8, skip: 3 }, myVote: '', isDemo: true, createdAt: today() },
      { id: 'wish-demo-watch', name: '一块每天戴的机械表', category: 'collection', budget: 5800,
        reason: '给自己一个工作周年纪念。', alternative: '先试戴，看看自己是否习惯。',
        status: 'waiting', sampleVotes: { buy: 4, wait: 11, skip: 2 }, myVote: '', isDemo: true, createdAt: today() }
    ])
  }
  if (!Array.isArray(storage.get(IDLE_KEY))) storage.set(IDLE_KEY, [])
}

function getWishes(storage) {
  initializeLifecycle(storage)
  return storage.get(WISH_KEY)
}

function findWish(storage, id) {
  return getWishes(storage).find((wish) => wish.id === id)
}

function updateWish(storage, id, change) {
  const wishes = getWishes(storage)
  const wish = wishes.find((item) => item.id === id)
  if (!wish) throw new Error('没有找到这张愿望卡')
  const next = { ...wish, ...change, updatedAt: today() }
  storage.set(WISH_KEY, wishes.map((item) => item.id === id ? next : item))
  return next
}

function createWish(storage, draft) {
  const name = String(draft.name || '').trim()
  const reason = String(draft.reason || '').trim()
  if (!name || name.length > 40) throw new Error('请填写40字以内的物品名称')
  if (!reason || reason.length > 300) throw new Error('请填写300字以内的购买理由')
  if (!CATEGORY_META[draft.category]) throw new Error('请选择物品分类')
  const wish = {
    id: newId('wish'), name, category: draft.category, budget: price(draft.budget), reason,
    alternative: String(draft.alternative || '').trim().slice(0, 300), status: 'open',
    sampleVotes: { buy: 0, wait: 0, skip: 0 }, myVote: '', isDemo: false, createdAt: today()
  }
  storage.set(WISH_KEY, [wish, ...getWishes(storage)])
  return wish
}

function voteWish(storage, id, choice) {
  const wish = findWish(storage, id)
  if (!wish || wish.status !== 'open') throw new Error('这张愿望卡已结束投票')
  if (!VOTES.some((option) => option.key === choice)) throw new Error('请选择有效选项')
  return updateWish(storage, id, { myVote: choice })
}

function getVoteSummary(wish) {
  const options = VOTES.map((option) => ({
    ...option,
    count: Number((wish.sampleVotes || {})[option.key] || 0) + (wish.myVote === option.key ? 1 : 0)
  }))
  const total = options.reduce((sum, option) => sum + option.count, 0)
  return { total, options: options.map((option) => ({ ...option, percent: total ? Math.round(option.count / total * 100) : 0 })) }
}

function decideWish(storage, id, status) {
  const wish = findWish(storage, id)
  if (!wish || wish.status === 'purchased') throw new Error('已入库的物品请到资产页管理')
  if (!['open', 'waiting', 'cancelled'].includes(status)) throw new Error('无效决定')
  return updateWish(storage, id, { status })
}

function purchaseWish(storage, id, actualPrice) {
  const wish = findWish(storage, id)
  if (!wish) throw new Error('没有找到这张愿望卡')
  if (wish.assetId) return findAsset(storage, wish.assetId)
  if (!['open', 'waiting'].includes(wish.status)) throw new Error('请先重新开启这张愿望卡')
  const amount = price(actualPrice)
  // Stable ID makes a retry safe even if the previous write stopped before updating the wish.
  const assetId = `asset-from-${wish.id}`
  const existing = findAsset(storage, assetId)
  const asset = existing || saveAsset(storage, {
    id: assetId, name: wish.name, category: wish.category, cost: amount, currentValue: amount,
    dailyChange: 0, countInTotal: wish.category !== 'pet', visible: true,
    emotionalValue: wish.category === 'pet' ? '无法估量' : '',
    note: `来自买前问问；${wish.reason}`
  })
  updateWish(storage, id, { status: 'purchased', actualPrice: amount, assetId, purchasedAt: today() })
  return asset
}

function getIdleListings(storage) {
  initializeLifecycle(storage)
  return storage.get(IDLE_KEY)
}

function listIdle(storage, assetId, draft) {
  const asset = findAsset(storage, assetId)
  if (!asset || asset.archived || !IDLE_CATEGORIES.includes(asset.category)) {
    throw new Error('请选择仍在持有的数码、收藏或车辆')
  }
  const condition = String(draft.condition || '').trim()
  if (!condition || condition.length > 100) throw new Error('请填写100字以内的成色说明')
  const listings = getIdleListings(storage)
  const listing = {
    id: `idle-${assetId}`, assetId, askingPrice: price(draft.askingPrice), condition,
    note: String(draft.note || '').trim().slice(0, 300), status: 'listed', updatedAt: today()
  }
  storage.set(IDLE_KEY, [listing, ...listings.filter((item) => item.assetId !== assetId)])
  return listing
}

function changeIdleStatus(storage, id, status) {
  if (!['withdrawn', 'transferred'].includes(status)) throw new Error('无效的闲置状态')
  const listings = getIdleListings(storage)
  const listing = listings.find((item) => item.id === id)
  if (!listing || listing.status !== 'listed') throw new Error('这件闲置已不在展示中')
  if (status === 'transferred') {
    const asset = findAsset(storage, listing.assetId)
    if (!asset || asset.archived) throw new Error('资产已归档，请先检查资产档案')
    archiveAsset(storage, listing.assetId)
  }
  storage.set(IDLE_KEY, listings.map((item) => item.id === id ? { ...item, status, updatedAt: today() } : item))
}

module.exports = {
  WISH_KEY, IDLE_KEY, VOTES, STATUS, IDLE_CATEGORIES, initializeLifecycle,
  createWish, getWishes, findWish, voteWish, getVoteSummary, decideWish, purchaseWish,
  getIdleListings, listIdle, changeIdleStatus
}
