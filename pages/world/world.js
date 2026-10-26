const { CATEGORY_META, calculateSummary, formatMoney } = require('../../utils/portfolio')
const { createWxStorage, getAssets } = require('../../utils/store')

Page({
  data: {
    groups: [],
    stats: {
      regions: 0,
      equipped: 0,
      prosperity: 0
    },
    selectedCategory: '',
    selectedTitle: '',
    selectedAssets: [],
    explorationMessage: '选择一个区域，开始今天的价值巡游。',
    highlightedAssetId: '',
    isExploring: false
  },

  onShow() {
    const assets = getAssets(createWxStorage())
    const summary = calculateSummary(assets)
    const groups = summary.groups.map((group) => ({
      ...group,
      valueText: group.value ? `¥${formatMoney(group.value)}` : '非货币价值',
      percentText: summary.total ? `${((group.value / summary.total) * 100).toFixed(1)}%` : '0%'
    }))
    const selectedCategory = this.data.selectedCategory || (groups[0] && groups[0].category) || ''
    this.setData({
      groups,
      selectedCategory,
      stats: {
        regions: groups.length,
        equipped: assets.filter((asset) => asset.visible).length,
        prosperity: Math.min(100, summary.count * 6 + groups.length * 4)
      }
    }, () => this.selectGroupByKey(selectedCategory, assets))
  },

  selectGroup(event) {
    const category = event.currentTarget.dataset.category
    this.selectGroupByKey(category, getAssets(createWxStorage()))
    this.setData({
      explorationMessage: `已抵达 ${(CATEGORY_META[category] || CATEGORY_META.other).scene}`,
      highlightedAssetId: ''
    })
    wx.vibrateShort({ type: 'light', fail: () => {} })
  },

  selectGroupByKey(category, assets) {
    const meta = CATEGORY_META[category] || CATEGORY_META.other
    this.setData({
      selectedCategory: category,
      selectedTitle: meta.scene,
      selectedAssets: assets
        .filter((asset) => asset.category === category)
        .map((asset) => ({
          ...asset,
          icon: meta.icon,
          valueText: asset.countInTotal === false ? (asset.emotionalValue || '单独展示') : `¥${formatMoney(asset.currentValue)}`
        }))
    })
  },

  openAsset(event) {
    wx.navigateTo({ url: `/pages/add-asset/add-asset?id=${event.currentTarget.dataset.id}` })
  },

  exploreWorld() {
    const assets = this.data.selectedAssets
    if (!assets.length) {
      wx.showToast({ title: '这个区域还没有可探索的资产', icon: 'none' })
      return
    }
    const asset = assets[Math.floor(Date.now() / 1000) % assets.length]
    this.setData({
      isExploring: true,
      highlightedAssetId: asset.id,
      explorationMessage: `发现了「${asset.name}」，价值档案状态良好。`
    })
    wx.vibrateShort({ type: 'light', fail: () => {} })
    setTimeout(() => this.setData({ isExploring: false }), 650)
  }
})
