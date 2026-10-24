import type { RoutingGrid, Zelle } from './grid'
import {
  ZELLART_BLOCKIERT,
  ZELLART_FREI,
  ZELLART_KORRIDOR,
  ZELLART_NAHE,
  ZELLART_WAND,
} from './grid'
import type { RoutingSettings } from './routing-settings'
import type { BelegungsKosten } from './belegung'
import { ACHSE_JE_RICHTUNG } from './belegung'

const WURZEL2 = Math.SQRT2

const RICHTUNGEN: { dx: number; dy: number }[] = [
  { dx: 1, dy: 0 },
  { dx: 1, dy: 1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: -1, dy: -1 },
  { dx: 0, dy: -1 },
  { dx: 1, dy: -1 },
]

const KEINE_RICHTUNG = 8
const ZUSTAENDE_JE_ZELLE = 9

function abbiegewinkel(von: number, nach: number): number {
  const diff = Math.abs(von - nach) % RICHTUNGEN.length
  const schritt = Math.min(diff, RICHTUNGEN.length - diff)
  return schritt * 45
}

const FREMDE_SEITE_AUFSCHLAG = 0.1

export interface WandKosten {
  korridorFaktor: number
  querungsKosten: number
  raumquerungsKosten?: number
}

class ZahlenHeap {
  private prios: number[] = []
  private werte: number[] = []

  get size(): number {
    return this.werte.length
  }

  push(prio: number, wert: number) {
    const prios = this.prios
    const werte = this.werte
    let i = werte.length
    prios.push(prio)
    werte.push(wert)
    while (i > 0) {
      const eltern = (i - 1) >> 1
      if (prios[eltern] <= prio) break
      prios[i] = prios[eltern]
      werte[i] = werte[eltern]
      i = eltern
    }
    prios[i] = prio
    werte[i] = wert
  }

  pop(): number {
    const prios = this.prios
    const werte = this.werte
    const oben = werte[0]
    const letztePrio = prios.pop() as number
    const letzterWert = werte.pop() as number
    const n = werte.length
    if (n > 0) {
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        if (l >= n) break
        const r = l + 1
        const kind = r < n && prios[r] < prios[l] ? r : l
        if (prios[kind] >= letztePrio) break
        prios[i] = prios[kind]
        werte[i] = werte[kind]
        i = kind
      }
      prios[i] = letztePrio
      werte[i] = letzterWert
    }
    return oben
  }
}

function oktileHeuristik(
  gx: number,
  gy: number,
  ziel: Zelle,
  zellgroesse: number,
  kostenProLaenge: number,
): number {
  const dx = Math.abs(gx - ziel.gx)
  const dy = Math.abs(gy - ziel.gy)
  const oktil = Math.max(dx, dy) - Math.min(dx, dy) + Math.min(dx, dy) * WURZEL2
  return oktil * zellgroesse * kostenProLaenge
}

function manhattanHeuristik(
  gx: number,
  gy: number,
  ziel: Zelle,
  zellgroesse: number,
  kostenProLaenge: number,
): number {
  return (Math.abs(gx - ziel.gx) + Math.abs(gy - ziel.gy)) * zellgroesse * kostenProLaenge
}

