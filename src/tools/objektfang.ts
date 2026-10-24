import type { EllipseObjekt, Objekt, Point, TabellenKontext } from '../document-model'
import {
  distance,
  ermittleObjektBoundingBox,
  expandBoundingBox,
  getDockpoints,
  midpoint,
  naechsterPunktAufSegment,
  pointInBoundingBox,
  polygonPunkte,
  rechteckEcken,
  rotatePoint,
} from '../document-model'

export type Fangart =
  'endpunkt' | 'mitte' | 'zentrum' | 'quadrant' | 'dock' | 'schnitt' | 'naechster'

export const FANGARTEN_RANGFOLGE: readonly Fangart[] = [
  'endpunkt',
  'mitte',
  'zentrum',
  'quadrant',
  'dock',
  'schnitt',
  'naechster',
]

export const STANDARD_FANGARTEN: readonly Fangart[] = ['endpunkt', 'dock', 'schnitt', 'naechster']

export function kombiniereFangarten(
  eigene: readonly Fangart[],
  zusaetzliche: readonly Fangart[],
): readonly Fangart[] {
  if (zusaetzliche.length === 0) return eigene
  return Array.from(new Set([...eigene, ...zusaetzliche]))
}

export interface FangTreffer {
  punkt: Point
  art: Fangart
  objektId: string
  richtung: Point | null
}

interface Kandidat {
  punkt: Point
  richtung: Point | null
}

