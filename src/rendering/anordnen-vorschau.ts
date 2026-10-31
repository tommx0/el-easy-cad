import type { Blatt, BoundingBox, Objekt } from '../document-model'
import {
  abgeleitetePfadSegmente,
  inZeichenreihenfolge,
  sichtbareObjekteAufBlatt,
} from '../document-model'
import type { KomponentenRenderKontext } from './object-renderer'
import { ermittleKomponentenBeschriftungsRechteck, zeichneObjekt } from './object-renderer'
import { ViewTransform } from './view-transform'

export function zeichneAnordnenVorschau(
  ctx: CanvasRenderingContext2D,
  breitePx: number,
  hoehePx: number,
  blatt: Blatt,
  ausschnitt: BoundingBox,
  rahmen: KomponentenRenderKontext,
): void {
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, breitePx, hoehePx)
  const breite = Math.max(ausschnitt.max.x - ausschnitt.min.x, 1e-3)
  const hoehe = Math.max(ausschnitt.max.y - ausschnitt.min.y, 1e-3)
  const view = new ViewTransform()
  view.scale = Math.min(breitePx / breite, hoehePx / hoehe) * 0.9
  const mitte = {
    x: (ausschnitt.min.x + ausschnitt.max.x) / 2,
    y: (ausschnitt.min.y + ausschnitt.max.y) / 2,
  }
  view.offset = { x: breitePx / 2 - mitte.x * view.scale, y: hoehePx / 2 + mitte.y * view.scale }
  const sichtbar = sichtbareObjekteAufBlatt(blatt, blatt.objekte, rahmen.leitungsverlegungAus)
  for (const objekt of inZeichenreihenfolge(sichtbar, blatt.objekte)) {
    if (objekt.type === 'leitung' && objekt.trunkDurchgaenge.length > 0) {
      zeichneObjekt(
        ctx,
        view,
        { ...objekt, pfadSegmente: abgeleitetePfadSegmente(objekt, blatt.objekte) },
        rahmen,
      )
    } else {
      zeichneObjekt(ctx, view, objekt, rahmen)
    }
  }
  ctx.restore()
}

export function messeBeschriftungen(
  ctx: CanvasRenderingContext2D,
  objekte: readonly Objekt[],
  ids: ReadonlySet<string>,
  rahmen: KomponentenRenderKontext,
): Record<string, BoundingBox> {
  const view = new ViewTransform()
  const ergebnis: Record<string, BoundingBox> = {}
  for (const o of objekte) {
    if (o.type !== 'komponente' || !ids.has(o.id)) continue
    const r = ermittleKomponentenBeschriftungsRechteck(ctx, view, o, rahmen)
    if (!r) continue
    const a = view.screenToWorld({ x: r.x, y: r.y })
    const b = view.screenToWorld({ x: r.x + r.breite, y: r.y + r.hoehe })
    ergebnis[o.id] = {
      min: { x: Math.min(a.x, b.x) - o.position.x, y: Math.min(a.y, b.y) - o.position.y },
      max: { x: Math.max(a.x, b.x) - o.position.x, y: Math.max(a.y, b.y) - o.position.y },
    }
  }
  return ergebnis
}
