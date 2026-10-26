import {
  alsAehnlichkeit,
  anwenden,
  bogenAlsKubisch,
  drehung,
  kubischBei,
  type Matrix,
  mittlererMassstab,
  type P,
  quadratischBei,
  rahmenEcken,
  rahmenUm,
  type Rahmen,
  verketten,
  verschiebung,
} from './geometrie'
import { istBunteSymbolFarbe, type SymbolFarbe } from '../symbol-palette'

export const ZEICHNUNG_HOEHE = 100

export type Farbe = SymbolFarbe
export type Fuellung = 'keine' | Farbe
export type TextAusrichtung = 'links' | 'mittig' | 'rechts'

export interface Stil {
  strich: number
  strichFarbe: Farbe
  gestrichelt: boolean
  fuellung: Fuellung
}

export type PfadSegment =
  | { typ: 'M'; p: P }
  | { typ: 'L'; p: P }
  | { typ: 'C'; c1: P; c2: P; p: P }
  | { typ: 'Q'; c: P; p: P }
  | { typ: 'Z' }

export interface Radierung {
  punkte: P[]
  breite: number
}

interface Basis {
  id: string
  radierungen?: Radierung[]
}

export type ZeichenElement =
  | (Basis & Stil & { art: 'linie'; a: P; b: P })
  | (Basis & Stil & { art: 'polylinie'; punkte: P[]; geschlossen: boolean })
  | (Basis &
      Stil & {
        art: 'rechteck'
        mitte: P
        breite: number
        hoehe: number
        radius: number
        drehung: number
      })
  | (Basis & Stil & { art: 'ellipse'; mitte: P; rx: number; ry: number; drehung: number })
  | (Basis & Stil & { art: 'bogen'; mitte: P; radius: number; start: number; spanne: number })
  | (Basis & Stil & { art: 'pfad'; segmente: PfadSegment[] })
  | (Basis & {
      art: 'text'
      position: P
      text: string
      groesse: number
      ausrichtung: TextAusrichtung
      drehung: number
      fett: boolean
      farbe: Farbe
    })
  | (Basis & {
      art: 'bild'
      mitte: P
      breite: number
      hoehe: number
      drehung: number
      datenUrl: string
    })

export type ElementArt = ZeichenElement['art']

export interface Zeichnung {
  version: 1
  breite: number
  hoehe: number
  elemente: ZeichenElement[]
}

export const STANDARD_STIL: Stil = {
  strich: 2.5,
  strichFarbe: 'schwarz',
  gestrichelt: false,
  fuellung: 'keine',
}

export const STRICH_SCHNELLWAHL = [
  { name: 'dünn', wert: 1 },
  { name: 'mittel', wert: 2.5 },
  { name: 'dick', wert: 5 },
] as const

let zaehler = 0
export function neueElementId(): string {
  zaehler += 1
  return `e${Date.now().toString(36)}${zaehler.toString(36)}`
}

export const GRUNDHOEHE = ZEICHNUNG_HOEHE

export function leereZeichnung(breitenFaktor = 1, hoehenFaktor = 1): Zeichnung {
  return {
    version: 1,
    breite: ZEICHNUNG_HOEHE * breitenFaktor,
    hoehe: ZEICHNUNG_HOEHE * hoehenFaktor,
    elemente: [],
  }
}

export function hatStil(e: ZeichenElement): e is Extract<ZeichenElement, Stil> {
  return e.art !== 'text' && e.art !== 'bild'
}

export function istFuellbar(e: ZeichenElement): boolean {
  if (e.art === 'linie' || e.art === 'bogen') return false
  if (e.art === 'polylinie') return e.geschlossen
  return hatStil(e)
}

const KURVEN_SCHRITTE = 16

