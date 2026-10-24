import type { Installationszone, Raumquerung } from './blatt'
import type { LeitungsObjekt, Objekt } from './objekte'
import type { Point } from './geometry'
import {
  nurInBauteilenQuelle,
  teileNachRaumquerung,
  type RaumquerungsUmgebung,
  type WandAchse,
} from './raumquerung'
import { abgeleitetePfadSegmente } from './trunk-kette'
import { durchgangsZone, zonenDefinition, type ZonenDefinition } from './installationszonen'

export interface TeilstueckZone {
  von: Point
  bis: Point
  zone: Installationszone
}

export interface Teilstueck {
  leitungId: string
  von: Point
  bis: Point
}

export function zonenKuerzel(
  zone: Installationszone,
  eigene: readonly ZonenDefinition[] = [],
): string {
  return zonenDefinition(zone, eigene)?.kuerzel ?? '?'
}

const TOLERANZ_METER = 0.001

function abstandZurStrecke(p: Point, a: Point, b: Point): { abstand: number; t: number } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const laenge2 = dx * dx + dy * dy
  if (laenge2 === 0) return { abstand: Math.hypot(p.x - a.x, p.y - a.y), t: 0 }
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / laenge2
  const tb = Math.max(0, Math.min(1, t))
  return { abstand: Math.hypot(p.x - (a.x + tb * dx), p.y - (a.y + tb * dy)), t }
}

export function liegtAufStrecke(a: Point, b: Point, von: Point, bis: Point): boolean {
  const laenge = Math.hypot(bis.x - von.x, bis.y - von.y)
  if (laenge === 0 || Math.hypot(b.x - a.x, b.y - a.y) < TOLERANZ_METER) return false
  const toleranzT = TOLERANZ_METER / laenge
  return [a, b].every((p) => {
    const { abstand, t } = abstandZurStrecke(p, von, bis)
    return abstand <= TOLERANZ_METER && t >= -toleranzT && t <= 1 + toleranzT
  })
}

export function teilstueckZone(
  leitung: Pick<LeitungsObjekt, 'teilstueckZonen'>,
  a: Point,
  b: Point,
): Installationszone | undefined {
  return leitung.teilstueckZonen?.find((e) => liegtAufStrecke(a, b, e.von, e.bis))?.zone
}

export function stueckeMitZone(
  segment: readonly Point[],
  leitung: Pick<LeitungsObjekt, 'teilstueckZonen'>,
  raumquerung: RaumquerungsAngaben | null = null,
): { von: Point; bis: Point; zone: Installationszone | undefined }[] {
  if (raumquerung)
    return teileNachRaumquerung(segment, raumquerung).map((s) => ({
      von: s.von,
      bis: s.bis,
      zone:
        teilstueckZone(leitung, s.von, s.bis) ??
        (s.lage === 'raum'
          ? raumquerung.zone
          : s.lage === 'durchgang'
            ? raumquerung.durchgangZone
            : undefined),
    }))
  const stuecke: { von: Point; bis: Point; zone: Installationszone | undefined }[] = []
  for (let i = 1; i < segment.length; i++) {
    const von = segment[i - 1]
    const bis = segment[i]
    if (Math.hypot(bis.x - von.x, bis.y - von.y) < TOLERANZ_METER) continue
    stuecke.push({ von, bis, zone: teilstueckZone(leitung, von, bis) })
  }
  return stuecke
}

export function freieStuecke(
  leitung: LeitungsObjekt,
  objekteAufBlatt: readonly Objekt[],
  umgebung: RaumquerungsUmgebung | null = null,
): { segmentIndex: number; von: Point; bis: Point; zone: Installationszone | undefined }[] {
  const raumquerung = raumquerungFuer(leitung, umgebung)
  return abgeleitetePfadSegmente(leitung, objekteAufBlatt).flatMap((segment, segmentIndex) =>
    stueckeMitZone(segment, leitung, raumquerung).map((s) => ({ segmentIndex, ...s })),
  )
}

export interface RaumquerungsAngaben {
  waende: readonly WandAchse[]
  durchgaenge: readonly WandAchse[]
  zone: Raumquerung
  durchgangZone: Installationszone | undefined
}

export function raumquerungFuer(
  leitung: Pick<LeitungsObjekt, 'nurInBauteilen' | 'installationszone'>,
  umgebung: RaumquerungsUmgebung | null,
): RaumquerungsAngaben | null {
  if (!umgebung) return null
  const geschoss = { nurInBauteilen: umgebung.standardAn, installationszone: umgebung.blattZone }
  const quelle = nurInBauteilenQuelle(leitung, geschoss, umgebung.zonen)
  if (quelle === null || (quelle === 'wandzone' && umgebung.waende.length === 0)) return null
  const eigene = leitung.installationszone ?? umgebung.blattZone
  return {
    ...umgebung,
    durchgangZone: durchgangsZone(zonenDefinition(eigene, umgebung.zonen), umgebung.zonen),
  }
}

