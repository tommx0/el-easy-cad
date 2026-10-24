import type { Blatt } from './blatt'
import type { CatalogComponent } from './catalog'
import { aufgeloesteVariante } from './catalog'
import type { Zeichnung } from './zeichnung'
import type {
  KabelschachtObjekt,
  KomponentenObjekt,
  LeitungsObjekt,
  Objekt,
  TrunkObjekt,
} from './objekte'
import { rechteckEcken } from './objekte'
import type { Point } from './geometry'
import { distance, naechsterPunktAufSegment } from './geometry'
import { planUebersetzer, spracheDesUebersetzers } from './plansprache'
import { t } from '../sprache'
import type { Uebersetzer } from '../sprache'

export interface SchachtGlied {
  blattId: string
  schacht: KabelschachtObjekt
}

export interface SchachtAnschluss {
  blattId: string
  schachtId: string
  objektId: string
  art: 'leitung' | 'trunk'
  seite: 0 | 1
}

export interface SchachtStrang {
  nummer: number
  art: 'leitung' | 'trunk'
  anschluesse: SchachtAnschluss[]
}

export interface VerbundUebersicht {
  verbundId: string
  name: string
  blattIds: string[]
}

export const MAX_ANSCHLUESSE_LEITUNGSSTRANG = 2

export function istKabelschacht(objekt: Objekt): objekt is KabelschachtObjekt {
  return objekt.type === 'kabelschacht'
}

export function schaechteInZeichnung(zeichnung: Zeichnung): SchachtGlied[] {
  const ergebnis: SchachtGlied[] = []
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (istKabelschacht(objekt)) ergebnis.push({ blattId: blatt.id, schacht: objekt })
    }
  }
  return ergebnis
}

export function schaechteImVerbund(zeichnung: Zeichnung, verbundId: string): SchachtGlied[] {
  return schaechteInZeichnung(zeichnung).filter((g) => g.schacht.verbundId === verbundId)
}

export function findeSchacht(
  zeichnung: Zeichnung,
  blattId: string,
  schachtId: string,
): KabelschachtObjekt | null {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  const objekt = blatt?.objekte.find((o) => o.id === schachtId)
  return objekt && istKabelschacht(objekt) ? objekt : null
}

export function trunksAmSchacht(
  zeichnung: Zeichnung,
  blattId: string,
  schachtId: string,
): TrunkObjekt[] {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  if (!blatt) return []
  return blatt.objekte.filter(
    (o): o is TrunkObjekt =>
      o.type === 'trunk' && o.enden.some((e) => e.schachtRef?.objektId === schachtId),
  )
}

export function schachtVerbundIndex(zeichnung: Zeichnung): Map<string, string> {
  const index = new Map<string, string>()
  for (const { schacht } of schaechteInZeichnung(zeichnung)) {
    index.set(schacht.id, schacht.verbundId)
  }
  return index
}

export function verbundeInZeichnung(zeichnung: Zeichnung): VerbundUebersicht[] {
  const nach = new Map<string, VerbundUebersicht>()
  for (const { blattId, schacht } of schaechteInZeichnung(zeichnung)) {
    const vorhanden = nach.get(schacht.verbundId)
    if (vorhanden) {
      if (!vorhanden.blattIds.includes(blattId)) vorhanden.blattIds.push(blattId)
      continue
    }
    nach.set(schacht.verbundId, {
      verbundId: schacht.verbundId,
      name: schacht.name,
      blattIds: [blattId],
    })
  }
  return [...nach.values()]
}

export function naechsterFreierSchachtName(zeichnung: Zeichnung): string {
  const tp = planUebersetzer(zeichnung)
  const belegt = new Set(verbundeInZeichnung(zeichnung).map((v) => v.name))
  for (let i = 1; ; i++) {
    const name = tp('beschriftung.kabelschacht.vorgabeName', { nr: String(i) })
    if (!belegt.has(name)) return name
  }
}

