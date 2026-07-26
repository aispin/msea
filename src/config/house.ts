// src/config/house.ts

/**
 * 坐标约定：
 *  +Z = 东北(远/建筑背面)
 *  -Z = 西南(近/建筑正面/入户门)
 *  -X = 西北(过道侧)
 *  +X = 东南(邻居侧)
 *  +Y = 上(高度)
 *
 *  注: Three.js lookAt 导致屏幕右=世界-X, 屏幕左=世界+X
 *      代码中过道在-X(右下), 邻居在+X(左上)
 */

export const DIMENSIONS = {
  /** 建筑统一宽度 (X轴) */
  houseWidth: 2.56,

  /** A区 - 西南端天台 */
  zoneA: {
    length: 2.9, // Z轴深度
    wallHeight: 3.15, // 墙体高度
    parapetHeight: 0.2, // 天台围栏高度
  },

  /** B区 - 中间主屋 */
  zoneB: {
    length: 3.0, // Z轴深度
    eaveHeight: 3.15, // 檐口高度
    ridgeHeight: 5.0, // 屋脊高度
  },

  /** C区 - 东北端阁楼 */
  zoneC: {
    length: 2.55, // Z轴深度
    eaveHeight: 3.15, // 檐口高度(同B区)
    ridgeHeight: 5.0, // 屋脊高度(同B区)
    atticFloorHeight: 2.15, // 阁楼底板高度
  },

  /** 屋顶 (B+C区共用，总长5.55m) */
  roof: {
    totalLength: 5.55, // B.length + C.length
    ridgeHeight: 5.0,
    eaveHeight: 3.15,
    overhang: 0.08, // 屋檐出挑
  },

  /** 过道 */
  aisle: {
    width: 1.5, // 过道宽度 (X轴，在建筑西北侧)
  },

  /** 窗户 */
  window: {
    width: 1.2,
    height: 1.5,
    sillHeight: 1.2, // 窗台离地高度
    frameThickness: 0.06,
    latticeBars: 4, // 格栅竖条数量
  },

  /** 入户门 */
  door: {
    width: 0.88,
    height: 2.0,
    thickness: 0.08,
    innerWidth: 1.06,
    innerHeight: 2.58,
    frameWidth: 0.05, // 内门木框宽5cm
  },

  /** 阁楼 */
  attic: {
    pillarRadius: 0.06,
    pillarCount: 4,
    ladderWidth: 0.4,
    ladderRungCount: 8,
  },

  /** 邻居体块 */
  neighbor: {
    width: 0.5,
    length: 8.90, // 与建筑总长一致
    height: 4.0,
    gap: 0.3,
  },

  /** 地面 */
  ground: {
    margin: 3.0, // 建筑周围地面范围
  },
} as const

export const COLORS = {
  wall: 0xF5F0E8, // 白墙
  roof: 0x3A3A3A, // 深灰瓦
  parapet: 0x6B6B6B, // 青砖灰
  door: 0x5C3A21, // 深木色
  doorRing: 0xC9A96E, // 门环金色
  windowFrame: 0x5C3A21, // 窗框深木色
  windowGlass: 0xB8D4E3, // 窗玻璃浅蓝半透
  aisle: 0x8B4513, // 红砖过道
  courtyard: 0xC0C0C0, // 石板地面
  neighbor: 0x808080, // 邻居灰色
  atticWood: 0x8B6914, // 阁楼原木色
  labelBg: 0x000000, // 标签背景
  labelText: 0xFFFFFF, // 标签文字
  compassBg: 0x1A1A2E, // 罗盘背景
  compassNeedle: 0xFF4444, // 罗盘指针
} as const

export const LIGHTING = {
  directional: {
    color: 0xFFF8E7,
    intensity: 1.0,
    position: [-2, 6, -4] as [number, number, number], // 西南偏上方
  },
  ambient: {
    color: 0xBCC6D0,
    intensity: 0.4,
  },
  hemisphere: {
    skyColor: 0xC8E0FF,
    groundColor: 0x8B7355,
    intensity: 0.3,
  },
} as const

export const CAMERA = {
  initialPosition: [1.43, 3.5, -6] as [number, number, number],
  lookAt: [1.43, 2.0, 4.45] as [number, number, number],
  fov: 50,
  near: 0.1,
  far: 80,
  minDistance: 1,
  maxDistance: 30,
} as const

/** 区域位置计算 — 以SW墙外表面为Z=0，内净尺寸+墙厚 */
const WL = 0.15 // 墙厚
const lA = DIMENSIONS.zoneA.length // 2.9
const lB = DIMENSIONS.zoneB.length // 3.0
const lC = DIMENSIONS.zoneC.length // 2.55

/** 建筑总宽 (含墙厚) */
export const totalX = WL + DIMENSIONS.houseWidth + WL // 2.86
/** 墙厚 */
export { WL }

export const ZONE_OFFSETS = {
  /** SW墙外表面 */ wallSW: 0,
  /** A区内净起始 */ zoneAStart: WL,
  /** A-B墙SW面 */ wallAB_SW: WL + lA,
  /** A-B墙NE面 / B区内净起始 */ zoneBStart: WL + lA + WL,
  /** C区内净起始 */ zoneCStart: WL + lA + WL + lB,
  /** NE墙内表面 */ wallNE_inner: WL + lA + WL + lB + lC,
  /** NE墙外表面 / 建筑总长 */ totalLength: WL + lA + WL + lB + lC + WL,
} as const
