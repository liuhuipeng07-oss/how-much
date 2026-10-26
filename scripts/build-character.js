// Build-time palette variants of the generated pixel sprite. Requires sharp in NODE_PATH.
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { HAIRS, OUTFITS } = require('../utils/appearance')
const output = path.resolve(__dirname, '../assets/character')
const rgb = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16))
async function build() {
  const source = process.argv[2] || path.join(output, 'source/explorer-master.png')
  fs.mkdirSync(path.join(output, 'source'), { recursive: true })
  if (path.resolve(source) !== path.join(output, 'source/explorer-master.png')) fs.copyFileSync(source, path.join(output, 'source/explorer-master.png'))
  const { data, info } = await sharp(source).resize(128, 192, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) data[i + 3] = data[i + 3] >= 220 ? 255 : 0
  for (let h = 0; h < HAIRS.length; h++) {
    for (let o = 0; o < OUTFITS.length; o++) {
      const pixels = Buffer.from(data)
      for (let i = 0; i < pixels.length; i += 4) {
        if (!pixels[i + 3]) continue
        const y = Math.floor(i / 4 / info.width) / info.height
        const [r, g, b] = pixels.subarray(i, i + 3)
        const isHair = y < 0.42 && r > g * 1.2 && g > b * 1.15 && r < 170
        const isJacket = y > 0.40 && y < 0.73 && g > r * 1.03 && g > b * 1.12
        const target = isHair && h !== 0 ? rgb(HAIRS[h]) : isJacket && o !== 0 ? rgb(OUTFITS[o]) : null
        if (!target) continue
        const light = (r * 0.2126 + g * 0.7152 + b * 0.0722) / (isHair ? 75 : 95)
        target.forEach((channel, index) => { pixels[i + index] = Math.max(10, Math.min(245, Math.round(channel * light))) })
      }
      await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ background: '#00000000', threshold: 1 }).png({ palette: true, colours: 96 }).toFile(path.join(output, `explorer-h${h}-o${o}.png`))
    }
  }
  console.log('Built 16 shared character palette variants.')
}
build().catch((error) => { console.error(error); process.exitCode = 1 })
