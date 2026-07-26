import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { LIGHTING, CAMERA, DIMENSIONS } from '../config/house'
import House from './House'
import { FirstPerson, buildHouseCollisionBoxes } from './FirstPerson'
import MobileControls from '../ui/MobileControls'

const COLLISION_RADIUS = 0.2

interface Props {
  onCameraReady: (camera: THREE.PerspectiveCamera) => void
}

export default function Scene3D({ onCameraReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scene, setScene] = useState<THREE.Scene | null>(null)
  const [tourMode, setTourMode] = useState(false)

  const fpRef = useRef<FirstPerson | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const enterTourRef = useRef<() => void>(() => {})
  const exitTourRef = useRef<() => void>(() => {})
  const collisionBoxesRef = useRef<ReturnType<typeof buildHouseCollisionBoxes>>([])

  // ─── Mobile: movement ───────────────────────────────────────────
  const handleMobileMove = useCallback((dx: number, dy: number) => {
    const fp = fpRef.current
    const cam = cameraRef.current
    if (!fp?.isActive || !cam) return

    const forward = new THREE.Vector3()
    cam.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize()

    const v = new THREE.Vector3()
    v.addScaledVector(forward, dy * 0.05)
    v.addScaledVector(right, dx * 0.05)

    const newPos = cam.position.clone().add(v)

    // 碰撞检测 (分轴)
    const boxes = collisionBoxesRef.current
    const fullCollision = boxes.some(box =>
      newPos.x - COLLISION_RADIUS < box.max.x &&
      newPos.x + COLLISION_RADIUS > box.min.x &&
      newPos.z - COLLISION_RADIUS < box.max.z &&
      newPos.z + COLLISION_RADIUS > box.min.z
    )
    if (!fullCollision) {
      cam.position.copy(newPos)
    } else {
      const xOnly = cam.position.clone()
      xOnly.x = newPos.x
      if (!boxes.some(box =>
        xOnly.x - COLLISION_RADIUS < box.max.x &&
        xOnly.x + COLLISION_RADIUS > box.min.x &&
        xOnly.z - COLLISION_RADIUS < box.max.z &&
        xOnly.z + COLLISION_RADIUS > box.min.z
      )) cam.position.copy(xOnly)

      const zOnly = cam.position.clone()
      zOnly.z = newPos.z
      if (!boxes.some(box =>
        zOnly.x - COLLISION_RADIUS < box.max.x &&
        zOnly.x + COLLISION_RADIUS > box.min.x &&
        zOnly.z - COLLISION_RADIUS < box.max.z &&
        zOnly.z + COLLISION_RADIUS > box.min.z
      )) cam.position.copy(zOnly)
    }
  }, [])

  // ─── Mobile: look ───────────────────────────────────────────────
  const handleMobileLook = useCallback((dx: number, dy: number) => {
    const fp = fpRef.current
    const cam = cameraRef.current
    if (!fp?.isActive || !cam) return

    const euler = new THREE.Euler().setFromQuaternion(cam.quaternion, 'YXZ')
    euler.y -= dx
    euler.x -= dy
    euler.x = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, euler.x))
    cam.quaternion.setFromEuler(euler)
  }, [])

  // ─── Three.js bootstrap ─────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current!
    const w = container.clientWidth
    const h = container.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    container.appendChild(renderer.domElement)

    const threeScene = new THREE.Scene()
    threeScene.background = new THREE.Color(0xd4e4f0)
    threeScene.fog = new THREE.Fog(0xd4e4f0, 20, 60)

    const camera = new THREE.PerspectiveCamera(
      CAMERA.fov, w / h, CAMERA.near, CAMERA.far
    )
    camera.position.set(...CAMERA.initialPosition)
    camera.lookAt(...CAMERA.lookAt)
    cameraRef.current = camera

    // 光照
    const dirLight = new THREE.DirectionalLight(
      LIGHTING.directional.color,
      LIGHTING.directional.intensity
    )
    dirLight.position.set(...LIGHTING.directional.position)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 50
    dirLight.shadow.camera.left = -15
    dirLight.shadow.camera.right = 15
    dirLight.shadow.camera.top = 15
    dirLight.shadow.camera.bottom = -15
    threeScene.add(dirLight)

    threeScene.add(new THREE.AmbientLight(
      LIGHTING.ambient.color,
      LIGHTING.ambient.intensity
    ))
    threeScene.add(new THREE.HemisphereLight(
      LIGHTING.hemisphere.skyColor,
      LIGHTING.hemisphere.groundColor,
      LIGHTING.hemisphere.intensity
    ))

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controlsRef.current = controls
    controls.target.set(...CAMERA.lookAt)
    controls.minDistance = CAMERA.minDistance
    controls.maxDistance = CAMERA.maxDistance
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    }
    controls.update()

    // FirstPerson
    const firstPerson = new FirstPerson(camera, renderer.domElement)
    const boxes = buildHouseCollisionBoxes()
    firstPerson.setCollisionBoxes(boxes)
    collisionBoxesRef.current = boxes
    fpRef.current = firstPerson

    // Clock for delta time
    const clock = new THREE.Clock()

    onCameraReady(camera)

    // ─── Door click raycaster ────────────────────────────────────
    const WL = 0.15
    const totalX = WL + DIMENSIONS.houseWidth + WL
    const doorCenterX = totalX / 2   // (0.15 + 2.56 + 0.15) / 2 = 1.43

    // ─── enterTour / exitTour ────────────────────────────────────
    function enterTour() {
      setTourMode(true)
      controls.enabled = false
      camera.position.set(doorCenterX, 1.6, WL + 0.5)  // 门内0.5米
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

    enterTourRef.current = enterTour
    exitTourRef.current = exitTour

    // Handle Escape key → FirstPerson disables itself → call exitTour
    firstPerson.setOnExternalDisable(() => exitTour())

    function onCanvasClick(e: MouseEvent) {
      if (firstPerson.isActive) return

      const mouse = new THREE.Vector2()
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)

      // 门在 SW墙上，中心 X = totalX/2, Z: 0~WL, Y: 0~door.height
      const doorBox = new THREE.Box3(
        new THREE.Vector3(doorCenterX - 0.5, 0, 0),
        new THREE.Vector3(doorCenterX + 0.5, DIMENSIONS.door.height, WL),
      )

      raycaster.setFromCamera(mouse, camera)
      if (raycaster.ray.intersectsBox(doorBox)) {
        enterTour()
      }
    }
    renderer.domElement.addEventListener('click', onCanvasClick)

    // ─── Animation loop ──────────────────────────────────────────
    let animId: number
    function animate() {
      animId = requestAnimationFrame(animate)
      if (fpRef.current?.isActive) {
        fpRef.current.update(clock.getDelta())
      } else {
        controls.update()
      }
      renderer.render(threeScene, camera)
    }
    animate()

    function onResize() {
      const cw = container.clientWidth
      const ch = container.clientHeight
      camera.aspect = cw / ch
      camera.updateProjectionMatrix()
      renderer.setSize(cw, ch)
    }
    window.addEventListener('resize', onResize)

    setScene(threeScene)

    // D键切换尺寸标注
    function onKeyD(e: KeyboardEvent) {
      if (e.code === 'KeyD' && !firstPerson.isActive) {
        threeScene.traverse(c => { if (c.userData.isDimGroup) c.visible = !c.visible })
      }
    }
    window.addEventListener('keydown', onKeyD)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('keydown', onKeyD)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('click', onCanvasClick)
      firstPerson.disable()
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [onCameraReady])

  // ─── Toggle button handler ─────────────────────────────────────
  const handleToggle = useCallback(() => {
    if (tourMode) {
      exitTourRef.current()
    } else {
      enterTourRef.current()
    }
  }, [tourMode])

  // ─── JSX ───────────────────────────────────────────────────────
  return (
    <>
      <div ref={containerRef} className="absolute inset-0" />
      {scene && <House scene={scene} />}

      {/* 进入/退出按钮 */}
      {!tourMode ? (
        <button onClick={handleToggle} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/60 hover:bg-black/80 text-white px-5 py-2 rounded-full text-sm transition-colors">进入漫游</button>
      ) : (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white/70 px-5 py-2 rounded-full text-sm pointer-events-none select-none">按 ESC 退出漫游</div>
      )}
      {/* 操作提示 */}
      {tourMode && (
        <div className="absolute top-32 right-4 z-10 bg-black/60 text-white/80 rounded-lg px-4 py-3 text-xs leading-relaxed hidden md:block">
          <p className="font-bold mb-1">移动</p><p>W A S D / ↑ ← ↓ →</p>
          <p className="font-bold mt-2 mb-1">环顾</p><p>移动鼠标</p>
          <p className="font-bold mt-2 mb-1">退出</p><p>按 ESC 键</p>
        </div>
      )}

      {/* 移动端虚拟摇杆 + 环顾 */}
      <MobileControls
        inTour={tourMode}
        onMove={handleMobileMove}
        onLook={handleMobileLook}
        onToggle={() => exitTourRef.current()}
      />
    </>
  )
}
