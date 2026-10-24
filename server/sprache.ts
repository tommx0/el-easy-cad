import type { FastifyRequest } from 'fastify'
import { erzeugeUebersetzer, QUELLSPRACHE, spracheAusKennung } from '../src/sprache'
import type { Schluessel, Sprache, Uebersetzer, Werte } from '../src/sprache'

export function anfrageSprache(anfrage: FastifyRequest): Sprache {
  const kopf = anfrage.headers['accept-language']
  const erste = (Array.isArray(kopf) ? kopf[0] : kopf)?.split(',')[0]?.trim()
  return erste ? spracheAusKennung(erste) : QUELLSPRACHE
}

export function uebersetzerFuer(anfrage: FastifyRequest): Uebersetzer {
  return erzeugeUebersetzer(anfrageSprache(anfrage))
}

export interface ServerText {
  schluessel: Schluessel
  werte?: Werte
}

export function serverText(schluessel: Schluessel, werte?: Werte): ServerText {
  return { schluessel, werte }
}

export function alsText(nachricht: string | ServerText, uebersetze: Uebersetzer): string {
  return typeof nachricht === 'string'
    ? nachricht
    : uebersetze(nachricht.schluessel, nachricht.werte)
}

export const deutsch = erzeugeUebersetzer(QUELLSPRACHE)
