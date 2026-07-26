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
    const size = 100
    canvas.width = size * 2
    canvas.height = size * 2
    const cx = size
    const cy = size
    const r = size - 10

    const camDir = new THREE.Vector3()

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 背景圆盘
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(COLORS.compassBg, 0.85)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 2
      ctx.stroke()

      // 相机朝向 (XZ平面)
      camera.getWorldDirection(camDir)
      const camAngle = Math.atan2(camDir.x, camDir.z)

      // N/E/S/W 标签 (真实罗盘方向，与地面方向标识一致)
      // 建筑+Z=NE(45°), N在建筑坐标-π/4
      const dirs = [
        { label: 'N', angle: -Math.PI / 4 },
        { label: 'E', angle: Math.PI / 4 },
        { label: 'S', angle: 3 * Math.PI / 4 },
        { label: 'W', angle: -3 * Math.PI / 4 },
      ]
      ctx.fillStyle = hexToCss(COLORS.labelText)
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const { label, angle } of dirs) {
        const displayAngle = angle - camAngle
        const dx = cx + Math.sin(displayAngle) * (r - 18)
        const dy = cy - Math.cos(displayAngle) * (r - 18)
        ctx.fillText(label, dx, dy)
      }

      // 长指针 — 红端始终指向相机朝向(罗盘顶部0°)
      const needleAngle = 0

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(needleAngle)

      // 红色北指针 (粗线 + 箭头)
      const needleLen = r - 12
      ctx.strokeStyle = hexToCss(COLORS.compassNeedle)
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, -needleLen)
      ctx.stroke()

      // 箭头 (三角形)
      ctx.fillStyle = hexToCss(COLORS.compassNeedle)
      ctx.beginPath()
      ctx.moveTo(0, -needleLen)
      ctx.lineTo(-7, -needleLen + 14)
      ctx.lineTo(7, -needleLen + 14)
      ctx.closePath()
      ctx.fill()

      // 灰色南指针 (短线)
      const southLen = r * 0.35
      ctx.strokeStyle = '#888888'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, southLen)
      ctx.stroke()

      // 中心圆点
      ctx.fillStyle = hexToCss(COLORS.compassNeedle)
      ctx.beginPath()
      ctx.arc(0, 0, 4, 0, Math.PI * 2)
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
      style={{ width: 100, height: 100 }}
    />
  )
}
