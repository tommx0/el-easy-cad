import type { Blatt, Installationszone, Raumquerung } from './blatt'
import type { Point } from './geometry'
import { pfadGesamtLaenge } from './geometry'
import type { ZonenDefinition } from './installationszonen'
import { zonenDefinition } from './installationszonen'
import type { LeitungsObjekt, Objekt } from './objekte'
import { punktAufPfad } from './trunk-kette'
import { ermittleWandAchsenStuecke, oeffnungenAufWand } from './wand'

export interface WandAchse {
  a: Point
  b: Point
  halbeStaerke: number
}

export const WAND_NAEHE_METER = 0.3
export const MINDEST_RAUMQUERUNG_METER = 0.5
const PROBE_METER = 0.05
const TOLERANZ_METER = 0.001

export function wandAchsenAufBlatt(objekte: readonly Objekt[]): {
  waende: WandAchse[]
  durchgaenge: WandAchse[]
  fenster: WandAchse[]
} {
  const waende: WandAchse[] = []
  const durchgaenge: WandAchse[] = []
  const fenster: WandAchse[] = []
  for (const o of objekte) {
    if (o.type !== 'wand') continue
    const halbeStaerke = o.staerke / 2
    const alle = oeffnungenAufWand(objekte, o.id)
    const oeffnungen = alle.filter((x) => x.type !== 'fenster')
    for (const achse of ermittleWandAchsenStuecke(o, oeffnungen)) {
      for (let i = 0; i < achse.length - 1; i++) {
        waende.push({ a: achse[i], b: achse[i + 1], halbeStaerke })
      }
    }
    const gesamt = pfadGesamtLaenge(o.punkte)
    if (gesamt === 0) continue
    for (const x of alle) {
      const halb = x.breite / 2 / gesamt
      ;(x.type === 'fenster' ? fenster : durchgaenge).push({
        a: punktAufPfad(o.punkte, x.t - halb),
        b: punktAufPfad(o.punkte, x.t + halb),
        halbeStaerke,
      })
    }
  }
  return { waende, durchgaenge, fenster }
}

export interface RaumquerungsUmgebung {
  waende: readonly WandAchse[]
  durchgaenge: readonly WandAchse[]
  zone: Raumquerung
  blattZone?: Installationszone
  standardAn: boolean
  zonen?: readonly ZonenDefinition[]
}

export function raumquerungsUmgebung(
  blatt: Blatt | undefined,
  zonen: readonly ZonenDefinition[] = [],
): RaumquerungsUmgebung | null {
  if (!blatt) return null
  const standardAn = blatt.geschoss?.nurInBauteilen ?? false
  const irgendeine = blatt.objekte.some(
    (o) => o.type === 'leitung' && giltNurInBauteilen(o, blatt.geschoss, zonen),
  )
  if (!irgendeine) return null
  const { waende, durchgaenge } = wandAchsenAufBlatt(blatt.objekte)
  return {
    waende,
    durchgaenge,
    zone: blatt.geschoss?.raumquerung ?? 'decke',
    blattZone: blatt.geschoss?.installationszone,
    standardAn,
    zonen,
  }
}

export function giltNurInBauteilen(
  leitung: Pick<LeitungsObjekt, 'nurInBauteilen' | 'installationszone'>,
  geschoss: { nurInBauteilen?: boolean; installationszone?: Installationszone } | undefined,
  eigene: readonly ZonenDefinition[] = [],
): boolean {
  return nurInBauteilenQuelle(leitung, geschoss, eigene) !== null
}

export function nurInBauteilenQuelle(
  leitung: Pick<LeitungsObjekt, 'nurInBauteilen' | 'installationszone'>,
  geschoss: { nurInBauteilen?: boolean; installationszone?: Installationszone } | undefined,
  eigene: readonly ZonenDefinition[] = [],
): 'leitung' | 'blatt' | 'wandzone' | null {
  if (leitung.nurInBauteilen !== undefined) return leitung.nurInBauteilen ? 'leitung' : null
  if (geschoss?.nurInBauteilen) return 'blatt'
  const zone = zonenDefinition(leitung.installationszone ?? geschoss?.installationszone, eigene)
  return zone?.bauteil === 'wand' ? 'wandzone' : null
}

