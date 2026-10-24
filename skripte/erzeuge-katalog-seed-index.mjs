import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SEED_ORDNER = fileURLToPath(new URL('../src/persistence/seed-data/', import.meta.url))
const ZIEL_DATEI = join(SEED_ORDNER, 'standard-kataloge.generated.ts')

function istKatalogDatei(inhalt) {
  return (
    inhalt !== null &&
    typeof inhalt === 'object' &&
    typeof inhalt.katalog === 'object' &&
    Array.isArray(inhalt.komponenten)
  )
}

const dateinamen = readdirSync(SEED_ORDNER)
  .filter((name) => name.endsWith('.json'))
  .sort()

const katalogDateien = dateinamen.filter((name) => {
  const inhalt = JSON.parse(readFileSync(join(SEED_ORDNER, name), 'utf-8'))
  return istKatalogDatei(inhalt)
})

function bezeichner(dateiname) {
  const stamm = dateiname.replace(/\.json$/, '')
  return 'katalog_' + stamm.replace(/-([a-z0-9])/g, (_, z) => z.toUpperCase()).replace(/-/g, '_')
}

const importZeilen = katalogDateien.map((name) => `import ${bezeichner(name)} from './${name}'`)
const arrayEintraege = katalogDateien.map((name) => `  ${bezeichner(name)},`)

const inhalt = `// Automatisch erzeugt von skripte/erzeuge-katalog-seed-index.mjs - nicht von Hand
// bearbeiten, Aenderungen gehen beim naechsten build/typecheck/test/dev verloren.
${importZeilen.join('\n')}

/** Rohe Katalog-Seed-Daten (Form: {katalog, komponenten}) - siehe catalog-seed.ts. */
export const STANDARD_KATALOG_ROHDATEN: unknown[] = [
${arrayEintraege.join('\n')}
]
`

writeFileSync(ZIEL_DATEI, inhalt, 'utf-8')
console.log(
  `Katalog-Seed-Index erzeugt (${katalogDateien.length} Katalog${katalogDateien.length === 1 ? '' : 'e'}): ${katalogDateien.join(', ')}`,
)