export function findeFangpunkt(
  objekte: readonly Objekt[],
  punkt: Point,
  toleranz: number,
  arten: readonly Fangart[],
  tabellenKontext?: TabellenKontext,
): FangTreffer | null {
  if (arten.length === 0) return null
  const artenSet = new Set(arten)

  const kandidatenObjekte = objekte.filter((o) =>
    pointInBoundingBox(
      punkt,
      expandBoundingBox(ermittleObjektBoundingBox(o, tabellenKontext), toleranz),
    ),
  )
  if (kandidatenObjekte.length === 0) return null

  const treffer: Partial<
    Record<Fangart, { kandidat: Kandidat; objektId: string; distanz: number }>
  > = {}

  function merke(art: Fangart, objektId: string, kandidat: Kandidat) {
    if (!artenSet.has(art)) return
    const distanz = distance(punkt, kandidat.punkt)
    if (distanz > toleranz) return
    const bisher = treffer[art]
    if (!bisher || distanz < bisher.distanz) {
      treffer[art] = { kandidat, objektId, distanz }
    }
  }

  function fuegeSegmentKandidaten(objektId: string, segmente: readonly Segment[]) {
    for (const [a, b] of segmente) {
      const richtung = einheitsvektor(a, b)
      merke('endpunkt', objektId, { punkt: a, richtung })
      merke('endpunkt', objektId, { punkt: b, richtung })
      merke('mitte', objektId, { punkt: midpoint(a, b), richtung })
    }
  }

  function fuegeQuadranten(
    objektId: string,
    mittelpunkt: Point,
    radiusX: number,
    radiusY: number,
    drehung: number,
  ) {
    for (const winkel of QUADRANT_WINKEL) {
      const lokal = {
        x: mittelpunkt.x + Math.cos(winkel) * radiusX,
        y: mittelpunkt.y + Math.sin(winkel) * radiusY,
      }
      const tangenteLokal = tangenteEllipse(winkel, radiusX, radiusY)
      merke('quadrant', objektId, {
        punkt: drehung === 0 ? lokal : rotatePoint(lokal, mittelpunkt, drehung),
        richtung: drehung === 0 ? tangenteLokal : rotateVector(tangenteLokal, drehung),
      })
    }
  }

  if (
    artenSet.has('endpunkt') ||
    artenSet.has('mitte') ||
    artenSet.has('zentrum') ||
    artenSet.has('quadrant') ||
    artenSet.has('dock')
  ) {
    for (const objekt of kandidatenObjekte) {
      switch (objekt.type) {
        case 'linie': {
          const richtung = einheitsvektor(objekt.start, objekt.ende)
          merke('endpunkt', objekt.id, { punkt: objekt.start, richtung })
          merke('endpunkt', objekt.id, { punkt: objekt.ende, richtung })
          merke('mitte', objekt.id, { punkt: midpoint(objekt.start, objekt.ende), richtung })
          break
        }
        case 'polylinie':
          fuegeSegmentKandidaten(objekt.id, segmenteAusPunkten(objekt.punkte, objekt.geschlossen))
          break
        case 'bodenplatte':
          fuegeSegmentKandidaten(objekt.id, segmenteAusPunkten(objekt.punkte, true))
          break
        case 'rechteck':
          fuegeSegmentKandidaten(objekt.id, segmenteAusPunkten(rechteckEcken(objekt), true))
          merke('zentrum', objekt.id, { punkt: rechteckZentrum(objekt), richtung: null })
          break
        case 'kreis':
          merke('zentrum', objekt.id, { punkt: objekt.mittelpunkt, richtung: null })
          fuegeQuadranten(objekt.id, objekt.mittelpunkt, objekt.radius, objekt.radius, 0)
          break
        case 'bogen': {
          merke('zentrum', objekt.id, { punkt: objekt.mittelpunkt, richtung: null })
          const startPunkt = punktAufKreis(objekt.mittelpunkt, objekt.radius, objekt.startWinkel)
          const endPunkt = punktAufKreis(objekt.mittelpunkt, objekt.radius, objekt.endWinkel)
          merke('endpunkt', objekt.id, {
            punkt: startPunkt,
            richtung: tangente(objekt.startWinkel),
          })
          merke('endpunkt', objekt.id, { punkt: endPunkt, richtung: tangente(objekt.endWinkel) })
          const mittenWinkel = bogenMittenWinkel(objekt.startWinkel, objekt.endWinkel)
          merke('mitte', objekt.id, {
            punkt: punktAufKreis(objekt.mittelpunkt, objekt.radius, mittenWinkel),
            richtung: tangente(mittenWinkel),
          })
          break
        }
        case 'ellipse':
          merke('zentrum', objekt.id, { punkt: objekt.mittelpunkt, richtung: null })
          fuegeQuadranten(
            objekt.id,
            objekt.mittelpunkt,
            objekt.radiusX,
            objekt.radiusY,
            objekt.drehung,
          )
          break
        case 'polygon':
          fuegeSegmentKandidaten(objekt.id, segmenteAusPunkten(polygonPunkte(objekt), true))
          merke('zentrum', objekt.id, { punkt: objekt.mittelpunkt, richtung: null })
          break
        case 'komponente':
          merke('zentrum', objekt.id, { punkt: objekt.position, richtung: null })
          for (const dockpunkt of getDockpoints(objekt)) {
            merke('dock', objekt.id, { punkt: dockpunkt, richtung: null })
          }
          break
        case 'leitung':
          for (const segment of objekt.pfadSegmente) {
            fuegeSegmentKandidaten(objekt.id, segmenteAusPunkten(segment, false))
          }
          break
        case 'trunk':
          fuegeSegmentKandidaten(objekt.id, segmenteAusPunkten(objekt.wegpunkte, false))
          break
        case 'kabelschacht':
        case 'treppe':
          fuegeSegmentKandidaten(objekt.id, segmenteAusPunkten(rechteckEcken(objekt), true))
          merke('zentrum', objekt.id, { punkt: rechteckZentrum(objekt), richtung: null })
          break
        case 'wand':
          fuegeSegmentKandidaten(objekt.id, segmenteAusPunkten(objekt.punkte, false))
          break
        case 'stueckliste':
        case 'leitungsliste':
        case 'switchplan':
        case 'trunkliste':
        case 'leitungsbaum':
        case 'plankopf': {
          if (!tabellenKontext) break
          const bb = ermittleObjektBoundingBox(objekt, tabellenKontext)
          const ecken = [bb.min, { x: bb.max.x, y: bb.min.y }, bb.max, { x: bb.min.x, y: bb.max.y }]
          for (let i = 0; i < ecken.length; i++) {
            const a = ecken[i]
            const b = ecken[(i + 1) % ecken.length]
            merke('endpunkt', objekt.id, { punkt: a, richtung: einheitsvektor(a, b) })
          }
          break
        }
        case 'punkt':
        case 'text':
        case 'bemassung':
        case 'bemassungsreihe':
        case 'schraffur':
        case 'tuer':
        case 'fenster':
        case 'wanddurchbruch':
          break
      }
    }
  }

  if (artenSet.has('schnitt') || artenSet.has('naechster')) {
    const konturen = kandidatenObjekte
      .map(objektKontur)
      .filter((k): k is ObjektKontur => k !== null)

    if (artenSet.has('naechster')) {
      for (const kontur of konturen) {
        for (const segment of kontur.segmente) {
          const projiziert = naechsterPunktAufSegment(punkt, segment[0], segment[1])
          merke('naechster', kontur.objektId, {
            punkt: projiziert,
            richtung: einheitsvektor(segment[0], segment[1]),
          })
        }
        for (const bogen of kontur.kreisboegen) {
          const { punkt: projiziert, winkel } = naechsterPunktAufKreisbogen(punkt, bogen)
          merke('naechster', kontur.objektId, { punkt: projiziert, richtung: tangente(winkel) })
        }
      }
    }

    if (artenSet.has('schnitt')) {
      for (let i = 0; i < konturen.length; i++) {
        for (let j = i + 1; j < konturen.length; j++) {
          const k1 = konturen[i]
          const k2 = konturen[j]
          if (k1.objektId === k2.objektId) continue
          for (const s1 of k1.segmente) {
            for (const s2 of k2.segmente) {
              const p = segmentSchnitt(s1[0], s1[1], s2[0], s2[1])
              if (p) merke('schnitt', k1.objektId, { punkt: p, richtung: null })
            }
            for (const b2 of k2.kreisboegen) {
              for (const p of segmentKreisSchnitt(s1[0], s1[1], b2)) {
                merke('schnitt', k1.objektId, { punkt: p, richtung: null })
              }
            }
          }
          for (const b1 of k1.kreisboegen) {
            for (const s2 of k2.segmente) {
              for (const p of segmentKreisSchnitt(s2[0], s2[1], b1)) {
                merke('schnitt', k1.objektId, { punkt: p, richtung: null })
              }
            }
            for (const b2 of k2.kreisboegen) {
              for (const p of kreisKreisSchnitt(b1, b2)) {
                merke('schnitt', k1.objektId, { punkt: p, richtung: null })
              }
            }
          }
        }
      }
    }
  }

  for (const art of FANGARTEN_RANGFOLGE) {
    const t = treffer[art]
    if (t)
      return { art, punkt: t.kandidat.punkt, richtung: t.kandidat.richtung, objektId: t.objektId }
  }
  return null
}