function abstandZurStrecke(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const laenge2 = dx * dx + dy * dy
  const t =
    laenge2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / laenge2))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

function nahe(p: Point, achsen: readonly WandAchse[]): boolean {
  return achsen.some((w) => abstandZurStrecke(p, w.a, w.b) - w.halbeStaerke <= WAND_NAEHE_METER)
}

function waendeNahe(a: Point, b: Point, waende: readonly WandAchse[]): WandAchse[] {
  return waende.filter((w) => {
    const r = w.halbeStaerke + WAND_NAEHE_METER
    return (
      Math.min(w.a.x, w.b.x) - r <= Math.max(a.x, b.x) &&
      Math.max(w.a.x, w.b.x) + r >= Math.min(a.x, b.x) &&
      Math.min(w.a.y, w.b.y) - r <= Math.max(a.y, b.y) &&
      Math.max(w.a.y, w.b.y) + r >= Math.min(a.y, b.y)
    )
  })
}

export type StueckLage = 'wand' | 'raum' | 'durchgang'

interface Lauf {
  von: number
  bis: number
  lage: StueckLage
}

export function teileNachRaumquerung(
  punkte: readonly Point[],
  umgebung: { waende: readonly WandAchse[]; durchgaenge: readonly WandAchse[] },
): { von: Point; bis: Point; lage: StueckLage }[] {
  const stuecke: { von: Point; bis: Point; start: number; laenge: number }[] = []
  let gesamt = 0
  for (let i = 1; i < punkte.length; i++) {
    const laenge = Math.hypot(punkte[i].x - punkte[i - 1].x, punkte[i].y - punkte[i - 1].y)
    if (laenge < TOLERANZ_METER) continue
    stuecke.push({ von: punkte[i - 1], bis: punkte[i], start: gesamt, laenge })
    gesamt += laenge
  }

  let laeufe: Lauf[] = []
  for (const s of stuecke) {
    const waende = waendeNahe(s.von, s.bis, umgebung.waende)
    const durchgaenge = waendeNahe(s.von, s.bis, umgebung.durchgaenge)
    const anzahl = Math.max(1, Math.ceil(s.laenge / PROBE_METER))
    const schritt = s.laenge / anzahl
    for (let k = 0; k < anzahl; k++) {
      const t = ((k + 0.5) * schritt) / s.laenge
      const p = { x: s.von.x + t * (s.bis.x - s.von.x), y: s.von.y + t * (s.bis.y - s.von.y) }
      const lage: StueckLage = nahe(p, durchgaenge)
        ? 'durchgang'
        : nahe(p, waende)
          ? 'wand'
          : 'raum'
      const von = s.start + k * schritt
      const letzter = laeufe[laeufe.length - 1]
      if (letzter && letzter.lage === lage) letzter.bis = von + schritt
      else laeufe.push({ von, bis: von + schritt, lage })
    }
  }
  laeufe = laeufe
    .map((l) =>
      l.lage === 'raum' && l.bis - l.von < MINDEST_RAUMQUERUNG_METER
        ? { ...l, lage: 'wand' as const }
        : l,
    )
    .reduce<Lauf[]>((alle, l) => {
      const letzter = alle[alle.length - 1]
      if (letzter && letzter.lage === l.lage) letzter.bis = l.bis
      else alle.push({ ...l })
      return alle
    }, [])

  const ergebnis: { von: Point; bis: Point; lage: StueckLage }[] = []
  for (const s of stuecke) {
    const ende = s.start + s.laenge
    const punktBei = (bogen: number): Point => {
      const t = (bogen - s.start) / s.laenge
      if (t <= 0) return s.von
      if (t >= 1) return s.bis
      return { x: s.von.x + t * (s.bis.x - s.von.x), y: s.von.y + t * (s.bis.y - s.von.y) }
    }
    for (const l of laeufe) {
      const von = Math.max(l.von, s.start)
      const bis = Math.min(l.bis, ende)
      if (bis - von < TOLERANZ_METER) continue
      ergebnis.push({ von: punktBei(von), bis: punktBei(bis), lage: l.lage })
    }
  }
  return ergebnis
}
