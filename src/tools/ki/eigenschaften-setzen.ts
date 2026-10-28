import type {
  Blatt,
  KomponentenObjekt,
  Objekt,
  RaumartId,
  StromkreisPolzahl,
  StromkreisWert,
  Zeichnung,
} from '../../document-model'
import {
  belegteKlemmenNummern,
  istKlemme,
  istKlemmenKennzeichen,
  istVariablerText,
  kennzeichenTraeger,
  klemmeNummeriert,
  naechsteKlemmenNummer,
  planUebersetzer,
  raumNameNachRaumartWechsel,
  setzeVariablenWert,
  setzeVerlegung,
  slotAenderungFuerWert,
  teiltKennzeichenOhneRueckfrage,
} from '../../document-model'
import { t } from '../../sprache'
import type { Command } from '../command'
import {
  erzeugeKabeltypAendernCommand,
  erzeugeKnxAendernCommand,
  erzeugeObjektAendernCommand,
  erzeugeTrunkEigenschaftenSyncCommand,
} from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler } from './kontext'
import { blattText, fuehreAenderungAus, kiLabel, ordneObjekteNachBlatt } from './schreiben'

export interface EigenschaftenWerte {
  beschriftung?: string
  installationshoeheM?: number | null
  montageort?: 'wand' | 'decke' | 'boden'
  verlegung?: 'AP' | 'UP'
  stromkreis?: 'vorgabe' | 'kein' | 'raum' | 'eigen' | number
  stromkreisPolzahl?: 1 | 3 | null
  knx?: boolean
  variableTexte?: Record<string, string>
  kennzeichen?: string
  kabeltyp?: string
  beschreibung?: string
  name?: string
  raumart?: RaumartId
}

type Feld = keyof EigenschaftenWerte

function feldText(feld: Feld): string {
  return t(`kiMeldungen.eigenschaftenSetzen.felder.${feld}`)
}

const FELDER_JE_TYP: Partial<Record<Objekt['type'], readonly Feld[]>> = {
  komponente: [
    'beschriftung',
    'installationshoeheM',
    'montageort',
    'verlegung',
    'stromkreis',
    'stromkreisPolzahl',
    'knx',
    'variableTexte',
    'kennzeichen',
  ],
  leitung: ['kabeltyp', 'beschreibung'],
  trunk: ['name', 'beschreibung'],
  raum: ['name', 'raumart'],
}

function passendeFelder(o: Objekt, genannt: readonly Feld[]): Feld[] {
  const erlaubt = FELDER_JE_TYP[o.type] ?? []
  return genannt.filter((f) => erlaubt.includes(f))
}

function mitKennzeichen(
  zeichnung: Zeichnung,
  o: KomponentenObjekt,
  eingabe: string,
): KomponentenObjekt {
  const kennzeichen = eingabe.trim()
  if (istKlemmenKennzeichen(kennzeichen) && (istKlemme(o) || !o.geraeteKennzeichen)) {
    if (kennzeichen === o.geraeteKennzeichen?.trim()) return o
    const belegt = belegteKlemmenNummern(zeichnung, kennzeichen, new Set([o.id]))
    return klemmeNummeriert(o, kennzeichen, naechsteKlemmenNummer(belegt.keys()))
  }
  const andere = kennzeichen
    ? kennzeichenTraeger(zeichnung, kennzeichen).filter((a) => a.objekt.id !== o.id)
    : []
  if (
    andere.length > 0 &&
    !teiltKennzeichenOhneRueckfrage(
      o,
      andere.map((a) => a.objekt),
    )
  ) {
    throw new KiFehler(
      t('kiMeldungen.eigenschaftenSetzen.kennzeichenBelegt', {
        kennzeichen,
        n: andere.length,
        blaetter: [...new Set(andere.map((a) => a.blattName))].join(', '),
      }),
    )
  }
  return { ...o, geraeteKennzeichen: kennzeichen || undefined }
}

