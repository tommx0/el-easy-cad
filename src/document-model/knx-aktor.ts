import { t } from '../sprache'
import type { Schluessel, Uebersetzer } from '../sprache'
import type {
  CatalogComponent,
  DockpunkteKonfiguration,
  Fangpunkt,
  FreierDockpunkt,
} from './catalog'
import type { Point } from './geometry'
import type {
  KomponentenObjekt,
  Objekt,
  SchaltverbindungAnschluss,
  SchaltverbindungObjekt,
} from './objekte'
import { formatiereBlattverweis } from './blattverweis'
import { getDockpoints } from './dockpoints'
import { BASIS_SYMBOL_GROESSE_METER } from './symbol'
import type { Zeichnung } from './zeichnung'

export type KnxAktorArt = 'schalt-jalousie' | 'dimm'

export type KnxKanalFunktion =
  | 'schalten'
  | 'treppenlicht'
  | 'zeitschalten'
  | 'heizen'
  | 'jalousie'
  | 'rollladen'
  | 'dimmen'
  | 'frei'

export interface KnxKanal {
  funktion: KnxKanalFunktion
  beschriftung?: string
}

export interface KnxAktorDaten {
  art: KnxAktorArt
  baugroesse: number
  kanaele: KnxKanal[]
  versorgungSichtbar?: boolean
}

export const KNX_BAUGROESSEN: Record<KnxAktorArt, readonly number[]> = {
  'schalt-jalousie': [4, 8, 16, 24],
  dimm: [1, 2, 4],
}

export const KNX_KANAL_FUNKTIONEN: Record<KnxAktorArt, readonly KnxKanalFunktion[]> = {
  'schalt-jalousie': [
    'schalten',
    'treppenlicht',
    'zeitschalten',
    'heizen',
    'jalousie',
    'rollladen',
    'frei',
  ],
  dimm: ['dimmen', 'frei'],
}

const KNX_FUNKTION_SCHLUESSEL: Record<KnxKanalFunktion, Schluessel> = {
  schalten: 'generatoren.knxAktor.funktion.schalten',
  treppenlicht: 'generatoren.knxAktor.funktion.treppenlicht',
  zeitschalten: 'generatoren.knxAktor.funktion.zeitschalten',
  heizen: 'generatoren.knxAktor.funktion.heizen',
  jalousie: 'generatoren.knxAktor.funktion.jalousie',
  rollladen: 'generatoren.knxAktor.funktion.rollladen',
  dimmen: 'generatoren.knxAktor.funktion.dimmen',
  frei: 'generatoren.knxAktor.funktion.frei',
}

export function knxFunktionText(funktion: KnxKanalFunktion, uebersetze: Uebersetzer = t): string {
  return uebersetze(KNX_FUNKTION_SCHLUESSEL[funktion])
}

export const KNX_FUNKTION_TEXT = Object.defineProperties(
  {} as Record<KnxKanalFunktion, string>,
  Object.fromEntries(
    (Object.keys(KNX_FUNKTION_SCHLUESSEL) as KnxKanalFunktion[]).map((f) => [
      f,
      { get: () => knxFunktionText(f), enumerable: true },
    ]),
  ),
)

export function istPaarFunktion(funktion: KnxKanalFunktion): boolean {
  return funktion === 'jalousie' || funktion === 'rollladen'
}

export function standardKanalFunktion(art: KnxAktorArt): KnxKanalFunktion {
  return art === 'dimm' ? 'dimmen' : 'schalten'
}

export function neueKnxAktorDaten(art: KnxAktorArt, baugroesse?: number): KnxAktorDaten {
  const groessen = KNX_BAUGROESSEN[art]
  const groesse =
    baugroesse !== undefined && groessen.includes(baugroesse) ? baugroesse : groessen[1]
  return {
    art,
    baugroesse: groesse,
    kanaele: Array.from({ length: groesse }, () => ({ funktion: standardKanalFunktion(art) })),
  }
}

export function knxKanalName(index: number): string {
  return `A${index + 1}`
}

export function knxEingangName(index: number): string {
  return `${knxKanalName(index)} E`
}

