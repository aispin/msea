import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'
import { createRoofMaterial, createWallMaterial } from '../materials'

export function createRoof(): THREE.Group {
  const group = new THREE.Group()
  const roofMat = createRoofMaterial()
  const wallMat = createWallMaterial()

  const HW = DIMENSIONS.houseWidth
  const eaveH = DIMENSIONS.roof.eaveHeight
  const ridgeH = DIMENSIONS.roof.ridgeHeight
  const roofLen = DIMENSIONS.roof.totalLength
  const overhang = DIMENSIONS.roof.overhang
  const zStart = ZONE_OFFSETS.zoneBStart
  const triH = ridgeH - eaveH // 1.85m

  // 双坡屋顶 — 脊沿X轴(NW→SE)，坡面朝向SW和NE(前后)
  // 三角形截面在ZY平面：(z=0, y=0) → (z=roofLen/2, y=triH) → (z=roofLen, y=0)
  const shape = new THREE.Shape()
  shape.moveTo(-overhang, 0)               // SW檐口(含出挑)
  shape.lineTo(roofLen / 2, triH)           // 屋脊
  shape.lineTo(roofLen + overhang, 0)       // NE檐口(含出挑)
  shape.lineTo(roofLen + overhang, -0.1)    // 底部
  shape.lineTo(-overhang, -0.1)
  shape.closePath()

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: HW,
    bevelEnabled: false,
  }
  const roofGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  // 截面在ZY平面，沿X轴挤出
  const roofMesh = new THREE.Mesh(roofGeo, roofMat)
  roofMesh.position.set(0, eaveH, zStart - overhang)
  roofMesh.castShadow = true
  roofMesh.receiveShadow = true
  group.add(roofMesh)

  // 屋檐底部封板 (B+C区域)
  const ceilingGeo = new THREE.PlaneGeometry(HW, roofLen)
  const ceiling = new THREE.Mesh(ceilingGeo, wallMat)
  ceiling.rotation.x = -Math.PI / 2
  ceiling.position.set(HW / 2, eaveH, zStart + roofLen / 2)
  group.add(ceiling)

  // 山墙 — NW侧 (X=0)
  const gableShape = new THREE.Shape()
  gableShape.moveTo(0, 0)
  gableShape.lineTo(roofLen / 2, triH)
  gableShape.lineTo(roofLen, 0)
  gableShape.closePath()
  const gableGeo = new THREE.ShapeGeometry(gableShape)
  const gableNW = new THREE.Mesh(gableGeo, wallMat)
  gableNW.rotation.y = -Math.PI / 2
  gableNW.position.set(0, eaveH, zStart)
  group.add(gableNW)

  // 山墙 — SE侧 (X=HW)
  const gableSE = new THREE.Mesh(gableGeo, wallMat)
  gableSE.rotation.y = -Math.PI / 2
  gableSE.position.set(HW, eaveH, zStart)
  group.add(gableSE)

  return group
}
