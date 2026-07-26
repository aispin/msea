# 3D 尺寸标注 — 功能规格

## 蓝图式尺寸标注

### 外围总尺寸（地面）

在建筑外围地面画黄色尺寸线，仿建筑蓝图风格：

- 总长：沿 Z 轴，Z=0 → Z=totalLength，在 NW 侧或 SE 侧地面
- 总宽：沿 X 轴，X=0 → X=totalX，在 SW 侧或 NE 侧地面
- 总高：在建筑角点处的垂直虚线 + 高度数值
- A/B/C 各区长度：在地面标注区段尺寸线

### 局部尺寸（3D 棱边）

在建筑关键棱边贴黄色短线：

- 入户门宽 × 高（SW 立面）
- A-B 内门洞宽 × 高
- 窗户宽 × 高（×3）
- 檐口高度（eaveH 处水平短线）
- 屋脊高度（ridgeH 处）

### 交互

- 按 `D` 键切换显示/隐藏，默认隐藏
- 使用 `THREE.Line` + `THREE.Sprite` 文本，始终可见（depthTest: false）

## A/B/C 区域标签移到室内地板

- 标签从空中移到各区内净空间的地面上（Y ≈ 0.05）
- 地板颜色按区域微调：
  - A区：暖灰 `#d5cec5`
  - B区：浅米 `#e0d8c8`
  - C区：暖黄 `#e8dfd0`
- 三色均低饱和度，仅作区域区分，不影响整体观感

## 文件变更

- 新增 `src/builders/dimensions.ts`：尺寸标注生成
- 修改 `src/builders/labels.ts`：A/B/C 标签移到地板
- 修改 `src/builders/walls.ts`：地板颜色按区域区分
- 修改 `src/scene/Scene3D.tsx`：`D` 键切换标注显隐
