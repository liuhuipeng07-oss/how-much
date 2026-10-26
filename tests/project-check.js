const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'))
const requiredExtensions = ['.js', '.json', '.wxml', '.wxss']
const { CATEGORY_META } = require('../utils/portfolio')

function checkIcon(iconPath, tabIcon = false) {
  const file = path.join(root, iconPath.replace(/^\//, ''))
  if (!fs.existsSync(file)) throw new Error(`Missing icon: ${iconPath}`)
  const png = fs.readFileSync(file)
  if (png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Invalid PNG icon: ${iconPath}`)
  if (png.readUInt32BE(16) !== 96 || png.readUInt32BE(20) !== 96) throw new Error(`Unexpected icon dimensions: ${iconPath}`)
  if (tabIcon && png.length > 40 * 1024) throw new Error(`Tab icon exceeds 40KB: ${iconPath}`)
}

for (const meta of Object.values(CATEGORY_META)) checkIcon(meta.icon)

for (const page of appConfig.pages) {
  for (const extension of requiredExtensions) {
    const file = path.join(root, `${page}${extension}`)
    if (!fs.existsSync(file)) {
      throw new Error(`Missing page file: ${file}`)
    }
  }

  const js = fs.readFileSync(path.join(root, `${page}.js`), 'utf8')
  const wxml = fs.readFileSync(path.join(root, `${page}.wxml`), 'utf8')
  for (const button of wxml.matchAll(/<button\b([^>]*)>/g)) {
    if (!/class="[^"]*\bui-button\b/.test(button[1])) throw new Error(`Button missing shared style: ${page}`)
  }
  for (const match of wxml.matchAll(/src="(\/assets\/icons\/[^"{}]+\.png)"/g)) checkIcon(match[1])
  const handlerPattern = /(?:bind|catch)(?:tap|change|input|submit|confirm|longpress)="([^"]+)"/g
  for (const match of wxml.matchAll(handlerPattern)) {
    const handler = match[1]
    if (!new RegExp(`\\b${handler}\\s*\\(`).test(js)) {
      throw new Error(`Missing handler "${handler}" for page: ${page}`)
    }
  }
}

for (const page of appConfig.tabBar.list) {
  if (!page.iconPath || !page.selectedIconPath) throw new Error(`Missing tab icons: ${page.text}`)
  if (page.iconPath === page.selectedIconPath) throw new Error(`Missing selected tab state: ${page.text}`)
  checkIcon(page.iconPath, true)
  checkIcon(page.selectedIconPath, true)
  if (!appConfig.pages.includes(page.pagePath)) {
    throw new Error(`Tab page is not registered: ${page.pagePath}`)
  }
}

console.log(`project check passed: ${appConfig.pages.length} pages`)
