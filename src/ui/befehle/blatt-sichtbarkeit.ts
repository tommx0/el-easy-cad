import type { Blatt } from '../../document-model'
import { t } from '../../sprache'

export type BlattSichtbarkeitFeld = {
  [K in keyof Blatt]-?: Blatt[K] extends boolean
    ? K extends `${string}Sichtbar`
      ? K
      : never
    : never
}[keyof Blatt]

export interface BlattSichtbarkeitBefehl {
  id: string
  feld: Exclude<BlattSichtbarkeitFeld, 'hintergrundSichtbar'>
  readonly undoLabel: string
}

function sichtbarkeit(id: string, feld: BlattSichtbarkeitBefehl['feld']): BlattSichtbarkeitBefehl {
  return {
    id,
    feld,
    get undoLabel() {
      return t(`aktionen.blattSichtbarkeit.${feld}`)
    },
  }
}

export const BLATT_SICHTBARKEITEN: readonly BlattSichtbarkeitBefehl[] = [
  sichtbarkeit('blatt.anzeige-bezeichnung', 'bezeichnungSichtbar'),
  sichtbarkeit('blatt.anzeige-beschriftung', 'beschriftungSichtbar'),
  sichtbarkeit('blatt.anzeige-installationshoehe', 'installationshoeheSichtbar'),
  sichtbarkeit('blatt.anzeige-leitungsnummer', 'leitungBezeichnungSichtbar'),
  sichtbarkeit('blatt.anzeige-leitungstyp', 'leitungTypSichtbar'),
  sichtbarkeit('blatt.anzeige-leitungsbeschreibung', 'leitungBeschreibungSichtbar'),
  sichtbarkeit('blatt.anzeige-trunkname', 'trunkBezeichnungSichtbar'),
  sichtbarkeit('blatt.anzeige-trunkbeschreibung', 'trunkBeschreibungSichtbar'),
  sichtbarkeit('blatt.anzeige-raumname', 'raumNameSichtbar'),
  sichtbarkeit('blatt.anzeige-raumflaeche', 'raumFlaecheSichtbar'),
  sichtbarkeit('blatt.anzeige-potentialname', 'schaltverbindungBezeichnungSichtbar'),
  sichtbarkeit('blatt.anzeige-kennzeichen', 'kennzeichenSichtbar'),
  sichtbarkeit('blatt.anzeige-abgaenge', 'abgaengeSichtbar'),
  sichtbarkeit('blatt.anzeige-stromkreis', 'stromkreisSichtbar'),
  sichtbarkeit('blatt.anzeige-stromkreis-schild', 'stromkreisSchildSichtbar'),
]

export const WIRKVERBINDUNG_SICHTBARKEIT: BlattSichtbarkeitBefehl = sichtbarkeit(
  'blatt.anzeige-wirkverbindungen',
  'wirkverbindungSichtbar',
)

export const OBJEKT_SICHTBARKEITEN: readonly BlattSichtbarkeitBefehl[] = [
  sichtbarkeit('blatt.anzeige-leitungen', 'leitungenSichtbar'),
  sichtbarkeit('blatt.anzeige-trunks', 'trunksSichtbar'),
]

export const ALLE_BLATT_SICHTBARKEITEN: readonly BlattSichtbarkeitBefehl[] = [
  ...BLATT_SICHTBARKEITEN,
  WIRKVERBINDUNG_SICHTBARKEIT,
  ...OBJEKT_SICHTBARKEITEN,
]
