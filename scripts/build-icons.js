// Build-time only. Run with sharp available in NODE_PATH; the mini-program uses the generated PNGs.
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const root = path.resolve(__dirname, '..')
const output = path.join(root, 'assets', 'icons')
const masters = path.join(output, 'source')
const ink = '#302e29'
const paper = '#fff4d5'
const gold = '#efbd59'
const green = '#4c8165'
const blue = '#77b7c5'
const muted = '#928a74'
const r = (x, y, w, h, fill, stroke = ink) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}"/>`
const p = (d, fill = 'none', stroke = ink) => `<path d="${d}" fill="${fill}" stroke="${stroke}"/>`
const dot = (x, y, color = ink, size = 2) => r(x, y, size, size, color, 'none')
const cottage = (roof = '#bb6450', wall = '#f0d79c') =>
  r(23, 6, 3, 8, '#a78966') + p('M6 15H26V28H6Z', wall) +
  p('M3 15V12H6V9H9V6H13V3H19V6H23V9H26V12H29V15H24V12H21V9H18V7H14V9H11V12H8V15Z', roof) +
  r(13, 19, 6, 9, green) + r(8, 16, 3, 4, blue) + r(21, 16, 3, 4, blue) +
  p('M12 29H21', 'none', ink) + dot(17, 24, gold, 1) + dot(9, 17, paper, 1)
const chest = (lid = '#c8954b', body = '#ae773e') =>
  p('M5 8H27V11H29V26H3V11H5Z', body) + r(5, 6, 22, 9, lid) +
  r(7, 7, 3, 18, gold) + r(22, 7, 3, 18, gold) + r(3, 15, 26, 3, '#805632') +
  r(13, 13, 6, 8, gold) + dot(15, 16, ink) + p('M11 9H21', 'none', '#eed3a3')
const chart = () => r(5, 21, 5, 7, '#91b984') + r(13, 16, 5, 12, '#6f9e71') +
  r(21, 10, 5, 18, green) + p('M3 17H7V14H12V11H17V7H24V4H29V10H26V8H23V10H18V14H13V17H8V20H3Z', gold) +
  p('M3 29H29', 'none', ink)
const portrait = () => p('M6 29V24H10V21H22V24H26V29Z', green) +
  p('M9 10H23V21H20V24H12V21H9Z', '#efbc88') +
  p('M7 17V8H9V5H13V3H21V5H24V8H25V17H22V10H19V12H15V9H11V17Z', '#6e4936') +
  dot(12, 16) + dot(19, 16) + p('M14 21H18', 'none', '#a96f53') +
  r(13, 25, 6, 3, paper) + dot(22, 26, gold)
const globe = () => p('M10 3H22V5H27V10H29V22H27V27H22V29H10V27H5V22H3V10H5V5H10Z', blue) +
  p('M10 5H16V9H13V12H8V16H5V10H7V8H10Z', '#8cab6c') +
  p('M19 12H26V16H24V21H21V26H17V22H15V16H19Z', '#72a166') +
  p('M10 4V7M7 20H10V23H13', 'none', '#e4e9c7') + dot(23, 8, paper)
const car = () => p('M3 18H5V14H9L12 8H22L26 15H29V25H3Z', '#bc5d4c') +
  p('M12 10H20L23 15H9Z', blue) + p('M16 10V15', 'none', ink) +
  r(6, 23, 5, 5, ink) + r(22, 23, 5, 5, ink) + dot(7, 24, muted) + dot(23, 24, muted) +
  r(4, 18, 4, 3, paper) + r(25, 18, 3, 3, '#f0b45d') + p('M10 19H22', 'none', '#e39b79')
const coin = () => p('M11 3H21V5H25V8H28V24H25V27H21V29H11V27H7V24H4V8H7V5H11Z', gold) +
  p('M11 6H21V8H24V24H21V26H11V24H8V8H11Z', '#f9d878', '#c18a37') +
  p('M12 10H20V12H22V15H20V17H22V21H20V23H12V10M15 8V25M18 8V10M18 23V25M15 16H20', 'none', '#80572d') + dot(9, 9, paper)
const laptop = () => r(5, 5, 22, 19, '#637b81') + r(7, 7, 18, 14, '#72b3c6') +
  p('M8 18L17 8H22L12 20H8Z', '#c2e4e5', 'none') + p('M5 24H27L30 28H2Z', '#c3c0a9') +
  p('M13 26H19', 'none', '#6d7771')