function rechteckAlsPfad(e: Extract<ZeichenElement, { art: 'rechteck' }>): PfadSegment[] {
  const m = verketten(verschiebung(e.mitte.x, e.mitte.y), drehung(e.drehung))
  const hb = e.breite / 2
  const hh = e.hoehe / 2
  const r = Math.max(0, Math.min(e.radius, hb, hh))
  if (r === 0) {
    const ecken = [
      { x: -hb, y: -hh },
      { x: hb, y: -hh },
      { x: hb, y: hh },
      { x: -hb, y: hh },
    ].map((p) => anwenden(m, p))
    return [
      { typ: 'M', p: ecken[0] },
      ...ecken.slice(1).map((p): PfadSegment => ({ typ: 'L', p })),
      { typ: 'Z' },
    ]
  }
  const segmente: PfadSegment[] = [{ typ: 'M', p: anwenden(m, { x: -hb + r, y: -hh }) }]
  const ecke = (mx: number, my: number, start: number, gerade: P) => {
    segmente.push({ typ: 'L', p: anwenden(m, gerade) })
    for (const k of bogenAlsKubisch({ x: mx, y: my }, r, r, 0, start, 90)) {
      segmente.push({ typ: 'C', c1: anwenden(m, k.c1), c2: anwenden(m, k.c2), p: anwenden(m, k.p) })
    }
  }
  ecke(hb - r, -hh + r, 270, { x: hb - r, y: -hh })
  ecke(hb - r, hh - r, 0, { x: hb, y: hh - r })
  ecke(-hb + r, hh - r, 90, { x: -hb + r, y: hh })
  ecke(-hb + r, -hh + r, 180, { x: -hb, y: -hh + r })
  segmente.push({ typ: 'Z' })
  return segmente
}

function ellipseAlsPfad(e: Extract<ZeichenElement, { art: 'ellipse' }>): PfadSegment[] {
  const stuecke = bogenAlsKubisch(e.mitte, e.rx, e.ry, e.drehung, 0, 360)
  return [
    { typ: 'M', p: stuecke[stuecke.length - 1].p },
    ...stuecke.map((k): PfadSegment => ({ typ: 'C', ...k })),
    { typ: 'Z' },
  ]
}

function bogenAlsPfad(e: Extract<ZeichenElement, { art: 'bogen' }>): PfadSegment[] {
  const w = (e.start * Math.PI) / 180
  const start = { x: e.mitte.x + e.radius * Math.cos(w), y: e.mitte.y + e.radius * Math.sin(w) }
  return [
    { typ: 'M', p: start },
    ...bogenAlsKubisch(e.mitte, e.radius, e.radius, 0, e.start, e.spanne).map((k): PfadSegment => ({
      typ: 'C',
      ...k,
    })),
  ]
}

export function alsPfadSegmente(e: Extract<ZeichenElement, Stil>): PfadSegment[] {
  switch (e.art) {
    case 'linie':
      return [
        { typ: 'M', p: e.a },
        { typ: 'L', p: e.b },
      ]
    case 'polylinie':
      return [
        { typ: 'M', p: e.punkte[0] },
        ...e.punkte.slice(1).map((p): PfadSegment => ({ typ: 'L', p })),
        ...(e.geschlossen ? [{ typ: 'Z' } as const] : []),
      ]
    case 'rechteck':
      return rechteckAlsPfad(e)
    case 'ellipse':
      return ellipseAlsPfad(e)
    case 'bogen':
      return bogenAlsPfad(e)
    case 'pfad':
      return e.segmente
  }
}

