import type { DatabaseSync } from 'node:sqlite'
import {
  zusatzmodulKiWerkzeugName,
  type KiWerkzeugDefinition,
  type ZusatzmodulEintrag,
} from '../../src/document-model'
import { z } from 'zod'
import { leseZusatzmodule } from '../db/zusatzmodule'
import { leseEntwicklung } from '../db/zusatzmodul-einstellungen'
import { leseModulDatei } from './ablage'
import { leseEntwicklungsDatei, leseEntwicklungsordner, type EntwicklungsFund } from './entwicklung'

export function entwicklungsFund(db: DatabaseSync): EntwicklungsFund | null {
  const einstellung = leseEntwicklung(db)
  return einstellung.aktiv ? leseEntwicklungsordner(einstellung.ordner) : null
}

export function zusatzmodulBestand(db: DatabaseSync): ZusatzmodulEintrag[] {
  const installiert = leseZusatzmodule(db)
  const fund = entwicklungsFund(db)
  if (!fund?.ok) return installiert
  const entwicklung: ZusatzmodulEintrag = {
    manifest: fund.manifest,
    aktiv: true,
    installiertAm: new Date(Number.parseInt(fund.stand, 36)).toISOString(),
    fehler: null,
    kiFreigabe: true,
    entwicklung: { stand: fund.stand },
  }
  return [entwicklung, ...installiert.filter((e) => e.manifest.kennung !== fund.manifest.kennung)]
}

function modulTexte(
  db: DatabaseSync,
  datenordner: string,
  eintrag: ZusatzmodulEintrag,
  sprache: string,
): Record<string, string> {
  const lies = (code: string): Record<string, string> => {
    const pfad = `texte/${code}.json`
    const fund = eintrag.entwicklung ? entwicklungsFund(db) : null
    const inhalt = eintrag.entwicklung
      ? fund?.ok
        ? leseEntwicklungsDatei(fund.ordner, pfad)
        : null
      : leseModulDatei(datenordner, eintrag.manifest.kennung, eintrag.manifest.version, pfad)
    if (!inhalt) return {}
    try {
      const roh = JSON.parse(inhalt.toString('utf-8')) as Record<string, unknown>
      return Object.fromEntries(
        Object.entries(roh).filter((e): e is [string, string] => typeof e[1] === 'string'),
      )
    } catch {
      return {}
    }
  }
  return { ...lies('de'), ...(sprache === 'de' ? {} : lies(sprache)) }
}

const MODUL_ZEITLIMIT_MS = 120_000

export function zusatzmodulKiWerkzeuge(
  db: DatabaseSync,
  datenordner: string,
  sprache: string,
): KiWerkzeugDefinition[] {
  return zusatzmodulBestand(db)
    .filter((e) => e.aktiv && e.kiFreigabe)
    .flatMap((e) => {
      const texte = modulTexte(db, datenordner, e, sprache)
      const text = (schluessel: string) => texte[schluessel] ?? schluessel
      return e.manifest.befehle.flatMap((b): KiWerkzeugDefinition[] =>
        b.ki
          ? [
              {
                name: zusatzmodulKiWerkzeugName(e.manifest.kennung, b.id),
                titel: `${e.manifest.name}: ${text(b.titel).replace(/\s*(…|\.\.\.)$/, '')}`,
                beschreibung: text(b.ki.beschreibung),
                eingabe: z.record(z.string(), z.unknown()),
                eingabeJson: b.ki.eingabe ?? { type: 'object', properties: {} },
                schreibt: b.ki.schreibt !== false,
                zeitlimitMs: b.ki.zeitlimitS ? b.ki.zeitlimitS * 1000 : MODUL_ZEITLIMIT_MS,
              },
            ]
          : [],
      )
    })
}
