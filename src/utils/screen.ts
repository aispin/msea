/**
 * 屏幕方向辅助函数
 *
 * Three.js lookAt 导致屏幕右=世界-X, 屏幕左=世界+X (相机在Z<0望Z>0时)
 * 用这些函数代替硬编码坐标，避免方向错误。
 *
 * 基准: NW墙外表面 X=0, SW墙外表面 Z=0
 *       建筑总宽 totalX=2.86, 总长 totalZ≈8.90
 */

import { totalX, ZONE_OFFSETS } from '../config/house'

const totalZ = ZONE_OFFSETS.totalLength

/** 过道侧(屏幕左) X坐标 */
export function aisleX(offset = 0): number {
  return totalX + offset
}

/** 邻居侧(屏幕右) X坐标 */
export function neighborX(offset = 0): number {
  return -offset
}

/** 门前(屏幕下) Z坐标 */
export function frontZ(offset = 0): number {
  return -offset
}

/** 屋后(屏幕上) Z坐标 */
export function backZ(offset = 0): number {
  return totalZ + offset
}

/** 建筑中心 X */
export function centerX(): number {
  return totalX / 2
}

/** 建筑中心 Z */
export function centerZ(): number {
  return totalZ / 2
}
