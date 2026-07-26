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

**屋脊定位**：取 B+C 区两面外墙的中点——`wallAB_SW`（A-B 隔墙朝 SW 的外表面）与 `wallNE_NE`（NE 墙朝 NE 的外表面）。不含 A 区天台。
```
ridgeZ = (wallAB_SW + wallNE_NE) / 2
```
前后椽条从此中点分别向两端下降，在同一高度交汇。

### 坡度计算

坡度由内净尺寸决定，瓦片和椽条使用完全相同的坡度：

```
triH       = ridgeH - eaveH = 5.0 - 3.15 = 1.85m
roofLen    = lB + lC = 3.0 + 2.55 = 5.55m（B+C 内净总长）
roofAngle  = atan2(triH, roofLen/2) ≈ 33.7°
```


### 构件联动函数（以椽条为源头）

椽条顶面与墙顶平齐 → 无缝防水。所有构件通过函数从椽条参数派生：

```typescript
rafterTopAtWall = eaveH  // 椽顶与墙顶平齐, 无缝
rafterStartZ = wallAB_SW  // 铺满墙厚(外墙到外墙)
rafterEndZ   = wallNE_NE
ridgeZ = (wallAB_SW + wallNE_NE) / 2

// 联动函数
rafterCY(z)  = rafterCenterAtWall ± (z − anchorZ) × tan(roofAngle)  // ±取决于前后坡
rafterTopY(z) = rafterCY(z) + rafterDY
rafterBotY(z) = rafterCY(z) − rafterDY
tileBotY(z)   = rafterTopY(z)
tileTopY(z)   = tileBotY(z) + TILE_THICK
purlinCY(z)   = rafterBotY(z) − purlinH/2
```

修改椽条参数（`rafterTopAtWall`、`rafterStartZ`），瓦片、檩条、墙尖全部自动联动。

#### 椽条

- 截面：BoxGeometry(0.06, 0.10, len)，间距 40cm
- Z 范围：`wallAB_SW` → `wallNE_NE`（铺满墙厚）

#### 瓦片

- 前檐口齐平 A-B 墙（无出挑），后檐口出挑 8cm
- 厚度 3cm，8 顶点 BufferGeometry + 四侧面，DoubleSide

#### 檩条

- 前后坡各 3 根，Z 向均匀分布（等间距）
- 截面 10×8cm，顶面贴椽底 = `purlinCY(z)`

#### 屋脊梁

- 截面 18×14cm，顶面贴椽底(屋脊处)
