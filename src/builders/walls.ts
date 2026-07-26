import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'
import { createWallMaterial } from '../materials'

const WL = 0.15  // 墙厚
const HW = DIMENSIONS.houseWidth  // 2.56 内净宽

/** 建筑总宽(外墙外到外) */
const totalX = WL + HW + WL  // 2.86

function makeWall(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): THREE.Mesh {
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

  const hA = DIMENSIONS.zoneA.wallHeight    // 3.15
  const hBC = DIMENSIONS.zoneB.eaveHeight    // 3.15
  const lA = DIMENSIONS.zoneA.length         // 2.9
  const lB = DIMENSIONS.zoneB.length         // 3.0
  const lC = DIMENSIONS.zoneC.length         // 2.55

  // 区域边界Z坐标
  const zA = ZONE_OFFSETS.zoneAStart         // 0.15  A区起
  const zAB = ZONE_OFFSETS.zoneBStart        // 3.20  B区起 (= A-B墙NE面)
  const zC = ZONE_OFFSETS.zoneCStart         // 6.20  C区起
  const zEnd = ZONE_OFFSETS.totalLength      // 8.90  建筑总长
  const zAB_SW = ZONE_OFFSETS.wallAB_SW      // 3.05  A-B墙SW面

  // --- SW墙 (A区正面，入户门) ---
  const doorW = DIMENSIONS.door.width        // 1.0
  const doorH = DIMENSIONS.door.height       // 2.1
  const sideWallW = (totalX - doorW) / 2    // (2.86-1.0)/2 = 0.93
  const lintelH = hA - doorH                // 1.05
  // 左侧段
  group.add(makeWall(sideWallW / 2, hA / 2, WL / 2, sideWallW, hA, WL))
  // 右侧段
  group.add(makeWall(totalX - sideWallW / 2, hA / 2, WL / 2, sideWallW, hA, WL))
  // 过梁
  group.add(makeWall(totalX / 2, doorH + lintelH / 2, WL / 2, totalX, lintelH, WL))

  // --- NW墙 (过道侧) ---
  // A区段
  group.add(makeWall(WL / 2, hA / 2, zAB / 2, WL, hA, zAB))
  // B+C区段
  const zBC_len = zEnd - zAB
  group.add(makeWall(WL / 2, hBC / 2, zAB + zBC_len / 2, WL, hBC, zBC_len))

  // --- SE墙 (邻居侧) ---
  const seX = totalX - WL / 2  // 外墙中心X
  // A区段
  group.add(makeWall(seX, hA / 2, zAB / 2, WL, hA, zAB))
  // B+C区段
  group.add(makeWall(seX, hBC / 2, zAB + zBC_len / 2, WL, hBC, zBC_len))

  // --- NE墙 (背面) ---
  group.add(makeWall(totalX / 2, hBC / 2, zEnd - WL / 2, totalX, hBC, WL))

  // --- A-B 承重墙, 中间门洞 1.06m×2.58m, 褐红木框5cm ---
  const innerDoorW = DIMENSIONS.door.innerWidth   // 1.06m
  const innerDoorH = DIMENSIONS.door.innerHeight  // 2.58m
  const innerSideW = (totalX - innerDoorW) / 2
  const innerLintelH = hA - innerDoorH             // 0.57m
  const frameW = DIMENSIONS.door.frameWidth        // 0.05m
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x6b2020, roughness: 0.5, metalness: 0.1 })
  const abWallZ = zAB_SW + WL / 2          // A-B墙中心Z
  // 左侧段
  group.add(makeWall(innerSideW / 2, hA / 2, abWallZ, innerSideW, hA, WL))
  // 右侧段
  group.add(makeWall(totalX - innerSideW / 2, hA / 2, abWallZ, innerSideW, hA, WL))
  // 过梁
  group.add(makeWall(totalX / 2, innerDoorH + innerLintelH / 2, abWallZ, totalX, innerLintelH, WL))
  // 内门木框 (褐红色, 宽5cm)
  function addFrame(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), frameMat)
    m.position.set(cx, cy, cz); group.add(m)
  }
  // 上框
  addFrame(totalX / 2, innerDoorH + frameW / 2, abWallZ + WL / 2 + frameW / 2, innerDoorW + frameW * 2, frameW, frameW)
  // 左框
  addFrame(innerSideW / 2, innerDoorH / 2, abWallZ + WL / 2 + frameW / 2, frameW, innerDoorH, frameW)
  // 右框
  addFrame(totalX - innerSideW / 2, innerDoorH / 2, abWallZ + WL / 2 + frameW / 2, frameW, innerDoorH, frameW)

  // --- 室内地板 (按区域微调颜色) ---
  function makeFloor(zStart: number, zLen: number, color: number): THREE.Mesh {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.0 })
    const geo = new THREE.PlaneGeometry(HW, zLen)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(totalX / 2, 0.02, zStart + zLen / 2)
    mesh.receiveShadow = true
    return mesh
  }

  group.add(makeFloor(zA, lA, 0xd5cec5))  // A区暖灰
  group.add(makeFloor(zAB, lB, 0xe0d8c8)) // B区浅米
  group.add(makeFloor(zC, lC, 0xe8dfd0))  // C区暖黄

  return group
}
