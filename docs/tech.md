# 房屋结构几何技术文档

## 坐标系

- 建筑轴线沿 Z 轴（SW→NE），宽沿 X 轴（NW→SE），高沿 Y 轴
- 外墙外表面定义原点：SW 墙 Z=0，NW 墙 X=0
- 墙厚 0.15m，内净尺寸参见 `src/config/house.ts`

## 屋顶结构

### 层级顺序（从下到上）

```
梁 → 檩条 → 椽条 → 瓦
```

瓦片直接搭在椽条上，椽条架在檩条上，檩条由梁支撑。所有构件共享同一个坡度角。

### 坡度计算

坡度由内净尺寸决定，瓦片和椽条使用完全相同的坡度：

```
triH       = ridgeH - eaveH = 5.0 - 3.15 = 1.85m
roofLen    = lB + lC = 3.0 + 2.55 = 5.55m（B+C 内净总长）
halfRoof   = roofLen / 2 = 2.775m（内净半跨）
roofAngle  = atan2(triH, halfRoof) ≈ 33.7°
```

**关键**：坡度角基于内净 `roofLen/2`，出挑不影响坡度。瓦片和椽条使用相同的 `roofAngle`，瓦片仅是比椽条更长（向外延伸到出挑边缘）。

### 构件尺寸与定位

#### 瓦片（外层）

- 覆盖范围：Z 从 `zStart - WL/2 - overhang` 到 `zStart + roofLen + WL/2 + overhang`（含出挑+墙厚）
- Z 总跨度：`roofLenWithOverhang = roofLen + 2×overhang + WL`
- 半跨：`halfSpan = roofLenWithOverhang / 2`
- 厚度：3cm
- 实现：自定义 BufferGeometry（8 顶点，上下两层 + 四侧面）
- 材质：`roofMat`（深灰瓦片色，DoubleSide）

#### 椽条（内层）

- 覆盖范围：Z 从 `zStart` 到 `zStart + roofLen`（墙到墙，不含出挑）
- 半跨：`halfRafter = roofLen / 2`
- 坡面实长：`sqrt(halfRafter² + triH²)`
- 截面：BoxGeometry(0.06, 0.10, slopeLen)，宽 6cm × 高 10cm × 坡长
- 截面旋转后 Y 投影：`rafterHalfH × cos(roofAngle)`，其中 `rafterHalfH = 0.05`
- 材质：`rafterMat`（原木色）
- 间隔：40cm

**层级偏移**（从瓦片顶面向下）：

| 层 | Y 偏移 | 说明 |
|---|---|---|
| 瓦片顶面 | `eaveH + triH/2`（中点） | 坡面几何中点 |
| 瓦片底面 | 顶面 − `TILE_THICK` | 3cm 厚壳 |
| 椽条顶面 | 瓦片底面 | 紧贴 |
| 椽条中心 | 顶面 − `rafterHalfH×cos(angle)` | Box 旋转后偏移 |
| 椽条底面 | 中心 − `rafterHalfH×cos(angle)` | |

#### 檩条（中层）

- 沿 X 轴水平布置，支撑椽条
- 截面：BoxGeometry(interiorW, purlinH, purlinW)，宽 8cm × 高 10cm × 内宽
- 每坡 4 根，Z 向均匀分布
- 顶面紧贴椽条底面
- 材质：`purlinMat`（深木色）

#### 屋脊梁（底层）

- 位于屋脊正下方，支撑顶部椽条交汇处
- 截面：BoxGeometry(interiorW, 0.18, 0.14)
- 顶面紧贴椽条底面（屋脊处计算实际位置）
- 材质：`purlinMat`

### 旋转与坐标映射

当 `rotation.x` 使 BoxGeometry 倾斜时，box 的局部 Y（高度方向）在 world Y 的投影 = `halfHeight × cos(angle)`。这个值用于计算各层之间的精确偏移量，确保构件紧贴无间隙。

参见 CLAUDE.md 中的"Three.js 旋转与坐标映射"章节。