export function ermittleSchachtStraenge(zeichnung: Zeichnung, verbundId: string): SchachtStrang[] {
  const schachtIds = new Set(schaechteImVerbund(zeichnung, verbundId).map((g) => g.schacht.id))
  if (schachtIds.size === 0) return []

  const nachNummer = new Map<number, SchachtStrang>()
  const ergaenze = (nummer: number, anschluss: SchachtAnschluss) => {
    const vorhanden = nachNummer.get(nummer)
    if (vorhanden) vorhanden.anschluesse.push(anschluss)
    else nachNummer.set(nummer, { nummer, art: anschluss.art, anschluesse: [anschluss] })
  }

  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type === 'leitung') {
        for (const [seite, endpunkt] of [objekt.start, objekt.ziel].entries()) {
          if (endpunkt.art !== 'schacht' || !schachtIds.has(endpunkt.objektId)) continue
          ergaenze(endpunkt.strang, {
            blattId: blatt.id,
            schachtId: endpunkt.objektId,
            objektId: objekt.id,
            art: 'leitung',
            seite: seite === 0 ? 0 : 1,
          })
        }
      } else if (objekt.type === 'trunk') {
        for (const [seite, ende] of objekt.enden.entries()) {
          const ref = ende.schachtRef
          if (!ref || !schachtIds.has(ref.objektId)) continue
          ergaenze(ref.strang, {
            blattId: blatt.id,
            schachtId: ref.objektId,
            objektId: objekt.id,
            art: 'trunk',
            seite: seite === 0 ? 0 : 1,
          })
        }
      }
    }
  }

  return [...nachNummer.values()].sort((a, b) => a.nummer - b.nummer)
}

export function findeStrang(
  zeichnung: Zeichnung,
  verbundId: string,
  nummer: number,
): SchachtStrang | null {
  return ermittleSchachtStraenge(zeichnung, verbundId).find((s) => s.nummer === nummer) ?? null
}

export function naechsteFreieStrangNummer(zeichnung: Zeichnung, verbundId: string): number {
  const belegt = new Set(ermittleSchachtStraenge(zeichnung, verbundId).map((s) => s.nummer))
  for (let i = 1; ; i++) {
    if (!belegt.has(i)) return i
  }
}

export function strangNamenImVerbund(
  zeichnung: Zeichnung,
  verbundId: string,
): Readonly<Record<string, string>> {
  for (const { schacht } of schaechteImVerbund(zeichnung, verbundId)) {
    if (schacht.strangNamen && Object.keys(schacht.strangNamen).length > 0) {
      return schacht.strangNamen
    }
  }
  return {}
}

export function strangName(
  zeichnung: Zeichnung,
  verbundId: string,
  nummer: number,
): string | undefined {
  return strangNamenImVerbund(zeichnung, verbundId)[String(nummer)]
}

export function strangTitel(nummer: number, name?: string): string {
  return name ? `S${nummer} ${name}` : `S${nummer}`
}

export function strangTitelMitKlartext(nummer: number, name?: string, klartext?: string): string {
  const titel = strangTitel(nummer, name)
  return klartext ? `${titel} – ${klartext}` : titel
}

export function mitStrangName(
  namen: Readonly<Record<string, string>> | undefined,
  nummer: number,
  name: string,
): Record<string, string> | undefined {
  const neu = { ...namen }
  const bereinigt = name.trim()
  if (bereinigt) neu[String(nummer)] = bereinigt
  else delete neu[String(nummer)]
  return Object.keys(neu).length > 0 ? neu : undefined
}

export type StrangPruefung =
  | { erlaubt: true; hinweisGleichesBlatt: boolean }
  | { erlaubt: false; grund: 'andereArt' | 'belegt' | 'bereitsAngeschlossen' }

