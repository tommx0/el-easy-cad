import { oberflaechensprache, t } from '../sprache'
import type { Uebersetzer } from '../sprache'
import type { CatalogComponent } from './catalog'
import { aufgeloesteVariante } from './catalog'
import type { Ansteuerung, Slot } from './geraetegruppe'
import { ansteuerungBezeichnung } from './geraete-regelwerk'
import {
  ermittleAnsteuerung,
  ermittleTypUndSlots,
  komponentenBezeichnung,
} from './geraetegruppen-ableitung'
import { erzeugeId } from './id'
import {
  KNX_BAUGROESSEN,
  knxAktorKatalogId,
  knxKanalIndexAusName,
  knxFunktionText,
  knxKanalName,
  knxPaarBeginn,
  neueKnxAktorDaten,
  normalisiereKnxAktor,
  setzeKnxKanalFunktion,
  type KnxAktorArt,
  type KnxAktorDaten,
  type KnxKanalFunktion,
} from './knx-aktor'
import { nameAusRaum } from './gruppe-bilden'
import type { BestueckungsEintrag, KomponentenObjekt } from './objekte'
import {
  bestueckungEntfernen,
  naechstesBestueckungsKennzeichen,
  nachfahren,
  wirksameEltern,
} from './bestueckung'
import { knxHaken } from './stromkreis-eigenschaft'
import { ermittleStromkreisZuordnungen } from './stromkreis-zuordnung'
import { baueVerteilerBaum, ermittleStromweg, type VerteilerKnoten } from './verteiler-baum'
import { anschlussNamen, geraeteZusammenfassung } from './verteiler-belegung'
import { alleVerteiler } from './verteiler'
import type { Zeichnung } from './zeichnung'
import { slotNameText } from './katalog-uebersetzung'
import { spracheDesUebersetzers } from './plansprache'

export type KnxKanalart = 'schalten' | 'dimmen' | 'jalousie' | 'rollladen'

export const KNX_KANALARTEN: readonly KnxKanalart[] = [
  'schalten',
  'dimmen',
  'jalousie',
  'rollladen',
]

export const KNX_KANALART_TEXT: Record<KnxKanalart, string> = {
  get schalten() {
    return knxFunktionText('schalten')
  },
  get dimmen() {
    return knxFunktionText('dimmen')
  },
  get jalousie() {
    return knxFunktionText('jalousie')
  },
  get rollladen() {
    return knxFunktionText('rollladen')
  },
}

export const KLEMME_1P_N_PE = 'abgangsklemme-1p-n-pe'
export const KLEMME_3P_N_PE = 'abgangsklemme-3p-n-pe'

export const KNX_RESERVE_STANDARD = 20

export function knxArtFuerKanalart(kanalart: KnxKanalart): KnxAktorArt {
  return kanalart === 'dimmen' ? 'dimm' : 'schalt-jalousie'
}

function istPaar(kanalart: KnxKanalart): boolean {
  return kanalart === 'jalousie' || kanalart === 'rollladen'
}

export interface KnxAusloeser {
  name: string
  slot: string
}

export interface KnxZiel {
  blattId: string
  objekt: KomponentenObjekt
  ausloeser: KnxAusloeser[]
}

export function istKnxGeraet(
  objekt: KomponentenObjekt,
  katalog: readonly CatalogComponent[],
): boolean {
  if (objekt.knxAktor) return false
  const eintrag = katalog.find((k) => k.id === objekt.catalogComponentId)
  return eintrag?.hauptgruppe?.trim().toUpperCase() === 'KNX'
}

function zielSchluessel(blattId: string, objektId: string): string {
  return `${blattId}#${objektId}`
}

