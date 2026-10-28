import type { BoundingBox, Point } from '../document-model'
import {
  AP_ABSTAND_METER,
  boundingBoxFromPoints,
  boundingBoxUeberlappt,
  distanceToSegment,
  expandBoundingBox,
  pointInBoundingBox,
  rotatePoint,
  WAND_NAEHE_METER,
} from '../document-model'
import {
  ROUTING_RAUMQUERUNG_ZUSATZRAND_METER,
  ROUTING_RAUMQUERUNGS_KOSTEN,
  ROUTING_WANDFUEHRUNG_ZUSATZRAND_METER,
  ROUTING_ZELLGROESSE_METER,
} from './constants'
import type { RoutingGrid, Zelle } from './grid'
import { erzeugeRoutingGrid, STREIFEN_IN_DER_WAND } from './grid'
import type { WandKosten } from './astar'
import { sucheGitterPfad } from './astar'
import type { RoutingHindernisseEingabe, WandAnfahrt, WandStreifen } from './obstacles'
import type { RoutingAufruf } from './routing-settings'
import type { BelegungsAufruf } from './belegung'
import { rastereBelegung } from './belegung'
import { WAND_BEVORZUGUNG_MAX } from './routing-settings'
import type { WandStrecke } from './waende'
import { wandStreckeBox } from './waende'

function normalisiereWinkelDiff(w: number): number {
  let r = w % (Math.PI * 2)
  if (r > Math.PI) r -= Math.PI * 2
  if (r < -Math.PI) r += Math.PI * 2
  return r
}

function vereinfachePfad(punkte: Point[]): Point[] {
  if (punkte.length <= 2) return punkte
  const ergebnis: Point[] = [punkte[0]]
  for (let i = 1; i < punkte.length - 1; i++) {
    const a = ergebnis[ergebnis.length - 1]
    const b = punkte[i]
    const c = punkte[i + 1]
    const richtung1 = Math.atan2(b.y - a.y, b.x - a.x)
    const richtung2 = Math.atan2(c.y - b.y, c.x - b.x)
    if (Math.abs(normalisiereWinkelDiff(richtung1 - richtung2)) > 1e-6) {
      ergebnis.push(b)
    }
  }
  ergebnis.push(punkte[punkte.length - 1])
  return ergebnis
}

const NULLPUNKT: Point = { x: 0, y: 0 }

const GLEICH_EPSILON = 1e-9

function richteEndenRechtwinkligAus(mitten: Point[], start: Point, ziel: Point): Point[] {
  const gleich = (a: number, b: number) => Math.abs(a - b) < GLEICH_EPSILON
  const waagrecht = (a: Point, b: Point) => gleich(a.y, b.y) && !gleich(a.x, b.x)
  const versatz = (a: Point, b: Point, inX: boolean): Point[] => {
    if (gleich(a.x, b.x) || gleich(a.y, b.y)) return [a, b]
    if (inX) {
      const mx = (a.x + b.x) / 2
      return [a, { x: mx, y: a.y }, { x: mx, y: b.y }, b]
    }
    const my = (a.y + b.y) / 2
    return [a, { x: a.x, y: my }, { x: b.x, y: my }, b]
  }

  if (mitten.length < 2) {
    return versatz(start, ziel, Math.abs(ziel.x - start.x) >= Math.abs(ziel.y - start.y))
  }
  if (mitten.length === 2) return versatz(start, ziel, waagrecht(mitten[0], mitten[1]))
  const p = mitten.map((q) => ({ ...q }))
  const n = p.length
  if (waagrecht(p[0], p[1])) p[1].y = start.y
  else p[1].x = start.x
  if (waagrecht(p[n - 2], p[n - 1])) p[n - 2].y = ziel.y
  else p[n - 2].x = ziel.x
  p[0] = start
  p[n - 1] = ziel
  return entferneUeberfluessigePunkte(p)
}

function entferneUeberfluessigePunkte(punkte: Point[]): Point[] {
  const ohneDoppelte = punkte.filter(
    (q, i) =>
      i === 0 ||
      Math.abs(q.x - punkte[i - 1].x) > GLEICH_EPSILON ||
      Math.abs(q.y - punkte[i - 1].y) > GLEICH_EPSILON,
  )
  return vereinfachePfad(ohneDoppelte)
}

const RICHTUNGEN_GERADE: Zelle[] = [
  { gx: 1, gy: 0 },
  { gx: -1, gy: 0 },
  { gx: 0, gy: 1 },
  { gx: 0, gy: -1 },
]

