import { oberflaechensprache } from './aktuell'
import { FORMAT_KENNUNG, istSprache, RUECKFALLSPRACHE } from './sprachen'

function kennung(sprache: string | undefined): string {
  const s = sprache ?? oberflaechensprache()
  return FORMAT_KENNUNG[istSprache(s) ? s : RUECKFALLSPRACHE]
}

function alsDatum(wert: Date | string): Date | null {
  const datum = typeof wert === 'string' ? new Date(wert) : wert
  return Number.isNaN(datum.getTime()) ? null : datum
}

export function formatiereZahl(
  wert: number,
  optionen: Intl.NumberFormatOptions = {},
  sprache?: string,
): string {
  return wert.toLocaleString(kennung(sprache), optionen)
}

export function formatiereDatum(wert: Date | string, sprache?: string): string {
  const datum = alsDatum(wert)
  if (!datum) return ''
  return datum.toLocaleDateString(kennung(sprache), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatiereUhrzeit(wert: Date | string, sprache?: string): string {
  const datum = alsDatum(wert)
  if (!datum) return ''
  return datum.toLocaleTimeString(kennung(sprache), { hour: '2-digit', minute: '2-digit' })
}

export function formatiereDatumUhrzeit(wert: Date | string, sprache?: string): string {
  const datum = alsDatum(wert)
  if (!datum) return ''
  return `${formatiereDatum(datum, sprache)}, ${formatiereUhrzeit(datum, sprache)}`
}

export function leseZahl(text: string): number | null {
  const bereinigt = text.trim().replace(',', '.')
  if (bereinigt === '') return null
  const zahl = Number(bereinigt)
  return Number.isFinite(zahl) ? zahl : null
}
