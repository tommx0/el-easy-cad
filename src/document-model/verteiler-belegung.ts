import type { CatalogComponent, DockpunkteKonfiguration, KatalogTextElement } from './catalog'
import type {
  BestueckungsEintrag,
  KomponentenObjekt,
  LeitungsObjekt,
  LeitungsVerteilerAnschluss,
  Phase,
} from './objekte'
import { ermittleDurchgehendeLeitung } from './kabelschacht'
import { istLeitersatz } from './klemmen'
import { knxAktorGeometrie, type KnxAktorDaten } from './knx-aktor'
import { ermittleTrunkKette } from './trunk-kette'
import { istVerteiler } from './verteiler'
import type { Zeichnung } from './zeichnung'
import { t, type Uebersetzer } from '../sprache'

export type VerteilerAuswahl = Omit<LeitungsVerteilerAnschluss, 'ende'>

export interface VerteilerBetriebsmittel {
  kennzeichen: string
  buchstabe: string
  catalogComponentId: string | null
  anschluesse: string[]
  variablen: Record<string, string>
  phase?: Phase
  bezeichnung?: string
  eintragId?: string
  imPlan: boolean
  inBestueckung: boolean
  istFehlerstromSchutz: boolean
  istAbleiter?: boolean
  knxAktor?: KnxAktorDaten
}

export function kennbuchstabeVon(kennzeichen: string): string {
  return /^[A-Za-z]+/.exec(kennzeichen)?.[0] ?? kennzeichen
}

export function vergleicheKennzeichen(a: string, b: string): number {
  return a.localeCompare(b, 'de', { numeric: true, sensitivity: 'base' })
}

export function istFehlerstromSchutzName(name: string | undefined): boolean {
  if (!name) return false
  if (/FI\s*\/\s*LS|RCBO/i.test(name)) return false
  return /\bRCD\b|FI-Schutz|Fehlerstrom/i.test(name)
}

export function istAbleiterName(name: string | undefined): boolean {
  return !!name && /ableiter/i.test(name)
}

export function anschlussNamen(konfiguration: DockpunkteKonfiguration | undefined): string[] {
  if (konfiguration?.modus !== 'frei') return []
  const namen: string[] = []
  for (const punkt of konfiguration.punkte) {
    const name = punkt.trunk ? '' : (punkt.bezeichnung?.trim() ?? '')
    if (name && !namen.includes(name)) namen.push(name)
  }
  return namen
}

export function knxAnschlussNamen(daten: KnxAktorDaten): string[] {
  return knxAktorGeometrie(daten).anschluesse.map((a) => a.name)
}

export function variablenVorgabe(
  textElemente: readonly KatalogTextElement[] | undefined,
): Record<string, string> {
  const werte: Record<string, string> = {}
  for (const t of textElemente ?? []) {
    if (t.variable && !(t.variable in werte)) werte[t.variable] = t.text
  }
  return werte
}