export function pfadUmrisse(segmente: PfadSegment[]): { punkte: P[]; geschlossen: boolean }[] {
  const umrisse: { punkte: P[]; geschlossen: boolean }[] = []
  let aktuell: P[] = []
  let letzter: P = { x: 0, y: 0 }
  let start: P = { x: 0, y: 0 }
  const abschliessen = (geschlossen: boolean) => {
    if (aktuell.length > 0) umrisse.push({ punkte: aktuell, geschlossen })
    aktuell = []
  }
  for (const s of segmente) {
    switch (s.typ) {
      case 'M':
        abschliessen(false)
        aktuell = [s.p]
        letzter = s.p
        start = s.p
        break
      case 'L':
        if (aktuell.length === 0) aktuell = [letzter]
        aktuell.push(s.p)
        letzter = s.p
        break
      case 'C':
        if (aktuell.length === 0) aktuell = [letzter]
        for (let i = 1; i <= KURVEN_SCHRITTE; i++) {
          aktuell.push(kubischBei(letzter, s.c1, s.c2, s.p, i / KURVEN_SCHRITTE))
        }
        letzter = s.p
        break
      case 'Q':
        if (aktuell.length === 0) aktuell = [letzter]
        for (let i = 1; i <= KURVEN_SCHRITTE; i++) {
          aktuell.push(quadratischBei(letzter, s.c, s.p, i / KURVEN_SCHRITTE))
        }
        letzter = s.p
        break
      case 'Z':
        abschliessen(true)
        letzter = start
        break
    }
  }
  abschliessen(false)
  return umrisse
}

export function textAusmass(e: Extract<ZeichenElement, { art: 'text' }>): {
  breite: number
  hoehe: number
} {
  const zeilen = e.text.split('\n')
  const laengste = Math.max(1, ...zeilen.map((z) => z.length))
  return {
    breite: laengste * e.groesse * (e.fett ? 0.6 : 0.55),
    hoehe: zeilen.length * e.groesse * TEXT_ZEILENHOEHE,
  }
}

export const TEXT_ZEILENHOEHE = 1.2
export const TEXT_SCHRIFT = 'Arial, Helvetica, sans-serif'

export function textEcken(e: Extract<ZeichenElement, { art: 'text' }>): P[] {
  const { breite, hoehe } = textAusmass(e)
  const x0 = e.ausrichtung === 'links' ? 0 : e.ausrichtung === 'mittig' ? -breite / 2 : -breite
  const m = verketten(verschiebung(e.position.x, e.position.y), drehung(e.drehung))
  return rahmenEcken({ x: x0, y: -hoehe / 2, breite, hoehe }).map((p) => anwenden(m, p))
}

function bildEcken(e: Extract<ZeichenElement, { art: 'bild' }>): P[] {
  const m = verketten(verschiebung(e.mitte.x, e.mitte.y), drehung(e.drehung))
  return rahmenEcken({ x: -e.breite / 2, y: -e.hoehe / 2, breite: e.breite, hoehe: e.hoehe }).map(
    (p) => anwenden(m, p),
  )
}

export function umrisse(e: ZeichenElement): { punkte: P[]; geschlossen: boolean }[] {
  if (e.art === 'text') return [{ punkte: textEcken(e), geschlossen: true }]
  if (e.art === 'bild') return [{ punkte: bildEcken(e), geschlossen: true }]
  return pfadUmrisse(alsPfadSegmente(e))
}

export function elementRahmen(e: ZeichenElement): Rahmen {
  const alle = umrisse(e).flatMap((u) => u.punkte)
  const r = rahmenUm(alle) ?? { x: 0, y: 0, breite: 0, hoehe: 0 }
  const rand = hatStil(e) ? e.strich / 2 : 0
  return { x: r.x - rand, y: r.y - rand, breite: r.breite + 2 * rand, hoehe: r.hoehe + 2 * rand }
}

export function auswahlRahmen(elemente: ZeichenElement[]): Rahmen | null {
  if (elemente.length === 0) return null
  return rahmenUm(elemente.flatMap((e) => rahmenEcken(elementRahmen(e))))
}

function segmenteTransformieren(segmente: PfadSegment[], m: Matrix): PfadSegment[] {
  return segmente.map((s) => {
    switch (s.typ) {
      case 'M':
      case 'L':
        return { typ: s.typ, p: anwenden(m, s.p) }
      case 'C':
        return { typ: 'C', c1: anwenden(m, s.c1), c2: anwenden(m, s.c2), p: anwenden(m, s.p) }
      case 'Q':
        return { typ: 'Q', c: anwenden(m, s.c), p: anwenden(m, s.p) }
      case 'Z':
        return s
    }
  })
}