export function ermittleKnxZiele(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  uebersetze: Uebersetzer = t,
): Map<string, KnxZiel> {
  const instanzen = new Map<string, { blattId: string; objekt: KomponentenObjekt }>()
  const mitglieder = new Map<string, { blattId: string; objekt: KomponentenObjekt }[]>()
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type !== 'komponente') continue
      instanzen.set(zielSchluessel(blatt.id, o.id), { blattId: blatt.id, objekt: o })
      if (o.gruppeId)
        mitglieder.set(o.gruppeId, [
          ...(mitglieder.get(o.gruppeId) ?? []),
          { blattId: blatt.id, objekt: o },
        ])
    }
  }
  const ergebnis = new Map<string, KnxZiel>()
  const ziel = (blattId: string, objekt: KomponentenObjekt, ausloeser: KnxAusloeser) => {
    const k = zielSchluessel(blattId, objekt.id)
    const vorhanden = ergebnis.get(k)
    if (vorhanden) vorhanden.ausloeser.push(ausloeser)
    else ergebnis.set(k, { blattId, objekt, ausloeser: [ausloeser] })
  }
  const quelle = (name: string, slots: readonly Slot[]) => {
    slots.forEach((slot, i) => {
      const ausloeser = {
        name,
        slot:
          slotNameText(slot.bezeichnung, spracheDesUebersetzers(uebersetze)) ||
          uebersetze('generatoren.ersatz.slot', { nr: String(i + 1) }),
      }
      for (const z of slot.ziele) {
        if (z.art === 'instanz') {
          const t = instanzen.get(zielSchluessel(z.blattId, z.objektId))
          if (t) ziel(t.blattId, t.objekt, ausloeser)
        } else {
          for (const m of mitglieder.get(z.gruppeId) ?? []) ziel(m.blattId, m.objekt, ausloeser)
        }
      }
    })
  }
  for (const g of zeichnung.geraeteGruppen) {
    if (g.slots.length === 0) continue
    if ((mitglieder.get(g.id) ?? []).some((m) => istKnxGeraet(m.objekt, katalog)))
      quelle(g.name?.trim() || uebersetze('generatoren.ersatz.geraetegruppe'), g.slots)
  }
  for (const { objekt } of instanzen.values()) {
    if (objekt.gruppeId || !objekt.slots?.length || !istKnxGeraet(objekt, katalog)) continue
    quelle(komponentenBezeichnung(objekt, katalog, uebersetze), objekt.slots)
  }
  for (const { blattId, objekt } of instanzen.values()) {
    const k = zielSchluessel(blattId, objekt.id)
    if (ergebnis.has(k) || objekt.knxAktor || !knxHaken(objekt, zeichnung)) continue
    ergebnis.set(k, { blattId, objekt, ausloeser: [] })
  }
  return ergebnis
}

export function knxKanalartVon(
  objekt: KomponentenObjekt,
  zeichnung: Zeichnung,
): { kanalart: KnxKanalart | null; ansteuerung: Ansteuerung | null } {
  const ansteuerung = ermittleAnsteuerung(objekt, zeichnung)
  if (ermittleTypUndSlots(objekt, zeichnung)?.typ === 'anschlussdose')
    return { kanalart: 'schalten', ansteuerung }
  switch (ansteuerung) {
    case null:
    case 'schalten':
      return { kanalart: 'schalten', ansteuerung }
    case 'dimmen':
      return { kanalart: 'dimmen', ansteuerung }
    case 'rollo':
      return { kanalart: 'rollladen', ansteuerung }
    case 'jalousie':
      return { kanalart: 'jalousie', ansteuerung }
    default:
      return { kanalart: null, ansteuerung }
  }
}

export interface KnxKlemmenZeile {
  klemme: VerteilerKnoten
  ziele: KnxZiel[]
  andere: string
  vorschlag: KnxKanalart | null
  kanalart: KnxKanalart | null
  vorhanden: string | null
  ergebnis: string | null
  klemmeTauschen: boolean
  beschriftung: string
  beschriftungVorschlag: string
  kanalEintragId: string | null
  hinweise: string[]
}

export interface KnxGeraetErgebnis {
  kennzeichen: string
  daten: KnxAktorDaten
  neu: boolean
  belegt: number
  dazu: number
}

