const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { createRequire } = require('module')
const store = require('../utils/store')
const { characterSprite } = require('../utils/appearance')
const copy = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value))
const memory = {}
const storage = { get: (key) => copy(memory[key]), set: (key, value) => { memory[key] = copy(value) } }
const wxMock = {
  getStorageSync: storage.get, setStorageSync: storage.set,
  getWindowInfo: () => ({ statusBarHeight: 54 }), getMenuButtonBoundingClientRect: () => ({ bottom: 94 }),
  setNavigationBarTitle() {}, vibrateShort() {}, showToast() {}, navigateTo() {}, switchTab() {}, navigateBack() {}
}
function mount(relative, options = {}) {
  const file = path.resolve(__dirname, '..', relative)
  let definition
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { require: createRequire(file), Page: (page) => { definition = page }, wx: wxMock, setTimeout: () => 0 }, { filename: file })
  const page = { ...definition, data: copy(definition.data) }
  page.setData = function (values, callback) {
    for (const [key, value] of Object.entries(values)) {
      const parts = key.split('.')
      let current = this.data
      for (const part of parts.slice(0, -1)) current = current[part] || (current[part] = {})
      current[parts[parts.length - 1]] = value
    }
    if (callback) callback()
  }
  if (page.onLoad) page.onLoad(options)
  if (page.onShow) page.onShow()
  return page
}
const previousWx = global.wx
global.wx = wxMock
try {
  store.initializeStore(storage)
  const zero = store.saveAsset(storage, { name: '零值纪念物', category: 'collection', cost: 0, currentValue: 0, dailyChange: 0 })
  store.archiveAsset(storage, zero.id)
  const edit = mount('pages/add-asset/add-asset.js', { id: zero.id })
  assert.strictEqual(edit.data.currentValue, '0')
  assert.strictEqual(edit.data.cost, '0')
  edit.setData({ name: '修改后的零值纪念物' })
  edit.saveAsset()
  assert.ok(store.findAsset(storage, zero.id).archived, 'editing must not restore archived assets')
  const dated = store.saveAsset(storage, { id: 'dated-test', name: '有持有日期的设备', category: 'device', cost: 300, currentValue: 200, acquiredAt: '2020-01-01' })
  const datedEditor = mount('pages/add-asset/add-asset.js', { id: dated.id })
  assert.strictEqual(datedEditor.data.acquiredAt, '2020-01-01')
  assert.ok(datedEditor.data.holding.hasHoldingDate)
  store.setAssetVisibility(storage, dated.id, true)
  assert.strictEqual(store.findAsset(storage, dated.id).acquiredAt, '2020-01-01')
  assert.strictEqual(edit.data.acquiredAt, '', 'legacy records must not invent an acquisition date')
  const assets = mount('pages/assets/assets.js')
  assets.selectFilter({ currentTarget: { dataset: { key: 'device', label: '数码' } } })
  assets.loadAssets()
  assert.strictEqual(assets.data.activeFilter, 'device')
  assert.ok(assets.data.filteredAssets.every((asset) => asset.category === 'device'))
  assert.strictEqual(assets.toViewAsset({ category: 'device', currentValue: 0, countInTotal: true }).valueText, '¥0')
  const future = mount('pages/future/future.js')
  storage.set(store.KEYS.incomes, [])
  future.onShow()
  assert.strictEqual(future.data.monthlyIncome, 0, 'zero income must not reuse the old value')
  const profile = mount('pages/profile/profile.js')
  profile.selectHair({ currentTarget: { dataset: { name: '海盐蓝', color: '#4f7181' } } })
  profile.selectOutfit({ currentTarget: { dataset: { name: '星空夹克', color: '#5c608e' } } })
  assert.strictEqual(profile.data.characterSprite, '/assets/character/explorer-h2-o2.png')
  const id = store.getAssets(storage)[0].id
  profile.switchEquipment({ currentTarget: { dataset: { id } }, detail: { value: false } })
  assert.strictEqual(profile.data.character.hairColor, '#4f7181', 'equipment toggles must preserve unsaved appearance edits')
  profile.saveCharacter()
  const home = mount('pages/home/home.js')
  assert.strictEqual(home.data.characterSprite, profile.data.characterSprite)
  assert.strictEqual(home.data.headerTop, 106)
  home.toggleAmount()
  home.loadDashboard()
  assert.ok(home.data.amountHidden)
  for (const hairColor of require('../utils/appearance').HAIRS) {
    for (const outfitColor of require('../utils/appearance').OUTFITS) {
      assert.ok(fs.existsSync(path.resolve(__dirname, '..', '.' + characterSprite({ hairColor, outfitColor }))))
    }
  }
  console.log('UI regressions passed: zero values, archive, filters, zero income, appearance, privacy')
} finally {
  if (previousWx === undefined) delete global.wx
  else global.wx = previousWx
}
