import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createWalls } from '../builders/walls'
import { createRoof } from '../builders/roof'
import { createDoor } from '../builders/door'
import { createAllWindows } from '../builders/windows'
import { createAttic } from '../builders/attic'
import { createEnvironment } from '../builders/environment'
import { createLabels } from '../builders/labels'
import { createDimensions } from '../builders/dimensions'

interface HouseProps {
  scene: THREE.Scene
}

export default function House({ scene }: HouseProps) {
  const houseGroup = useRef<THREE.Group | null>(null)
  const dimGroup = useRef<THREE.Group | null>(null)

  useEffect(() => {
    const group = new THREE.Group()

    group.add(createWalls())
    group.add(createRoof())
    group.add(createDoor())
    group.add(createAllWindows())
    group.add(createAttic())
    group.add(createEnvironment())
    group.add(createLabels())

    // 尺寸标注 — 默认隐藏, D键切换
    const dims = createDimensions()
    dims.visible = false
    dims.userData.isDimGroup = true
    group.add(dims)
    dimGroup.current = dims

    scene.add(group)
    houseGroup.current = group

    return () => {
      scene.remove(group)
      group.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Sprite) {
          child.geometry?.dispose()
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material]
          materials.forEach(m => {
            m?.dispose()
            for (const key of Object.keys(m ?? {})) {
              if ((m as any)[key]?.isTexture) (m as any)[key].dispose()
            }
          })
        }
      })
    }
  }, [scene])

  return null
}
