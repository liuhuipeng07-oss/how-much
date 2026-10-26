const { CATEGORY_META, formatMoney } = require('../../utils/portfolio')
const { createWxStorage } = require('../../utils/store')
const { getWishes, getVoteSummary, STATUS } = require('../../utils/lifecycle')

Page({
  data: {
    filter: 'all', wishes: [], stats: {}, sharedPreview: false,
    filters: [{ key: 'all', label: '全部' }, { key: 'open', label: '问问大家' },
      { key: 'waiting', label: '先等等' }, { key: 'purchased', label: '已拥有' }, { key: 'cancelled', label: '不买了' }]
  },
  onLoad(options) { this.setData({ sharedPreview: options.from === 'share' }) },
  onShow() { this.loadWishes() },
  loadWishes() {
    const all = getWishes(createWxStorage())
    const wishes = all.filter((wish) => this.data.filter === 'all' || wish.status === this.data.filter)
      .map((wish) => ({ ...wish, icon: CATEGORY_META[wish.category].icon,
        budgetText: formatMoney(wish.budget), statusText: STATUS[wish.status], votes: getVoteSummary(wish) }))
    this.setData({ wishes, stats: {
      open: all.filter((wish) => wish.status === 'open').length,
      waiting: all.filter((wish) => wish.status === 'waiting').length,
      purchased: all.filter((wish) => wish.status === 'purchased').length
    } })
  },
  selectFilter(event) { this.setData({ filter: event.currentTarget.dataset.key }, () => this.loadWishes()) },
  addWish() { wx.navigateTo({ url: '/pages/add-wish/add-wish' }) },
  openWish(event) { wx.navigateTo({ url: `/pages/wish-detail/wish-detail?id=${event.currentTarget.dataset.id}` }) },
  openIdle() { wx.navigateTo({ url: '/pages/idle/idle' }) }
})
