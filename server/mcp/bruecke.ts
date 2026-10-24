import { randomUUID } from 'node:crypto'
import type { KiAntwort, KiAufruf, KiClient } from '../../src/document-model/ki-werkzeuge'
import { erzeugeUebersetzer, QUELLSPRACHE } from '../../src/sprache'
import type { Sprache, Uebersetzer } from '../../src/sprache'
import { deutsch } from '../sprache'

export type EreignisSender = (ereignis: string, daten: unknown) => void

interface Verbindung {
  id: string
  sende: EreignisSender
  zuletztAktiv: number
}

interface OffenerAufruf {
  verbindungId: string
  erfuelle: (antwort: KiAntwort) => void
  timer: ReturnType<typeof setTimeout>
}

export const KEINE_APP_MELDUNG = deutsch('ki.bruecke.keineApp')

export class KiBruecke {
  private verbindungen = new Map<string, Verbindung>()
  private offen = new Map<string, OffenerAufruf>()
  private client: KiClient | null = null

  sprache: Sprache = QUELLSPRACHE

  private readonly jetzt: () => number

  constructor(jetzt: () => number = () => Date.now()) {
    this.jetzt = jetzt
  }

  verbinde(sende: EreignisSender): string {
    const id = randomUUID()
    this.verbindungen.set(id, { id, sende, zuletztAktiv: this.jetzt() })
    sende('verbunden', { verbindungId: id, client: this.client })
    return id
  }

  trenne(id: string): void {
    if (!this.verbindungen.delete(id)) return
    for (const [aufrufId, aufruf] of this.offen) {
      if (aufruf.verbindungId !== id) continue
      this.beende(aufrufId, { ok: false, fehler: this.uebersetzer()('ki.bruecke.getrennt') })
    }
  }

  markiereAktiv(id: string): boolean {
    const verbindung = this.verbindungen.get(id)
    if (!verbindung) return false
    verbindung.zuletztAktiv = this.jetzt()
    return true
  }

  istVerbunden(): boolean {
    return this.verbindungen.size > 0
  }

  private ziel(): Verbindung | null {
    let bestes: Verbindung | null = null
    for (const v of this.verbindungen.values()) {
      if (!bestes || v.zuletztAktiv >= bestes.zuletztAktiv) bestes = v
    }
    return bestes
  }

  rufeAuf(werkzeug: string, eingabe: unknown, zeitlimitMs: number): Promise<KiAntwort> {
    const ziel = this.ziel()
    const t = this.uebersetzer()
    if (!ziel) return Promise.resolve({ ok: false, fehler: t('ki.bruecke.keineApp') })
    const aufrufId = randomUUID()
    return new Promise<KiAntwort>((erfuelle) => {
      const timer = setTimeout(() => {
        this.beende(aufrufId, {
          ok: false,
          fehler: t('ki.bruecke.zeitlimit', { sekunden: Math.round(zeitlimitMs / 1000) }),
        })
      }, zeitlimitMs)
      this.offen.set(aufrufId, { verbindungId: ziel.id, erfuelle, timer })
      const aufruf: KiAufruf = { aufrufId, werkzeug, eingabe }
      ziel.sende('aufruf', aufruf)
    })
  }

  nimmAntwort(aufrufId: string, antwort: KiAntwort): boolean {
    if (!this.offen.has(aufrufId)) return false
    this.beende(aufrufId, antwort)
    return true
  }

  private beende(aufrufId: string, antwort: KiAntwort): void {
    const aufruf = this.offen.get(aufrufId)
    if (!aufruf) return
    clearTimeout(aufruf.timer)
    this.offen.delete(aufrufId)
    aufruf.erfuelle(antwort)
  }

  meldeClient(name: string | null, version?: string): void {
    const bisher = this.client
    this.client = {
      name: name ?? bisher?.name ?? this.uebersetzer()('ki.bruecke.kiAssistent'),
      ...((version ?? bisher?.version) ? { version: version ?? bisher?.version } : {}),
      zuletzt: new Date(this.jetzt()).toISOString(),
    }
    for (const v of this.verbindungen.values()) v.sende('status', { client: this.client })
  }

  uebersetzer(): Uebersetzer {
    return erzeugeUebersetzer(this.sprache)
  }

  getClient(): KiClient | null {
    return this.client
  }

  trenneAlle(): void {
    for (const id of [...this.verbindungen.keys()]) {
      this.verbindungen.get(id)?.sende('getrennt', {})
      this.trenne(id)
    }
  }
}
