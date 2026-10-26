const { CATEGORY_META, calculateSummary, formatMoney, getValueRange } = require('../../utils/portfolio')
const { KEYS, createWxStorage, getAssets, setAssetVisibility } = require('../../utils/store')
const { characterSprite } = require('../../utils/appearance')

Page({
  data: {
    character: {},
    card: {},
    equipment: [],
    equipmentOptions: [],
    appearanceActive: false,
    characterMessage: '点击角色，听听今天的冒险状态。',
    privacyLevel: 'range',
    privacyOptions: [
      { key: 'full', label: '完整金额', desc: '显示准确总资产' },
      { key: 'range', label: '区间金额', desc: '只显示资产规模区间' },
      { key: 'hidden', label: '隐藏金额', desc: '只展示角色、类别和装备' }
    ],
    hairs: [
      { name: '栗子棕', color: '#74482f' },
      { name: '夜空黑', color: '#29282c' },
      { name: '海盐蓝', color: '#4f7181' },
      { name: '桃子粉', color: '#bb6f79' }
    ],
    outfits: [
      { name: '森林斗篷', color: '#4d7558' },
      { name: '海岛衬衫', color: '#d78862' },
      { name: '星空夹克', color: '#5c608e' },
      { name: '金币铠甲', color: '#bd9143' }
    ]
  },

  onShow() {
    const storage = createWxStorage()
    const character = storage.get(KEYS.character) || {}
    const assets = getAssets(storage)
    const summary = calculateSummary(assets)
    const shareSettings = storage.get(KEYS.shareSettings) || { privacyLevel: 'range' }
    const privacyLevel = shareSettings.privacyLevel || 'range'
    this.setData({
      character,
      characterSprite: characterSprite(character),
      hairs: this.data.hairs.map((item) => ({ ...item, sprite: characterSprite({ ...character, hairColor: item.color }) })),
      outfits: this.data.outfits.map((item) => ({ ...item, sprite: characterSprite({ ...character, outfitColor: item.color }) })),
      privacyLevel,
      equipment: assets.filter((asset) => asset.visible).slice(0, 6).map((asset) => ({
        id: asset.id,
        icon: this.getCategoryIcon(asset.category),
        name: asset.name
      })),
      equipmentOptions: assets.map((asset) => ({
        id: asset.id,
        icon: this.getCategoryIcon(asset.category),
        name: asset.name,
        visible: asset.visible
      })),
      card: {
        level: Math.max(1, Math.floor(Math.log10(Math.max(summary.total, 10)) * 4)),
        valueText: this.getShareValueText(privacyLevel, summary.total),
        categoryCount: summary.groups.length,
        assetCount: summary.count
      }
    })
  },

  bindNickname(event) {
    this.setData({ 'character.nickname': event.detail.value })
  },

  bindCharacterField(event) {
    this.setData({ [`character.${event.currentTarget.dataset.field}`]: event.detail.value })
  },

  selectHair(event) {
    this.setData({
      'character.hair': event.currentTarget.dataset.name,
      'character.hairColor': event.currentTarget.dataset.color,
      appearanceActive: true,
      characterMessage: `发色已预览：${event.currentTarget.dataset.name}`
    })
    this.refreshAppearance()
    setTimeout(() => this.setData({ appearanceActive: false }), 480)
  },

  selectOutfit(event) {
    this.setData({
      'character.outfit': event.currentTarget.dataset.name,
      'character.outfitColor': event.currentTarget.dataset.color,
      appearanceActive: true,
      characterMessage: `服装已预览：${event.currentTarget.dataset.name}`
    })
    this.refreshAppearance()
    setTimeout(() => this.setData({ appearanceActive: false }), 480)
  },

  saveCharacter() {
    if (!String(this.data.character.nickname || '').trim()) {
      wx.showToast({ title: '请填写角色名字', icon: 'none' })
      return
    }
    createWxStorage().set(KEYS.character, this.data.character)
    wx.showToast({ title: '角色形象已保存', icon: 'success' })
  },

  selectPrivacy(event) {
    const privacyLevel = event.currentTarget.dataset.key
    const storage = createWxStorage()
    storage.set(KEYS.shareSettings, { privacyLevel })
    const summary = calculateSummary(getAssets(storage))
    this.setData({
      privacyLevel,
      'card.valueText': this.getShareValueText(privacyLevel, summary.total),
      characterMessage: `名片隐私已切换为「${this.data.privacyOptions.find((item) => item.key === privacyLevel).label}」。`
    })
  },

  switchEquipment(event) {
    setAssetVisibility(createWxStorage(), event.currentTarget.dataset.id, event.detail.value)
    this.setData({
      characterMessage: event.detail.value ? '新配件已展示在角色身边。' : '配件已收进背包，只保留统计。'
    })
    // Refresh equipment without discarding unsaved appearance edits.
    const character = this.data.character
    this.onShow()
    this.setData({ character })
    this.refreshAppearance()
  },

  refreshAppearance() {
    const character = this.data.character
    this.setData({
      characterSprite: characterSprite(character),
      hairs: this.data.hairs.map((item) => ({ ...item, sprite: characterSprite({ ...character, hairColor: item.color }) })),
      outfits: this.data.outfits.map((item) => ({ ...item, sprite: characterSprite({ ...character, outfitColor: item.color }) }))
    })
  },

  tapCharacter() {
    const messages = [
      '装备检查完成，今天也要继续成长。',
      `当前名片展示 ${this.data.equipment.length} 件资产配件。`,
      '真实价值不止一个数字，也包括经历与陪伴。'
    ]
    this.setData({
      appearanceActive: true,
      characterMessage: messages[Math.floor(Date.now() / 1000) % messages.length]
    })
    wx.vibrateShort({ type: 'light', fail: () => {} })
    setTimeout(() => this.setData({ appearanceActive: false }), 520)
  },

  getShareValueText(privacyLevel, total) {
    if (privacyLevel === 'full') return `¥${formatMoney(total)}`
    if (privacyLevel === 'range') return getValueRange(total)
    return '金额已隐藏'
  },

  getCategoryIcon(category) {
    return (CATEGORY_META[category] || CATEGORY_META.other).icon
  },

  onShareAppMessage() {
    return {
      title: `${this.data.character.nickname}的数字角色名片 · ${this.data.card.valueText}`,
      path: '/pages/home/home'
    }
  }
})
