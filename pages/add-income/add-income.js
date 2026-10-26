const { createWxStorage, saveIncome, today } = require('../../utils/store')

Page({
  data: {
    types: [
      { key: 'salary', label: '工资' },
      { key: 'bonus', label: '奖金' },
      { key: 'side', label: '副业' },
      { key: 'business', label: '经营收入' },
      { key: 'other', label: '其他' }
    ],
    cycles: [
      { key: 'once', label: '单次记录' },
      { key: 'monthly', label: '每月' },
      { key: 'yearly', label: '每年' }
    ],
    type: 'salary',
    cycle: 'monthly',
    name: '工资收入',
    amount: '',
    occurredAt: '',
    isSaving: false
  },

  onLoad() {
    this.setData({ occurredAt: today() })
  },

  selectType(event) {
    this.setData({ type: event.currentTarget.dataset.key })
    wx.vibrateShort({ type: 'light', fail: () => {} })
  },

  selectCycle(event) {
    this.setData({ cycle: event.currentTarget.dataset.key })
  },

  bindField(event) {
    this.setData({ [event.currentTarget.dataset.field]: event.detail.value })
  },

  bindDate(event) {
    this.setData({ occurredAt: event.detail.value })
  },

  saveIncome() {
    if (this.data.isSaving) return
    if (!this.data.name.trim()) {
      wx.showToast({ title: '请填写收入名称', icon: 'none' })
      return
    }
    if (!(Number(this.data.amount) > 0)) {
      wx.showToast({ title: '请填写有效金额', icon: 'none' })
      return
    }
    this.setData({ isSaving: true })
    saveIncome(createWxStorage(), this.data)
    wx.showToast({ title: '收入记录已保存', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 500)
  }
})
