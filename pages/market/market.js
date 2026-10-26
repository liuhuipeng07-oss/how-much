const { calculateSummary, formatMoney } = require('../../utils/portfolio')
const { createWxStorage, getAssets } = require('../../utils/store')

Page({
  data: {
    summary: {},
    movers: [],
    weather: {},
    weatherActive: false,
    activeMover: '',
    insight: '点击天气或任一世界，查看今天的变化提示。'
  },

  onShow() {
    const assets = getAssets(createWxStorage())
    const summary = calculateSummary(assets)
    const movers = summary.groups.map((group) => ({
      ...group,
      valueText: `¥${formatMoney(group.value)}`,
      changeText: `${group.dailyChange >= 0 ? '+' : '-'}¥${formatMoney(Math.abs(group.dailyChange))}`
    }))
    const isSunny = summary.dailyChange >= 0
    this.setData({
      movers,
      weather: {
        icon: isSunny ? '/assets/icons/action-weather.png' : '/assets/icons/action-rain.png',
        title: isSunny ? '晴朗，有金币掉落' : '小雨，装备正在波动',
        text: isSunny ? '今天的总价值在向上生长。' : '短期下跌不会改变你的长期冒险。',
        className: isSunny ? 'sunny' : 'rainy'
      },
      summary: {
        ...summary,
        totalText: formatMoney(summary.total),
        changeText: `${summary.dailyChange >= 0 ? '+' : '-'}¥${formatMoney(Math.abs(summary.dailyChange))}`,
        rateText: `${summary.dailyRate >= 0 ? '+' : ''}${summary.dailyRate.toFixed(2)}%`
      }
    })
  },

  playWeather() {
    const positive = this.data.summary.dailyChange >= 0
    this.setData({
      weatherActive: true,
      insight: positive
        ? '今日整体价值向上，像素太阳正在为你的世界补充能量。'
        : '今日整体价值回落，先观察结构变化，不必把波动当成交易信号。'
    })
    wx.vibrateShort({ type: 'light', fail: () => {} })
    setTimeout(() => this.setData({ weatherActive: false }), 700)
  },

  inspectMover(event) {
    const category = event.currentTarget.dataset.category
    const mover = this.data.movers.find((item) => item.category === category)
    if (!mover) return
    this.setData({
      activeMover: category,
      insight: `${mover.scene}今日变化 ${mover.changeText}，当前统计价值 ${mover.valueText}。`
    })
    setTimeout(() => this.setData({ activeMover: '' }), 650)
  }
})
