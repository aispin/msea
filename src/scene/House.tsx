import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createWalls } from '../builders/walls'
import { createRoof } from '../builders/roof'
import { createDoor } from '../builders/door'
import { createAllWindows } from '../builders/windows'
import { createAttic } from '../builders/attic'
import { createEnvironment } from '../builders/environment'
import { createLabels } from '../builders/labels'

interface HouseProps {
  scene: THREE.Scene
}

export default function House({ scene }: HouseProps) {
  const houseGroup = useRef<THREE.Group | null>(null)

  useEffect(() => {
    const group = new THREE.Group()

    group.add(createWalls())
    group.add(createRoof())
    group.add(createDoor())
    group.add(createAllWindows())
    group.add(createAttic())
    group.add(createEnvironment())
    group.add(createLabels())

    scene.add(group)
    houseGroup.current = group

    return () => {
      scene.remove(group)
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })
    }
  }, [scene])

  return null
}
