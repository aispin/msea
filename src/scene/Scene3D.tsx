import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { LIGHTING, CAMERA } from '../config/house'
import House from './House'

export default function Scene3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scene, setScene] = useState<THREE.Scene | null>(null)

  useEffect(() => {
    const container = containerRef.current!
    const w = container.clientWidth
    const h = container.clientHeight

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    container.appendChild(renderer.domElement)

    // 场景
    const s = new THREE.Scene()
    s.background = new THREE.Color(0xd4e4f0) // 浅蓝天空色
    s.fog = new THREE.Fog(0xd4e4f0, 20, 60)
    setScene(s)

    // 相机
    const camera = new THREE.PerspectiveCamera(
      CAMERA.fov, w / h, CAMERA.near, CAMERA.far
    )
    camera.position.set(...CAMERA.initialPosition)
    camera.lookAt(...CAMERA.lookAt)

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
    s.add(dirLight)

    const ambLight = new THREE.AmbientLight(
      LIGHTING.ambient.color,
      LIGHTING.ambient.intensity
    )
    s.add(ambLight)

    const hemiLight = new THREE.HemisphereLight(
      LIGHTING.hemisphere.skyColor,
      LIGHTING.hemisphere.groundColor,
      LIGHTING.hemisphere.intensity
    )
    s.add(hemiLight)

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
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

    // 动画循环
    let animId: number
    function animate() {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(s, camera)
    }
    animate()

    // 自适应 resize
    function onResize() {
      const cw = container.clientWidth
      const ch = container.clientHeight
      camera.aspect = cw / ch
      camera.updateProjectionMatrix()
      renderer.setSize(cw, ch)
    }
    window.addEventListener('resize', onResize)

    // 清理
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <>
      <div ref={containerRef} className="absolute inset-0" />
      {scene && <House scene={scene} />}
    </>
  )
}
