import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'

const DIM_COLOR = 0xffd700  // 亮黄色
const WL = 0.15
const HW = DIMENSIONS.houseWidth
const totalX = WL + HW + WL
const totalZ = ZONE_OFFSETS.totalLength
const eaveH = DIMENSIONS.roof.eaveHeight
const ridgeH = DIMENSIONS.roof.ridgeHeight

/** 黄色尺寸线 */
function dimLine(points: THREE.Vector3[]): THREE.Line {
  const geo = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: DIM_COLOR, depthTest: false }))
}

/** 黄色尺寸文本 */
function dimText(text: string, pos: THREE.Vector3, scale = 0.6): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#00000088'
  ctx.fillRect(0, 0, 256, 64)
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 28px monospace'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 32)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }))
  s.position.copy(pos)
  s.scale.set(scale, scale / 4, 1)
  return s
}

export function createDimensions(): THREE.Group {
  const group = new THREE.Group()
  const d = 0.6  // 尺寸线离建筑距离

  // ─── 总长 (Z轴) — NW侧地面 ─────────────────────
  group.add(dimLine([new THREE.Vector3(-d, 0.02, 0), new THREE.Vector3(-d, 0.02, totalZ)]))
  group.add(dimText(`${totalZ.toFixed(2)}m`, new THREE.Vector3(-d, 0.15, totalZ / 2)))

  // ─── 总宽 (X轴) — SW侧地面 ─────────────────────
  group.add(dimLine([new THREE.Vector3(0, 0.02, -d), new THREE.Vector3(totalX, 0.02, -d)]))
  group.add(dimText(`${totalX.toFixed(2)}m`, new THREE.Vector3(totalX / 2, 0.15, -d)))

  // ─── 各区段长度 (Z轴) — SE侧地面 ─────────────
  const zA = ZONE_OFFSETS.zoneAStart
  const zB = ZONE_OFFSETS.zoneBStart
  const zC = ZONE_OFFSETS.zoneCStart
  const lA = DIMENSIONS.zoneA.length
  const lB = DIMENSIONS.zoneB.length
  const lC = DIMENSIONS.zoneC.length

  const segY = 0.02; const d2 = totalX + d
  const makeSeg = (z0: number, len: number, label: string) => {
    group.add(dimLine([new THREE.Vector3(d2, segY, z0), new THREE.Vector3(d2, segY, z0 + len)]))
    group.add(dimText(`${label}: ${len.toFixed(2)}m`, new THREE.Vector3(d2, 0.15, z0 + len / 2), 0.5))
  }
  makeSeg(zA, lA, 'A区'); makeSeg(zB, lB, 'B区'); makeSeg(zC, lC, 'C区')

  // ─── 总高 (Y轴) — SW角垂直虚线 ────────────────
  const hx = 0; const hz = -0.3
  group.add(dimLine([new THREE.Vector3(hx, 0, hz), new THREE.Vector3(hx, eaveH, hz)]))
  group.add(dimText(`${eaveH.toFixed(2)}m`, new THREE.Vector3(hx, eaveH / 2, hz - 0.2)))
  group.add(dimLine([new THREE.Vector3(hx, eaveH, hz), new THREE.Vector3(hx, ridgeH, hz)]))
  group.add(dimText(`${ridgeH.toFixed(2)}m`, new THREE.Vector3(hx, (eaveH + ridgeH) / 2, hz - 0.2)))

  // ─── 入户门 — SW立面 ───────────────────────────
  const doorW = DIMENSIONS.door.width; const doorH = DIMENSIONS.door.height
  const dcx = totalX / 2
  group.add(dimLine([new THREE.Vector3(dcx - doorW / 2, doorH + 0.1, 0), new THREE.Vector3(dcx + doorW / 2, doorH + 0.1, 0)]))
  group.add(dimText(`${doorW.toFixed(2)}×${doorH.toFixed(2)}m`, new THREE.Vector3(dcx, doorH + 0.3, -0.1)))

  // ─── 窗户尺寸 — SE立面 ─────────────────────────
  const winW = DIMENSIONS.window.width; const winH = DIMENSIONS.window.height
  const wx = totalX + 0.05
  for (let i = 0; i < 3; i++) {
    const wz = zB + (i + 0.5) * (lB + lC) / 3 + (i >= 2 ? lA : 0)  // rough spread
    // approximate window positions matching window builder
  }
  // 简化为固定标注
  group.add(dimText(`窗${winW.toFixed(1)}×${winH.toFixed(1)}m ×3`, new THREE.Vector3(wx, 2.0, zB + (lB + lC) / 2), 0.45))

  // ─── 檐口高 — NW立面 ──────────────────────────
  group.add(dimLine([new THREE.Vector3(-0.05, eaveH, zB), new THREE.Vector3(0.15, eaveH, zB)]))
  group.add(dimText(`檐${eaveH.toFixed(2)}m`, new THREE.Vector3(0.2, eaveH, zB), 0.4))

  // ─── 屋脊高 — NW立面 ──────────────────────────
  group.add(dimLine([new THREE.Vector3(-0.05, ridgeH, zB + DIMENSIONS.roof.totalLength / 2), new THREE.Vector3(0.15, ridgeH, zB + DIMENSIONS.roof.totalLength / 2)]))
  group.add(dimText(`脊${ridgeH.toFixed(2)}m`, new THREE.Vector3(0.2, ridgeH, zB + DIMENSIONS.roof.totalLength / 2), 0.4))

  return group
}
