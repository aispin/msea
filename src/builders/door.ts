import * as THREE from 'three'
import { DIMENSIONS, COLORS } from '../config/house'
import { createWoodMaterial } from '../materials'

export function createDoor(): THREE.Group {
  const group = new THREE.Group()
  const woodMat = createWoodMaterial()
  // 门把手用 BasicMaterial — 无光照，完全固定视觉，不会因高光产生"飘动"错觉
  const pullMat = new THREE.MeshBasicMaterial({ color: COLORS.doorRing })

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

  // 门把手 — 子节点添加到门扇本地空间，与门板绝对固定
  const pullGeo = new THREE.BoxGeometry(0.04, 0.08, 0.015)
  // 左门把手 — 在左门扇本地坐标 (原点在门扇几何中心)
  const pullLeft = new THREE.Mesh(pullGeo, pullMat)
  pullLeft.position.set(-halfW * 0.15, 0, doorT / 2 + 0.007)
  leftDoor.add(pullLeft)
  // 右门把手
  const pullRight = new THREE.Mesh(pullGeo, pullMat)
  pullRight.position.set(halfW * 0.15, 0, doorT / 2 + 0.007)
  rightDoor.add(pullRight)

  // 门放置在 SW墙 z=0 处
  group.position.set(0, 0, 0)

  return group
}