function normWinkel(w: number): number {
  const n = ((w % 360) + 360) % 360
  return Math.abs(n - 360) < 1e-9 ? 0 : n
}

export function transformieren(e: ZeichenElement, m: Matrix): ZeichenElement {
  const neu = formTransformieren(e, m)
  if (!e.radierungen?.length) return neu
  const massstab = mittlererMassstab(m)
  return {
    ...neu,
    radierungen: e.radierungen.map((r) => ({
      punkte: r.punkte.map((p) => anwenden(m, p)),
      breite: r.breite * massstab,
    })),
  }
}

function formTransformieren(e: ZeichenElement, m: Matrix): ZeichenElement {
  const aehnlich = alsAehnlichkeit(m)
  const neuerWinkel = (alt: number) =>
    aehnlich ? normWinkel(aehnlich.gespiegelt ? aehnlich.winkel - alt : aehnlich.winkel + alt) : alt
  switch (e.art) {
    case 'linie':
      return { ...e, a: anwenden(m, e.a), b: anwenden(m, e.b) }
    case 'polylinie':
      return { ...e, punkte: e.punkte.map((p) => anwenden(m, p)) }
    case 'pfad':
      return { ...e, segmente: segmenteTransformieren(e.segmente, m) }
    case 'rechteck':
    case 'ellipse': {
      const achsTreu =
        !aehnlich &&
        Math.abs(m[1]) < 1e-9 &&
        Math.abs(m[2]) < 1e-9 &&
        Math.abs(normWinkel(e.drehung) % 180) < 1e-9
      if (aehnlich || achsTreu) {
        const sx = aehnlich ? aehnlich.massstab : Math.abs(m[0])
        const sy = aehnlich ? aehnlich.massstab : Math.abs(m[3])
        const mitte = anwenden(m, e.mitte)
        if (e.art === 'rechteck') {
          const gedreht90 =
            Math.abs(normWinkel(e.drehung) - 90) < 1e-9 ||
            Math.abs(normWinkel(e.drehung) - 270) < 1e-9
          return {
            ...e,
            mitte,
            breite: e.breite * (gedreht90 ? sy : sx),
            hoehe: e.hoehe * (gedreht90 ? sx : sy),
            radius: e.radius * Math.min(sx, sy),
            drehung: neuerWinkel(e.drehung),
          }
        }
        return { ...e, mitte, rx: e.rx * sx, ry: e.ry * sy, drehung: neuerWinkel(e.drehung) }
      }
      return pfadAus(e, segmenteTransformieren(alsPfadSegmente(e), m))
    }
    case 'bogen': {
      if (aehnlich) {
        const mitte = anwenden(m, e.mitte)
        const start = aehnlich.gespiegelt
          ? aehnlich.winkel - e.start - e.spanne
          : aehnlich.winkel + e.start
        return { ...e, mitte, radius: e.radius * aehnlich.massstab, start: normWinkel(start) }
      }
      return pfadAus(e, segmenteTransformieren(alsPfadSegmente(e), m))
    }
    case 'text':
      return {
        ...e,
        position: anwenden(m, e.position),
        groesse: e.groesse * mittlererMassstab(m),
        drehung: neuerWinkel(e.drehung),
      }
    case 'bild': {
      const s = aehnlich?.massstab
      return {
        ...e,
        mitte: anwenden(m, e.mitte),
        breite: e.breite * (s ?? Math.abs(m[0])),
        hoehe: e.hoehe * (s ?? Math.abs(m[3])),
        drehung: neuerWinkel(e.drehung),
      }
    }
  }
}

function pfadAus(e: Extract<ZeichenElement, Stil>, segmente: PfadSegment[]): ZeichenElement {
  return {
    art: 'pfad',
    id: e.id,
    ...(e.radierungen && { radierungen: e.radierungen }),
    strich: e.strich,
    strichFarbe: e.strichFarbe,
    gestrichelt: e.gestrichelt,
    fuellung: e.fuellung,
    segmente,
  }
}

