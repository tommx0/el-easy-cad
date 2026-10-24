import { unzipSync } from 'fflate'
import {
  BIBLIOTHEK_DATEI,
  BibliothekPaketFehler,
  type BibliothekPaketInhalt,
  type GeraeteRegelwerk,
  liesBibliothekInhalt,
} from '../document-model'
import { holeJson, sendeJson } from './api-client'
import { starteServerDownload, waehleDatei } from './projekt-austausch'
import { t } from '../sprache'

export function ladeRegelwerk(): Promise<GeraeteRegelwerk> {
  return holeJson<GeraeteRegelwerk>('/regelwerk')
}

export function bieteRegelwerkAn(
  regelwerk: GeraeteRegelwerk,
): Promise<{ regelwerk: GeraeteRegelwerk; uebernommen: boolean }> {
  return sendeJson('POST', '/regelwerk', regelwerk)
}

export function exportiereBibliothek(): Promise<boolean> {
  return starteServerDownload('/export/bibliothek')
}

export function waehleBibliothekPaket(): Promise<File | null> {
  return waehleDatei('.eecbib,.zip,application/zip')
}

export interface GeoeffnetesBibliothekPaket {
  inhalt: BibliothekPaketInhalt
  katalogPaket(datei: string): Blob
}

export async function oeffneBibliothekPaket(datei: Blob): Promise<GeoeffnetesBibliothekPaket> {
  let dateien: Record<string, Uint8Array>
  try {
    dateien = unzipSync(new Uint8Array(await datei.arrayBuffer()))
  } catch {
    throw new BibliothekPaketFehler(t('persistenz.bibliothek.nichtLesbar'))
  }
  const verzeichnis = dateien[BIBLIOTHEK_DATEI]
  if (!verzeichnis) {
    throw new BibliothekPaketFehler(
      t('persistenz.bibliothek.dateiFehlt', { datei: BIBLIOTHEK_DATEI }),
    )
  }
  const inhalt = liesBibliothekInhalt(new TextDecoder().decode(verzeichnis))
  for (const k of inhalt.kataloge)
    if (!dateien[k.datei])
      throw new BibliothekPaketFehler(t('persistenz.bibliothek.katalogFehlt', { name: k.name }))
  return {
    inhalt,
    katalogPaket: (pfad) => new Blob([dateien[pfad] as BlobPart], { type: 'application/zip' }),
  }
}
