import type { KiListenArt, Spaltendefinition, TabellenRohdaten } from '../../document-model'
import {
  AKTORKANALLISTE_SPALTEN,
  BETRIEBSMITTELLISTEN_SPALTEN,
  LEITUNGSLISTEN_SPALTEN,
  POTENTIALLISTEN_SPALTEN,
  RAUMLISTEN_SPALTEN,
  STEUERUNGSLOGIK_SPALTEN,
  STROMKREISVERZEICHNIS_SPALTEN,
  STUECKLISTEN_SPALTEN,
  TRUNKLISTEN_SPALTEN,
  aktorkanallisteRohdaten,
  alleGeraetePortRohdaten,
  betriebsmittellistenRohdaten,
  geraetePortSpalten,
  leitungslistenRohdaten,
  planUebersetzer,
  potentiallistenRohdaten,
  raumlistenRohdaten,
  spaltenKoepfe,
  steuerungslogikRohdaten,
  stromkreisverzeichnisRohdaten,
  stuecklistenRohdaten,
  trunklistenRohdaten,
} from '../../document-model'
import type { KiErgebnis, KiKontext } from './kontext'
import { waehleBlatt } from './kontext'

export interface ListeLesenEingabe {
  art: KiListenArt
  umfang?: 'projekt' | 'blatt'
  blattId?: string
  verteiler?: string
}

function kennzeichen(text: string | undefined): string | null {
  const bereinigt = text?.trim().replace(/^\+/, '')
  return bereinigt ? bereinigt : null
}

export function listeLesen(eingabe: ListeLesenEingabe, kontext: KiKontext): KiErgebnis {
  const zeichnung = kontext.doc.getZeichnung()
  const tp = planUebersetzer(zeichnung)
  const koepfe = (spalten: readonly Spaltendefinition[]) => spaltenKoepfe(spalten, tp)
  const katalog = kontext.katalogKomponenten()
  const { bauplaene, verteilerplaene } = kontext.verknuepfteZeichnungen()
  const umfang = eingabe.umfang ?? 'projekt'
  const blattId = umfang === 'blatt' ? waehleBlatt(kontext, eingabe.blattId).id : ''

  let spalten: string[]
  let daten: TabellenRohdaten
  switch (eingabe.art) {
    case 'stueckliste':
      daten = stuecklistenRohdaten(zeichnung, blattId, umfang, katalog)
      spalten = koepfe(daten.spalten ?? STUECKLISTEN_SPALTEN)
      break
    case 'leitungsliste':
      daten = leitungslistenRohdaten(zeichnung, blattId, umfang, katalog, true, verteilerplaene)
      spalten = koepfe(daten.spalten ?? LEITUNGSLISTEN_SPALTEN)
      break
    case 'trunkliste':
      daten = trunklistenRohdaten(zeichnung, blattId, umfang)
      spalten = koepfe(TRUNKLISTEN_SPALTEN)
      break
    case 'raumliste':
      daten = raumlistenRohdaten(zeichnung, blattId, umfang)
      spalten = koepfe(RAUMLISTEN_SPALTEN)
      break
    case 'switchports':
      daten = alleGeraetePortRohdaten(zeichnung, katalog, 'switch')
      spalten = geraetePortSpalten('switch', tp)
      break
    case 'patchfelder':
      daten = alleGeraetePortRohdaten(zeichnung, katalog, 'patchpanel')
      spalten = geraetePortSpalten('patchpanel', tp)
      break
    case 'steuerungslogik':
      daten = steuerungslogikRohdaten(zeichnung, blattId, umfang, katalog)
      spalten = koepfe(STEUERUNGSLOGIK_SPALTEN)
      break
    case 'betriebsmittelliste':
      daten = betriebsmittellistenRohdaten(zeichnung, katalog, blattId, umfang, bauplaene)
      spalten = koepfe(daten.spalten ?? BETRIEBSMITTELLISTEN_SPALTEN)
      break
    case 'potentialliste':
      daten = potentiallistenRohdaten(zeichnung, blattId, umfang)
      spalten = koepfe(POTENTIALLISTEN_SPALTEN)
      break
    case 'stromkreisverzeichnis':
      daten = stromkreisverzeichnisRohdaten(
        zeichnung,
        katalog,
        kennzeichen(eingabe.verteiler),
        bauplaene,
        verteilerplaene,
      )
      spalten = koepfe(STROMKREISVERZEICHNIS_SPALTEN)
      break
    case 'aktorkanalliste':
      daten = aktorkanallisteRohdaten(
        zeichnung,
        katalog,
        kennzeichen(eingabe.verteiler),
        bauplaene,
        verteilerplaene,
      )
      spalten = koepfe(AKTORKANALLISTE_SPALTEN)
      break
  }
  return {
    daten: {
      liste: eingabe.art,
      umfang,
      ...('verteilerKennzeichen' in daten && daten.verteilerKennzeichen
        ? { verteiler: daten.verteilerKennzeichen }
        : {}),
      spalten,
      zeilen: daten.zeilen,
      ...(daten.summe.some((z) => z !== '') ? { summe: daten.summe } : {}),
      ...(daten.slotGrafik ? { slotMatrix: daten.slotGrafik } : {}),
    },
  }
}