const AUSGANG_TOLERANZ_METER = 1e-9

function eigeneBox(punkt: Point, boxen: readonly BoundingBox[], spiel: number): BoundingBox | null {
  let eigene: BoundingBox | null = null
  for (const bb of boxen) {
    if (!pointInBoundingBox(punkt, expandBoundingBox(bb, spiel))) continue
    if (!eigene || boxFlaeche(bb) < boxFlaeche(eigene)) eigene = bb
  }
  return eigene
}

const RICHTUNG_INDEX = { rechts: 0, oben: 2, links: 4, unten: 6 } as const

function anfahrtsSeite(
  punkt: Point,
  boxen: readonly BoundingBox[],
  gegenpunkt: Point,
  spiel: number,
  zurWand: Point | null = null,
): { richtung: number; schritt: Zelle } | null {
  const bb = eigeneBox(punkt, boxen, spiel)
  if (!bb) return null
  if (zurWand) {
    const achsen = [
      { richtung: RICHTUNG_INDEX.rechts, schritt: { gx: 1, gy: 0 } },
      { richtung: RICHTUNG_INDEX.links, schritt: { gx: -1, gy: 0 } },
      { richtung: RICHTUNG_INDEX.oben, schritt: { gx: 0, gy: 1 } },
      { richtung: RICHTUNG_INDEX.unten, schritt: { gx: 0, gy: -1 } },
    ]
    const skalar = (a: (typeof achsen)[number]) =>
      a.schritt.gx * zurWand.x + a.schritt.gy * zurWand.y
    return achsen.reduce((beste, a) => (skalar(a) > skalar(beste) + 1e-9 ? a : beste))
  }
  const seiten = [
    { abstand: bb.max.x - punkt.x, richtung: RICHTUNG_INDEX.rechts, schritt: { gx: 1, gy: 0 } },
    { abstand: punkt.x - bb.min.x, richtung: RICHTUNG_INDEX.links, schritt: { gx: -1, gy: 0 } },
    { abstand: bb.max.y - punkt.y, richtung: RICHTUNG_INDEX.oben, schritt: { gx: 0, gy: 1 } },
    { abstand: punkt.y - bb.min.y, richtung: RICHTUNG_INDEX.unten, schritt: { gx: 0, gy: -1 } },
  ]
  const kleinster = Math.min(...seiten.map((s) => s.abstand))
  const hin = { x: gegenpunkt.x - punkt.x, y: gegenpunkt.y - punkt.y }
  return seiten
    .filter((s) => s.abstand <= kleinster + 1e-6)
    .sort(
      (a, b) =>
        b.schritt.gx * hin.x + b.schritt.gy * hin.y - (a.schritt.gx * hin.x + a.schritt.gy * hin.y),
    )[0]
}

function oeffneAusgang(
  grid: RoutingGrid,
  punkt: Point,
  boxen: readonly BoundingBox[],
  nurRichtung: Zelle | null = null,
  durchlass: readonly BoundingBox[] = [],
): boolean {
  const zelle = grid.weltZuZelle(punkt)
  if (!grid.istBlockiert(zelle)) return true
  const eigene = eigeneBox(punkt, boxen, AUSGANG_TOLERANZ_METER)
  if (!eigene) return false
  const inBereich = (bereich: ReturnType<RoutingGrid['zellBereich']>) => (z: Zelle) =>
    z.gx >= bereich.minGx && z.gx <= bereich.maxGx && z.gy >= bereich.minGy && z.gy <= bereich.maxGy
  const imBereich = inBereich(grid.zellBereich(eigene))
  const imDurchlass = durchlass.map((bb) => inBereich(grid.zellBereich(bb)))
  const imGitter = (z: Zelle) => z.gx >= 0 && z.gy >= 0 && z.gx < grid.breite && z.gy < grid.hoehe

  let bester: Zelle[] | null = null
  for (const r of nurRichtung ? [nurRichtung] : RICHTUNGEN_GERADE) {
    const schritt = (k: number) => ({ gx: zelle.gx + r.gx * k, gy: zelle.gy + r.gy * k })
    let letzterDurchlass = 0
    if (imDurchlass.length > 0) {
      for (let k = 1; imGitter(schritt(k)); k++) {
        if (imDurchlass.some((drin) => drin(schritt(k)))) letzterDurchlass = k
      }
    }
    const kanal: Zelle[] = [zelle]
    for (let k = 1; !bester || kanal.length < bester.length; k++) {
      const z = schritt(k)
      if (!imGitter(z)) break
      if (k > letzterDurchlass && !imBereich(z)) {
        if (!grid.istBlockiert(z)) bester = kanal
        break
      }
      kanal.push(z)
    }
  }
  if (!bester) return false
  grid.freigeben(bester)
  return true
}

