import { chmodSync, cpSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { baueFrontendUndServerBundle } from './server-bundeln.mjs'
import { beschaffeMacNodeBinary, beschaffeWindowsNodeBinary } from './node-binary-beschaffen.mjs'

const NODE_VERSION = 'v24.20.0'

const SRC_TAURI = 'src-tauri'
const BINARIES_ORDNER = join(SRC_TAURI, 'binaries')
const RESOURCES_ORDNER = join(SRC_TAURI, 'resources')

async function hauptprogramm() {
  const paket = JSON.parse(readFileSync('package.json', 'utf-8'))

  rmSync(BINARIES_ORDNER, { recursive: true, force: true })
  rmSync(RESOURCES_ORDNER, { recursive: true, force: true })
  mkdirSync(BINARIES_ORDNER, { recursive: true })
  mkdirSync(RESOURCES_ORDNER, { recursive: true })

  if (process.platform === 'win32') {
    const nodeBinaryCachePfad = await beschaffeWindowsNodeBinary(NODE_VERSION)
    cpSync(nodeBinaryCachePfad, join(BINARIES_ORDNER, 'node-x86_64-pc-windows-msvc.exe'))
  } else if (process.platform === 'darwin') {
    const nodeBinaryCachePfad = await beschaffeMacNodeBinary(NODE_VERSION)
    const ziel = join(BINARIES_ORDNER, 'node-aarch64-apple-darwin')
    cpSync(nodeBinaryCachePfad, ziel)
    chmodSync(ziel, 0o755)
  } else {
    throw new Error(`Nicht unterstuetzte Plattform fuer den Tauri-Sidecar: ${process.platform}`)
  }

  const serverBundlePfad = join(RESOURCES_ORDNER, 'server.cjs')
  await baueFrontendUndServerBundle(paket.version, serverBundlePfad)

  cpSync('dist', join(RESOURCES_ORDNER, 'dist'), { recursive: true })

  console.log('Sidecar vorbereitet: src-tauri/binaries + src-tauri/resources sind bereit.')
}

hauptprogramm().catch((fehlerObjekt) => {
  console.error('tauri-sidecar-vorbereiten: unerwarteter Fehler:', fehlerObjekt)
  process.exit(1)
})
