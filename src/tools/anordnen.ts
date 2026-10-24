import type { BoundingBox, KomponentenObjekt, Point } from '../document-model'
import { getBoundingBox, unionBoundingBox } from '../document-model'
import { t } from '../sprache'

export type AusrichtenModus =
  'oben' | 'unten' | 'links' | 'rechts' | 'horizontal-zentriert' | 'vertikal-zentriert'

export const AUSRICHTEN_OPTIONEN: readonly {
  readonly modus: AusrichtenModus
  readonly label: string
}[] = (
  [
    ['oben', 'werkzeuge.anordnen.oben'],
    ['unten', 'werkzeuge.anordnen.unten'],
    ['links', 'werkzeuge.anordnen.links'],
    ['rechts', 'werkzeuge.anordnen.rechts'],
    ['horizontal-zentriert', 'werkzeuge.anordnen.horizontal'],
    ['vertikal-zentriert', 'werkzeuge.anordnen.vertikal'],
  ] as const
).map(([modus, schluessel]) => ({
  modus,
  get label() {
    return t(schluessel)
  },
}))

function kanteZuKanteAbstand(a: BoundingBox, b: BoundingBox): number {
  const dx = Math.max(a.min.x - b.max.x, b.min.x - a.max.x, 0)
  const dy = Math.max(a.min.y - b.max.y, b.min.y - a.max.y, 0)
  return Math.hypot(dx, dy)
}

export function kleinsterClusterAbstand(komponenten: KomponentenObjekt[]): number {
  if (komponenten.length < 2) return 0
  const boxen = komponenten.map(getBoundingBox)
  let minimum = Infinity
  for (let i = 0; i < boxen.length; i++) {
    for (let j = i + 1; j < boxen.length; j++) {
      minimum = Math.min(minimum, kanteZuKanteAbstand(boxen[i], boxen[j]))
    }
  }
  return minimum === Infinity ? 0 : minimum
}

export function berechneAusrichtung(
  komponenten: KomponentenObjekt[],
  modus: AusrichtenModus,
): Map<string, Point> {
  const ergebnis = new Map<string, Point>()
  if (komponenten.length < 2) return ergebnis

  const eintraege = komponenten.map((k) => ({ k, bb: getBoundingBox(k) }))
  const gesamt = eintraege.reduce<BoundingBox | null>(
    (acc, { bb }) => (acc ? unionBoundingBox(acc, bb) : bb),
    null,
  )
  if (!gesamt) return ergebnis
  const zielY = (gesamt.min.y + gesamt.max.y) / 2
  const zielX = (gesamt.min.x + gesamt.max.x) / 2

  for (const { k, bb } of eintraege) {
    switch (modus) {
      case 'oben':
        ergebnis.set(k.id, { x: k.position.x, y: k.position.y + (gesamt.max.y - bb.max.y) })
        break
      case 'unten':
        ergebnis.set(k.id, { x: k.position.x, y: k.position.y + (gesamt.min.y - bb.min.y) })
        break
      case 'links':
        ergebnis.set(k.id, { x: k.position.x + (gesamt.min.x - bb.min.x), y: k.position.y })
        break
      case 'rechts':
        ergebnis.set(k.id, { x: k.position.x + (gesamt.max.x - bb.max.x), y: k.position.y })
        break
      case 'horizontal-zentriert': {
        const bbMitteY = (bb.min.y + bb.max.y) / 2
        ergebnis.set(k.id, { x: k.position.x, y: k.position.y + (zielY - bbMitteY) })
        break
      }
      case 'vertikal-zentriert': {
        const bbMitteX = (bb.min.x + bb.max.x) / 2
        ergebnis.set(k.id, { x: k.position.x + (zielX - bbMitteX), y: k.position.y })
        break
      }
    }
  }
  return ergebnis
}

export function berechneVerteilungHorizontal(
  komponenten: KomponentenObjekt[],
  ueberschreibungAbstand?: number,
): Map<string, Point> {
  const ergebnis = new Map<string, Point>()
  if (komponenten.length < 2) return ergebnis
  const minAbstand = ueberschreibungAbstand ?? kleinsterClusterAbstand(komponenten)
  const sortiert = [...komponenten].sort((a, b) => a.position.x - b.position.x)
  let kante = getBoundingBox(sortiert[0]).max.x
  for (let i = 1; i < sortiert.length; i++) {
    const k = sortiert[i]
    const bb = getBoundingBox(k)
    const breite = bb.max.x - bb.min.x
    const neueMinX = kante + minAbstand
    ergebnis.set(k.id, { x: k.position.x + (neueMinX - bb.min.x), y: k.position.y })
    kante = neueMinX + breite
  }
  return ergebnis
}

