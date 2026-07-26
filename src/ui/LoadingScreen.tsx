import { useEffect, useState } from 'react'
import { isWebGLAvailable } from '../utils/webgl'

interface Props {
  onReady: () => void
}

export default function LoadingScreen({ onReady }: Props) {
  const [webglOk, setWebglOk] = useState(true)

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebglOk(false)
      return
    }
    // 给场景初始化一点时间
    const timer = setTimeout(onReady, 500)
    return () => clearTimeout(timer)
  }, [onReady])

  if (!webglOk) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-8">
          <p className="text-xl mb-4">⚠️ 您的浏览器不支持 WebGL</p>
          <p className="text-sm text-gray-400">
            请使用最新版 Chrome、Firefox、Edge 或 Safari
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900 text-white transition-opacity duration-500">
      <p className="text-lg animate-pulse">加载中...</p>
    </div>
  )
}
