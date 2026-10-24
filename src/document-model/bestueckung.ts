import { t } from '../sprache'
import type { CatalogComponent } from './catalog'
import { erzeugeId } from './id'
import type { BestueckungsEintrag, Phase } from './objekte'
import {
  istKlemmenKennzeichen,
  klemmenPolAnzahl,
  klemmenZahl,
  naechsteKlemmenNummer,
  STANDARD_KLEMMENLEISTE,
} from './klemmen'
import { anschlussNamen, kennbuchstabeVon, variablenVorgabe } from './verteiler-belegung'

export const PHASEN: readonly Phase[] = ['L1', 'L2', 'L3']

export function naechstePhase(letzte: Phase | undefined): Phase {
  if (!letzte) return 'L1'
  return PHASEN[(PHASEN.indexOf(letzte) + 1) % PHASEN.length]
}

export function istMehrphasig(anschluesse: readonly string[]): boolean {
  return PHASEN.every((p) => anschluesse.includes(p))
}

export function brauchtPhase(kennzeichen: string, anschluesse: readonly string[]): boolean {
  return kennbuchstabeVon(kennzeichen) === 'F' && !istMehrphasig(anschluesse)
}

export function naechstesBestueckungsKennzeichen(
  belegt: Iterable<string>,
  buchstabe: string,
): string {
  const vergeben = new Set(belegt)
  let n = 1
  while (vergeben.has(`${buchstabe}${n}`)) n++
  return `${buchstabe}${n}`
}

export function knotenSchluessel(e: Pick<BestueckungsEintrag, 'kennzeichen' | 'kanal'>): string {
  return e.kanal ? `${e.kennzeichen}:${e.kanal}` : e.kennzeichen
}

export function kanalGeraeteKennzeichen(liste: readonly BestueckungsEintrag[]): Set<string> {
  const ergebnis = new Set<string>()
  const mitEintrag = new Set(liste.filter((e) => !e.kanal).map((e) => e.kennzeichen))
  for (const e of liste) {
    if (e.mitKanaelen || (e.kanal && !mitEintrag.has(e.kennzeichen))) ergebnis.add(e.kennzeichen)
  }
  return ergebnis
}

export function istLeistenKlemme(
  e: BestueckungsEintrag,
  liste: readonly BestueckungsEintrag[],
): boolean {
  return (
    e.kanal !== undefined &&
    istKlemmenKennzeichen(e.kennzeichen) &&
    !liste.some((d) => !d.kanal && d.kennzeichen === e.kennzeichen)
  )
}

export function belegteLeistenNummern(
  liste: readonly BestueckungsEintrag[],
  leiste: string,
  katalog: readonly CatalogComponent[] = [],
  ohneId?: string,
): Set<number> {
  const belegt = new Set<number>()
  for (const e of liste) {
    if (e.kennzeichen !== leiste || e.id === ohneId) continue
    if (e.kanal) {
      const n = klemmenZahl(e.kanal)
      if (n !== null) belegt.add(n)
      continue
    }
    const k = katalog.find((c) => c.id === e.catalogComponentId)
    for (const name of anschlussNamen(k?.dockpunkte)) {
      const n = klemmenZahl(name)
      if (n !== null) belegt.add(n)
    }
  }
  return belegt
}

export function stehtImBaum(e: BestueckungsEintrag, kanalGeraete: ReadonlySet<string>): boolean {
  return e.kanal !== undefined || !kanalGeraete.has(e.kennzeichen)
}

export function wirksameEltern(liste: readonly BestueckungsEintrag[]): Map<string, string | null> {
  const kanalGeraete = kanalGeraeteKennzeichen(liste)
  const imBaum = new Map(
    liste.filter((e) => stehtImBaum(e, kanalGeraete)).map((e) => [e.id, e] as const),
  )
  const ergebnis = new Map<string, string | null>()
  for (const e of imBaum.values()) {
    const eltern = e.elternId && imBaum.has(e.elternId) ? e.elternId : null
    ergebnis.set(e.id, eltern)
  }
  for (const id of ergebnis.keys()) {
    const gesehen = new Set<string>([id])
    let aktuell = ergebnis.get(id) ?? null
    while (aktuell !== null) {
      if (gesehen.has(aktuell)) {
        ergebnis.set(id, null)
        break
      }
      gesehen.add(aktuell)
      aktuell = ergebnis.get(aktuell) ?? null
    }
  }
  return ergebnis
}

