import { loeseBlobDownloadAus } from './datei-speichern'
import { t } from '../sprache'

interface SaveFilePickerOptions {
  suggestedName?: string
  types?: { description: string; accept: Record<string, string[]> }[]
}
interface OpenFilePickerOptions {
  types?: { description: string; accept: Record<string, string[]> }[]
  multiple?: false
}
export interface ElEasyCadFileHandle {
  readonly name: string
  getFile(): Promise<File>
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>
  queryPermission?(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
  requestPermission?(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
}
type WindowMitFsApi = Window & {
  showSaveFilePicker?: (opts?: SaveFilePickerOptions) => Promise<ElEasyCadFileHandle>
  showOpenFilePicker?: (opts?: OpenFilePickerOptions) => Promise<ElEasyCadFileHandle[]>
}

function jsonTypen() {
  return [
    {
      description: t('persistenz.dateiAuswahl.zeichnung'),
      accept: { 'application/json': ['.json'] },
    },
  ]
}

export function istFileSystemAccessVerfuegbar(): boolean {
  return typeof (window as WindowMitFsApi).showSaveFilePicker === 'function'
}

export async function waehleSpeicherort(
  vorschlagName: string,
): Promise<ElEasyCadFileHandle | null> {
  const w = window as WindowMitFsApi
  if (!w.showSaveFilePicker) return null
  return w.showSaveFilePicker({ suggestedName: vorschlagName, types: jsonTypen() })
}

export async function waehleOeffnenDatei(): Promise<ElEasyCadFileHandle | null> {
  const w = window as WindowMitFsApi
  if (!w.showOpenFilePicker) return null
  const [handle] = await w.showOpenFilePicker({ types: jsonTypen() })
  return handle ?? null
}

export async function stelleSchreibrechtSicher(handle: ElEasyCadFileHandle): Promise<boolean> {
  if (!handle.queryPermission || !handle.requestPermission) return true
  const status = await handle.queryPermission({ mode: 'readwrite' })
  if (status === 'granted') return true
  const angefragt = await handle.requestPermission({ mode: 'readwrite' })
  return angefragt === 'granted'
}

export async function schreibeInHandle(handle: ElEasyCadFileHandle, text: string): Promise<void> {
  const writable = await handle.createWritable()
  await writable.write(text)
  await writable.close()
}

export async function liesAusHandle(handle: ElEasyCadFileHandle): Promise<string> {
  const file = await handle.getFile()
  return file.text()
}

export function loeseDownloadAus(text: string, dateiname: string): void {
  loeseBlobDownloadAus(new Blob([text], { type: 'application/json' }), dateiname)
}

export function oeffneUploadDialog(): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.style.display = 'none'
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      document.body.removeChild(input)
      if (!file) {
        resolve(null)
        return
      }
      file.text().then((text) => resolve({ name: file.name, text }))
    })
    document.body.appendChild(input)
    input.click()
  })
}
