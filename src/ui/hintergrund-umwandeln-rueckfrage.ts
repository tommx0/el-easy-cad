import {
  grundrissEbenenName,
  ifcGruppenEbenenName,
  type HintergrundHerkunft,
} from '../document-model'
import { t } from '../sprache'
import type { Uebersetzer } from '../sprache'

export type UmwandelnBlattInfo =
  | { name: string; aktiv: boolean; typ: HintergrundHerkunft; anzahl: number }
  | { name: string; aktiv: false; grund: string }

function verbleib(typ: HintergrundHerkunft, mehrere: boolean): string {
  return t(`aktionen.umwandeln.verbleib.${typ}.${mehrere ? 'mehrere' : 'einer'}`)
}

function ebenenSatz(typen: ReadonlySet<HintergrundHerkunft>, tp: Uebersetzer | undefined): string {
  const werte = { grundriss: grundrissEbenenName(tp), beispiel: ifcGruppenEbenenName('waende', tp) }
  if (!typen.has('ifc')) return t('aktionen.umwandeln.ebeneGrundriss', werte)
  if (typen.size === 1) return t('aktionen.umwandeln.ebeneGruppen', werte)
  return t('aktionen.umwandeln.ebeneBeide', werte)
}

export function umwandelnRueckfrage(
  blaetter: readonly UmwandelnBlattInfo[],
  tp?: Uebersetzer,
): {
  nachricht: string
  liste: string[]
} {
  const umwandelbar = blaetter.filter((b) => 'typ' in b)
  const aktiv = umwandelbar.find((b) => b.aktiv)
  if (!aktiv) throw new Error('Rueckfrage ohne umwandelbares aktives Blatt.')

  if (umwandelbar.length === 1) {
    return {
      nachricht: [
        t('aktionen.umwandeln.einBlatt', { anzahl: aktiv.anzahl }),
        ebenenSatz(new Set([aktiv.typ]), tp),
        verbleib(aktiv.typ, false),
      ].join(' '),
      liste: [],
    }
  }

  const jeTyp = new Map<HintergrundHerkunft, number>()
  for (const b of umwandelbar) jeTyp.set(b.typ, (jeTyp.get(b.typ) ?? 0) + 1)
  const summe = umwandelbar.reduce((s, b) => s + b.anzahl, 0)

  return {
    nachricht: [
      t('aktionen.umwandeln.mehrereBlaetter', {
        anzahl: aktiv.anzahl,
        blaetter: umwandelbar.length,
        summe,
      }),
      ebenenSatz(new Set(jeTyp.keys()), tp),
      ...[...jeTyp].map(([typ, n]) => verbleib(typ, n > 1)),
    ].join(' '),
    liste: blaetter.map((b) =>
      'typ' in b
        ? t(b.aktiv ? 'aktionen.umwandeln.zeileAktiv' : 'aktionen.umwandeln.zeile', {
            name: b.name,
            anzahl: b.anzahl,
          })
        : t('aktionen.umwandeln.zeileUebersprungen', { name: b.name, grund: b.grund }),
    ),
  }
}
