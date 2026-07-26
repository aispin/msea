# 进屋漫游（第一人称）— 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 点击入户门或按钮进入第一人称漫游模式，支持桌面（WASD+箭头键+鼠标环顾）和手机（双摇杆），按 Esc 或点按钮退出。

**Architecture:** 新增 FirstPerson 控制器组件管理 PointerLock + 键盘移动 + 碰撞检测，MobileControls 组件处理手机摇杆和滑动，Scene3D 集成模式切换和门点击检测。漫游时禁用 OrbitControls。

**Tech Stack:** React 18 + TypeScript + Three.js 0.185 + nipplejs（手机摇杆）

## Global Constraints

- Three.js native, no R3F
- 移动速度：桌面 ~3m/s，手机 ~2m/s
- 相机碰撞半径 0.2m，人眼高度 1.6m
- 门洞宽度 1.0m 可通过
- PointerLock 由用户手势触发（需点击），不可自动锁定
- Tailwind CSS 4 用于 UI 组件

---

### Task 1: FirstPerson 控制器 — 键盘移动 + PointerLock

**Files:**
- Create: `src/scene/FirstPerson.ts`

**Interfaces:**
- Produces: `export class FirstPerson` — 管理第一人称移动和环顾
  - `constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement)`
  - `enable(): void` — 锁定鼠标，开始移动
  - `disable(): void` — 解锁鼠标，停止移动
  - `update(delta: number): void` — 每帧更新，处理键盘输入
  - `isActive: boolean` (getter)

- [ ] **Step 1: 创建 FirstPerson.ts**

```typescript
// src/scene/FirstPerson.ts
import * as THREE from 'three'

const MOVE_SPEED = 3.0 // m/s
const MOUSE_SENSITIVITY = 0.002
const COLLISION_RADIUS = 0.2
const EYE_HEIGHT = 1.6

interface CollisionBox {
  min: THREE.Vector3
  max: THREE.Vector3
}

export class FirstPerson {
  camera: THREE.PerspectiveCamera
  private domElement: HTMLElement
  private enabled = false
  private euler = new THREE.Euler(0, 0, 0, 'YXZ')
  private velocity = new THREE.Vector3()
  private direction = new THREE.Vector3()
  private keys = new Set<string>()
  private collisionBoxes: CollisionBox[] = []

  get isActive() { return this.enabled }

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera
    this.domElement = domElement
  }

  setCollisionBoxes(boxes: CollisionBox[]) {
    this.collisionBoxes = boxes
  }

  enable() {
    this.enabled = true
    this.domElement.requestPointerLock()
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
  }

  disable() {
    this.enabled = false
    document.exitPointerLock()
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
    this.keys.clear()
  }

  update(delta: number) {
    if (!this.enabled)
      return

    // 移动方向
    this.direction.set(0, 0, 0)
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp'))
      this.direction.z += 1
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown'))
      this.direction.z -= 1
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft'))
      this.direction.x -= 1
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight'))
      this.direction.x += 1
    this.direction.normalize()

    // 相机局部方向 → 世界方向
    const forward = new THREE.Vector3()
    this.camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    this.velocity.set(0, 0, 0)
    this.velocity.addScaledVector(forward, this.direction.z * MOVE_SPEED * delta)
    this.velocity.addScaledVector(right, this.direction.x * MOVE_SPEED * delta)

    // 碰撞检测 → 移动
    const newPos = this.camera.position.clone().add(this.velocity)
    if (!this.checkCollision(newPos)) {
      this.camera.position.copy(newPos)
    }
    else {
      // 分轴尝试
      const xOnly = this.camera.position.clone()
      xOnly.x = newPos.x
      if (!this.checkCollision(xOnly))
        this.camera.position.copy(xOnly)
      const zOnly = this.camera.position.clone()
      zOnly.z = newPos.z
      if (!this.checkCollision(zOnly))
        this.camera.position.copy(zOnly)
    }
  }

  private checkCollision(pos: THREE.Vector3): boolean {
    for (const box of this.collisionBoxes) {
      if (
        pos.x - COLLISION_RADIUS < box.max.x
        && pos.x + COLLISION_RADIUS > box.min.x
        && pos.z - COLLISION_RADIUS < box.max.z
        && pos.z + COLLISION_RADIUS > box.min.z
      ) {
        return true
      }
    }
    return false
  }

  private onKeyDown = (e: KeyboardEvent) => { this.keys.add(e.code) }
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.code) }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.enabled)
      return
    this.euler.setFromQuaternion(this.camera.quaternion)
    this.euler.y -= e.movementX * MOUSE_SENSITIVITY
    this.euler.x -= e.movementY * MOUSE_SENSITIVITY
    this.euler.x = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.euler.x))
    this.camera.quaternion.setFromEuler(this.euler)
  }

  private onPointerLockChange = () => {
    if (document.pointerLockElement !== this.domElement) {
      this.enabled = false
      document.removeEventListener('keydown', this.onKeyDown)
      document.removeEventListener('keyup', this.onKeyUp)
      document.removeEventListener('mousemove', this.onMouseMove)
      document.removeEventListener('pointerlockchange', this.onPointerLockChange)
      this.keys.clear()
    }
  }
}
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/scene/FirstPerson.ts
git commit -m "feat: add FirstPerson controller with keyboard movement and collision

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: 碰撞盒数据生成

**Files:**
- Modify: `src/scene/FirstPerson.ts` — 添加 `buildHouseCollisionBoxes()` 函数

**Interfaces:**
- Produces: `buildHouseCollisionBoxes(): CollisionBox[]` — 从 DIMENSIONS/ZONE_OFFSETS 生成墙体 AABB

- [ ] **Step 1: 添加碰撞盒生成器（追加到 FirstPerson.ts 末尾）**

```typescript
// 从建筑尺寸生成碰撞盒（门洞区域不阻挡）
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'