export function pruefeStrangAnschluss(
  strang: SchachtStrang,
  art: 'leitung' | 'trunk',
  blattId: string,
  objektId: string,
): StrangPruefung {
  if (strang.art !== art) return { erlaubt: false, grund: 'andereArt' }
  if (strang.anschluesse.some((a) => a.objektId === objektId)) {
    return { erlaubt: false, grund: 'bereitsAngeschlossen' }
  }
  if (art === 'leitung' && strang.anschluesse.length >= MAX_ANSCHLUESSE_LEITUNGSSTRANG) {
    return { erlaubt: false, grund: 'belegt' }
  }
  return {
    erlaubt: true,
    hinweisGleichesBlatt: strang.anschluesse.some((a) => a.blattId === blattId),
  }
}

export function schachtMittelpunkt(schacht: KabelschachtObjekt): Point {
  return {
    x: schacht.ursprung.x + schacht.breite / 2,
    y: schacht.ursprung.y + schacht.hoehe / 2,
  }
}

export function schachtAnschlussPunkt(schacht: KabelschachtObjekt, von: Point): Point {
  const ecken = rechteckEcken(schacht)
  let bester = ecken[0]
  let besteDistanz = Number.POSITIVE_INFINITY
  for (let i = 0; i < ecken.length; i++) {
    const a = ecken[i]
    const b = ecken[(i + 1) % ecken.length]
    const kandidat = naechsterPunktAufSegment(von, a, b)
    const d = distance(von, kandidat)
    if (d < besteDistanz) {
      besteDistanz = d
      bester = kandidat
    }
  }
  return bester
}

export function schachtEtagenVerweise(
  zeichnung: Zeichnung,
  blattId: string,
  verbundId: string,
): { nachOben: Blatt[]; nachUnten: Blatt[] } {
  const eigenerIndex = zeichnung.blaetter.findIndex((b) => b.id === blattId)
  const straenge = ermittleSchachtStraenge(zeichnung, verbundId)
  const blaetterMitAnschluss = new Set<string>()
  for (const strang of straenge) {
    for (const anschluss of strang.anschluesse) blaetterMitAnschluss.add(anschluss.blattId)
  }

  const nachOben: Blatt[] = []
  const nachUnten: Blatt[] = []
  if (eigenerIndex < 0) return { nachOben, nachUnten }
  const blaetterMitSchacht = new Set(schaechteImVerbund(zeichnung, verbundId).map((g) => g.blattId))
  for (const [index, blatt] of zeichnung.blaetter.entries()) {
    if (index === eigenerIndex || !blaetterMitAnschluss.has(blatt.id)) continue
    if (!blaetterMitSchacht.has(blatt.id)) continue
    if (index > eigenerIndex) nachOben.push(blatt)
    else nachUnten.push(blatt)
  }
  return { nachOben, nachUnten }
}

function geschosshoehenImVerbund(
  zeichnung: Zeichnung,
  verbundId: string,
): { blattId: string; meter: number; ausKoten: boolean }[] {
  const proBlatt: { blattId: string; geschosshoehe: number }[] = []
  for (const { blattId, schacht } of schaechteImVerbund(zeichnung, verbundId)) {
    if (proBlatt.some((e) => e.blattId === blattId)) continue
    proBlatt.push({ blattId, geschosshoehe: schacht.geschosshoehe })
  }
  const kote = (blattId: string) => zeichnung.blaetter.find((b) => b.id === blattId)?.geschoss?.kote
  return proBlatt.map((eintrag, i) => {
    const naechstes = proBlatt[i + 1]
    const hier = kote(eintrag.blattId)
    const dort = naechstes ? kote(naechstes.blattId) : undefined
    return hier !== undefined && dort !== undefined
      ? { blattId: eintrag.blattId, meter: Math.abs(dort - hier), ausKoten: true }
      : { blattId: eintrag.blattId, meter: eintrag.geschosshoehe, ausKoten: false }
  })
}

