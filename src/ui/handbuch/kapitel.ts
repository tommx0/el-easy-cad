import { erzeugeUebersetzer, type Sprache } from '../../sprache'
import { FASSUNG, type Fassung } from './fassung'

export interface Abschnitt {
  id: string
  titel: string
  nummer: string
}

export interface Kapitel {
  id: string
  nummer: number
  titel: string
  text: string
  abschnitte: Abschnitt[]
}

const BLOCK_START = /^:::nur-(desktop|cloud)\s*$/
const BLOCK_ENDE = /^:::\s*$/

export function filtereFassung(text: string, fassung: Fassung = FASSUNG): string {
  const zeilen = text.split('\n')
  const ausgabe: string[] = []
  let ueberspringen = false
  let imBlock = false
  for (const zeile of zeilen) {
    const start = BLOCK_START.exec(zeile)
    if (start) {
      imBlock = true
      ueberspringen = start[1] !== fassung
      continue
    }
    if (imBlock && BLOCK_ENDE.test(zeile)) {
      imBlock = false
      ueberspringen = false
      continue
    }
    if (!ueberspringen) ausgabe.push(zeile)
  }
  return ausgabe.join('\n')
}

const ABSCHNITT_ZEILE = /^##\s+(.*?)\s*\{#([a-z0-9-]+)\}\s*$/

function leseAbschnitte(text: string, kapitelNummer: number): Abschnitt[] {
  const abschnitte: Abschnitt[] = []
  for (const zeile of text.split('\n')) {
    const treffer = ABSCHNITT_ZEILE.exec(zeile)
    if (treffer) {
      abschnitte.push({
        id: treffer[2],
        titel: treffer[1],
        nummer: `${kapitelNummer}.${abschnitte.length + 1}`,
      })
    }
  }
  return abschnitte
}

function leseTitel(text: string, ersatz: string): string {
  for (const zeile of text.split('\n')) {
    if (zeile.startsWith('# ')) return zeile.slice(2).trim()
  }
  return ersatz
}

function ausDateiname(pfad: string): { nummer: number; id: string } {
  const name = pfad.split('/').pop()?.replace(/\.md$/, '') ?? ''
  const strich = name.indexOf('-')
  return { nummer: Number(name.slice(0, strich)), id: name.slice(strich + 1) }
}

export const ROHTEXTE = import.meta.glob('./inhalte/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function baueKapitel(
  rohtexte: Record<string, string> = ROHTEXTE,
  fassung: Fassung = FASSUNG,
): Kapitel[] {
  return Object.entries(rohtexte)
    .map(([pfad, roh]) => {
      const { nummer, id } = ausDateiname(pfad)
      const text = filtereFassung(roh, fassung)
      return {
        id,
        nummer,
        titel: leseTitel(text, id),
        text,
        abschnitte: leseAbschnitte(text, nummer),
      }
    })
    .sort((a, b) => a.nummer - b.nummer)
}

export const KAPITEL: Kapitel[] = baueKapitel()

export function kapitelZuAnker(anker: string, kapitel: Kapitel[] = KAPITEL): Kapitel | null {
  return kapitel.find((k) => k.abschnitte.some((a) => a.id === anker)) ?? null
}

export const WERKZEUG_ABSCHNITT: Record<string, string> = {
  komponente: 'komponente-platzieren',
  leitung: 'leitung-zeichnen',
  schaltverbindung: 'schaltverbindung',
  potential: 'potential',
  'knx-aktor': 'knx-aktor',
  trunk: 'trunk-anlegen',
  wirkverbindung: 'wirkverbindungen',
  kabelschacht: 'kabelschacht',
  linie: 'linien-und-polylinien',
  polylinie: 'linien-und-polylinien',
  rechteck: 'rechteck-kreis-bogen',
  kreis: 'rechteck-kreis-bogen',
  bogen: 'rechteck-kreis-bogen',
  ellipse: 'rechteck-kreis-bogen',
  polygon: 'rechteck-kreis-bogen',
  punkt: 'punkt-und-text',
  text: 'punkt-und-text',
  schraffur: 'schraffur-und-fuellung',
  trimmen: 'trimmen',
  bemassung: 'einzelmass',
  kettenbemassung: 'kettenbemassung',
  parallelbemassung: 'parallelbemassung',
  wand: 'waende-zeichnen',
  wandrechteck: 'wand-als-rechteck',
  tuer: 'tueren-und-fenster',
  fenster: 'tueren-und-fenster',
  wanddurchbruch: 'wanddurchbruch',
  wandteilen: 'wand-teilen',
  'teilstueck-zone': 'leitung-teilstuecke',
  raum: 'raeume',
  treppe: 'treppen',
  bodenplatte: 'bodenplatten',
  bodenplatterechteck: 'bodenplatten',
  nullpunkt: 'nullpunkt',
  kalibrieren: 'kalibrieren',
  'hintergrund-ausblenden': 'hintergrund-ausblenden',
  'zeichenflaeche-verschieben': 'zeichenflaeche-einrichten',
  'zoom-fenster': 'zoomen-und-schieben',
  stueckliste: 'stueckliste',
  switchplan: 'switchplan',
  patchpanelplan: 'patchpanelplan',
  leitungsliste: 'leitungsliste',
  trunkliste: 'trunkliste',
  raumliste: 'raumliste',
  betriebsmittelliste: 'betriebsmittelliste',
  stromkreisverzeichnis: 'stromkreisverzeichnis',
  aktorkanalliste: 'aktorkanalliste',
  potentialliste: 'potentialliste',
  steuerungslogik: 'steuerungslogik',
  leitungsbaum: 'leitungsbaum',
  plankopf: 'plankopf',
}

export const ROHTEXTE_ENGLISCH = import.meta.glob('./inhalte/en/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const KAPITEL_JE_SPRACHE = new Map<Sprache, Kapitel[]>()

export function kapitelFuerSprache(sprache: Sprache): Kapitel[] {
  if (sprache === 'de') return KAPITEL
  const vorhanden = KAPITEL_JE_SPRACHE.get(sprache)
  if (vorhanden) return vorhanden
  const englisch = new Map(baueKapitel(ROHTEXTE_ENGLISCH).map((k) => [k.id, k]))
  const hinweis = erzeugeUebersetzer(sprache)('handbuch.nurDeutsch')
  const kapitel = KAPITEL.map((deutsch) => {
    const fassung = englisch.get(deutsch.id)
    if (fassung) return fassung
    const text = deutsch.text.replace(/^# .*$/m, (zeile) => `${zeile}\n\n> ${hinweis}`)
    return { ...deutsch, text, titel: deutsch.titel }
  })
  KAPITEL_JE_SPRACHE.set(sprache, kapitel)
  return kapitel
}
