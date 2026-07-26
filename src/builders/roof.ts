import * as THREE from 'three'
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'
import { createRoofMaterial, createWallMaterial } from '../materials'

/**
 * 屋顶几何 — 以椽条为基准, 所有构件通过函数联动计算
 * ======================================================
 * 椽条顶面与墙顶平齐(eaveH), 实现无缝防水衔接
 * 椽条底面埋入墙内, 长度覆盖整个墙厚
 *
 * 联动关系:
 *   瓦片底面 = 椽条顶面 + TILE_THICK → 瓦片顶面
 *   檩条顶面 = 椽条底面 − purlinH/2 → 檩条中心
 *   墙尖顶边 = 瓦片顶面(随坡度)
 */

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
  const roofWidth = totalX + sideOverhang * 2
  const roofLen = DIMENSIONS.roof.totalLength
  const zStart = ZONE_OFFSETS.zoneBStart
  const triH = ridgeH - eaveH
  const roofAngle = Math.atan2(triH, roofLen / 2)
  const TILE_THICK = 0.03

  // 外墙位置
  const wallAB_SW = zStart - WL / 2
  const wallNE_NE = zStart + roofLen + WL

  // ─── 椽条参数(源头) ─────────────────────────────────
  const rafterHalfH = 0.05
  const rafterDY = rafterHalfH * Math.cos(roofAngle)
  // 椽条顶面与墙顶平齐 → 无缝防水
  const rafterTopAtWall = eaveH
  const rafterCenterAtWall = rafterTopAtWall - rafterDY
  // 椽条覆盖全墙厚(外墙到外墙)
  const rafterStartZ = wallAB_SW
  const rafterEndZ = wallNE_NE
  const ridgeZ = (wallAB_SW + wallNE_NE) / 2
  // ─── 联动函数 ────────────────────────────────────────
  /** 椽条中心Y @ Z */
  function rafterCY(z: number): number {
    if (z <= ridgeZ)
      return rafterCenterAtWall + (z - rafterStartZ) * Math.tan(roofAngle)
    return rafterCenterAtWall + (rafterEndZ - z) * Math.tan(roofAngle)
  }
  /** 椽条顶面Y */
  function rafterTopY(z: number): number { return rafterCY(z) + rafterDY }
  /** 椽条底面Y */
  function rafterBotY(z: number): number { return rafterCY(z) - rafterDY }
  /** 瓦片底面Y */
  function tileBotY(z: number): number { return rafterTopY(z) }
  /** 瓦片顶面Y */
  function tileTopY(z: number): number { return tileBotY(z) + TILE_THICK }
  /** 檩条中心Y */
  function purlinCY(z: number): number { return rafterBotY(z) - 0.05 } // purlinH/2 = 0.05

  // ─── 1) 椽条 ─────────────────────────────────────────
  const interiorW = HW
  const halfRafter = (rafterEndZ - rafterStartZ) / 2
  const rafterLen = Math.sqrt(halfRafter ** 2 + triH ** 2)
  const rafterMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.7 })
  const rafterCount = Math.ceil(interiorW / 0.4)
  const rafterGeo = new THREE.BoxGeometry(0.06, 0.10, rafterLen)

  for (let i = 0; i <= rafterCount; i++) {
    const rx = WL + (i / rafterCount) * interiorW
    // 前坡
    const rf = new THREE.Mesh(rafterGeo, rafterMat)
    rf.rotation.set(-roofAngle, 0, 0)
    const rfCZ = rafterStartZ + halfRafter / 2
    rf.position.set(rx, rafterCY(rfCZ), rfCZ)
    group.add(rf)
    // 后坡
    const rb = new THREE.Mesh(rafterGeo, rafterMat)
    rb.rotation.set(roofAngle, 0, 0)
    const rbCZ = rafterEndZ - halfRafter / 2
    rb.position.set(rx, rafterCY(rbCZ), rbCZ)
    group.add(rb)
  }

  // ─── 2) 檩条 + 屋脊梁 ──────────────────────────────
  const purlinMat = new THREE.MeshStandardMaterial({ color: 0x6B4C1E, roughness: 0.6 })
  const purlinCount = 3
  const frontSpan = ridgeZ - rafterStartZ
  const backSpan = rafterEndZ - ridgeZ
  for (let i = 0; i < purlinCount; i++) {
    const zf = rafterStartZ + ((i + 1) / (purlinCount + 1)) * frontSpan
    const pf = new THREE.Mesh(new THREE.BoxGeometry(interiorW, 0.10, 0.08), purlinMat)
    pf.position.set(totalX / 2, purlinCY(zf), zf)
    group.add(pf)
    const zb = rafterEndZ - ((i + 1) / (purlinCount + 1)) * backSpan
    const pb = new THREE.Mesh(new THREE.BoxGeometry(interiorW, 0.10, 0.08), purlinMat)
    pb.position.set(totalX / 2, purlinCY(zb), zb)
    group.add(pb)
  }
  // 屋脊梁
  const ridgeBottom = rafterBotY(ridgeZ)
  const beam = new THREE.Mesh(new THREE.BoxGeometry(interiorW, 0.18, 0.14), purlinMat)
  beam.position.set(totalX / 2, ridgeBottom - 0.09, ridgeZ)
  group.add(beam)

  // ─── 3) 瓦片 ─────────────────────────────────────────
  const tileBaseZ = wallAB_SW
  const tileBackZ = wallNE_NE + overhang
  const tileRidgeTop = tileTopY(ridgeZ)
  const tileRidgeBot = tileBotY(ridgeZ)
  const frontEaveTop = tileTopY(tileBaseZ)
  const backEaveTop = tileTopY(tileBackZ)

  roofMat.side = THREE.DoubleSide
  function makeTile(x0: number, z0: number, y0: number, zR: number): THREE.Mesh {
    const hw = roofWidth / 2
    const geo = new THREE.BufferGeometry()
    const verts = new Float32Array([
      x0 - hw,
      y0,
      z0,
      x0 + hw,
      y0,
      z0,
      x0 - hw,
      tileRidgeTop,
      zR,
      x0 + hw,
      tileRidgeTop,
      zR,
      x0 - hw,
      y0 - TILE_THICK,
      z0,
      x0 + hw,
      y0 - TILE_THICK,
      z0,
      x0 - hw,
      tileRidgeBot,
      zR,
      x0 + hw,
      tileRidgeBot,
      zR,
    ])
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    geo.setIndex([
      0,
      2,
      1,
      1,
      2,
      3,
      4,
      5,
      6,
      5,
      7,
      6,
      0,
      4,
      2,
      2,
      4,
      6,
      1,
      3,
      5,
      3,
      7,
      5,
      0,
      1,
      4,
      1,
      5,
      4,
      2,
      6,
      3,
      3,
      6,
      7,
    ])
    geo.computeVertexNormals()
    const m = new THREE.Mesh(geo, roofMat)
    m.castShadow = true
    return m
  }
  group.add(makeTile(totalX / 2, tileBaseZ, frontEaveTop, ridgeZ))
  group.add(makeTile(totalX / 2, tileBackZ, backEaveTop, ridgeZ))

  // ─── 墙尖(山墙三角顶) ──────────────────────────────
  const gableShape = new THREE.Shape()
  gableShape.moveTo(0, 0)
  gableShape.lineTo(ridgeZ - tileBaseZ, tileRidgeTop - eaveH)
  gableShape.lineTo(wallNE_NE - tileBaseZ, 0)
  gableShape.closePath()
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { steps: 1, depth: WL, bevelEnabled: false })
  const gableMat = wallMat.clone()
  gableMat.side = THREE.DoubleSide

  const gableNW = new THREE.Mesh(gableGeo, gableMat)
  gableNW.rotation.y = -Math.PI / 2
  gableNW.position.set(WL, eaveH, tileBaseZ)
  group.add(gableNW)

  const gableSE = new THREE.Mesh(gableGeo, gableMat)
  gableSE.rotation.y = -Math.PI / 2
  gableSE.position.set(totalX, eaveH, tileBaseZ)
  group.add(gableSE)

  return group
}
