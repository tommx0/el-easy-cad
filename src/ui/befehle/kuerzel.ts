import { t } from '../../sprache'
import type { Schluessel } from '../../sprache'

export type Kuerzel = string

interface TastenEreignis {
  key: string
  code?: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
}

const GESPERRT: Record<string, Schluessel> = {
  Escape: 'verwaltungsdialoge.kuerzel.gesperrt.escape',
  Enter: 'verwaltungsdialoge.kuerzel.gesperrt.enter',
  Delete: 'verwaltungsdialoge.kuerzel.gesperrt.entf',
  Backspace: 'verwaltungsdialoge.kuerzel.gesperrt.ruecktaste',
  Tab: 'verwaltungsdialoge.kuerzel.gesperrt.tab',
  '+': 'verwaltungsdialoge.kuerzel.gesperrt.plusMinus',
  '-': 'verwaltungsdialoge.kuerzel.gesperrt.plusMinus',
  '=': 'verwaltungsdialoge.kuerzel.gesperrt.plusMinus',
}

const NUR_MODIFIKATOR = new Set(['Control', 'Meta', 'Shift', 'Alt', 'AltGraph', 'CapsLock'])

export function hatTaste(e: { key: string }): boolean {
  return typeof e.key === 'string'
}

const ANZEIGE_TASTE: Record<string, Schluessel> = {
  ' ': 'verwaltungsdialoge.kuerzel.tasten.leertaste',
  ArrowUp: 'verwaltungsdialoge.kuerzel.tasten.pfeilHoch',
  ArrowDown: 'verwaltungsdialoge.kuerzel.tasten.pfeilRunter',
  ArrowLeft: 'verwaltungsdialoge.kuerzel.tasten.pfeilLinks',
  ArrowRight: 'verwaltungsdialoge.kuerzel.tasten.pfeilRechts',
  Home: 'verwaltungsdialoge.kuerzel.tasten.pos1',
  End: 'verwaltungsdialoge.kuerzel.tasten.ende',
  PageUp: 'verwaltungsdialoge.kuerzel.tasten.bildAuf',
  PageDown: 'verwaltungsdialoge.kuerzel.tasten.bildAb',
  Insert: 'verwaltungsdialoge.kuerzel.tasten.einfg',
  Escape: 'verwaltungsdialoge.kuerzel.tasten.esc',
  Delete: 'verwaltungsdialoge.kuerzel.tasten.entf',
  Backspace: 'verwaltungsdialoge.kuerzel.tasten.ruecktaste',
}

export function normalform(e: TastenEreignis): Kuerzel | null {
  if (!hatTaste(e)) return null
  if (NUR_MODIFIKATOR.has(e.key)) return null
  const teile: string[] = []
  if (e.ctrlKey || e.metaKey) teile.push('STRG')
  if (e.shiftKey) teile.push('UMSCHALT')
  if (e.altKey) teile.push('ALT')
  teile.push(tasteBeiAlt(e) ?? (e.key.length === 1 ? e.key.toUpperCase() : e.key))
  return teile.join('+')
}

function tasteBeiAlt(e: TastenEreignis): string | null {
  if (!e.altKey || e.ctrlKey || /^[a-z0-9]$/i.test(e.key)) return null
  const physisch = /^(?:Key([A-Z])|Digit([0-9]))$/.exec(e.code ?? '')
  return physisch ? (physisch[1] ?? physisch[2]) : null
}

export function taste(kuerzel: Kuerzel): string {
  const teile = kuerzel.split('+')
  const letztes = teile[teile.length - 1]
  return letztes === '' ? '+' : letztes
}

export function sperrgrund(kuerzel: Kuerzel): string | null {
  const schluessel = GESPERRT[taste(kuerzel)]
  return schluessel ? t(schluessel) : null
}

export function anzeige(kuerzel: Kuerzel): string {
  const teile = kuerzel.split('+')
  const name = taste(kuerzel)
  const modifikatoren = teile
    .slice(0, teile.length - 1)
    .filter((teil) => teil !== '')
    .map((teil) =>
      t(
        teil === 'STRG'
          ? 'verwaltungsdialoge.kuerzel.strg'
          : teil === 'UMSCHALT'
            ? 'verwaltungsdialoge.kuerzel.umschalt'
            : 'verwaltungsdialoge.kuerzel.alt',
      ),
    )
  const benannt = ANZEIGE_TASTE[name]
  return [...modifikatoren, benannt ? t(benannt) : name].join('+')
}
