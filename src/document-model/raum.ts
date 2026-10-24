import type { Objekt, RaumObjekt } from './objekte'
import { neueObjektBasis, STANDARD_RAUM_SCHRIFTGROESSE, standardRaumName } from './objekte'
import { t, type Uebersetzer } from '../sprache'
import type { BoundingBox, Point } from './geometry'
import { pointInBoundingBox, pointInPolygon, boundingBoxFromPoints } from './geometry'
import { ermittleWandTeilstuecke } from './wand'
import { ermittleWandAnschluesse } from './wand-anschluss'

const RAUM_ZELLGROESSE_METER = 0.05

const RAUM_SUCHRADIUS_METER = 15

export interface RaumGeometrie {
  umriss: Point[]
  flaeche: number
  mittelpunkt: Point
}

interface WandBand {
  bbox: BoundingBox
  polygon: Point[]
}

function waendeAlsBaender(objekte: readonly Objekt[]): WandBand[] {
  const baender: WandBand[] = []
  for (const o of objekte) {
    if (o.type !== 'wand' || o.punkte.length < 2) continue
    for (const { aussen, innen } of ermittleWandTeilstuecke(
      o,
      [],
      ermittleWandAnschluesse(o, objekte),
    )) {
      const polygon = [...aussen, ...[...innen].reverse()]
      baender.push({ bbox: boundingBoxFromPoints(polygon), polygon })
    }
  }
  return baender
}

const HINDERNIS_EIMER_METER = 1

export interface RaumHindernisse {
  baender: WandBand[]
  eimer: Map<string, number[]>
}

export function ermittleRaumHindernisse(objekte: readonly Objekt[]): RaumHindernisse {
  const baender = waendeAlsBaender(objekte)
  const eimer = new Map<string, number[]>()
  baender.forEach((band, i) => {
    const x0 = Math.floor(band.bbox.min.x / HINDERNIS_EIMER_METER)
    const x1 = Math.floor(band.bbox.max.x / HINDERNIS_EIMER_METER)
    const y0 = Math.floor(band.bbox.min.y / HINDERNIS_EIMER_METER)
    const y1 = Math.floor(band.bbox.max.y / HINDERNIS_EIMER_METER)
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        const key = `${x},${y}`
        const liste = eimer.get(key)
        if (liste) liste.push(i)
        else eimer.set(key, [i])
      }
    }
  })
  return { baender, eimer }
}

function zelleBlockiert(mitte: Point, hindernisse: RaumHindernisse): boolean {
  const key = `${Math.floor(mitte.x / HINDERNIS_EIMER_METER)},${Math.floor(mitte.y / HINDERNIS_EIMER_METER)}`
  for (const i of hindernisse.eimer.get(key) ?? []) {
    const band = hindernisse.baender[i]
    if (!pointInBoundingBox(mitte, band.bbox)) continue
    if (pointInPolygon(mitte, band.polygon)) return true
  }
  return false
}

function zellMitte(spalte: number, zeile: number, ursprung: Point): Point {
  return {
    x: ursprung.x + (spalte + 0.5) * RAUM_ZELLGROESSE_METER,
    y: ursprung.y + (zeile + 0.5) * RAUM_ZELLGROESSE_METER,
  }
}

function shoelace(punkte: readonly (readonly [number, number])[]): number {
  let summe = 0
  for (let i = 0; i < punkte.length; i++) {
    const [x1, y1] = punkte[i]
    const [x2, y2] = punkte[(i + 1) % punkte.length]
    summe += x1 * y2 - x2 * y1
  }
  return summe / 2
}

