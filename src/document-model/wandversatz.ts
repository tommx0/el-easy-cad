import type { Blatt, Installationszone } from './blatt'
import type { Point } from './geometry'
import { AP_ABSTAND_METER, zonenDefinition, type ZonenDefinition } from './installationszonen'
import type { LeitungsObjekt } from './objekte'
import {
  raumquerungsUmgebung,
  WAND_NAEHE_METER,
  type RaumquerungsUmgebung,
  type WandAchse,
} from './raumquerung'
import { raumquerungFuer, stueckeMitZone } from './teilstueck-zonen'
import { abgeleitetePfadSegmente } from './trunk-kette'

export interface ZonenStueck {
  von: Point
  bis: Point
  zone: Installationszone | undefined
}

const PARALLEL_SINUS = Math.sin((5 * Math.PI) / 180)
const MINDEST_UEBERDECKUNG_METER = 0.01
const HOECHSTENS_ECKVERSCHUB_METER = 0.5
const EPS = 1e-6

const minus = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y })
const plus = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y })
const mal = (a: Point, f: number): Point => ({ x: a.x * f, y: a.y * f })
const kreuz = (a: Point, b: Point) => a.x * b.y - a.y * b.x
const skalar = (a: Point, b: Point) => a.x * b.x + a.y * b.y
const abstand = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

function versatzAnWand(
  stueck: ZonenStueck,
  waende: readonly WandAchse[],
  zone: ZonenDefinition | undefined,
): Point | null {
  if (zone?.bauteil !== 'wand') return null
  const richtung = minus(stueck.bis, stueck.von)
  const laenge = Math.hypot(richtung.x, richtung.y)
  if (laenge < 1e-3) return null
  const u = mal(richtung, 1 / laenge)
  const mitte = mal(plus(stueck.von, stueck.bis), 0.5)
  let beste: { normale: Point; d: number; halbe: number; naehe: number } | null = null
  for (const w of waende) {
    const wd = minus(w.b, w.a)
    const wl = Math.hypot(wd.x, wd.y)
    if (wl < EPS) continue
    const wu = mal(wd, 1 / wl)
    if (Math.abs(kreuz(u, wu)) > PARALLEL_SINUS) continue
    const t1 = skalar(minus(stueck.von, w.a), wu)
    const t2 = skalar(minus(stueck.bis, w.a), wu)
    const ueberdeckung = Math.min(Math.max(t1, t2), wl) - Math.max(Math.min(t1, t2), 0)
    if (ueberdeckung < MINDEST_UEBERDECKUNG_METER) continue
    const normale = { x: -wu.y, y: wu.x }
    const d = skalar(minus(mitte, w.a), normale)
    const naehe = Math.abs(d) - w.halbeStaerke
    if (naehe < -EPS || naehe > WAND_NAEHE_METER) continue
    if (!beste || naehe < beste.naehe) beste = { normale, d, halbe: w.halbeStaerke, naehe }
  }
  if (!beste) return null
  const seite = beste.d >= 0 ? 1 : -1
  const ziel =
    zone.verlegung === 'auf'
      ? beste.halbe + AP_ABSTAND_METER
      : Math.max(0, beste.halbe - (zone.tiefe ?? 0))
  const delta = seite * ziel - beste.d
  return Math.abs(delta) < 1e-4 ? null : mal(beste.normale, delta)
}

function schnitt(a: ZonenStueck, b: ZonenStueck): Point | null {
  const d1 = minus(a.bis, a.von)
  const d2 = minus(b.bis, b.von)
  const k = kreuz(d1, d2)
  if (Math.abs(k) < EPS * Math.hypot(d1.x, d1.y) * Math.hypot(d2.x, d2.y)) return null
  const s = kreuz(minus(b.von, a.von), d2) / k
  return plus(a.von, mal(d1, s))
}