export interface KnxFreigabe {
  eintragId: string
  schluessel: string
}

export interface KnxZuordnungPlan {
  zeilen: KnxKlemmenZeile[]
  geraete: KnxGeraetErgebnis[]
  freigeben: KnxFreigabe[]
  hinweise: string[]
  zuweisungen: { klemmeEintragId: string; kennzeichen: string; kanal: number }[]
  neueGeraete: { kennzeichen: string; daten: KnxAktorDaten }[]
  umbenennen: { eintragId: string; bezeichnung: string }[]
}

export interface KnxZuordnungEingabe {
  zeichnung: Zeichnung
  verteiler: KomponentenObjekt
  katalog: readonly CatalogComponent[]
  plan?: Pick<Zeichnung, 'blaetter'> | null
}

export interface KnxZuordnungOptionen {
  reserveProzent?: number
  kanalart?: ReadonlyMap<string, KnxKanalart | null>
  freigeben?: ReadonlySet<string>
  beschriftung?: ReadonlyMap<string, string>
}

const FUNKTION: Record<KnxKanalart, KnxKanalFunktion> = {
  schalten: 'schalten',
  dimmen: 'dimmen',
  jalousie: 'jalousie',
  rollladen: 'rollladen',
}

function verbraucherName(objekt: KomponentenObjekt, katalog: readonly CatalogComponent[]): string {
  const k = katalog.find((x) => x.id === objekt.catalogComponentId)
  return k
    ? aufgeloesteVariante(k, objekt.variantId, oberflaechensprache()).name
    : t('generatoren.ersatz.komponente')
}

export function knxBaugroessenFuer(art: KnxAktorArt, bedarf: number): number[] {
  const groessen = [...KNX_BAUGROESSEN[art]].sort((a, b) => a - b)
  const groesste = groessen[groessen.length - 1]
  const ergebnis: number[] = []
  let rest = bedarf
  while (rest > groesste) {
    ergebnis.push(groesste)
    rest -= groesste
  }
  if (rest > 0) ergebnis.push(groessen.find((g) => g >= rest)!)
  return ergebnis
}

function packe(
  breiten: readonly number[],
  belegt: Set<number>,
  grenze = Infinity,
): (number | null)[] {
  return breiten.map((b) => {
    for (let i = 0; i + b <= grenze; i++) {
      if (b === 2 && i % 2 !== 0) continue
      if (belegt.has(i) || (b === 2 && belegt.has(i + 1))) continue
      belegt.add(i)
      if (b === 2) belegt.add(i + 1)
      return i
    }
    return null
  })
}

function belegteKanaele(
  liste: readonly BestueckungsEintrag[],
  geraet: BestueckungsEintrag & { knxAktor: KnxAktorDaten },
  ohne: ReadonlySet<string>,
): Set<number> {
  const belegt = new Set<number>()
  for (const e of liste) {
    if (e.kennzeichen !== geraet.kennzeichen || !e.kanal || ohne.has(e.id)) continue
    const i = knxKanalIndexAusName(e.kanal)
    if (i === null) continue
    belegt.add(i)
    if (knxPaarBeginn(geraet.knxAktor, i) === i) belegt.add(i + 1)
  }
  return belegt
}

function mitFunktion(
  daten: KnxAktorDaten,
  index: number,
  funktion: KnxKanalFunktion,
): KnxAktorDaten {
  return setzeKnxKanalFunktion(daten, index, funktion)
}

