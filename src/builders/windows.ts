import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'
import { createWoodMaterial, createGlassMaterial } from '../materials'

export function createWindow(): THREE.Group {
  const group = new THREE.Group()
  const woodMat = createWoodMaterial()
  const glassMat = createGlassMaterial()

  const winW = DIMENSIONS.window.width
  const winH = DIMENSIONS.window.height
  const frameT = DIMENSIONS.window.frameThickness
  const bars = DIMENSIONS.window.latticeBars

  const glassGeo = new THREE.PlaneGeometry(winW - frameT * 2, winH - frameT * 2)
  const glass = new THREE.Mesh(glassGeo, glassMat)
  glass.position.set(winW / 2, winH / 2, 0.01)
  group.add(glass)

  const hBarGeo = new THREE.BoxGeometry(winW, frameT, frameT * 1.5)
  const vBarGeo = new THREE.BoxGeometry(frameT, winH, frameT * 1.5)
  const top = new THREE.Mesh(hBarGeo, woodMat); top.position.set(winW / 2, winH - frameT / 2, frameT / 2); group.add(top)
  const bot = new THREE.Mesh(hBarGeo, woodMat); bot.position.set(winW / 2, frameT / 2, frameT / 2); group.add(bot)
  const lef = new THREE.Mesh(vBarGeo, woodMat); lef.position.set(frameT / 2, winH / 2, frameT / 2); group.add(lef)
  const rig = new THREE.Mesh(vBarGeo, woodMat); rig.position.set(winW - frameT / 2, winH / 2, frameT / 2); group.add(rig)

  const barGeo = new THREE.BoxGeometry(frameT * 0.6, winH - frameT * 2, frameT * 1.2)
  for (let i = 1; i <= bars; i++) {
    const bar = new THREE.Mesh(barGeo, woodMat)
    bar.position.set(frameT + (i / (bars + 1)) * (winW - frameT * 2), winH / 2, frameT / 2)
    group.add(bar)
  }
  const crossBarGeo = new THREE.BoxGeometry(winW - frameT * 2, frameT * 0.5, frameT * 1.2)
  const crossBar = new THREE.Mesh(crossBarGeo, woodMat)
  crossBar.position.set(winW / 2, winH / 2, frameT / 2)
  group.add(crossBar)

  return group
}

export function createAllWindows(): THREE.Group {
  const group = new THREE.Group()

  const winW = DIMENSIONS.window.width
  const sillH = DIMENSIONS.window.sillHeight
  const WL = 0.15
  const totalX = WL + DIMENSIONS.houseWidth + WL
  const zB = ZONE_OFFSETS.zoneBStart
  const zC = ZONE_OFFSETS.zoneCStart
  const zEnd = ZONE_OFFSETS.totalLength
  const lB = DIMENSIONS.zoneB.length
  const lC = DIMENSIONS.zoneC.length

  // B+C视为一整面墙，均分两半，每半居中放一窗
  // rotation.y=π/2 → local X→world -Z, position.z是右边界, 窗中心=position.z-winW/2
  const totalBC = lB + lC
  const w1 = createWindow()
  w1.rotation.y = Math.PI / 2
  w1.position.set(totalX + 0.01, sillH, zB + totalBC / 4 + winW / 2)
  group.add(w1)

  const w2 = createWindow()
  w2.rotation.y = Math.PI / 2
  w2.position.set(totalX + 0.01, sillH, zB + 3 * totalBC / 4 + winW / 2)
  group.add(w2)

  // 后窗 — NE墙外表面
  const w3 = createWindow()
  w3.position.set(totalX / 2 - winW / 2, sillH, zEnd - WL / 2 + 0.01)
  group.add(w3)

  return group
}