export function ermittleVerteilerBetriebsmittel(
  verteiler: KomponentenObjekt,
  katalog: readonly CatalogComponent[],
  plan?: Pick<Zeichnung, 'blaetter'> | null,
): VerteilerBetriebsmittel[] {
  const bestueckung = (verteiler.verteiler?.bestueckung ?? []).filter((e) => !e.kanal)
  const alleEintraege = verteiler.verteiler?.bestueckung ?? []
  const leisten = (vorhanden: readonly VerteilerBetriebsmittel[]): VerteilerBetriebsmittel[] => {
    const bekannt = new Set([
      ...vorhanden.map((b) => b.kennzeichen),
      ...bestueckung.map((e) => e.kennzeichen),
    ])
    const jeLeiste = new Map<string, BestueckungsEintrag[]>()
    for (const e of alleEintraege) {
      if (!e.kanal || bekannt.has(e.kennzeichen)) continue
      jeLeiste.set(e.kennzeichen, [...(jeLeiste.get(e.kennzeichen) ?? []), e])
    }
    return [...jeLeiste].map(([kennzeichen, klemmen]) => ({
      kennzeichen,
      buchstabe: kennbuchstabeVon(kennzeichen),
      catalogComponentId: klemmen[0].catalogComponentId,
      anschluesse: klemmen.map((e) => e.kanal!).sort(vergleicheKennzeichen),
      variablen: {},
      inBestueckung: true,
      imPlan: false,
      istFehlerstromSchutz: false,
    }))
  }
  const katalogName = (id: string | null) =>
    id ? katalog.find((k) => k.id === id)?.name : undefined
  const ausEintrag = (e: BestueckungsEintrag, imPlan: boolean): VerteilerBetriebsmittel => {
    const eintrag = katalog.find((k) => k.id === e.catalogComponentId)
    return {
      kennzeichen: e.kennzeichen,
      buchstabe: kennbuchstabeVon(e.kennzeichen),
      catalogComponentId: e.catalogComponentId,
      anschluesse: e.knxAktor ? knxAnschlussNamen(e.knxAktor) : anschlussNamen(eintrag?.dockpunkte),
      variablen: { ...(e.variablen ?? {}) },
      phase: e.phase,
      bezeichnung: e.bezeichnung,
      eintragId: e.id,
      imPlan,
      inBestueckung: true,
      istFehlerstromSchutz: istFehlerstromSchutzName(eintrag?.name),
      ...(istAbleiterName(eintrag?.name) ? { istAbleiter: true } : {}),
      ...(e.knxAktor ? { knxAktor: e.knxAktor } : {}),
    }
  }
  if (!plan) return [...bestueckung.map((e) => ausEintrag(e, false)), ...leisten([])]

  const nachKennzeichen = new Map<string, KomponentenObjekt[]>()
  for (const blatt of plan.blaetter) {
    for (const o of blatt.objekte) {
      const kennzeichen = o.type === 'komponente' ? o.geraeteKennzeichen?.trim() : undefined
      if (o.type !== 'komponente' || !kennzeichen) continue
      nachKennzeichen.set(kennzeichen, [...(nachKennzeichen.get(kennzeichen) ?? []), o])
    }
  }
  const ausPlan: VerteilerBetriebsmittel[] = []
  for (const [kennzeichen, symbole] of nachKennzeichen) {
    const geordnet = [...symbole].sort(
      (a, b) =>
        Number(b.betriebsmittelRolle === 'spule') - Number(a.betriebsmittelRolle === 'spule'),
    )
    const erstes = geordnet[0]
    const anschluesse: string[] = []
    for (const s of geordnet) {
      for (const name of planAnschluesse(s)) if (!anschluesse.includes(name)) anschluesse.push(name)
    }
    const variablen: Record<string, string> = {}
    for (const s of geordnet) {
      for (const [feld, wert] of Object.entries(variablenVorgabe(s.textElemente)))
        if (!(feld in variablen)) variablen[feld] = wert
    }
    const eintrag = bestueckung.find((e) => e.kennzeichen === kennzeichen)
    const knx = geordnet.find((s) => s.knxAktor)?.knxAktor
    ausPlan.push({
      kennzeichen,
      buchstabe: kennbuchstabeVon(kennzeichen),
      catalogComponentId: erstes.catalogComponentId,
      anschluesse,
      variablen,
      phase: eintrag?.phase,
      bezeichnung: eintrag?.bezeichnung,
      eintragId: eintrag?.id,
      imPlan: true,
      inBestueckung: eintrag !== undefined,
      istFehlerstromSchutz: istFehlerstromSchutzName(katalogName(erstes.catalogComponentId)),
      ...(istAbleiterName(katalogName(erstes.catalogComponentId)) ? { istAbleiter: true } : {}),
      ...(knx ? { knxAktor: knx } : {}),
    })
  }
  ausPlan.sort((a, b) => vergleicheKennzeichen(a.kennzeichen, b.kennzeichen))
  const nurBestueckung = bestueckung
    .filter((e) => !nachKennzeichen.has(e.kennzeichen))
    .map((e) => ({ ...ausEintrag(e, false), imPlan: false }))
  return [...ausPlan, ...nurBestueckung, ...leisten(ausPlan)]
}

function planAnschluesse(s: KomponentenObjekt): string[] {
  const nummer = s.klemmenNummer?.trim()
  return nummer && istLeitersatz(s.dockpunkte) ? [nummer] : anschlussNamen(s.dockpunkte)
}

export function gegenEnde(ende: 'start' | 'ziel'): 'start' | 'ziel' {
  return ende === 'start' ? 'ziel' : 'start'
}

export function verteilerAmEnde(
  zeichnung: Pick<Zeichnung, 'blaetter'>,
  leitungBlattId: string,
  leitung: Pick<LeitungsObjekt, 'start' | 'ziel'>,
  ende: 'start' | 'ziel',
): { blattId: string; verteiler: KomponentenObjekt } | null {
  const e = leitung[ende]
  if (e.art !== 'verteiler' && e.art !== 'dock') return null
  const blattId = e.art === 'verteiler' ? e.blattId : leitungBlattId
  const objekt = zeichnung.blaetter
    .find((b) => b.id === blattId)
    ?.objekte.find((o) => o.id === e.objektId)
  return objekt && istVerteiler(objekt) ? { blattId, verteiler: objekt } : null
}

export interface VerteilerZuweisung {
  leitungBlattId: string
  leitung: LeitungsObjekt
  anschluss: LeitungsVerteilerAnschluss
}