export function buildHouseCollisionBoxes(): CollisionBox[] {
  const WL = 0.15
  const HW = DIMENSIONS.houseWidth
  const totalX = WL + HW + WL
  const zEnd = ZONE_OFFSETS.totalLength
  const zAB = ZONE_OFFSETS.zoneBStart // A-B墙NE面

  const boxes: CollisionBox[] = [
    // SW外墙 (正面)
    { min: new THREE.Vector3(0, 0, 0), max: new THREE.Vector3(totalX, 5, WL) },
    // NW外墙 (过道侧)
    { min: new THREE.Vector3(0, 0, 0), max: new THREE.Vector3(WL, 5, zEnd) },
    // SE外墙 (邻居侧)
    { min: new THREE.Vector3(totalX - WL, 0, 0), max: new THREE.Vector3(totalX, 5, zEnd) },
    // NE外墙 (背面)
    { min: new THREE.Vector3(0, 0, zEnd - WL), max: new THREE.Vector3(totalX, 5, zEnd) },
    // A-B承重墙 (z=zAB_SW ~ zAB, 门洞1.0m在中间)
    { min: new THREE.Vector3(0, 0, zAB - WL), max: new THREE.Vector3(totalX / 2 - 0.5, 5, zAB) },
    { min: new THREE.Vector3(totalX / 2 + 0.5, 0, zAB - WL), max: new THREE.Vector3(totalX, 5, zAB) },
  ]

  return boxes
}
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/scene/FirstPerson.ts
git commit -m "feat: add collision box generator from house config

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: 手机端移动控件

**Files:**
- Create: `src/ui/MobileControls.tsx`

**Interfaces:**
- Consumes: 无
- Produces: `<MobileControls onMove={(dx,dy)=>void} onLook={(dx,dy)=>void} onToggle={()=>void} inTour: boolean />`

- [ ] **Step 1: 安装 nipplejs**

```bash
npm install nipplejs
```

- [ ] **Step 2: 创建 MobileControls.tsx**

