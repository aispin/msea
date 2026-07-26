import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { COLORS } from '../config/house'

interface CompassProps {
  camera: THREE.Camera
}

function hexToCss(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`
}

function hexToRgba(hex: number, alpha: number): string {
  const r = (hex >> 16) & 0xff
  const g = (hex >> 8) & 0xff
  const b = hex & 0xff
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
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

    // 复用 Vector3 以避免每帧分配
    const camDir = new THREE.Vector3()

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 背景圆盘
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(COLORS.compassBg, 0.85)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 2
      ctx.stroke()

      // 计算相机方向 (XZ平面投影, +Z=0, +X=PI/2)
      camera.getWorldDirection(camDir)
      const camAngle = Math.atan2(camDir.x, camDir.z)

      // 方向标记 N/E/S/W
      const dirs = [
        { label: 'N', angle: 0 },
        { label: 'E', angle: Math.PI / 2 },
        { label: 'S', angle: Math.PI },
        { label: 'W', angle: -Math.PI / 2 },
      ]
      ctx.fillStyle = hexToCss(COLORS.labelText)
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const { label, angle } of dirs) {
        const worldAngle = angle // N在世界中对应+Z方向
        const displayAngle = worldAngle - camAngle

        const dx = cx + Math.sin(displayAngle) * (r - 16)
        const dy = cy - Math.cos(displayAngle) * (r - 16)
        ctx.fillText(label, dx, dy)
      }

      // 指针 (红色三角形指向北, 灰色指向南)
      const needleAngle = -camAngle

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(needleAngle)
      ctx.beginPath()
      ctx.moveTo(0, -r + 12)
      ctx.lineTo(-6, -r + 22)
      ctx.lineTo(6, -r + 22)
      ctx.closePath()
      ctx.fillStyle = hexToCss(COLORS.compassNeedle)
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
