const { createWxStorage, initializeStore } = require('./utils/store')
const { initializeLifecycle } = require('./utils/lifecycle')

App({
  globalData: {
    appName: '值多少？'
  },

  onLaunch() {
    initializeStore(createWxStorage())
    initializeLifecycle(createWxStorage())
  }
})
