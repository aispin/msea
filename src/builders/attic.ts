import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'
import { createAtticWoodMaterial, createParapetMaterial } from '../materials'

export function createAttic(): THREE.Group {
  const group = new THREE.Group()
  const woodMat = createAtticWoodMaterial()
  const parapetMat = createParapetMaterial()

  const WL = 0.15
  const HW = DIMENSIONS.houseWidth
  const totalX = WL + HW + WL
  const zC = ZONE_OFFSETS.zoneCStart
  const lC = DIMENSIONS.zoneC.length
  const floorH = DIMENSIONS.zoneC.atticFloorHeight

  // 阁楼楼板
  const floorGeo = new THREE.BoxGeometry(HW, 0.08, lC)
  const floor = new THREE.Mesh(floorGeo, woodMat)
  floor.position.set(totalX / 2, floorH, zC + lC / 2)
  floor.castShadow = true
  floor.receiveShadow = true
  group.add(floor)

  // 横梁 — 4根，支撑阁楼楼板
  const beamGeo = new THREE.BoxGeometry(HW - 0.2, 0.06, 0.1)
  const beamPositions: [number, number, number][] = [
    [WL + HW / 2, floorH, zC + 0.3],
    [WL + HW / 2, floorH, zC + lC / 2],
    [WL + HW / 2, floorH, zC + lC - 0.3],
  ]
  for (const [px, py, pz] of beamPositions) {
    const beam = new THREE.Mesh(beamGeo, woodMat)
    beam.position.set(px, py, pz)
    beam.castShadow = true
    group.add(beam)
  }

  // A区天花板 + 天台围栏
  const hA = DIMENSIONS.zoneA.wallHeight
  const lA = DIMENSIONS.zoneA.length
  const zA = ZONE_OFFSETS.zoneAStart
  const zAB = ZONE_OFFSETS.zoneBStart

  // 天花板
  const ceilingGeoA = new THREE.PlaneGeometry(HW + WL, lA + WL)
  const ceilingMatA = createParapetMaterial()
  ceilingMatA.side = THREE.DoubleSide
  const ceilingA = new THREE.Mesh(ceilingGeoA, ceilingMatA)
  ceilingA.rotation.x = -Math.PI / 2
  ceilingA.position.set(totalX / 2, hA, zA + lA / 2)
  ceilingA.receiveShadow = true
  group.add(ceilingA)

  // 女儿墙
  const parapetH = DIMENSIONS.zoneA.parapetHeight
  const parapetT = 0.1
  const parapetY = hA + parapetH / 2
  const extSW = 0  // SW墙外
  const extSE = WL + HW + WL
  // NW/SW/SE/NE 四面围栏
  const nwParapet = new THREE.Mesh(
    new THREE.BoxGeometry(parapetT, parapetH, zAB - extSW), parapetMat
  )
  nwParapet.position.set(extSW + parapetT / 2, parapetY, (extSW + zAB) / 2)
  group.add(nwParapet)

  const seParapet = new THREE.Mesh(
    new THREE.BoxGeometry(parapetT, parapetH, zAB - extSW), parapetMat
  )
  seParapet.position.set(extSE - parapetT / 2, parapetY, (extSW + zAB) / 2)
  group.add(seParapet)

  const swParapet = new THREE.Mesh(
    new THREE.BoxGeometry(extSE - extSW, parapetH, parapetT), parapetMat
  )
  swParapet.position.set((extSW + extSE) / 2, parapetY, extSW + parapetT / 2)
  group.add(swParapet)

  const neParapet = new THREE.Mesh(
    new THREE.BoxGeometry(extSE - extSW, parapetH, parapetT), parapetMat
  )
  neParapet.position.set((extSW + extSE) / 2, parapetY, zAB - parapetT / 2)
  group.add(neParapet)

  return group
}