export function knxKanalIndexAusName(name: string): number | null {
  const treffer = /^A(\d+)( E)?$/.exec(name.trim())
  if (!treffer) return null
  const nummer = Number(treffer[1])
  return nummer >= 1 ? nummer - 1 : null
}

export function knxPaarBeginn(daten: KnxAktorDaten, index: number): number | null {
  const beginn = index % 2 === 0 ? index : index - 1
  const kanal = daten.kanaele[beginn]
  if (!kanal || !istPaarFunktion(kanal.funktion) || beginn + 1 >= daten.kanaele.length) return null
  return beginn
}

export function knxKanalPaare(
  daten: KnxAktorDaten,
): { beginn: number; funktion: KnxKanalFunktion }[] {
  const paare: { beginn: number; funktion: KnxKanalFunktion }[] = []
  for (let i = 0; i + 1 < daten.kanaele.length; i += 2) {
    if (istPaarFunktion(daten.kanaele[i].funktion))
      paare.push({ beginn: i, funktion: daten.kanaele[i].funktion })
  }
  return paare
}

export function normalisiereKnxAktor(daten: KnxAktorDaten): KnxAktorDaten {
  const art: KnxAktorArt = daten.art === 'dimm' ? 'dimm' : 'schalt-jalousie'
  const groessen = KNX_BAUGROESSEN[art]
  const baugroesse = groessen.includes(daten.baugroesse)
    ? daten.baugroesse
    : (groessen.find((g) => g >= daten.kanaele.length) ?? groessen[groessen.length - 1])
  const erlaubt = KNX_KANAL_FUNKTIONEN[art]
  const roh = Array.from({ length: baugroesse }, (_, i) => {
    const k = daten.kanaele[i]
    const funktion = k && erlaubt.includes(k.funktion) ? k.funktion : standardKanalFunktion(art)
    const beschriftung = k?.beschriftung?.trim()
    return { funktion, ...(beschriftung ? { beschriftung } : {}) }
  })
  const kanaele: KnxKanal[] = []
  for (let i = 0; i < roh.length; i++) {
    const k = roh[i]
    if (!istPaarFunktion(k.funktion)) {
      kanaele.push(k)
      continue
    }
    if (i % 2 === 0 && i + 1 < roh.length) {
      kanaele.push(k, { funktion: k.funktion })
      i++
      continue
    }
    kanaele.push({ ...k, funktion: standardKanalFunktion(art) })
  }
  return {
    art,
    baugroesse,
    kanaele,
    ...(daten.versorgungSichtbar === false ? { versorgungSichtbar: false } : {}),
  }
}

export function setzeKnxKanalFunktion(
  daten: KnxAktorDaten,
  index: number,
  funktion: KnxKanalFunktion,
): KnxAktorDaten {
  if (index < 0 || index >= daten.kanaele.length) return daten
  if (istPaarFunktion(funktion) && (index % 2 !== 0 || index + 1 >= daten.kanaele.length))
    return daten
  const standard = standardKanalFunktion(daten.art)
  const kanaele = daten.kanaele.map((k) => ({ ...k }))
  const paar = knxPaarBeginn(daten, index)
  if (paar !== null) {
    kanaele[paar] = { ...kanaele[paar], funktion: standard }
    kanaele[paar + 1] = { funktion: standard }
  }
  kanaele[index] = { ...kanaele[index], funktion }
  if (istPaarFunktion(funktion)) kanaele[index + 1] = { funktion }
  return normalisiereKnxAktor({ ...daten, kanaele })
}

export function setzeKnxKanalBeschriftung(
  daten: KnxAktorDaten,
  index: number,
  beschriftung: string,
): KnxAktorDaten {
  const beginn = knxPaarBeginn(daten, index) ?? index
  const text = beschriftung.trim() ? beschriftung : ''
  return {
    ...daten,
    kanaele: daten.kanaele.map((k, i) => {
      if (i !== beginn) return k
      const { beschriftung: _alt, ...ohne } = k
      void _alt
      return text ? { ...ohne, beschriftung: text } : ohne
    }),
  }
}