function vereinfacheUmriss(
  punkte: readonly (readonly [number, number])[],
): (readonly [number, number])[] {
  const n = punkte.length
  if (n < 3) return punkte.slice()
  const ergebnis: (readonly [number, number])[] = []
  for (let i = 0; i < n; i++) {
    const vorher = punkte[(i - 1 + n) % n]
    const aktuell = punkte[i]
    const nachher = punkte[(i + 1) % n]
    const d1x = aktuell[0] - vorher[0]
    const d1y = aktuell[1] - vorher[1]
    const d2x = nachher[0] - aktuell[0]
    const d2y = nachher[1] - aktuell[1]
    if (d1x * d2y - d1y * d2x !== 0) ergebnis.push(aktuell)
  }
  return ergebnis.length >= 3 ? ergebnis : punkte.slice()
}

function ermittleRasterUmriss(besuchteZellen: ReadonlySet<string>, ursprung: Point): Point[] {
  const istBesucht = (spalte: number, zeile: number) => besuchteZellen.has(`${spalte},${zeile}`)
  const eckeKey = (spalte: number, zeile: number) => `${spalte},${zeile}`

  const kanten = new Map<string, [number, number]>()
  for (const zellenKey of besuchteZellen) {
    const [spalte, zeile] = zellenKey.split(',').map(Number)
    if (!istBesucht(spalte, zeile - 1)) kanten.set(eckeKey(spalte, zeile), [spalte + 1, zeile])
    if (!istBesucht(spalte + 1, zeile)) {
      kanten.set(eckeKey(spalte + 1, zeile), [spalte + 1, zeile + 1])
    }
    if (!istBesucht(spalte, zeile + 1)) {
      kanten.set(eckeKey(spalte + 1, zeile + 1), [spalte, zeile + 1])
    }
    if (!istBesucht(spalte - 1, zeile)) kanten.set(eckeKey(spalte, zeile + 1), [spalte, zeile])
  }

  const benutzt = new Set<string>()
  let besteSchleife: [number, number][] | null = null
  let besteFlaeche = 0
  for (const startKey of kanten.keys()) {
    if (benutzt.has(startKey)) continue
    const schleife: [number, number][] = []
    let aktuellKey = startKey
    while (!benutzt.has(aktuellKey)) {
      benutzt.add(aktuellKey)
      const [spalte, zeile] = aktuellKey.split(',').map(Number)
      schleife.push([spalte, zeile])
      const naechste = kanten.get(aktuellKey)
      if (!naechste) break
      aktuellKey = eckeKey(naechste[0], naechste[1])
    }
    const flaeche = Math.abs(shoelace(schleife))
    if (flaeche > besteFlaeche) {
      besteFlaeche = flaeche
      besteSchleife = schleife
    }
  }
  if (!besteSchleife) return []
  return vereinfacheUmriss(besteSchleife).map(([spalte, zeile]) => ({
    x: ursprung.x + spalte * RAUM_ZELLGROESSE_METER,
    y: ursprung.y + zeile * RAUM_ZELLGROESSE_METER,
  }))
}