function ohneStueck(eintrag: TeilstueckZone, a: Point, b: Point): TeilstueckZone[] {
  const dx = eintrag.bis.x - eintrag.von.x
  const dy = eintrag.bis.y - eintrag.von.y
  const laenge = Math.hypot(dx, dy)
  if (laenge === 0) return []
  const abstandZurGeraden = (p: Point) =>
    Math.abs((p.x - eintrag.von.x) * dy - (p.y - eintrag.von.y) * dx) / laenge
  if (abstandZurGeraden(a) > TOLERANZ_METER || abstandZurGeraden(b) > TOLERANZ_METER)
    return [eintrag]
  const t = (p: Point) => abstandZurStrecke(p, eintrag.von, eintrag.bis).t
  const [ta, tb] = [t(a), t(b)].sort((x, y) => x - y)
  if (tb * laenge <= TOLERANZ_METER || (1 - ta) * laenge <= TOLERANZ_METER) return [eintrag]
  const punkt = (s: number): Point => ({
    x: eintrag.von.x + s * (eintrag.bis.x - eintrag.von.x),
    y: eintrag.von.y + s * (eintrag.bis.y - eintrag.von.y),
  })
  const reste: TeilstueckZone[] = []
  if (ta * laenge > TOLERANZ_METER)
    reste.push({ von: eintrag.von, bis: punkt(Math.max(0, ta)), zone: eintrag.zone })
  if ((1 - tb) * laenge > TOLERANZ_METER)
    reste.push({ von: punkt(Math.min(1, tb)), bis: eintrag.bis, zone: eintrag.zone })
  return reste
}

export function mitTeilstueckZonen(
  leitung: LeitungsObjekt,
  stuecke: readonly { von: Point; bis: Point }[],
  zone: Installationszone | undefined,
): LeitungsObjekt {
  let eintraege = [...(leitung.teilstueckZonen ?? [])]
  for (const { von, bis } of stuecke) {
    eintraege = eintraege.flatMap((e) => ohneStueck(e, von, bis))
    if (zone) eintraege.push({ von, bis, zone })
  }
  const { teilstueckZonen: _alt, ...rest } = leitung
  return eintraege.length > 0 ? { ...rest, teilstueckZonen: eintraege } : rest
}

export function verwaisteTeilstueckZonen(
  leitung: LeitungsObjekt,
  objekteAufBlatt: readonly Objekt[],
): TeilstueckZone[] {
  if (!leitung.teilstueckZonen?.length) return []
  const stuecke = freieStuecke(leitung, objekteAufBlatt)
  return leitung.teilstueckZonen.filter(
    (e) => !stuecke.some((s) => liegtAufStrecke(s.von, s.bis, e.von, e.bis)),
  )
}

export function zaehleVerwaisteTeilstueckZonen(zeichnung: {
  blaetter: readonly { objekte: readonly Objekt[] }[]
}): number {
  let anzahl = 0
  for (const blatt of zeichnung.blaetter)
    for (const o of blatt.objekte)
      if (o.type === 'leitung' && o.teilstueckZonen?.length)
        anzahl += verwaisteTeilstueckZonen(o, blatt.objekte).length
  return anzahl
}

export function ohneVerwaisteTeilstueckZonen(
  leitung: LeitungsObjekt,
  objekteAufBlatt: readonly Objekt[],
): LeitungsObjekt {
  const verwaist = verwaisteTeilstueckZonen(leitung, objekteAufBlatt)
  if (verwaist.length === 0) return leitung
  const bleiben = leitung.teilstueckZonen!.filter((e) => !verwaist.includes(e))
  const { teilstueckZonen: _alt, ...rest } = leitung
  return bleiben.length > 0 ? { ...rest, teilstueckZonen: bleiben } : rest
}

export function zonenNachSegmentZug(
  leitung: LeitungsObjekt,
  alterWeg: readonly Point[],
  lokalerIndex: number,
  neuerWeg: readonly Point[],
  zielPunkt: Point,
): LeitungsObjekt['teilstueckZonen'] {
  const a = alterWeg[lokalerIndex]
  const b = alterWeg[lokalerIndex + 1]
  const zone = a && b ? teilstueckZone(leitung, a, b) : undefined
  if (!zone) return leitung.teilstueckZonen
  let naechstes: { von: Point; bis: Point; abstand: number } | null = null
  for (let i = 1; i < neuerWeg.length; i++) {
    const { abstand } = abstandZurStrecke(zielPunkt, neuerWeg[i - 1], neuerWeg[i])
    if (!naechstes || abstand < naechstes.abstand)
      naechstes = { von: neuerWeg[i - 1], bis: neuerWeg[i], abstand }
  }
  if (!naechstes) return leitung.teilstueckZonen
  const ohneAlten = mitTeilstueckZonen(leitung, [{ von: a, bis: b }], undefined)
  return mitTeilstueckZonen(ohneAlten, [naechstes], zone).teilstueckZonen
}