function wandAnfahrtAn(punkt: Point, hindernisse: RoutingHindernisseEingabe): WandAnfahrt | null {
  if (Array.isArray(hindernisse)) return null
  return (
    hindernisse.wandAnfahrten?.find((w) =>
      w.punkte.some(
        (p) =>
          Math.abs(p.x - punkt.x) < WAND_PUNKT_TOLERANZ &&
          Math.abs(p.y - punkt.y) < WAND_PUNKT_TOLERANZ,
      ),
    ) ?? null
  )
}

const WAND_PUNKT_TOLERANZ = 1e-6

function durchlassBoxen(anfahrt: WandAnfahrt | null, boxen: readonly BoundingBox[]): BoundingBox[] {
  if (!anfahrt) return []
  return anfahrt.durchlass.flatMap((p) => eigeneBox(p, boxen, AUSGANG_TOLERANZ_METER) ?? [])
}

function vorDerWand(punkt: Point, anfahrt: WandAnfahrt | null): Point | null {
  if (!anfahrt?.aufPutz) return null
  const raum = { x: -anfahrt.zurWand.x, y: -anfahrt.zurWand.y }
  const abstand =
    (punkt.x - anfahrt.oberflaeche.x) * raum.x + (punkt.y - anfahrt.oberflaeche.y) * raum.y
  const weg = abstand - AP_ABSTAND_METER
  if (weg < 1e-4) return null
  return { x: punkt.x - raum.x * weg, y: punkt.y - raum.y * weg }
}

const STREIFEN_PARALLEL_SINUS = Math.sin((5 * Math.PI) / 180)

function aufWandStreifen(
  pfad: Point[],
  streifen: readonly WandStreifen[],
  zellgroesse: number,
): Point[] {
  if (streifen.length === 0 || pfad.length < 4) return pfad
  const schub: Map<WandStreifen, Point>[] = pfad.map(() => new Map())
  for (let i = 1; i < pfad.length - 2; i++) {
    const p = pfad[i]
    const q = pfad[i + 1]
    const laenge = Math.hypot(q.x - p.x, q.y - p.y)
    if (laenge < 1e-6) continue
    for (const st of streifen) {
      const sl = Math.hypot(st.b.x - st.a.x, st.b.y - st.a.y)
      if (sl < 1e-9) continue
      const u = { x: (st.b.x - st.a.x) / sl, y: (st.b.y - st.a.y) / sl }
      const kreuz = ((q.x - p.x) * u.y - (q.y - p.y) * u.x) / laenge
      if (Math.abs(kreuz) > STREIFEN_PARALLEL_SINUS) continue
      const quer = (r: Point) => (r.x - st.a.x) * st.raum.x + (r.y - st.a.y) * st.raum.y
      const entlang = (r: Point) => (r.x - st.a.x) * u.x + (r.y - st.a.y) * u.y
      const im = (d: number) => d >= -STREIFEN_IN_DER_WAND - 1e-9 && d <= zellgroesse + 1e-9
      if (!im(quer(p)) || !im(quer(q))) continue
      if (Math.max(entlang(p), entlang(q)) < 0 || Math.min(entlang(p), entlang(q)) > sl) continue
      const delta = AP_ABSTAND_METER - (quer(p) + quer(q)) / 2
      if (Math.abs(delta) < 1e-6) break
      const v = { x: st.raum.x * delta, y: st.raum.y * delta }
      schub[i].set(st, v)
      schub[i + 1].set(st, v)
      break
    }
  }
  return pfad.map((p, i) => {
    const versaetze: Point[] = []
    for (const v of schub[i].values()) {
      const laenge = Math.hypot(v.x, v.y)
      const parallel = versaetze.some(
        (w) => Math.abs(v.x * w.y - v.y * w.x) < 1e-9 * Math.max(laenge, 1) && laenge > 0,
      )
      if (!parallel) versaetze.push(v)
    }
    return versaetze.reduce((r, v) => ({ x: r.x + v.x, y: r.y + v.y }), p)
  })
}

