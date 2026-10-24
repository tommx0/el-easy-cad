import { invoke, isTauri } from '@tauri-apps/api/core'
import { join, tempDir } from '@tauri-apps/api/path'
import { mkdir as legeTauriOrdnerAn, writeFile as schreibeTauriDatei } from '@tauri-apps/plugin-fs'
import { erzeugeDateiname, loeseBlobDownloadAus } from './datei-speichern'

export async function oeffneDateiExtern(
  blob: Blob,
  name: string,
  erweiterung: string,
): Promise<'geoeffnet' | 'heruntergeladen'> {
  const ohneEndung = name.replace(new RegExp(`\\.${erweiterung}$`, 'i'), '')
  const dateiname = erzeugeDateiname([ohneEndung], erweiterung)

  if (!isTauri()) {
    loeseBlobDownloadAus(blob, dateiname)
    return 'heruntergeladen'
  }

  const ordner = await join(await tempDir(), 'el-easy-cad-anlagen', String(Date.now()))
  await legeTauriOrdnerAn(ordner, { recursive: true })
  const pfad = await join(ordner, dateiname)
  await schreibeTauriDatei(pfad, new Uint8Array(await blob.arrayBuffer()))
  await invoke('plugin:opener|open_path', { path: pfad })
  return 'geoeffnet'
}
