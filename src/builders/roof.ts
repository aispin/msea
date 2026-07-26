import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'
import { createRoofMaterial, createWallMaterial } from '../materials'

/**
 * 屋顶几何逻辑
 * ============
 * 单坡斜率: triH / (roofLen/2) → roofAngle = atan2(triH, roofLen/2)
 *   triH = ridgeH - eaveH = 5.0 - 3.15 = 1.85m
 *   roofLen = B+C 内净总长 = 5.55m, 半跨 = 2.775m
 *   roofAngle ≈ 33.7°
 *
 * 瓦片(外层): 覆盖含挑檐的完整屋顶
 *   Z跨度 = roofLenWithOverhang = roofLen + 2*overhang + WL ≈ 5.86m
 *   坡面实长 = sqrt(halfTile² + triH²)
 *
 * 椽条(内层): 墙到墙, 搁在A-B墙和NE墙上
 *   水平跨度 = roofLen/2 = 2.775m (内净半跨)
 *   坡面实长 = sqrt((roofLen/2)² + triH²) ≈ 3.33m
 *   中心Y = tileBottomY - rafterHalfH*cos(roofAngle)
 *          = (eaveH + triH/2 - TILE_THICK) - 0.05*cos(roofAngle)
 *   椽条顶面紧贴瓦片底面
 */

export function createRoof(): THREE.Group {
  const group = new THREE.Group()
  const roofMat = createRoofMaterial()
  const wallMat = createWallMaterial()

  const WL = 0.15
  const HW = DIMENSIONS.houseWidth
  const totalX = WL + HW + WL                    // 建筑总宽 2.86m
  const eaveH = DIMENSIONS.roof.eaveHeight       // 3.15m
  const ridgeH = DIMENSIONS.roof.ridgeHeight     // 5.0m
  const overhang = DIMENSIONS.roof.overhang      // 0.08m
  const sideOverhang = WL / 2 + 0.08             // 侧边出挑
  const roofWidth = totalX + sideOverhang * 2    // 瓦片总宽
  const roofLen = DIMENSIONS.roof.totalLength    // 5.55m (B+C内净)
  const zStart = ZONE_OFFSETS.zoneBStart         // 3.20m (B区起始)
  const triH = ridgeH - eaveH                    // 1.85m

  // 屋顶斜率 — 由内净尺寸决定, 瓦片和椽条共用
  const roofAngle = Math.atan2(triH, roofLen / 2)
  const TILE_THICK = 0.03

  // ─── 瓦片 (外层, 含出挑) ─────────────────────────
  const roofLenWithOverhang = roofLen + 2 * overhang + WL
  const halfTile = roofLenWithOverhang / 2              // 瓦片半跨 ~2.93m
  const tileBaseZ = zStart - WL / 2 - overhang           // 前檐口Z ~3.045m
  const ridgeZ = tileBaseZ + halfTile                     // 屋脊Z ~5.975m
  const tileTopY = eaveH + triH / 2                       // 瓦片上表面中点Y

  roofMat.side = THREE.DoubleSide

  function makeTile(x0: number, z0: number, y0: number, zR: number): THREE.Mesh {
    const hw = roofWidth / 2
    const geo = new THREE.BufferGeometry()
    // 8顶点: 上层4 + 下层4(偏移 -TILE_THICK)
    const verts = new Float32Array([
      x0 - hw, y0, z0,             x0 + hw, y0, z0,
      x0 - hw, ridgeH, zR,         x0 + hw, ridgeH, zR,
      x0 - hw, y0 - TILE_THICK, z0, x0 + hw, y0 - TILE_THICK, z0,
      x0 - hw, ridgeH - TILE_THICK, zR, x0 + hw, ridgeH - TILE_THICK, zR,
    ])
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    geo.setIndex([
      0,2,1, 1,2,3,  4,5,6, 5,7,6,  // 上+下面
      0,4,2, 2,4,6,  1,3,5, 3,7,5,  // 左右侧面
      0,1,4, 1,5,4,  2,6,3, 3,6,7,  // 前后侧面
    ])
    geo.computeVertexNormals()
    const m = new THREE.Mesh(geo, roofMat)
    m.castShadow = true
    return m
  }

  group.add(makeTile(totalX / 2, tileBaseZ, eaveH, ridgeZ))                    // 前坡
  group.add(makeTile(totalX / 2, tileBaseZ + roofLenWithOverhang, eaveH, ridgeZ)) // 后坡

  // ─── 椽条 (内层, 墙到墙) ─────────────────────────
  const interiorW = HW
  const halfRafter = roofLen / 2                                     // 内净半跨 2.775m
  const rafterSlopeLen = Math.sqrt(halfRafter ** 2 + triH ** 2)     // 坡面实长 ~3.33m
  const rafterHalfH = 0.05                                           // 截面高10cm → 半高5cm
  // 椽条顶面 = 瓦片底面 → midY = tileBottom - rafterHalfH*cos(angle)
  const tileBottomY = tileTopY - TILE_THICK
  const rafterMidY = tileBottomY - rafterHalfH * Math.cos(roofAngle)
  const rafterMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.7 })
  const rafterCount = Math.ceil(interiorW / 0.4)
  const rafterGeo = new THREE.BoxGeometry(0.06, 0.10, rafterSlopeLen)

  for (let i = 0; i <= rafterCount; i++) {
    const rx = WL + (i / rafterCount) * interiorW
    // 前坡 — 搁在A-B墙(zStart)到屋脊(zStart+halfRafter)
    const rf = new THREE.Mesh(rafterGeo, rafterMat)
    rf.rotation.set(-roofAngle, 0, 0)
    rf.position.set(rx, rafterMidY, zStart + halfRafter / 2)
    group.add(rf)
    // 后坡 — 搁在屋脊到NE墙(zStart+roofLen)
    const rb = new THREE.Mesh(rafterGeo, rafterMat)
    rb.rotation.set(roofAngle, 0, 0)
    rb.position.set(rx, rafterMidY, zStart + halfRafter + halfRafter / 2)
    group.add(rb)
  }

  // ─── 山墙 ─────────────────────────────────────────
  const gableShape = new THREE.Shape()
  gableShape.moveTo(0, 0)
  gableShape.lineTo(roofLenWithOverhang / 2, triH)
  gableShape.lineTo(roofLenWithOverhang, 0)
  gableShape.closePath()
  const gableGeo = new THREE.ShapeGeometry(gableShape)

  const gableNW = new THREE.Mesh(gableGeo, wallMat)
  gableNW.rotation.y = -Math.PI / 2
  gableNW.position.set(-sideOverhang, eaveH, tileBaseZ)
  group.add(gableNW)

  const gableSE = new THREE.Mesh(gableGeo, wallMat)
  gableSE.rotation.y = -Math.PI / 2
  gableSE.position.set(totalX + sideOverhang, eaveH, tileBaseZ)
  group.add(gableSE)

  return group
}
