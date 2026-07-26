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

  // ─── 自下而上建造: 椽条定义坡度 → 瓦片继承 ──────
  const rafterHalfH = 0.05
  const rafterDY = rafterHalfH * Math.cos(roofAngle)
  const wallTopY = eaveH
  const rafterTopAtWall = wallTopY + 2 * rafterDY  // 墙顶处椽条顶面Y

  // 外墙位置
  const frontWallExt = zStart - WL / 2
  const backWallExt  = zStart + roofLen + WL

  // 1) 椽条 — 搭墙头5cm, ridge取两面外墙中点, 对称
  const interiorW = HW
  const wallInset = 0.05
  const rafterStartZ = frontWallExt + wallInset
  const rafterEndZ   = backWallExt  - wallInset
  const rafterRidgeZ = (frontWallExt + backWallExt) / 2       // 屋脊在两面外墙中点
  const rafterTopAtRidge = rafterTopAtWall + (rafterRidgeZ - rafterStartZ) * Math.tan(roofAngle)

  const rafterSlopeLen = Math.sqrt((rafterRidgeZ - rafterStartZ) ** 2 + (rafterTopAtRidge - rafterTopAtWall) ** 2)
  const rafterMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.7 })
  const rafterCount = Math.ceil(interiorW / 0.4)
  const rafterGeo = new THREE.BoxGeometry(0.06, 0.10, rafterSlopeLen)

  for (let i = 0; i <= rafterCount; i++) {
    const rx = WL + (i / rafterCount) * interiorW
    const rf = new THREE.Mesh(rafterGeo, rafterMat)
    rf.rotation.set(-roofAngle, 0, 0)
    const rfCZ = rafterStartZ + (rafterRidgeZ - rafterStartZ) / 2
    const rfCY = wallTopY + rafterDY + (rfCZ - rafterStartZ) * Math.tan(roofAngle)
    rf.position.set(rx, rfCY, rfCZ)
    group.add(rf)

    const rb = new THREE.Mesh(rafterGeo, rafterMat)
    rb.rotation.set(roofAngle, 0, 0)
    const rbCZ = rafterRidgeZ + (rafterEndZ - rafterRidgeZ) / 2
    const rbCY = wallTopY + rafterDY + (rafterEndZ - rbCZ) * Math.tan(roofAngle)
    rb.position.set(rx, rbCY, rbCZ)
    group.add(rb)
  }

  // 2) 瓦片 — 搭在椽条上方, 同坡度
  const tileBaseZ = frontWallExt
  const tileBackZ = backWallExt + overhang
  const tileRidgeZ = rafterRidgeZ                            // 瓦片屋脊与椽条对齐
  const tileRidgeTop = rafterTopAtRidge + TILE_THICK
  const tileRidgeBot = rafterTopAtRidge

  const frontEaveTop = rafterTopAtWall + TILE_THICK - (rafterStartZ - tileBaseZ) * Math.tan(roofAngle)
  const backEaveTop  = rafterTopAtWall + TILE_THICK - (tileBackZ - rafterEndZ)  * Math.tan(roofAngle)

  // makeTile + 组装
  roofMat.side = THREE.DoubleSide
  const halfTileLen = tileRidgeZ - tileBaseZ
  function makeTile(x0: number, z0: number, y0: number, zR: number): THREE.Mesh {
    const hw = roofWidth / 2
    const geo = new THREE.BufferGeometry()
    const verts = new Float32Array([
      x0 - hw, y0, z0,              x0 + hw, y0, z0,
      x0 - hw, tileRidgeTop, zR,    x0 + hw, tileRidgeTop, zR,
      x0 - hw, y0 - TILE_THICK, z0, x0 + hw, y0 - TILE_THICK, z0,
      x0 - hw, tileRidgeBot, zR,    x0 + hw, tileRidgeBot, zR,
    ])
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    geo.setIndex([
      0,2,1, 1,2,3,  4,5,6, 5,7,6,
      0,4,2, 2,4,6,  1,3,5, 3,7,5,
      0,1,4, 1,5,4,  2,6,3, 3,6,7,
    ])
    geo.computeVertexNormals()
    const m = new THREE.Mesh(geo, roofMat)
    m.castShadow = true
    return m
  }

  group.add(makeTile(totalX / 2, tileBaseZ, frontEaveTop, tileRidgeZ))
  group.add(makeTile(totalX / 2, tileBackZ, backEaveTop, tileRidgeZ))

  // ─── 山墙 (根据实际瓦片顶点) ──────────────────────
  const gableShape = new THREE.Shape()
  gableShape.moveTo(0, frontEaveTop - eaveH)
  gableShape.lineTo(tileRidgeZ - tileBaseZ, tileRidgeTop - eaveH)
  gableShape.lineTo(tileBackZ - tileBaseZ, backEaveTop - eaveH)
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