export function aendereKnxBaugroesse(daten: KnxAktorDaten, baugroesse: number): KnxAktorDaten {
  if (!KNX_BAUGROESSEN[daten.art].includes(baugroesse)) return daten
  const kanaele = Array.from(
    { length: baugroesse },
    (_, i) => daten.kanaele[i] ?? { funktion: standardKanalFunktion(daten.art) },
  )
  return normalisiereKnxAktor({ ...daten, baugroesse, kanaele })
}

export function wechsleKnxArt(daten: KnxAktorDaten, art: KnxAktorArt): KnxAktorDaten {
  if (art === daten.art) return daten
  const groessen = KNX_BAUGROESSEN[art]
  const baugroesse = groessen.find((g) => g >= daten.baugroesse) ?? groessen[groessen.length - 1]
  return normalisiereKnxAktor({
    ...daten,
    art,
    baugroesse,
    kanaele: Array.from({ length: baugroesse }, (_, i) => ({
      funktion: standardKanalFunktion(art),
      ...(daten.kanaele[i]?.beschriftung ? { beschriftung: daten.kanaele[i].beschriftung } : {}),
    })),
  })
}

export function knxAktorTitel(daten: KnxAktorDaten, uebersetze: Uebersetzer = t): string {
  const n = String(daten.baugroesse)
  if (daten.art === 'dimm') return uebersetze('generatoren.knxAktor.titelDimm', { n })
  return knxKanalPaare(daten).length > 0
    ? uebersetze('generatoren.knxAktor.titelSchaltJalousie', { n })
    : uebersetze('generatoren.knxAktor.titelSchalt', { n })
}

export function knxAktorStuecklistenName(
  daten: KnxAktorDaten,
  uebersetze: Uebersetzer = t,
): string {
  return uebersetze('generatoren.knxAktor.stueckliste', { titel: knxAktorTitel(daten, uebersetze) })
}

export function knxKanalFunktionsText(
  daten: KnxAktorDaten,
  index: number,
  uebersetze: Uebersetzer = t,
): { funktion: string; teil?: string } {
  const kanal = daten.kanaele[index]
  if (!kanal) return { funktion: '' }
  const paar = knxPaarBeginn(daten, index)
  const funktion = knxFunktionText(kanal.funktion, uebersetze)
  if (paar === null) return { funktion }
  return {
    funktion,
    teil: uebersetze(paar === index ? 'generatoren.knxAktor.auf' : 'generatoren.knxAktor.ab'),
  }
}

export const KNX_RASTER = 0.24
export const KNX_STRICH = 0.12
export const KNX_REIHEN_HOEHE = 1.44
export const KNX_MINDEST_BREITE = 1.44
export const KNX_REIHEN_ABSTAND = 2.04
export const KNX_MAX_REIHENBREITE = 10.36

export type KnxAnschlussArt = 'bus' | 'versorgung' | 'eingang' | 'ausgang'

export interface KnxAnschluss {
  name: string
  art: KnxAnschlussArt
  x: number
  y: number
  kanal?: number
}

export interface KnxAktorReihe {
  kanaele: number[]
  unten: number
  oben: number
  anschluss: number
}

export interface KnxAktorGeometrie {
  breite: number
  hoehe: number
  reihen: KnxAktorReihe[]
  anschluesse: KnxAnschluss[]
}

function reihenBreite(kanaele: number): number {
  return Math.max((2 * kanaele + 1) * KNX_RASTER, KNX_MINDEST_BREITE)
}

export function knxAktorZweireihig(daten: KnxAktorDaten): boolean {
  return reihenBreite(daten.kanaele.length) > KNX_MAX_REIHENBREITE + 1e-9
}