```typescript
// src/ui/MobileControls.tsx
import { useEffect, useRef } from 'react'
import nipplejs from 'nipplejs'

interface Props {
  inTour: boolean
  onMove: (dx: number, dy: number) => void
  onLook: (dx: number, dy: number) => void
  onToggle: () => void
}

export default function MobileControls({ inTour, onMove, onLook, onToggle }: Props) {
  const joystickRef = useRef<HTMLDivElement>(null)
  const lookRef = useRef<HTMLDivElement>(null)
  const moveRef = useRef({ x: 0, y: 0 })
  const lookId = useRef<number>(0)

  useEffect(() => {
    if (!inTour || !joystickRef.current) return

    const nipple = nipplejs.create({
      zone: joystickRef.current,
      mode: 'static',
      position: { left: '25%', bottom: '25%' },
      color: 'rgba(255,255,255,0.5)',
      size: 120,
    })

    nipple.on('move', (_: any, data: any) => {
      moveRef.current = { x: data.vector.x, y: -data.vector.y }
    })
    nipple.on('end', () => { moveRef.current = { x: 0, y: 0 } })

    // move loop
    lookId.current = window.setInterval(() => {
      onMove(moveRef.current.x, moveRef.current.y)
    }, 16)

    return () => {
      nipple.destroy()
      clearInterval(lookId.current)
    }
  }, [inTour, onMove])

  // 环顾触摸
  useEffect(() => {
    if (!inTour || !lookRef.current) return
    const el = lookRef.current
    let lastX = 0, lastY = 0

    const onTouchStart = (e: TouchEvent) => {
      lastX = e.touches[0].clientX
      lastY = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - lastX
      const dy = e.touches[0].clientY - lastY
      lastX = e.touches[0].clientX
      lastY = e.touches[0].clientY
      onLook(dx * 0.003, dy * 0.003)
    }

    el.addEventListener('touchstart', onTouchStart)
    el.addEventListener('touchmove', onTouchMove)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [inTour, onLook])

  if (!inTour) return null

  return (
    <>
      <div ref={joystickRef} className="absolute inset-0 z-20 pointer-events-none" />
      <div ref={lookRef} className="absolute right-0 top-0 bottom-0 w-1/2 z-20" />
      <button
        onClick={onToggle}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/60 text-white px-4 py-2 rounded-full text-sm"
      >
        退出漫游
      </button>
    </>
  )
}
```

- [ ] **Step 3: 验证编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add src/ui/MobileControls.tsx
git commit -m "feat: add mobile virtual joystick and touch look controls

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Toggle 按钮 + 门点击检测 + Scene3D 集成

**Files:**
- Modify: `src/scene/Scene3D.tsx` — 集成 FirstPerson、碰撞检测、门点击、模式切换
- Modify: `src/App.tsx` — 传递 tourMode 状态

**Interfaces:**
- Consumes: `FirstPerson`, `buildHouseCollisionBoxes`, `MobileControls`
- Produces: 完整可用的第一人称漫游功能

- [ ] **Step 1: 更新 Scene3D.tsx**