export function ermittleRaumGeometrie(
  objekte: readonly Objekt[],
  startpunkt: Point,
  hindernisse: RaumHindernisse = ermittleRaumHindernisse(objekte),
): RaumGeometrie | null {
  const ursprung: Point = {
    x: startpunkt.x - RAUM_SUCHRADIUS_METER,
    y: startpunkt.y - RAUM_SUCHRADIUS_METER,
  }
  const breiteZellen = Math.round((2 * RAUM_SUCHRADIUS_METER) / RAUM_ZELLGROESSE_METER)

  const startSpalte = Math.floor((startpunkt.x - ursprung.x) / RAUM_ZELLGROESSE_METER)
  const startZeile = Math.floor((startpunkt.y - ursprung.y) / RAUM_ZELLGROESSE_METER)
  if (zelleBlockiert(zellMitte(startSpalte, startZeile, ursprung), hindernisse)) return null

  const key = (spalte: number, zeile: number) => `${spalte},${zeile}`
  const besucht = new Set<string>()
  besucht.add(key(startSpalte, startZeile))
  const queue: [number, number][] = [[startSpalte, startZeile]]
  const NACHBARN = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ] as const

  let summeX = 0
  let summeY = 0
  for (let kopf = 0; kopf < queue.length; kopf++) {
    const [spalte, zeile] = queue[kopf]
    summeX += spalte
    summeY += zeile
    for (const [dSpalte, dZeile] of NACHBARN) {
      const nSpalte = spalte + dSpalte
      const nZeile = zeile + dZeile
      if (nSpalte < 0 || nZeile < 0 || nSpalte >= breiteZellen || nZeile >= breiteZellen) {
        return null
      }
      const nKey = key(nSpalte, nZeile)
      if (besucht.has(nKey)) continue
      if (zelleBlockiert(zellMitte(nSpalte, nZeile, ursprung), hindernisse)) continue
      besucht.add(nKey)
      queue.push([nSpalte, nZeile])
    }
  }

  const schwerpunktSpalte = summeX / besucht.size
  const schwerpunktZeile = summeY / besucht.size
  let naechsteZelle: [number, number] = [startSpalte, startZeile]
  let naechsteDistanz = Infinity
  for (const zellenKey of besucht) {
    const [spalte, zeile] = zellenKey.split(',').map(Number)
    const d = Math.hypot(spalte - schwerpunktSpalte, zeile - schwerpunktZeile)
    if (d < naechsteDistanz) {
      naechsteDistanz = d
      naechsteZelle = [spalte, zeile]
    }
  }

  return {
    umriss: ermittleRasterUmriss(besucht, ursprung),
    flaeche: besucht.size * RAUM_ZELLGROESSE_METER * RAUM_ZELLGROESSE_METER,
    mittelpunkt: zellMitte(naechsteZelle[0], naechsteZelle[1], ursprung),
  }
}

interface RaumMerker {
  waende: Objekt[]
  hindernisse: RaumHindernisse
  geometrien: Map<string, RaumGeometrie | null>
}

let letzterRaumMerker: RaumMerker | null = null

function raumMerkerFuer(objekte: readonly Objekt[]): RaumMerker {
  const waende = objekte.filter((o) => o.type === 'wand')
  const bisher = letzterRaumMerker
  if (
    bisher &&
    bisher.waende.length === waende.length &&
    bisher.waende.every((w, i) => w === waende[i])
  )
    return bisher
  letzterRaumMerker = {
    waende,
    hindernisse: ermittleRaumHindernisse(objekte),
    geometrien: new Map(),
  }
  return letzterRaumMerker
}

