import * as THREE from 'three'
import { COLORS } from '../config/house'

export function createWallMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: COLORS.wall,
    roughness: 0.85,
    metalness: 0.0,
  })
}

export function createRoofMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: COLORS.roof,
    roughness: 0.7,
    metalness: 0.1,
  })
}

export function createWoodMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: COLORS.door,
    roughness: 0.6,
    metalness: 0.05,
  })
}

export function createAtticWoodMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: COLORS.atticWood,
    roughness: 0.7,
    metalness: 0.0,
  })
}

export function createGlassMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: COLORS.windowGlass,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.4,
  })
}

export function createGroundMaterial(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0.0,
  })
}

export function createTranslucentMaterial(
  color: number,
  opacity: number,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0.0,
    transparent: true,
    opacity,
    depthWrite: false,
  })
}

export function createParapetMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: COLORS.parapet,
    roughness: 0.8,
    metalness: 0.0,
  })
}

export function createDoorRingMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: COLORS.doorRing,
    roughness: 0.3,
    metalness: 0.9,
  })
}
