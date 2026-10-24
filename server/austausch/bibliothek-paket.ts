import { zipSync } from 'fflate'
import type { DatabaseSync } from 'node:sqlite'
import {
  BIBLIOTHEK_DATEI,
  BIBLIOTHEK_PAKET_VERSION,
  bibliothekKatalogDatei,
  type BibliothekPaketInhalt,
} from '../../src/document-model'
import { leseAlleKataloge, zaehleKomponentenJeKatalog } from '../db/kataloge'
import { gueltigesRegelwerk } from '../db/regelwerk'
import { packeKatalog } from './katalog-paket'

export function packeBibliothek(
  db: DatabaseSync,
  assetOrdner: string,
  ausTestversion = false,
): Uint8Array {
  const anzahl = zaehleKomponentenJeKatalog(db)
  const dateien: Record<string, Uint8Array> = {}
  const inhalt: BibliothekPaketInhalt = {
    paketVersion: BIBLIOTHEK_PAKET_VERSION,
    erzeugtAm: new Date().toISOString(),
    anwendung: 'el.easy.CAD',
    regelwerk: gueltigesRegelwerk(db),
    kataloge: [],
  }
  for (const katalog of leseAlleKataloge(db)) {
    const datei = bibliothekKatalogDatei(katalog.id)
    dateien[datei] = packeKatalog(db, assetOrdner, katalog, ausTestversion)
    inhalt.kataloge.push({
      id: katalog.id,
      name: katalog.name,
      herkunft: katalog.herkunft,
      komponenten: anzahl.get(katalog.id) ?? 0,
      datei,
    })
  }
  dateien[BIBLIOTHEK_DATEI] = new TextEncoder().encode(JSON.stringify(inhalt, null, 2))
  return zipSync(dateien, { level: 0, mtime: new Date() })
}

export function bibliothekDateiname(jetzt = new Date()): string {
  return `el.easy.CAD-Bibliothek-${jetzt.toISOString().slice(0, 10)}.eecbib`
}
