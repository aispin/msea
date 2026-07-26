import * as THREE from 'three'
import { DIMENSIONS } from '../config/house'
import { createWoodMaterial, createDoorRingMaterial } from '../materials'

export function createDoor(): THREE.Group {
  const group = new THREE.Group()
  const woodMat = createWoodMaterial()
  const ringMat = createDoorRingMaterial()

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

  // 门环 — 紧贴门板表面，环平行于门面(XY平面)
  const ringGeo = new THREE.TorusGeometry(0.035, 0.01, 8, 8)
  const ringBaseGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8)
  for (const side of [-1, 1]) {
    const ringX = doorCenterX + side * halfW * 0.55
    const ringY = doorH * 0.55
    const ringZ = doorT / 2 + 0.003  // 紧贴门板
    // 环 — XY平面，从正面可见圆形
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.set(ringX, ringY, ringZ)
    group.add(ring)
    // 底座 — 平贴门板
    const base = new THREE.Mesh(ringBaseGeo, ringMat)
    base.rotation.x = Math.PI / 2  // 圆柱端面朝+Z, 平贴门面
    base.position.set(ringX, ringY - 0.035, ringZ)
    group.add(base)
  }

  // 门放置在 SW墙 z=0 处
  group.position.set(0, 0, 0)

  return group
}