function mitVariablenTexten(
  o: KomponentenObjekt,
  texte: Record<string, string>,
  hinweise: Set<string>,
): KomponentenObjekt {
  let ergebnis = o
  for (const [feld, wert] of Object.entries(texte)) {
    if (!ergebnis.textElemente?.some((e) => istVariablerText(e) && e.variable === feld)) continue
    const aenderung =
      ergebnis.slotAnzahlAus === feld ? slotAenderungFuerWert(ergebnis, feld, wert) : null
    const slotsMit = aenderung !== null && aenderung.entfernteMitZielen.length === 0
    if (aenderung && !slotsMit) {
      hinweise.add(t('kiMeldungen.eigenschaftenSetzen.slotsNichtAngepasst', { feld }))
    }
    ergebnis = {
      ...ergebnis,
      textElemente: setzeVariablenWert(ergebnis.textElemente ?? [], feld, wert),
      ...(slotsMit && { slots: aenderung.slots }),
      ...(slotsMit && aenderung.slotMatrix && { slotMatrix: aenderung.slotMatrix }),
    }
  }
  return ergebnis
}

function komponenteGepatcht(
  zeichnung: Zeichnung,
  o: KomponentenObjekt,
  werte: EigenschaftenWerte,
  hinweise: Set<string>,
): KomponentenObjekt {
  let k: KomponentenObjekt = { ...o }
  if (werte.beschriftung !== undefined) k.beschriftung = werte.beschriftung || undefined
  if (werte.installationshoeheM !== undefined) {
    k.installationshoehe = werte.installationshoeheM ?? undefined
  }
  if (werte.montageort !== undefined) {
    k.montageort = werte.montageort === 'wand' ? undefined : werte.montageort
  }
  if (werte.stromkreis !== undefined) {
    k.stromkreis = werte.stromkreis === 'vorgabe' ? undefined : (werte.stromkreis as StromkreisWert)
  }
  if (werte.stromkreisPolzahl !== undefined) {
    k.stromkreisPolzahl = (werte.stromkreisPolzahl ?? undefined) as StromkreisPolzahl | undefined
  }
  if (werte.variableTexte) k = mitVariablenTexten(k, werte.variableTexte, hinweise)
  if (werte.kennzeichen !== undefined) k = mitKennzeichen(zeichnung, k, werte.kennzeichen)
  return k
}

function kabeltypPatch(kontext: KiKontext, eingabe: string): { kabeltypId?: string; typ?: string } {
  const name = eingabe.trim()
  if (!name) return { kabeltypId: undefined, typ: undefined }
  const gesucht = name.toLowerCase()
  const typ = [...kontext.kabeltypen(), ...kontext.doc.getZeichnung().kabeltypen].find(
    (k) => k.bezeichnung.trim().toLowerCase() === gesucht,
  )
  return typ ? { kabeltypId: typ.id, typ: undefined } : { kabeltypId: undefined, typ: name }
}

