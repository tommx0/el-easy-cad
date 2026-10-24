import type { Zeichnung } from './zeichnung'
import { t } from '../sprache'
import { parseZeichnungJson, ZeichnungsValidierungsFehler, type ZeichnungJson } from './schema'
import { standardLFormMasse } from './treppe'
import { EBENE_NAME_BAUELEMENTE, erzeugeStandardEbenen, standardEbeneFuerTyp } from './ebenen'
import { migriereLeitungenUndRaeume, synchronisiereEbenen } from './ebenen-synchron'
import { knotenAusAbzweigen } from './schaltverbindung-segmente'
import type { ObjektTyp } from './objekte'
import { erzeugeSchaltplanZeichenflaeche } from './zeichnungsart'
import { zerlegeWaendeInSegmente } from './wand-anschluss'
import { ohneVerwaisteTeilstueckZonen } from './teilstueck-zonen'
import { ordneWandstellen } from './wandstelle'
import { bestueckungAusVorgeschaltet, klemmenHinterSicherungEinordnen } from './bestueckung'
import { ermittleVerteilerZuweisungen } from './verteiler-belegung'

export const FORMAT_VERSION = 3 as const

export function zeichnungZuJson(zeichnung: Zeichnung): object {
  const mitUnbekanntem = zeichnung.blaetter.some((b) => b.hintergrund?.typ === 'unbekannt')
  const blaetter = (
    mitUnbekanntem
      ? zeichnung.blaetter.map((b) =>
          b.hintergrund?.typ === 'unbekannt' ? { ...b, hintergrund: b.hintergrund.roh } : b,
        )
      : zeichnung.blaetter
  )
    .map(ohneVerwaisteZonen)
    .map(ohneStandardSchalter)
  const json: ZeichnungJson | object = { ...zeichnung, blaetter, formatVersion: FORMAT_VERSION }
  return json
}

const NEUE_SCHALTER_STANDARD_AN = [
  'kennzeichenSichtbar',
  'abgaengeSichtbar',
  'stromkreisSichtbar',
  'stromkreisSchildSichtbar',
] as const

function ohneStandardSchalter<
  B extends Partial<Record<(typeof NEUE_SCHALTER_STANDARD_AN)[number], boolean>>,
>(blatt: B): B {
  if (NEUE_SCHALTER_STANDARD_AN.every((feld) => blatt[feld] === false)) return blatt
  const kopie: Partial<B> = { ...blatt }
  for (const feld of NEUE_SCHALTER_STANDARD_AN) if (kopie[feld] !== false) delete kopie[feld]
  return kopie as B
}

function ohneVerwaisteZonen<B extends { objekte: Zeichnung['blaetter'][number]['objekte'] }>(
  blatt: B,
): B {
  if (!blatt.objekte.some((o) => o.type === 'leitung' && o.teilstueckZonen?.length)) return blatt
  return {
    ...blatt,
    objekte: blatt.objekte.map((o) =>
      o.type === 'leitung' ? ohneVerwaisteTeilstueckZonen(o, blatt.objekte) : o,
    ),
  }
}

export function serialisiereZeichnung(zeichnung: Zeichnung): string {
  return JSON.stringify(zeichnungZuJson(zeichnung), null, 2)
}

function migriereRohdaten(daten: unknown): unknown {
  if (typeof daten !== 'object' || daten === null) return daten
  const projekt = daten as Record<string, unknown>
  if (projekt.formatVersion !== 1) return daten
  if (!Array.isArray(projekt.blaetter)) return daten

  const blaetter = projekt.blaetter.map((roh) => {
    if (typeof roh !== 'object' || roh === null) return roh
    const blatt = roh as Record<string, unknown>
    if (!Array.isArray(blatt.objekte)) return blatt
    const objekte = blatt.objekte.map((rohObjekt) => {
      if (typeof rohObjekt !== 'object' || rohObjekt === null) return rohObjekt
      const objekt = rohObjekt as Record<string, unknown>
      if (objekt.type !== 'leitung' || !Array.isArray(objekt.wegpunkte)) return objekt
      const { wegpunkte, ...rest } = objekt
      return { ...rest, pfadSegmente: [wegpunkte] }
    })
    return { ...blatt, objekte }
  })

  return { ...projekt, formatVersion: 2, blaetter }
}

