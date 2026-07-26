import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'
import { createRoofMaterial, createWallMaterial } from '../materials'

export function createRoof(): THREE.Group {
  const group = new THREE.Group()
  const roofMat = createRoofMaterial()
  const wallMat = createWallMaterial()

  const WL = 0.15
  const HW = DIMENSIONS.houseWidth
  const totalX = WL + HW + WL
  const eaveH = DIMENSIONS.roof.eaveHeight
  const ridgeH = DIMENSIONS.roof.ridgeHeight
  const overhang = DIMENSIONS.roof.overhang
  const sideOverhang = WL / 2 + 0.08
  const roofWidth = totalX + sideOverhang * 2  // 含侧边出挑
  const roofLen = DIMENSIONS.roof.totalLength  // 5.55 (B+C内净)
  const zStart = ZONE_OFFSETS.zoneBStart       // B区起始
  const triH = ridgeH - eaveH

  const roofLenWithOverhang = roofLen + 2 * overhang + WL
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.lineTo(roofLenWithOverhang / 2, triH)
  shape.lineTo(roofLenWithOverhang, 0)
  shape.lineTo(roofLenWithOverhang, -0.1)
  shape.lineTo(0, -0.1)
  shape.closePath()

  const roofGeo = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: roofWidth, bevelEnabled: false })
  const roofMesh = new THREE.Mesh(roofGeo, roofMat)
  roofMesh.rotation.y = -Math.PI / 2
  roofMesh.position.set(totalX + sideOverhang, eaveH, zStart - WL / 2 - overhang)
  roofMesh.castShadow = true
  roofMesh.receiveShadow = true
  group.add(roofMesh)

  const ceilingGeo = new THREE.PlaneGeometry(roofWidth, roofLen)
  const ceiling = new THREE.Mesh(ceilingGeo, wallMat)
  ceiling.rotation.x = -Math.PI / 2
  ceiling.position.set(totalX / 2, eaveH, zStart + roofLen / 2)
  group.add(ceiling)

  const gableShape = new THREE.Shape()
  gableShape.moveTo(0, 0)
  gableShape.lineTo(roofLenWithOverhang / 2, triH)
  gableShape.lineTo(roofLenWithOverhang, 0)
  gableShape.closePath()
  const gableGeo = new THREE.ShapeGeometry(gableShape)

  const gableNW = new THREE.Mesh(gableGeo, wallMat)
  gableNW.rotation.y = -Math.PI / 2
  gableNW.position.set(-sideOverhang, eaveH, zStart - WL / 2 - overhang)
  group.add(gableNW)

  const gableSE = new THREE.Mesh(gableGeo, wallMat)
  gableSE.rotation.y = -Math.PI / 2
  gableSE.position.set(totalX + sideOverhang, eaveH, zStart - WL / 2 - overhang)
  group.add(gableSE)

  return group
}
