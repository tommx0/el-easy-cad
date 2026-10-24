import type { Point } from './geometry'
import { rotatePoint } from './geometry'
import {
  MINDEST_TREPPEN_STUFENANZAHL,
  STANDARD_TREPPEN_STUFENTIEFE,
  WENDELSTUFEN_180,
  WENDELSTUFEN_90,
} from './objekte'
import type { TreppenForm, TreppenObjekt } from './objekte'

export interface TreppenGeometrie {
  stufenlinien: [Point, Point][]
  kontur: Point[] | null
  pfeilPunkte: Point[]
}

export function mindestTreppenStufenanzahl(form: TreppenForm): number {
  switch (form) {
    case 'gerade':
      return MINDEST_TREPPEN_STUFENANZAHL
    case 'u-podest':
      return 2
    case 'u-kehre':
      return WENDELSTUFEN_180 + 2
    case 'l-kehre':
      return WENDELSTUFEN_90 + 2
  }
}

function ermittleTreppenLauflaenge(form: TreppenForm, breite: number, hoehe: number): number {
  if (form === 'gerade') return Math.max(breite, hoehe)
  if (form === 'u-podest' || form === 'u-kehre') {
    const laenge = Math.max(breite, hoehe)
    const quer = Math.min(breite, hoehe)
    const podestTiefe = Math.min(quer / 2, laenge * 0.4)
    return 2 * Math.max(0.01, laenge - podestTiefe) + podestTiefe
  }
  const laufbreite = Math.min(breite, hoehe)
  return Math.max(0.01, breite - laufbreite) + Math.max(0.01, hoehe - laufbreite) + laufbreite
}

export function standardLFormMasse(
  breite: number,
  hoehe: number,
): Pick<
  TreppenObjekt,
  'lFormLaufALaenge' | 'lFormLaufABreite' | 'lFormLaufBLaenge' | 'lFormLaufBBreite'
> {
  const laufbreite = Math.min(breite, hoehe) / 2
  return {
    lFormLaufALaenge: Math.max(0.01, breite - laufbreite),
    lFormLaufABreite: laufbreite,
    lFormLaufBLaenge: Math.max(0.01, hoehe - laufbreite),
    lFormLaufBBreite: laufbreite,
  }
}

export function lFormMasseAendern(
  treppe: TreppenObjekt,
  aenderung: Partial<
    Pick<
      TreppenObjekt,
      'lFormLaufALaenge' | 'lFormLaufABreite' | 'lFormLaufBLaenge' | 'lFormLaufBBreite'
    >
  >,
): Partial<TreppenObjekt> {
  const naechste = { ...treppe, ...aenderung }
  return {
    ...aenderung,
    breite: naechste.lFormLaufALaenge + naechste.lFormLaufBBreite,
    hoehe: naechste.lFormLaufBLaenge + naechste.lFormLaufABreite,
  }
}

export function ermittleTreppenStufenanzahlVorschlag(
  form: TreppenForm,
  breite: number,
  hoehe: number,
): number {
  const lauflaenge = ermittleTreppenLauflaenge(form, breite, hoehe)
  const vorschlag = Math.round(lauflaenge / STANDARD_TREPPEN_STUFENTIEFE)
  return Math.max(vorschlag, mindestTreppenStufenanzahl(form))
}

function schnittMitStrahl(pivot: Point, winkel: number, pfad: Point[]): Point | null {
  const richtung = { x: Math.cos(winkel), y: Math.sin(winkel) }
  for (let i = 0; i < pfad.length - 1; i++) {
    const a = pfad[i]
    const segment = { x: pfad[i + 1].x - a.x, y: pfad[i + 1].y - a.y }
    const nenner = richtung.x * segment.y - richtung.y * segment.x
    if (Math.abs(nenner) < 1e-9) continue
    const diff = { x: a.x - pivot.x, y: a.y - pivot.y }
    const t = (diff.x * segment.y - diff.y * segment.x) / nenner
    const s = (diff.x * richtung.y - diff.y * richtung.x) / nenner
    if (t >= 0 && s >= -1e-9 && s <= 1 + 1e-9) {
      return { x: pivot.x + richtung.x * t, y: pivot.y + richtung.y * t }
    }
  }
  return null
}

