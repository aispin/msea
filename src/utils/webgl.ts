export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl')
      || canvas.getContext('webgl2')
    )
  }
  catch {
    return false
  }
}
