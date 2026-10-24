import { invoke, isTauri } from '@tauri-apps/api/core'

export async function oeffneDruckdialog(papier: {
  breiteMm: number
  hoeheMm: number
}): Promise<void> {
  if (isTauri()) {
    await invoke('drucken', { breiteMm: papier.breiteMm, hoeheMm: papier.hoeheMm })
    return
  }
  window.print()
}
