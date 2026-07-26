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

  const HW = DIMENSIONS.houseWidth
  const zA = ZONE_OFFSETS.zoneAStart
  const zB = ZONE_OFFSETS.zoneBStart
  const zC = ZONE_OFFSETS.zoneCStart
  const lA = DIMENSIONS.zoneA.length
  const lB = DIMENSIONS.zoneB.length
  const lC = DIMENSIONS.zoneC.length
  const totalLen = ZONE_OFFSETS.totalLength
  const hA = DIMENSIONS.zoneA.wallHeight
  const hBC = DIMENSIONS.zoneB.eaveHeight

  // A区标签
  const labelA = createTextSprite('A区', 48, 0x333333)
  labelA.position.set(HW / 2, hA + 0.8, zA + lA / 2)
  group.add(labelA)

  // B区标签
  const labelB = createTextSprite('B区', 48, 0x333333)
  labelB.position.set(HW / 2, hBC + 0.8, zB + lB / 2)
  group.add(labelB)

  // C区标签
  const labelC = createTextSprite('C区', 48, 0x333333)
  labelC.position.set(HW / 2, hBC + 0.8, zC + lC / 2)
  group.add(labelC)

  // 方向标识 (N/S/E/W) 地面固定
  const margin = 4.0
  const dirY = 0.05
  const dirData: [string, number, number][] = [
    ['N', HW / 2, totalLen + margin],
    ['S', HW / 2, -margin],
    ['E', HW + margin, totalLen / 2],
    ['W', -margin, totalLen / 2],
  ]
  for (const [text, x, z] of dirData) {
    const sprite = createTextSprite(text, 56, 0x1a1a2e)
    sprite.position.set(x, dirY, z)
    sprite.scale.set(0.8, 0.4, 1)
    group.add(sprite)
  }

  // 入口标识 🚪
  const doorLabel = createTextSprite('\u{1F6AA}', 64, 0x000000)
  doorLabel.position.set(HW / 2, 1.0, -0.5)
  doorLabel.scale.set(0.6, 0.6, 1)
  group.add(doorLabel)

  return group
}