export function wirksameGeschosshoehe(
  zeichnung: Zeichnung,
  verbundId: string,
  blattId: string,
): { meter: number; ausKoten: boolean } | null {
  const eintrag = geschosshoehenImVerbund(zeichnung, verbundId).find((e) => e.blattId === blattId)
  return eintrag ? { meter: eintrag.meter, ausKoten: eintrag.ausKoten } : null
}

export function steigstreckeMeter(
  zeichnung: Zeichnung,
  verbundId: string,
  blattIdA: string,
  blattIdB: string,
): number {
  if (blattIdA === blattIdB) return 0
  const proBlatt = geschosshoehenImVerbund(zeichnung, verbundId)
  const indexA = proBlatt.findIndex((e) => e.blattId === blattIdA)
  const indexB = proBlatt.findIndex((e) => e.blattId === blattIdB)
  if (indexA < 0 || indexB < 0) return 0

  const von = Math.min(indexA, indexB)
  const bis = Math.max(indexA, indexB)
  let summe = 0
  for (let i = von; i < bis; i++) summe += proBlatt[i].meter
  return summe
}

export interface DurchgehendesLeitungsGlied {
  blattId: string
  leitung: LeitungsObjekt
}

export interface DurchgehendeLeitung {
  glieder: DurchgehendesLeitungsGlied[]
  steigstreckeMeter: number
}

interface LeitungsGliedIntern extends DurchgehendesLeitungsGlied {
  blattIndex: number
}

export function ermittleDurchgehendeLeitung(
  zeichnung: Zeichnung,
  blattId: string,
  leitungId: string,
): DurchgehendeLeitung | null {
  const start = findeLeitung(zeichnung, blattId, leitungId)
  if (!start) return null

  const verbundIndex = schachtVerbundIndex(zeichnung)
  const straengeJeVerbund = new Map<string, SchachtStrang[]>()
  const straenge = (verbundId: string): SchachtStrang[] => {
    const vorhanden = straengeJeVerbund.get(verbundId)
    if (vorhanden) return vorhanden
    const frisch = ermittleSchachtStraenge(zeichnung, verbundId)
    straengeJeVerbund.set(verbundId, frisch)
    return frisch
  }

  const partner = (
    glied: LeitungsGliedIntern,
    seite: 0 | 1,
  ): { glied: LeitungsGliedIntern; steigstrecke: number } | null => {
    const endpunkt = seite === 0 ? glied.leitung.start : glied.leitung.ziel
    if (endpunkt.art !== 'schacht') return null
    const verbundId = verbundIndex.get(endpunkt.objektId)
    if (verbundId === undefined) return null
    const strang = straenge(verbundId).find((s) => s.nummer === endpunkt.strang)
    if (!strang) return null
    const gegenueber = strang.anschluesse.find((a) => a.objektId !== glied.leitung.id)
    if (!gegenueber) return null
    const nachbar = findeLeitung(zeichnung, gegenueber.blattId, gegenueber.objektId)
    if (!nachbar) return null
    return {
      glied: {
        blattId: gegenueber.blattId,
        leitung: nachbar,
        blattIndex: zeichnung.blaetter.findIndex((b) => b.id === gegenueber.blattId),
      },
      steigstrecke: steigstreckeMeter(zeichnung, verbundId, glied.blattId, gegenueber.blattId),
    }
  }

  const startGlied: LeitungsGliedIntern = {
    blattId,
    leitung: start,
    blattIndex: zeichnung.blaetter.findIndex((b) => b.id === blattId),
  }
  const besucht = new Set<string>([start.id])
  let steigstrecke = 0

  const vorne: LeitungsGliedIntern[] = []
  for (let aktuell = startGlied; ;) {
    const naechster = partner(aktuell, 0)
    if (!naechster || besucht.has(naechster.glied.leitung.id)) break
    besucht.add(naechster.glied.leitung.id)
    steigstrecke += naechster.steigstrecke
    vorne.unshift(naechster.glied)
    aktuell = naechster.glied
  }
  const hinten: LeitungsGliedIntern[] = []
  for (let aktuell = startGlied; ;) {
    const naechster = partner(aktuell, 1)
    if (!naechster || besucht.has(naechster.glied.leitung.id)) break
    besucht.add(naechster.glied.leitung.id)
    steigstrecke += naechster.steigstrecke
    hinten.push(naechster.glied)
    aktuell = naechster.glied
  }

  const glieder = [...vorne, startGlied, ...hinten]
  return {
    glieder: glieder.map(({ blattId: id, leitung }) => ({ blattId: id, leitung })),
    steigstreckeMeter: steigstrecke,
  }
}

