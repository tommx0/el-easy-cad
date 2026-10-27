import type { Zeichenflaeche } from '../document-model'
import { zeichenflaecheBoundingBox } from '../document-model'
import type { Uebersetzer } from '../sprache'
import type { ViewTransform } from './view-transform'

export interface NichtDruckbereichDarstellung {
  farbe: string
  deckkraft: number
}

export const STANDARD_NICHT_DRUCKBEREICH: NichtDruckbereichDarstellung = {
  farbe: '#646464',
  deckkraft: 0.25,
}

export function zeichneNichtDruckbereich(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  zeichenflaeche: Zeichenflaeche,
  breite: number,
  hoehe: number,
  darstellung: NichtDruckbereichDarstellung = STANDARD_NICHT_DRUCKBEREICH,
) {
  if (darstellung.deckkraft <= 0) return
  const bb = zeichenflaecheBoundingBox(zeichenflaeche)
  const oben = view.worldToScreen({ x: bb.min.x, y: bb.max.y })
  const unten = view.worldToScreen({ x: bb.max.x, y: bb.min.y })

  ctx.save()
  ctx.globalAlpha = Math.min(1, darstellung.deckkraft)
  ctx.fillStyle = darstellung.farbe
  ctx.beginPath()
  ctx.rect(0, 0, breite, hoehe)
  ctx.rect(oben.x, oben.y, unten.x - oben.x, unten.y - oben.y)
  ctx.fill('evenodd')
  ctx.restore()
}

export function zeichneZeichenflaecheRahmen(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  zeichenflaeche: Zeichenflaeche,
  tp: Uebersetzer,
) {
  const bb = zeichenflaecheBoundingBox(zeichenflaeche)
  const oben = view.worldToScreen({ x: bb.min.x, y: bb.max.y })
  const unten = view.worldToScreen({ x: bb.max.x, y: bb.min.y })
  const breitePx = unten.x - oben.x
  const hoehePx = unten.y - oben.y

  ctx.save()
  ctx.strokeStyle = '#5b7dd9'
  ctx.lineWidth = 1.5
  ctx.setLineDash([7, 5])
  ctx.strokeRect(oben.x, oben.y, breitePx, hoehePx)

  const zoomFaktor = view.zoomFaktor()
  ctx.setLineDash([])
  ctx.fillStyle = '#5b7dd9'
  ctx.font = `${12 * zoomFaktor}px sans-serif`
  ctx.textBaseline = 'bottom'
  const label = tp(
    zeichenflaeche.ausrichtung === 'hoch'
      ? 'druck.zeichenflaeche.hoch'
      : 'druck.zeichenflaeche.quer',
    {
      format: zeichenflaeche.papierformat,
      nenner: String(Math.round(zeichenflaeche.massstabNenner)),
    },
  )
  ctx.fillText(label, oben.x, oben.y - 4 * zoomFaktor)
  ctx.restore()
}
