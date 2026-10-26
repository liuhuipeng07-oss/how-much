const { CATEGORY_META } = require('../../utils/portfolio')
const { createWxStorage } = require('../../utils/store')
const { createWish } = require('../../utils/lifecycle')

Page({
  data: {
    name: '', budget: '', reason: '', alternative: '', categoryIndex: 0, error: '', saving: false,
    categories: ['device', 'collection', 'vehicle', 'membership', 'other'].map((key) => ({ key, label: CATEGORY_META[key].label }))
  },
  bindField(event) { this.setData({ [event.currentTarget.dataset.field]: event.detail.value, error: '' }) },
  selectCategory(event) { this.setData({ categoryIndex: Number(event.detail.value) }) },
  saveWish() {
    if (this.data.saving) return
    this.setData({ saving: true, error: '' })
    try {
      const wish = createWish(createWxStorage(), { ...this.data, category: this.data.categories[this.data.categoryIndex].key })
      wx.redirectTo({ url: `/pages/wish-detail/wish-detail?id=${wish.id}` })
    } catch (error) { this.setData({ error: error.message, saving: false }) }
  }
})
