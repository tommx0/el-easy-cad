export interface CanvasLayerSet {
  hintergrund: HTMLCanvasElement
  inhalt: HTMLCanvasElement
  overlay: HTMLCanvasElement
}

export interface CanvasContextSet {
  hintergrund: CanvasRenderingContext2D
  inhalt: CanvasRenderingContext2D
  overlay: CanvasRenderingContext2D
}

export function getContexts(layers: CanvasLayerSet): CanvasContextSet {
  const hintergrund = layers.hintergrund.getContext('2d')
  const inhalt = layers.inhalt.getContext('2d')
  const overlay = layers.overlay.getContext('2d')
  if (!hintergrund || !inhalt || !overlay) {
    throw new Error('Canvas 2D Context konnte nicht erstellt werden.')
  }
  return { hintergrund, inhalt, overlay }
}

export function resizeLayers(layers: CanvasLayerSet, breite: number, hoehe: number): void {
  const dpr = window.devicePixelRatio || 1
  for (const canvas of [layers.hintergrund, layers.inhalt, layers.overlay]) {
    const zielBreite = Math.max(1, Math.round(breite * dpr))
    const zielHoehe = Math.max(1, Math.round(hoehe * dpr))
    if (canvas.width !== zielBreite || canvas.height !== zielHoehe) {
      canvas.width = zielBreite
      canvas.height = zielHoehe
    }
    canvas.style.width = `${breite}px`
    canvas.style.height = `${hoehe}px`
  }
}

export function pruepareContext(ctx: CanvasRenderingContext2D): void {
  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