const ALTE_LEITUNG_STANDARD_FARBE = '#000000'
const NEUE_LEITUNG_STANDARD_FARBE = '#E86A17'
const ALTE_TRUNK_STANDARD_FARBE = '#3a3a3a'
const NEUE_TRUNK_STANDARD_FARBE = '#C0392B'

function migriereStandardfarben(daten: unknown): unknown {
  if (typeof daten !== 'object' || daten === null) return daten
  const projekt = daten as Record<string, unknown>
  if (!Array.isArray(projekt.blaetter)) return daten

  const blaetter = projekt.blaetter.map((roh) => {
    if (typeof roh !== 'object' || roh === null) return roh
    const blatt = roh as Record<string, unknown>
    if (!Array.isArray(blatt.objekte)) return blatt
    const objekte = blatt.objekte.map((rohObjekt) => {
      if (typeof rohObjekt !== 'object' || rohObjekt === null) return rohObjekt
      const objekt = rohObjekt as Record<string, unknown>
      if (objekt.type === 'leitung' && objekt.farbe === ALTE_LEITUNG_STANDARD_FARBE) {
        return { ...objekt, farbe: NEUE_LEITUNG_STANDARD_FARBE }
      }
      if (objekt.type === 'trunk' && objekt.farbe === ALTE_TRUNK_STANDARD_FARBE) {
        return { ...objekt, farbe: NEUE_TRUNK_STANDARD_FARBE }
      }
      return objekt
    })
    return { ...blatt, objekte }
  })

  return { ...projekt, blaetter }
}

function migriereLeitungsnummern(daten: unknown): unknown {
  if (typeof daten !== 'object' || daten === null) return daten
  const projekt = daten as Record<string, unknown>
  if (!Array.isArray(projekt.blaetter)) return daten

  const belegt = new Set<number>()
  for (const roh of projekt.blaetter) {
    if (typeof roh !== 'object' || roh === null) continue
    const objekte = (roh as Record<string, unknown>).objekte
    if (!Array.isArray(objekte)) continue
    for (const rohObjekt of objekte) {
      if (typeof rohObjekt !== 'object' || rohObjekt === null) continue
      const objekt = rohObjekt as Record<string, unknown>
      if (objekt.type !== 'leitung') continue
      if (typeof objekt.nummer === 'number') {
        belegt.add(objekt.nummer)
        continue
      }
      const ersterDurchgang = Array.isArray(objekt.trunkDurchgaenge)
        ? (objekt.trunkDurchgaenge[0] as Record<string, unknown> | undefined)
        : undefined
      if (typeof ersterDurchgang?.nummer === 'number') belegt.add(ersterDurchgang.nummer)
    }
  }
  let naechste = 1
  const naechsteFreie = (): number => {
    while (belegt.has(naechste)) naechste++
    belegt.add(naechste)
    return naechste
  }

  const blaetter = projekt.blaetter.map((roh) => {
    if (typeof roh !== 'object' || roh === null) return roh
    const blatt = roh as Record<string, unknown>
    if (!Array.isArray(blatt.objekte)) return blatt
    const objekte = blatt.objekte.map((rohObjekt) => {
      if (typeof rohObjekt !== 'object' || rohObjekt === null) return rohObjekt
      const objekt = rohObjekt as Record<string, unknown>
      if (objekt.type !== 'leitung' || typeof objekt.nummer === 'number') return objekt
      const ersterDurchgang = Array.isArray(objekt.trunkDurchgaenge)
        ? (objekt.trunkDurchgaenge[0] as Record<string, unknown> | undefined)
        : undefined
      const nummer =
        typeof ersterDurchgang?.nummer === 'number' ? ersterDurchgang.nummer : naechsteFreie()
      return { ...objekt, nummer }
    })
    return { ...blatt, objekte }
  })

  return { ...projekt, blaetter }
}

