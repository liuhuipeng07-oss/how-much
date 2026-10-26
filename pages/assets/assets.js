const { CATEGORY_META, calculateSummary, formatMoney } = require('../../utils/portfolio')
const { holdingStats } = require('../../utils/holding')
const {
  archiveAsset,
  createWxStorage,
  getAssets,
  restoreAsset,
  setAssetVisibility
} = require('../../utils/store')

Page({
  data: {
    assets: [],
    filteredAssets: [],
    filters: [{ key: 'all', label: '全部' }],
    activeFilter: 'all',
    recordState: 'active',
    totalText: '0',
    activeAssetId: '',
    feedback: ''
  },

  onShow() {
    this.loadAssets()
  },

  loadAssets() {
    const storage = createWxStorage()
    const allAssets = getAssets(storage, { includeArchived: true })
    const activeAssets = allAssets.filter((asset) => !asset.archived)
    const assets = this.data.recordState === 'archived'
      ? allAssets.filter((asset) => asset.archived)
      : activeAssets
    const summary = calculateSummary(activeAssets)
    const categoryKeys = [...new Set(assets.map((asset) => asset.category))]
    const filters = [
      { key: 'all', label: '全部' },
      ...categoryKeys.map((key) => ({ key, label: CATEGORY_META[key] ? CATEGORY_META[key].label : '其他' }))
    ]
    const viewAssets = assets.map((asset) => this.toViewAsset(asset))
    const activeFilter = filters.some((filter) => filter.key === this.data.activeFilter) ? this.data.activeFilter : 'all'
    this.setData({
      activeFilter,
      assets: viewAssets,
      filteredAssets: activeFilter === 'all' ? viewAssets : viewAssets.filter((asset) => asset.category === activeFilter),
      filters,
      totalText: formatMoney(summary.total)
    })
  },

  toViewAsset(asset) {
    const meta = CATEGORY_META[asset.category] || CATEGORY_META.other
    const hasMoneyValue = asset.countInTotal !== false
    return {
      ...asset,
      ...holdingStats(asset),
      icon: meta.icon,
      categoryLabel: meta.label,
      valueText: hasMoneyValue ? `¥${formatMoney(asset.currentValue)}` : (asset.emotionalValue || '待估值'),
      changeText: `${Number(asset.dailyChange) >= 0 ? '+' : '-'}¥${formatMoney(Math.abs(Number(asset.dailyChange) || 0))}`
    }
  },

  selectFilter(event) {
    const key = event.currentTarget.dataset.key
    this.setData({
      activeFilter: key,
      feedback: key === 'all' ? '已展示全部资产档案' : `已筛选「${event.currentTarget.dataset.label}」`,
      filteredAssets: key === 'all'
        ? this.data.assets
        : this.data.assets.filter((asset) => asset.category === key)
    })
    setTimeout(() => this.setData({ feedback: '' }), 1400)
  },

  selectRecordState(event) {
    this.setData({
      recordState: event.currentTarget.dataset.state,
      activeFilter: 'all'
    }, () => this.loadAssets())
  },

  editAsset(event) {
    wx.navigateTo({ url: `/pages/add-asset/add-asset?id=${event.currentTarget.dataset.id}` })
  },

  archiveAsset(event) {
    const id = event.currentTarget.dataset.id
    wx.showModal({
      title: '归档资产档案',
      content: '归档后，该资产不再参与统计，也不再显示在人物或世界中。这个操作不是卖出。',
      confirmText: '确认归档',
      success: (result) => {
        if (!result.confirm) return
        archiveAsset(createWxStorage(), id)
        this.loadAssets()
      }
    })
  },

  restoreAsset(event) {
    restoreAsset(createWxStorage(), event.currentTarget.dataset.id)
    this.loadAssets()
  },

  toggleEquipment(event) {
    const id = event.currentTarget.dataset.id
    const asset = this.data.assets.find((item) => item.id === id)
    if (!asset) return
    if (asset.archived) {
      wx.showToast({ title: '恢复档案后才能展示装备', icon: 'none' })
      return
    }
    setAssetVisibility(createWxStorage(), id, !asset.visible)
    this.setData({
      activeAssetId: id,
      feedback: asset.visible ? '配件已收进背包，只保留统计' : '装备成功，首页角色身边会出现它'
    })
    wx.vibrateShort({ type: 'light', fail: () => {} })
    setTimeout(() => this.setData({ activeAssetId: '', feedback: '' }), 1200)
    this.loadAssets()
  },

  addAsset() {
    wx.navigateTo({ url: '/pages/add-asset/add-asset' })
  },

  openWishes() {
    wx.navigateTo({ url: '/pages/wishes/wishes' })
  },

  openIdle() {
    wx.navigateTo({ url: '/pages/idle/idle' })
  }
})