export function eigenschaftenSetzen(
  eingabe: { objektIds: string[]; werte: EigenschaftenWerte },
  kontext: KiKontext,
): KiErgebnis {
  const { werte } = eingabe
  const genannt = (Object.keys(werte) as Feld[]).filter((f) => werte[f] !== undefined)
  if (werte.kennzeichen !== undefined && eingabe.objektIds.length !== 1) {
    throw new KiFehler(t('kiMeldungen.eigenschaftenSetzen.kennzeichenNurEine'))
  }
  const { jeBlatt, gesperrt } = ordneObjekteNachBlatt(kontext, eingabe.objektIds)
  const doc = kontext.doc
  const uebersprungen = gesperrt.map((id) => ({
    id,
    grund: t('kiMeldungen.gemeinsam.ebeneGesperrt'),
  }))
  const hinweise = new Set<string>()

  const betroffen: { blatt: Blatt; objekt: Objekt; felder: Feld[] }[] = []
  for (const { blatt, objekte } of jeBlatt.values()) {
    for (const objekt of objekte) {
      const felder = passendeFelder(objekt, genannt)
      if (felder.length === 0) {
        uebersprungen.push({
          id: objekt.id,
          grund: t('kiMeldungen.eigenschaftenSetzen.keinPassendesFeld', { typ: objekt.type }),
        })
        continue
      }
      if (objekt.type === 'komponente' && werte.kennzeichen !== undefined) {
        mitKennzeichen(doc.getZeichnung(), objekt, werte.kennzeichen)
      }
      betroffen.push({ blatt, objekt, felder })
    }
  }
  if (betroffen.length === 0) {
    throw new KiFehler(
      t('kiMeldungen.eigenschaftenSetzen.keinFeldPasst', { felder: genannt.join(', ') }),
    )
  }
  if (werte.variableTexte) {
    for (const feld of Object.keys(werte.variableTexte)) {
      const vorhanden = betroffen.some(
        ({ objekt }) =>
          objekt.type === 'komponente' &&
          objekt.textElemente?.some((e) => istVariablerText(e) && e.variable === feld),
      )
      if (!vorhanden) {
        hinweise.add(t('kiMeldungen.eigenschaftenSetzen.variablerTextFehlt', { feld }))
      }
    }
  }

  const ids = (filter: (o: Objekt) => boolean, blattId?: string) =>
    betroffen
      .filter((b) => (!blattId || b.blatt.id === blattId) && filter(b.objekt))
      .map((b) => b.objekt.id)
  const genutzt = [...new Set(betroffen.flatMap((b) => b.felder))]
  const text = t('kiMeldungen.eigenschaftenSetzen.geaendert', {
    felder: genutzt.map(feldText).join(', '),
    n: betroffen.length,
    blaetter: blattText(betroffen.map((b) => b.blatt)),
  })
  const label = kiLabel(text)

  const schritte: (() => Command | null)[] = []
  const einfach = (o: Objekt) =>
    o.type === 'raum' ||
    (o.type === 'leitung' && werte.beschreibung !== undefined) ||
    o.type === 'komponente'
  for (const { blatt } of jeBlatt.values()) {
    const blattIds = new Set(ids(einfach, blatt.id))
    if (blattIds.size === 0) continue
    const komponentenIds = new Set(ids((o) => o.type === 'komponente', blatt.id))
    schritte.push(() =>
      erzeugeObjektAendernCommand(doc, blatt.id, label, (objekte) => {
        const zeichnung = doc.getZeichnung()
        const neu = objekte.map((o): Objekt => {
          if (!blattIds.has(o.id)) return o
          if (o.type === 'komponente') return komponenteGepatcht(zeichnung, o, werte, hinweise)
          if (o.type === 'raum' && (werte.name !== undefined || werte.raumart !== undefined)) {
            const name =
              werte.name ??
              raumNameNachRaumartWechsel(
                o.name,
                o.raumart,
                werte.raumart,
                planUebersetzer(zeichnung),
              )
            return { ...o, name, raumart: werte.raumart ?? o.raumart }
          }
          if (o.type === 'leitung' && werte.beschreibung !== undefined) {
            return { ...o, beschreibung: werte.beschreibung || undefined }
          }
          return o
        })
        return werte.verlegung && komponentenIds.size > 0
          ? setzeVerlegung(neu, komponentenIds, werte.verlegung === 'UP' ? 'in' : 'auf')
          : neu
      }),
    )
  }
  if (werte.knx !== undefined) {
    for (const { blatt, objekt } of betroffen) {
      if (objekt.type !== 'komponente') continue
      schritte.push(() => erzeugeKnxAendernCommand(doc, blatt.id, objekt.id, werte.knx!))
    }
  }
  if (werte.name !== undefined || werte.beschreibung !== undefined) {
    for (const { blatt, objekt } of betroffen) {
      if (objekt.type !== 'trunk') continue
      const patch = {
        ...(werte.name !== undefined && { name: werte.name }),
        ...(werte.beschreibung !== undefined && { beschreibung: werte.beschreibung || undefined }),
      }
      schritte.push(() =>
        erzeugeTrunkEigenschaftenSyncCommand(doc, blatt.id, objekt.id, patch, label),
      )
    }
  }
  const leitungen = ids((o) => o.type === 'leitung')
  if (werte.kabeltyp !== undefined && leitungen.length > 0) {
    const patch = kabeltypPatch(kontext, werte.kabeltyp)
    schritte.push(() => erzeugeKabeltypAendernCommand(doc, leitungen, patch, label))
  }

  fuehreAenderungAus(kontext, text, schritte)
  if (werte.kabeltyp !== undefined && leitungen.length > 0) kontext.nachKabeltypAenderung()
  kontext.meldeAenderung(label)
  return {
    daten: {
      geaendert: betroffen.length,
      ...(uebersprungen.length > 0 ? { uebersprungen } : {}),
      ...(hinweise.size > 0 ? { hinweise: [...hinweise] } : {}),
      rueckgaengig: label,
    },
  }
}
