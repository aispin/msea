import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { COLORS, DIMENSIONS, ZONE_OFFSETS } from '../config/house'

interface CompassProps { camera: THREE.Camera }

function hexToCss(hex: number): string { return `#${hex.toString(16).padStart(6, '0')}` }
function hexToRgba(hex: number, alpha: number): string {
  const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff
  return `rgba(${r},${g},${b},${alpha})`
}

const WL = 0.15
const centerX = (WL + DIMENSIONS.houseWidth + WL) / 2
const centerZ = ZONE_OFFSETS.totalLength / 2

/** 红色指针固定朝上, 表盘随镜头位置旋转(与建筑方向一致) */
export default function Compass({ camera }: CompassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const size = 100
    canvas.width = size * 2; canvas.height = size * 2
    const cx = size, cy = size, r = size - 10

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(COLORS.compassBg, 0.85); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke()

      // 相机位置相对建筑中心的方位角 → 镜头朝向 = 方位角 + π
      const camAngle = Math.atan2(camera.position.x - centerX, camera.position.z - centerZ) + Math.PI

      const dirs: [string, number][] = [['N', -Math.PI/4], ['E', Math.PI/4], ['S', 3*Math.PI/4], ['W', -3*Math.PI/4]]
      ctx.fillStyle = hexToCss(COLORS.labelText)
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      for (const [label, angle] of dirs) {
        const a = angle - camAngle
        ctx.fillText(label, cx + Math.sin(a)*(r-18), cy - Math.cos(a)*(r-18))
      }

      ctx.save(); ctx.translate(cx, cy)
      const nl = r - 12
      ctx.strokeStyle = hexToCss(COLORS.compassNeedle); ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -nl); ctx.stroke()
      ctx.fillStyle = hexToCss(COLORS.compassNeedle)
      ctx.beginPath(); ctx.moveTo(0, -nl); ctx.lineTo(-7, -nl+14); ctx.lineTo(7, -nl+14); ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill()
      ctx.restore()
    }

    let id: number
    function loop() { draw(); id = requestAnimationFrame(loop) }
    loop()
    return () => cancelAnimationFrame(id)
  }, [camera])

  return <canvas ref={canvasRef} className="absolute top-4 right-4 z-10" style={{ width:100, height:100 }} />
}