function migriereLeitungsBezeichnungSichtbar(daten: unknown): unknown {
  if (typeof daten !== 'object' || daten === null) return daten
  const projekt = daten as Record<string, unknown>
  if (!Array.isArray(projekt.blaetter)) return daten

  const blaetter = projekt.blaetter.map((roh) => {
    if (typeof roh !== 'object' || roh === null) return roh
    const blatt = roh as Record<string, unknown>
    if (!Array.isArray(blatt.objekte)) return blatt
    const objekte = blatt.objekte.map((rohObjekt) => {
      if (typeof rohObjekt !== 'object' || rohObjekt === null) return rohObjekt
      const objekt = rohObjekt as Record<string, unknown>
      if (objekt.type !== 'leitung' || !('nummerAusgeblendet' in objekt)) return objekt
      const { nummerAusgeblendet, ...rest } = objekt
      return nummerAusgeblendet === true ? { ...rest, bezeichnungSichtbar: false } : rest
    })
    return { ...blatt, objekte }
  })

  return { ...projekt, blaetter }
}

function migriereTreppenLForm(daten: unknown): unknown {
  if (typeof daten !== 'object' || daten === null) return daten
  const projekt = daten as Record<string, unknown>
  if (!Array.isArray(projekt.blaetter)) return daten

  const blaetter = projekt.blaetter.map((roh) => {
    if (typeof roh !== 'object' || roh === null) return roh
    const blatt = roh as Record<string, unknown>
    if (!Array.isArray(blatt.objekte)) return blatt
    const objekte = blatt.objekte.map((rohObjekt) => {
      if (typeof rohObjekt !== 'object' || rohObjekt === null) return rohObjekt
      const objekt = rohObjekt as Record<string, unknown>
      if (
        objekt.type !== 'treppe' ||
        objekt.form !== 'l-kehre' ||
        typeof objekt.lFormLaufALaenge === 'number'
      ) {
        return objekt
      }
      const breite = typeof objekt.breite === 'number' ? objekt.breite : 0
      const hoehe = typeof objekt.hoehe === 'number' ? objekt.hoehe : 0
      return { ...objekt, ...standardLFormMasse(breite, hoehe) }
    })
    return { ...blatt, objekte }
  })

  return { ...projekt, blaetter }
}

function migriereEbenen(daten: unknown): unknown {
  if (typeof daten !== 'object' || daten === null) return daten
  const projekt = daten as Record<string, unknown>
  if (!Array.isArray(projekt.blaetter)) return daten

  const blaetter = projekt.blaetter.map((roh) => {
    if (typeof roh !== 'object' || roh === null) return roh
    const blatt = roh as Record<string, unknown>
    const ebenen = blatt.ebenen
    if (
      !Array.isArray(ebenen) ||
      ebenen.length !== 1 ||
      (ebenen[0] as Record<string, unknown> | undefined)?.name !== 'Standard'
    ) {
      return blatt
    }
    const neueEbenen = erzeugeStandardEbenen()
    const ebeneIdFuer = (name: string) => neueEbenen.find((e) => e.name === name)!.id
    const objekte = Array.isArray(blatt.objekte)
      ? blatt.objekte.map((rohObjekt) => {
          if (typeof rohObjekt !== 'object' || rohObjekt === null) return rohObjekt
          const objekt = rohObjekt as Record<string, unknown>
          if (typeof objekt.type !== 'string') return objekt
          return {
            ...objekt,
            ebeneId: ebeneIdFuer(standardEbeneFuerTyp(objekt.type as ObjektTyp)),
          }
        })
      : blatt.objekte
    return {
      ...blatt,
      ebenen: neueEbenen,
      aktiveEbeneId: ebeneIdFuer(EBENE_NAME_BAUELEMENTE),
      objekte,
    }
  })

  return { ...projekt, blaetter }
}

