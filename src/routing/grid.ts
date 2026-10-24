import type { BoundingBox, Point } from '../document-model'
import { boundingBoxFromPoints, distanceToSegment, expandBoundingBox } from '../document-model'
import type { WandStreifen } from './obstacles'
import type { WandStrecke } from './waende'
import { wandStreckeBox } from './waende'

export interface Zelle {
  gx: number
  gy: number
}

export interface WandRaster {
  strecken: WandStrecke[]
  abstandMeter: number
  naheMeter?: number
  seiteVon?: Point
  raumGrenzen?: WandStrecke[]
  aufOberflaeche?: boolean
}

export interface RoutingGrid {
  zellgroesse: number
  breite: number
  hoehe: number
  readonly zellArten: Uint8Array
  istBlockiert(zelle: Zelle): boolean
  istWand(zelle: Zelle): boolean
  istKorridor(zelle: Zelle): boolean
  readonly startSeite: Uint8Array | null
  zellBereich(bb: BoundingBox): ZellBereich
  freigeben(zellen: readonly Zelle[]): void
  weltZuZelle(p: Point): Zelle
  zelleZuWelt(zelle: Zelle): Point
}

export interface ZellBereich {
  minGx: number
  maxGx: number
  minGy: number
  maxGy: number
}

export const STREIFEN_IN_DER_WAND = 0.15

export const ZELLART_FREI = 0
export const ZELLART_BLOCKIERT = 1
export const ZELLART_WAND = 2
export const ZELLART_KORRIDOR = 3
export const ZELLART_NAHE = 4
const FREI = ZELLART_FREI
const BLOCKIERT = ZELLART_BLOCKIERT
const WAND = ZELLART_WAND
const KORRIDOR = ZELLART_KORRIDOR
const NAHE = ZELLART_NAHE

