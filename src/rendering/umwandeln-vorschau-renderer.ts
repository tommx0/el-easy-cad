import type { Objekt } from '../document-model'
import type { ViewTransform } from './view-transform'

export const UMWANDELN_VORSCHAU_FARBE = '#e8590c'

export function zeichneUmwandelnVorschau(
  g: CanvasRenderingContext2D,
  view: ViewTransform,
  objekte: readonly Objekt[],
) {
  if (objekte.length === 0) return
  g.save()
  g.strokeStyle = UMWANDELN_VORSCHAU_FARBE
  g.lineWidth = 1.5
  g.beginPath()
  for (const o of objekte) {
    if (o.type === 'linie') {
      const a = view.worldToScreen(o.start)
      const b = view.worldToScreen(o.ende)
      g.moveTo(a.x, a.y)
      g.lineTo(b.x, b.y)
    } else if (o.type === 'polylinie') {
      o.punkte.forEach((p, i) => {
        const s = view.worldToScreen(p)
        if (i === 0) g.moveTo(s.x, s.y)
        else g.lineTo(s.x, s.y)
      })
      if (o.geschlossen && o.punkte.length > 2) {
        const s = view.worldToScreen(o.punkte[0])
        g.lineTo(s.x, s.y)
      }
    } else if (o.type === 'kreis' || o.type === 'bogen') {
      const m = view.worldToScreen(o.mittelpunkt)
      const r = view.laengeToScreen(o.radius)
      const [von, bis] = o.type === 'kreis' ? [0, Math.PI * 2] : [-o.endWinkel, -o.startWinkel]
      g.moveTo(m.x + r * Math.cos(von), m.y + r * Math.sin(von))
      g.arc(m.x, m.y, r, von, bis)
    }
  }
  g.stroke()
  g.restore()
}
