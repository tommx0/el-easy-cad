export interface GestenPunkt {
  x: number
  y: number
}

export type ZeigerPhase = 'runter' | 'bewegt' | 'hoch'

export interface TouchGestenZiel {
  links(phase: ZeigerPhase, p: GestenPunkt): void
  rechts(phase: ZeigerPhase, p: GestenPunkt): void
  rechtsAbbrechen(): void
  doppelklick(p: GestenPunkt): void
  zweiFinger(mitte: GestenPunkt, faktor: number, verschiebung: GestenPunkt): void
  zweiFingerEnde(): void
  langDruckErkannt(): void
}

export interface TouchGestenZeitgeber {
  setTimeout(fn: () => void, ms: number): unknown
  clearTimeout(handle: unknown): void
}

export const LANGDRUCK_MS = 500
export const BEWEGUNG_SCHWELLE_PX = 10
export const DOPPELTIPP_MS = 350
export const DOPPELTIPP_ABSTAND_PX = 30

type Zustand =
  | { art: 'ruht' }
  | { art: 'wartet'; id: number; start: GestenPunkt; timer: unknown }
  | { art: 'links'; id: number }
  | { art: 'rechts'; id: number; start: GestenPunkt; zieht: boolean }
  | { art: 'zweiFinger'; ids: [number, number] }
  | { art: 'auslaufen' }

function abstand(a: GestenPunkt, b: GestenPunkt): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function mitteVon(a: GestenPunkt, b: GestenPunkt): GestenPunkt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export class TouchGesten {
  private zustand: Zustand = { art: 'ruht' }
  private readonly positionen = new Map<number, GestenPunkt>()
  private letzterTipp: { p: GestenPunkt; zeit: number } | null = null
  private readonly ziel: TouchGestenZiel
  private readonly zeitgeber: TouchGestenZeitgeber

  constructor(
    ziel: TouchGestenZiel,
    zeitgeber: TouchGestenZeitgeber = {
      setTimeout: (fn, ms) => window.setTimeout(fn, ms),
      clearTimeout: (h) => window.clearTimeout(h as number),
    },
  ) {
    this.ziel = ziel
    this.zeitgeber = zeitgeber
  }

  istAktiv(): boolean {
    return this.zustand.art !== 'ruht'
  }

  runter(id: number, p: GestenPunkt) {
    this.positionen.set(id, p)
    const z = this.zustand
    if (z.art === 'ruht') {
      const timer = this.zeitgeber.setTimeout(() => this.langDruck(id), LANGDRUCK_MS)
      this.zustand = { art: 'wartet', id, start: p, timer }
      return
    }
    if (z.art === 'wartet' || z.art === 'rechts') {
      if (z.art === 'wartet') this.zeitgeber.clearTimeout(z.timer)
      else this.ziel.rechtsAbbrechen()
      this.zustand = { art: 'zweiFinger', ids: [z.id, id] }
    }
  }

  bewegt(id: number, p: GestenPunkt) {
    const vorher = this.positionen.get(id)
    if (!vorher) return
    const z = this.zustand
    if (z.art === 'zweiFinger') {
      const [a, b] = z.ids
      const andererId = id === a ? b : id === b ? a : null
      const anderer = andererId === null ? undefined : this.positionen.get(andererId)
      this.positionen.set(id, p)
      if (!anderer) return
      const abstandVorher = abstand(vorher, anderer)
      const faktor = abstandVorher > 0 ? abstand(p, anderer) / abstandVorher : 1
      const mitteVorher = mitteVon(vorher, anderer)
      const mitteJetzt = mitteVon(p, anderer)
      this.ziel.zweiFinger(mitteJetzt, faktor, {
        x: mitteJetzt.x - mitteVorher.x,
        y: mitteJetzt.y - mitteVorher.y,
      })
      return
    }
    this.positionen.set(id, p)
    if (z.art === 'wartet' && z.id === id) {
      if (abstand(p, z.start) <= BEWEGUNG_SCHWELLE_PX) return
      this.zeitgeber.clearTimeout(z.timer)
      this.zustand = { art: 'links', id }
      this.ziel.links('bewegt', z.start)
      this.ziel.links('runter', z.start)
      this.ziel.links('bewegt', p)
      return
    }
    if (z.art === 'links' && z.id === id) {
      this.ziel.links('bewegt', p)
    } else if (z.art === 'rechts' && z.id === id) {
      if (!z.zieht && abstand(p, z.start) <= BEWEGUNG_SCHWELLE_PX) return
      z.zieht = true
      this.ziel.rechts('bewegt', p)
    }
  }

  hoch(id: number, p: GestenPunkt, zeit: number) {
    if (!this.positionen.has(id)) return
    this.positionen.delete(id)
    const z = this.zustand
    switch (z.art) {
      case 'wartet': {
        if (z.id !== id) break
        this.zeitgeber.clearTimeout(z.timer)
        this.zustand = { art: 'ruht' }
        this.ziel.links('bewegt', z.start)
        this.ziel.links('runter', z.start)
        this.ziel.links('hoch', z.start)
        const vorher = this.letzterTipp
        if (
          vorher &&
          zeit - vorher.zeit <= DOPPELTIPP_MS &&
          abstand(vorher.p, z.start) <= DOPPELTIPP_ABSTAND_PX
        ) {
          this.letzterTipp = null
          this.ziel.doppelklick(z.start)
        } else {
          this.letzterTipp = { p: z.start, zeit }
        }
        break
      }
      case 'links':
        if (z.id !== id) break
        this.zustand = { art: 'ruht' }
        this.ziel.links('hoch', p)
        break
      case 'rechts':
        if (z.id !== id) break
        this.zustand = { art: 'ruht' }
        this.ziel.rechts('hoch', z.zieht ? p : z.start)
        break
      case 'zweiFinger':
        this.ziel.zweiFingerEnde()
        this.zustand = this.positionen.size > 0 ? { art: 'auslaufen' } : { art: 'ruht' }
        break
      case 'auslaufen':
        if (this.positionen.size === 0) this.zustand = { art: 'ruht' }
        break
      case 'ruht':
        break
    }
  }

  abbrechen(id: number) {
    const p = this.positionen.get(id)
    if (!p) return
    const z = this.zustand
    if (z.art === 'wartet' && z.id === id) {
      this.zeitgeber.clearTimeout(z.timer)
      this.positionen.delete(id)
      this.zustand = { art: 'ruht' }
      return
    }
    this.hoch(id, p, Number.NEGATIVE_INFINITY)
  }

  private langDruck(id: number) {
    const z = this.zustand
    if (z.art !== 'wartet' || z.id !== id) return
    this.zustand = { art: 'rechts', id, start: z.start, zieht: false }
    this.letzterTipp = null
    this.ziel.langDruckErkannt()
    this.ziel.rechts('runter', z.start)
  }
}