export function ermittleVerteilerZuweisungen(
  zeichnung: Pick<Zeichnung, 'blaetter'>,
  verteilerId: string,
): VerteilerZuweisung[] {
  const ergebnis: VerteilerZuweisung[] = []
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type !== 'leitung' || !o.verteilerAnschluesse?.length) continue
      for (const anschluss of o.verteilerAnschluesse) {
        const am = verteilerAmEnde(zeichnung, blatt.id, o, anschluss.ende)
        if (am?.verteiler.id === verteilerId)
          ergebnis.push({ leitungBlattId: blatt.id, leitung: o, anschluss })
      }
    }
  }
  return ergebnis
}

export function zuweisungsText(
  a: Pick<LeitungsVerteilerAnschluss, 'kennzeichen' | 'anschluss' | 'ader'>,
  uebersetze: Uebersetzer = t,
): string {
  const basis = a.anschluss ? `${a.kennzeichen}:${a.anschluss}` : a.kennzeichen
  return a.ader ? uebersetze('beschriftung.verteiler.mitAder', { basis, ader: a.ader }) : basis
}

export function leitungsKennzeichen(nummer: number): string {
  return `W${nummer}`
}

export function verteilerAnschlussText(
  zeichnung: Pick<Zeichnung, 'blaetter'>,
  leitungBlattId: string,
  leitung: LeitungsObjekt,
  ende: 'start' | 'ziel',
  uebersetze: Uebersetzer = t,
): string | null {
  const am = verteilerAmEnde(zeichnung, leitungBlattId, leitung, ende)
  const anschluesse = (leitung.verteilerAnschluesse ?? []).filter((a) => a.ende === ende)
  if (!am?.verteiler.verteiler || anschluesse.length === 0) return null
  const [erster, ...weitere] = anschluesse.map((a) => zuweisungsText(a, uebersetze))
  return [`+${am.verteiler.verteiler.kennzeichen}-${erster}`, ...weitere].join(', ')
}

export interface VerteilerAmTrunk {
  blattId: string
  blattName: string
  verteiler: KomponentenObjekt
  trunkId: string
}

export function ermittleVerteilerAnKette(
  zeichnung: Zeichnung,
  blattId: string,
  trunkId: string,
): VerteilerAmTrunk[] {
  const ergebnis: VerteilerAmTrunk[] = []
  const gesehen = new Set<string>()
  for (const glied of ermittleTrunkKette(zeichnung, blattId, trunkId)) {
    const blatt = zeichnung.blaetter.find((b) => b.id === glied.blattId)
    if (!blatt) continue
    for (const ende of glied.trunk.enden) {
      const id = ende.dockRef?.objektId
      if (!id || gesehen.has(id)) continue
      const objekt = blatt.objekte.find((o) => o.id === id)
      if (!objekt || !istVerteiler(objekt)) continue
      gesehen.add(id)
      ergebnis.push({
        blattId: blatt.id,
        blattName: blatt.name,
        verteiler: objekt,
        trunkId: glied.trunk.id,
      })
    }
  }
  return ergebnis
}

export function gegenstelleDerZuweisung(
  zeichnung: Zeichnung,
  zuweisung: VerteilerZuweisung,
): { blattId: string; komponente: KomponentenObjekt } | null {
  const kabel = ermittleDurchgehendeLeitung(
    zeichnung,
    zuweisung.leitungBlattId,
    zuweisung.leitung.id,
  ) ?? { glieder: [{ blattId: zuweisung.leitungBlattId, leitung: zuweisung.leitung }] }
  const eigenesEnde = { leitung: zuweisung.leitung.id, ende: zuweisung.anschluss.ende }
  for (const glied of kabel.glieder) {
    for (const ende of ['start', 'ziel'] as const) {
      if (glied.leitung.id === eigenesEnde.leitung && ende === eigenesEnde.ende) continue
      const e = glied.leitung[ende]
      if (e.art !== 'dock' && e.art !== 'switchport') continue
      const blattId = e.art === 'dock' ? glied.blattId : e.blattId
      const objekt = zeichnung.blaetter
        .find((b) => b.id === blattId)
        ?.objekte.find((o) => o.id === e.objektId)
      if (objekt?.type === 'komponente' && !istVerteiler(objekt))
        return { blattId, komponente: objekt }
    }
  }
  return null
}

export function geraeteZusammenfassung(namen: readonly string[]): string {
  const anzahl = new Map<string, number>()
  for (const name of namen) anzahl.set(name, (anzahl.get(name) ?? 0) + 1)
  return [...anzahl].map(([name, n]) => (n > 1 ? `${n}× ${name}` : name)).join(', ')
}