export function nachfahren(liste: readonly BestueckungsEintrag[], id: string): Set<string> {
  const eltern = wirksameEltern(liste)
  const ergebnis = new Set<string>()
  let gewachsen = true
  while (gewachsen) {
    gewachsen = false
    for (const [kind, e] of eltern) {
      if (e !== null && (e === id || ergebnis.has(e)) && !ergebnis.has(kind)) {
        ergebnis.add(kind)
        gewachsen = true
      }
    }
  }
  return ergebnis
}

function letztePhase(liste: readonly BestueckungsEintrag[]): Phase | undefined {
  return [...liste].reverse().find((e) => e.phase)?.phase
}

function neuerEintrag(
  eintrag: CatalogComponent,
  kennzeichen: string,
  elternId: string | undefined,
): BestueckungsEintrag {
  const variablen = variablenVorgabe(eintrag.textElemente)
  return {
    id: erzeugeId('bestueckung'),
    catalogComponentId: eintrag.id,
    kennzeichen,
    ...(Object.keys(variablen).length > 0 ? { variablen } : {}),
    ...(elternId ? { elternId } : {}),
  }
}

export function neueBestueckungsEintraege(
  bestehend: readonly BestueckungsEintrag[],
  eintrag: CatalogComponent,
  anzahl: number,
  elternId?: string,
  klemmen: KlemmenOptionen = {},
): BestueckungsEintrag[] {
  const buchstabe = eintrag.kennzeichenBuchstabe?.trim()
  if (!buchstabe || anzahl < 1) return []
  if (istKlemmenKennzeichen(buchstabe))
    return neueLeistenKlemmen(bestehend, eintrag, anzahl, elternId, klemmen)
  const belegt = bestehend.map((e) => e.kennzeichen)
  const anschluesse = anschlussNamen(eintrag.dockpunkte)
  let phase = letztePhase(bestehend)
  const neue: BestueckungsEintrag[] = []
  for (let i = 0; i < anzahl; i++) {
    const kennzeichen = naechstesBestueckungsKennzeichen(belegt, buchstabe)
    belegt.push(kennzeichen)
    const neu = neuerEintrag(eintrag, kennzeichen, elternId)
    if (brauchtPhase(kennzeichen, anschluesse)) {
      phase = naechstePhase(phase)
      neu.phase = phase
    }
    neue.push(neu)
  }
  return neue
}

export interface KlemmenOptionen {
  leiste?: string
  katalog?: readonly CatalogComponent[]
}

function neueLeistenKlemmen(
  bestehend: readonly BestueckungsEintrag[],
  eintrag: CatalogComponent,
  anzahl: number,
  elternId: string | undefined,
  { leiste = STANDARD_KLEMMENLEISTE, katalog = [] }: KlemmenOptionen,
): BestueckungsEintrag[] {
  const belegt = belegteLeistenNummern(bestehend, leiste, katalog)
  let n = naechsteKlemmenNummer(belegt)
  const neue: BestueckungsEintrag[] = []
  for (let i = 0; i < anzahl * klemmenPolAnzahl(eintrag.dockpunkte); i++) {
    neue.push({
      id: erzeugeId('bestueckung'),
      catalogComponentId: eintrag.id,
      kennzeichen: leiste,
      kanal: String(n++),
      ...(elternId ? { elternId } : {}),
    })
  }
  return neue
}

export function leistenKlemmeUmnummeriert(
  liste: readonly BestueckungsEintrag[],
  eintragId: string,
  eingabe: string,
  katalog: readonly CatalogComponent[] = [],
): { liste: BestueckungsEintrag[]; alt: string; neu: string } | { fehler: string } | null {
  const e = liste.find((x) => x.id === eintragId)
  if (!e?.kanal) return null
  const text = eingabe.trim().replace(/^-/, '')
  const treffer = /^(?:([A-Za-z]+\d*)\s*:?\s*)?(\d+)?$/.exec(text)
  if (!text || !treffer || (!treffer[1] && !treffer[2]))
    return { fehler: t('generatoren.bestueckung.keineKlemme', { eingabe: eingabe.trim() }) }
  const leiste = treffer[1] ?? e.kennzeichen
  if (!istKlemmenKennzeichen(leiste))
    return { fehler: t('generatoren.bestueckung.keineKlemmenleiste', { leiste }) }
  const belegt = belegteLeistenNummern(liste, leiste, katalog, e.id)
  const nummer = treffer[2] ? Number(treffer[2]) : naechsteKlemmenNummer(belegt)
  if (nummer < 1) return { fehler: t('generatoren.bestueckung.nummerAbEins') }
  if (belegt.has(nummer))
    return { fehler: t('generatoren.bestueckung.vergeben', { klemme: `${leiste}:${nummer}` }) }
  const alt = `${e.kennzeichen}:${e.kanal}`
  const neu = `${leiste}:${nummer}`
  if (alt === neu) return null
  return {
    liste: liste.map((x) =>
      x.id === e.id ? { ...x, kennzeichen: leiste, kanal: String(nummer) } : x,
    ),
    alt,
    neu,
  }
}