export function sucheGitterPfad(
  grid: RoutingGrid,
  start: Zelle,
  ziel: Zelle,
  settings: RoutingSettings,
  wand: WandKosten | null = null,
  nurRechtwinklig = false,
  belegung: BelegungsKosten | null = null,
  anfahrt: { start: number | null; ziel: number | null } | null = null,
): Zelle[] | null {
  if (grid.istBlockiert(start) || grid.istBlockiert(ziel)) return null
  if (start.gx === ziel.gx && start.gy === ziel.gy) return [start]

  const { breite, hoehe, zellArten, zellgroesse, startSeite } = grid
  const kostenProLaengeHeuristik =
    settings.kostenProLaenge * (wand ? Math.min(1, wand.korridorFaktor) : 1)
  const heuristik = nurRechtwinklig ? manhattanHeuristik : oktileHeuristik
  const schrittweite = nurRechtwinklig ? 2 : 1

  const anzahl = breite * hoehe * ZUSTAENDE_JE_ZELLE
  const gKosten = new Float32Array(anzahl)
  const status = new Uint8Array(anzahl)
  const BESUCHT = 16
  const GESCHLOSSEN = 32

  const zielIndex = ziel.gy * breite + ziel.gx
  const startZustand = (start.gy * breite + start.gx) * ZUSTAENDE_JE_ZELLE + KEINE_RICHTUNG
  status[startZustand] = BESUCHT
  const offen = new ZahlenHeap()
  offen.push(
    heuristik(start.gx, start.gy, ziel, zellgroesse, kostenProLaengeHeuristik),
    startZustand,
  )

  while (offen.size > 0) {
    const zustand = offen.pop()
    if (status[zustand] & GESCHLOSSEN) continue
    status[zustand] |= GESCHLOSSEN

    const zellIndex = (zustand / ZUSTAENDE_JE_ZELLE) | 0
    const richtungHer = zustand - zellIndex * ZUSTAENDE_JE_ZELLE
    if (zellIndex === zielIndex) return rekonstruierePfad(status, zustand, breite)

    const gx = zellIndex % breite
    const gy = (zellIndex - gx) / breite
    const gAktuell = gKosten[zustand]
    const aktuelleArt = zellArten[zellIndex]
    const aktuellInWand = aktuelleArt === ZELLART_WAND
    const aktuellAnWand =
      aktuellInWand || aktuelleArt === ZELLART_KORRIDOR || aktuelleArt === ZELLART_NAHE

    for (let richtung = 0; richtung < RICHTUNGEN.length; richtung += schrittweite) {
      if (anfahrt?.start != null && richtungHer === KEINE_RICHTUNG && richtung !== anfahrt.start)
        continue
      const winkel = richtungHer === KEINE_RICHTUNG ? 0 : abbiegewinkel(richtungHer, richtung)
      if (winkel > 90) continue
      const { dx, dy } = RICHTUNGEN[richtung]
      const nx = gx + dx
      const ny = gy + dy
      if (nx < 0 || ny < 0 || nx >= breite || ny >= hoehe) continue
      const naechsterIndex = ny * breite + nx
      if (anfahrt?.ziel != null && naechsterIndex === zielIndex && richtung !== anfahrt.ziel)
        continue
      const art = zellArten[naechsterIndex]
      if (art === ZELLART_BLOCKIERT) continue

      const abbiegeKosten =
        winkel === 90 ? settings.kosten90 : winkel === 45 ? settings.kosten45 : 0
      const schrittLaenge = (dx !== 0 && dy !== 0 ? WURZEL2 : 1) * zellgroesse
      let streckenKosten = schrittLaenge * settings.kostenProLaenge
      let querungsKosten = 0
      if (wand) {
        if (art === ZELLART_KORRIDOR) {
          streckenKosten *=
            !startSeite || startSeite[naechsterIndex]
              ? wand.korridorFaktor
              : Math.min(1, wand.korridorFaktor + FREMDE_SEITE_AUFSCHLAG)
        } else if (art === ZELLART_WAND && !aktuellInWand) querungsKosten = wand.querungsKosten
        else if (art === ZELLART_FREI && aktuellAnWand)
          querungsKosten = wand.raumquerungsKosten ?? 0
      }
      let belegungsKosten = 0
      if (belegung) {
        const achse = ACHSE_JE_RICHTUNG[richtung]
        const fremd = belegung.laengs[naechsterIndex]
        const meterKosten = schrittLaenge * settings.kostenProLaenge
        if (fremd & achse) belegungsKosten += meterKosten * belegung.laengsFaktor
        else if (fremd && !(belegung.laengs[zellIndex] & fremd))
          belegungsKosten += belegung.kreuzKosten
        if (belegung.nahe[naechsterIndex] & achse)
          belegungsKosten += meterKosten * belegung.naheFaktor
      }
      const neueKosten =
        gAktuell + streckenKosten + abbiegeKosten + querungsKosten + belegungsKosten

      const naechsterZustand = naechsterIndex * ZUSTAENDE_JE_ZELLE + richtung
      const s = status[naechsterZustand]
      if (s & GESCHLOSSEN) continue
      if (s & BESUCHT && neueKosten >= gKosten[naechsterZustand]) continue
      gKosten[naechsterZustand] = neueKosten
      status[naechsterZustand] = BESUCHT | richtungHer
      offen.push(
        neueKosten + heuristik(nx, ny, ziel, zellgroesse, kostenProLaengeHeuristik),
        naechsterZustand,
      )
    }
  }
  return null
}

function rekonstruierePfad(status: Uint8Array, zielZustand: number, breite: number): Zelle[] {
  const pfad: Zelle[] = []
  let zustand = zielZustand
  for (;;) {
    const zellIndex = (zustand / ZUSTAENDE_JE_ZELLE) | 0
    const richtung = zustand - zellIndex * ZUSTAENDE_JE_ZELLE
    const gx = zellIndex % breite
    const gy = (zellIndex - gx) / breite
    pfad.push({ gx, gy })
    if (richtung === KEINE_RICHTUNG) break
    const { dx, dy } = RICHTUNGEN[richtung]
    const vorgaengerIndex = (gy - dy) * breite + (gx - dx)
    zustand = vorgaengerIndex * ZUSTAENDE_JE_ZELLE + (status[zustand] & 15)
  }
  return pfad.reverse()
}