function findeLeitung(
  zeichnung: Zeichnung,
  blattId: string,
  leitungId: string,
): LeitungsObjekt | null {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  const objekt = blatt?.objekte.find((o) => o.id === leitungId)
  return objekt && objekt.type === 'leitung' ? objekt : null
}

export function findePartnerLeitungAmStrang(
  zeichnung: Zeichnung,
  schachtId: string,
  strang: number,
): LeitungsObjekt | null {
  const verbundId = schachtVerbundIndex(zeichnung).get(schachtId)
  if (verbundId === undefined) return null
  const gefundenerStrang = findeStrang(zeichnung, verbundId, strang)
  if (!gefundenerStrang || gefundenerStrang.art !== 'leitung') return null
  for (const anschluss of gefundenerStrang.anschluesse) {
    const leitung = findeLeitung(zeichnung, anschluss.blattId, anschluss.objektId)
    if (leitung) return leitung
  }
  return null
}

export function trunkAnschluesseJeStrang(
  zeichnung: Zeichnung,
): Map<string, { blattId: string; trunk: TrunkObjekt; endeIndex: 0 | 1 }[]> {
  const verbundIndex = schachtVerbundIndex(zeichnung)
  const nachStrang = new Map<string, { blattId: string; trunk: TrunkObjekt; endeIndex: 0 | 1 }[]>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'trunk') continue
      for (const [index, ende] of objekt.enden.entries()) {
        const ref = ende.schachtRef
        if (!ref) continue
        const verbundId = verbundIndex.get(ref.objektId)
        if (verbundId === undefined) continue
        const schluessel = `${verbundId}#${ref.strang}`
        const eintrag = {
          blattId: blatt.id,
          trunk: objekt,
          endeIndex: index === 0 ? 0 : (1 as 0 | 1),
        }
        const liste = nachStrang.get(schluessel)
        if (liste) liste.push(eintrag)
        else nachStrang.set(schluessel, [eintrag])
      }
    }
  }
  return nachStrang
}

export function gemeinsamerTrunkStrang(
  zeichnung: Zeichnung,
  a: { blattId: string; trunk: TrunkObjekt },
  b: { blattId: string; trunk: TrunkObjekt },
): { schachtA: KabelschachtObjekt; schachtB: KabelschachtObjekt; strang: number } | null {
  for (const endeA of a.trunk.enden) {
    if (!endeA.schachtRef) continue
    const schachtA = findeSchacht(zeichnung, a.blattId, endeA.schachtRef.objektId)
    if (!schachtA) continue
    for (const endeB of b.trunk.enden) {
      if (!endeB.schachtRef || endeB.schachtRef.strang !== endeA.schachtRef.strang) continue
      const schachtB = findeSchacht(zeichnung, b.blattId, endeB.schachtRef.objektId)
      if (!schachtB || schachtB.verbundId !== schachtA.verbundId) continue
      return { schachtA, schachtB, strang: endeA.schachtRef.strang }
    }
  }
  return null
}

export interface SchachtFortsetzung {
  blattId: string
  blattName: string
  schachtId: string
}