function migriereZeichnungsart(daten: unknown): unknown {
  if (typeof daten !== 'object' || daten === null) return daten
  const projekt = daten as Record<string, unknown>
  if (projekt.zeichnungsart !== undefined || !Array.isArray(projekt.blaetter)) return daten
  const alleStromlaufplan =
    projekt.blaetter.length > 0 &&
    projekt.blaetter.every(
      (b) =>
        typeof b === 'object' &&
        b !== null &&
        (b as Record<string, unknown>).blattart === 'stromlaufplan',
    )
  return alleStromlaufplan ? { ...projekt, zeichnungsart: 'schaltplan' } : daten
}

function mitFesterSchaltplanZeichenflaeche(zeichnung: Zeichnung): Zeichnung {
  if (zeichnung.zeichnungsart !== 'schaltplan') return zeichnung
  return {
    ...zeichnung,
    blaetter: zeichnung.blaetter.map((blatt) => ({
      ...blatt,
      zeichenflaeche: erzeugeSchaltplanZeichenflaeche(),
    })),
  }
}

function mitNachgefuehrtenWandstellen(zeichnung: Zeichnung): Zeichnung {
  let geaendert = false
  const blaetter = zeichnung.blaetter.map((blatt) => {
    const objekte = ordneWandstellen(blatt.objekte, zeichnung)
    if (objekte === blatt.objekte) return blatt
    geaendert = true
    return { ...blatt, objekte }
  })
  return geaendert ? { ...zeichnung, blaetter } : zeichnung
}

export function deserialisiereZeichnung(text: string): Zeichnung {
  let daten: unknown
  try {
    daten = JSON.parse(text)
  } catch {
    throw new ZeichnungsValidierungsFehler(t('modell.schema.keinJson'), [])
  }
  const json = parseZeichnungJson(
    migriereZeichnungsart(
      migriereEbenen(
        migriereTreppenLForm(
          migriereLeitungsBezeichnungSichtbar(
            migriereLeitungsnummern(migriereStandardfarben(migriereRohdaten(daten))),
          ),
        ),
      ),
    ),
  )
  const { formatVersion: _formatVersion, ...zeichnung } = json
  return mitBestueckungsBaum(
    mitNachgefuehrtenWandstellen(
      mitFesterSchaltplanZeichenflaeche(
        migriereLeitungenUndRaeume({
          ...zeichnung,
          blaetter: synchronisiereEbenen(zeichnung.blaetter).map((blatt) => {
            const objekte = knotenAusAbzweigen(zerlegeWaendeInSegmente(blatt.objekte))
            return objekte === blatt.objekte ? blatt : { ...blatt, objekte }
          }),
        }),
      ),
    ),
  )
}

function mitBestueckungsBaum(zeichnung: Zeichnung): Zeichnung {
  if (
    !zeichnung.blaetter.some((b) => b.objekte.some((o) => o.type === 'komponente' && o.verteiler))
  )
    return zeichnung
  let geaendert = false
  const blaetter = zeichnung.blaetter.map((blatt) => {
    let blattGeaendert = false
    const objekte = blatt.objekte.map((o) => {
      if (o.type !== 'komponente' || !o.verteiler) return o
      const roh = o.verteiler.bestueckung
      let liste = bestueckungAusVorgeschaltet(roh)
      if (!roh.some((e) => e.elternId)) {
        liste = klemmenHinterSicherungEinordnen(
          liste,
          ermittleVerteilerZuweisungen(zeichnung, o.id).map((z) => ({
            leitungsEnde: `${z.leitung.id}#${z.anschluss.ende}`,
            kennzeichen: z.anschluss.kennzeichen,
          })),
        )
      }
      if (liste === roh) return o
      blattGeaendert = true
      return { ...o, verteiler: { ...o.verteiler, bestueckung: liste } }
    })
    if (!blattGeaendert) return blatt
    geaendert = true
    return { ...blatt, objekte }
  })
  return geaendert ? { ...zeichnung, blaetter } : zeichnung
}