function aufFestemRaster(bb: BoundingBox, raster: number | null): BoundingBox {
  if (raster === null) return bb
  return {
    min: { x: Math.floor(bb.min.x / raster) * raster, y: Math.floor(bb.min.y / raster) * raster },
    max: bb.max,
  }
}

function boxFlaeche(bb: BoundingBox): number {
  return (bb.max.x - bb.min.x) * (bb.max.y - bb.min.y)
}

export function routePath(
  start: Point,
  ziel: Point,
  hindernisse: RoutingHindernisseEingabe,
  settings: RoutingAufruf,
  zellgroesse: number = ROUTING_ZELLGROESSE_METER,
  nurRechtwinklig = false,
  belegung: BelegungsAufruf | null = null,
): Point[] | null {
  const ausrichtung = Array.isArray(hindernisse) ? 0 : (hindernisse.ausrichtung ?? 0)
  if (ausrichtung !== 0 && !Array.isArray(hindernisse)) {
    const hinein = (p: Point) => rotatePoint(p, NULLPUNKT, -ausrichtung)
    const pfad = routePath(
      hinein(start),
      hinein(ziel),
      { ...hindernisse, ausrichtung: 0 },
      settings,
      zellgroesse,
      nurRechtwinklig,
      belegung && {
        ...belegung,
        belegung: {
          ...belegung.belegung,
          bahnen: belegung.belegung.bahnen.map((b) => ({ ...b, punkte: b.punkte.map(hinein) })),
        },
      },
    )
    if (!pfad) return null
    const zurueck = pfad.map((p) => rotatePoint(p, NULLPUNKT, ausrichtung))
    zurueck[0] = start
    zurueck[zurueck.length - 1] = ziel
    return zurueck
  }
  const nurInBauteilen = settings.nurInBauteilen === true
  const unterBruestung = (f: WandStrecke) =>
    settings.leitungHoeheMeter !== undefined &&
    f.unterkanteMeter !== undefined &&
    settings.leitungHoeheMeter < f.unterkanteMeter
  const alleFenster = Array.isArray(hindernisse) ? [] : (hindernisse.fensterSperren ?? [])
  const fensterSperren = alleFenster.filter(
    (f) =>
      !unterBruestung(f) &&
      [start, ziel].every(
        (p) => distanceToSegment(p, f.a, f.b) > f.halbeStaerke + WAND_NAEHE_METER,
      ),
  )
  const { boxen, waende } = Array.isArray(hindernisse)
    ? { boxen: hindernisse, waende: [] }
    : {
        boxen: hindernisse.boxen,
        waende: nurInBauteilen
          ? (hindernisse.waendeMitFenstern ?? hindernisse.waende)
          : [...hindernisse.waende, ...alleFenster.filter(unterBruestung)],
      }
  const raumGrenzen = Array.isArray(hindernisse) ? undefined : hindernisse.raumGrenzen
  const streifen = Array.isArray(hindernisse) ? [] : (hindernisse.wandStreifen ?? [])
  const wandabstand = nurInBauteilen ? zellgroesse : settings.wandabstandMeter
  const wandAktiv = (settings.wandfuehrung || nurInBauteilen) && waende.length > 0
  const korridorRand = Math.max(wandabstand + zellgroesse, nurInBauteilen ? WAND_NAEHE_METER : 0)
  const suchSettings = nurInBauteilen
    ? { ...settings, kosten45: Math.max(settings.kosten45, 2 * settings.kosten90) }
    : settings
  const zusatzRand = !wandAktiv
    ? 0
    : nurInBauteilen
      ? ROUTING_RAUMQUERUNG_ZUSATZRAND_METER
      : ROUTING_WANDFUEHRUNG_ZUSATZRAND_METER

  const wandStart = wandAnfahrtAn(start, hindernisse)
  const wandZiel = wandAnfahrtAn(ziel, hindernisse)
  const startVorWand = vorDerWand(start, wandStart)
  const zielVorWand = vorDerWand(ziel, wandZiel)
  if (startVorWand || zielVorWand) {
    const innen = routePath(
      startVorWand ?? start,
      zielVorWand ?? ziel,
      hindernisse,
      settings,
      zellgroesse,
      nurRechtwinklig,
      belegung,
    )
    if (innen) {
      return vereinfachePfad([
        ...(startVorWand ? [start] : []),
        ...innen,
        ...(zielVorWand ? [ziel] : []),
      ])
    }
  }
  const durchlassStart = durchlassBoxen(wandStart, boxen)
  const durchlassZiel = durchlassBoxen(wandZiel, boxen)
  const anfahrtStart = anfahrtsSeite(
    start,
    boxen,
    ziel,
    zellgroesse / 2,
    wandStart?.zurWand ?? null,
  )
  const anfahrtZiel = anfahrtsSeite(ziel, boxen, start, zellgroesse / 2, wandZiel?.zurWand ?? null)
  const gemeinsameBox =
    eigeneBox(start, boxen, zellgroesse / 2) !== null &&
    eigeneBox(start, boxen, zellgroesse / 2) === eigeneBox(ziel, boxen, zellgroesse / 2)
  const mitAnfahrt = !gemeinsameBox && (anfahrtStart !== null || anfahrtZiel !== null)
  for (const vorgeschrieben of mitAnfahrt ? [true, false] : [false]) {
    for (let versuch = 0; versuch <= settings.maxSuchbereichErweiterungen; versuch++) {
      const rand = zellgroesse * (6 + versuch * 12) + zusatzRand
      const suchraum = aufFestemRaster(
        expandBoundingBox(boundingBoxFromPoints([start, ziel]), rand),
        belegung ? zellgroesse : null,
      )
      const relevanteBoxen = boxen.filter((bb) => boundingBoxUeberlappt(bb, suchraum))
      const relevanteSperren = fensterSperren.filter((f) =>
        boundingBoxUeberlappt(wandStreckeBox(f, 0), suchraum),
      )
      const relevanteWaende = wandAktiv
        ? waende.filter((w) => boundingBoxUeberlappt(wandStreckeBox(w, korridorRand), suchraum))
        : []
      const grid = erzeugeRoutingGrid(
        relevanteBoxen,
        suchraum,
        zellgroesse,
        relevanteWaende.length > 0
          ? {
              strecken: relevanteWaende,
              abstandMeter: wandabstand,
              aufOberflaeche: nurInBauteilen,
              naheMeter: nurInBauteilen ? WAND_NAEHE_METER : undefined,
              seiteVon: nurInBauteilen ? start : undefined,
              raumGrenzen: nurInBauteilen ? raumGrenzen : undefined,
            }
          : null,
        relevanteSperren,
        streifen,
      )
      const wandKosten: WandKosten | null =
        relevanteWaende.length > 0
          ? {
              korridorFaktor:
                1 - Math.min(Math.max(settings.wandBevorzugung, 0), WAND_BEVORZUGUNG_MAX),
              querungsKosten: settings.wandQuerungsKosten,
              raumquerungsKosten: nurInBauteilen ? ROUTING_RAUMQUERUNGS_KOSTEN : 0,
            }
          : null
      const startSchritt = vorgeschrieben ? (anfahrtStart?.schritt ?? null) : null
      const zielSchritt = vorgeschrieben ? (anfahrtZiel?.schritt ?? null) : null
      if (
        !oeffneAusgang(
          grid,
          start,
          relevanteBoxen,
          startSchritt,
          startSchritt ? durchlassStart : [],
        ) ||
        !oeffneAusgang(grid, ziel, relevanteBoxen, zielSchritt, zielSchritt ? durchlassZiel : [])
      ) {
        continue
      }
      const startZelle = grid.weltZuZelle(start)
      const zielZelle = grid.weltZuZelle(ziel)
      const belegungsKosten = belegung
        ? rastereBelegung(
            grid,
            belegung,
            [start, ziel],
            suchSettings.kosten90 * (belegung.belegung.kreuzFaktor ?? 1),
          )
        : null
      const zellPfad = sucheGitterPfad(
        grid,
        startZelle,
        zielZelle,
        suchSettings,
        wandKosten,
        true,
        belegungsKosten,
        vorgeschrieben
          ? {
              start: anfahrtStart?.richtung ?? null,
              ziel: anfahrtZiel ? (anfahrtZiel.richtung + 4) % 8 : null,
            }
          : null,
      )
      if (zellPfad) {
        const weltPfad = zellPfad.map((z) => grid.zelleZuWelt(z))
        const rechtwinklig = richteEndenRechtwinkligAus(vereinfachePfad(weltPfad), start, ziel)
        if (nurRechtwinklig) return rechtwinklig
        return entferneUeberfluessigePunkte(aufWandStreifen(rechtwinklig, streifen, zellgroesse))
      }
    }
  }
  return null
}
