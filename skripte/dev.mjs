import { spawn, spawnSync } from 'node:child_process'

const codegenErgebnis = spawnSync('node', ['skripte/erzeuge-katalog-seed-index.mjs'], {
  stdio: 'inherit',
})
if (codegenErgebnis.status !== 0) process.exit(codegenErgebnis.status ?? 1)
const AUFTRAEGE = [
  { name: 'server', befehl: 'tsx', argumente: ['watch', 'server/index.ts'] },
  { name: 'web', befehl: 'vite', argumente: [] },
]

const prozesse = []
let beendetSich = false

function praefixe(name, strom, ziel) {
  let rest = ''
  strom.on('data', (brocken) => {
    const zeilen = (rest + brocken.toString()).split('\n')
    rest = zeilen.pop() ?? ''
    for (const zeile of zeilen) ziel.write(`[${name}] ${zeile}\n`)
  })
}

function beendeAlle(code) {
  if (beendetSich) return
  beendetSich = true
  for (const prozess of prozesse) {
    if (prozess.exitCode === null) prozess.kill('SIGTERM')
  }
  process.exitCode = code
}

for (const auftrag of AUFTRAEGE) {
  const prozess = spawn(auftrag.befehl, auftrag.argumente, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PATH: `node_modules/.bin:${process.env.PATH ?? ''}`,
      EL_EASY_CAD_ENTWICKLUNGSLIZENZ: '1',
    },
  })
  praefixe(auftrag.name, prozess.stdout, process.stdout)
  praefixe(auftrag.name, prozess.stderr, process.stderr)
  prozess.on('exit', (code) => {
    beendeAlle(code ?? 1)
  })
  prozess.on('error', (fehler) => {
    process.stderr.write(`[${auftrag.name}] konnte nicht gestartet werden: ${fehler.message}\n`)
    beendeAlle(1)
  })
  prozesse.push(prozess)
}

process.on('SIGINT', () => beendeAlle(0))
process.on('SIGTERM', () => beendeAlle(0))