const watch = () => r(12, 2, 8, 28, '#bd8a43') + r(12, 4, 8, 3, '#eac469') + r(12, 25, 8, 3, '#eac469') +
  p('M9 8H23V11H26V21H23V24H9V21H6V11H9Z', gold) +
  p('M11 10H21V12H23V20H21V22H11V20H9V12H11Z', '#b2d4d7') +
  p('M16 12V17H20', 'none', ink) + dot(12, 13, paper) + r(26, 14, 2, 4, '#b28242')
const crown = () => p('M4 9L10 15L16 5L22 15L28 9L25 26H7Z', gold) +
  r(7, 23, 18, 5, '#d19a40') + dot(14, 15, '#b66579', 4) + dot(8, 18, blue) + dot(22, 18, blue) +
  dot(2, 6, '#f1d67e', 3) + dot(14, 2, '#f1d67e', 3) + dot(27, 6, '#f1d67e', 3)
const money = () => p('M11 3H22L19 10H13Z', '#90ae73') +
  p('M12 10H20L26 17V25L23 29H8L5 25V17Z', '#88aa6c') +
  r(11, 9, 11, 3, '#cb9b54') + r(11, 17, 10, 9, gold) +
  p('M14 19H18M16 18V24M14 23H18', 'none', '#8b6534') + dot(8, 19, '#bdcd92')
const cat = () => p('M7 18V5L13 9H19L25 5V18L27 21V27H5V21Z', '#b8b4a1') +
  p('M8 8L11 10H8ZM24 8L21 10H24Z', '#d7988a', 'none') +
  p('M9 18H23V25H9Z', paper, 'none') + dot(10, 14) + dot(20, 14) + dot(15, 18, '#9b7362') +
  p('M14 22H18M3 17H8M24 17H29M3 21H8M24 21H29', 'none', ink) + r(10, 26, 4, 3, paper) + r(18, 26, 4, 3, paper)
const bag = () => p('M11 7V3H21V7', 'none', ink) +
  p('M7 7H25V10H28V28H4V10H7Z', '#b98549') + r(7, 8, 18, 8, '#d2a15e') +
  r(7, 20, 18, 7, '#cc9a55') + r(13, 12, 6, 8, gold) + dot(15, 15, ink) +
  p('M8 21H12M20 21H24', 'none', '#f5d69b')
const wish = () => p('M7 3H23V7H27V29H5V7H7Z', paper) +
  r(7, 3, 16, 4, '#d7b879') + p('M12 12V9H20V12H22V16H18V19H14V16H18V13H16', gold) +
  dot(14, 22, green, 3) + p('M8 27H23', 'none', '#cebc8d')
const idle = () => p('M7 15H25V28H7Z', '#bc935d') + p('M7 15L3 11L12 7L16 12L20 7L29 11L25 15L16 19Z', '#e5bf7e') +
  p('M16 19V28', 'none', '#805f3e') + p('M19 3H27V7H30V3L27 0V2H19Z', green, 'none') +
  r(11, 22, 3, 4, paper)
const sun = () => p('M12 9H20V12H23V20H20V23H12V20H9V12H12Z', gold) +
  p('M15 2H17V6H15ZM15 26H17V30H15ZM2 15H6V17H2ZM26 15H30V17H26ZM5 5H8V8H5ZM24 24H27V27H24ZM24 5H27V8H24ZM5 24H8V27H5Z', '#d4a24a', 'none') + dot(12, 11, '#ffe7a6', 3)
const rain = () => p('M5 20V10H9V7H19V10H26V13H29V22H4Z', '#9cbec8') +
  p('M7 14V12H12V9H18', 'none', '#dcebee') + p('M8 25V29M16 25V30M24 25V29', 'none', '#6390ab')
const plus = () => p('M13 5H19V13H27V19H19V27H13V19H5V13H13Z', green)
const edit = () => p('M6 23L22 7L27 12L11 28H5Z', gold) +
  p('M21 8L24 5L29 10L26 13Z', '#be7c73') + p('M8 22L12 26M7 25L5 28', 'none', ink) + p('M13 21L22 12', 'none', paper)
const energy = () => p('M18 2L6 18H14L11 30L27 12H18L21 2Z', gold)
const archive = () => r(5, 12, 22, 16, '#c6a16b') + r(3, 9, 26, 5, '#efd2a0') +
  p('M14 3H18V17H22L16 23L10 17H14Z', green) + p('M10 26H22', 'none', '#8c6e48')
