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

  // 双坡屋顶 — 两个倾斜平面
  // 三角形截面: (0,0) → (HW/2, triH) → (HW, 0)
  // 使用 ExtrudeGeometry
  const shape = new THREE.Shape()
  shape.moveTo(-overhang, 0)
  shape.lineTo(HW / 2, triH)
  shape.lineTo(HW + overhang, 0)
  shape.lineTo(HW + overhang, -0.1) // 厚度底座
  shape.lineTo(-overhang, -0.1)
  shape.closePath()

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: roofLen,
    bevelEnabled: false,
  }
  const roofGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  // Extrude沿Z轴; 屋顶截面在XY平面
  const roofMesh = new THREE.Mesh(roofGeo, roofMat)
  roofMesh.position.set(0, eaveH, zStart)
  roofMesh.castShadow = true
  roofMesh.receiveShadow = true
  group.add(roofMesh)

  // 屋檐底部封板 (防止从下方看到空洞)
  // 简单做法: 在檐口高度放一个平面覆盖B+C区域
  const ceilingGeo = new THREE.PlaneGeometry(HW, roofLen)
  const ceiling = new THREE.Mesh(ceilingGeo, wallMat)
  ceiling.rotation.x = -Math.PI / 2
  ceiling.position.set(HW / 2, eaveH, zStart + roofLen / 2)
  group.add(ceiling)

  // 山墙 — SW侧 (在B区SW端，三角封顶)
  const gableShape = new THREE.Shape()
  gableShape.moveTo(0, 0)
  gableShape.lineTo(HW / 2, triH)
  gableShape.lineTo(HW, 0)
  gableShape.closePath()
  const gableGeo = new THREE.ShapeGeometry(gableShape)
  const gableSW = new THREE.Mesh(gableGeo, wallMat)
  gableSW.position.set(0, eaveH, zStart)
  group.add(gableSW)

  // 山墙 — NE侧 (在C区NE端)
  const gableNE = new THREE.Mesh(gableGeo, wallMat)
  gableNE.position.set(0, eaveH, zStart + roofLen)
  group.add(gableNE)

  return group
}
