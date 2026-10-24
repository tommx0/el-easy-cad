import { erzeugeUebersetzer, QUELLSPRACHE } from '../sprache'
import type { Uebersetzer } from '../sprache'
import type { Blatt, BlattGeschoss } from './blatt'
import { aendereGeschoss, erzeugeBlatt } from './blatt'
import { dupliziereObjekte } from './duplizieren'
import { deckenstaerkeMeter } from './hoehenfuehrung'
import type { ObjektTyp } from './objekte'
import { planUebersetzer } from './plansprache'
import { aktualisiereRaeume } from './raum'
import type { Zeichnung } from './zeichnung'

export type EtagenRichtung = 'darueber' | 'darunter'

export const ETAGE_RAUMHOEHE_VORSCHLAG = 2.5

export const ETAGE_KOPIERTE_TYPEN: readonly ObjektTyp[] = [
  'wand',
  'tuer',
  'fenster',
  'wanddurchbruch',
  'raum',
  'treppe',
  'bodenplatte',
]

export function etagenKopierteTypen(richtung: EtagenRichtung): readonly ObjektTyp[] {
  return richtung === 'darueber'
    ? ETAGE_KOPIERTE_TYPEN.filter((t) => t !== 'treppe')
    : ETAGE_KOPIERTE_TYPEN
}

export interface EtagenAngaben {
  name: string
  kote: number
  raumhoehe: number
  deckenstaerke: number
}

function etagenStufe(name: string): number | null {
  if (/^(EG|GF)$/i.test(name)) return 0
  const og = /^(\d+)\.?\s*(OG|F)$/i.exec(name)
  if (og) return Number(og[1])
  if (/^OG$/i.test(name)) return 1
  const ug = /^(\d+)\.?\s*(UG|KG)$/i.exec(name)
  if (ug) return -Number(ug[1])
  if (/^(UG|KG)$/i.test(name)) return -1
  const b = /^B(\d+)$/i.exec(name)
  if (b && Number(b[1]) >= 1) return -Number(b[1])
  return null
}

export function etagenNameVorschlag(
  name: string,
  richtung: EtagenRichtung,
  tp: Uebersetzer = erzeugeUebersetzer(QUELLSPRACHE),
): string {
  const schritt = richtung === 'darueber' ? 1 : -1
  const t = name.trim()
  const stufe = etagenStufe(t)
  if (stufe === null) {
    return tp(
      richtung === 'darueber' ? 'generatoren.etage.darueber' : 'generatoren.etage.darunter',
      {
        name: t,
      },
    )
  }
  const neu = stufe + schritt
  if (neu === 0) return tp('generatoren.etage.eg')
  if (neu > 0) return tp('generatoren.etage.og', { nr: neu })
  return neu === -1 ? tp('generatoren.etage.ug') : tp('generatoren.etage.ugNummer', { nr: -neu })
}

export function freierEtagenName(
  name: string,
  blaetter: readonly Blatt[],
  tp: Uebersetzer = erzeugeUebersetzer(QUELLSPRACHE),
): string {
  const vergeben = new Set(blaetter.map((b) => b.name.trim().toLowerCase()))
  const frei = (n: string) => !vergeben.has(n.toLowerCase())
  if (frei(name)) return name
  for (let i = 1; ; i++) {
    const kandidat =
      i > 1
        ? tp('generatoren.etage.neuNummer', { name, nr: i })
        : tp('generatoren.etage.neu', { name })
    if (frei(kandidat)) return kandidat
  }
}

export function etagenVorschlag(
  zeichnung: Zeichnung,
  vorlage: Blatt,
  richtung: EtagenRichtung,
): EtagenAngaben & { ohneKote: boolean } {
  const g = vorlage.geschoss
  const kote = g?.kote ?? 0
  const raumhoehe = g?.raumhoehe ?? ETAGE_RAUMHOEHE_VORSCHLAG
  const deckenstaerke = deckenstaerkeMeter(zeichnung, vorlage)
  const tp = planUebersetzer(zeichnung)
  return {
    name: freierEtagenName(etagenNameVorschlag(vorlage.name, richtung, tp), zeichnung.blaetter, tp),
    kote: rundeMeter(
      richtung === 'darueber'
        ? koteDarueber(kote, raumhoehe, deckenstaerke)
        : koteDarunter(kote, raumhoehe, deckenstaerke),
    ),
    raumhoehe,
    deckenstaerke,
    ohneKote: g?.kote === undefined,
  }
}

export function koteDarueber(kote: number, raumhoehe: number, deckenstaerke: number): number {
  return kote + raumhoehe + deckenstaerke
}

export function koteDarunter(koteOben: number, raumhoehe: number, deckenstaerke: number): number {
  return koteOben - deckenstaerke - raumhoehe
}

export interface EtagenVerschiebung {
  blattIds: string[]
  delta: number
  nachbar: Blatt
}