export function versetzeAnWand(
  stuecke: readonly ZonenStueck[],
  waende: readonly WandAchse[],
  zoneVon: (zone: Installationszone | undefined) => ZonenDefinition | undefined,
): ZonenStueck[] {
  if (stuecke.length === 0 || waende.length === 0) return [...stuecke]
  const versaetze = stuecke.map((s) => versatzAnWand(s, waende, zoneVon(s.zone)))
  if (versaetze.every((v) => v === null)) return [...stuecke]
  const linien = stuecke.map((s, i) => {
    const v = versaetze[i]
    return v ? { ...s, von: plus(s.von, v), bis: plus(s.bis, v) } : s
  })

  const ergebnis: ZonenStueck[] = []
  let zuletzt = stuecke[0].von
  const bis = (p: Point, zone: Installationszone | undefined) => {
    if (abstand(zuletzt, p) < EPS) return
    ergebnis.push({ von: zuletzt, bis: p, zone })
    zuletzt = p
  }
  if (versaetze[0]) bis(linien[0].von, linien[0].zone)
  for (let i = 0; i < linien.length; i++) {
    const linie = linien[i]
    const naechste = linien[i + 1]
    if (!naechste) {
      bis(linie.bis, linie.zone)
      if (versaetze[i]) bis(stuecke[i].bis, linie.zone)
      continue
    }
    const a = versaetze[i]
    const b = versaetze[i + 1]
    const gleich = (!a && !b) || (a && b && abstand(a, b) < EPS)
    if (gleich) {
      bis(linie.bis, linie.zone)
      continue
    }
    const x = schnitt(linie, naechste)
    if (x && abstand(x, stuecke[i].bis) <= HOECHSTENS_ECKVERSCHUB_METER) {
      bis(x, linie.zone)
      continue
    }
    bis(linie.bis, linie.zone)
    bis(naechste.von, b ? naechste.zone : linie.zone)
  }
  return ergebnis
}

const ZWISCHENSPEICHER = new WeakMap<
  Blatt,
  {
    zonen: readonly ZonenDefinition[] | undefined
    umgebung: RaumquerungsUmgebung | null
    jeLeitung: WeakMap<LeitungsObjekt, Point[][] | null>
  }
>()

export function versetztePfadSegmente(
  leitung: LeitungsObjekt,
  blatt: Blatt,
  zonen?: readonly ZonenDefinition[],
): Point[][] | null {
  let eintrag = ZWISCHENSPEICHER.get(blatt)
  if (!eintrag || eintrag.zonen !== zonen) {
    eintrag = {
      zonen,
      umgebung: raumquerungsUmgebung(blatt, zonen ?? []),
      jeLeitung: new WeakMap(),
    }
    ZWISCHENSPEICHER.set(blatt, eintrag)
  }
  const bekannt = eintrag.jeLeitung.get(leitung)
  if (bekannt !== undefined) return bekannt
  const raumquerung = raumquerungFuer(leitung, eintrag.umgebung)
  let ergebnis: Point[][] | null = null
  if (raumquerung) {
    const blattZone = eintrag.umgebung?.blattZone
    const zoneVon = (zone: Installationszone | undefined) =>
      zonenDefinition(zone ?? leitung.installationszone ?? blattZone, zonen)
    let geaendert = false
    const versetzt = abgeleitetePfadSegmente(leitung, blatt.objekte).map((segment) => {
      const stuecke = stueckeMitZone(segment, leitung, raumquerung)
      const neu = versetzeAnWand(stuecke, raumquerung.waende, zoneVon)
      if (neu.length === 0 || neu.every((s, i) => s === stuecke[i])) return segment
      geaendert = true
      return [neu[0].von, ...neu.map((s) => s.bis)]
    })
    if (geaendert) ergebnis = versetzt
  }
  eintrag.jeLeitung.set(leitung, ergebnis)
  return ergebnis
}

export function gezeigtePfadSegmente(
  leitung: LeitungsObjekt,
  blatt: Blatt,
  zonen?: readonly ZonenDefinition[],
): Point[][] {
  return (
    versetztePfadSegmente(leitung, blatt, zonen) ?? abgeleitetePfadSegmente(leitung, blatt.objekte)
  )
}