type Segment = readonly [Point, Point]

interface Kreisbogen {
  mittelpunkt: Point
  radius: number
  startWinkel: number
  endWinkel: number
  vollkreis: boolean
}

interface ObjektKontur {
  objektId: string
  segmente: readonly Segment[]
  kreisboegen: readonly Kreisbogen[]
}

const QUADRANT_WINKEL = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]
const ELLIPSE_SEGMENTE = 48

function objektKontur(objekt: Objekt): ObjektKontur | null {
  switch (objekt.type) {
    case 'linie':
      return { objektId: objekt.id, segmente: [[objekt.start, objekt.ende]], kreisboegen: [] }
    case 'polylinie':
      return {
        objektId: objekt.id,
        segmente: segmenteAusPunkten(objekt.punkte, objekt.geschlossen),
        kreisboegen: [],
      }
    case 'bodenplatte':
      return {
        objektId: objekt.id,
        segmente: segmenteAusPunkten(objekt.punkte, true),
        kreisboegen: [],
      }
    case 'rechteck':
      return {
        objektId: objekt.id,
        segmente: segmenteAusPunkten(rechteckEcken(objekt), true),
        kreisboegen: [],
      }
    case 'kreis':
      return {
        objektId: objekt.id,
        segmente: [],
        kreisboegen: [
          {
            mittelpunkt: objekt.mittelpunkt,
            radius: objekt.radius,
            startWinkel: 0,
            endWinkel: 0,
            vollkreis: true,
          },
        ],
      }
    case 'bogen':
      return {
        objektId: objekt.id,
        segmente: [],
        kreisboegen: [
          {
            mittelpunkt: objekt.mittelpunkt,
            radius: objekt.radius,
            startWinkel: objekt.startWinkel,
            endWinkel: objekt.endWinkel,
            vollkreis: false,
          },
        ],
      }
    case 'ellipse':
      return {
        objektId: objekt.id,
        segmente: segmenteAusPunkten(tessellierteEllipse(objekt, ELLIPSE_SEGMENTE), true),
        kreisboegen: [],
      }
    case 'polygon':
      return {
        objektId: objekt.id,
        segmente: segmenteAusPunkten(polygonPunkte(objekt), true),
        kreisboegen: [],
      }
    case 'komponente': {
      const halbX = (objekt.breiteWelt ?? objekt.groesseWelt) / 2
      const halbY = objekt.groesseWelt / 2
      const ecken = [
        { x: objekt.position.x - halbX, y: objekt.position.y - halbY },
        { x: objekt.position.x + halbX, y: objekt.position.y - halbY },
        { x: objekt.position.x + halbX, y: objekt.position.y + halbY },
        { x: objekt.position.x - halbX, y: objekt.position.y + halbY },
      ].map((p) => rotatePoint(p, objekt.position, objekt.drehung))
      return { objektId: objekt.id, segmente: segmenteAusPunkten(ecken, true), kreisboegen: [] }
    }
    case 'leitung':
      return {
        objektId: objekt.id,
        segmente: objekt.pfadSegmente.flatMap((segment) => segmenteAusPunkten(segment, false)),
        kreisboegen: [],
      }
    case 'trunk':
      return {
        objektId: objekt.id,
        segmente: segmenteAusPunkten(objekt.wegpunkte, false),
        kreisboegen: [],
      }
    case 'kabelschacht':
    case 'treppe':
      return {
        objektId: objekt.id,
        segmente: segmenteAusPunkten(rechteckEcken(objekt), true),
        kreisboegen: [],
      }
    case 'wand':
      return {
        objektId: objekt.id,
        segmente: segmenteAusPunkten(objekt.punkte, false),
        kreisboegen: [],
      }
    default:
      return null
  }
}