```typescript
// 在 Scene3D.tsx 中新增：
// - 导入 FirstPerson 和 buildHouseCollisionBoxes
// - 导入 MobileControls
// - 添加 tourMode state
// - 添加门点击 raycaster 检测
// - 切换 OrbitControls enabled

// 关键代码片段：

import { DIMENSIONS } from '../config/house'
import MobileControls from '../ui/MobileControls'
import { buildHouseCollisionBoxes, FirstPerson } from './FirstPerson'

// 在 useEffect 内，OrbitControls 创建后：
const fp = useRef<FirstPerson | null>(null)
const [tourMode, setTourMode] = useState(false)

// 创建 FirstPerson 实例
const firstPerson = new FirstPerson(camera, renderer.domElement)
firstPerson.setCollisionBoxes(buildHouseCollisionBoxes())
fp.current = firstPerson

// 门点击检测 (在 canvas 上)
function onCanvasClick(e: MouseEvent) {
  if (tourMode)
    return
  const mouse = new THREE.Vector2()
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)

  // 门在 SW墙上，中心X=totalX/2, Z范围 0~WL, Y范围 0~2.1
  const doorCenter = new THREE.Vector3(
    (0.15 + DIMENSIONS.houseWidth + 0.15) / 2,
    DIMENSIONS.door.height / 2,
    0.15 / 2
  )
  const doorBox = new THREE.Box3(
    new THREE.Vector3(doorCenter.x - 0.5, 0, 0),
    new THREE.Vector3(doorCenter.x + 0.5, DIMENSIONS.door.height, 0.15),
  )

  const intersect = raycaster.intersectBox(doorBox, new THREE.Vector3())
  if (intersect) {
    enterTour()
  }
}
renderer.domElement.addEventListener('click', onCanvasClick)

// 进入/退出漫游
function enterTour() {
  setTourMode(true)
  controls.enabled = false
  camera.position.set(
    (0.15 + DIMENSIONS.houseWidth + 0.15) / 2,
    1.6,
    -1.0 // 门前1米
  )
  firstPerson.enable()
}

function exitTour() {
  setTourMode(false)
  firstPerson.disable()
  controls.enabled = true
  camera.position.set(...CAMERA.initialPosition)
  camera.lookAt(...CAMERA.lookAt)
  controls.target.set(...CAMERA.lookAt)
}

// 移动端移动/环顾回调
function handleMobileMove(dx: number, dy: number) {
  if (!fp.current?.isActive)
    return
  const forward = new THREE.Vector3()
  camera.getWorldDirection(forward)
  forward.y = 0; forward.normalize()
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()
  const v = new THREE.Vector3()
  v.addScaledVector(forward, dy * 0.05)
  v.addScaledVector(right, dx * 0.05)
  const newPos = camera.position.clone().add(v)
  // collision check
  // ... (similar to FirstPerson.update collision logic)
  camera.position.copy(newPos)
}

// 动画循环中：
function animate() {
  animId = requestAnimationFrame(animate)
  if (fp.current?.isActive) {
    fp.current.update(clock.getDelta())
  }
  else {
    controls.update()
  }
  renderer.render(threeScene, camera)
}
```

- [ ] **Step 2: 添加 Toggle 按钮 UI（在 Scene3D 的 JSX 中）**

```tsx
{ /* Toggle 按钮 — 桌面端 */ }
<button
  onClick={() => tourMode ? exitTour() : (setTourMode(true), (() => { /* 触发门点击逻辑 */ })())}
  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/60 hover:bg-black/80 text-white px-5 py-2 rounded-full text-sm transition-colors"
>
  {tourMode ? '退出漫游' : '进入漫游'}
</button>
```

注意：桌面的 toggle 按钮只做 toggle，不重复门点击逻辑。进漫游时调用 enterTour()，退出时调用 exitTour()。

- [ ] **Step 3: 更新 App.tsx 传递 tourMode**

```tsx
// App.tsx 中增加 tourMode 状态管理，或由 Scene3D 内部管理
// Scene3D 自管理 tourMode 即可，无需 App 介入
```

- [ ] **Step 4: 验证编译并测试**

```bash
npx tsc --noEmit && npm run dev
```

测试清单：
- [ ] 点击入户门 → 进入漫游
- [ ] 点击"进入漫游"按钮 → 进入漫游
- [ ] WASD + 箭头键移动正常
- [ ] 鼠标环顾正常
- [ ] 碰撞检测防止穿墙
- [ ] 可通过门洞进入室内
- [ ] Esc → 退出
- [ ] "退出漫游"按钮 → 退出
- [ ] 手机端虚拟摇杆 + 滑动环顾

- [ ] **Step 5: 提交**

```bash
git add src/scene/Scene3D.tsx src/App.tsx
git commit -m "feat: integrate first-person tour with door click, toggle button, mobile controls

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: 最终验证与修复

- [ ] **Step 1: TypeScript 全面检查**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: 生产构建**

```bash
npm run build
```

- [ ] **Step 3: 功能验收**

- [ ] 桌面端：点击门 → 进漫游 → WASD/箭头键移动 → Esc/按钮退出
- [ ] 桌面端：PointerLock 正常（点击后锁定，Esc 后解锁）
- [ ] 手机端：按钮进漫游 → 摇杆移动 → 滑动环顾 → 按钮退出
- [ ] 碰撞检测：不能穿过外墙和内墙，但能通过门洞
- [ ] OrbitControls 漫游时禁用，退出后恢复

- [ ] **Step 4: 提交最终修复**

```bash
git add -A
git commit -m "chore: final adjustments for first-person tour

Co-Authored-By: Claude <noreply@anthropic.com>"
```
