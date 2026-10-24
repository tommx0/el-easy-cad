import { FORMAT_KENNUNG, istSprache, QUELLSPRACHE, RUECKFALLSPRACHE } from './sprachen'
import type { Sprache } from './sprachen'
import { istMehrzahl, TEXTE, textUnter } from './texte'
import type { Mehrzahl, Schluessel } from './texte'

export type Werte = Record<string, string | number>

export type Uebersetzer = (schluessel: Schluessel, werte?: Werte) => string

const zwischenspeicher = new Map<Sprache, Uebersetzer>()

export function erzeugeUebersetzer(kennung: string): Uebersetzer {
  const sprache: Sprache = istSprache(kennung) ? kennung : RUECKFALLSPRACHE
  const vorhanden = zwischenspeicher.get(sprache)
  if (vorhanden) return vorhanden
  const mehrzahlRegeln = new Intl.PluralRules(FORMAT_KENNUNG[sprache])
  const zahlenFormat = new Intl.NumberFormat(FORMAT_KENNUNG[sprache])
  const kette: Sprache[] = [...new Set<Sprache>([sprache, RUECKFALLSPRACHE, QUELLSPRACHE])]

  const uebersetzer: Uebersetzer = (schluessel, werte = {}) => {
    let roh: ReturnType<typeof textUnter> = undefined
    for (const s of kette) {
      roh = textUnter(TEXTE[s], schluessel)
      if (roh !== undefined) break
    }
    if (roh === undefined) return schluessel
    const vorlage = istMehrzahl(roh) ? waehleMehrzahl(roh, werte.n, mehrzahlRegeln) : roh
    return setzeWerteEin(vorlage, werte, zahlenFormat)
  }
  zwischenspeicher.set(sprache, uebersetzer)
  return uebersetzer
}

function waehleMehrzahl(
  formen: Mehrzahl,
  n: string | number | undefined,
  regeln: Intl.PluralRules,
): string {
  const anzahl = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(anzahl)) return formen.other
  return formen[regeln.select(anzahl)] ?? formen.other
}

function setzeWerteEin(vorlage: string, werte: Werte, zahlenFormat: Intl.NumberFormat): string {
  return vorlage.replace(/\{(\w+)\}/g, (ganz, name: string) => {
    const wert = werte[name]
    if (wert === undefined) return ganz // sichtbar statt still verschluckt
    return typeof wert === 'number' ? zahlenFormat.format(wert) : wert
  })
}

export function platzhalterIn(vorlage: string): string[] {
  return [...vorlage.matchAll(/\{(\w+)\}/g)].map((treffer) => treffer[1]!).sort()
}
