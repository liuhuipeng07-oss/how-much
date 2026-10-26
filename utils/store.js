const { calculateSummary, createSeedAssets, toNumber } = require('./portfolio')

const KEYS = {
  assets: 'assets',
  character: 'character',
  incomes: 'incomes',
  interaction: 'interactionState',
  snapshots: 'dailySnapshots',
  shareSettings: 'shareSettings',
  demoDataVersion: 'demoDataVersion'
}

const DEMO_DATA_VERSION = 1

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function today() {
  return formatDate(new Date())
}

function yesterday() {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return formatDate(date)
}

function createSeedSnapshots(currentTotal, days = 30) {
  const snapshots = []
  const now = new Date()
  let seed = 20260728
  let value = Math.max(0, currentTotal - 155000)

  for (let daysAgo = days - 1; daysAgo >= 1; daysAgo -= 1) {
    seed = (seed * 9301 + 49297) % 233280
    const noise = (seed / 233280 - 0.5) * 14000
    value += 5200 + noise
    const date = new Date(now)
    date.setDate(now.getDate() - daysAgo)
    snapshots.push({
      date: formatDate(date),
      totalValue: Math.round(Math.max(0, value)),
      totalCost: 3324399,
      dailyChange: Math.round(5200 + noise)
    })
  }
  return snapshots
}

function createSeedIncomes() {
  return [
    {
      id: 'income-salary-1',
      type: 'salary',
      name: '每月工资收入',
      amount: 28000,
      cycle: 'monthly',
      occurredAt: today(),
      createdAt: today()
    },
    {
      id: 'income-side-1',
      type: 'side',
      name: '每月副业收入',
      amount: 6000,
      cycle: 'monthly',
      occurredAt: today(),
      createdAt: today()
    },
    {
      id: 'income-bonus-1',
      type: 'bonus',
      name: '年度项目奖金',
      amount: 20000,
      cycle: 'once',
      occurredAt: today(),
      createdAt: today()
    }
  ]
}

function initializeStore(storage) {
  const shouldLoadDemoData = storage.get(KEYS.demoDataVersion) !== DEMO_DATA_VERSION
  if (shouldLoadDemoData) {
    const demoAssets = createSeedAssets().map((asset) => ({
      ...asset,
      archived: false,
      countInTotal: asset.countInTotal === undefined ? asset.category !== 'pet' : asset.countInTotal,
      createdAt: today(),
      updatedAt: today()
    }))
    if (!storage.get(KEYS.assets)) storage.set(KEYS.assets, demoAssets)
    if (!storage.get(KEYS.incomes)) storage.set(KEYS.incomes, createSeedIncomes())
    if (!storage.get(KEYS.snapshots)) {
      storage.set(KEYS.snapshots, createSeedSnapshots(calculateSummary(storage.get(KEYS.assets)).total))
    }
    storage.set(KEYS.demoDataVersion, DEMO_DATA_VERSION)
  }

  const existingAssets = storage.get(KEYS.assets)
  if (!existingAssets) {
    storage.set(KEYS.assets, createSeedAssets().map((asset) => ({
      ...asset,
      archived: false,
      countInTotal: asset.category !== 'pet',
      createdAt: today(),
      updatedAt: today()
    })))
  } else {
    storage.set(KEYS.assets, existingAssets.map((asset) => ({
      ...asset,
      archived: Boolean(asset.archived),
      countInTotal: asset.countInTotal === undefined ? asset.category !== 'pet' : asset.countInTotal,
      createdAt: asset.createdAt || today(),
      updatedAt: asset.updatedAt || today()
    })))
  }
  if (!storage.get(KEYS.character)) {
    storage.set(KEYS.character, {
      nickname: '岛屿冒险家',
      title: '价值探索者',
      age: '35',
      occupation: '创业者',
      city: '厦门',
      hair: '栗子棕',
      hairColor: '#74482f',
      outfit: '森林斗篷',
      outfitColor: '#4d7558'
    })
  }
  if (!storage.get(KEYS.incomes)) {
    storage.set(KEYS.incomes, createSeedIncomes())
  }
  if (!storage.get(KEYS.shareSettings)) {
    storage.set(KEYS.shareSettings, { privacyLevel: 'range' })
  }
  if (!storage.get(KEYS.interaction)) {
    storage.set(KEYS.interaction, {
      energy: 12,
      lastCheckin: '',
      mood: '期待出发',
      streak: 0,
      touches: 0
    })
  }
  if (!storage.get(KEYS.snapshots)) {
    const currentTotal = calculateSummary(getAssets(storage)).total
    storage.set(KEYS.snapshots, createSeedSnapshots(currentTotal))
  }
  saveTodaySnapshot(storage)
}

function getAssets(storage, options = {}) {
  const assets = storage.get(KEYS.assets) || []
  if (options.includeArchived) return assets
  return assets.filter((asset) => !asset.archived)
}

function findAsset(storage, id) {
  return getAssets(storage, { includeArchived: true }).find((asset) => asset.id === id)
}

