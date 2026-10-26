import { z } from 'zod'
import {
  KI_STANDARD_ZEITLIMIT_MS,
  type KiAntwort,
  type KiWerkzeugDefinition,
} from '../../src/document-model/ki-werkzeuge'
import { erzeugeUebersetzer, QUELLSPRACHE } from '../../src/sprache'
import type { Sprache, Uebersetzer } from '../../src/sprache'

export const MCP_PROTOKOLL_FASSUNGEN = ['2025-06-18', '2025-03-26', '2024-11-05'] as const

export function mcpAnleitung(sprache: Sprache): string {
  return erzeugeUebersetzer(sprache)('ki.protokoll.anleitung')
}

export interface McpKontext {
  werkzeuge: readonly KiWerkzeugDefinition[]
  nurLesen: boolean
  serverVersion: string
  rufeAuf: (werkzeug: string, eingabe: unknown, zeitlimitMs: number) => Promise<KiAntwort>
  meldeClient: (name: string | null, version?: string) => void
  sprache?: Sprache
}

interface JsonRpcAnfrage {
  jsonrpc: '2.0'
  id?: string | number | null
  method?: string
  params?: unknown
}

export interface JsonRpcAntwort {
  jsonrpc: '2.0'
  id: string | number | null
  result?: unknown
  error?: { code: number; message: string }
}

export const JSONRPC_FEHLER = {
  ungueltigeAnfrage: -32600,
  unbekannteMethode: -32601,
  ungueltigeParameter: -32602,
  intern: -32603,
} as const

function fehler(id: JsonRpcAntwort['id'], code: number, message: string): JsonRpcAntwort {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert)
}

export function sichtbareWerkzeuge(kontext: Pick<McpKontext, 'werkzeuge' | 'nurLesen'>) {
  return kontext.werkzeuge.filter((w) => !kontext.nurLesen || !w.schreibt)
}

function eingabeSchema(definition: KiWerkzeugDefinition): Record<string, unknown> {
  if (definition.eingabeJson) return definition.eingabeJson
  const schema = z.toJSONSchema(definition.eingabe, { io: 'input' }) as Record<string, unknown>
  delete schema.$schema
  return schema
}

function werkzeugListe(kontext: McpKontext) {
  return {
    tools: sichtbareWerkzeuge(kontext).map((w) => ({
      name: w.name,
      title: w.titel,
      description: w.beschreibung,
      inputSchema: eingabeSchema(w),
      annotations: { readOnlyHint: !w.schreibt },
    })),
  }
}

function werkzeugFehler(text: string) {
  return { content: [{ type: 'text', text }], isError: true }
}

async function rufeWerkzeug(
  params: unknown,
  kontext: McpKontext,
  id: JsonRpcAntwort['id'],
  t: Uebersetzer,
) {
  if (!istObjekt(params) || typeof params.name !== 'string') {
    return fehler(id, JSONRPC_FEHLER.ungueltigeParameter, t('ki.protokoll.ohneName'))
  }
  const definition = kontext.werkzeuge.find((w) => w.name === params.name)
  if (!definition) {
    return fehler(
      id,
      JSONRPC_FEHLER.ungueltigeParameter,
      t('ki.protokoll.unbekanntesWerkzeug', { name: params.name }),
    )
  }
  if (definition.schreibt && kontext.nurLesen) {
    return {
      jsonrpc: '2.0' as const,
      id,
      result: werkzeugFehler(t('ki.protokoll.nurLesen')),
    }
  }
  const geprueft = definition.eingabe.safeParse(params.arguments ?? {})
  if (!geprueft.success) {
    const gruende = geprueft.error.issues
      .map((i) => `${i.path.join('.') || t('ki.protokoll.eingabe')}: ${i.message}`)
      .join('; ')
    return {
      jsonrpc: '2.0' as const,
      id,
      result: werkzeugFehler(
        t('ki.protokoll.ungueltigeEingabe', { werkzeug: definition.name, gruende }),
      ),
    }
  }
  const antwort = await kontext.rufeAuf(
    definition.name,
    geprueft.data,
    definition.zeitlimitMs ?? KI_STANDARD_ZEITLIMIT_MS,
  )
  if (!antwort.ok) return { jsonrpc: '2.0' as const, id, result: werkzeugFehler(antwort.fehler) }
  return {
    jsonrpc: '2.0' as const,
    id,
    result: {
      content: antwort.inhalt.map((teil) =>
        teil.art === 'text'
          ? { type: 'text', text: teil.text }
          : { type: 'image', data: teil.daten, mimeType: teil.mime },
      ),
    },
  }
}

export async function bearbeiteMcpNachricht(
  nachricht: unknown,
  kontext: McpKontext,
): Promise<JsonRpcAntwort | null> {
  const t = erzeugeUebersetzer(kontext.sprache ?? QUELLSPRACHE)
  if (!istObjekt(nachricht) || nachricht.jsonrpc !== '2.0') {
    return fehler(null, JSONRPC_FEHLER.ungueltigeAnfrage, t('ki.protokoll.keinJsonRpc'))
  }
  const anfrage = nachricht as unknown as JsonRpcAnfrage
  if (typeof anfrage.method !== 'string') return null
  const id = anfrage.id
  const istBenachrichtigung = id === undefined
  if (istBenachrichtigung) return null

  try {
    switch (anfrage.method) {
      case 'initialize': {
        const params = istObjekt(anfrage.params) ? anfrage.params : {}
        const gewuenscht = typeof params.protocolVersion === 'string' ? params.protocolVersion : ''
        const fassung = (MCP_PROTOKOLL_FASSUNGEN as readonly string[]).includes(gewuenscht)
          ? gewuenscht
          : MCP_PROTOKOLL_FASSUNGEN[0]
        const info = istObjekt(params.clientInfo) ? params.clientInfo : {}
        kontext.meldeClient(
          typeof info.name === 'string' ? info.name : null,
          typeof info.version === 'string' ? info.version : undefined,
        )
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: fassung,
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: 'el.easy.CAD', version: kontext.serverVersion },
            instructions: mcpAnleitung(kontext.sprache ?? QUELLSPRACHE),
          },
        }
      }
      case 'ping':
        return { jsonrpc: '2.0', id, result: {} }
      case 'tools/list':
        kontext.meldeClient(null)
        return { jsonrpc: '2.0', id, result: werkzeugListe(kontext) }
      case 'tools/call':
        kontext.meldeClient(null)
        return await rufeWerkzeug(anfrage.params, kontext, id, t)
      default:
        return fehler(
          id,
          JSONRPC_FEHLER.unbekannteMethode,
          t('ki.protokoll.unbekannteMethode', { methode: anfrage.method }),
        )
    }
  } catch (ursache) {
    return fehler(
      id,
      JSONRPC_FEHLER.intern,
      ursache instanceof Error ? ursache.message : t('ki.protokoll.unerwartet'),
    )
  }
}
