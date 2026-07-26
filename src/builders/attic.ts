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

  // A区天花板 + 天台围栏
  const hA = DIMENSIONS.zoneA.wallHeight
  const lA = DIMENSIONS.zoneA.length

  // 天花板 (平顶，在墙体顶部3.15m)
  const ceilingGeoA = new THREE.PlaneGeometry(HW, lA)
  const ceilingA = new THREE.Mesh(ceilingGeoA, createParapetMaterial())
  ceilingA.rotation.x = -Math.PI / 2
  ceilingA.position.set(HW / 2, hA, lA / 2)
  ceilingA.receiveShadow = true
  group.add(ceilingA)

  // 女儿墙 (高0.9m)
  const parapetH = DIMENSIONS.zoneA.parapetHeight
  const parapetT = 0.1
  const parapetY = hA + parapetH / 2

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
