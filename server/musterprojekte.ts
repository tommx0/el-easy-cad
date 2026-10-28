import type { DatabaseSync } from 'node:sqlite'
import { zipSync } from 'fflate'
import { FORMAT_VERSION } from '../src/document-model'
import { MUSTER_ARTEN, type MusterArt } from '../src/persistence/musterprojekte'
import { musterprojekt, musterSprache } from '../src/persistence/musterprojekte-seed'
import type { Sprache } from '../src/sprache'
import { importiereProjektPaket, ImportKonflikt, type ImportErgebnis } from './austausch/import'
import { PAKET_VERSION, type PaketInhalt } from './austausch/paket'
import { eineZeile, jetzt } from './db/hilfen'

const MERKER = 'musterprojekte.angelegt'

export function musterprojektId(art: MusterArt, sprache: Sprache): string {
  return `projekt-muster-einfamilienhaus-${art}-${musterSprache(sprache)}`
}

function musterPaket(art: MusterArt, sprache: Sprache): Uint8Array {
  const daten = musterprojekt(art, sprache)
  const projektId = musterprojektId(art, sprache)
  const zeitpunkt = jetzt()
  const inhalt: PaketInhalt = {
    paketVersion: PAKET_VERSION,
    erzeugtAm: zeitpunkt,
    anwendung: 'el.easy.CAD',
    projekt: {
      id: projektId,
      kunde: daten.kunde,
      bezeichnung: daten.bezeichnung,
      projektnummer: null,
      notiz: daten.notiz,
      status: 'in_arbeit',
      archiviert: false,
      erstelltAm: zeitpunkt,
      zuletztGeaendertAm: zeitpunkt,
    },
    dokumente: [
      {
        meta: {
          id: projektId.replace(/^projekt-/, 'dokument-'),
          projektId,
          typ: 'zeichnung',
          name: daten.dokument,
          reihenfolge: 0,
          quelleDokumentId: null,
          erstelltAm: zeitpunkt,
          zuletztGeaendertAm: zeitpunkt,
        },
        inhalt: {
          formatVersion: FORMAT_VERSION,
          inhalt: JSON.stringify(daten.zeichnung),
          assetId: null,
        },
        staende: [],
      },
    ],
    assets: [],
  }
  return zipSync({ 'projekt.json': new TextEncoder().encode(JSON.stringify(inhalt)) })
}

export function legeMusterprojektAn(
  db: DatabaseSync,
  assetOrdner: string,
  art: MusterArt,
  sprache: Sprache,
): ImportErgebnis {
  const paket = musterPaket(art, sprache)
  try {
    return importiereProjektPaket(db, assetOrdner, paket)
  } catch (fehler) {
    if (fehler instanceof ImportKonflikt) {
      return importiereProjektPaket(db, assetOrdner, paket, 'kopie')
    }
    throw fehler
  }
}

export function legeMusterprojekteBeimErstenStartAn(
  db: DatabaseSync,
  assetOrdner: string,
  sprache: Sprache,
): ImportErgebnis[] {
  const gesetzt = eineZeile<{ wert: string }>(
    db.prepare('SELECT wert FROM einstellungen WHERE schluessel = ?'),
    MERKER,
  )
  if (gesetzt) return []
  const ergebnisse = MUSTER_ARTEN.map((art) => legeMusterprojektAn(db, assetOrdner, art, sprache))
  db.prepare('INSERT INTO einstellungen (schluessel, wert) VALUES (?, ?)').run(
    MERKER,
    JSON.stringify(jetzt()),
  )
  return ergebnisse
}
