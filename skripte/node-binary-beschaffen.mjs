import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

function fehler(nachricht) {
  console.error(`node-binary-beschaffen: ${nachricht}`)
  process.exit(1)
}

function fuehreAus(befehl, argumente, optionen = {}) {
  const ergebnis = spawnSync(befehl, argumente, { stdio: 'inherit', ...optionen })
  if (ergebnis.status !== 0) {
    fehler(`"${befehl} ${argumente.join(' ')}" ist fehlgeschlagen (Code ${ergebnis.status}).`)
  }
}

export async function beschaffeWindowsNodeBinary(nodeVersion) {
  const ziel = 'win-x64'
  const ordnername = `node-${nodeVersion}-${ziel}`
  const zipName = `${ordnername}.zip`
  const url = `https://nodejs.org/dist/${nodeVersion}/${zipName}`
  const shasumsUrl = `https://nodejs.org/dist/${nodeVersion}/SHASUMS256.txt`
  const cacheOrdner = join('.cache', 'node', `${nodeVersion}-${ziel}`)
  const cachePfad = join(cacheOrdner, 'node.exe')
  if (existsSync(cachePfad)) return cachePfad

  console.log(`Lade Node-Binary (${url}) ...`)
  const tmpOrdner = mkdtempSync(join(tmpdir(), 'el-easy-cad-node-'))
  const zipPfad = join(tmpOrdner, zipName)

  const zipAntwort = await fetch(url)
  if (!zipAntwort.ok || !zipAntwort.body) {
    fehler(`Download von ${url} fehlgeschlagen (${zipAntwort.status}).`)
  }
  await pipeline(Readable.fromWeb(zipAntwort.body), createWriteStream(zipPfad))

  const shasumsAntwort = await fetch(shasumsUrl)
  if (!shasumsAntwort.ok) {
    fehler(`Download von ${shasumsUrl} fehlgeschlagen (${shasumsAntwort.status}).`)
  }
  const shasums = await shasumsAntwort.text()
  const zeile = shasums.split('\n').find((z) => z.trim().endsWith(zipName))
  if (!zeile) fehler(`Keine Pruefsumme fuer ${zipName} in SHASUMS256.txt gefunden.`)
  const erwartetesHash = zeile.trim().split(/\s+/)[0]

  const tatsaechlichesHash = createHash('sha256').update(readFileSync(zipPfad)).digest('hex')
  if (tatsaechlichesHash !== erwartetesHash) {
    fehler(
      `Pruefsumme von ${zipName} stimmt nicht - erwartet ${erwartetesHash}, ` +
        `erhalten ${tatsaechlichesHash}. Download moeglicherweise beschaedigt.`,
    )
  }

  fuehreAus('tar', ['-xf', zipPfad, '-C', tmpOrdner, `${ordnername}/node.exe`])
  mkdirSync(cacheOrdner, { recursive: true })
  copyFileSync(join(tmpOrdner, ordnername, 'node.exe'), cachePfad)
  rmSync(tmpOrdner, { recursive: true, force: true })
  return cachePfad
}

export async function beschaffeMacNodeBinary(nodeVersion) {
  const ziel = 'darwin-arm64'
  const ordnername = `node-${nodeVersion}-${ziel}`
  const tarballName = `${ordnername}.tar.gz`
  const url = `https://nodejs.org/dist/${nodeVersion}/${tarballName}`
  const shasumsUrl = `https://nodejs.org/dist/${nodeVersion}/SHASUMS256.txt`
  const cacheOrdner = join('.cache', 'node', `${nodeVersion}-${ziel}`)
  const cachePfad = join(cacheOrdner, 'node')
  if (existsSync(cachePfad)) return cachePfad

  console.log(`Lade Node-Binary (${url}) ...`)
  const tmpOrdner = mkdtempSync(join(tmpdir(), 'el-easy-cad-node-'))
  const tarballPfad = join(tmpOrdner, tarballName)

  const tarballAntwort = await fetch(url)
  if (!tarballAntwort.ok || !tarballAntwort.body) {
    fehler(`Download von ${url} fehlgeschlagen (${tarballAntwort.status}).`)
  }
  await pipeline(Readable.fromWeb(tarballAntwort.body), createWriteStream(tarballPfad))

  const shasumsAntwort = await fetch(shasumsUrl)
  if (!shasumsAntwort.ok) {
    fehler(`Download von ${shasumsUrl} fehlgeschlagen (${shasumsAntwort.status}).`)
  }
  const shasums = await shasumsAntwort.text()
  const zeile = shasums.split('\n').find((z) => z.trim().endsWith(tarballName))
  if (!zeile) fehler(`Keine Pruefsumme fuer ${tarballName} in SHASUMS256.txt gefunden.`)
  const erwartetesHash = zeile.trim().split(/\s+/)[0]

  const tatsaechlichesHash = createHash('sha256').update(readFileSync(tarballPfad)).digest('hex')
  if (tatsaechlichesHash !== erwartetesHash) {
    fehler(
      `Pruefsumme von ${tarballName} stimmt nicht - erwartet ${erwartetesHash}, ` +
        `erhalten ${tatsaechlichesHash}. Download moeglicherweise beschaedigt.`,
    )
  }

  fuehreAus('tar', ['-xzf', tarballPfad, '-C', tmpOrdner, `${ordnername}/bin/node`])
  mkdirSync(cacheOrdner, { recursive: true })
  copyFileSync(join(tmpOrdner, ordnername, 'bin', 'node'), cachePfad)
  chmodSync(cachePfad, 0o755)
  rmSync(tmpOrdner, { recursive: true, force: true })
  return cachePfad
}
