import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS, COLORS } from '../config/house'
import { createGroundMaterial, createTranslucentMaterial } from '../materials'

export function createEnvironment(): THREE.Group {
  const group = new THREE.Group()

  const HW = DIMENSIONS.houseWidth
  const totalLen = ZONE_OFFSETS.totalLength
  const margin = DIMENSIONS.ground.margin
  const aisleW = DIMENSIONS.aisle.width

  // 庭院地面 (建筑周围灰石板)
  const courtyardMat = createGroundMaterial(COLORS.courtyard)
  const groundW = HW + margin * 2 + aisleW
  const groundL = totalLen + margin * 2
  const groundGeo = new THREE.PlaneGeometry(groundW, groundL)
  const ground = new THREE.Mesh(groundGeo, courtyardMat)
  ground.rotation.x = -Math.PI / 2
  // 地面中心对齐建筑中心
  ground.position.set(HW / 2 - aisleW / 2, -0.01, totalLen / 2)
  ground.receiveShadow = true
  group.add(ground)

  // 过道地面 (西北侧红砖，宽1.5m)
  const aisleMat = createGroundMaterial(COLORS.aisle)
  const aisleGeo = new THREE.PlaneGeometry(aisleW, totalLen + margin * 2)
  const aisle = new THREE.Mesh(aisleGeo, aisleMat)
  aisle.rotation.x = -Math.PI / 2
  aisle.position.set(HW + margin / 2, 0, totalLen / 2)
  aisle.receiveShadow = true
  group.add(aisle)

  // 邻居体块 (东南侧半透明)
  const neighborMat = createTranslucentMaterial(COLORS.neighbor, 0.3)
  const neighborW = DIMENSIONS.neighbor.width
  const neighborH = DIMENSIONS.neighbor.height
  const neighborLen = DIMENSIONS.neighbor.length
  const neighborGeo = new THREE.BoxGeometry(neighborW, neighborH, neighborLen)
  const neighbor = new THREE.Mesh(neighborGeo, neighborMat)
  const gap = DIMENSIONS.neighbor.gap
  neighbor.position.set(
    HW + aisleW + gap + neighborW / 2,
    neighborH / 2,
    totalLen / 2
  )
  neighbor.castShadow = true
  group.add(neighbor)

  return group
}
