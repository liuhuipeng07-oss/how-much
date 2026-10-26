const { CATEGORY_META, formatMoney } = require('../../utils/portfolio')
const { createWxStorage, getAssets, findAsset } = require('../../utils/store')
const { IDLE_CATEGORIES, getIdleListings, listIdle, changeIdleStatus } = require('../../utils/lifecycle')

Page({
  data: { assets: [], selectedIndex: 0, askingPrice: '', condition: '', note: '', listings: [], error: '', success: '', filter: 'listed', busy: false },
  onShow() { this.loadListings() },
  loadListings() {
    const storage = createWxStorage()
    const all = getIdleListings(storage)
    const assets = getAssets(storage).filter((asset) => IDLE_CATEGORIES.includes(asset.category)
      && !all.some((listing) => listing.assetId === asset.id && listing.status === 'listed'))
    const listings = all.filter((listing) => this.data.filter === 'all' || listing.status === this.data.filter)
      .map((listing) => {
        const asset = findAsset(storage, listing.assetId)
        return { ...listing, name: asset ? asset.name : '资产档案已缺失',
          icon: asset ? (CATEGORY_META[asset.category] || CATEGORY_META.other).icon : CATEGORY_META.other.icon, askingText: formatMoney(listing.askingPrice),
          statusText: { listed: '展示中', withdrawn: '已撤回', transferred: '已转出' }[listing.status],
          assetArchived: !asset || asset.archived,
          unavailable: listing.status === 'listed' && (!asset || asset.archived) }
      })
    this.setData({ assets, selectedIndex: 0, listings })
  },
  bindField(event) { this.setData({ [event.currentTarget.dataset.field]: event.detail.value, error: '' }) },
  selectAsset(event) { this.setData({ selectedIndex: Number(event.detail.value) }) },
  selectFilter(event) { this.setData({ filter: event.currentTarget.dataset.key }, () => this.loadListings()) },
  saveListing() {
    if (this.data.busy) return
    this.setData({ busy: true })
    try {
      const asset = this.data.assets[this.data.selectedIndex]
      if (!asset) throw new Error('请先添加一件仍在持有的数码、收藏或车辆')
      listIdle(createWxStorage(), asset.id, this.data)
      this.setData({ askingPrice: '', condition: '', note: '', filter: 'listed', error: '', success: '已放进闲置背包。物品仍属于你，资产统计保持不变。' })
      this.loadListings()
    } catch (error) { this.setData({ error: error.message }) }
    this.setData({ busy: false })
  },
  changeStatus(event) {
    if (this.data.busy) return
    const { id, status } = event.currentTarget.dataset
    const transfer = status === 'transferred'
    this.setData({ busy: true })
    wx.showModal({
      title: transfer ? '确认物品已经转出？' : '收回这件闲置？',
      content: transfer ? '确认后会归档这件资产，停止计入总值并移除人物配件。本操作不记录收款。' : '撤回后仍保留资产和装备，不再显示在闲置展示中。',
      confirmText: transfer ? '确认转出' : '确认撤回',
      success: (result) => {
        if (!result.confirm) return
        try {
          changeIdleStatus(createWxStorage(), id, status)
          this.setData({ error: '', success: transfer ? '已记录转出，资产档案已归档。' : '旧物已回到你的日常。', filter: 'all' })
          this.loadListings()
        } catch (error) { this.setData({ error: error.message }) }
      },
      complete: () => this.setData({ busy: false })
    })
  },
  openAssets() { wx.switchTab({ url: '/pages/assets/assets' }) }
})