export function planeKnxZuordnung(
  eingabe: KnxZuordnungEingabe,
  optionen: KnxZuordnungOptionen = {},
): KnxZuordnungPlan {
  const { zeichnung, verteiler, katalog } = eingabe
  const liste = verteiler.verteiler?.bestueckung ?? []
  const baum = baueVerteilerBaum(verteiler, katalog, eingabe.plan)
  const ziele = ermittleKnxZiele(zeichnung, katalog)
  const zuordnungen = ermittleStromkreisZuordnungen(zeichnung, katalog).komponentenUnverdichtet
  const reserve = Math.max(0, optionen.reserveProzent ?? KNX_RESERVE_STANDARD)
  const hinweise: string[] = []

  const jeKlemme = new Map<string, { blattId: string; objekt: KomponentenObjekt }[]>()
  const direkt = new Set<string>()
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type !== 'komponente') continue
      for (const z of zuordnungen.get(o.id) ?? []) {
        if (z.verteilerId !== verteiler.id) continue
        direkt.add(z.knoten)
        if (!z.klemme) continue
        const vorhanden = jeKlemme.get(z.klemme) ?? []
        if (!vorhanden.some((v) => v.objekt.id === o.id))
          jeKlemme.set(z.klemme, [...vorhanden, { blattId: blatt.id, objekt: o }])
      }
    }
  }

  const zeilen: KnxKlemmenZeile[] = []
  for (const klemme of baum.knoten) {
    if (klemme.rolle !== 'klemme') continue
    const verbraucher = jeKlemme.get(klemme.schluessel) ?? []
    const knx = verbraucher.flatMap((v) => ziele.get(zielSchluessel(v.blattId, v.objekt.id)) ?? [])
    if (knx.length === 0) continue
    const zeilenHinweise: string[] = []
    const weg = ermittleStromweg(klemme)
    const kontakt = weg.kontakte[0] ?? null
    const arten = knx.map((z) => ({ z, ...knxKanalartVon(z.objekt, zeichnung) }))
    const moeglich = arten.filter((a) => a.kanalart !== null)
    const vorschlag = moeglich[0]?.kanalart ?? null
    const verschieden = [...new Set(moeglich.map((a) => a.kanalart!))]
    if (verschieden.length > 1)
      zeilenHinweise.push(
        t('generatoren.knxZuordnung.verschiedeneAnsteuerungen', {
          liste: verschieden.map((k) => KNX_KANALART_TEXT[k]).join(', '),
          vorschlag: KNX_KANALART_TEXT[vorschlag!],
        }),
      )
    for (const a of arten) {
      if (a.kanalart === null && a.ansteuerung)
        zeilenHinweise.push(
          t('generatoren.knxZuordnung.nichtUeberAktor', {
            name: komponentenBezeichnung(a.z.objekt, katalog),
            ansteuerung: ansteuerungBezeichnung(a.ansteuerung),
          }),
        )
    }
    const andere = verbraucher.filter((v) => {
      if (ziele.has(zielSchluessel(v.blattId, v.objekt.id))) return false
      const typ = ermittleTypUndSlots(v.objekt, zeichnung)?.typ
      return typ === 'verbraucher' || typ === 'anschlussdose'
    })
    const andereText = geraeteZusammenfassung(andere.map((v) => verbraucherName(v.objekt, katalog)))
    if (andereText)
      zeilenHinweise.push(t('generatoren.knxZuordnung.verbraucherOhneKnx', { liste: andereText }))
    const gewaehlt = optionen.kanalart?.has(klemme.eintrag.id)
      ? (optionen.kanalart.get(klemme.eintrag.id) ?? null)
      : vorschlag
    let kanalart = kontakt ? null : gewaehlt
    if (!kontakt && gewaehlt && !weg.stromkreis) {
      zeilenHinweise.push(t('generatoren.knxZuordnung.keinSchutzorgan'))
      kanalart = null
    }
    let klemmeTauschen = false
    if (kanalart && istPaar(kanalart)) {
      const namen = anschlussNamen(
        katalog.find((k) => k.id === klemme.eintrag.catalogComponentId)?.dockpunkte,
      )
      if (!namen.includes('L1') || !namen.includes('L2')) {
        if (
          klemme.eintrag.catalogComponentId === KLEMME_1P_N_PE &&
          katalog.some((k) => k.id === KLEMME_3P_N_PE)
        ) {
          klemmeTauschen = true
          zeilenHinweise.push(t('generatoren.knxZuordnung.klemmeGetauscht'))
        } else zeilenHinweise.push(t('generatoren.knxZuordnung.keineZweiAussenleiter'))
      }
    }
    const gruppe = knx
      .map((z) => z.objekt.gruppeId)
      .map((id) => zeichnung.geraeteGruppen.find((g) => g.id === id)?.name?.trim())
      .find(Boolean)
    const beschriftungVorschlag =
      gruppe ||
      klemme.eintrag.bezeichnung?.trim() ||
      knx[0].objekt.beschriftung?.trim() ||
      nameAusRaum(zeichnung, knx[0].blattId, knx[0].objekt)
    const kanalEintragId = kontakt?.geraet.knxAktor ? kontakt.eintrag.id : null
    const eigene = optionen.beschriftung?.get(klemme.eintrag.id)
    const beschriftung =
      eigene ??
      (kontakt
        ? kontakt.geraet.knxAktor
          ? (kontakt.eintrag.bezeichnung ?? '')
          : ''
        : beschriftungVorschlag)
    zeilen.push({
      klemme,
      ziele: knx,
      andere: andereText,
      vorschlag,
      kanalart,
      vorhanden: kontakt?.schluessel ?? null,
      ergebnis: kontakt?.schluessel ?? null,
      klemmeTauschen,
      beschriftung,
      beschriftungVorschlag,
      kanalEintragId,
      hinweise: zeilenHinweise,
    })
  }

  const knxGeraete = liste.filter(
    (e): e is BestueckungsEintrag & { knxAktor: KnxAktorDaten } => !!e.knxAktor && !e.kanal,
  )
  const knxKennzeichen = new Set(knxGeraete.map((g) => g.kennzeichen))
  const gebrauchteKlemmen = new Set(zeilen.map((z) => z.klemme.eintrag.id))
  const freigeben: KnxFreigabe[] = []
  for (const e of liste) {
    if (!e.kanal || !knxKennzeichen.has(e.kennzeichen)) continue
    const schluessel = `${e.kennzeichen}:${e.kanal}`
    const darunter = nachfahren(liste, e.id)
    if (direkt.has(schluessel) || [...darunter].some((id) => gebrauchteKlemmen.has(id))) continue
    freigeben.push({ eintragId: e.id, schluessel })
  }
  const frei = new Set(
    freigeben
      .map((f) => f.eintragId)
      .filter((id) => !optionen.freigeben || optionen.freigeben.has(id)),
  )

  const stand = knxGeraete.map((g) => {
    let daten = g.knxAktor
    for (const e of liste) {
      if (!frei.has(e.id) || e.kennzeichen !== g.kennzeichen) continue
      const i = knxKanalIndexAusName(e.kanal ?? '')
      if (i === null) continue
      const paar = knxPaarBeginn(daten, i) === i
      daten = mitFunktion(daten, i, 'frei')
      if (paar) daten = mitFunktion(daten, i + 1, 'frei')
    }
    return {
      kennzeichen: g.kennzeichen,
      daten,
      neu: false,
      belegt: belegteKanaele(liste, g, frei),
      dazu: 0,
    }
  })

  const zuweisungen: KnxZuordnungPlan['zuweisungen'] = []
  const offen = new Map<KnxAktorArt, KnxKlemmenZeile[]>()
  for (const zeile of zeilen) {
    if (!zeile.kanalart || zeile.vorhanden) continue
    const art = knxArtFuerKanalart(zeile.kanalart)
    const breite = istPaar(zeile.kanalart) ? 2 : 1
    const treffer = stand
      .filter((g) => g.daten.art === art)
      .map((g) => ({ g, i: packe([breite], new Set(g.belegt), g.daten.baugroesse)[0] }))
      .find((t) => t.i !== null)
    if (treffer) {
      const { g, i } = treffer
      g.belegt.add(i!)
      if (breite === 2) g.belegt.add(i! + 1)
      g.daten = mitFunktion(g.daten, i!, FUNKTION[zeile.kanalart])
      g.dazu += breite
      zuweisungen.push({
        klemmeEintragId: zeile.klemme.eintrag.id,
        kennzeichen: g.kennzeichen,
        kanal: i!,
      })
      zeile.ergebnis = ergebnisText(g.kennzeichen, i!, breite)
      continue
    }
    offen.set(art, [...(offen.get(art) ?? []), zeile])
  }

  const neueGeraete: KnxZuordnungPlan['neueGeraete'] = []
  const belegteKennzeichen = [
    ...liste.map((e) => e.kennzeichen),
    ...baum.betriebsmittel.map((b) => b.kennzeichen),
  ]
  for (const art of ['schalt-jalousie', 'dimm'] as const) {
    const rest = offen.get(art) ?? []
    if (rest.length === 0) continue
    if (eingabe.plan) {
      hinweise.push(t('generatoren.knxZuordnung.kanalFehlt', { n: rest.length }))
      continue
    }
    const breiten = rest.map((z) => (istPaar(z.kanalart!) ? 2 : 1))
    const lage = packe(breiten, new Set())
    const bedarf = Math.max(...lage.map((i, n) => i! + breiten[n]))
    const groessen = knxBaugroessenFuer(art, Math.ceil((bedarf * (100 + reserve)) / 100))
    const geraete = groessen.map((groesse) => {
      const kennzeichen = naechstesBestueckungsKennzeichen(belegteKennzeichen, 'K')
      belegteKennzeichen.push(kennzeichen)
      const leer = neueKnxAktorDaten(art, groesse)
      return {
        kennzeichen,
        daten: {
          ...leer,
          kanaele: leer.kanaele.map((): KnxAktorDaten['kanaele'][number] => ({ funktion: 'frei' })),
        } as KnxAktorDaten,
        neu: true,
        belegt: new Set<number>(),
        dazu: 0,
      }
    })
    rest.forEach((zeile, n) => {
      let index = lage[n]!
      let g = 0
      while (index >= geraete[g].daten.baugroesse) {
        index -= geraete[g].daten.baugroesse
        g++
      }
      const geraet = geraete[g]
      geraet.belegt.add(index)
      if (breiten[n] === 2) geraet.belegt.add(index + 1)
      geraet.daten = mitFunktion(geraet.daten, index, FUNKTION[zeile.kanalart!])
      geraet.dazu += breiten[n]
      zuweisungen.push({
        klemmeEintragId: zeile.klemme.eintrag.id,
        kennzeichen: geraet.kennzeichen,
        kanal: index,
      })
      zeile.ergebnis = ergebnisText(geraet.kennzeichen, index, breiten[n])
    })
    for (const g of geraete) neueGeraete.push({ kennzeichen: g.kennzeichen, daten: g.daten })
    stand.push(...geraete)
  }

  const umbenennen = zeilen.flatMap((z) => {
    const knoten = z.kanalEintragId ? liste.find((e) => e.id === z.kanalEintragId) : undefined
    const neu = z.beschriftung.trim()
    return knoten && neu !== (knoten.bezeichnung?.trim() ?? '')
      ? [{ eintragId: knoten.id, bezeichnung: neu }]
      : []
  })

  return {
    zeilen,
    geraete: stand
      .filter(
        (g) =>
          g.neu ||
          g.dazu > 0 ||
          g.daten !== knxGeraete.find((k) => k.kennzeichen === g.kennzeichen)?.knxAktor,
      )
      .map((g) => ({
        kennzeichen: g.kennzeichen,
        daten: normalisiereKnxAktor(g.daten),
        neu: g.neu,
        belegt: g.belegt.size,
        dazu: g.dazu,
      })),
    freigeben,
    hinweise,
    zuweisungen,
    neueGeraete,
    umbenennen,
  }
}

