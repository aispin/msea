# 进屋漫游（第一人称）— 功能规格

## 交互流程

1. 默认：OrbitControls 俯瞰旋转模式
2. 点击入户门 → 进入第一人称漫游
3. 按 `Esc`（桌面）/ 点返回钮（手机）→ 退出漫游，恢复俯瞰

## 桌面端

| 操作 | 行为 |
|------|------|
| 鼠标移动 | 环顾四周（PointerLock API） |
| W | 前进 |
| S | 后退 |
| A | 左移 |
| D | 右移 |
| Esc | 退出 PointerLock + 退出漫游 |

## 手机端

| 操作 | 行为 |
|------|------|
| 左半屏虚拟摇杆 | 前后左右移动 |
| 右半屏滑动 | 环顾四周 |
| 顶部返回按钮 | 退出漫游 |

## 技术实现

### 门点击检测
- 使用 `THREE.Raycaster` 对入户门 mesh 做 hit test
- 仅在 OrbitControls 模式下检测（漫游时不检测）

### 相机切换
- 进入漫游：`controls.enabled = false`，相机移至门前 1m、高度 1.6m
- 退出漫游：`controls.enabled = true`，恢复俯瞰相机位置
- 移动速度：桌面 ~3m/s，手机 ~2m/s

### 碰撞检测
- 基于建筑墙体 AABB 做简单碰撞
- 相机碰撞半径 0.2m
- 门洞（1.0m 宽，前后各一）为可通过区域

### 移动端控件
- 左半屏：`nipplejs` 虚拟摇杆库
- 右半屏：touchmove 控制环顾（touch 灵敏度 0.003 rad/px）

## 文件变更

- 新增 `src/scene/FirstPerson.tsx`：第一人称控制器
- 新增 `src/ui/MobileControls.tsx`：手机端摇杆 + 返回按钮
- 修改 `src/scene/Scene3D.tsx`：集成门点击检测 + 模式切换
