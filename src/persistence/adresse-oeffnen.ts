import { invoke, isTauri } from '@tauri-apps/api/core'

export async function oeffneAdresse(url: string): Promise<void> {
  if (!isTauri()) {
    window.open(url, '_blank', 'noopener')
    return
  }
  await invoke('plugin:opener|open_url', { url })
}
