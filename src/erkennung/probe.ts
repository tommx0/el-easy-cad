import type { BoundingBox, Point } from '../document-model'
import { boundingBoxFromPoints, boundingBoxUeberlappt } from '../document-model'
import type { Plansegment } from './plansegment'
import { findeAchsstuecke } from './wand-paare'
import type { WandToleranzen } from './wand-toleranzen'

const PROBE_STAERKE_MIN = 0.02
const PROBE_STAERKE_MAX = 1

export type Probenart = 'wand' | 'tuer' | 'fenster'

export interface Probemessung {
  art: Probenart
  staerke: number | null
  farbe: string | null
}

export function messeProbe(
  segmente: readonly Plansegment[],
  bereich: BoundingBox,
  toleranzen: WandToleranzen,
  art: Probenart = 'wand',
): Probemessung {
  const farbe = haeufigsteFarbe(segmente, bereich)
  if (art === 'wand') {
    return { art, staerke: messeWandstaerke(segmente, bereich, toleranzen), farbe }
  }
  const breite = bereich.max.x - bereich.min.x
  const hoehe = bereich.max.y - bereich.min.y
  const mass = Math.max(breite, hoehe)
  return { art, staerke: mass > 0 ? mass : null, farbe }
}

function haeufigsteFarbe(segmente: readonly Plansegment[], bereich: BoundingBox): string | null {
  const proFarbe = new Map<string, number>()
  for (const segment of segmente) {
    if (!segment.farbe) continue
    if (!boundingBoxUeberlappt(boundingBoxFromPoints([segment.a, segment.b]), bereich)) continue
    const laenge = Math.hypot(segment.b.x - segment.a.x, segment.b.y - segment.a.y)
    proFarbe.set(segment.farbe, (proFarbe.get(segment.farbe) ?? 0) + laenge)
  }
  let beste: { farbe: string; laenge: number } | null = null
  for (const [farbe, laenge] of proFarbe) {
    if (!beste || laenge > beste.laenge) beste = { farbe, laenge }
  }
  return beste?.farbe ?? null
}

export function messeWandstaerke(
  segmente: readonly Plansegment[],
  bereich: BoundingBox,
  toleranzen: WandToleranzen,
): number | null {
  const kandidaten = segmente.filter((s) =>
    boundingBoxUeberlappt(boundingBoxFromPoints([s.a, s.b]), bereich),
  )
  if (kandidaten.length < 2) return null

  const achsen = findeAchsstuecke(
    kandidaten,
    {
      staerkeMin: PROBE_STAERKE_MIN,
      staerkeMax: PROBE_STAERKE_MAX,
      mindestUeberlappung: 0.05,
    },
    toleranzen,
  )

  let bestes: { staerke: number; laenge: number } | null = null
  for (const achse of achsen) {
    const laenge = laengeImBereich(achse.a, achse.b, bereich)
    if (laenge <= 0) continue
    if (!bestes || laenge > bestes.laenge) bestes = { staerke: achse.staerke, laenge }
  }
  return bestes?.staerke ?? null
}

function laengeImBereich(a: Point, b: Point, bereich: BoundingBox): number {
  const streckenBox = boundingBoxFromPoints([a, b])
  if (!boundingBoxUeberlappt(streckenBox, bereich)) return 0
  const breite =
    Math.min(streckenBox.max.x, bereich.max.x) - Math.max(streckenBox.min.x, bereich.min.x)
  const hoehe =
    Math.min(streckenBox.max.y, bereich.max.y) - Math.max(streckenBox.min.y, bereich.min.y)
  return Math.max(breite, hoehe)
}
