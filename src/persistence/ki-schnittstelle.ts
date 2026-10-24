import type {
  KiAntwort,
  KiAufruf,
  KiClient,
  KiEinstellungenPatch,
  KiStatus,
} from '../document-model'
import { API_BASIS, holeJson, sendeJson } from './api-client'

export function leseKiStatus(): Promise<KiStatus> {
  return holeJson<KiStatus>('/ki/einstellungen')
}

export function aendereKiEinstellungen(patch: KiEinstellungenPatch): Promise<KiStatus> {
  return sendeJson<KiStatus>('PUT', '/ki/einstellungen', patch)
}

export function erneuereKiToken(): Promise<KiStatus> {
  return sendeJson<KiStatus>('POST', '/ki/token')
}

export interface KiBrueckenZustand {
  verbunden: boolean
  client: KiClient | null
}

export interface EreignisQuelle {
  addEventListener(name: string, rueckruf: (ereignis: MessageEvent<string>) => void): void
  close(): void
  onerror: ((ereignis: Event) => void) | null
}

type Listener = (zustand: KiBrueckenZustand) => void

const AKTIV_ABSTAND_MS = 5000

export class KiBruecke {
  private quelle: EreignisQuelle | null = null
  private verbindungId: string | null = null
  private zustand: KiBrueckenZustand = { verbunden: false, client: null }
  private listeners = new Set<Listener>()
  private zuletztAktivGemeldet = 0
  private readonly ausfuehren: (aufruf: KiAufruf) => Promise<KiAntwort>
  private readonly oeffne: (url: string) => EreignisQuelle

  constructor(
    ausfuehren: (aufruf: KiAufruf) => Promise<KiAntwort>,
    oeffne: (url: string) => EreignisQuelle = (url) => new EventSource(url),
  ) {
    this.ausfuehren = ausfuehren
    this.oeffne = oeffne
  }

  getZustand(): KiBrueckenZustand {
    return this.zustand
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private setze(patch: Partial<KiBrueckenZustand>) {
    this.zustand = { ...this.zustand, ...patch }
    for (const l of this.listeners) l(this.zustand)
  }

  starte(): void {
    if (this.quelle) return
    const quelle = this.oeffne(`${API_BASIS}/ki/ereignisse`)
    this.quelle = quelle
    quelle.addEventListener('verbunden', (e) => {
      const daten = JSON.parse(e.data) as { verbindungId: string; client: KiClient | null }
      this.verbindungId = daten.verbindungId
      this.setze({ verbunden: true, client: daten.client })
    })
    quelle.addEventListener('status', (e) => {
      this.setze({ client: (JSON.parse(e.data) as { client: KiClient | null }).client })
    })
    quelle.addEventListener('aufruf', (e) => {
      void this.beantworte(JSON.parse(e.data) as KiAufruf)
    })
    quelle.addEventListener('getrennt', () => this.stoppe())
    quelle.onerror = () => {
      this.verbindungId = null
      this.setze({ verbunden: false })
    }
  }

  stoppe(): void {
    this.quelle?.close()
    this.quelle = null
    this.verbindungId = null
    this.setze({ verbunden: false })
  }

  private async beantworte(aufruf: KiAufruf): Promise<void> {
    let antwort: KiAntwort
    try {
      antwort = await this.ausfuehren(aufruf)
    } catch (fehler) {
      antwort = { ok: false, fehler: fehler instanceof Error ? fehler.message : String(fehler) }
    }
    try {
      await sendeJson<void>('POST', `/ki/antwort/${encodeURIComponent(aufruf.aufrufId)}`, antwort)
    } catch {}
  }

  meldeAktiv(jetzt: number = Date.now()): void {
    if (!this.verbindungId || jetzt - this.zuletztAktivGemeldet < AKTIV_ABSTAND_MS) return
    this.zuletztAktivGemeldet = jetzt
    void sendeJson<void>('POST', `/ki/aktiv/${encodeURIComponent(this.verbindungId)}`).catch(
      () => undefined,
    )
  }
}
