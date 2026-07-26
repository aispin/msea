import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'
import { createAtticWoodMaterial, createParapetMaterial } from '../materials'

export function createAttic(): THREE.Group {
  const group = new THREE.Group()
  const woodMat = createAtticWoodMaterial()
  const parapetMat = createParapetMaterial()

  const HW = DIMENSIONS.houseWidth
  const zC = ZONE_OFFSETS.zoneCStart
  const lC = DIMENSIONS.zoneC.length
  const floorH = DIMENSIONS.zoneC.atticFloorHeight // 2.15m

  // 阁楼楼板
  const floorGeo = new THREE.BoxGeometry(HW, 0.08, lC)
  const floor = new THREE.Mesh(floorGeo, woodMat)
  floor.position.set(HW / 2, floorH, zC + lC / 2)
  floor.castShadow = true
  floor.receiveShadow = true
  group.add(floor)

  // 支柱 (4根)
  const pillarR = DIMENSIONS.attic.pillarRadius
  const pillarGeo = new THREE.CylinderGeometry(pillarR, pillarR, floorH, 8)
  const pillarPositions: [number, number, number][] = [
    [0.15, floorH / 2, zC + 0.15],
    [HW - 0.15, floorH / 2, zC + 0.15],
    [0.15, floorH / 2, zC + lC - 0.15],
    [HW - 0.15, floorH / 2, zC + lC - 0.15],
  ]
  for (const [px, py, pz] of pillarPositions) {
    const pillar = new THREE.Mesh(pillarGeo, woodMat)
    pillar.position.set(px, py, pz)
    pillar.castShadow = true
    group.add(pillar)
  }

  // 爬梯 (B区SE墙内侧)
  const ladderW = DIMENSIONS.attic.ladderWidth        // 0.4m
  const rungCount = DIMENSIONS.attic.ladderRungCount   // 8
  const rungSpacing = floorH / (rungCount + 1)
  const sideRailGeo = new THREE.BoxGeometry(0.04, floorH, 0.04)
  const rungGeo = new THREE.BoxGeometry(ladderW, 0.03, 0.04)
  // 左轨
  const leftRail = new THREE.Mesh(sideRailGeo, woodMat)
  leftRail.position.set(HW - 0.2, floorH / 2, zC + lC / 2)
  group.add(leftRail)
  // 右轨
  const rightRail = new THREE.Mesh(sideRailGeo, woodMat)
  rightRail.position.set(HW - 0.2 + ladderW, floorH / 2, zC + lC / 2)
  group.add(rightRail)
  // 横档
  for (let i = 1; i <= rungCount; i++) {
    const rung = new THREE.Mesh(rungGeo, woodMat)
    rung.position.set(HW - 0.2 + ladderW / 2, i * rungSpacing, zC + lC / 2)
    group.add(rung)
  }

  // A区天台围栏 (女儿墙，高0.9m)
  const lA = DIMENSIONS.zoneA.length
  const parapetH = DIMENSIONS.zoneA.parapetHeight
  const parapetT = 0.1
  const wallH = DIMENSIONS.zoneA.wallHeight
  const parapetY = wallH + parapetH / 2

  // NW侧围栏
  const nwParapet = new THREE.Mesh(
    new THREE.BoxGeometry(parapetT, parapetH, lA),
    parapetMat
  )
  nwParapet.position.set(0, parapetY, lA / 2)
  group.add(nwParapet)

  // SE侧围栏
  const seParapet = new THREE.Mesh(
    new THREE.BoxGeometry(parapetT, parapetH, lA),
    parapetMat
  )
  seParapet.position.set(HW, parapetY, lA / 2)
  group.add(seParapet)

  // SW侧围栏 (正面，有缺口对应门上方? 不——门在墙上，围栏在顶部)
  const swParapet = new THREE.Mesh(
    new THREE.BoxGeometry(HW, parapetH, parapetT),
    parapetMat
  )
  swParapet.position.set(HW / 2, parapetY, 0)
  group.add(swParapet)

  // NE侧围栏 (与B区共墙上方)
  const neParapet = new THREE.Mesh(
    new THREE.BoxGeometry(HW, parapetH, parapetT),
    parapetMat
  )
  neParapet.position.set(HW / 2, parapetY, lA)
  group.add(neParapet)

  return group
}