function saveAsset(storage, draft) {
  const assets = getAssets(storage, { includeArchived: true })
  const previous = assets.find((item) => item.id === draft.id)
  const now = today()
  const asset = {
    id: draft.id || `asset-${Date.now()}`,
    name: String(draft.name || '').trim(),
    category: draft.category || 'other',
    cost: toNumber(draft.cost),
    currentValue: toNumber(draft.currentValue),
    dailyChange: toNumber(draft.dailyChange),
    visible: Boolean(draft.visible),
    countInTotal: draft.countInTotal !== false,
    valuationMode: draft.valuationMode || 'manual',
    acquiredAt: draft.acquiredAt === undefined ? (previous && previous.acquiredAt || '') : String(draft.acquiredAt || ''),
    emotionalValue: draft.emotionalValue || '',
    note: String(draft.note || '').trim(),
    archived: draft.archived === undefined ? Boolean(previous && previous.archived) : Boolean(draft.archived),
    createdAt: draft.createdAt || now,
    updatedAt: now
  }
  const index = assets.findIndex((item) => item.id === asset.id)
  if (index >= 0) assets[index] = asset
  else assets.unshift(asset)
  storage.set(KEYS.assets, assets)
  saveTodaySnapshot(storage)
  return asset
}

function archiveAsset(storage, id) {
  const asset = findAsset(storage, id)
  if (!asset) return false
  saveAsset(storage, { ...asset, archived: true, visible: false })
  return true
}

function restoreAsset(storage, id) {
  const asset = findAsset(storage, id)
  if (!asset) return false
  saveAsset(storage, { ...asset, archived: false })
  return true
}

function setAssetVisibility(storage, id, visible) {
  const asset = findAsset(storage, id)
  if (!asset || asset.archived) return false
  saveAsset(storage, { ...asset, visible: Boolean(visible) })
  return true
}

function getIncomes(storage) {
  return storage.get(KEYS.incomes) || []
}

function saveIncome(storage, draft) {
  const incomes = getIncomes(storage)
  const income = {
    id: draft.id || `income-${Date.now()}`,
    type: draft.type || 'salary',
    name: String(draft.name || '').trim(),
    amount: toNumber(draft.amount),
    cycle: draft.cycle || 'once',
    occurredAt: draft.occurredAt || today(),
    createdAt: draft.createdAt || today()
  }
  const index = incomes.findIndex((item) => item.id === income.id)
  if (index >= 0) incomes[index] = income
  else incomes.unshift(income)
  storage.set(KEYS.incomes, incomes)
  return income
}

function deleteIncome(storage, id) {
  const incomes = getIncomes(storage)
  const nextIncomes = incomes.filter((income) => income.id !== id)
  if (nextIncomes.length === incomes.length) return false
  storage.set(KEYS.incomes, nextIncomes)
  return true
}

function getInteractionState(storage) {
  return storage.get(KEYS.interaction) || {
    energy: 12,
    lastCheckin: '',
    mood: '期待出发',
    streak: 0,
    touches: 0
  }
}

function interactWithCharacter(storage) {
  const state = getInteractionState(storage)
  const messages = ['今天也要继续成长', '装备状态良好', '去看看资产世界吧', '记得记录新的价值']
  const nextState = {
    ...state,
    energy: Math.min(99, Number(state.energy || 0) + 1),
    mood: messages[Number(state.touches || 0) % messages.length],
    touches: Number(state.touches || 0) + 1
  }
  storage.set(KEYS.interaction, nextState)
  return nextState
}

function checkInToday(storage) {
  const state = getInteractionState(storage)
  if (state.lastCheckin === today()) return { checkedIn: false, state }
  const nextState = {
    ...state,
    energy: Math.min(99, Number(state.energy || 0) + 5),
    lastCheckin: today(),
    mood: '今日补给已领取',
    streak: state.lastCheckin === yesterday() ? Number(state.streak || 0) + 1 : 1
  }
  storage.set(KEYS.interaction, nextState)
  return { checkedIn: true, state: nextState }
}

function calculateMonthlyIncome(incomes) {
  return (Array.isArray(incomes) ? incomes : []).reduce((sum, income) => {
    if (income.cycle === 'monthly') return sum + toNumber(income.amount)
    if (income.cycle === 'yearly') return sum + toNumber(income.amount) / 12
    return sum
  }, 0)
}

function saveTodaySnapshot(storage) {
  const assets = getAssets(storage)
  const summary = calculateSummary(assets)
  const snapshots = storage.get(KEYS.snapshots) || []
  const snapshot = {
    date: today(),
    totalValue: summary.total,
    totalCost: summary.cost,
    dailyChange: summary.dailyChange
  }
  const index = snapshots.findIndex((item) => item.date === snapshot.date)
  if (index >= 0) snapshots[index] = snapshot
  else snapshots.push(snapshot)
  storage.set(KEYS.snapshots, snapshots.slice(-365))
  return snapshot
}

function createWxStorage() {
  return {
    get: (key) => wx.getStorageSync(key),
    set: (key, value) => wx.setStorageSync(key, value)
  }
}

module.exports = {
  KEYS,
  archiveAsset,
  calculateMonthlyIncome,
  checkInToday,
  createSeedSnapshots,
  createWxStorage,
  deleteIncome,
  findAsset,
  getAssets,
  getIncomes,
  getInteractionState,
  initializeStore,
  interactWithCharacter,
  restoreAsset,
  saveAsset,
  saveIncome,
  saveTodaySnapshot,
  setAssetVisibility,
  today
}
