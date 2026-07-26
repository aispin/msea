import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'
import { createWallMaterial } from '../materials'

const WALL_THICKNESS = 0.15
const HW = DIMENSIONS.houseWidth
const WL = WALL_THICKNESS

/** 创建一面墙: 中心在 (cx, cy, cz), 尺寸 (sx, sy, sz) */
function makeWall(
  cx: number, cy: number, cz: number,
  sx: number, sy: number, sz: number
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(sx, sy, sz)
  const mat = createWallMaterial()
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(cx, cy, cz)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function createWalls(): THREE.Group {
  const group = new THREE.Group()

  const zA = ZONE_OFFSETS.zoneAStart
  const zB = ZONE_OFFSETS.zoneBStart
  const totalZ = ZONE_OFFSETS.totalLength

  // --- A区墙体 ---
  const hA = DIMENSIONS.zoneA.wallHeight
  const lA = DIMENSIONS.zoneA.length

  // A区 NW墙 (过道侧)
  group.add(makeWall(-WL / 2, hA / 2, zA + lA / 2, WL, hA, lA))
  // A区 SE墙 (邻居侧)
  group.add(makeWall(HW + WL / 2, hA / 2, zA + lA / 2, WL, hA, lA))
  // A区 SW墙 (正面, 门洞位置 - 分左右两段)
  // 门的宽度1.0m, 左右各留0.78m墙体
  const doorW = DIMENSIONS.door.width
  const sideWallW = (HW - doorW) / 2 // 0.78m each side
  // 左侧墙段 (从x=0到x=sideWallW)
  group.add(makeWall(sideWallW / 2, hA / 2, zA, sideWallW, hA, WL))
  // 右侧墙段 (从x=HW-sideWallW到x=HW)
  group.add(makeWall(HW - sideWallW / 2, hA / 2, zA, sideWallW, hA, WL))
  // 门过梁 (门上方墙体)
  const doorH = DIMENSIONS.door.height
  const lintelH = hA - doorH // 1.05m
  group.add(makeWall(HW / 2, doorH + lintelH / 2, zA, HW, lintelH, WL))

  // --- B区 + C区墙体 ---
  const hBC = DIMENSIONS.zoneB.eaveHeight
  const lBC = DIMENSIONS.zoneB.length + DIMENSIONS.zoneC.length

  // B+C NW墙 (过道侧)
  group.add(makeWall(-WL / 2, hBC / 2, zB + lBC / 2, WL, hBC, lBC))
  // B+C SE墙 (邻居侧, 无窗)
  group.add(makeWall(HW + WL / 2, hBC / 2, zB + lBC / 2, WL, hBC, lBC))
  // B+C NE墙 (背面)
  group.add(makeWall(HW / 2, hBC / 2, totalZ, HW, hBC, WL))

  // --- A-B 承重墙 (z=2.9,隔开A区和B区, 中间门洞无门板) ---
  const innerDoorW = DIMENSIONS.door.width   // 1.0m, 与入户门同宽
  const innerDoorH = DIMENSIONS.door.height + 0.5  // 2.6m, 比入户门高50cm
  const innerSideW = (HW - innerDoorW) / 2   // 0.78m
  // 左侧墙段
  group.add(makeWall(innerSideW / 2, hA / 2, zB, innerSideW, hA, WL))
  // 右侧墙段
  group.add(makeWall(HW - innerSideW / 2, hA / 2, zB, innerSideW, hA, WL))
  // 门洞过梁 (2.6m以上到3.15m)
  const innerLintelH = hA - innerDoorH  // 0.55m
  group.add(makeWall(HW / 2, innerDoorH + innerLintelH / 2, zB, HW, innerLintelH, WL))

  return group
}
