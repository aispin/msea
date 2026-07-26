import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS, COLORS } from '../config/house'
import { createGroundMaterial, createTranslucentMaterial } from '../materials'

export function createEnvironment(): THREE.Group {
  const group = new THREE.Group()

  const WL = 0.15
  const HW = DIMENSIONS.houseWidth
  const totalX = WL + HW + WL
  const totalLen = ZONE_OFFSETS.totalLength
  const margin = DIMENSIONS.ground.margin
  const aisleW = DIMENSIONS.aisle.width

  const courtyardMat = createGroundMaterial(COLORS.courtyard)
  const groundW = totalX + margin * 2 + aisleW
  const groundL = totalLen + margin * 2
  const groundGeo = new THREE.PlaneGeometry(groundW, groundL)
  const ground = new THREE.Mesh(groundGeo, courtyardMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(totalX / 2 - aisleW / 2, -0.01, totalLen / 2)
  ground.receiveShadow = true
  group.add(ground)

  const aisleMat = createGroundMaterial(COLORS.aisle)
  const aisleGeo = new THREE.PlaneGeometry(aisleW, totalLen + margin * 2)
  const aisle = new THREE.Mesh(aisleGeo, aisleMat)
  aisle.rotation.x = -Math.PI / 2
  aisle.position.set(totalX + margin / 2, 0, totalLen / 2)
  aisle.receiveShadow = true
  group.add(aisle)

  const neighborMat = createTranslucentMaterial(COLORS.neighbor, 0.3)
  const neighborW = DIMENSIONS.neighbor.width
  const neighborH = DIMENSIONS.neighbor.height
  const neighborLen = DIMENSIONS.neighbor.length
  const neighborGeo = new THREE.BoxGeometry(neighborW, neighborH, neighborLen)
  const neighbor = new THREE.Mesh(neighborGeo, neighborMat)
  const gap = DIMENSIONS.neighbor.gap
  neighbor.position.set(
    -(gap + neighborW / 2),
    neighborH / 2,
    totalLen / 2
  )
  neighbor.castShadow = true
  group.add(neighbor)

  return group
}
