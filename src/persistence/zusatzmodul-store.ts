import type { ZusatzmodulEintrag, ZusatzmodulVorschau } from '../document-model'
import { API_BASIS, holeJson, sendeDatei, sendeJson } from './api-client'
import { waehleDatei } from './projekt-austausch'

const PAKET_TYP = 'application/octet-stream'

export function ladeZusatzmodule(): Promise<ZusatzmodulEintrag[]> {
  return holeJson<ZusatzmodulEintrag[]>('/zusatzmodule')
}

export function waehleZusatzmodulPaket(): Promise<File | null> {
  return waehleDatei('.eecmod,.zip,application/zip')
}

export function pruefeZusatzmodulPaket(datei: Blob): Promise<ZusatzmodulVorschau> {
  return sendeDatei<ZusatzmodulVorschau>('/zusatzmodule/vorschau', datei, PAKET_TYP)
}

export function installiereZusatzmodul(datei: Blob): Promise<ZusatzmodulEintrag> {
  return sendeDatei<ZusatzmodulEintrag>('/zusatzmodule', datei, PAKET_TYP)
}

export function setzeZusatzmodulAktiv(
  kennung: string,
  aktiv: boolean,
  fehler: string | null = null,
): Promise<ZusatzmodulEintrag> {
  return sendeJson<ZusatzmodulEintrag>('PUT', `/zusatzmodule/${encodeURIComponent(kennung)}`, {
    aktiv,
    fehler,
  })
}

export function entferneZusatzmodul(kennung: string): Promise<unknown> {
  return sendeJson('DELETE', `/zusatzmodule/${encodeURIComponent(kennung)}`)
}

export function zusatzmodulDateiUrl(kennung: string, version: string, pfad: string): string {
  const teile = pfad.split('/').map(encodeURIComponent).join('/')
  return `${API_BASIS}/zusatzmodule/${encodeURIComponent(kennung)}/${encodeURIComponent(version)}/${teile}`
}

export async function ladeZusatzmodulCode(kennung: string, version: string): Promise<unknown> {
  return (await import(
    /* @vite-ignore */ zusatzmodulDateiUrl(kennung, version, 'modul.js')
  )) as unknown
}

export async function ladeZusatzmodulTexte(
  kennung: string,
  version: string,
  sprache: string,
): Promise<Record<string, string>> {
  try {
    const antwort = await fetch(zusatzmodulDateiUrl(kennung, version, `texte/${sprache}.json`))
    if (!antwort.ok) return {}
    const roh = (await antwort.json()) as unknown
    if (typeof roh !== 'object' || roh === null) return {}
    return Object.fromEntries(
      Object.entries(roh).filter((e): e is [string, string] => typeof e[1] === 'string'),
    )
  } catch {
    return {}
  }
}
