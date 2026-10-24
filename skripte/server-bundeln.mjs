import * as esbuild from 'esbuild'
import JavaScriptObfuscator from 'javascript-obfuscator'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export async function baueFrontendUndServerBundle(version, serverBundlePfad) {
  console.log('Baue Frontend (pnpm build) ...')
  const buildErgebnis = spawnSync('pnpm build', { stdio: 'inherit', shell: true })
  if (buildErgebnis.status !== 0) {
    throw new Error(
      `"pnpm build" ist fehlgeschlagen (Code ${buildErgebnis.status}).` +
        (buildErgebnis.error ? ` Ursache: ${buildErgebnis.error.message}` : ''),
    )
  }

  obfuskiereFrontendAppChunk('dist')

  console.log('Buendle Begleitserver (esbuild) ...')
  try {
    esbuild.buildSync({
      entryPoints: ['server/index.ts'],
      outfile: serverBundlePfad,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node22',
      external: ['node:*'],
      define: { __APP_VERSION__: JSON.stringify(version) },
      minify: true,
    })
  } catch (esbuildFehler) {
    throw new Error(`esbuild-Buendelung fehlgeschlagen: ${esbuildFehler.message}`)
  }

  const bundleInhalt = readFileSync(serverBundlePfad, 'utf-8')
  if (!/require\(["']node:/.test(bundleInhalt)) {
    throw new Error(
      'Server-Bundle enthaelt keine externen node:-Importe mehr - ' +
        '--external:node:* hat vermutlich nicht gegriffen.',
    )
  }

  obfuskiereServerBundle(serverBundlePfad)
  await pruefeServerBundleSmoke(serverBundlePfad)
}

function obfuskiereServerBundle(serverBundlePfad) {
  console.log('Obfuskiere Server-Bundle ...')
  const quelltext = readFileSync(serverBundlePfad, 'utf-8')
  const ergebnis = JavaScriptObfuscator.obfuscate(quelltext, {
    compact: true,
    controlFlowFlattening: true,
    deadCodeInjection: true,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 1,
    identifierNamesGenerator: 'hexadecimal',
    target: 'node',
    disableConsoleOutput: false,
  })
  writeFileSync(serverBundlePfad, ergebnis.getObfuscatedCode())
}

function obfuskiereFrontendAppChunk(distPfad) {
  const assetsOrdner = join(distPfad, 'assets')
  const appChunks = readdirSync(assetsOrdner).filter((datei) => /^index-.*\.js$/.test(datei))
  if (appChunks.length === 0) {
    throw new Error(`Kein App-Chunk (index-*.js) in ${assetsOrdner} gefunden.`)
  }
  for (const datei of appChunks) {
    console.log(`Obfuskiere Frontend-Chunk ${datei} ...`)
    const pfad = join(assetsOrdner, datei)
    const quelltext = readFileSync(pfad, 'utf-8')
    const ergebnis = JavaScriptObfuscator.obfuscate(quelltext, {
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      identifierNamesGenerator: 'hexadecimal',
      target: 'browser-no-eval',
      disableConsoleOutput: false,
    })
    writeFileSync(pfad, ergebnis.getObfuscatedCode())
  }
}

async function findeFreienPort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port
      server.close(() => resolve(port))
    })
  })
}

async function pruefeServerBundleSmoke(serverBundlePfad) {
  console.log('Pruefe Server-Bundle (Smoke-Test) ...')
  const datenordner = mkdtempSync(join(tmpdir(), 'el-easy-cad-bundle-smoke-'))
  const port = await findeFreienPort()
  const basisUrl = `http://127.0.0.1:${port}`

  const kindprozess = spawn(process.execPath, [serverBundlePfad], {
    env: {
      ...process.env,
      EL_EASY_CAD_DATEN: datenordner,
      EL_EASY_CAD_PORT: String(port),
      EL_EASY_CAD_DEMO_START: '2000-01-01',
      EL_EASY_CAD_ENTWICKLUNGSLIZENZ: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let ausgabe = ''
  kindprozess.stdout.on('data', (stueck) => (ausgabe += stueck))
  kindprozess.stderr.on('data', (stueck) => (ausgabe += stueck))

  async function beenden() {
    if (kindprozess.exitCode === null && kindprozess.signalCode === null) {
      await new Promise((resolve) => {
        kindprozess.once('exit', resolve)
        kindprozess.kill()
        setTimeout(resolve, 2000)
      })
    }
    for (let versuch = 1; versuch <= 5; versuch++) {
      try {
        rmSync(datenordner, { recursive: true, force: true })
        return
      } catch (fehlerObjekt) {
        if (fehlerObjekt.code !== 'EPERM' && fehlerObjekt.code !== 'EBUSY') throw fehlerObjekt
        if (versuch === 5) {
          console.warn(
            `Temp-Ordner ${datenordner} konnte nicht aufgeraeumt werden (${fehlerObjekt.code}) - wird ignoriert.`,
          )
          return
        }
        await new Promise((r) => setTimeout(r, 300))
      }
    }
  }

  try {
    await wartAufServerbereitschaft(basisUrl, kindprozess, () => ausgabe, 90000)

    const statusAntwort = await fetch(`${basisUrl}/api/status`)
    if (!statusAntwort.ok) {
      throw new Error(
        `/api/status lieferte ${statusAntwort.status} statt 200. Ausgabe:\n${ausgabe}`,
      )
    }

    const projekteAntwort = await fetch(`${basisUrl}/api/projekte`)
    const projekteKoerper = await projekteAntwort.json()
    if (projekteAntwort.status !== 403 || projekteKoerper?.fehler?.code !== 'lizenz-erforderlich') {
      throw new Error(
        'Lizenzdurchsetzung im obfuskierten Bundle greift nicht mehr: ' +
          `/api/projekte lieferte ${projekteAntwort.status} ${JSON.stringify(projekteKoerper)} ` +
          'statt 403 "lizenz-erforderlich". Ausgabe:\n' +
          ausgabe,
      )
    }
  } finally {
    await beenden()
  }
}

async function wartAufServerbereitschaft(basisUrl, kindprozess, leseAusgabe, timeoutMs = 5000) {
  const start = Date.now()
  let abgestuerzt = false
  kindprozess.once('exit', () => (abgestuerzt = true))

  while (Date.now() - start < timeoutMs) {
    if (abgestuerzt) {
      throw new Error(
        `Server-Bundle ist beim Smoke-Test vorzeitig beendet. Ausgabe:\n${leseAusgabe()}`,
      )
    }
    try {
      const antwort = await fetch(`${basisUrl}/api/status`)
      if (antwort.ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(
    `Server-Bundle hat innerhalb von ${timeoutMs}ms nicht auf /api/status geantwortet. ` +
      `Ausgabe:\n${leseAusgabe()}`,
  )
}