export function knxAktorGeometrie(daten: KnxAktorDaten): KnxAktorGeometrie {
  const n = daten.kanaele.length
  const zweireihig = knxAktorZweireihig(daten)
  const oben = zweireihig ? Math.ceil(n / 2) : n
  const alle = Array.from({ length: n }, (_, i) => i)
  const reihenKanaele = zweireihig ? [alle.slice(0, oben), alle.slice(oben)] : [alle]
  const breite = reihenBreite(oben)
  const anzahl = reihenKanaele.length
  const reihen: KnxAktorReihe[] = reihenKanaele.map((kanaele, i) => {
    const vonUnten = anzahl - 1 - i
    const anschluss = vonUnten * (KNX_STRICH + KNX_REIHEN_HOEHE + KNX_REIHEN_ABSTAND)
    return {
      kanaele,
      anschluss,
      unten: anschluss + KNX_STRICH,
      oben: anschluss + KNX_STRICH + KNX_REIHEN_HOEHE,
    }
  })
  const hoehe = reihen[0].oben + KNX_STRICH
  const anschluesse: KnxAnschluss[] = [
    { name: 'KNX+', art: 'bus', x: KNX_RASTER, y: hoehe },
    { name: 'KNX-', art: 'bus', x: 2 * KNX_RASTER, y: hoehe },
  ]
  if (daten.versorgungSichtbar !== false) {
    anschluesse.push(
      { name: 'L', art: 'versorgung', x: 4 * KNX_RASTER, y: hoehe },
      { name: 'N', art: 'versorgung', x: 5 * KNX_RASTER, y: hoehe },
    )
  }
  for (const reihe of reihen) {
    reihe.kanaele.forEach((kanal, p) => {
      anschluesse.push(
        {
          name: knxEingangName(kanal),
          art: 'eingang',
          x: (2 * p + 1) * KNX_RASTER,
          y: reihe.anschluss,
          kanal,
        },
        {
          name: knxKanalName(kanal),
          art: 'ausgang',
          x: (2 * p + 2) * KNX_RASTER,
          y: reihe.anschluss,
          kanal,
        },
      )
    })
  }
  return { breite, hoehe, reihen, anschluesse }
}

export function knxAktorDockpunkte(geometrie: KnxAktorGeometrie): DockpunkteKonfiguration {
  const punkte: FreierDockpunkt[] = geometrie.anschluesse.map((a) => ({
    xAnteil: a.x / geometrie.breite,
    yAnteil: a.y / geometrie.hoehe,
    bezeichnung: a.name,
    beschriftung: {
      groesseAnteil: 0.07,
      ausrichtungHorizontal: 'links',
      ausrichtungVertikal: 'unten',
      ausblenden: true,
    },
  }))
  return { modus: 'frei', punkte }
}

export function knxAktorFangpunkt(geometrie: KnxAktorGeometrie): Fangpunkt {
  const a1 = geometrie.anschluesse.find((a) => a.art === 'eingang' && a.kanal === 0)!
  return { xAnteil: a1.x / geometrie.breite, yAnteil: a1.y / geometrie.hoehe }
}

export function knxAktorInstanzFelder(
  daten: KnxAktorDaten,
): Pick<
  KomponentenObjekt,
  'knxAktor' | 'breiteWelt' | 'groesseWelt' | 'hoehenFaktor' | 'dockpunkte' | 'fangpunkt'
> {
  const normal = normalisiereKnxAktor(daten)
  const geometrie = knxAktorGeometrie(normal)
  return {
    knxAktor: normal,
    breiteWelt: geometrie.breite,
    groesseWelt: geometrie.hoehe,
    hoehenFaktor: geometrie.hoehe / BASIS_SYMBOL_GROESSE_METER,
    dockpunkte: knxAktorDockpunkte(geometrie),
    fangpunkt: knxAktorFangpunkt(geometrie),
  }
}

function weltpunkt(
  instanz: Pick<KomponentenObjekt, 'position' | 'drehung'>,
  breite: number,
  hoehe: number,
  lokal: Point,
): Point {
  const dx = lokal.x - breite / 2
  const dy = lokal.y - hoehe / 2
  const cos = Math.cos(instanz.drehung)
  const sin = Math.sin(instanz.drehung)
  return {
    x: instanz.position.x + dx * cos - dy * sin,
    y: instanz.position.y + dx * sin + dy * cos,
  }
}

