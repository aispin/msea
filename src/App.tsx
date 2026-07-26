import type * as THREE from 'three'
import { useCallback, useState } from 'react'
import Scene3D from './scene/Scene3D'
import Compass from './ui/Compass'
import LoadingScreen from './ui/LoadingScreen'

export default function App() {
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null)
  const [ready, setReady] = useState(false)

  const handleCameraReady = useCallback((cam: THREE.PerspectiveCamera) => {
    setCamera(cam)
  }, [])

  return (
    <div className="w-full h-full relative">
      {!ready && <LoadingScreen onReady={() => setReady(true)} />}
      <Scene3D onCameraReady={handleCameraReady} />
      {ready && camera && <Compass camera={camera} />}
    </div>
  )
}