export function leisteNeuNummeriert(
  liste: readonly BestueckungsEintrag[],
  leiste: string,
): { liste: BestueckungsEintrag[]; umbenannt: Map<string, string> } {
  const eltern = wirksameEltern(liste)
  const kinder = new Map<string | null, BestueckungsEintrag[]>()
  for (const e of liste) {
    if (!eltern.has(e.id)) continue
    const von = eltern.get(e.id) ?? null
    kinder.set(von, [...(kinder.get(von) ?? []), e])
  }
  const reihenfolge: BestueckungsEintrag[] = []
  const besuche = (von: string | null) => {
    for (const k of kinder.get(von) ?? []) {
      reihenfolge.push(k)
      besuche(k.id)
    }
  }
  besuche(null)
  const neueNummer = new Map<string, string>()
  const umbenannt = new Map<string, string>()
  let n = 1
  for (const e of reihenfolge) {
    if (e.kennzeichen !== leiste || !istLeistenKlemme(e, liste) || klemmenZahl(e.kanal) === null)
      continue
    const nummer = String(n++)
    if (nummer === e.kanal) continue
    neueNummer.set(e.id, nummer)
    umbenannt.set(`${leiste}:${e.kanal}`, `${leiste}:${nummer}`)
  }
  return {
    liste: liste.map((e) => (neueNummer.has(e.id) ? { ...e, kanal: neueNummer.get(e.id)! } : e)),
    umbenannt,
  }
}

export function einzelklemmen(liste: readonly BestueckungsEintrag[]): BestueckungsEintrag[] {
  const mitKanal = new Set(liste.filter((e) => e.kanal).map((e) => e.kennzeichen))
  return liste.filter(
    (e) =>
      !e.kanal &&
      !e.mitKanaelen &&
      istKlemmenKennzeichen(e.kennzeichen) &&
      !mitKanal.has(e.kennzeichen),
  )
}

export function einzelklemmenInLeiste(
  liste: readonly BestueckungsEintrag[],
  katalog: readonly CatalogComponent[],
  leiste: string = STANDARD_KLEMMENLEISTE,
): { liste: BestueckungsEintrag[]; umbenannt: Map<string, string> } {
  const alte = einzelklemmen(liste)
  const umbenannt = new Map<string, string>()
  const ids = new Set(alte.map((e) => e.id))
  const rest = liste.filter((e) => !ids.has(e.id))
  if (alte.length === 0 || rest.some((e) => !e.kanal && e.kennzeichen === leiste))
    return { liste: [...liste], umbenannt }
  const belegt = belegteLeistenNummern(rest, leiste, katalog)
  const katalogVon = (e: BestueckungsEintrag) => katalog.find((k) => k.id === e.catalogComponentId)
  const nummern = new Map<string, number[]>()
  const spaeter: BestueckungsEintrag[] = []
  for (const e of alte) {
    const wunsch = klemmenZahl(/(\d+)$/.exec(e.kennzeichen)?.[1])
    if (
      klemmenPolAnzahl(katalogVon(e)?.dockpunkte) === 1 &&
      wunsch !== null &&
      !belegt.has(wunsch)
    ) {
      belegt.add(wunsch)
      nummern.set(e.id, [wunsch])
    } else spaeter.push(e)
  }
  for (const e of spaeter) {
    const pole = klemmenPolAnzahl(katalogVon(e)?.dockpunkte)
    let n = naechsteKlemmenNummer(belegt)
    const eigene: number[] = []
    for (let i = 0; i < pole; i++) {
      belegt.add(n)
      eigene.push(n++)
    }
    nummern.set(e.id, eigene)
  }
  const neu = liste.flatMap((e): BestueckungsEintrag[] => {
    const eigene = nummern.get(e.id)
    if (!eigene) return [e]
    umbenannt.set(e.kennzeichen, `${leiste}:${eigene[0]}`)
    const namen = eigene.length > 1 ? anschlussNamen(katalogVon(e)?.dockpunkte) : []
    namen.forEach((name, i) => {
      if (eigene[i] !== undefined)
        umbenannt.set(`${e.kennzeichen}:${name}`, `${leiste}:${eigene[i]}`)
    })
    const { variablen: _v, mitKanaelen: _m, ...basis } = e
    return eigene.map((n, i) => ({
      ...basis,
      ...(i > 0 ? { id: erzeugeId('bestueckung') } : {}),
      kennzeichen: leiste,
      kanal: String(n),
    }))
  })
  return { liste: neu, umbenannt }
}