export function berechneVerteilungVertikal(
  komponenten: KomponentenObjekt[],
  ueberschreibungAbstand?: number,
): Map<string, Point> {
  const ergebnis = new Map<string, Point>()
  if (komponenten.length < 2) return ergebnis
  const minAbstand = ueberschreibungAbstand ?? kleinsterClusterAbstand(komponenten)
  const sortiert = [...komponenten].sort((a, b) => a.position.y - b.position.y)
  let kante = getBoundingBox(sortiert[0]).max.y
  for (let i = 1; i < sortiert.length; i++) {
    const k = sortiert[i]
    const bb = getBoundingBox(k)
    const hoehe = bb.max.y - bb.min.y
    const neueMinY = kante + minAbstand
    ergebnis.set(k.id, { x: k.position.x, y: k.position.y + (neueMinY - bb.min.y) })
    kante = neueMinY + hoehe
  }
  return ergebnis
}

function kleinsteBoundingBoxDimension(komponenten: KomponentenObjekt[]): number {
  let minimum = Infinity
  for (const k of komponenten) {
    const bb = getBoundingBox(k)
    minimum = Math.min(minimum, bb.max.x - bb.min.x, bb.max.y - bb.min.y)
  }
  return minimum === Infinity ? 0 : minimum
}

function clustereAchse(
  komponenten: KomponentenObjekt[],
  toleranz: number,
  achse: 'x' | 'y',
): Map<string, number> {
  const wert = (k: KomponentenObjekt) => (achse === 'x' ? k.position.x : k.position.y)
  const sortiert = [...komponenten].sort((a, b) => wert(a) - wert(b))
  const ergebnis = new Map<string, number>()
  let clusterIndex = 0
  let vorherigeWert = wert(sortiert[0])
  ergebnis.set(sortiert[0].id, 0)
  for (let i = 1; i < sortiert.length; i++) {
    const aktuellerWert = wert(sortiert[i])
    if (aktuellerWert - vorherigeWert > toleranz) clusterIndex++
    ergebnis.set(sortiert[i].id, clusterIndex)
    vorherigeWert = aktuellerWert
  }
  return ergebnis
}

export function ermittleGridStandardwerte(komponenten: KomponentenObjekt[]): {
  ursprung: Point
  abstand: number
} {
  if (komponenten.length === 0) return { ursprung: { x: 0, y: 0 }, abstand: 0 }
  const boxen = komponenten.map(getBoundingBox)
  return {
    ursprung: {
      x: Math.min(...boxen.map((bb) => bb.min.x)),
      y: Math.min(...boxen.map((bb) => bb.min.y)),
    },
    abstand: kleinsterClusterAbstand(komponenten),
  }
}

export function berechneVerteilungGrid(
  komponenten: KomponentenObjekt[],
  ueberschreibung?: { ursprung?: Point; abstandX?: number; abstandY?: number },
): Map<string, Point> {
  const ergebnis = new Map<string, Point>()
  if (komponenten.length < 2) return ergebnis

  const boxen = new Map(komponenten.map((k) => [k.id, getBoundingBox(k)] as const))
  const standard = ermittleGridStandardwerte(komponenten)
  const abstandX = ueberschreibung?.abstandX ?? standard.abstand
  const abstandY = ueberschreibung?.abstandY ?? standard.abstand
  const toleranz = kleinsteBoundingBoxDimension(komponenten) * 0.5

  const zeilenIndex = clustereAchse(komponenten, toleranz, 'y')
  const spaltenIndex = clustereAchse(komponenten, toleranz, 'x')
  const anzahlZeilen = Math.max(...zeilenIndex.values()) + 1
  const anzahlSpalten = Math.max(...spaltenIndex.values()) + 1

  const zeilenHoehe = new Array<number>(anzahlZeilen).fill(0)
  const spaltenBreite = new Array<number>(anzahlSpalten).fill(0)
  for (const k of komponenten) {
    const bb = boxen.get(k.id)!
    const zeile = zeilenIndex.get(k.id)!
    const spalte = spaltenIndex.get(k.id)!
    zeilenHoehe[zeile] = Math.max(zeilenHoehe[zeile], bb.max.y - bb.min.y)
    spaltenBreite[spalte] = Math.max(spaltenBreite[spalte], bb.max.x - bb.min.x)
  }

  const zeilenMitteY = new Array<number>(anzahlZeilen).fill(0)
  let unterkante = ueberschreibung?.ursprung?.y ?? standard.ursprung.y
  for (let z = 0; z < anzahlZeilen; z++) {
    zeilenMitteY[z] = unterkante + zeilenHoehe[z] / 2
    unterkante += zeilenHoehe[z] + abstandY
  }
  const spaltenMitteX = new Array<number>(anzahlSpalten).fill(0)
  let linkeKante = ueberschreibung?.ursprung?.x ?? standard.ursprung.x
  for (let s = 0; s < anzahlSpalten; s++) {
    spaltenMitteX[s] = linkeKante + spaltenBreite[s] / 2
    linkeKante += spaltenBreite[s] + abstandX
  }

  for (const k of komponenten) {
    const zeile = zeilenIndex.get(k.id)!
    const spalte = spaltenIndex.get(k.id)!
    ergebnis.set(k.id, { x: spaltenMitteX[spalte], y: zeilenMitteY[zeile] })
  }
  return ergebnis
}