export function etagenVerschiebung(
  zeichnung: Zeichnung,
  vorlage: Blatt,
  richtung: EtagenRichtung,
  angaben: Omit<EtagenAngaben, 'name'>,
): EtagenVerschiebung | null {
  const index = zeichnung.blaetter.findIndex((b) => b.id === vorlage.id)
  if (index === -1) return null
  const mitKote = (b: Blatt) => b.geschoss?.kote !== undefined
  const kote = (b: Blatt) => b.geschoss!.kote!
  if (richtung === 'darueber') {
    const darueber = zeichnung.blaetter.slice(index + 1).filter(mitKote)
    if (darueber.length === 0) return null
    const nachbar = darueber.reduce((a, b) => (kote(b) < kote(a) ? b : a))
    const delta = rundeMeter(
      angaben.kote + angaben.raumhoehe + angaben.deckenstaerke - kote(nachbar),
    )
    return delta > 1e-9 ? { blattIds: darueber.map((b) => b.id), delta, nachbar } : null
  }
  const darunter = zeichnung.blaetter.slice(0, index).filter(mitKote)
  if (darunter.length === 0) return null
  const nachbar = darunter.reduce((a, b) => (kote(b) > kote(a) ? b : a))
  const raumhoehe = nachbar.geschoss?.raumhoehe
  const oberkante =
    raumhoehe !== undefined
      ? kote(nachbar) + raumhoehe + deckenstaerkeMeter(zeichnung, nachbar)
      : (vorlage.geschoss?.kote ?? 0)
  const delta = rundeMeter(angaben.kote - oberkante)
  return delta < -1e-9 ? { blattIds: darunter.map((b) => b.id), delta, nachbar } : null
}

export function verschobeneEtagen(
  blaetter: readonly Blatt[],
  verschiebung: EtagenVerschiebung,
): Blatt[] {
  const ids = new Set(verschiebung.blattIds)
  return blaetter
    .filter((b) => ids.has(b.id) && b.geschoss?.kote !== undefined)
    .map((b) => ({
      ...b,
      geschoss: aendereGeschoss(b.geschoss, {
        kote: rundeMeter(b.geschoss!.kote! + verschiebung.delta),
      }),
    }))
}

function rundeMeter(v: number): number {
  return Math.round(v * 1000) / 1000
}

export function erzeugeEtage(
  zeichnung: Zeichnung,
  vorlage: Blatt,
  angaben: EtagenAngaben,
  richtung: EtagenRichtung,
): Blatt {
  const leer = erzeugeBlatt(angaben.name, zeichnung.zeichnungsart, planUebersetzer(zeichnung))
  const typen = etagenKopierteTypen(richtung)
  const vorlagen = vorlage.objekte.filter((o) => typen.includes(o.type))
  const { kopien } = dupliziereObjekte(vorlagen, { x: 0, y: 0 }, zeichnung)
  const geschoss: BlattGeschoss | undefined = aendereGeschoss(undefined, {
    kote: angaben.kote,
    raumhoehe: angaben.raumhoehe,
    deckenstaerke: angaben.deckenstaerke,
    installationszone: vorlage.geschoss?.installationszone,
  })
  return {
    ...leer,
    einheit: vorlage.einheit,
    ursprung: vorlage.ursprung,
    nullpunkt: vorlage.nullpunkt,
    ...(vorlage.nullpunktRichtung !== undefined
      ? { nullpunktRichtung: vorlage.nullpunktRichtung }
      : {}),
    massstab: vorlage.massstab,
    zeichenflaeche: vorlage.zeichenflaeche,
    symbolSkalierung: vorlage.symbolSkalierung,
    objekte: aktualisiereRaeume(kopien),
    ...(geschoss ? { geschoss } : {}),
  }
}

export interface EtagenZeile {
  blattId: string
  kote?: number
  raumhoehe?: number
  deckenstaerke?: number
}

export function fuehreKotenMit(
  zeilen: readonly EtagenZeile[],
  index: number,
  delta: number,
): EtagenZeile[] {
  if (Math.abs(delta) < 1e-9) return [...zeilen]
  const nachUnten = (zeilen[index]?.kote ?? 0) < 0
  return zeilen.map((z, i) => {
    if (z.kote === undefined) return z
    if (nachUnten ? i <= index : i > index)
      return { ...z, kote: rundeMeter(z.kote + (nachUnten ? -delta : delta)) }
    return z
  })
}

export function hoeheUeberDarunter(
  zeilen: readonly EtagenZeile[],
  index: number,
): { unten: number; meter: number } | null {
  const kote = zeilen[index]?.kote
  if (kote === undefined) return null
  for (let j = index - 1; j >= 0; j--) {
    const k = zeilen[j].kote
    if (k !== undefined) return { unten: j, meter: rundeMeter(kote - k) }
  }
  return null
}

export function setzeHoeheUeberDarunter(
  zeilen: readonly EtagenZeile[],
  index: number,
  meter: number,
  mitfuehren: boolean,
): EtagenZeile[] {
  const bisher = hoeheUeberDarunter(zeilen, index)
  if (!bisher) return [...zeilen]
  const delta = meter - bisher.meter
  if (mitfuehren) return fuehreKotenMit(zeilen, bisher.unten, delta)
  return zeilen.map((z, i) =>
    i === index && z.kote !== undefined ? { ...z, kote: rundeMeter(z.kote + delta) } : z,
  )
}
