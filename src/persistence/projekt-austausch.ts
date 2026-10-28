import { isTauri } from '@tauri-apps/api/core'
import { API_BASIS, holeJson, sendeDatei, sendeJson } from './api-client'
import { speichereDatei } from './datei-speichern'
import { t } from '../sprache'
import type { MusterArt } from './musterprojekte'

export type Konfliktbehandlung = 'ersetzen' | 'kopie'

export interface ImportErgebnis {
  projektId: string
  bezeichnung: string
  dokumente: number
  staende: number
  assetsNeu: number
  ersetzt: boolean
}

export function ladeProjektPaketHoch(
  datei: Blob,
  konflikt?: Konfliktbehandlung,
): Promise<ImportErgebnis> {
  const abfrage = konflikt ? `?konflikt=${konflikt}` : ''
  return sendeDatei<ImportErgebnis>(`/import/projekt${abfrage}`, datei, 'application/zip')
}

export async function legeMusterprojekteBeimErstenStartAn(): Promise<ImportErgebnis[]> {
  const antwort = await sendeJson<{ angelegt: ImportErgebnis[] }>(
    'POST',
    '/musterprojekte/erster-start',
    {},
  )
  return antwort.angelegt
}

export function legeMusterprojektAn(muster: MusterArt): Promise<ImportErgebnis> {
  return sendeJson<ImportErgebnis>('POST', `/musterprojekte/${muster}`, {})
}

export interface ProjektExportPruefung {
  groesse: number
  groesseMax: number
  erlaubt: boolean
  meldung: string | null
}

export function pruefeProjektExport(projektId: string): Promise<ProjektExportPruefung> {
  return holeJson<ProjektExportPruefung>(`/export/projekt/${projektId}/pruefung`)
}

function dateinameAusContentDisposition(header: string | null): string | null {
  if (!header) return null
  const codiert = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (codiert) return decodeURIComponent(codiert[1])
  const einfach = /filename="?([^";]+)"?/i.exec(header)
  return einfach ? einfach[1] : null
}

export async function starteServerDownload(pfad: string): Promise<boolean> {
  if (isTauri()) {
    const antwort = await fetch(`${API_BASIS}${pfad}`)
    if (!antwort.ok)
      throw new Error(
        t('persistenz.projektAustausch.downloadFehlgeschlagen', { status: String(antwort.status) }),
      )
    const dateiname = dateinameAusContentDisposition(antwort.headers.get('content-disposition'))
    const blob = await antwort.blob()
    return speichereDatei(blob, dateiname ?? t('persistenz.projektAustausch.exportDateiname'), {
      beschreibung: t('persistenz.projektAustausch.archiv'),
      erweiterungen: ['zip'],
    })
  }
  const link = document.createElement('a')
  link.href = `${API_BASIS}${pfad}`
  link.download = ''
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  return true
}

export function waehleDatei(accept: string): Promise<File | null> {
  return new Promise((fertig) => {
    const eingabe = document.createElement('input')
    eingabe.type = 'file'
    eingabe.accept = accept
    eingabe.style.display = 'none'
    eingabe.addEventListener('change', () => {
      const datei = eingabe.files?.[0] ?? null
      document.body.removeChild(eingabe)
      fertig(datei)
    })
    document.body.appendChild(eingabe)
    eingabe.click()
  })
}

export function waehleProjektPaket(): Promise<File | null> {
  return waehleDatei('.eecproj,.zip,application/zip')
}

export interface KatalogImportErgebnis {
  katalogId: string
  name: string
  komponenten: number
  assetsNeu: number
  ersetzt: boolean
  alsKopie: boolean
  standard?: StandardkatalogZahlen
}

export interface StandardkatalogZahlen {
  katalogNeu: boolean
  neu: number
  aktualisiert: number
  unveraendert: number
  ausgemustert: number
  uebersprungen: number
  zurueckgezogen: boolean
}

export type KatalogImportVorschau =
  | ({ art: 'standard'; katalogId: string; name: string } & StandardkatalogZahlen)
  | { art: 'benutzer'; katalogId: string; name: string }

export function vorschauKatalogPaket(datei: Blob): Promise<KatalogImportVorschau> {
  return sendeDatei<KatalogImportVorschau>('/import/katalog/vorschau', datei, 'application/zip')
}

export function ladeKatalogPaketHoch(
  datei: Blob,
  konflikt?: Konfliktbehandlung,
): Promise<KatalogImportErgebnis> {
  const abfrage = konflikt ? `?konflikt=${konflikt}` : ''
  return sendeDatei<KatalogImportErgebnis>(`/import/katalog${abfrage}`, datei, 'application/zip')
}

export function waehleKatalogPaket(): Promise<File | null> {
  return waehleDatei('.eeckat,.zip,application/zip')
}
