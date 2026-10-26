const { CATEGORY_META } = require('../../utils/portfolio')
const { createWxStorage, findAsset, saveAsset } = require('../../utils/store')
const { dateText, calendarTime, holdingStats } = require('../../utils/holding')

Page({
  data: {
    categories: Object.keys(CATEGORY_META).map((key) => ({ key, ...CATEGORY_META[key] })),
    selectedCategory: 'device',
    selectedCategoryLabel: CATEGORY_META.device.label,
    selectedCategoryIcon: CATEGORY_META.device.icon,
    name: '',
    cost: '',
    acquiredAt: '',
    todayDate: '',
    holding: {},
    currentValue: '',
    dailyChange: '',
    visible: true,
    countInTotal: true,
    valuationMode: 'manual',
    note: '',
    assetId: '',
    createdAt: '',
    isEditing: false,
    isSaving: false
  },

  onLoad(options) {
    const todayDate = dateText()
    this.setData({ todayDate, acquiredAt: todayDate })
    this.updateHolding()
    if (!options.id) return
    const asset = findAsset(createWxStorage(), options.id)
    if (!asset) {
      wx.showToast({ title: '未找到资产档案', icon: 'none' })
      return
    }
    wx.setNavigationBarTitle({ title: '编辑资产档案' })
    this.setData({
      assetId: asset.id,
      selectedCategory: asset.category,
      selectedCategoryLabel: (CATEGORY_META[asset.category] || CATEGORY_META.other).label,
      selectedCategoryIcon: (CATEGORY_META[asset.category] || CATEGORY_META.other).icon,
      name: asset.name,
      cost: String(asset.cost == null ? '' : asset.cost),
      acquiredAt: asset.acquiredAt || '',
      currentValue: String(asset.currentValue == null ? '' : asset.currentValue),
      dailyChange: String(asset.dailyChange == null ? '' : asset.dailyChange),
      visible: Boolean(asset.visible),
      countInTotal: asset.countInTotal !== false,
      valuationMode: asset.valuationMode || 'manual',
      note: asset.note || '',
      createdAt: asset.createdAt || '',
      isEditing: true
    })
    this.updateHolding()
  },

  selectCategory(event) {
    const selectedCategory = event.currentTarget.dataset.key
    this.setData({
      selectedCategory,
      selectedCategoryLabel: (CATEGORY_META[selectedCategory] || CATEGORY_META.other).label,
      selectedCategoryIcon: (CATEGORY_META[selectedCategory] || CATEGORY_META.other).icon,
      countInTotal: selectedCategory === 'pet' ? false : this.data.countInTotal
    })
    wx.vibrateShort({ type: 'light', fail: () => {} })
  },

  bindField(event) {
    this.setData({ [event.currentTarget.dataset.field]: event.detail.value })
    if (event.currentTarget.dataset.field === 'cost') this.updateHolding()
  },

  bindAcquiredDate(event) {
    this.setData({ acquiredAt: event.detail.value })
    this.updateHolding()
  },

  updateHolding() {
    this.setData({ holding: holdingStats({ acquiredAt: this.data.acquiredAt, cost: this.data.cost }, this.data.todayDate) })
  },

  switchVisible(event) {
    this.setData({ visible: event.detail.value })
  },

  switchCountInTotal(event) {
    this.setData({ countInTotal: event.detail.value })
  },

  selectValuationMode(event) {
    const mode = event.currentTarget.dataset.mode
    if (mode === 'auto') {
      wx.showToast({ title: '自动行情下一阶段开放', icon: 'none' })
      return
    }
    this.setData({ valuationMode: mode })
  },

  saveAsset() {
    if (this.data.isSaving) return
    const name = this.data.name.trim()
    if (!name) {
      wx.showToast({ title: '请先给资产取个名字', icon: 'none' })
      return
    }
    if (this.data.countInTotal && this.data.currentValue === '') {
      wx.showToast({ title: '请填写当前价值', icon: 'none' })
      return
    }
    const numbers = [this.data.cost, this.data.currentValue, this.data.dailyChange]
    if (numbers.some((value) => value !== '' && !Number.isFinite(Number(value))) || Number(this.data.cost) < 0 || Number(this.data.currentValue) < 0) {
      wx.showToast({ title: '请填写有效金额，成本与价值不能为负数', icon: 'none' })
      return
    }
    if (this.data.acquiredAt && (calendarTime(this.data.acquiredAt) === null || this.data.acquiredAt > this.data.todayDate)) {
      wx.showToast({ title: '开始持有日期不能晚于今天', icon: 'none' })
      return
    }

    this.setData({ isSaving: true })
    saveAsset(createWxStorage(), {
      id: this.data.assetId,
      name,
      category: this.data.selectedCategory,
      cost: this.data.cost,
      acquiredAt: this.data.acquiredAt,
      currentValue: this.data.currentValue,
      dailyChange: this.data.dailyChange,
      visible: this.data.visible,
      countInTotal: this.data.countInTotal,
      valuationMode: this.data.valuationMode,
      emotionalValue: this.data.selectedCategory === 'pet' ? '无法估量' : '',
      note: this.data.note,
      createdAt: this.data.createdAt
    })
    wx.showToast({ title: this.data.isEditing ? '资产档案已更新' : '资产档案已创建', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 500)
  }
})