export function neueStromkreise(
  bestehend: readonly BestueckungsEintrag[],
  schutz: CatalogComponent,
  klemme: CatalogComponent | null,
  anzahl: number,
  elternId?: string,
  klemmen: KlemmenOptionen = {},
): BestueckungsEintrag[] {
  const neue: BestueckungsEintrag[] = []
  for (let i = 0; i < anzahl; i++) {
    const [f] = neueBestueckungsEintraege([...bestehend, ...neue], schutz, 1, elternId)
    if (!f) return neue
    neue.push(f)
    if (!klemme) continue
    neue.push(...neueBestueckungsEintraege([...bestehend, ...neue], klemme, 1, f.id, klemmen))
  }
  return neue
}

export function kanalEinordnen(
  liste: readonly BestueckungsEintrag[],
  geraetId: string,
  kanal: string,
  elternId?: string,
): BestueckungsEintrag[] | null {
  const geraet = liste.find((e) => e.id === geraetId && !e.kanal)
  if (!geraet) return null
  if (liste.some((e) => e.kennzeichen === geraet.kennzeichen && e.kanal === kanal)) return null
  const neu: BestueckungsEintrag = {
    id: erzeugeId('bestueckung'),
    catalogComponentId: geraet.catalogComponentId,
    kennzeichen: geraet.kennzeichen,
    kanal,
    ...(elternId ? { elternId } : {}),
  }
  const ohneEltern = liste.map((e) => {
    if (e.id !== geraetId) return e
    const { elternId: _weg, ...rest } = e
    return { ...rest, mitKanaelen: true }
  })
  return [...umgehaengt(ohneEltern, geraetId, geraet.elternId), neu]
}

export function planGeraetAufnehmen(
  liste: readonly BestueckungsEintrag[],
  geraet: { kennzeichen: string; catalogComponentId: string; kanal?: string },
  elternId?: string,
): BestueckungsEintrag[] {
  return [
    ...liste,
    {
      id: erzeugeId('bestueckung'),
      catalogComponentId: geraet.catalogComponentId,
      kennzeichen: geraet.kennzeichen,
      ...(geraet.kanal ? { kanal: geraet.kanal } : {}),
      ...(elternId ? { elternId } : {}),
    },
  ]
}

export type EinhaengeZiel =
  | { art: 'kind'; zielId: string | null }
  | { art: 'davor'; zielId: string }
  | { art: 'dahinter'; zielId: string }

export function bestueckungEinhaengen(
  liste: readonly BestueckungsEintrag[],
  id: string,
  ziel: EinhaengeZiel,
): BestueckungsEintrag[] | null {
  const knoten = liste.find((e) => e.id === id)
  if (!knoten) return null
  const kanalGeraete = kanalGeraeteKennzeichen(liste)
  if (!stehtImBaum(knoten, kanalGeraete)) return null
  const zielEintrag = ziel.zielId ? liste.find((e) => e.id === ziel.zielId) : null
  if (ziel.zielId && (!zielEintrag || !stehtImBaum(zielEintrag, kanalGeraete))) return null
  if (ziel.zielId === id || (ziel.zielId && nachfahren(liste, id).has(ziel.zielId))) return null

  const eltern =
    ziel.art === 'kind'
      ? (ziel.zielId ?? undefined)
      : (wirksameEltern(liste).get(ziel.zielId) ?? undefined)
  const { elternId: _alt, ...ohne } = knoten
  const neu: BestueckungsEintrag = eltern ? { ...ohne, elternId: eltern } : ohne
  const rest = liste.filter((e) => e.id !== id)
  if (ziel.art === 'kind') return [...rest, neu]
  const index = rest.findIndex((e) => e.id === ziel.zielId)
  const an = ziel.art === 'davor' ? index : index + 1
  return [...rest.slice(0, an), neu, ...rest.slice(an)]
}

export function bestueckungUmbenennen(
  liste: readonly BestueckungsEintrag[],
  eintragId: string,
  neu: string,
): BestueckungsEintrag[] | null {
  const kennzeichen = neu.trim()
  const eintrag = liste.find((e) => e.id === eintragId)
  if (!kennzeichen || !eintrag) return null
  const alt = eintrag.kennzeichen
  if (liste.some((e) => e.kennzeichen === kennzeichen && e.kennzeichen !== alt)) return null
  return liste.map((e) => (e.kennzeichen === alt ? { ...e, kennzeichen } : e))
}