export function aktualisiereRaeume(objekte: Objekt[], tp: Uebersetzer = t): Objekt[] {
  if (!objekte.some((o) => o.type === 'raum')) return objekte

  const raeume = objekte.filter((o): o is RaumObjekt => o.type === 'raum')
  const geometrieNachId = new Map<string, RaumGeometrie | null>()
  const merker = raumMerkerFuer(objekte)
  for (const raum of raeume) {
    const schluessel = `${raum.punktImRaum.x},${raum.punktImRaum.y}`
    let geometrie = merker.geometrien.get(schluessel)
    if (geometrie === undefined) {
      geometrie = ermittleRaumGeometrie(objekte, raum.punktImRaum, merker.hindernisse)
      merker.geometrien.set(schluessel, geometrie)
    }
    geometrieNachId.set(raum.id, geometrie)
  }

  const eltern = new Map<string, string>(raeume.map((r) => [r.id, r.id]))
  const wurzel = (id: string): string => {
    let x = id
    while (eltern.get(x) !== x) x = eltern.get(x)!
    return x
  }
  const vereinige = (a: string, b: string) => {
    const wa = wurzel(a)
    const wb = wurzel(b)
    if (wa !== wb) eltern.set(wa, wb)
  }
  for (let i = 0; i < raeume.length; i++) {
    const geometrieI = geometrieNachId.get(raeume[i].id)
    for (let j = i + 1; j < raeume.length; j++) {
      const geometrieJ = geometrieNachId.get(raeume[j].id)
      const beruehrt =
        (geometrieI && pointInPolygon(raeume[j].punktImRaum, geometrieI.umriss)) ||
        (geometrieJ && pointInPolygon(raeume[i].punktImRaum, geometrieJ.umriss))
      if (beruehrt) vereinige(raeume[i].id, raeume[j].id)
    }
  }

  const gruppenNachWurzel = new Map<string, RaumObjekt[]>()
  for (const raum of raeume) {
    if (!geometrieNachId.get(raum.id)) continue
    const w = wurzel(raum.id)
    const gruppe = gruppenNachWurzel.get(w)
    if (gruppe) gruppe.push(raum)
    else gruppenNachWurzel.set(w, [raum])
  }

  const verschmolzeneIds = new Set<string>()
  const ersatzNachErsterId = new Map<string, RaumObjekt>()
  for (const gruppe of gruppenNachWurzel.values()) {
    if (gruppe.length < 2) continue
    const geometrie = geometrieNachId.get(gruppe[0].id)!
    for (const raum of gruppe) verschmolzeneIds.add(raum.id)
    ersatzNachErsterId.set(gruppe[0].id, {
      ...neueObjektBasis(gruppe[0].ebeneId),
      type: 'raum',
      punktImRaum: geometrie.mittelpunkt,
      name: standardRaumName(tp),
      schriftgroesse: STANDARD_RAUM_SCHRIFTGROESSE,
      gueltig: true,
      fuellung: null,
      ...geometrie,
    })
  }

  const ergebnis: Objekt[] = []
  for (const o of objekte) {
    if (o.type !== 'raum') {
      ergebnis.push(o)
      continue
    }
    if (verschmolzeneIds.has(o.id)) {
      const ersatz = ersatzNachErsterId.get(o.id)
      if (ersatz) ergebnis.push(ersatz)
      continue
    }
    const geometrie = geometrieNachId.get(o.id)
    if (!geometrie) {
      ergebnis.push(o.gueltig ? { ...o, gueltig: false } : o)
      continue
    }
    ergebnis.push({ ...o, ...geometrie, gueltig: true })
  }
  return ergebnis
}

export function findeRaumZuPunkt(objekte: readonly Objekt[], punkt: Point): RaumObjekt | null {
  let treffer: RaumObjekt | null = null
  for (const objekt of objekte) {
    if (objekt.type !== 'raum' || objekt.umriss.length < 3) continue
    if (!pointInPolygon(punkt, objekt.umriss)) continue
    if (!treffer || objekt.flaeche < treffer.flaeche) treffer = objekt
  }
  return treffer
}

const RAUM_ZEICHENBREITE_FAKTOR = 0.6
export const RAUM_ZEILENABSTAND_FAKTOR = 1.2

export function raumBeschriftungsMitte(raum: RaumObjekt): Point {
  const versatz = raum.beschriftungVersatz
  return { x: raum.mittelpunkt.x + (versatz?.x ?? 0), y: raum.mittelpunkt.y + (versatz?.y ?? 0) }
}

export function raumBeschriftungsRahmen(
  raum: RaumObjekt,
  sichtbar: { name: boolean; flaeche: boolean } = { name: true, flaeche: true },
): BoundingBox {
  const zeilen: string[] = []
  if (sichtbar.name) zeilen.push(raum.name)
  if (sichtbar.flaeche) zeilen.push(`${raum.flaeche.toFixed(1)} m²`)
  const laengste = Math.max(1, ...zeilen.map((z) => z.length))
  const halbeBreite = (laengste * raum.schriftgroesse * RAUM_ZEICHENBREITE_FAKTOR) / 2
  const halbeHoehe =
    (Math.max(1, zeilen.length) * raum.schriftgroesse * RAUM_ZEILENABSTAND_FAKTOR) / 2
  const mitte = raumBeschriftungsMitte(raum)
  return {
    min: { x: mitte.x - halbeBreite, y: mitte.y - halbeHoehe },
    max: { x: mitte.x + halbeBreite, y: mitte.y + halbeHoehe },
  }
}
