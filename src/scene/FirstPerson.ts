import * as THREE from 'three'

const MOVE_SPEED = 3.0
const MOUSE_SENSITIVITY = 0.002
const COLLISION_RADIUS = 0.2

interface CollisionBox {
  min: THREE.Vector3
  max: THREE.Vector3
}

export class FirstPerson {
  camera: THREE.PerspectiveCamera
  private domElement: HTMLElement
  private enabled = false
  private euler = new THREE.Euler(0, 0, 0, 'YXZ')
  private direction = new THREE.Vector3()
  private keys = new Set<string>()
  private collisionBoxes: CollisionBox[] = []
  private onExternalDisable?: () => void
  private lastMouseX = 0
  private lastMouseY = 0

  get isActive() { return this.enabled }

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera
    this.domElement = domElement
  }

  setOnExternalDisable(fn: () => void) {
    this.onExternalDisable = fn
  }

  setCollisionBoxes(boxes: CollisionBox[]) {
    this.collisionBoxes = boxes
  }

  enable() {
    if (this.enabled) return
    this.enabled = true
    this.domElement.style.cursor = 'none'
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
    this.domElement.addEventListener('mousemove', this.onMouseMove)
    // 监听 ESC
    document.addEventListener('keydown', this.onEscKey)
  }

  disable() {
    this.enabled = false
    this.domElement.style.cursor = ''
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
    this.domElement.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('keydown', this.onEscKey)
    this.keys.clear()
  }

  update(delta: number) {
    if (!this.enabled) return

    this.direction.set(0, 0, 0)
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) this.direction.z += 1
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) this.direction.z -= 1
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) this.direction.x -= 1
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this.direction.x += 1
    if (this.direction.lengthSq() === 0) return
    this.direction.normalize()

    const forward = new THREE.Vector3()
    this.camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    const vel = new THREE.Vector3()
    vel.addScaledVector(forward, this.direction.z * MOVE_SPEED * delta)
    vel.addScaledVector(right, this.direction.x * MOVE_SPEED * delta)

    const newPos = this.camera.position.clone().add(vel)
    if (!this.checkFull(newPos)) {
      this.camera.position.copy(newPos)
    } else {
      const xOnly = this.camera.position.clone(); xOnly.x = newPos.x
      if (!this.checkFull(xOnly)) this.camera.position.copy(xOnly)
      const zOnly = this.camera.position.clone(); zOnly.z = newPos.z
      if (!this.checkFull(zOnly)) this.camera.position.copy(zOnly)
    }
  }

  private checkFull(pos: THREE.Vector3): boolean {
    for (const box of this.collisionBoxes) {
      if (pos.x - COLLISION_RADIUS < box.max.x && pos.x + COLLISION_RADIUS > box.min.x &&
          pos.z - COLLISION_RADIUS < box.max.z && pos.z + COLLISION_RADIUS > box.min.z) {
        return true
      }
    }
    return false
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // 忽略在 input/textarea 中的输入
    if (e.target !== document.body && e.target !== this.domElement) return
    this.keys.add(e.code)
  }
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.code) }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.enabled) return
    if (this.lastMouseX === 0 && this.lastMouseY === 0) {
      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY
      return
    }
    const dx = e.clientX - this.lastMouseX
    const dy = e.clientY - this.lastMouseY
    this.lastMouseX = e.clientX
    this.lastMouseY = e.clientY

    this.euler.setFromQuaternion(this.camera.quaternion)
    this.euler.y -= dx * MOUSE_SENSITIVITY
    this.euler.x -= dy * MOUSE_SENSITIVITY
    this.euler.x = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.euler.x))
    this.camera.quaternion.setFromEuler(this.euler)
  }

  private onEscKey = (e: KeyboardEvent) => {
    if (e.code === 'Escape' && this.enabled) {
      this.disable()
      this.onExternalDisable?.()
    }
  }
}

// ─── 碰撞盒生成 ──────────────────────────────────────────
import { DIMENSIONS, ZONE_OFFSETS } from '../config/house'

export function buildHouseCollisionBoxes(): CollisionBox[] {
  const WL = 0.15
  const HW = DIMENSIONS.houseWidth
  const totalX = WL + HW + WL
  const zEnd = ZONE_OFFSETS.totalLength
  const zAB = ZONE_OFFSETS.zoneBStart

  return [
    { min: new THREE.Vector3(0, 0, 0), max: new THREE.Vector3(totalX, 5, WL) },
    { min: new THREE.Vector3(0, 0, 0), max: new THREE.Vector3(WL, 5, zEnd) },
    { min: new THREE.Vector3(totalX - WL, 0, 0), max: new THREE.Vector3(totalX, 5, zEnd) },
    { min: new THREE.Vector3(0, 0, zEnd - WL), max: new THREE.Vector3(totalX, 5, zEnd) },
    { min: new THREE.Vector3(0, 0, zAB - WL), max: new THREE.Vector3(totalX / 2 - 0.5, 5, zAB) },
    { min: new THREE.Vector3(totalX / 2 + 0.5, 0, zAB - WL), max: new THREE.Vector3(totalX, 5, zAB) },
  ]
}
