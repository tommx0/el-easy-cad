import type { BoundingBox, DxfEntity, Point } from '../document-model'

export interface VorschauAbbildung {
  skala: number
  zuPixel(p: Point): Point
}

const RAND_PX = 8

export function berechneVorschauAbbildung(
  huelle: BoundingBox,
  breite: number,
  hoehe: number,
): VorschauAbbildung {
  const w = Math.max(huelle.max.x - huelle.min.x, 1e-6)
  const h = Math.max(huelle.max.y - huelle.min.y, 1e-6)
  const skala = Math.min((breite - 2 * RAND_PX) / w, (hoehe - 2 * RAND_PX) / h)
  const ox = (breite - w * skala) / 2
  const oy = (hoehe - h * skala) / 2
  return {
    skala,
    zuPixel: (p) => ({
      x: ox + (p.x - huelle.min.x) * skala,
      y: oy + (huelle.max.y - p.y) * skala,
    }),
  }
}

export function zeichneIfcVorschau(
  ctx: CanvasRenderingContext2D,
  entities: readonly DxfEntity[],
  huelle: BoundingBox,
  breite: number,
  hoehe: number,
): void {
  const abbildung = berechneVorschauAbbildung(huelle, breite, hoehe)
  ctx.save()
  ctx.strokeStyle = '#3d4654'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (const e of entities) {
    if (e.type === 'linie') {
      const a = abbildung.zuPixel(e.start)
      const b = abbildung.zuPixel(e.ende)
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
    } else if (e.type === 'polylinie' && e.punkte.length > 0) {
      const erster = abbildung.zuPixel(e.punkte[0])
      ctx.moveTo(erster.x, erster.y)
      for (const p of e.punkte.slice(1)) {
        const q = abbildung.zuPixel(p)
        ctx.lineTo(q.x, q.y)
      }
      if (e.geschlossen) ctx.lineTo(erster.x, erster.y)
    } else if (e.type === 'kreis' || e.type === 'bogen') {
      const m = abbildung.zuPixel(e.mittelpunkt)
      const r = e.radius * abbildung.skala
      const [von, bis] = e.type === 'kreis' ? [0, Math.PI * 2] : [-e.endWinkel, -e.startWinkel]
      ctx.moveTo(m.x + r * Math.cos(von), m.y + r * Math.sin(von))
      ctx.arc(m.x, m.y, r, von, bis)
    }
  }
  ctx.stroke()
  ctx.restore()
}