function umgehaengt(
  liste: readonly BestueckungsEintrag[],
  id: string,
  neueEltern: string | undefined,
): BestueckungsEintrag[] {
  return liste.map((e) => {
    if (e.elternId !== id) return e
    const { elternId: _weg, ...rest } = e
    return neueEltern ? { ...rest, elternId: neueEltern } : rest
  })
}

export function bestueckungEntfernen(
  liste: readonly BestueckungsEintrag[],
  eintragIds: ReadonlySet<string>,
  mitKindern = false,
): { liste: BestueckungsEintrag[]; entfernteGeraete: Set<string> } {
  const weg = new Set(eintragIds)
  for (const e of liste) {
    if (!weg.has(e.id) || e.kanal) continue
    for (const k of liste) if (k.kanal && k.kennzeichen === e.kennzeichen) weg.add(k.id)
  }
  if (mitKindern) for (const id of [...weg]) for (const n of nachfahren(liste, id)) weg.add(n)
  let neu = [...liste]
  for (const id of weg) {
    const eintrag = liste.find((e) => e.id === id)
    neu = umgehaengt(neu, id, eintrag?.elternId)
  }
  let geaendert = true
  while (geaendert) {
    geaendert = false
    neu = neu.map((e) => {
      if (!e.elternId || !weg.has(e.elternId)) return e
      geaendert = true
      const eltern = liste.find((x) => x.id === e.elternId)?.elternId
      const { elternId: _weg, ...rest } = e
      return eltern ? { ...rest, elternId: eltern } : rest
    })
  }
  const uebrig = neu.filter((e) => !weg.has(e.id))
  const entfernteGeraete = new Set(
    liste
      .filter((e) => weg.has(e.id) && !e.kanal)
      .map((e) => e.kennzeichen)
      .filter((k) => !uebrig.some((e) => e.kennzeichen === k && !e.kanal)),
  )
  for (const e of liste)
    if (weg.has(e.id) && istLeistenKlemme(e, liste))
      entfernteGeraete.add(`${e.kennzeichen}:${e.kanal}`)
  return { liste: uebrig, entfernteGeraete }
}

export function bestueckungAendern(
  liste: readonly BestueckungsEintrag[],
  eintragId: string,
  patch: Partial<Pick<BestueckungsEintrag, 'phase' | 'bezeichnung' | 'variablen' | 'elternId'>>,
): BestueckungsEintrag[] {
  return liste.map((e) => {
    if (e.id !== eintragId) return e
    const neu: BestueckungsEintrag = { ...e, ...patch }
    for (const feld of Object.keys(patch) as (keyof typeof patch)[]) {
      const wert = neu[feld]
      if (wert === undefined || wert === '') delete neu[feld]
    }
    return neu
  })
}

export function bestueckungAusVorgeschaltet<
  E extends BestueckungsEintrag & { vorgeschaltet?: string },
>(liste: E[]): BestueckungsEintrag[] {
  if (!liste.some((e) => e.vorgeschaltet !== undefined)) return liste
  return liste.map((e) => {
    const { vorgeschaltet, ...rest } = e
    if (!vorgeschaltet || rest.elternId) return rest
    const eltern = liste.find((x) => x.kennzeichen === vorgeschaltet && !x.kanal && x.id !== e.id)
    return eltern ? { ...rest, elternId: eltern.id } : rest
  })
}

export function klemmenHinterSicherungEinordnen(
  liste: readonly BestueckungsEintrag[],
  zuweisungen: readonly { leitungsEnde: string; kennzeichen: string }[],
): BestueckungsEintrag[] {
  const jeEnde = new Map<string, string[]>()
  for (const z of zuweisungen)
    jeEnde.set(z.leitungsEnde, [...(jeEnde.get(z.leitungsEnde) ?? []), z.kennzeichen])
  const geraete = new Map(liste.filter((e) => !e.kanal).map((e) => [e.kennzeichen, e]))
  let geaendert = false
  const neu = liste.map((e) => {
    if (e.kanal || e.elternId || kennbuchstabeVon(e.kennzeichen) !== 'X') return e
    const sicherungen = new Set<string>()
    for (const kennzeichen of jeEnde.values()) {
      if (!kennzeichen.includes(e.kennzeichen)) continue
      for (const k of kennzeichen)
        if (kennbuchstabeVon(k) === 'F' && geraete.has(k)) sicherungen.add(k)
    }
    const [f] = sicherungen
    if (sicherungen.size !== 1) return e
    geaendert = true
    return { ...e, elternId: geraete.get(f)!.id }
  })
  return geaendert ? neu : (liste as BestueckungsEintrag[])
}
