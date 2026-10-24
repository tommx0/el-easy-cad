import type { KontextAktion } from './tool'
import { t } from '../sprache'

export function leertaste(beschriftung: string): KontextAktion {
  return { taste: ' ', kennung: t('werkzeuge.tasten.leertaste'), beschriftung }
}

export function enter(beschriftung: string): KontextAktion {
  return { taste: 'Enter', kennung: 'Enter', beschriftung }
}

export function entf(beschriftung: string): KontextAktion {
  return { taste: 'Delete', kennung: t('werkzeuge.tasten.entf'), beschriftung }
}

export function tab(beschriftung: string): KontextAktion {
  return { taste: 'Tab', kennung: 'Tab', beschriftung }
}

export function buchstabe(taste: string, beschriftung: string, an?: boolean): KontextAktion {
  const aktion: KontextAktion = {
    taste: taste.toLowerCase(),
    kennung: taste.toUpperCase(),
    beschriftung,
  }
  if (an !== undefined) aktion.an = an
  return aktion
}

export const GERADE_TASTE = 'Gerade'

export function gerade(an: boolean): KontextAktion {
  return {
    taste: GERADE_TASTE,
    kennung: t('werkzeuge.tasten.strg'),
    beschriftung: t('werkzeuge.tasten.gerade'),
    an,
  }
}

export function ziffernGruppe(
  gruppe: string,
  werte: readonly number[],
  gewaehlt: number,
): KontextAktion[] {
  return werte.map((w) => ({
    taste: String(w),
    kennung: String(w),
    beschriftung: `${gruppe}: ${w}`,
    gruppe,
    gewaehlt: w === gewaehlt,
  }))
}

export function plusMinus(
  gruppe: string,
  wert: string,
  minusText: string,
  plusText: string,
): KontextAktion[] {
  return [
    { taste: '-', kennung: '−', beschriftung: minusText, gruppe, wert },
    { taste: '+', kennung: '+', beschriftung: plusText, gruppe },
  ]
}

export function wirksam(
  ...eintraege: (KontextAktion | readonly KontextAktion[] | false | null | undefined | '' | 0)[]
): KontextAktion[] {
  return eintraege.flatMap((e) => (e ? (Array.isArray(e) ? e : [e as KontextAktion]) : []))
}

export function gleicheKontextAktionen(
  a: readonly KontextAktion[],
  b: readonly KontextAktion[],
): boolean {
  if (a.length !== b.length) return false
  return a.every((x, i) => {
    const y = b[i]
    return (
      x.taste === y.taste &&
      x.kennung === y.kennung &&
      x.beschriftung === y.beschriftung &&
      x.an === y.an &&
      x.gruppe === y.gruppe &&
      x.gewaehlt === y.gewaehlt &&
      x.wert === y.wert
    )
  })
}

const HINWEIS_AUF = '⟦'
const HINWEIS_ZU = '⟧'
const HINWEIS_MUSTER = new RegExp(`${HINWEIS_AUF}[^${HINWEIS_ZU}]*${HINWEIS_ZU}`, 'g')

export function tastenHinweis(text: string): string {
  return `${HINWEIS_AUF}${text}${HINWEIS_ZU}`
}

export function hinweisFuerAnzeige(text: string, tastenZeigen: boolean): string {
  if (tastenZeigen) return text.replaceAll(HINWEIS_AUF, '').replaceAll(HINWEIS_ZU, '')
  return text
    .replace(HINWEIS_MUSTER, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+([.,;)])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
