import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const WURZEL = join(import.meta.dirname, '..')
const CLI = join(WURZEL, 'node_modules', '@tauri-apps', 'cli', 'tauri.js')

const ergebnis = spawnSync(process.execPath, [CLI, ...process.argv.slice(2)], {
  cwd: WURZEL,
  stdio: 'inherit',
  env: {
    ...process.env,
    TAURI_APP_PATH: join(WURZEL, 'src-tauri'),
    TAURI_FRONTEND_PATH: WURZEL,
  },
})
if (ergebnis.error) {
  console.error(`tauri-bauen: ${ergebnis.error.message}`)
  process.exit(1)
}
process.exit(ergebnis.status ?? 1)