function wendelfaecher(
  pivot: Point,
  winkelStart: number,
  winkelEnde: number,
  aussenpfad: Point[],
  anzahl: number,
): [Point, Point][] {
  if (anzahl <= 1) return []
  const linien: [Point, Point][] = []
  for (let k = 1; k < anzahl; k++) {
    const winkel = winkelStart + ((winkelEnde - winkelStart) * k) / anzahl
    const ziel = schnittMitStrahl(pivot, winkel, aussenpfad)
    if (ziel) linien.push([pivot, ziel])
  }
  return linien
}

function geometrieGerade(treppe: TreppenObjekt, n: number): TreppenGeometrie {
  const laufAchseIstX = treppe.breite >= treppe.hoehe
  const laenge = laufAchseIstX ? treppe.breite : treppe.hoehe
  const quer = laufAchseIstX ? treppe.hoehe : treppe.breite
  const zu = (u: number, v: number): Point => (laufAchseIstX ? { x: u, y: v } : { x: v, y: u })
  const stufentiefe = laenge / n
  const stufenlinien: [Point, Point][] = []
  for (let k = 1; k < n; k++) {
    const u = -laenge / 2 + k * stufentiefe
    stufenlinien.push([zu(u, -quer / 2), zu(u, quer / 2)])
  }
  const antritt = zu(-laenge / 2, 0)
  const austritt = zu(laenge / 2, 0)
  return {
    stufenlinien,
    kontur: null,
    pfeilPunkte: treppe.laufrichtungGespiegelt ? [austritt, antritt] : [antritt, austritt],
  }
}

function geometrieU(treppe: TreppenObjekt, n: number): TreppenGeometrie {
  const laufAchseIstX = treppe.breite >= treppe.hoehe
  const laenge = laufAchseIstX ? treppe.breite : treppe.hoehe
  const quer = laufAchseIstX ? treppe.hoehe : treppe.breite
  const zu = (u: number, v: number): Point => (laufAchseIstX ? { x: u, y: v } : { x: v, y: u })

  const wendeTiefe = Math.min(quer / 2, laenge * 0.4)
  const stepsHin = Math.ceil(n / 2)
  const stepsRueck = Math.max(1, n - stepsHin)
  const restLaenge = Math.max(0.01, laenge - wendeTiefe)
  const stufentiefeHin = restLaenge / stepsHin
  const stufentiefeRueck = restLaenge / stepsRueck

  const uStart = -laenge / 2
  const uWende = laenge / 2 - wendeTiefe

  const stufenlinien: [Point, Point][] = []
  for (let k = 1; k < stepsHin; k++) {
    const u = uStart + k * stufentiefeHin
    stufenlinien.push([zu(u, 0), zu(u, quer / 2)])
  }
  for (let k = 1; k < stepsRueck; k++) {
    const u = uStart + k * stufentiefeRueck
    stufenlinien.push([zu(u, -quer / 2), zu(u, 0)])
  }
  stufenlinien.push([zu(uStart, 0), zu(uWende, 0)])
  stufenlinien.push([zu(uWende, -quer / 2), zu(uWende, quer / 2)])

  if (treppe.form === 'u-kehre') {
    const pivotUv = { x: uWende, y: 0 }
    const aussenpfadUv = [
      { x: uWende, y: quer / 2 },
      { x: laenge / 2, y: quer / 2 },
      { x: laenge / 2, y: -quer / 2 },
      { x: uWende, y: -quer / 2 },
    ]
    const faecherUv = wendelfaecher(
      pivotUv,
      Math.PI / 2,
      -Math.PI / 2,
      aussenpfadUv,
      WENDELSTUFEN_180,
    )
    stufenlinien.push(...faecherUv.map(([a, b]): [Point, Point] => [zu(a.x, a.y), zu(b.x, b.y)]))
  }

  const uWendeMitte = (uWende + laenge / 2) / 2
  const antritt = zu(uStart, quer / 4)
  const wendeHin = zu(uWendeMitte, quer / 4)
  const wendeRueck = zu(uWendeMitte, -quer / 4)
  const austritt = zu(uStart, -quer / 4)
  const pfeilPunkte = [antritt, wendeHin, wendeRueck, austritt]
  return {
    stufenlinien,
    kontur: null,
    pfeilPunkte: treppe.laufrichtungGespiegelt ? pfeilPunkte.reverse() : pfeilPunkte,
  }
}

