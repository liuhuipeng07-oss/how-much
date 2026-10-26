const CATEGORY_META = {
  property: { label: '家园', icon: '/assets/icons/category-property.png', scene: '森林家园', color: '#df8e5b' },
  vehicle: { label: '坐骑', icon: '/assets/icons/category-vehicle.png', scene: '旅行驿站', color: '#7ba7b1' },
  finance: { label: '金融', icon: '/assets/icons/category-finance.png', scene: '金币森林', color: '#75a56f' },
  crypto: { label: '数字', icon: '/assets/icons/category-crypto.png', scene: '星光矿洞', color: '#8b79ad' },
  device: { label: '数码', icon: '/assets/icons/category-device.png', scene: '科技工坊', color: '#718bc0' },
  collection: { label: '收藏', icon: '/assets/icons/category-collection.png', scene: '藏宝小屋', color: '#c58a51' },
  membership: { label: '会员', icon: '/assets/icons/category-membership.png', scene: '权益传送门', color: '#d87f94' },
  cash: { label: '现金', icon: '/assets/icons/category-cash.png', scene: '金币仓库', color: '#d5a942' },
  pet: { label: '伙伴', icon: '/assets/icons/category-pet.png', scene: '伙伴庭院', color: '#b8796f' },
  other: { label: '其他', icon: '/assets/icons/category-other.png', scene: '冒险背包', color: '#8a8a72' }
}

function createSeedAssets() {
  return [
    { id: 'property-demo-1', name: '厦门海湾公寓', category: 'property', cost: 2200000, currentValue: 2650000, dailyChange: 1000, visible: true, note: '89㎡自住房，演示数据' },
    { id: 'vehicle-demo-1', name: '红色新能源轿车', category: 'vehicle', cost: 229800, currentValue: 168000, dailyChange: -120, visible: true, note: '2024 年购入，演示数据' },
    { id: 'finance-demo-1', name: '长期指数基金组合', category: 'finance', cost: 320000, currentValue: 358000, dailyChange: 3200, visible: true, note: 'A 股与美股指数基金，演示数据' },
    { id: 'crypto-demo-1', name: 'BTC 数字能源', category: 'crypto', cost: 120000, currentValue: 186000, dailyChange: -1500, visible: true, note: '仅统计与展示，不连接钱包' },
    { id: 'device-demo-1', name: '主力手机', category: 'device', cost: 8999, currentValue: 6200, dailyChange: -10, visible: true, note: '按二手参考价手动估值' },
    { id: 'collection-demo-1', name: '机械腕表收藏', category: 'collection', cost: 38000, currentValue: 42000, dailyChange: 800, visible: true, note: '个人收藏，手动估值' },
    { id: 'membership-demo-1', name: '年度健身会员', category: 'membership', cost: 3600, currentValue: 1800, dailyChange: 0, visible: false, note: '按剩余有效期折算' },
    { id: 'cash-demo-1', name: '现金与银行存款', category: 'cash', cost: 280000, currentValue: 280000, dailyChange: 0, visible: false, note: '演示余额，不连接银行账户' },
    { id: 'pet-demo-1', name: '猫咪 Luna', category: 'pet', cost: 0, currentValue: 0, dailyChange: 0, emotionalValue: '无法估量', visible: true, countInTotal: false, note: '陪伴 5 年' },
    { id: 'other-demo-1', name: '创业项目权益', category: 'other', cost: 100000, currentValue: 260000, dailyChange: 0, visible: true, note: '非上市项目权益，手动估值' },
    { id: 'gold-demo-1', name: '50g 投资金条', category: 'finance', cost: 24000, currentValue: 32000, dailyChange: 600, visible: true, note: '按参考金价手动估值' }
  ]
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function formatMoney(value) {
  const number = toNumber(value)
  if (Math.abs(number) >= 100000000) return `${(number / 100000000).toFixed(2)}亿`
  if (Math.abs(number) >= 10000) return `${(number / 10000).toFixed(number >= 1000000 ? 1 : 2)}万`
  return number.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

function getValueRange(value) {
  const number = Math.max(0, toNumber(value))
  if (number < 10000) return '1万以内'
  if (number < 100000) return '1万—10万'
  if (number < 500000) return '10万—50万'
  if (number < 1000000) return '50万—100万'
  if (number < 5000000) return '100万—500万'
  if (number < 10000000) return '500万—1000万'
  return '1000万以上'
}

function calculateSummary(assets) {
  const safeAssets = (Array.isArray(assets) ? assets : []).filter((asset) => !asset.archived)
  const valuedAssets = safeAssets.filter((asset) => asset.countInTotal !== false)
  const total = valuedAssets.reduce((sum, asset) => sum + toNumber(asset.currentValue), 0)
  const cost = valuedAssets.reduce((sum, asset) => sum + toNumber(asset.cost), 0)
  const dailyChange = valuedAssets.reduce((sum, asset) => sum + toNumber(asset.dailyChange), 0)
  const groups = {}

  safeAssets.forEach((asset) => {
    const category = CATEGORY_META[asset.category] ? asset.category : 'other'
    if (!groups[category]) {
      groups[category] = {
        category,
        ...CATEGORY_META[category],
        value: 0,
        dailyChange: 0,
        count: 0
      }
    }
    if (asset.countInTotal !== false) {
      groups[category].value += toNumber(asset.currentValue)
      groups[category].dailyChange += toNumber(asset.dailyChange)
    }
    groups[category].count += 1
  })

  return {
    total,
    cost,
    profit: total - cost,
    dailyChange,
    dailyRate: total - dailyChange === 0 ? 0 : (dailyChange / (total - dailyChange)) * 100,
    count: safeAssets.length,
    groups: Object.values(groups).sort((a, b) => b.value - a.value)
  }
}

function buildForecast(currentValue, monthlyIncome, annualReturn, annualIncomeGrowth, years) {
  let value = toNumber(currentValue)
  let monthly = toNumber(monthlyIncome)
  const returnRate = toNumber(annualReturn) / 100
  const incomeGrowth = toNumber(annualIncomeGrowth) / 100
  const duration = Math.max(1, Math.min(30, Math.round(toNumber(years))))
  const currentYear = new Date().getFullYear()
  const points = [{ year: currentYear, value: Math.round(value) }]

  for (let index = 1; index <= duration; index += 1) {
    value = value * (1 + returnRate) + monthly * 12
    monthly *= 1 + incomeGrowth
    points.push({ year: currentYear + index, value: Math.round(value) })
  }
  return points
}

module.exports = {
  CATEGORY_META,
  buildForecast,
  calculateSummary,
  createSeedAssets,
  formatMoney,
  getValueRange,
  toNumber
}
