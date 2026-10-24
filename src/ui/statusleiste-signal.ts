import type { Point } from '../document-model'
import type { KonstruktionsMass, MassEingabe } from '../tools'

export interface ZeigerStand {
  welt: Point | null
  zoomProzent: number
  mass: KonstruktionsMass | null
  netzfeld: string | null
}

let letzter: ZeigerStand = { welt: null, zoomProzent: 100, mass: null, netzfeld: null }
const hoerer = new Set<(stand: ZeigerStand) => void>()

export function meldeZeigerStand(stand: ZeigerStand) {
  letzter = stand
  for (const h of hoerer) h(stand)
}

export function letzterZeigerStand(): ZeigerStand {
  return letzter
}

export function abonniereZeigerStand(h: (stand: ZeigerStand) => void): () => void {
  hoerer.add(h)
  return () => {
    hoerer.delete(h)
  }
}

export type MassEingabeEreignis =
  | { art: 'aenderung'; eingabe: MassEingabe | null }
  | { art: 'bestaetigen'; eingabe: MassEingabe | null }

const eingabeHoerer = new Set<(ereignis: MassEingabeEreignis) => void>()

export function meldeMassEingabe(ereignis: MassEingabeEreignis) {
  for (const h of eingabeHoerer) h(ereignis)
}

export function abonniereMassEingabe(h: (ereignis: MassEingabeEreignis) => void): () => void {
  eingabeHoerer.add(h)
  return () => {
    eingabeHoerer.delete(h)
  }
}

const anforderungsHoerer = new Set<(zeichen: string) => void>()

export function fordereMassEingabeAn(zeichen: string) {
  for (const h of anforderungsHoerer) h(zeichen)
}

export function abonniereMassEingabeAnforderung(h: (zeichen: string) => void): () => void {
  anforderungsHoerer.add(h)
  return () => {
    anforderungsHoerer.delete(h)
  }
}
