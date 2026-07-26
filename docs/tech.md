# 技术文档 — 老房 3D 可视化工具

## 坐标系

世界坐标系：
- +Z = 东北(远, 建筑背面)
- -Z = 西南(近, 建筑正面/入户门)
- -X = 西北(过道侧)
- +X = 东南(邻居侧)

视觉映射：相机在西南(-Z)望向东北(+Z) → **屏幕左=世界+X**, **屏幕右=世界-X**（原因见下文）。

## Three.js lookAt 与屏幕方向

`Matrix4.lookAt(eye, target, up)` 中 `x = cross(up, normalize(eye - target))`。

- 相机在 +Z 看向原点（标准用法）：`eye-target ≈ +Z`，`cross(up, +Z) = +X`，屏幕右=世界+X ✓
- **相机在 -Z 看向 +Z**（本项目）：`eye-target ≈ -Z`，`cross(up, -Z) = -X`，**屏幕右=世界-X**，左右颠倒

本项目相机在西南(-Z)望向东北(+Z)，故环境元素（过道/邻居）位置已按此视觉正确性调整。

## Three.js 旋转与坐标映射

`rotation.y` 会改变 local 轴和 world 轴的对应关系。**`position` 设置的是旋转后的原点位置**，不是几何中心。

| rotation.y | local X (窗宽) | local Z (面朝向) | position.z 含义 |
|---|---|---|---|
| `π/2` | → world **-Z** | → world **+X** (SE) | 窗**右**边界 |
| `-π/2` | → world **+Z** | → world **-X** (NW) | 窗**左**边界 |

计算窗中心在世界 Z 的位置：
- `rotation.y = π/2`：`centerZ = position.z - width/2`
- `rotation.y = -π/2`：`centerZ = position.z + width/2`

**常见陷阱**：公式里 `width/2` 的正负号取决于旋转方向，用反会导致整窗偏移一个窗宽。

## 屋顶结构

### 层级顺序（从下到上）

```
梁 → 檩条 → 椽条 → 瓦
```

瓦片直接搭在椽条上，椽条架在檩条上，檩条由梁支撑。所有构件共享同一个坡度角。

### 自下而上的建造逻辑

建造顺序：**椽条 → 瓦片**。每一层在下一层基础上计算叠加。

**屋脊定位**：取前外墙和后外墙的中点，确保前后对称。
```
ridgeZ = (frontWallExt + backWallExt) / 2
```
前后椽条从此中点分别向两端下降，在同一高度交汇。

### 坡度计算

坡度由内净尺寸决定，瓦片和椽条使用完全相同的坡度：

```
triH       = ridgeH - eaveH = 5.0 - 3.15 = 1.85m
roofLen    = lB + lC = 3.0 + 2.55 = 5.55m（B+C 内净总长）
roofAngle  = atan2(triH, roofLen/2) ≈ 33.7°
```


### 构件尺寸与定位

#### 椽条（内层，先建）

1. 搁在墙顶上（外墙表面内侧 5cm）
2. 坡度 `roofAngle`，从 `rafterStartZ` 上升到 `ridgeZ`（前坡），从 `ridgeZ` 降到 `rafterEndZ`（后坡）
3. 椽底 Y = `wallTopY`（墙顶），椽中心 Y = `wallTopY + rafterDY`，椽顶 Y = `wallTopY + 2 × rafterDY`
4. 椽顶在 ridge 处：`rafterTopAtRidge = rafterTopAtWall + (ridgeZ - rafterStartZ) × tan(roofAngle)`
5. 截面：BoxGeometry(0.06, 0.10, slopeLen)，间距 40cm

#### 瓦片（外层，椽条上方）

1. 瓦底 = 椽顶，同坡度 `roofAngle`
2. 前檐口：齐平前墙外表面（无出挑）
3. 后檐口：出挑 8cm 超过后墙外表面
4. 檐口高度 = `椽顶在墙处 + TILE_THICK − 出挑水平距 × tan(roofAngle)`
5. 屋脊高度 = `rafterTopAtRidge + TILE_THICK`
6. 厚度：3cm，DoubleSide，8 顶点 BufferGeometry

#### 层级 Y 偏移

BoxGeometry 经 `rotation.x` 旋转后，局部 Y 在 world Y 的投影 = `halfHeight × cos(angle)`。

从瓦片顶面向下：

| 层 | Y 偏移 | 说明 |
|---|---|---|
| 瓦片顶面 | `eaveH + triH/2`（中点） | 坡面几何中点 |
| 瓦片底面 | 顶面 − `TILE_THICK` | 3cm 厚壳 |
| 椽条顶面 | 瓦片底面 | 紧贴 |
| 椽条中心 | 顶面 − `rafterHalfH×cos(angle)` | Box 旋转后半高 |
| 椽条底面 | 中心 − `rafterHalfH×cos(angle)` | |

#### 檩条（中层）

- 沿 X 轴水平布置，支撑椽条
- 截面：BoxGeometry(interiorW, 10cm, 8cm)
- 每坡 4 根，Z 向均匀分布
- 顶面紧贴椽条底面

#### 屋脊梁

- 位于屋脊正下方
- 截面：BoxGeometry(interiorW, 18cm, 14cm)
- 顶面紧贴椽条底面（屋脊处按实际位置计算）