function geometrieL(treppe: TreppenObjekt, n: number): TreppenGeometrie {
  const laengeA = Math.max(0.01, treppe.lFormLaufALaenge)
  const breiteA = Math.max(0.01, treppe.lFormLaufABreite)
  const laengeB = Math.max(0.01, treppe.lFormLaufBLaenge)
  const breiteB = Math.max(0.01, treppe.lFormLaufBBreite)
  const breite = laengeA + breiteB
  const hoehe = laengeB + breiteA
  const rest = Math.max(2, n - WENDELSTUFEN_90)
  const stepsA = Math.min(Math.max(1, Math.round((rest * laengeA) / (laengeA + laengeB))), rest - 1)
  const stepsB = Math.max(1, rest - stepsA)
  const stufentiefeA = laengeA / stepsA
  const stufentiefeB = laengeB / stepsB

  const xStart = -breite / 2
  const xEnde = breite / 2
  const xEcke = xEnde - breiteB
  const yStart = -hoehe / 2
  const yEnde = hoehe / 2
  const yEcke = yStart + breiteA

  const stufenlinien: [Point, Point][] = []
  for (let k = 1; k < stepsA; k++) {
    const x = xStart + k * stufentiefeA
    stufenlinien.push([
      { x, y: yStart },
      { x, y: yEcke },
    ])
  }
  for (let k = 1; k < stepsB; k++) {
    const y = yEcke + k * stufentiefeB
    stufenlinien.push([
      { x: xEcke, y },
      { x: xEnde, y },
    ])
  }
  const pivot = { x: xEcke, y: yEcke }
  const aussenpfad = [
    { x: xEcke, y: yStart },
    { x: xEnde, y: yStart },
    { x: xEnde, y: yEcke },
  ]
  stufenlinien.push([pivot, aussenpfad[0]], [pivot, aussenpfad[aussenpfad.length - 1]])
  stufenlinien.push(...wendelfaecher(pivot, -Math.PI / 2, 0, aussenpfad, WENDELSTUFEN_90))

  const kontur = [
    { x: xStart, y: yStart },
    { x: xEnde, y: yStart },
    { x: xEnde, y: yEnde },
    { x: xEcke, y: yEnde },
    { x: xEcke, y: yEcke },
    { x: xStart, y: yEcke },
  ]
  const antritt = { x: xStart, y: (yStart + yEcke) / 2 }
  const eckeMitte = { x: (xEcke + xEnde) / 2, y: (yStart + yEcke) / 2 }
  const austritt = { x: (xEcke + xEnde) / 2, y: yEnde }
  const pfeilPunkte = treppe.laufrichtungGespiegelt
    ? [austritt, eckeMitte, antritt]
    : [antritt, eckeMitte, austritt]

  const spiegeleX = treppe.lFormSpiegelHorizontal
  const spiegeleY = treppe.lFormSpiegelVertikal
  const spiegle = (p: Point): Point => ({ x: spiegeleX ? -p.x : p.x, y: spiegeleY ? -p.y : p.y })

  return {
    stufenlinien: stufenlinien.map(([a, b]): [Point, Point] => [spiegle(a), spiegle(b)]),
    kontur: kontur.map(spiegle),
    pfeilPunkte: pfeilPunkte.map(spiegle),
  }
}

export function ermittleTreppenGeometrie(treppe: TreppenObjekt): TreppenGeometrie {
  const n = Math.max(mindestTreppenStufenanzahl(treppe.form), Math.round(treppe.stufenanzahl))
  const lokal = (() => {
    switch (treppe.form) {
      case 'gerade':
        return geometrieGerade(treppe, n)
      case 'u-podest':
      case 'u-kehre':
        return geometrieU(treppe, n)
      case 'l-kehre':
        return geometrieL(treppe, n)
    }
  })()

  const effektiveBreite =
    treppe.form === 'l-kehre' ? treppe.lFormLaufALaenge + treppe.lFormLaufBBreite : treppe.breite
  const effektiveHoehe =
    treppe.form === 'l-kehre' ? treppe.lFormLaufBLaenge + treppe.lFormLaufABreite : treppe.hoehe
  const mitte = {
    x: treppe.ursprung.x + effektiveBreite / 2,
    y: treppe.ursprung.y + effektiveHoehe / 2,
  }
  const zuWelt = (p: Point): Point =>
    treppe.drehung === 0
      ? { x: mitte.x + p.x, y: mitte.y + p.y }
      : rotatePoint({ x: mitte.x + p.x, y: mitte.y + p.y }, mitte, treppe.drehung)

  return {
    stufenlinien: lokal.stufenlinien.map(([a, b]) => [zuWelt(a), zuWelt(b)]),
    kontur: lokal.kontur ? lokal.kontur.map(zuWelt) : null,
    pfeilPunkte: lokal.pfeilPunkte.map(zuWelt),
  }
}

