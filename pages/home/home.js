const { CATEGORY_META, calculateSummary, formatMoney, getValueRange } = require('../../utils/portfolio')
const { getWishes, getIdleListings } = require('../../utils/lifecycle')
const { characterSprite } = require('../../utils/appearance')
const {
  KEYS,
  checkInToday,
  createWxStorage,
  getAssets,
  getInteractionState,
  interactWithCharacter,
  saveTodaySnapshot,
  today
} = require('../../utils/store')

Page({
  data: {
    headerTop: 88,
    amountHidden: false,
    summary: {},
    character: {},
    equipment: [],
    interaction: {},
    isCharacterActive: false,
    coinBurst: false,
    summaryReveal: false,
    worldTiles: [],
    weatherMovers: [],
    wishCount: 0,
    idleCount: 0,
    trendBars: [35, 42, 40, 53, 61, 58, 72, 78]
  },

  onShow() {
    this.loadDashboard()
  },

  onPullDownRefresh() {
    this.loadDashboard()
    wx.stopPullDownRefresh()
  },

  loadDashboard() {
    const windowInfo = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : {}
    const capsule = typeof wx.getMenuButtonBoundingClientRect === 'function' ? wx.getMenuButtonBoundingClientRect() : {}
    const headerTop = Math.max(windowInfo.statusBarHeight || 20, capsule.bottom || (windowInfo.statusBarHeight || 20) + 44) + 12
    const storage = createWxStorage()
    const assets = getAssets(storage)
    saveTodaySnapshot(storage)
    const character = wx.getStorageSync('character') || {}
    const interaction = this.toViewInteraction(getInteractionState(storage))
    const summary = calculateSummary(assets)
    const equipment = assets
      .filter((asset) => asset.visible)
      .slice(0, 4)
      .map((asset) => ({
        id: asset.id,
        name: asset.name,
        icon: this.getCategoryIcon(asset.category)
      }))
    const worldTiles = summary.groups.slice(0, 6).map((group) => ({
      ...group,
      percent: summary.total > 0 ? Math.max(0, Math.min(100, group.value / summary.total * 100)) : 0,
      valueText: group.value ? `¥${formatMoney(group.value)}` : '珍贵伙伴'
    }))

    this.setData({
      headerTop,
      character,
      amountHidden: Boolean(wx.getStorageSync('homeAmountHidden')),
      characterSprite: characterSprite(character),
      sceneVehicle: assets.some((asset) => asset.visible && asset.category === 'vehicle'),
      scenePet: assets.some((asset) => asset.visible && asset.category === 'pet'),
      equipment,
      interaction,
      worldTiles,
      weatherMovers: summary.groups.filter((group) => group.dailyChange !== 0).slice(0, 3).map((group) => ({
        ...group, changeText: `${group.dailyChange >= 0 ? '+' : '-'}¥${formatMoney(Math.abs(group.dailyChange))}`
      })),
      wishCount: getWishes(storage).filter((wish) => ['open', 'waiting'].includes(wish.status)).length,
      idleCount: getIdleListings(storage).filter((listing) => listing.status === 'listed').length,
      summary: {
        ...summary,
        totalText: formatMoney(summary.total),
        costText: formatMoney(summary.cost),
        dailyText: `${summary.dailyChange >= 0 ? '+' : '-'}¥${formatMoney(Math.abs(summary.dailyChange))}`,
        dailyRateText: `${summary.dailyRate >= 0 ? '+' : ''}${summary.dailyRate.toFixed(2)}%`,
        profitText: `${summary.profit >= 0 ? '+' : '-'}¥${formatMoney(Math.abs(summary.profit))}`,
        level: Math.max(1, Math.floor(Math.log10(Math.max(summary.total, 10)) * 4))
      }
    })
  },

  getCategoryIcon(category) {
    return (CATEGORY_META[category] || CATEGORY_META.other).icon
  },

  addAsset() {
    wx.navigateTo({ url: '/pages/add-asset/add-asset' })
  },

  addIncome() {
    wx.navigateTo({ url: '/pages/add-income/add-income' })
  },

  openWishes() {
    wx.navigateTo({ url: '/pages/wishes/wishes' })
  },

  openIdle() {
    wx.navigateTo({ url: '/pages/idle/idle' })
  },

  interactCharacter() {
    const interaction = this.toViewInteraction(interactWithCharacter(createWxStorage()))
    this.setData({ interaction, isCharacterActive: true, coinBurst: true })
    wx.vibrateShort({ type: 'light', fail: () => {} })
    setTimeout(() => this.setData({ isCharacterActive: false, coinBurst: false }), 520)
  },

  checkIn() {
    const result = checkInToday(createWxStorage())
    this.setData({
      interaction: this.toViewInteraction(result.state),
      coinBurst: result.checkedIn
    })
    if (result.checkedIn) setTimeout(() => this.setData({ coinBurst: false }), 650)
    wx.showToast({
      title: result.checkedIn ? `连续冒险 ${result.state.streak} 天` : '今天已经领取过补给',
      icon: 'none'
    })
  },

  toViewInteraction(interaction) {
    return {
      ...interaction,
      checkedInToday: interaction.lastCheckin === today()
    }
  },

  openEquipment(event) {
    wx.navigateTo({ url: `/pages/add-asset/add-asset?id=${event.currentTarget.dataset.id}` })
  },

  openAssets() {
    wx.switchTab({ url: '/pages/assets/assets' })
  },

  openProfile() {
    wx.switchTab({ url: '/pages/profile/profile' })
  },

  toggleAmount() {
    const amountHidden = !this.data.amountHidden
    wx.setStorageSync('homeAmountHidden', amountHidden)
    this.setData({ amountHidden })
  },

  openMarket() {
    wx.navigateTo({ url: '/pages/market/market' })
  },

  toggleSummary() {
    this.setData({ summaryReveal: !this.data.summaryReveal })
  },

  onShareAppMessage() {
    const privacyLevel = (createWxStorage().get(KEYS.shareSettings) || {}).privacyLevel || 'range'
    const valueText = privacyLevel === 'full'
      ? `¥${this.data.summary.totalText}`
      : privacyLevel === 'range'
        ? getValueRange(this.data.summary.total)
        : '金额已隐藏'
    return {
      title: `今天的我值多少？${valueText} · 我的数字角色名片`,
      path: '/pages/home/home'
    }
  }
})
