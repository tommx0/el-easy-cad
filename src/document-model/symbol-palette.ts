import { z } from 'zod'

export const SYMBOL_FARBEN = [
  'schwarz',
  'weiss',
  'grau',
  'rot',
  'orange',
  'gelb',
  'gruen',
  'blau',
] as const

export type SymbolFarbe = (typeof SYMBOL_FARBEN)[number]

export const symbolFarbeSchema = z.enum(SYMBOL_FARBEN)

export const SYMBOL_FARBWERT: Record<SymbolFarbe, string> = {
  schwarz: '#000000',
  weiss: '#ffffff',
  grau: '#7f7f7f',
  rot: '#c8102e',
  orange: '#e87511',
  gelb: '#f2b700',
  gruen: '#00843d',
  blau: '#0057b8',
}

export function symbolFarbwert(farbe: SymbolFarbe | undefined): string {
  return SYMBOL_FARBWERT[farbe ?? 'schwarz']
}

export function istBunteSymbolFarbe(farbe: SymbolFarbe | undefined): boolean {
  return farbe !== undefined && farbe !== 'schwarz' && farbe !== 'weiss'
}

export function symbolFarbeZuWert(wert: string): SymbolFarbe | undefined {
  const gesucht = wert.trim().toLowerCase()
  return SYMBOL_FARBEN.find((farbe) => SYMBOL_FARBWERT[farbe] === gesucht)
}