export function mitKnxAktor(instanz: KomponentenObjekt, daten: KnxAktorDaten): KomponentenObjekt {
  const felder = knxAktorInstanzFelder(daten)
  const neu = { ...instanz, ...felder }
  if (!instanz.knxAktor) return neu
  const alt = knxAktorGeometrie(instanz.knxAktor)
  const neuGeo = knxAktorGeometrie(felder.knxAktor!)
  const a1 = (g: KnxAktorGeometrie) =>
    g.anschluesse.find((a) => a.art === 'eingang' && a.kanal === 0)!
  const vorher = weltpunkt(instanz, alt.breite, alt.hoehe, a1(alt))
  const nachher = weltpunkt(neu, neuGeo.breite, neuGeo.hoehe, a1(neuGeo))
  return {
    ...neu,
    position: {
      x: neu.position.x + vorher.x - nachher.x,
      y: neu.position.y + vorher.y - nachher.y,
    },
  }
}

export function wendeKnxAktorAn(
  objekte: readonly Objekt[],
  objektId: string,
  daten: KnxAktorDaten,
): Objekt[] {
  const instanz = objekte.find(
    (o): o is KomponentenObjekt => o.id === objektId && o.type === 'komponente',
  )
  if (!instanz) return [...objekte]
  const neu = mitKnxAktor(instanz, daten)
  const alteNamen = instanz.knxAktor
    ? knxAktorGeometrie(instanz.knxAktor).anschluesse.map((a) => a.name)
    : instanz.dockpunkte?.modus === 'frei'
      ? instanz.dockpunkte.punkte.map((p) => p.bezeichnung ?? '')
      : []
  const neueIndizes = new Map(
    knxAktorGeometrie(neu.knxAktor!).anschluesse.map((a, i) => [a.name, i] as const),
  )
  const umnummern = (index: number): number | null => {
    const name = alteNamen[index]
    return name ? (neueIndizes.get(name) ?? null) : null
  }
  const ende = (a: SchaltverbindungAnschluss): SchaltverbindungAnschluss => {
    if (a.art !== 'dock' || a.objektId !== objektId) return a
    const indizes = a.dockpunktIndizes.map(umnummern)
    if (indizes.some((i) => i === null)) return { art: 'frei' }
    return { ...a, dockpunktIndizes: indizes as number[] }
  }
  return objekte.map((o) => {
    if (o.id === objektId) return neu
    if (o.type !== 'schaltverbindung') return o
    const start = ende(o.start)
    const ziel = ende(o.ziel)
    if (start === o.start && ziel === o.ziel) return o
    return { ...o, start, ziel } satisfies SchaltverbindungObjekt
  })
}

export function knxAktorVerloreneAnschluesse(
  objekte: readonly Objekt[],
  instanz: KomponentenObjekt,
  daten: KnxAktorDaten,
): string[] {
  if (!instanz.knxAktor) return []
  const alt = knxAktorGeometrie(instanz.knxAktor).anschluesse
  const neu = new Set(knxAktorGeometrie(normalisiereKnxAktor(daten)).anschluesse.map((a) => a.name))
  const verloren = new Set<string>()
  for (const o of objekte) {
    if (o.type !== 'schaltverbindung') continue
    for (const a of [o.start, o.ziel]) {
      if (a.art !== 'dock' || a.objektId !== instanz.id) continue
      for (const i of a.dockpunktIndizes) {
        const name = alt[i]?.name
        if (name && !neu.has(name)) verloren.add(name)
      }
    }
  }
  return [...verloren]
}

export function knxAnschlussPosition(instanz: KomponentenObjekt, name: string): Point | null {
  if (!instanz.knxAktor) return null
  const geometrie = knxAktorGeometrie(instanz.knxAktor)
  const a = geometrie.anschluesse.find((x) => x.name === name)
  return a ? weltpunkt(instanz, geometrie.breite, geometrie.hoehe, a) : null
}

export const KNX_SCHALTAKTOR_KATALOG_ID = 'knx-schalt-jalousieaktor'
export const KNX_DIMMAKTOR_KATALOG_ID = 'knx-dimmaktor'
export const KNX_AKTOR_KATALOG_KATALOG_ID = 'stromlaufplan-symbole'