const restore = () => p('M24 11H28V22H25V26H20V29H10V26H6V22H4V16H8V21H10V23H20V21H23V16H18L25 8Z', green)
const share = () => p('M9 16L23 7M9 16L23 25', 'none', green) + r(3, 12, 8, 8, gold) + r(22, 3, 7, 7, '#8bb78c') + r(22, 22, 7, 7, '#8bb78c')
const check = () => p('M3 16L8 11L13 16L24 5L29 10L13 27Z', green)
const seed = () => p('M15 28V12', 'none', '#688855') +
  p('M15 18H10V16H6V12H4V7H10V9H13V12H15Z', '#92b779') +
  p('M16 13V9H20V6H27V11H24V14H20V17H16Z', green) +
  p('M6 29H27', 'none', '#aa8351') + dot(10, 27, '#c9a568')
const boat = () => p('M3 18H29L24 26H9Z', '#c49359') +
  p('M8 21H25', 'none', '#f1d9a1') + p('M7 5L23 21M4 3L9 8L7 10L2 5Z', gold) +
  p('M3 29H11M15 29H25M25 16H29', 'none', blue)
const rocket = () => p('M16 3L23 10V23H9V10Z', '#d2ded7') +
  p('M9 17L4 22V27L9 24ZM23 17L28 22V27L23 24Z', '#b65f50') +
  r(13, 10, 6, 7, blue) + p('M12 24H20L18 30L16 27L14 30Z', gold) +
  p('M13 7H19', 'none', paper)

const icons = {
  'nav-home': cottage(), 'nav-world': globe(), 'nav-assets': chest(), 'nav-growth': chart(), 'nav-profile': portrait(),
  'category-property': cottage(), 'category-vehicle': car(), 'category-finance': chart(),
  'category-crypto': coin(), 'category-device': laptop(), 'category-collection': watch(),
  'category-membership': crown(), 'category-cash': money(), 'category-pet': cat(), 'category-other': bag(),
  'action-wish': wish(), 'action-idle': idle(), 'action-income': money(), 'action-weather': sun(),
  'action-rain': rain(), 'action-edit': edit(), 'action-energy': energy(), 'action-archive': archive(),
  'action-restore': restore(), 'action-share': share(), 'action-add': plus(), 'action-check': check(),
  'route-steady': seed(), 'route-normal': boat(), 'route-dream': rocket()
}

function document(body, inactive = false) {
  if (inactive) {
    body = body.replace(/#[0-9a-f]{6}/gi, (hex) => {
      if (hex === ink) return '#756e5e'
      if (hex === paper) return '#f0ebdb'
      return '#c4bba5'
    })
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 32 32" shape-rendering="crispEdges"><g stroke-width="1" stroke-linejoin="miter">${body}</g></svg>`
}

async function build() {
  fs.mkdirSync(masters, { recursive: true })
  const tiles = []
  for (const [name, body] of Object.entries(icons)) {
    const variants = name.startsWith('nav-') ? ['default', 'selected'] : ['color']
    for (const variant of variants) {
      const filename = variant === 'color' ? name : `${name}-${variant}`
      const svg = document(body, variant === 'default')
      fs.writeFileSync(path.join(masters, `${filename}.svg`), svg)
      await sharp(Buffer.from(svg)).png().toFile(path.join(output, `${filename}.png`))
      tiles.push({ filename, svg })
    }
  }
  const columns = 6
  const width = 840
  const rowHeight = 160
  const height = Math.ceil(tiles.length / columns) * rowHeight + 70
  const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#fffaf0"/><text x="24" y="36" font-family="monospace" font-size="22" fill="${ink}">HOW MUCH / PIXEL ICONS / V0.4.1</text>${tiles.map((tile, i) => {
    const x = i % columns * 140
    const y = Math.floor(i / columns) * rowHeight + 60
    return `<g transform="translate(${x + 22},${y})">${tile.svg.replace('<svg ', '<svg x="0" y="0" ')}<text x="48" y="118" text-anchor="middle" font-family="monospace" font-size="10" fill="#625c4e">${tile.filename.replace('category-', '').replace('action-', '')}</text></g>`
  }).join('')}</svg>`
  const previewPath = path.join(root, 'docs', 'icons-v0.4.1.png')
  await sharp(Buffer.from(preview)).png().toFile(previewPath)
  console.log(`Built ${tiles.length} PNG icons; preview: ${previewPath}`)
}

build().catch((error) => { console.error(error); process.exitCode = 1 })
