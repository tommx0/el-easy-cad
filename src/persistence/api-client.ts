import type { LizenzModul } from '../document-model'
import { oberflaechensprache, t } from '../sprache'
export const API_BASIS = '/api'

export class ServerFehler extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, nachricht: string) {
    super(nachricht)
    this.name = 'ServerFehler'
    this.status = status
    this.code = code
  }

  get istKonflikt(): boolean {
    return this.status === 409
  }

  get istNichtGefunden(): boolean {
    return this.status === 404
  }
}

export class ServerNichtErreichbar extends Error {
  constructor(ursache?: unknown) {
    super(t('persistenz.apiClient.nichtErreichbar'))
    this.name = 'ServerNichtErreichbar'
    this.cause = ursache
  }
}

interface FehlerKoerper {
  fehler?: { code?: string; nachricht?: string }
}

async function wirfServerFehler(antwort: Response): Promise<never> {
  let code = 'unbekannt'
  let nachricht = t('persistenz.apiClient.serverAntwort', { status: String(antwort.status) })
  try {
    const koerper = (await antwort.json()) as FehlerKoerper
    if (koerper.fehler?.code) code = koerper.fehler.code
    if (koerper.fehler?.nachricht) nachricht = koerper.fehler.nachricht
  } catch {}
  throw new ServerFehler(antwort.status, code, nachricht)
}

async function hole(pfad: string, optionen: RequestInit = {}): Promise<Response> {
  let antwort: Response
  try {
    const kopf = new Headers(optionen.headers)
    if (!kopf.has('Accept-Language')) kopf.set('Accept-Language', oberflaechensprache())
    antwort = await fetch(`${API_BASIS}${pfad}`, { ...optionen, headers: kopf })
  } catch (ursache) {
    throw new ServerNichtErreichbar(ursache)
  }
  if (!antwort.ok) await wirfServerFehler(antwort)
  return antwort
}

export async function holeJson<T>(pfad: string): Promise<T> {
  const antwort = await hole(pfad)
  return (await antwort.json()) as T
}

export async function sendeJson<T>(
  methode: 'POST' | 'PUT' | 'DELETE',
  pfad: string,
  koerper?: unknown,
): Promise<T> {
  const antwort = await hole(pfad, {
    method: methode,
    headers: koerper === undefined ? undefined : { 'content-type': 'application/json' },
    body: koerper === undefined ? undefined : JSON.stringify(koerper),
  })
  if (antwort.status === 204) return undefined as T
  return (await antwort.json()) as T
}

export async function sendeDatei<T>(
  pfad: string,
  datei: Blob,
  mime = datei.type || 'application/octet-stream',
): Promise<T> {
  const antwort = await hole(pfad, {
    method: 'POST',
    headers: { 'content-type': mime },
    body: datei,
  })
  return (await antwort.json()) as T
}

export async function holeBlob(pfad: string): Promise<Blob> {
  const antwort = await hole(pfad)
  return await antwort.blob()
}

export async function optional<T>(arbeit: () => Promise<T>): Promise<T | undefined> {
  try {
    return await arbeit()
  } catch (fehler) {
    if (fehler instanceof ServerFehler && fehler.istNichtGefunden) return undefined
    throw fehler
  }
}

export interface ServerStatus {
  name: string
  version: string
  schemaVersion: number
  datenordner: string
  bestand: { projekte: number; dokumente: number; katalogKomponenten: number; assets: number }
}

export function holeServerStatus(): Promise<ServerStatus> {
  return holeJson<ServerStatus>('/status')
}

export type Betriebsmodus = 'lizenziert' | 'demo' | 'demo-abgelaufen' | 'gesperrt'

export interface ProduktlizenzStatus {
  status: 'fehlt' | 'ungueltig' | 'abgelaufen' | 'gueltig'
  lizenznehmer: string | null
  gueltigBis: string | null
  tageBisAblauf: number | null
  warnungBaldAblaufend: boolean
  betriebsmodus: Betriebsmodus
  resttageDemo: number | null
  details: LizenzDetails | null
  module?: LizenzModul[]
}

export type { LizenzModul }

export interface LizenzDetails {
  firma: string
  gueltigAb: string
}

export function holeProduktlizenzStatus(): Promise<ProduktlizenzStatus> {
  return holeJson<ProduktlizenzStatus>('/produktlizenz')
}

export function importiereProduktlizenz(lizenz: unknown): Promise<ProduktlizenzStatus> {
  return sendeJson<ProduktlizenzStatus>('POST', '/produktlizenz', lizenz)
}