export function inPfadUmwandeln(e: ZeichenElement): ZeichenElement {
  if (!hatStil(e) || e.art === 'pfad') return e
  return pfadAus(e, alsPfadSegmente(e))
}

export function elementPunkte(e: ZeichenElement): { p: P; steuer: boolean }[] {
  switch (e.art) {
    case 'linie':
      return [
        { p: e.a, steuer: false },
        { p: e.b, steuer: false },
      ]
    case 'polylinie':
      return e.punkte.map((p) => ({ p, steuer: false }))
    case 'bogen': {
      const w1 = (e.start * Math.PI) / 180
      const w2 = ((e.start + e.spanne) * Math.PI) / 180
      return [
        {
          p: { x: e.mitte.x + e.radius * Math.cos(w1), y: e.mitte.y + e.radius * Math.sin(w1) },
          steuer: false,
        },
        {
          p: { x: e.mitte.x + e.radius * Math.cos(w2), y: e.mitte.y + e.radius * Math.sin(w2) },
          steuer: false,
        },
      ]
    }
    case 'pfad':
      return e.segmente.flatMap((s) => {
        switch (s.typ) {
          case 'M':
          case 'L':
            return [{ p: s.p, steuer: false }]
          case 'C':
            return [
              { p: s.c1, steuer: true },
              { p: s.c2, steuer: true },
              { p: s.p, steuer: false },
            ]
          case 'Q':
            return [
              { p: s.c, steuer: true },
              { p: s.p, steuer: false },
            ]
          case 'Z':
            return []
        }
      })
    default:
      return []
  }
}

export function setzeElementPunkt(e: ZeichenElement, index: number, p: P): ZeichenElement {
  switch (e.art) {
    case 'linie':
      return index === 0 ? { ...e, a: p } : { ...e, b: p }
    case 'polylinie':
      return { ...e, punkte: e.punkte.map((alt, i) => (i === index ? p : alt)) }
    case 'bogen': {
      const w = (Math.atan2(p.y - e.mitte.y, p.x - e.mitte.x) * 180) / Math.PI
      const radius = Math.hypot(p.x - e.mitte.x, p.y - e.mitte.y)
      if (index === 0) {
        const ende = e.start + e.spanne
        const start = normWinkel(w)
        return { ...e, start, spanne: normWinkel(ende - start) || 360, radius }
      }
      return { ...e, spanne: normWinkel(w - e.start) || 360, radius }
    }
    case 'pfad': {
      let i = 0
      const segmente = e.segmente.map((s): PfadSegment => {
        const treffe = () => i++ === index
        switch (s.typ) {
          case 'M':
          case 'L':
            return treffe() ? { ...s, p } : s
          case 'C': {
            const c1 = treffe() ? p : s.c1
            const c2 = treffe() ? p : s.c2
            const q = treffe() ? p : s.p
            return { typ: 'C', c1, c2, p: q }
          }
          case 'Q': {
            const c = treffe() ? p : s.c
            const q = treffe() ? p : s.p
            return { typ: 'Q', c, p: q }
          }
          case 'Z':
            return s
        }
      })
      return { ...e, segmente }
    }
    default:
      return e
  }
}

export function verschieben(e: ZeichenElement, dx: number, dy: number): ZeichenElement {
  return transformieren(e, verschiebung(dx, dy))
}

export function kopieren(e: ZeichenElement): ZeichenElement {
  return { ...structuredClone(e), id: neueElementId() }
}

export function zeichnungIstFarbig(zeichnung: Zeichnung): boolean {
  return zeichnung.elemente.some((e) => {
    if (e.art === 'bild') return false
    if (e.art === 'text') return istBunteSymbolFarbe(e.farbe)
    return (
      (e.strich > 0 && istBunteSymbolFarbe(e.strichFarbe)) ||
      (e.fuellung !== 'keine' && istBunteSymbolFarbe(e.fuellung))
    )
  })
}