export function moeglicheFortsetzungen(
  zeichnung: Zeichnung,
  blattId: string,
  verbundId: string,
): SchachtFortsetzung[] {
  const ergebnis: SchachtFortsetzung[] = []
  for (const blatt of zeichnung.blaetter) {
    if (blatt.id === blattId) continue
    const schacht = blatt.objekte.find(
      (o): o is KabelschachtObjekt => istKabelschacht(o) && o.verbundId === verbundId,
    )
    if (!schacht) continue
    ergebnis.push({ blattId: blatt.id, blattName: blatt.name, schachtId: schacht.id })
  }
  return ergebnis
}

export interface StrangEintrag {
  blattId: string
  blattName: string
  text: string
}

export interface StrangAnzeige {
  nummer: number
  art: 'leitung' | 'trunk'
  name?: string
  eintraege: StrangEintrag[]
  kurz: string
}

export function beschreibeSchachtStraenge(
  zeichnung: Zeichnung,
  verbundId: string,
  katalog: readonly CatalogComponent[],
  uebersetze: Uebersetzer = t,
): StrangAnzeige[] {
  const blattName = (id: string) => zeichnung.blaetter.find((b) => b.id === id)?.name ?? '?'
  const namen = strangNamenImVerbund(zeichnung, verbundId)
  return ermittleSchachtStraenge(zeichnung, verbundId).map((strang) => {
    const eintraege = strang.anschluesse.map((anschluss) => ({
      blattId: anschluss.blattId,
      blattName: blattName(anschluss.blattId),
      text: anschlussText(zeichnung, anschluss, katalog, uebersetze),
    }))
    return {
      nummer: strang.nummer,
      art: strang.art,
      name: namen[String(strang.nummer)],
      eintraege,
      kurz: [...new Set(eintraege.map((e) => e.text))].join(' → '),
    }
  })
}

function anschlussText(
  zeichnung: Zeichnung,
  anschluss: SchachtAnschluss,
  katalog: readonly CatalogComponent[],
  uebersetze: Uebersetzer,
): string {
  const blatt = zeichnung.blaetter.find((b) => b.id === anschluss.blattId)
  const objekt = blatt?.objekte.find((o) => o.id === anschluss.objektId)
  if (!objekt) return '?'
  if (objekt.type === 'trunk') return objekt.name
  if (objekt.type !== 'leitung') return '?'

  const gegenende = anschluss.seite === 0 ? objekt.ziel : objekt.start
  switch (gegenende.art) {
    case 'dock':
      return beschreibeKomponente(
        zeichnung,
        anschluss.blattId,
        gegenende.objektId,
        katalog,
        uebersetze,
      )
    case 'switchport':
    case 'verteiler':
      return beschreibeKomponente(
        zeichnung,
        gegenende.blattId,
        gegenende.objektId,
        katalog,
        uebersetze,
      )
    case 'schacht':
      return uebersetze('beschriftung.kabelschacht.kabelschacht')
    default:
      return uebersetze('beschriftung.kabelschacht.offenesEnde')
  }
}

export function beschreibeKomponente(
  zeichnung: Zeichnung,
  blattId: string,
  objektId: string,
  katalog: readonly CatalogComponent[],
  uebersetze: Uebersetzer = t,
): string {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  const instanz = blatt?.objekte.find(
    (o): o is KomponentenObjekt => o.type === 'komponente' && o.id === objektId,
  )
  if (!instanz) return '?'
  const eintrag = katalog.find((k) => k.id === instanz.catalogComponentId)
  const typ = eintrag
    ? aufgeloesteVariante(eintrag, instanz.variantId, spracheDesUebersetzers(uebersetze)).name
    : null
  const bemerkung = instanz.beschriftung?.trim() || null
  return (
    [typ, bemerkung].filter((teil): teil is string => !!teil).join(' · ') ||
    uebersetze('beschriftung.kabelschacht.komponente')
  )
}
