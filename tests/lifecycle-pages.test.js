const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { createRequire } = require('module')
const { initializeStore, getAssets } = require('../utils/store')
const { createWish, findWish, getIdleListings } = require('../utils/lifecycle')

const memory = {}
const copy = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value))
const storage = { get: (key) => copy(memory[key]), set: (key, value) => { memory[key] = copy(value) } }
const navigation = []
let confirmModal = true
const wxMock = {
  getStorageSync: storage.get, setStorageSync: storage.set,
  vibrateShort() {}, showToast() {},
  navigateTo: ({ url }) => navigation.push(url), redirectTo: ({ url }) => navigation.push(url),
  switchTab: ({ url }) => navigation.push(url),
  showModal(options) { options.success({ confirm: confirmModal }); options.complete() }
}
const previousWx = global.wx
global.wx = wxMock

function mount(relative, options = {}) {
  const file = path.resolve(__dirname, '..', relative)
  let definition
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    require: createRequire(file), Page: (page) => { definition = page },
    wx: wxMock, setTimeout: () => 0
  }, { filename: file })
  const page = { ...definition, data: copy(definition.data) }
  page.setData = function (data, callback) { Object.assign(this.data, data); if (callback) callback() }
  if (page.onLoad) page.onLoad(options)
  if (page.onShow) page.onShow()
  return page
}

try {
  initializeStore(storage)
  const home = mount('pages/home/home.js')
  assert.ok(home.data.headerTop >= 76)
  wxMock.getWindowInfo = () => ({ statusBarHeight: 54 })
  wxMock.getMenuButtonBoundingClientRect = () => ({ bottom: 94 })
  home.loadDashboard()
  assert.strictEqual(home.data.headerTop, 106)
  delete wxMock.getWindowInfo
  delete wxMock.getMenuButtonBoundingClientRect
  const create = mount('pages/add-wish/add-wish.js')
  create.saveWish()
  assert.ok(create.data.error)
  create.setData({ name: '周末相机', budget: '3600', reason: '周末旅行拍照' })
  create.saveWish()
  const detailUrl = navigation[navigation.length - 1]
  assert.ok(detailUrl.startsWith('/pages/wish-detail/wish-detail?id='))
  const id = detailUrl.split('id=')[1]
  const detail = mount('pages/wish-detail/wish-detail.js', { id })
  detail.vote({ currentTarget: { dataset: { key: 'buy' } } })
  detail.vote({ currentTarget: { dataset: { key: 'wait' } } })
  assert.strictEqual(detail.data.votes.total, 1)
  const share = detail.onShareAppMessage()
  assert.strictEqual(share.path, '/pages/wishes/wishes?from=share')
  assert.ok(share.title.includes('体验预览'))
  confirmModal = false
  detail.purchase()
  assert.strictEqual(findWish(storage, id).status, 'open')
  assert.strictEqual(detail.data.busy, false)
  confirmModal = true
  detail.bindPrice({ detail: { value: '3199' } })
  detail.purchase()
  assert.strictEqual(detail.data.wish.status, 'purchased')
  const assetId = findWish(storage, id).assetId
  assert.strictEqual(getAssets(storage).find((asset) => asset.id === assetId).cost, 3199)
  const idle = mount('pages/idle/idle.js')
  idle.setData({ selectedIndex: idle.data.assets.findIndex((asset) => asset.id === assetId), askingPrice: '2000', condition: '九成新' })
  idle.saveListing()
  const listing = getIdleListings(storage).find((item) => item.assetId === assetId)
  assert.ok(listing)
  assert.ok(!idle.data.assets.some((asset) => asset.id === assetId))
  idle.changeStatus({ currentTarget: { dataset: { id: listing.id, status: 'transferred' } } })
  assert.ok(!getAssets(storage).some((asset) => asset.id === assetId))
  assert.strictEqual(idle.data.busy, false)
  assert.strictEqual(idle.data.listings.find((item) => item.id === listing.id).status, 'transferred')
  const wishes = mount('pages/wishes/wishes.js', { from: 'share' })
  assert.strictEqual(wishes.data.sharedPreview, true)
  wishes.selectFilter({ currentTarget: { dataset: { key: 'purchased' } } })
  assert.ok(wishes.data.wishes.some((wish) => wish.id === id))
  assert.ok(wishes.data.wishes.every((wish) => wish.status === 'purchased'))
  const missing = mount('pages/wish-detail/wish-detail.js', { id: 'not-on-this-device' })
  assert.strictEqual(missing.data.wish, null)
  assert.ok(missing.data.error.includes('不在本机'))
  const reopen = createWish(storage, { name: '耳机', category: 'device', budget: 599, reason: '通勤' })
  const waiting = mount('pages/wish-detail/wish-detail.js', { id: reopen.id })
  waiting.decide({ currentTarget: { dataset: { status: 'waiting' } } })
  assert.strictEqual(waiting.data.wish.status, 'waiting')
  console.log('lifecycle page tests passed: form → vote → purchase → idle → transfer')
} finally {
  if (previousWx === undefined) delete global.wx
  else global.wx = previousWx
}
