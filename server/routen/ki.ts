import { timingSafeEqual } from 'node:crypto'
import type { ServerResponse } from 'node:http'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { kiAntwortSchema, kiWerkzeuge, type KiStatus } from '../../src/document-model/ki-werkzeuge'
import { APP_VERSION } from '../app-version'
import {
  erzeugeKiToken,
  leseKiEinstellungen,
  schreibeKiEinstellungen,
} from '../db/ki-einstellungen'
import { jetzt } from '../db/hilfen'
import { ApiFehler } from '../fehler'
import { anfrageSprache, serverText } from '../sprache'
import type { KiBruecke } from '../mcp/bruecke'
import { bearbeiteMcpNachricht, type JsonRpcAntwort } from '../mcp/protokoll'
import { stdioAufruf } from '../mcp/stdio-weiterleitung'
import type { ServerKontext } from '../server'

const ANTWORT_GROESSE_MAX = 25 * 1024 * 1024
const PULS_MS = 25_000

const patchSchema = z.object({
  aktiv: z.boolean().optional(),
  nurLesen: z.boolean().optional(),
  zustimmung: z.boolean().optional(),
})

const ERLAUBTE_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1'])

export function istErlaubterUrsprung(origin: string | undefined): boolean {
  if (!origin) return true
  try {
    return ERLAUBTE_HOSTS.has(new URL(origin).hostname)
  } catch {
    return false
  }
}

