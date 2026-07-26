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

  // 室内天花板 — 两坡面（从屋内看屋顶内侧）
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0xf5f0e8, roughness: 0.85, side: THREE.DoubleSide,
  })
  const slopeLen = Math.sqrt((roofLen / 2) ** 2 + triH ** 2)  // 坡面斜长
  const slopeAngle = Math.atan2(triH, roofLen / 2)            // 坡面仰角
  const interiorW = HW - 0.05  // 略窄于内宽，嵌入墙内

  // 前坡（SW侧）
  const frontSlope = new THREE.Mesh(
    new THREE.PlaneGeometry(interiorW, slopeLen), interiorMat
  )
  frontSlope.rotation.set(-slopeAngle, 0, 0)
  frontSlope.position.set(totalX / 2, eaveH, zStart + roofLen / 4)
  group.add(frontSlope)

  // 后坡（NE侧）
  const backSlope = new THREE.Mesh(
    new THREE.PlaneGeometry(interiorW, slopeLen), interiorMat
  )
  backSlope.rotation.set(slopeAngle, 0, 0)
  backSlope.position.set(totalX / 2, eaveH, zStart + 3 * roofLen / 4)
  group.add(backSlope)

  // 屋脊横梁
  const ridgeBeam = new THREE.Mesh(
    new THREE.BoxGeometry(interiorW, 0.08, 0.1), roofMat
  )
  ridgeBeam.position.set(totalX / 2, ridgeH - 0.04, zStart + roofLen / 2)
  group.add(ridgeBeam)

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