export const KNX_AKTOR_KOMPONENTEN: readonly CatalogComponent[] = [
  {
    id: KNX_SCHALTAKTOR_KATALOG_ID,
    katalogId: KNX_AKTOR_KATALOG_KATALOG_ID,
    name: 'KNX Schalt-/Jalousieaktor',
    hersteller: 'generisch',
    kategorie: 'Relais & Schütze',
    hauptgruppe: 'KNX',
    untergruppe: 'Aktoren',
    kennzeichenBuchstabe: 'K',
    knxAktor: 'schalt-jalousie',
    kombinierbar: false,
    technischeDaten: {},
    herkunft: 'standard',
    varianten: [],
  },
  {
    id: KNX_DIMMAKTOR_KATALOG_ID,
    katalogId: KNX_AKTOR_KATALOG_KATALOG_ID,
    name: 'KNX Dimmaktor',
    hersteller: 'generisch',
    kategorie: 'Relais & Schütze',
    hauptgruppe: 'KNX',
    untergruppe: 'Aktoren',
    kennzeichenBuchstabe: 'K',
    knxAktor: 'dimm',
    kombinierbar: false,
    technischeDaten: {},
    herkunft: 'standard',
    varianten: [],
  },
]

export function knxAktorArtVonKatalogId(id: string): KnxAktorArt | null {
  if (id === KNX_SCHALTAKTOR_KATALOG_ID) return 'schalt-jalousie'
  if (id === KNX_DIMMAKTOR_KATALOG_ID) return 'dimm'
  return null
}

export function knxAktorKatalogId(art: KnxAktorArt): string {
  return art === 'dimm' ? KNX_DIMMAKTOR_KATALOG_ID : KNX_SCHALTAKTOR_KATALOG_ID
}

export function mitEingebautenKomponenten(
  komponenten: readonly CatalogComponent[],
): CatalogComponent[] {
  const ohne = komponenten.filter((k) => knxAktorArtVonKatalogId(k.id) === null)
  return [...ohne, ...KNX_AKTOR_KOMPONENTEN]
}

export function istKnxAktor(o: Objekt): o is KomponentenObjekt & { knxAktor: KnxAktorDaten } {
  return o.type === 'komponente' && o.knxAktor !== undefined
}

export function ermittleKnxKanalVerweise(
  zeichnung: Zeichnung,
): Map<string, (string | undefined)[]> {
  const kontakte = new Map<string, Map<string, string[]>>()
  zeichnung.blaetter.forEach((blatt, i) => {
    for (const o of blatt.objekte) {
      const kennzeichen = o.type === 'komponente' ? o.geraeteKennzeichen?.trim() : undefined
      if (
        o.type !== 'komponente' ||
        !kennzeichen ||
        o.betriebsmittelRolle !== 'kontaktblock' ||
        o.dockpunkte?.modus !== 'frei'
      )
        continue
      const punkte = getDockpoints(o)
      const jeName = kontakte.get(kennzeichen) ?? new Map<string, string[]>()
      o.dockpunkte.punkte.forEach((p, j) => {
        const name = p.bezeichnung?.trim()
        if (!name || !punkte[j]) return
        const text = formatiereBlattverweis(i + 1, blatt, punkte[j])
        const liste = jeName.get(name) ?? []
        if (!liste.includes(text)) liste.push(text)
        jeName.set(name, liste)
      })
      kontakte.set(kennzeichen, jeName)
    }
  })
  const ergebnis = new Map<string, (string | undefined)[]>()
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (!istKnxAktor(o) || !o.geraeteKennzeichen?.trim()) continue
      const jeName = kontakte.get(o.geraeteKennzeichen.trim())
      if (!jeName) continue
      const verweise = o.knxAktor.kanaele.map((_, k) => jeName.get(knxKanalName(k))?.join(', '))
      if (verweise.some(Boolean)) ergebnis.set(o.id, verweise)
    }
  }
  return ergebnis
}