function segmenteAusPunkten(punkte: readonly Point[], geschlossen: boolean): Segment[] {
  const segmente: Segment[] = []
  for (let i = 0; i < punkte.length - 1; i++) segmente.push([punkte[i], punkte[i + 1]])
  if (geschlossen && punkte.length > 2) segmente.push([punkte[punkte.length - 1], punkte[0]])
  return segmente
}

function tessellierteEllipse(o: EllipseObjekt, anzahl: number): Point[] {
  const punkte: Point[] = []
  for (let i = 0; i < anzahl; i++) {
    const winkel = (i / anzahl) * Math.PI * 2
    const lokal = {
      x: o.mittelpunkt.x + Math.cos(winkel) * o.radiusX,
      y: o.mittelpunkt.y + Math.sin(winkel) * o.radiusY,
    }
    punkte.push(o.drehung === 0 ? lokal : rotatePoint(lokal, o.mittelpunkt, o.drehung))
  }
  return punkte
}

function rechteckZentrum(o: { ursprung: Point; breite: number; hoehe: number }): Point {
  return { x: o.ursprung.x + o.breite / 2, y: o.ursprung.y + o.hoehe / 2 }
}

function einheitsvektor(a: Point, b: Point): Point {
  const laenge = distance(a, b)
  if (laenge === 0) return { x: 1, y: 0 }
  return { x: (b.x - a.x) / laenge, y: (b.y - a.y) / laenge }
}

function rotateVector(v: Point, radiant: number): Point {
  return rotatePoint(v, { x: 0, y: 0 }, radiant)
}

function punktAufKreis(mittelpunkt: Point, radius: number, winkel: number): Point {
  return {
    x: mittelpunkt.x + Math.cos(winkel) * radius,
    y: mittelpunkt.y + Math.sin(winkel) * radius,
  }
}

function tangenteEllipse(winkel: number, radiusX: number, radiusY: number): Point {
  return einheitsvektor(
    { x: 0, y: 0 },
    { x: -radiusX * Math.sin(winkel), y: radiusY * Math.cos(winkel) },
  )
}

function tangente(winkel: number): Point {
  return { x: -Math.sin(winkel), y: Math.cos(winkel) }
}

function normalisiereWinkel(w: number): number {
  const zweiPi = Math.PI * 2
  let r = w % zweiPi
  if (r < 0) r += zweiPi
  return r
}

function winkelImBogen(winkel: number, start: number, ende: number): boolean {
  const s = normalisiereWinkel(start)
  const e = normalisiereWinkel(ende)
  const w = normalisiereWinkel(winkel)
  if (s <= e) return w >= s && w <= e
  return w >= s || w <= e
}

function winkelDifferenz(a: number, b: number): number {
  let d = normalisiereWinkel(a - b)
  if (d > Math.PI) d -= Math.PI * 2
  return d
}

