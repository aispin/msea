import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface CompassProps {
  camera: THREE.Camera
}

export default function Compass({ camera }: CompassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const size = 80
    canvas.width = size * 2
    canvas.height = size * 2
    const cx = size
    const cy = size
    const r = size - 8

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 背景圆盘
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(26, 26, 46, 0.85)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 2
      ctx.stroke()

      // 方向标记
      const dirs = [
        { label: 'N', angle: 0 },
        { label: 'E', angle: Math.PI / 2 },
        { label: 'S', angle: Math.PI },
        { label: 'W', angle: -Math.PI / 2 },
      ]
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const { label, angle } of dirs) {
        // 计算相机方向
        const camDir = new THREE.Vector3()
        camera.getWorldDirection(camDir)
        // 相机水平朝向角度 (从+Z轴顺时针? 实际上需要根据世界坐标)
        // 简化: 取相机前向量的XZ平面投影角度
        const camAngle = Math.atan2(camDir.x, camDir.z) // +Z=0, +X=PI/2

        // 标记在世界固定方向，需要旋转以匹配相机朝向
        const worldAngle = angle // N在世界中对应+Z方向
        const displayAngle = worldAngle - camAngle

        const dx = cx + Math.sin(displayAngle) * (r - 16)
        const dy = cy - Math.cos(displayAngle) * (r - 16)
        ctx.fillText(label, dx, dy)
      }

      // 指针 (三角形指向北)
      const camDir = new THREE.Vector3()
      camera.getWorldDirection(camDir)
      const camAngle = Math.atan2(camDir.x, camDir.z)
      const needleAngle = -camAngle // 北的方向

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(needleAngle)
      ctx.beginPath()
      ctx.moveTo(0, -r + 12)
      ctx.lineTo(-6, -r + 22)
      ctx.lineTo(6, -r + 22)
      ctx.closePath()
      ctx.fillStyle = '#ff4444'
      ctx.fill()
      // 南端
      ctx.beginPath()
      ctx.moveTo(0, r - 12)
      ctx.lineTo(-4, r - 22)
      ctx.lineTo(4, r - 22)
      ctx.closePath()
      ctx.fillStyle = '#888888'
      ctx.fill()
      ctx.restore()
    }

    let animId: number
    function loop() {
      draw()
      animId = requestAnimationFrame(loop)
    }
    loop()

    return () => cancelAnimationFrame(animId)
  }, [camera])

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-4 right-4 z-10"
      style={{ width: 80, height: 80 }}
    />
  )
}
