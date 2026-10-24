import type { Objekt, ObjektTyp, Point, WandObjekt } from '../document-model'
import { getBoundingBox } from '../document-model'

const RELEVANTE_TYPEN: ReadonlySet<ObjektTyp> = new Set<ObjektTyp>([
  'wand',
  'komponente',
  'treppe',
  'kabelschacht',
])

export type AbstandsRichtung = 'oben' | 'unten' | 'links' | 'rechts'

export interface Abstandsanzeige {
  richtung: AbstandsRichtung
  entfernungMeter: number
  vonPunkt: Point
  zuPunkt: Point
}

interface Kandidat {
  entfernung: number
  zuPunkt: Point
}

function besser(bisher: Kandidat | null, neu: Kandidat): Kandidat {
  return !bisher || neu.entfernung < bisher.entfernung ? neu : bisher
}

function pruefeWandSegment(
  a: Point,
  b: Point,
  staerke: number,
  position: Point,
  halbBreite: number,
  halbHoehe: number,
  oben: Kandidat | null,
  unten: Kandidat | null,
  links: Kandidat | null,
  rechts: Kandidat | null,
): [Kandidat | null, Kandidat | null, Kandidat | null, Kandidat | null] {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (dx === 0 && dy === 0) return [oben, unten, links, rechts]
  const waagerecht = Math.abs(dx) >= Math.abs(dy)
  if (waagerecht) {
    const xMin = Math.min(a.x, b.x)
    const xMax = Math.max(a.x, b.x)
    if (xMax < position.x - halbBreite || xMin > position.x + halbBreite) {
      return [oben, unten, links, rechts]
    }
    const t = dx === 0 ? 0.5 : (position.x - a.x) / dx
    const yMitte = a.y + t * dy
    const yOben = yMitte + staerke / 2
    const yUnten = yMitte - staerke / 2
    const compOben = position.y + halbHoehe
    const compUnten = position.y - halbHoehe
    if (compUnten >= yOben) {
      unten = besser(unten, { entfernung: compUnten - yOben, zuPunkt: { x: position.x, y: yOben } })
    } else if (compOben <= yUnten) {
      oben = besser(oben, { entfernung: yUnten - compOben, zuPunkt: { x: position.x, y: yUnten } })
    }
  } else {
    const yMin = Math.min(a.y, b.y)
    const yMax = Math.max(a.y, b.y)
    if (yMax < position.y - halbHoehe || yMin > position.y + halbHoehe) {
      return [oben, unten, links, rechts]
    }
    const t = dy === 0 ? 0.5 : (position.y - a.y) / dy
    const xMitte = a.x + t * dx
    const xRechts = xMitte + staerke / 2
    const xLinks = xMitte - staerke / 2
    const compRechts = position.x + halbBreite
    const compLinks = position.x - halbBreite
    if (compLinks >= xRechts) {
      links = besser(links, {
        entfernung: compLinks - xRechts,
        zuPunkt: { x: xRechts, y: position.y },
      })
    } else if (compRechts <= xLinks) {
      rechts = besser(rechts, {
        entfernung: xLinks - compRechts,
        zuPunkt: { x: xLinks, y: position.y },
      })
    }
  }
  return [oben, unten, links, rechts]
}

function pruefeBoundingBox(
  objekt: Objekt,
  position: Point,
  halbBreite: number,
  halbHoehe: number,
  oben: Kandidat | null,
  unten: Kandidat | null,
  links: Kandidat | null,
  rechts: Kandidat | null,
): [Kandidat | null, Kandidat | null, Kandidat | null, Kandidat | null] {
  const bb = getBoundingBox(objekt)
  const compOben = position.y + halbHoehe
  const compUnten = position.y - halbHoehe
  const compRechts = position.x + halbBreite
  const compLinks = position.x - halbBreite

  if (bb.min.y <= compOben && bb.max.y >= compUnten) {
    if (compLinks >= bb.max.x) {
      links = besser(links, {
        entfernung: compLinks - bb.max.x,
        zuPunkt: { x: bb.max.x, y: position.y },
      })
    } else if (compRechts <= bb.min.x) {
      rechts = besser(rechts, {
        entfernung: bb.min.x - compRechts,
        zuPunkt: { x: bb.min.x, y: position.y },
      })
    }
  }
  if (bb.min.x <= compRechts && bb.max.x >= compLinks) {
    if (compUnten >= bb.max.y) {
      unten = besser(unten, {
        entfernung: compUnten - bb.max.y,
        zuPunkt: { x: position.x, y: bb.max.y },
      })
    } else if (compOben <= bb.min.y) {
      oben = besser(oben, {
        entfernung: bb.min.y - compOben,
        zuPunkt: { x: position.x, y: bb.min.y },
      })
    }
  }
  return [oben, unten, links, rechts]
}

export function ermittleAbstaende(
  position: Point,
  halbBreite: number,
  halbHoehe: number,
  objekte: readonly Objekt[],
): Abstandsanzeige[] {
  let oben: Kandidat | null = null
  let unten: Kandidat | null = null
  let links: Kandidat | null = null
  let rechts: Kandidat | null = null

  for (const objekt of objekte) {
    if (!RELEVANTE_TYPEN.has(objekt.type)) continue
    if (objekt.type === 'wand') {
      const wand = objekt as WandObjekt
      for (let i = 0; i < wand.punkte.length - 1; i++) {
        ;[oben, unten, links, rechts] = pruefeWandSegment(
          wand.punkte[i],
          wand.punkte[i + 1],
          wand.staerke,
          position,
          halbBreite,
          halbHoehe,
          oben,
          unten,
          links,
          rechts,
        )
      }
      continue
    }
    ;[oben, unten, links, rechts] = pruefeBoundingBox(
      objekt,
      position,
      halbBreite,
      halbHoehe,
      oben,
      unten,
      links,
      rechts,
    )
  }

  const ergebnisse: Abstandsanzeige[] = []
  const eintraege: [AbstandsRichtung, Kandidat | null, Point][] = [
    ['oben', oben, { x: position.x, y: position.y + halbHoehe }],
    ['unten', unten, { x: position.x, y: position.y - halbHoehe }],
    ['links', links, { x: position.x - halbBreite, y: position.y }],
    ['rechts', rechts, { x: position.x + halbBreite, y: position.y }],
  ]
  for (const [richtung, kandidat, vonPunkt] of eintraege) {
    if (!kandidat) continue
    ergebnisse.push({
      richtung,
      entfernungMeter: kandidat.entfernung,
      vonPunkt,
      zuPunkt: kandidat.zuPunkt,
    })
  }
  return ergebnisse
}
