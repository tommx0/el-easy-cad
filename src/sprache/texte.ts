import { de } from './de'
import { en } from './en'
import type { Sprache } from './sprachen'

export interface Mehrzahl {
  zero?: string
  one?: string
  two?: string
  few?: string
  many?: string
  other: string
}

type Form<T> = T extends string
  ? string
  : T extends { other: string }
    ? Mehrzahl
    : { [K in keyof T]: Form<T[K]> }

export type Texte = Form<typeof de>

type Blatt = string | Mehrzahl

type Pfade<T> = {
  [K in keyof T & string]: T[K] extends Blatt
    ? K
    : T[K] extends object
      ? `${K}.${Pfade<T[K]>}`
      : never
}[keyof T & string]

export type Schluessel = Pfade<Texte>

export const TEXTE: Record<Sprache, Texte> = { de, en }

export function istMehrzahl(wert: unknown): wert is Mehrzahl {
  return typeof wert === 'object' && wert !== null && typeof (wert as Mehrzahl).other === 'string'
}

export function textUnter(texte: unknown, schluessel: string): Blatt | undefined {
  let knoten: unknown = texte
  for (const teil of schluessel.split('.')) {
    if (typeof knoten !== 'object' || knoten === null) return undefined
    knoten = (knoten as Record<string, unknown>)[teil]
  }
  return typeof knoten === 'string' || istMehrzahl(knoten) ? knoten : undefined
}

export function alleTexte(texte: unknown, praefix = ''): Array<[string, Blatt]> {
  if (typeof texte === 'string' || istMehrzahl(texte)) return [[praefix, texte]]
  if (typeof texte !== 'object' || texte === null) return []
  return Object.entries(texte).flatMap(([name, wert]) =>
    alleTexte(wert, praefix ? `${praefix}.${name}` : name),
  )
}
