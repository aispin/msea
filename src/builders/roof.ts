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
  const roofLen = DIMENSIONS.roof.totalLength  // 5.55m, B+C沿Z轴
  const overhang = DIMENSIONS.roof.overhang     // 0.2m
  const zStart = ZONE_OFFSETS.zoneBStart        // 2.9
  const triH = ridgeH - eaveH                    // 1.85m

  // 三角形截面（ZY平面→世界Z=shapeX, 世界Y=shapeY, 沿X挤出=世界X）
  // 坡面朝前(SW)和后(NE)，脊沿X轴(NW→SE)
  const roofLenWithOverhang = roofLen + 2 * overhang
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)                                  // SW檐口
  shape.lineTo(roofLenWithOverhang / 2, triH)          // 屋脊
  shape.lineTo(roofLenWithOverhang, 0)                  // NE檐口
  shape.lineTo(roofLenWithOverhang, -0.1)               // 底部
  shape.lineTo(0, -0.1)
  shape.closePath()

  const roofGeo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: HW,
    bevelEnabled: false,
  })
  const roofMesh = new THREE.Mesh(roofGeo, roofMat)
  // 旋转: shape的X→世界Z, shape的Y→世界Y, 挤出Z→世界X
  roofMesh.rotation.y = -Math.PI / 2
  roofMesh.position.set(HW, eaveH, zStart - overhang)
  roofMesh.castShadow = true
  roofMesh.receiveShadow = true
  group.add(roofMesh)

  // B+C 天花板封板
  const ceilingGeo = new THREE.PlaneGeometry(HW, roofLen)
  const ceiling = new THREE.Mesh(ceilingGeo, wallMat)
  ceiling.rotation.x = -Math.PI / 2
  ceiling.position.set(HW / 2, eaveH, zStart + roofLen / 2)
  group.add(ceiling)

  // 山墙 — NW侧(X=0) 和 SE侧(X=HW)
  const gableShape = new THREE.Shape()
  gableShape.moveTo(0, 0)
  gableShape.lineTo(roofLenWithOverhang / 2, triH)
  gableShape.lineTo(roofLenWithOverhang, 0)
  gableShape.closePath()
  const gableGeo = new THREE.ShapeGeometry(gableShape)

  // NW山墙，面朝-X
  const gableNW = new THREE.Mesh(gableGeo, wallMat)
  gableNW.rotation.y = -Math.PI / 2
  gableNW.position.set(0, eaveH, zStart - overhang)
  group.add(gableNW)

  // SE山墙，面朝+X
  const gableSE = new THREE.Mesh(gableGeo, wallMat)
  gableSE.rotation.y = -Math.PI / 2
  gableSE.position.set(HW, eaveH, zStart - overhang)
  group.add(gableSE)

  return group
}
