import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'

const DIM_COLOR = 0xffd700
const WL = 0.15
const HW = DIMENSIONS.houseWidth
const totalX = WL + HW + WL
const totalZ = ZONE_OFFSETS.totalLength
const eaveH = DIMENSIONS.roof.eaveHeight
const ridgeH = DIMENSIONS.roof.ridgeHeight

// 标注位置 — 基于NW墙外表面(X=0)
const DIM_OFFSET = 0.08
const DIM_X = -DIM_OFFSET          // 尺寸线X
const DIM_LABEL_X = -DIM_OFFSET - 0.15  // 文本X(更外)

function dimLine(points: THREE.Vector3[]): THREE.Line {
  const geo = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: DIM_COLOR, depthTest: false }))
}

function dimText(text: string, pos: THREE.Vector3, scale = 0.6): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#00000088'; ctx.fillRect(0, 0, 256, 64)
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 28px monospace'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 32)
  const tex = new THREE.CanvasTexture(canvas); tex.minFilter = THREE.LinearFilter
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }))
  s.position.copy(pos); s.scale.set(scale, scale / 4, 1)
  return s
}

export function createDimensions(): THREE.Group {
  const group = new THREE.Group()

  // ─── 总长 (Z轴) ──────────────────────────────
  group.add(dimLine([new THREE.Vector3(DIM_X, 0.02, 0), new THREE.Vector3(DIM_X, 0.02, totalZ)]))
  group.add(dimText(`${totalZ.toFixed(2)}m`, new THREE.Vector3(DIM_LABEL_X, 0.15, totalZ / 2)))

  // ─── 总宽 (X轴) — SW侧 ─────────────────────
  group.add(dimLine([new THREE.Vector3(0, 0.02, -DIM_OFFSET), new THREE.Vector3(totalX, 0.02, -DIM_OFFSET)]))
  group.add(dimText(`${totalX.toFixed(2)}m`, new THREE.Vector3(totalX / 2, 0.15, -DIM_OFFSET - 0.15)))

  // ─── 各区段长度 — NW侧 ──────────────────────
  const zA = ZONE_OFFSETS.zoneAStart
  const zB = ZONE_OFFSETS.zoneBStart
  const zC = ZONE_OFFSETS.zoneCStart
  const lA = DIMENSIONS.zoneA.length
  const lB = DIMENSIONS.zoneB.length
  const lC = DIMENSIONS.zoneC.length
  const mk = (z0: number, len: number, label: string) => {
    group.add(dimLine([new THREE.Vector3(DIM_X, 0.02, z0), new THREE.Vector3(DIM_X, 0.02, z0 + len)]))
    group.add(dimText(`${label}: ${len.toFixed(2)}m`, new THREE.Vector3(DIM_LABEL_X, 0.15, z0 + len / 2), 0.5))
  }
  mk(zA, lA, 'A区'); mk(zB, lB, 'B区'); mk(zC, lC, 'C区')

  // ─── 总高 — NW墙外屋脊处 ────────────────────
  const wallAB = ZONE_OFFSETS.zoneBStart - WL / 2
  const wallNE = ZONE_OFFSETS.zoneBStart + DIMENSIONS.roof.totalLength + WL
  const hzRidge = (wallAB + wallNE) / 2
  group.add(dimLine([new THREE.Vector3(DIM_X, 0, hzRidge), new THREE.Vector3(DIM_X, eaveH, hzRidge)]))
  group.add(dimText(`檐${eaveH.toFixed(2)}m`, new THREE.Vector3(DIM_LABEL_X, eaveH / 2, hzRidge)))
  group.add(dimLine([new THREE.Vector3(DIM_X, eaveH, hzRidge), new THREE.Vector3(DIM_X, ridgeH, hzRidge)]))
  group.add(dimText(`脊${ridgeH.toFixed(2)}m`, new THREE.Vector3(DIM_LABEL_X, (eaveH + ridgeH) / 2, hzRidge)))

  // ─── 入户门 — SW立面 ─────────────────────────
  const doorW = DIMENSIONS.door.width; const doorH = DIMENSIONS.door.height
  const dcx = totalX / 2
  group.add(dimLine([new THREE.Vector3(dcx - doorW / 2, doorH + 0.1, 0), new THREE.Vector3(dcx + doorW / 2, doorH + 0.1, 0)]))
  group.add(dimText(`外门${doorW.toFixed(2)}×${doorH.toFixed(2)}m`, new THREE.Vector3(dcx, doorH + 0.3, -0.1)))

  // ─── 内门 — A-B墙 ────────────────────────────
  const iw = DIMENSIONS.door.innerWidth; const ih = DIMENSIONS.door.innerHeight
  const iz = ZONE_OFFSETS.zoneBStart - WL / 2
  group.add(dimLine([new THREE.Vector3(dcx - iw / 2, ih + 0.1, iz), new THREE.Vector3(dcx + iw / 2, ih + 0.1, iz)]))
  group.add(dimText(`内门${iw.toFixed(2)}×${ih.toFixed(2)}m`, new THREE.Vector3(dcx, ih + 0.3, iz)))

  // ─── 窗户 — NW墙外 ───────────────────────────
  const winW = DIMENSIONS.window.width; const winH = DIMENSIONS.window.height
  const winBZ = zB + (lB + DIMENSIONS.zoneC.length) / 4
  group.add(dimText(`窗${winW.toFixed(1)}×${winH.toFixed(1)}m`, new THREE.Vector3(DIM_LABEL_X, 0.6, winBZ), 0.45))

  return group
}
