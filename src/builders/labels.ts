import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'

function makeSprite(text: string, fontSize: number, bgColor: number): THREE.Sprite {
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
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(1.2, 0.6, 1)
  return sprite
}

export function createLabels(): THREE.Group {
  const group = new THREE.Group()

  const WL = 0.15
  const HW = DIMENSIONS.houseWidth
  const totalX = WL + HW + WL
  const zEnd = ZONE_OFFSETS.totalLength

  // N/S/E/W 地面方向标识
  const margin = 4.0
  const cx = totalX / 2
  const cz = zEnd / 2
  const dist = Math.max(zEnd, totalX) / 2 + margin
  const cos45 = Math.SQRT1_2
  // 屏幕映射: 右=世界-X, 左=世界+X, 上=远(+Z), 下=近(-Z)
  // N=左上前方 → world(+X,+Z); E=右上前方 → world(-X,+Z)
  const dirs: [string, number, number][] = [
    ['N', cx + dist * cos45, cz + dist * cos45],
    ['S', cx - dist * cos45, cz - dist * cos45],
    ['E', cx - dist * cos45, cz + dist * cos45],
    ['W', cx + dist * cos45, cz - dist * cos45],
  ]
  for (const [text, x, z] of dirs) {
    const s = makeSprite(text, 56, 0x1a1a2e)
    s.position.set(x, 0.05, z)
    s.scale.set(0.8, 0.4, 1)
    group.add(s)
  }

  return group
}
