const { CATEGORY_META, formatMoney } = require('../../utils/portfolio')
const { createWxStorage } = require('../../utils/store')
const { findWish, voteWish, getVoteSummary, decideWish, purchaseWish, STATUS } = require('../../utils/lifecycle')

Page({
  data: { wish: null, votes: {}, actualPrice: '', error: '', success: '', activeVote: '', busy: false },
  onLoad(options) { this.wishId = options.id },
  onShow() { this.loadWish() },
  loadWish() {
    const wish = findWish(createWxStorage(), this.wishId)
    if (!wish) { this.setData({ wish: null, error: '这张愿望卡不在本机。好友联网投票将在云端版本开放。' }); return }
    this.setData({ wish: { ...wish, icon: CATEGORY_META[wish.category].icon,
      budgetText: formatMoney(wish.budget), statusText: STATUS[wish.status] }, votes: getVoteSummary(wish) })
    if (!this.priceEdited) this.setData({ actualPrice: String(wish.actualPrice === undefined ? wish.budget : wish.actualPrice) })
  },
  vote(event) {
    try {
      const choice = event.currentTarget.dataset.key
      voteWish(createWxStorage(), this.wishId, choice)
      this.setData({ error: '', success: '这一票已记下，随时可以改选。', activeVote: choice })
      this.loadWish()
      wx.vibrateShort({ type: 'light', fail: () => {} })
      setTimeout(() => this.setData({ activeVote: '' }), 350)
    } catch (error) { this.setData({ error: error.message }) }
  },
  decide(event) {
    try {
      decideWish(createWxStorage(), this.wishId, event.currentTarget.dataset.status)
      this.setData({ error: '', success: '决定已保存。要不要买，始终由你。' })
      this.loadWish()
    } catch (error) { this.setData({ error: error.message }) }
  },
  bindPrice(event) { this.priceEdited = true; this.setData({ actualPrice: event.detail.value, error: '' }) },
  purchase() {
    if (this.data.busy) return
    this.setData({ busy: true })
    wx.showModal({
      title: '确认已经买到了？',
      content: '确认后会按下方实际支付金额建立资产档案，并装备到角色身边。这里只记录已经发生的购买。',
      confirmText: '确认入库',
      success: (result) => {
        if (!result.confirm) return
        try {
          purchaseWish(createWxStorage(), this.wishId, this.data.actualPrice)
          this.setData({ error: '', success: '✦ 愿望成真！新物品已加入资产，角色配件同步更新。' })
          this.loadWish()
        } catch (error) { this.setData({ error: error.message }) }
      },
      complete: () => this.setData({ busy: false })
    })
  },
  openAssets() { wx.switchTab({ url: '/pages/assets/assets' }) },
  backToWishes() { wx.redirectTo({ url: '/pages/wishes/wishes' }) },
  onShareAppMessage() {
    return {
      title: this.data.wish ? `买前问问：${this.data.wish.name}，预算¥${this.data.wish.budgetText}（体验预览）` : '买前问问 · 愿望背包',
      path: '/pages/wishes/wishes?from=share'
    }
  }
})
