import type { KatalogTextElement } from './catalog'

export function istVariablerText(element: KatalogTextElement): boolean {
  return element.variable !== undefined
}

export function textZeilen(element: Pick<KatalogTextElement, 'text'>): string[] {
  if (element.text.trim() === '') return []
  return element.text.split(/\r?\n/)
}

export interface GemeinsamesVariablesFeld {
  feldname: string
  wert: string | null
}

export function gemeinsameVariableFelder(
  listen: readonly (readonly KatalogTextElement[] | undefined)[],
): GemeinsamesVariablesFeld[] {
  if (listen.length === 0) return []
  const namen = [...new Set((listen[0] ?? []).filter(istVariablerText).map((e) => e.variable!))]
  const felder: GemeinsamesVariablesFeld[] = []
  for (const feldname of namen) {
    const werte = listen.map((liste) => liste?.find((e) => e.variable === feldname)?.text)
    if (werte.some((w) => w === undefined)) continue
    felder.push({ feldname, wert: werte.every((w) => w === werte[0]) ? werte[0]! : null })
  }
  return felder
}

export function setzeVariablenWert(
  elemente: readonly KatalogTextElement[],
  feldname: string,
  wert: string,
): KatalogTextElement[] {
  return elemente.map((e) => (e.variable === feldname ? { ...e, text: wert } : e))
}

export function uebernimmVariablenWerte(
  alt: readonly KatalogTextElement[] | undefined,
  neu: readonly KatalogTextElement[] | undefined,
): KatalogTextElement[] | undefined {
  if (!neu) return undefined
  return neu.map((e) => {
    if (!istVariablerText(e)) return e
    const vorher = alt?.find((a) => a.variable === e.variable)
    return vorher ? { ...e, text: vorher.text } : e
  })
}

export function stuecklistenAngaben(
  elemente: readonly KatalogTextElement[] | undefined,
  feldname: (variable: string) => string = (variable) => variable,
): string {
  return (elemente ?? [])
    .filter((e) => istVariablerText(e) && e.inStueckliste && e.text.trim() !== '')
    .map((e) => `${feldname(e.variable!)}: ${e.text.trim().replace(/\s*\r?\n\s*/g, ' ')}`)
    .join('; ')
}

export const TEXT_ZEILENABSTAND = 1.2

export function zeilenVersatz(
  index: number,
  anzahl: number,
  vertikal: KatalogTextElement['ausrichtungVertikal'],
): number {
  if (vertikal === 'oben') return index
  if (vertikal === 'unten') return index - (anzahl - 1)
  return index - (anzahl - 1) / 2
}