export interface TreppenStufe {
  polygon: Point[]
  hoehenIndex: number
}

export function ermittleTreppenStufen(treppe: TreppenObjekt): {
  stufen: TreppenStufe[]
  steigungen: number
} {
  const n = Math.max(mindestTreppenStufenanzahl(treppe.form), Math.round(treppe.stufenanzahl))
  const lokal =
    treppe.form === 'gerade'
      ? stufenGerade(treppe, n)
      : treppe.form === 'l-kehre'
        ? stufenL(treppe, n)
        : stufenU(treppe, n)

  const effektiveBreite =
    treppe.form === 'l-kehre' ? treppe.lFormLaufALaenge + treppe.lFormLaufBBreite : treppe.breite
  const effektiveHoehe =
    treppe.form === 'l-kehre' ? treppe.lFormLaufBLaenge + treppe.lFormLaufABreite : treppe.hoehe
  const mitte = {
    x: treppe.ursprung.x + effektiveBreite / 2,
    y: treppe.ursprung.y + effektiveHoehe / 2,
  }
  const spiegle = (p: Point): Point =>
    treppe.form === 'l-kehre'
      ? {
          x: treppe.lFormSpiegelHorizontal ? -p.x : p.x,
          y: treppe.lFormSpiegelVertikal ? -p.y : p.y,
        }
      : p
  const zuWelt = (p: Point): Point => {
    const q = spiegle(p)
    const w = { x: mitte.x + q.x, y: mitte.y + q.y }
    return treppe.drehung === 0 ? w : rotatePoint(w, mitte, treppe.drehung)
  }
  const letzte = lokal.steigungen - 1
  return {
    steigungen: lokal.steigungen,
    stufen: lokal.stufen.map((s) => ({
      polygon: s.polygon.map(zuWelt),
      hoehenIndex: treppe.laufrichtungGespiegelt ? letzte - s.hoehenIndex : s.hoehenIndex,
    })),
  }
}

function rechteckUv(
  u1: number,
  u2: number,
  v1: number,
  v2: number,
  zu: (u: number, v: number) => Point,
): Point[] {
  return [zu(u1, v1), zu(u2, v1), zu(u2, v2), zu(u1, v2)]
}

function wendelKeile(
  pivot: Point,
  winkelStart: number,
  winkelEnde: number,
  aussenpfad: Point[],
  anzahl: number,
): Point[][] {
  const winkel = (k: number) => winkelStart + ((winkelEnde - winkelStart) * k) / anzahl
  const keile: Point[][] = []
  for (let k = 0; k < anzahl; k++) {
    const a = winkel(k)
    const b = winkel(k + 1)
    const pa = schnittMitStrahl(pivot, a, aussenpfad)
    const pb = schnittMitStrahl(pivot, b, aussenpfad)
    if (!pa || !pb) continue
    const zwischen = aussenpfad
      .map((p) => ({ p, w: Math.atan2(p.y - pivot.y, p.x - pivot.x) }))
      .filter(({ w }) => w > Math.min(a, b) + 1e-9 && w < Math.max(a, b) - 1e-9)
      .sort((x, y) => (b > a ? x.w - y.w : y.w - x.w))
      .map(({ p }) => p)
    keile.push([pivot, pa, ...zwischen, pb])
  }
  return keile
}

function stufenGerade(treppe: TreppenObjekt, n: number) {
  const laufAchseIstX = treppe.breite >= treppe.hoehe
  const laenge = laufAchseIstX ? treppe.breite : treppe.hoehe
  const quer = laufAchseIstX ? treppe.hoehe : treppe.breite
  const zu = (u: number, v: number): Point => (laufAchseIstX ? { x: u, y: v } : { x: v, y: u })
  const tiefe = laenge / n
  const stufen: TreppenStufe[] = []
  for (let k = 0; k < n; k++) {
    const u = -laenge / 2 + k * tiefe
    stufen.push({ polygon: rechteckUv(u, u + tiefe, -quer / 2, quer / 2, zu), hoehenIndex: k })
  }
  return { stufen, steigungen: n }
}

