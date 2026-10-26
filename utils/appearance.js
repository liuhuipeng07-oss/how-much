const HAIRS = ['#74482f', '#29282c', '#4f7181', '#bb6f79']
const OUTFITS = ['#4d7558', '#d78862', '#5c608e', '#bd9143']
function characterSprite(character = {}) {
  const hair = Math.max(0, HAIRS.indexOf(character.hairColor))
  const outfit = Math.max(0, OUTFITS.indexOf(character.outfitColor))
  return `/assets/character/explorer-h${hair}-o${outfit}.png`
}
module.exports = { HAIRS, OUTFITS, characterSprite }
