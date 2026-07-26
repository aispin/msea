import * as THREE from 'three'
import { DIMENSIONS, COLORS } from '../config/house'
import { createWoodMaterial } from '../materials'

export function createDoor(): THREE.Group {
  const group = new THREE.Group()
  const woodMat = createWoodMaterial()
  const metalMat = new THREE.MeshStandardMaterial({
    color: COLORS.doorRing,
    roughness: 0.3,
    metalness: 0.9,
  })

  const doorW = DIMENSIONS.door.width    // 1.0m total
  const doorH = DIMENSIONS.door.height    // 2.1m
  const doorT = DIMENSIONS.door.thickness // 0.08m
  const halfW = doorW / 2                 // 0.5m per leaf

  const HW = DIMENSIONS.houseWidth
  const doorCenterX = HW / 2 // 门在SW墙正中

  // 左扇门
  const leftGeo = new THREE.BoxGeometry(halfW - 0.01, doorH, doorT)
  const leftDoor = new THREE.Mesh(leftGeo, woodMat)
  leftDoor.position.set(doorCenterX - halfW / 2, doorH / 2, doorT / 2)
  leftDoor.castShadow = true
  group.add(leftDoor)

  // 右扇门
  const rightGeo = new THREE.BoxGeometry(halfW - 0.01, doorH, doorT)
  const rightDoor = new THREE.Mesh(rightGeo, woodMat)
  rightDoor.position.set(doorCenterX + halfW / 2, doorH / 2, doorT / 2)
  rightDoor.castShadow = true
  group.add(rightDoor)

  // 门框
  const frameThick = 0.06
  const frameDepth = 0.12
  // 上框
  const topFrameGeo = new THREE.BoxGeometry(doorW + frameThick * 2, frameThick, frameDepth)
  const topFrame = new THREE.Mesh(topFrameGeo, woodMat)
  topFrame.position.set(doorCenterX, doorH + frameThick / 2, doorT / 2)
  group.add(topFrame)
  // 左框
  const sideFrameGeo = new THREE.BoxGeometry(frameThick, doorH, frameDepth)
  const leftFrame = new THREE.Mesh(sideFrameGeo, woodMat)
  leftFrame.position.set(doorCenterX - doorW / 2 - frameThick / 2, doorH / 2, doorT / 2)
  group.add(leftFrame)
  // 右框
  const rightFrame = new THREE.Mesh(sideFrameGeo, woodMat)
  rightFrame.position.set(doorCenterX + doorW / 2 + frameThick / 2, doorH / 2, doorT / 2)
  group.add(rightFrame)

  // 门锁 — 金属底座+门环
  const baseGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16)
  const ringGeo = new THREE.TorusGeometry(0.022, 0.006, 8, 16)

  for (const side of [-1, 1]) {
    const lx = doorCenterX + side * halfW * 0.55
    const ly = doorH * 0.55
    const lz = doorT / 2 + 0.005  // 5mm突出避免z-fighting

    const base = new THREE.Mesh(baseGeo, metalMat)
    base.rotation.x = Math.PI / 2
    base.position.set(lx, ly, lz)
    base.renderOrder = 1
    group.add(base)

    const ring = new THREE.Mesh(ringGeo, metalMat)
    ring.position.set(lx, ly - 0.03, lz)
    ring.renderOrder = 1
    group.add(ring)
  }

  // 门放置在 SW墙 z=0 处
  group.position.set(0, 0, 0)

  return group
}
