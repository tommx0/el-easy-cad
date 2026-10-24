import { createInterface } from 'node:readline'
import type { Readable, Writable } from 'node:stream'
import { erzeugeUebersetzer, QUELLSPRACHE, spracheAusKennung } from '../../src/sprache'
import type { Sprache, Uebersetzer } from '../../src/sprache'
import { JSONRPC_FEHLER, type JsonRpcAntwort } from './protokoll'

export const STDIO_SCHALTER = '--mcp-stdio'
export const TOKEN_UMGEBUNG = 'EL_EASY_CAD_MCP_TOKEN'

export function stdioAufruf(
  prozess: Pick<NodeJS.Process, 'execPath' | 'execArgv' | 'argv'> = process,
): { befehl: string; argumente: string[] } {
  return {
    befehl: prozess.execPath,
    argumente: [...prozess.execArgv, prozess.argv[1] ?? '', STDIO_SCHALTER],
  }
}

export function systemSprache(umgebung: NodeJS.ProcessEnv = process.env): Sprache {
  for (const name of ['LC_ALL', 'LC_MESSAGES', 'LANG'] as const) {
    const wert = umgebung[name]?.trim()
    if (!wert) continue
    if (/^(C|POSIX)([._@].*)?$/i.test(wert)) return QUELLSPRACHE
    return spracheAusKennung(wert)
  }
  return QUELLSPRACHE
}

export interface WeiterleitungsOptionen {
  adresse: string
  token: string | null
  eingabe: Readable
  ausgabe: Writable
  fetchen?: typeof fetch
  meldung?: (text: string) => void
  sprache?: Sprache
}

function antwortFuer(nachricht: unknown, code: number, text: string): JsonRpcAntwort[] {
  const liste = Array.isArray(nachricht) ? nachricht : [nachricht]
  return liste.flatMap((n) => {
    const anfrage = n as { id?: unknown; method?: unknown }
    if (typeof anfrage?.method !== 'string' || anfrage.id === undefined) return []
    return [
      {
        jsonrpc: '2.0' as const,
        id: anfrage.id as JsonRpcAntwort['id'],
        error: { code, message: text },
      },
    ]
  })
}

async function leiteWeiter(
  zeile: string,
  optionen: WeiterleitungsOptionen,
  schreibe: (wert: unknown) => void,
  t: Uebersetzer,
): Promise<void> {
  let nachricht: unknown
  try {
    nachricht = JSON.parse(zeile)
  } catch {
    schreibe({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: t('ki.stdio.keinJson') },
    })
    return
  }
  const fetchen = optionen.fetchen ?? fetch
  let antwort: Response
  try {
    antwort = await fetchen(optionen.adresse, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        ...(optionen.token ? { authorization: `Bearer ${optionen.token}` } : {}),
      },
      body: zeile,
    })
  } catch {
    for (const a of antwortFuer(nachricht, JSONRPC_FEHLER.intern, t('ki.stdio.laeuftNicht')))
      schreibe(a)
    return
  }
  const text = await antwort.text()
  if (antwort.status === 202 || text.trim() === '') return
  let inhalt: unknown
  try {
    inhalt = JSON.parse(text)
  } catch {
    for (const a of antwortFuer(
      nachricht,
      JSONRPC_FEHLER.intern,
      t('ki.stdio.antwortStatus', { status: String(antwort.status) }),
    ))
      schreibe(a)
    return
  }
  const zugang = inhalt as Partial<JsonRpcAntwort>
  if (!antwort.ok && zugang.error && zugang.id === null) {
    for (const a of antwortFuer(nachricht, zugang.error.code, zugang.error.message)) schreibe(a)
    return
  }
  schreibe(inhalt)
}

export async function starteStdioWeiterleitung(optionen: WeiterleitungsOptionen): Promise<void> {
  const schreibe = (wert: unknown) => {
    optionen.ausgabe.write(`${JSON.stringify(wert)}\n`)
  }
  const t = erzeugeUebersetzer(optionen.sprache ?? systemSprache())
  if (!optionen.token) {
    optionen.meldung?.(t('ki.stdio.tokenFehlt', { variable: TOKEN_UMGEBUNG }))
  }
  const offen = new Set<Promise<void>>()
  const zeilen = createInterface({ input: optionen.eingabe, crlfDelay: Infinity })
  for await (const zeile of zeilen) {
    if (zeile.trim() === '') continue
    const laeuft = leiteWeiter(zeile, optionen, schreibe, t).finally(() => offen.delete(laeuft))
    offen.add(laeuft)
  }
  await Promise.all(offen)
}