export function erzeugeRoutingGrid(
  hindernisse: BoundingBox[],
  suchraum: BoundingBox,
  zellgroesse: number,
  waende: WandRaster | null = null,
  sperren: readonly WandStrecke[] = [],
  freiStreifen: readonly WandStreifen[] = [],
): RoutingGrid {
  const ursprung: Point = { x: suchraum.min.x, y: suchraum.min.y }
  const breite = Math.ceil((suchraum.max.x - ursprung.x) / zellgroesse) + 1
  const hoehe = Math.ceil((suchraum.max.y - ursprung.y) / zellgroesse) + 1
  const art = new Uint8Array(breite * hoehe)

  const zelleZuWelt = (zelle: Zelle): Point => ({
    x: ursprung.x + zelle.gx * zellgroesse,
    y: ursprung.y + zelle.gy * zellgroesse,
  })

  const zellBereich = (bb: BoundingBox): ZellBereich => ({
    minGx: Math.floor((bb.min.x - ursprung.x) / zellgroesse),
    maxGx: Math.ceil((bb.max.x - ursprung.x) / zellgroesse),
    minGy: Math.floor((bb.min.y - ursprung.y) / zellgroesse),
    maxGy: Math.ceil((bb.max.y - ursprung.y) / zellgroesse),
  })

  const fuerZellenIn = (bb: BoundingBox, f: (index: number, gx: number, gy: number) => void) => {
    const bereich = zellBereich(bb)
    const minGx = Math.max(0, bereich.minGx)
    const maxGx = Math.min(breite - 1, bereich.maxGx)
    const minGy = Math.max(0, bereich.minGy)
    const maxGy = Math.min(hoehe - 1, bereich.maxGy)
    for (let gy = minGy; gy <= maxGy; gy++) {
      for (let gx = minGx; gx <= maxGx; gx++) f(gy * breite + gx, gx, gy)
    }
  }

  if (waende) {
    const halbeZelle = zellgroesse / 2
    const korridorMin = waende.aufOberflaeche
      ? Number.EPSILON
      : Math.max(halbeZelle, waende.abstandMeter - halbeZelle)
    const korridorMax = waende.aufOberflaeche
      ? zellgroesse + 1e-9
      : waende.abstandMeter + halbeZelle
    const naheMax = Math.max(waende.naheMeter ?? 0, korridorMax)
    for (const w of waende.strecken) {
      fuerZellenIn(wandStreckeBox(w, naheMax), (i, gx, gy) => {
        const abstand = distanceToSegment(zelleZuWelt({ gx, gy }), w.a, w.b) - w.halbeStaerke
        if (abstand >= korridorMin && abstand <= korridorMax) {
          if (art[i] === FREI || art[i] === NAHE) art[i] = KORRIDOR
        } else if (abstand > 0 && abstand <= naheMax && art[i] === FREI) art[i] = NAHE
      })
    }
    for (const w of waende.strecken) {
      fuerZellenIn(wandStreckeBox(w, 0), (i, gx, gy) => {
        const abstand = distanceToSegment(zelleZuWelt({ gx, gy }), w.a, w.b) - w.halbeStaerke
        if (abstand <= 0) art[i] = WAND
      })
    }
  }
  const index = (zelle: Zelle): number =>
    zelle.gx < 0 || zelle.gx >= breite || zelle.gy < 0 || zelle.gy >= hoehe
      ? -1
      : zelle.gy * breite + zelle.gx
  const weltZuZelle = (p: Point): Zelle => ({
    gx: Math.round((p.x - ursprung.x) / zellgroesse),
    gy: Math.round((p.y - ursprung.y) / zellgroesse),
  })

  let startSeite: Uint8Array | null = null
  const grenze = new Uint8Array(waende?.seiteVon && waende.raumGrenzen ? breite * hoehe : 0)
  for (const w of grenze.length > 0 ? waende!.raumGrenzen! : []) {
    fuerZellenIn(wandStreckeBox(w, 0), (i, gx, gy) => {
      if (distanceToSegment(zelleZuWelt({ gx, gy }), w.a, w.b) <= w.halbeStaerke) grenze[i] = 1
    })
  }
  const startIndex = grenze.length > 0 ? index(weltZuZelle(waende!.seiteVon!)) : -1
  if (startIndex >= 0 && !grenze[startIndex]) {
    startSeite = new Uint8Array(breite * hoehe)
    const offen = [startIndex]
    startSeite[startIndex] = 1
    while (offen.length > 0) {
      const i = offen.pop()!
      const gx = i % breite
      const nachbarn = [
        gx > 0 ? i - 1 : -1,
        gx < breite - 1 ? i + 1 : -1,
        i >= breite ? i - breite : -1,
        i + breite < art.length ? i + breite : -1,
      ]
      for (const n of nachbarn) {
        if (n < 0 || startSeite[n] || grenze[n]) continue
        startSeite[n] = 1
        offen.push(n)
      }
    }
  }

  const imStreifen = new Uint8Array(freiStreifen.length > 0 ? breite * hoehe : 0)
  for (const st of freiStreifen) {
    const laenge = Math.hypot(st.b.x - st.a.x, st.b.y - st.a.y)
    if (laenge < 1e-9) continue
    const u = { x: (st.b.x - st.a.x) / laenge, y: (st.b.y - st.a.y) / laenge }
    const versatz = (p: Point, f: number) => ({ x: p.x + st.raum.x * f, y: p.y + st.raum.y * f })
    const huelle = expandBoundingBox(
      boundingBoxFromPoints([
        versatz(st.a, -STREIFEN_IN_DER_WAND),
        versatz(st.b, -STREIFEN_IN_DER_WAND),
        versatz(st.a, zellgroesse),
        versatz(st.b, zellgroesse),
      ]),
      zellgroesse,
    )
    fuerZellenIn(huelle, (i, gx, gy) => {
      const p = zelleZuWelt({ gx, gy })
      const dx = p.x - st.a.x
      const dy = p.y - st.a.y
      const entlang = dx * u.x + dy * u.y
      const quer = dx * st.raum.x + dy * st.raum.y
      if (entlang < -zellgroesse || entlang > laenge + zellgroesse) return
      if (quer < -STREIFEN_IN_DER_WAND || quer > zellgroesse + 1e-9) return
      imStreifen[i] = 1
    })
  }
  for (const bb of hindernisse) {
    fuerZellenIn(bb, (i) => {
      if (imStreifen.length === 0 || !imStreifen[i]) art[i] = BLOCKIERT
    })
  }
  for (const f of sperren) {
    fuerZellenIn(wandStreckeBox(f, 0), (i, gx, gy) => {
      if (distanceToSegment(zelleZuWelt({ gx, gy }), f.a, f.b) <= f.halbeStaerke) art[i] = BLOCKIERT
    })
  }

  return {
    zellgroesse,
    breite,
    hoehe,
    zellArten: art,
    startSeite,
    istBlockiert: (zelle) => {
      const i = index(zelle)
      return i < 0 || art[i] === BLOCKIERT
    },
    istWand: (zelle) => {
      const i = index(zelle)
      return i >= 0 && art[i] === WAND
    },
    istKorridor: (zelle) => {
      const i = index(zelle)
      return i >= 0 && art[i] === KORRIDOR
    },
    zellBereich,
    freigeben: (zellen) => {
      for (const z of zellen) {
        const i = index(z)
        if (i >= 0 && art[i] === BLOCKIERT) art[i] = FREI
      }
    },
    weltZuZelle,
    zelleZuWelt,
  }
}
