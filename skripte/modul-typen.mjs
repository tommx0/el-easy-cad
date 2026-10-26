import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const WURZEL = fileURLToPath(new URL('..', import.meta.url))
const ZIEL = join(WURZEL, 'release', 'modul-typen')
const EINSTIEG = 'src/ui/zusatzmodule/schnittstelle.ts'

const tmp = join(WURZEL, 'node_modules', '.tmp')
mkdirSync(tmp, { recursive: true })
const temp = mkdtempSync(join(tmp, 'modul-typen-'))
const konfiguration = join(temp, 'tsconfig.json')
writeFileSync(
  konfiguration,
  JSON.stringify({
    extends: join(WURZEL, 'tsconfig.app.json'),
    compilerOptions: {
      noEmit: false,
      declaration: true,
      emitDeclarationOnly: true,
      rootDir: WURZEL,
      outDir: ZIEL,
      tsBuildInfoFile: join(temp, 'tsbuildinfo'),
    },
    include: [],
    files: [join(WURZEL, EINSTIEG), join(WURZEL, 'src/vite-env.d.ts')],
  }),
)

rmSync(ZIEL, { recursive: true, force: true })
const tsc = join(WURZEL, 'node_modules', 'typescript', 'bin', 'tsc')
const lauf = spawnSync(process.execPath, [tsc, '-p', konfiguration], {
  cwd: WURZEL,
  stdio: 'inherit',
})
rmSync(temp, { recursive: true, force: true })
if (lauf.status !== 0) {
  console.error('Modul-Typen: tsc meldet Fehler (siehe oben).')
  process.exit(lauf.status ?? 1)
}

writeFileSync(
  join(ZIEL, 'index.d.ts'),
  `// Erzeugt von skripte/modul-typen.mjs - nicht von Hand aendern.\n` +
    `export type * from './src/ui/zusatzmodule/schnittstelle'\n`,
)
console.log(`Modul-Typen nach ${ZIEL} geschrieben.`)