function stufenU(treppe: TreppenObjekt, n: number) {
  const laufAchseIstX = treppe.breite >= treppe.hoehe
  const laenge = laufAchseIstX ? treppe.breite : treppe.hoehe
  const quer = laufAchseIstX ? treppe.hoehe : treppe.breite
  const zu = (u: number, v: number): Point => (laufAchseIstX ? { x: u, y: v } : { x: v, y: u })
  const wendeTiefe = Math.min(quer / 2, laenge * 0.4)
  const stepsHin = Math.ceil(n / 2)
  const stepsRueck = Math.max(1, n - stepsHin)
  const restLaenge = Math.max(0.01, laenge - wendeTiefe)
  const tiefeHin = restLaenge / stepsHin
  const tiefeRueck = restLaenge / stepsRueck
  const uStart = -laenge / 2
  const uWende = laenge / 2 - wendeTiefe

  const stufen: TreppenStufe[] = []
  for (let k = 0; k < stepsHin; k++) {
    const u = uStart + k * tiefeHin
    stufen.push({ polygon: rechteckUv(u, u + tiefeHin, 0, quer / 2, zu), hoehenIndex: k })
  }
  let index = stepsHin
  if (treppe.form === 'u-kehre') {
    const keile = wendelKeile(
      { x: uWende, y: 0 },
      Math.PI / 2,
      -Math.PI / 2,
      [
        { x: uWende, y: quer / 2 },
        { x: laenge / 2, y: quer / 2 },
        { x: laenge / 2, y: -quer / 2 },
        { x: uWende, y: -quer / 2 },
      ],
      WENDELSTUFEN_180,
    )
    for (const keil of keile)
      stufen.push({ polygon: keil.map((p) => zu(p.x, p.y)), hoehenIndex: index++ })
  } else {
    stufen.push({
      polygon: rechteckUv(uWende, laenge / 2, -quer / 2, quer / 2, zu),
      hoehenIndex: index++,
    })
  }
  for (let k = 0; k < stepsRueck; k++) {
    const u = uWende - (k + 1) * tiefeRueck
    stufen.push({ polygon: rechteckUv(u, u + tiefeRueck, -quer / 2, 0, zu), hoehenIndex: index++ })
  }
  return { stufen, steigungen: index }
}

function stufenL(treppe: TreppenObjekt, n: number) {
  const laengeA = Math.max(0.01, treppe.lFormLaufALaenge)
  const breiteA = Math.max(0.01, treppe.lFormLaufABreite)
  const laengeB = Math.max(0.01, treppe.lFormLaufBLaenge)
  const breiteB = Math.max(0.01, treppe.lFormLaufBBreite)
  const breite = laengeA + breiteB
  const hoehe = laengeB + breiteA
  const rest = Math.max(2, n - WENDELSTUFEN_90)
  const stepsA = Math.min(Math.max(1, Math.round((rest * laengeA) / (laengeA + laengeB))), rest - 1)
  const stepsB = Math.max(1, rest - stepsA)
  const tiefeA = laengeA / stepsA
  const tiefeB = laengeB / stepsB
  const xStart = -breite / 2
  const xEnde = breite / 2
  const xEcke = xEnde - breiteB
  const yStart = -hoehe / 2
  const yEcke = yStart + breiteA
  const zu = (x: number, y: number): Point => ({ x, y })

  const stufen: TreppenStufe[] = []
  let index = 0
  for (let k = 0; k < stepsA; k++) {
    const x = xStart + k * tiefeA
    stufen.push({ polygon: rechteckUv(x, x + tiefeA, yStart, yEcke, zu), hoehenIndex: index++ })
  }
  const keile = wendelKeile(
    { x: xEcke, y: yEcke },
    -Math.PI / 2,
    0,
    [
      { x: xEcke, y: yStart },
      { x: xEnde, y: yStart },
      { x: xEnde, y: yEcke },
    ],
    WENDELSTUFEN_90,
  )
  for (const keil of keile) stufen.push({ polygon: keil, hoehenIndex: index++ })
  for (let k = 0; k < stepsB; k++) {
    const y = yEcke + k * tiefeB
    stufen.push({ polygon: rechteckUv(xEcke, xEnde, y, y + tiefeB, zu), hoehenIndex: index++ })
  }
  return { stufen, steigungen: index }
}
