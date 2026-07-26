import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'

function createTextSprite(text: string, fontSize: number, bgColor: number): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = `#${bgColor.toString(16).padStart(6, '0')}`
  ctx.globalAlpha = 0.7
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalAlpha = 1
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false })
  const sprite = new THREE.Sprite(spriteMat)
  sprite.scale.set(1.2, 0.6, 1)
  return sprite
}

export function createLabels(): THREE.Group {
  const group = new THREE.Group()

  const WL = 0.15
  const HW = DIMENSIONS.houseWidth
  const totalX = WL + HW + WL
  const zA = ZONE_OFFSETS.zoneAStart
  const zB = ZONE_OFFSETS.zoneBStart
  const zC = ZONE_OFFSETS.zoneCStart
  const zEnd = ZONE_OFFSETS.totalLength
  const lA = DIMENSIONS.zoneA.length
  const lB = DIMENSIONS.zoneB.length
  const lC = DIMENSIONS.zoneC.length
  const hA = DIMENSIONS.zoneA.wallHeight
  const hBC = DIMENSIONS.zoneB.eaveHeight

  const labelA = createTextSprite('A区', 48, 0x333333)
  labelA.position.set(totalX / 2, hA + 0.8, zA + lA / 2)
  group.add(labelA)

  const labelB = createTextSprite('B区', 48, 0x333333)
  labelB.position.set(totalX / 2, hBC + 0.8, zB + lB / 2)
  group.add(labelB)

  const labelC = createTextSprite('C区', 48, 0x333333)
  labelC.position.set(totalX / 2, hBC + 0.8, zC + lC / 2)
  group.add(labelC)

  const margin = 4.0
  const dirY = 0.05
  const cx = totalX / 2
  const cz = zEnd / 2
  const dist = Math.max(zEnd, totalX) / 2 + margin
  const cos45 = Math.SQRT1_2
  const dirData: [string, number, number][] = [
    ['N', cx + dist * cos45, cz + dist * cos45],
    ['S', cx - dist * cos45, cz - dist * cos45],
    ['E', cx - dist * cos45, cz + dist * cos45],
    ['W', cx + dist * cos45, cz - dist * cos45],
  ]
  for (const [text, x, z] of dirData) {
    const sprite = createTextSprite(text, 56, 0x1a1a2e)
    sprite.position.set(x, dirY, z)
    sprite.scale.set(0.8, 0.4, 1)
    group.add(sprite)
  }

  return group
}
