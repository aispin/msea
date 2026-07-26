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
    if (!this.enabled) return

    // 移动方向
    this.direction.set(0, 0, 0)
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) this.direction.z += 1
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) this.direction.z -= 1
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) this.direction.x -= 1
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this.direction.x += 1
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
    } else {
      // 分轴尝试
      const xOnly = this.camera.position.clone()
      xOnly.x = newPos.x
      if (!this.checkCollision(xOnly)) this.camera.position.copy(xOnly)
      const zOnly = this.camera.position.clone()
      zOnly.z = newPos.z
      if (!this.checkCollision(zOnly)) this.camera.position.copy(zOnly)
    }
  }

  private checkCollision(pos: THREE.Vector3): boolean {
    for (const box of this.collisionBoxes) {
      if (
        pos.x - COLLISION_RADIUS < box.max.x &&
        pos.x + COLLISION_RADIUS > box.min.x &&
        pos.z - COLLISION_RADIUS < box.max.z &&
        pos.z + COLLISION_RADIUS > box.min.z
      ) {
        return true
      }
    }
    return false
  }

  private onKeyDown = (e: KeyboardEvent) => { this.keys.add(e.code) }
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.code) }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.enabled) return
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

// 从建筑尺寸生成碰撞盒（门洞区域不阻挡）
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'

export function buildHouseCollisionBoxes(): CollisionBox[] {
  const WL = 0.15
  const HW = DIMENSIONS.houseWidth
  const totalX = WL + HW + WL
  const zEnd = ZONE_OFFSETS.totalLength
  const zAB = ZONE_OFFSETS.zoneBStart  // A-B墙NE面

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
