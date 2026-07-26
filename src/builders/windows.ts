import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'
import { createWoodMaterial, createGlassMaterial } from '../materials'

/** 创建一扇木格窗 (宽×高 = 1.2m×1.5m) */
export function createWindow(): THREE.Group {
  const group = new THREE.Group()
  const woodMat = createWoodMaterial()
  const glassMat = createGlassMaterial()

  const winW = DIMENSIONS.window.width     // 1.2m
  const winH = DIMENSIONS.window.height     // 1.5m
  const frameT = DIMENSIONS.window.frameThickness // 0.06m
  const bars = DIMENSIONS.window.latticeBars      // 4

  // 玻璃面板
  const glassGeo = new THREE.PlaneGeometry(winW - frameT * 2, winH - frameT * 2)
  const glass = new THREE.Mesh(glassGeo, glassMat)
  glass.position.set(winW / 2, winH / 2, 0.01)
  group.add(glass)

  // 窗框 (四边)
  const hBarGeo = new THREE.BoxGeometry(winW, frameT, frameT * 1.5)
  const vBarGeo = new THREE.BoxGeometry(frameT, winH, frameT * 1.5)
  // 上框
  const top = new THREE.Mesh(hBarGeo, woodMat)
  top.position.set(winW / 2, winH - frameT / 2, frameT / 2)
  group.add(top)
  // 下框
  const bottom = new THREE.Mesh(hBarGeo, woodMat)
  bottom.position.set(winW / 2, frameT / 2, frameT / 2)
  group.add(bottom)
  // 左框
  const left = new THREE.Mesh(vBarGeo, woodMat)
  left.position.set(frameT / 2, winH / 2, frameT / 2)
  group.add(left)
  // 右框
  const right = new THREE.Mesh(vBarGeo, woodMat)
  right.position.set(winW - frameT / 2, winH / 2, frameT / 2)
  group.add(right)

  // 木格栅 — 竖条
  const barGeo = new THREE.BoxGeometry(frameT * 0.6, winH - frameT * 2, frameT * 1.2)
  for (let i = 1; i <= bars; i++) {
    const x = frameT + (i / (bars + 1)) * (winW - frameT * 2)
    const bar = new THREE.Mesh(barGeo, woodMat)
    bar.position.set(x, winH / 2, frameT / 2)
    group.add(bar)
  }
  // 横条 (中间一条)
  const crossBarGeo = new THREE.BoxGeometry(winW - frameT * 2, frameT * 0.5, frameT * 1.2)
  const crossBar = new THREE.Mesh(crossBarGeo, woodMat)
  crossBar.position.set(winW / 2, winH / 2, frameT / 2)
  group.add(crossBar)

  return group
}

/** 所有窗户放置在建筑上 */
export function createAllWindows(): THREE.Group {
  const group = new THREE.Group()

  const winW = DIMENSIONS.window.width   // 1.2m
  const sillH = DIMENSIONS.window.sillHeight // 1.2m
  const HW = DIMENSIONS.houseWidth
  const zB = ZONE_OFFSETS.zoneBStart     // 2.9
  const zC = ZONE_OFFSETS.zoneCStart     // 5.9
  const lB = DIMENSIONS.zoneB.length     // 3.0
  const lC = DIMENSIONS.zoneC.length     // 2.55

  // B区过道窗 — SE墙，B区前一半居中
  const w1 = createWindow()
  w1.rotation.y = Math.PI / 2
  w1.position.set(
    HW + 0.15,
    sillH,
    zB + lB / 4 - winW / 2  // 前一半中心: zB + lB/4
  )
  group.add(w1)

  // C区过道窗 — SE墙，C区前一半居中
  const w2 = createWindow()
  w2.rotation.y = Math.PI / 2
  w2.position.set(
    HW + 0.15,
    sillH,
    zC + lC / 4 - winW / 2  // 前一半中心: zC + lC/4
  )
  group.add(w2)

  // 后窗 — NE墙外表面
  const w3 = createWindow()
  w3.position.set(
    HW / 2 - winW / 2,
    sillH,
    ZONE_OFFSETS.totalLength + 0.075  // 墙外表面
  )
  group.add(w3)

  return group
}