function ergebnisText(kennzeichen: string, index: number, breite: number): string {
  return breite === 2
    ? `${kennzeichen}:${knxKanalName(index)}/${knxKanalName(index + 1)}`
    : `${kennzeichen}:${knxKanalName(index)}`
}

export function wendeKnxZuordnungAn(
  liste: readonly BestueckungsEintrag[],
  plan: KnxZuordnungPlan,
  freigeben?: ReadonlySet<string>,
): BestueckungsEintrag[] {
  const weg = new Set(
    plan.freigeben.map((f) => f.eintragId).filter((id) => !freigeben || freigeben.has(id)),
  )
  let neu = weg.size > 0 ? bestueckungEntfernen(liste, weg, false).liste : [...liste]
  const daten = new Map(plan.geraete.map((g) => [g.kennzeichen, g.daten]))
  neu = neu.map((e) =>
    !e.kanal && e.knxAktor && daten.has(e.kennzeichen)
      ? { ...e, knxAktor: daten.get(e.kennzeichen)! }
      : e,
  )
  const namen = new Map(plan.umbenennen.map((u) => [u.eintragId, u.bezeichnung]))
  neu = neu.map((e) => {
    if (!namen.has(e.id)) return e
    const { bezeichnung: _alt, ...ohne } = e
    void _alt
    const name = namen.get(e.id)!
    return name ? { ...ohne, bezeichnung: name } : ohne
  })
  for (const g of plan.neueGeraete) {
    neu.push({
      id: erzeugeId('bestueckung'),
      catalogComponentId: knxAktorKatalogId(g.daten.art),
      kennzeichen: g.kennzeichen,
      mitKanaelen: true,
      knxAktor: daten.get(g.kennzeichen) ?? g.daten,
    })
  }
  const zeileVon = new Map(plan.zeilen.map((z) => [z.klemme.eintrag.id, z]))
  for (const z of plan.zuweisungen) {
    const eltern = wirksameEltern(neu)
    const index = neu.findIndex((e) => e.id === z.klemmeEintragId)
    if (index < 0) continue
    const klemme = neu[index]
    const zeile = zeileVon.get(klemme.id)
    const geraet = neu.find((e) => e.kennzeichen === z.kennzeichen && !e.kanal)
    const elternId = eltern.get(klemme.id) ?? undefined
    const kanal: BestueckungsEintrag = {
      id: erzeugeId('bestueckung'),
      catalogComponentId: geraet?.catalogComponentId ?? knxAktorKatalogId('schalt-jalousie'),
      kennzeichen: z.kennzeichen,
      kanal: knxKanalName(z.kanal),
      ...(elternId ? { elternId } : {}),
      ...(zeile?.beschriftung.trim() ? { bezeichnung: zeile.beschriftung.trim() } : {}),
    }
    const umgehaengt: BestueckungsEintrag = {
      ...klemme,
      elternId: kanal.id,
      ...(zeile?.klemmeTauschen ? { catalogComponentId: KLEMME_3P_N_PE } : {}),
    }
    neu = [...neu.slice(0, index), kanal, umgehaengt, ...neu.slice(index + 1)]
  }
  return neu
}

export function ermittleKnxBeschriftungen(
  plan: Zeichnung,
  bauplaene: readonly Zeichnung[],
): Map<string, (string | undefined)[]> {
  const ergebnis = new Map<string, (string | undefined)[]>()
  const kennzeichen = plan.verteilerKennzeichen
  if (!kennzeichen) return ergebnis
  const verteiler = bauplaene
    .flatMap((z) => alleVerteiler(z))
    .find((v) => v.verteiler.verteiler?.kennzeichen === kennzeichen)
  const liste = verteiler?.verteiler.verteiler?.bestueckung ?? []
  if (liste.length === 0) return ergebnis
  for (const blatt of plan.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type !== 'komponente' || !o.knxAktor || !o.geraeteKennzeichen) continue
      const texte = o.knxAktor.kanaele.map(
        (_, i) =>
          liste
            .find((e) => e.kennzeichen === o.geraeteKennzeichen && e.kanal === knxKanalName(i))
            ?.bezeichnung?.trim() || undefined,
      )
      if (texte.some(Boolean)) ergebnis.set(o.id, texte)
    }
  }
  return ergebnis
}
