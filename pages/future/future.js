const { buildForecast, calculateSummary, formatMoney } = require('../../utils/portfolio')
const {
  KEYS,
  calculateMonthlyIncome,
  createWxStorage,
  deleteIncome,
  getAssets,
  getIncomes
} = require('../../utils/store')

Page({
  data: {
    currentValue: 0,
    monthlyIncome: 20000,
    annualReturn: 6,
    annualIncomeGrowth: 3,
    years: 10,
    points: [],
    incomes: [],
    snapshots: [],
    finalValueText: '0',
    maxValue: 1,
    selectedScenario: 'normal',
    portalActive: false,
    routeMessage: '正常航行：在收入与增长之间保持平衡。'
  },

  onShow() {
    const storage = createWxStorage()
    const assets = getAssets(storage)
    const incomes = getIncomes(storage)
    const snapshots = (storage.get(KEYS.snapshots) || []).slice(-12)
    const summary = calculateSummary(assets)
    const monthlyIncome = calculateMonthlyIncome(incomes)
    const snapshotMax = Math.max(...snapshots.map((item) => item.totalValue), 1)
    this.setData({
      currentValue: summary.total,
      monthlyIncome,
      incomes: incomes.map((income) => ({
        ...income,
        amountText: `¥${formatMoney(income.amount)}`,
        cycleText: this.getCycleText(income.cycle)
      })),
      snapshots: snapshots.map((snapshot) => ({
        ...snapshot,
        valueText: formatMoney(snapshot.totalValue),
        dateLabel: snapshot.date.slice(5),
        height: Math.max(8, Math.round((snapshot.totalValue / snapshotMax) * 100))
      }))
    }, () => this.recalculate())
  },

  getCycleText(cycle) {
    return { once: '单次', monthly: '每月', yearly: '每年' }[cycle] || '单次'
  },

  addIncome() {
    wx.navigateTo({ url: '/pages/add-income/add-income' })
  },

  deleteIncome(event) {
    const id = event.currentTarget.dataset.id
    wx.showModal({
      title: '删除收入记录',
      content: '只删除这条统计记录，不会影响任何真实资金。',
      confirmText: '确认删除',
      success: (result) => {
        if (!result.confirm) return
        deleteIncome(createWxStorage(), id)
        this.onShow()
      }
    })
  },

  bindNumber(event) {
    this.setData(
      { [event.currentTarget.dataset.field]: Number(event.detail.value) || 0 },
      () => this.recalculate()
    )
  },

  chooseScenario(event) {
    const key = event.currentTarget.dataset.key
    const scenarios = {
      steady: { annualReturn: 4, annualIncomeGrowth: 2 },
      normal: { annualReturn: 7, annualIncomeGrowth: 4 },
      dream: { annualReturn: 12, annualIncomeGrowth: 8 }
    }
    const messages = {
      steady: '稳稳生长：用更保守的假设观察长期积累。',
      normal: '正常航行：在收入与增长之间保持平衡。',
      dream: '梦想冲刺：高增长只是模拟情景，不代表实际收益。'
    }
    this.setData({
      ...scenarios[key],
      selectedScenario: key,
      portalActive: true,
      routeMessage: messages[key]
    }, () => this.recalculate())
    wx.vibrateShort({ type: 'light', fail: () => {} })
    setTimeout(() => this.setData({ portalActive: false }), 760)
  },

  recalculate() {
    const points = buildForecast(
      this.data.currentValue,
      this.data.monthlyIncome,
      this.data.annualReturn,
      this.data.annualIncomeGrowth,
      this.data.years
    )
    const maxValue = Math.max(...points.map((point) => point.value), 1)
    this.setData({
      maxValue,
      finalValueText: formatMoney(points[points.length - 1].value),
      points: points.map((point, index) => ({
        ...point,
        valueText: formatMoney(point.value),
        height: Math.max(8, Math.round((point.value / maxValue) * 100)),
        showLabel: index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2)
      }))
    })
  }
})
