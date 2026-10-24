import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname } from 'node:path'

export const FEHLERPROTOKOLL_MAX_BYTES = 5 * 1024 * 1024
export const FEHLERPROTOKOLL_ZIEL_BYTES = 4 * 1024 * 1024

const TRENNZEILE = '\n' + '-'.repeat(60) + '\n'

const FLUTSCHUTZ_FENSTER_MS = 5000

export type FehlerprotokollQuelle = 'server' | 'client'
export type FehlerprotokollStufe = 'FEHLER' | 'WARNUNG' | 'DEBUG'

export interface FehlerprotokollEintrag {
  quelle: FehlerprotokollQuelle
  stufe?: FehlerprotokollStufe
  nachricht: string
  stack?: string | null
  kontext?: string | null
}

function formatiereEintrag(eintrag: FehlerprotokollEintrag, zeitIso: string): string {
  const stufe = eintrag.stufe ?? 'FEHLER'
  const zeilen = [`${zeitIso} [${eintrag.quelle}] ${stufe}  ${eintrag.nachricht}`]
  if (eintrag.kontext) zeilen.push(`  Kontext: ${eintrag.kontext}`)
  if (eintrag.stack) {
    zeilen.push(
      eintrag.stack
        .split('\n')
        .map((zeile) => `  ${zeile}`)
        .join('\n'),
    )
  }
  return zeilen.join('\n')
}

function kuerzeBeiBedarf(pfad: string): void {
  let groesse: number
  try {
    groesse = statSync(pfad).size
  } catch {
    return
  }
  if (groesse <= FEHLERPROTOKOLL_MAX_BYTES) return

  const eintraege = readFileSync(pfad, 'utf8')
    .split(TRENNZEILE)
    .filter((eintrag) => eintrag.length > 0)

  while (
    eintraege.length > 1 &&
    Buffer.byteLength(eintraege.join(TRENNZEILE) + TRENNZEILE, 'utf8') > FEHLERPROTOKOLL_ZIEL_BYTES
  ) {
    eintraege.shift()
  }
  writeFileSync(pfad, eintraege.length > 0 ? eintraege.join(TRENNZEILE) + TRENNZEILE : '', 'utf8')
}

export interface Fehlerprotokollierer {
  protokolliere(eintrag: FehlerprotokollEintrag): void
}

export function erzeugeFehlerprotokollierer(pfad: string): Fehlerprotokollierer {
  let letzter: { signatur: string; ersterZeitpunktMs: number; unterdrueckt: number } | null = null

  function anhaenge(text: string): void {
    mkdirSync(dirname(pfad), { recursive: true })
    appendFileSync(pfad, text, 'utf8')
    kuerzeBeiBedarf(pfad)
  }

  return {
    protokolliere(eintrag) {
      const jetzt = Date.now()
      const signatur = `${eintrag.quelle}|${eintrag.nachricht}|${eintrag.stack ?? ''}`

      if (
        letzter &&
        letzter.signatur === signatur &&
        jetzt - letzter.ersterZeitpunktMs < FLUTSCHUTZ_FENSTER_MS
      ) {
        letzter.unterdrueckt += 1
        return
      }

      if (letzter && letzter.unterdrueckt > 0) {
        anhaenge(`  (${letzter.unterdrueckt} weitere gleiche Meldung(en) unterdrückt)` + TRENNZEILE)
      }

      letzter = { signatur, ersterZeitpunktMs: jetzt, unterdrueckt: 0 }
      anhaenge(formatiereEintrag(eintrag, new Date(jetzt).toISOString()) + TRENNZEILE)
    },
  }
}

export interface FehlerprotokollInhalt {
  text: string
  groesseBytes: number
}

export function leseFehlerprotokoll(pfad: string): FehlerprotokollInhalt {
  if (!existsSync(pfad)) return { text: '', groesseBytes: 0 }
  const text = readFileSync(pfad, 'utf8')
  return { text, groesseBytes: Buffer.byteLength(text, 'utf8') }
}
