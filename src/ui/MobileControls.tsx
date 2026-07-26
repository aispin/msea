// src/ui/MobileControls.tsx
import { useEffect, useRef } from 'react'
import nipplejs from 'nipplejs'

interface Props {
  inTour: boolean
  onMove: (dx: number, dy: number) => void
  onLook: (dx: number, dy: number) => void
  onToggle: () => void
}

export default function MobileControls({ inTour, onMove, onLook, onToggle }: Props) {
  const joystickRef = useRef<HTMLDivElement>(null)
  const lookRef = useRef<HTMLDivElement>(null)
  const moveRef = useRef({ x: 0, y: 0 })
  const lookId = useRef<number>(0)

  useEffect(() => {
    if (!inTour || !joystickRef.current) return

    const nipple = nipplejs.create({
      zone: joystickRef.current,
      mode: 'static',
      position: { left: '25%', bottom: '25%' },
      color: 'rgba(255,255,255,0.5)',
      size: 120,
    })

    nipple.on('move', (_: any, data: any) => {
      moveRef.current = { x: data.vector.x, y: -data.vector.y }
    })
    nipple.on('end', () => { moveRef.current = { x: 0, y: 0 } })

    // move loop
    lookId.current = window.setInterval(() => {
      onMove(moveRef.current.x, moveRef.current.y)
    }, 16)

    return () => {
      nipple.destroy()
      clearInterval(lookId.current)
    }
  }, [inTour, onMove])

  // 环顾触摸
  useEffect(() => {
    if (!inTour || !lookRef.current) return
    const el = lookRef.current
    let lastX = 0, lastY = 0

    const onTouchStart = (e: TouchEvent) => {
      lastX = e.touches[0].clientX
      lastY = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - lastX
      const dy = e.touches[0].clientY - lastY
      lastX = e.touches[0].clientX
      lastY = e.touches[0].clientY
      onLook(dx * 0.003, dy * 0.003)
    }

    el.addEventListener('touchstart', onTouchStart)
    el.addEventListener('touchmove', onTouchMove)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [inTour, onLook])

  if (!inTour) return null

  return (
    <>
      <div ref={joystickRef} className="absolute inset-0 z-20 pointer-events-none" />
      <div ref={lookRef} className="absolute right-0 top-0 bottom-0 w-1/2 z-20" />
      <button
        onClick={onToggle}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/60 text-white px-4 py-2 rounded-full text-sm"
      >
        退出漫游
      </button>
    </>
  )
}
