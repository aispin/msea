import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'
import { aisleX, frontZ, centerX } from '../utils/screen'

const DIM_COLOR = 0xffd700
const WL = 0.15
const totalX = WL + DIMENSIONS.houseWidth + WL
const totalZ = ZONE_OFFSETS.totalLength
const eaveH = DIMENSIONS.roof.eaveHeight
const ridgeH = DIMENSIONS.roof.ridgeHeight

const DIM_OFFSET = 0.08
const DIM_X = aisleX(DIM_OFFSET)
const DIM_LABEL_X = aisleX(DIM_OFFSET + 0.15)

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

  group.add(dimLine([new THREE.Vector3(DIM_X, 0.02, 0), new THREE.Vector3(DIM_X, 0.02, totalZ)]))
  group.add(dimText(`${totalZ.toFixed(2)}m`, new THREE.Vector3(DIM_LABEL_X, 0.15, totalZ / 2)))

  const frontZOff = frontZ(DIM_OFFSET)
  group.add(dimLine([new THREE.Vector3(0, 0.02, frontZOff), new THREE.Vector3(totalX, 0.02, frontZOff)]))
  group.add(dimText(`${totalX.toFixed(2)}m`, new THREE.Vector3(centerX(), 0.15, frontZ(DIM_OFFSET + 0.15))))

  const zA = ZONE_OFFSETS.zoneAStart, zB = ZONE_OFFSETS.zoneBStart, zC = ZONE_OFFSETS.zoneCStart
  const lA = DIMENSIONS.zoneA.length, lB = DIMENSIONS.zoneB.length, lC = DIMENSIONS.zoneC.length
  const mk = (z0: number, len: number, label: string) => {
    group.add(dimLine([new THREE.Vector3(DIM_X, 0.02, z0), new THREE.Vector3(DIM_X, 0.02, z0 + len)]))
    group.add(dimText(`${label}: ${len.toFixed(2)}m`, new THREE.Vector3(DIM_LABEL_X, 0.15, z0 + len / 2), 0.5))
  }
  mk(zA, lA, 'A区'); mk(zB, lB, 'B区'); mk(zC, lC, 'C区')

  const wallAB = ZONE_OFFSETS.zoneBStart - WL / 2
  const wallNE = ZONE_OFFSETS.zoneBStart + DIMENSIONS.roof.totalLength + WL
  const hzRidge = (wallAB + wallNE) / 2
  group.add(dimLine([new THREE.Vector3(DIM_X, 0, hzRidge), new THREE.Vector3(DIM_X, eaveH, hzRidge)]))
  group.add(dimText(`檐${eaveH.toFixed(2)}m`, new THREE.Vector3(DIM_LABEL_X, eaveH / 2, hzRidge)))
  group.add(dimLine([new THREE.Vector3(DIM_X, eaveH, hzRidge), new THREE.Vector3(DIM_X, ridgeH, hzRidge)]))
  group.add(dimText(`脊${ridgeH.toFixed(2)}m`, new THREE.Vector3(DIM_LABEL_X, (eaveH + ridgeH) / 2, hzRidge)))

  const doorW = DIMENSIONS.door.width, doorH = DIMENSIONS.door.height, dcx = totalX / 2
  group.add(dimLine([new THREE.Vector3(dcx - doorW / 2, doorH + 0.1, 0), new THREE.Vector3(dcx + doorW / 2, doorH + 0.1, 0)]))
  group.add(dimText(`外门${doorW.toFixed(2)}×${doorH.toFixed(2)}m`, new THREE.Vector3(dcx, doorH + 0.3, -0.1)))

  const iw = DIMENSIONS.door.innerWidth, ih = DIMENSIONS.door.innerHeight
  const iz = ZONE_OFFSETS.zoneBStart - WL / 2
  group.add(dimLine([new THREE.Vector3(dcx - iw / 2, ih + 0.1, iz), new THREE.Vector3(dcx + iw / 2, ih + 0.1, iz)]))
  group.add(dimText(`内门${iw.toFixed(2)}×${ih.toFixed(2)}m`, new THREE.Vector3(dcx, ih + 0.3, iz)))

  const winW = DIMENSIONS.window.width, winH = DIMENSIONS.window.height
  const winBZ = zB + (lB + DIMENSIONS.zoneC.length) / 4
  group.add(dimText(`窗${winW.toFixed(1)}×${winH.toFixed(1)}m`, new THREE.Vector3(DIM_LABEL_X, 0.6, winBZ), 0.45))

  return group
}