export function tokenPasst(kopf: string | undefined, token: string | null): boolean {
  if (!token || !kopf) return false
  const treffer = /^Bearer\s+(.+)$/i.exec(kopf.trim())
  if (!treffer) return false
  const a = Buffer.from(treffer[1])
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

function zugangsFehler(code: number, message: string): JsonRpcAntwort {
  return { jsonrpc: '2.0', id: null, error: { code, message } }
}

function merkeSprache(anfrage: FastifyRequest, bruecke: KiBruecke): void {
  if (anfrage.headers['accept-language']) bruecke.sprache = anfrageSprache(anfrage)
}

export function registriereKiRouten(
  app: FastifyInstance,
  kontext: ServerKontext,
  bruecke: KiBruecke,
): void {
  const offeneStroeme = new Set<ServerResponse>()

  function status(): KiStatus {
    const e = leseKiEinstellungen(kontext.db)
    return {
      aktiv: e.aktiv,
      nurLesen: e.nurLesen,
      zustimmungAm: e.zustimmungAm,
      token: e.token,
      mcpAdresse: `http://127.0.0.1:${kontext.konfiguration.port}/mcp`,
      stdio: stdioAufruf(),
      client: bruecke.getClient(),
    }
  }

  app.addHook('onClose', async () => {
    bruecke.trenneAlle()
    for (const strom of offeneStroeme) strom.end()
  })

  app.get('/api/ki/einstellungen', (anfrage) => {
    merkeSprache(anfrage, bruecke)
    return status()
  })

  app.put('/api/ki/einstellungen', (anfrage) => {
    const patch = patchSchema.parse(anfrage.body ?? {})
    const bisher = leseKiEinstellungen(kontext.db)
    const zustimmungAm = bisher.zustimmungAm ?? (patch.zustimmung ? jetzt() : null)
    if (patch.aktiv && !zustimmungAm) {
      throw ApiFehler.ungueltig(serverText('server.ki.zustimmungFehlt'))
    }
    schreibeKiEinstellungen(kontext.db, {
      aktiv: patch.aktiv,
      nurLesen: patch.nurLesen,
      zustimmungAm: zustimmungAm ?? undefined,
      token: patch.aktiv && !bisher.token ? erzeugeKiToken() : undefined,
    })
    if (patch.aktiv === false) bruecke.trenneAlle()
    return status()
  })

  app.post('/api/ki/token', () => {
    schreibeKiEinstellungen(kontext.db, { token: erzeugeKiToken() })
    return status()
  })

  app.get('/api/ki/ereignisse', (_anfrage, antwort) => {
    if (!leseKiEinstellungen(kontext.db).aktiv) {
      void antwort.code(204).send()
      return
    }
    antwort.hijack()
    const roh = antwort.raw
    roh.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    })
    offeneStroeme.add(roh)
    const id = bruecke.verbinde((ereignis, daten) => {
      roh.write(`event: ${ereignis}\ndata: ${JSON.stringify(daten)}\n\n`)
      if (ereignis === 'getrennt') roh.end()
    })
    const puls = setInterval(() => roh.write(': puls\n\n'), PULS_MS)
    roh.on('close', () => {
      clearInterval(puls)
      offeneStroeme.delete(roh)
      bruecke.trenne(id)
    })
  })

  app.post<{ Params: { aufrufId: string } }>(
    '/api/ki/antwort/:aufrufId',
    { bodyLimit: ANTWORT_GROESSE_MAX },
    (anfrage, antwort) => {
      const geprueft = kiAntwortSchema.parse(anfrage.body)
      if (!bruecke.nimmAntwort(anfrage.params.aufrufId, geprueft)) {
        throw ApiFehler.nichtGefunden(serverText('server.ki.aufrufUnbekannt'))
      }
      void antwort.code(204).send()
    },
  )

  app.post<{ Params: { verbindungId: string } }>(
    '/api/ki/aktiv/:verbindungId',
    (anfrage, antwort) => {
      if (!bruecke.markiereAktiv(anfrage.params.verbindungId)) {
        throw ApiFehler.nichtGefunden(serverText('server.ki.verbindungUnbekannt'))
      }
      merkeSprache(anfrage, bruecke)
      void antwort.code(204).send()
    },
  )

  app.post('/mcp', async (anfrage, antwort) => {
    const sprache = bruecke.sprache
    const t = bruecke.uebersetzer()
    if (!istErlaubterUrsprung(anfrage.headers.origin)) {
      return antwort.code(403).send(zugangsFehler(-32001, t('ki.routen.fremderUrsprung')))
    }
    const einstellungen = leseKiEinstellungen(kontext.db)
    if (!einstellungen.aktiv) {
      return antwort.code(403).send(zugangsFehler(-32001, t('ki.routen.ausgeschaltet')))
    }
    if (!tokenPasst(anfrage.headers.authorization, einstellungen.token)) {
      return antwort.code(401).send(zugangsFehler(-32001, t('ki.routen.tokenFalsch')))
    }
    let koerper: unknown = anfrage.body
    if (Buffer.isBuffer(koerper)) {
      try {
        koerper = JSON.parse(koerper.toString('utf-8'))
      } catch {
        return antwort.code(400).send(zugangsFehler(-32700, t('ki.routen.keinJson')))
      }
    }
    const mcpKontext = {
      werkzeuge: kiWerkzeuge(sprache),
      sprache,
      nurLesen: einstellungen.nurLesen,
      serverVersion: APP_VERSION,
      rufeAuf: (werkzeug: string, eingabe: unknown, zeitlimitMs: number) =>
        bruecke.rufeAuf(werkzeug, eingabe, zeitlimitMs),
      meldeClient: (name: string | null, version?: string) => bruecke.meldeClient(name, version),
    }
    const stapel = Array.isArray(koerper)
    const nachrichten: unknown[] = stapel ? (koerper as unknown[]) : [koerper]
    const antworten = (
      await Promise.all(nachrichten.map((n) => bearbeiteMcpNachricht(n, mcpKontext)))
    ).filter((a): a is JsonRpcAntwort => a !== null)
    if (antworten.length === 0) return antwort.code(202).send()
    return antwort
      .code(200)
      .type('application/json')
      .send(stapel ? antworten : antworten[0])
  })

  const nichtErlaubt = (_anfrage: unknown, antwort: FastifyReply) =>
    antwort.code(405).header('allow', 'POST').send()
  app.get('/mcp', nichtErlaubt)
  app.delete('/mcp', nichtErlaubt)
}
