import * as THREE from 'three'
import { DIMENSIONS } from '../config/house'
import { createWoodMaterial } from '../materials'

export function createDoor(): THREE.Group {
  const group = new THREE.Group()
  const woodMat = createWoodMaterial()

  const doorW = DIMENSIONS.door.width // 1.0m total
  const doorH = DIMENSIONS.door.height // 2.1m
  const doorT = DIMENSIONS.door.thickness // 0.08m
  const halfW = doorW / 2 // 0.5m per leaf

  const WL = 0.15 // 墙厚
  const totalX = WL + DIMENSIONS.houseWidth + WL // 建筑总宽
  const doorCenterX = totalX / 2 // 门在SW墙正中

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

  // 门锁 — 4组（每扇门里外各一），圆形黑色底座 + 金属门环
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1A1A1A,
    roughness: 0.6,
    metalness: 0.2,
  })
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xC9A96E,
    roughness: 0.3,
    metalness: 0.9,
  })
  const baseGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.012, 16)
  const ringGeo = new THREE.TorusGeometry(0.035, 0.01, 8, 16)

  for (const side of [-1, 1]) {
    const lx = doorCenterX + side * halfW * 0.55
    const ly = doorH * 0.55

    // 外侧（前门面，+Z）
    const outerZ = doorT + 0.005
    const ob = new THREE.Mesh(baseGeo, blackMat)
    ob.rotation.x = Math.PI / 2
    ob.position.set(lx, ly, outerZ)
    group.add(ob)
    const or_ = new THREE.Mesh(ringGeo, ringMat)
    or_.position.set(lx, ly - 0.05, outerZ)
    group.add(or_)

    // 内侧（后门面，-Z）
    const innerZ = -0.005
    const ib = new THREE.Mesh(baseGeo, blackMat)
    ib.rotation.x = -Math.PI / 2
    ib.position.set(lx, ly, innerZ)
    group.add(ib)
    const ir = new THREE.Mesh(ringGeo, ringMat)
    ir.rotation.y = Math.PI
    ir.position.set(lx, ly - 0.05, innerZ)
    group.add(ir)
  }

  // 门放置在 SW墙中心 Z=WL/2 处
  group.position.set(0, 0, WL / 2)

  return group
}