function bogenMittenWinkel(start: number, ende: number): number {
  const s = normalisiereWinkel(start)
  let e = normalisiereWinkel(ende)
  if (e < s) e += Math.PI * 2
  return normalisiereWinkel((s + e) / 2)
}

function naechsterPunktAufKreisbogen(
  p: Point,
  bogen: Kreisbogen,
): { punkt: Point; winkel: number } {
  const winkelZumZeiger = Math.atan2(p.y - bogen.mittelpunkt.y, p.x - bogen.mittelpunkt.x)
  const winkel =
    bogen.vollkreis || winkelImBogen(winkelZumZeiger, bogen.startWinkel, bogen.endWinkel)
      ? winkelZumZeiger
      : Math.abs(winkelDifferenz(winkelZumZeiger, bogen.startWinkel)) <=
          Math.abs(winkelDifferenz(winkelZumZeiger, bogen.endWinkel))
        ? bogen.startWinkel
        : bogen.endWinkel
  return { punkt: punktAufKreis(bogen.mittelpunkt, bogen.radius, winkel), winkel }
}

function segmentSchnitt(a1: Point, a2: Point, b1: Point, b2: Point): Point | null {
  const d1x = a2.x - a1.x
  const d1y = a2.y - a1.y
  const d2x = b2.x - b1.x
  const d2y = b2.y - b1.y
  const nenner = d1x * d2y - d1y * d2x
  if (Math.abs(nenner) < 1e-12) return null
  const t = ((b1.x - a1.x) * d2y - (b1.y - a1.y) * d2x) / nenner
  const u = ((b1.x - a1.x) * d1y - (b1.y - a1.y) * d1x) / nenner
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return { x: a1.x + t * d1x, y: a1.y + t * d1y }
}

function segmentKreisSchnitt(a: Point, b: Point, bogen: Kreisbogen): Point[] {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const fx = a.x - bogen.mittelpunkt.x
  const fy = a.y - bogen.mittelpunkt.y
  const qa = dx * dx + dy * dy
  if (qa === 0) return []
  const qb = 2 * (fx * dx + fy * dy)
  const qc = fx * fx + fy * fy - bogen.radius * bogen.radius
  const diskriminante = qb * qb - 4 * qa * qc
  if (diskriminante < 0) return []
  const wurzel = Math.sqrt(diskriminante)
  const ergebnisse: Point[] = []
  for (const t of [(-qb - wurzel) / (2 * qa), (-qb + wurzel) / (2 * qa)]) {
    if (t < 0 || t > 1) continue
    const p = { x: a.x + t * dx, y: a.y + t * dy }
    const winkel = Math.atan2(p.y - bogen.mittelpunkt.y, p.x - bogen.mittelpunkt.x)
    if (bogen.vollkreis || winkelImBogen(winkel, bogen.startWinkel, bogen.endWinkel))
      ergebnisse.push(p)
  }
  return ergebnisse
}

function kreisKreisSchnitt(k1: Kreisbogen, k2: Kreisbogen): Point[] {
  const dx = k2.mittelpunkt.x - k1.mittelpunkt.x
  const dy = k2.mittelpunkt.y - k1.mittelpunkt.y
  const d = Math.hypot(dx, dy)
  if (d === 0 || d > k1.radius + k2.radius || d < Math.abs(k1.radius - k2.radius)) return []
  const a = (k1.radius ** 2 - k2.radius ** 2 + d * d) / (2 * d)
  const h2 = k1.radius ** 2 - a * a
  if (h2 < 0) return []
  const h = Math.sqrt(h2)
  const xm = k1.mittelpunkt.x + (a * dx) / d
  const ym = k1.mittelpunkt.y + (a * dy) / d
  const kandidaten = [
    { x: xm + (h * dy) / d, y: ym - (h * dx) / d },
    { x: xm - (h * dy) / d, y: ym + (h * dx) / d },
  ]
  return kandidaten.filter((p) => {
    const w1 = Math.atan2(p.y - k1.mittelpunkt.y, p.x - k1.mittelpunkt.x)
    const w2 = Math.atan2(p.y - k2.mittelpunkt.y, p.x - k2.mittelpunkt.x)
    return (
      (k1.vollkreis || winkelImBogen(w1, k1.startWinkel, k1.endWinkel)) &&
      (k2.vollkreis || winkelImBogen(w2, k2.startWinkel, k2.endWinkel))
    )
  })
}
