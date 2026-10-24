import { isTauri } from '@tauri-apps/api/core'
import { save as waehleTauriSpeicherort } from '@tauri-apps/plugin-dialog'
import { writeFile as schreibeTauriDatei } from '@tauri-apps/plugin-fs'

export interface DateiTypFilter {
  beschreibung: string
  erweiterungen: string[]
}

interface WindowMitFsApi {
  showSaveFilePicker?: (opts: {
    suggestedName?: string
    types?: { description: string; accept: Record<string, string[]> }[]
  }) => Promise<{
    createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>
  }>
}

function istAbbruch(fehler: unknown): boolean {
  return fehler instanceof DOMException && fehler.name === 'AbortError'
}

const UNZULAESSIGE_ZEICHEN = /[/\\:*?"<>|]/g

export function erzeugeDateiname(
  teile: (string | null | undefined)[],
  erweiterung: string,
): string {
  const bereinigt = teile
    .map((teil) => teil?.trim().replace(UNZULAESSIGE_ZEICHEN, '_'))
    .filter((teil): teil is string => Boolean(teil))
  return `${bereinigt.join('-')}.${erweiterung}`
}

export function loeseBlobDownloadAus(blob: Blob, dateiname: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = dateiname
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function speichereDatei(
  blob: Blob,
  vorschlagName: string,
  typ: DateiTypFilter,
): Promise<boolean> {
  if (isTauri()) {
    const ziel = await waehleTauriSpeicherort({
      defaultPath: vorschlagName,
      filters: [{ name: typ.beschreibung, extensions: typ.erweiterungen }],
    })
    if (!ziel) return false
    await schreibeTauriDatei(ziel, new Uint8Array(await blob.arrayBuffer()))
    return true
  }

  const fenster = window as unknown as WindowMitFsApi
  if (fenster.showSaveFilePicker) {
    try {
      const accept: Record<string, string[]> = {
        [blob.type || 'application/octet-stream']: typ.erweiterungen.map((e) => `.${e}`),
      }
      const handle = await fenster.showSaveFilePicker({
        suggestedName: vorschlagName,
        types: [{ description: typ.beschreibung, accept }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return true
    } catch (fehler) {
      if (istAbbruch(fehler)) return false
      throw fehler
    }
  }

  loeseBlobDownloadAus(blob, vorschlagName)
  return true
}
