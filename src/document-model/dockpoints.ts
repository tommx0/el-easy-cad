import type { Point } from './geometry'
import { distance, rotatePoint } from './geometry'
import type {
  DockpunkteKonfiguration,
  Fangpunkt,
  FreierDockpunkt,
  PortGruppe,
  PortsDockpunkteKonfiguration,
} from './catalog'
import type { KomponentenObjekt } from './objekte'

const PORT_RAND_ANTEIL = 0.1
const PORT_REIHEN_ABSTAND_ANTEIL = 0.16
const PORT_GRUPPEN_LUECKE_EINHEITEN = 1.2

export function getDockpoints(instanz: KomponentenObjekt): Point[] {
  const halbX = (instanz.breiteWelt ?? instanz.groesseWelt) / 2
  const halbY = instanz.groesseWelt / 2
  const { x, y } = instanz.position
  const lokalePunkte: Point[] = instanz.dockpunkte
    ? instanz.dockpunkte.modus === 'frei'
      ? getFreieDockpoints(instanz, instanz.dockpunkte.punkte)
      : getPortDockpoints(instanz, instanz.dockpunkte)
    : [
        { x: x - halbX, y: y - halbY }, // Ecke unten links
        { x, y: y - halbY }, // Kante unten Mitte
        { x: x + halbX, y: y - halbY }, // Ecke unten rechts
        { x: x + halbX, y }, // Kante rechts Mitte
        { x: x + halbX, y: y + halbY }, // Ecke oben rechts
        { x, y: y + halbY }, // Kante oben Mitte
        { x: x - halbX, y: y + halbY }, // Ecke oben links
        { x: x - halbX, y }, // Kante links Mitte
      ]
  if (instanz.drehung === 0) return lokalePunkte
  return lokalePunkte.map((p) => rotatePoint(p, instanz.position, instanz.drehung))
}

function baueZeilen(gruppen: PortGruppe[]): number[][] {
  const gemeinsameZeile: number[] = []
  const eigeneZeilen: number[][] = []
  for (const gruppe of gruppen) {
    const reihen = gruppe.reihen ?? 1
    if (reihen > 1) {
      const proReihe = Math.round(gruppe.anzahl / reihen)
      for (let r = 0; r < reihen; r++) eigeneZeilen.push([proReihe])
    } else {
      gemeinsameZeile.push(gruppe.anzahl)
    }
  }
  return gemeinsameZeile.length > 0 ? [gemeinsameZeile, ...eigeneZeilen] : eigeneZeilen
}

function anteileInZeile(counts: number[]): number[] {
  const indices: number[] = []
  let idx = 0
  let ersterPort = true
  for (let gi = 0; gi < counts.length; gi++) {
    for (let p = 0; p < counts[gi]; p++) {
      if (!ersterPort) {
        idx += 1 + (p === 0 && gi > 0 ? PORT_GRUPPEN_LUECKE_EINHEITEN : 0)
      }
      indices.push(idx)
      ersterPort = false
    }
  }
  const spanne = indices.length > 0 ? indices[indices.length - 1] : 0
  if (spanne === 0) return indices.map(() => 0.5)
  return indices.map((i) => i / spanne)
}

export interface PortRasterPunkt {
  index: number
  xAnteil: number
  yAnteil: number
  zeile: number | null
}

export interface PortRaster {
  ports: PortRasterPunkt[]
  trunkPunkte: PortRasterPunkt[]
  zeilenAnzahl: number
}

export function portRasterLayout(config: PortsDockpunkteKonfiguration): PortRaster {
  const zeilen = baueZeilen(config.gruppen)
  const nutzbareBreite = 1 - 2 * PORT_RAND_ANTEIL
  const ports: PortRasterPunkt[] = []
  zeilen.forEach((counts, zeilenIndex) => {
    for (const anteil of anteileInZeile(counts)) {
      ports.push({
        index: ports.length,
        xAnteil: PORT_RAND_ANTEIL + anteil * nutzbareBreite,
        yAnteil: PORT_RAND_ANTEIL + zeilenIndex * PORT_REIHEN_ABSTAND_ANTEIL,
        zeile: zeilenIndex,
      })
    }
  })
  const trunkPunkte: PortRasterPunkt[] = (config.trunkPunkte ?? []).map((punkt, i) => ({
    index: ports.length + i,
    xAnteil: PORT_RAND_ANTEIL + punkt.xAnteil * nutzbareBreite,
    yAnteil: 1 - PORT_RAND_ANTEIL,
    zeile: null,
  }))
  return { ports, trunkPunkte, zeilenAnzahl: zeilen.length }
}

function getPortDockpoints(
  instanz: KomponentenObjekt,
  config: PortsDockpunkteKonfiguration,
): Point[] {
  const breiteWelt = instanz.breiteWelt ?? instanz.groesseWelt
  const linkeKante = instanz.position.x - breiteWelt / 2
  const untereKante = instanz.position.y - instanz.groesseWelt / 2
  const raster = portRasterLayout(config)
  return [...raster.ports, ...raster.trunkPunkte].map((punkt) => ({
    x: linkeKante + punkt.xAnteil * breiteWelt,
    y: untereKante + punkt.yAnteil * instanz.groesseWelt,
  }))
}

function gesamtPortAnzahl(gruppen: PortGruppe[]): number {
  return gruppen.reduce((summe, gruppe) => summe + gruppe.anzahl, 0)
}

function getFreieDockpoints(instanz: KomponentenObjekt, punkte: FreierDockpunkt[]): Point[] {
  const breiteWelt = instanz.breiteWelt ?? instanz.groesseWelt
  const linkeKante = instanz.position.x - breiteWelt / 2
  const untereKante = instanz.position.y - instanz.groesseWelt / 2
  return punkte.map((punkt) => ({
    x: linkeKante + punkt.xAnteil * breiteWelt,
    y: untereKante + punkt.yAnteil * instanz.groesseWelt,
  }))
}

const MITTE: Fangpunkt = { xAnteil: 0.5, yAnteil: 0.5 }

export function standardFangpunkt(dockpunkte: DockpunkteKonfiguration | undefined): Fangpunkt {
  if (!dockpunkte) return MITTE
  if (dockpunkte.modus === 'ports') {
    const erster = portRasterLayout(dockpunkte).ports[0]
    return erster ? { xAnteil: erster.xAnteil, yAnteil: erster.yAnteil } : MITTE
  }
  const erster = dockpunkte.punkte.find((punkt) => !punkt.trunk)
  return erster ? { xAnteil: erster.xAnteil, yAnteil: erster.yAnteil } : MITTE
}

export function getFangpunkt(instanz: KomponentenObjekt): Point {
  const anteil = instanz.fangpunkt ?? standardFangpunkt(instanz.dockpunkte)
  const lokal = getFreieDockpoints(instanz, [anteil])[0]
  if (instanz.drehung === 0) return lokal
  return rotatePoint(lokal, instanz.position, instanz.drehung)
}

export function positionFuerFangpunkt(instanz: KomponentenObjekt, ziel: Point): Point {
  const fangpunkt = getFangpunkt(instanz)
  return {
    x: ziel.x - (fangpunkt.x - instanz.position.x),
    y: ziel.y - (fangpunkt.y - instanz.position.y),
  }
}

export function istTrunkDockpunkt(instanz: KomponentenObjekt, index: number): boolean {
  if (!instanz.dockpunkte) return false
  if (instanz.dockpunkte.modus === 'frei') return instanz.dockpunkte.punkte[index]?.trunk === true
  if (!instanz.dockpunkte.trunkPunkte?.length) return false
  const portAnzahl = gesamtPortAnzahl(instanz.dockpunkte.gruppen)
  return index >= portAnzahl && index < portAnzahl + instanz.dockpunkte.trunkPunkte.length
}

export interface DockpunktTreffer {
  objektId: string
  dockpunktIndex: number
  punkt: Point
}

export function findeNaechstenDockpunkt(
  komponenten: KomponentenObjekt[],
  punkt: Point,
  toleranz: number,
  art: 'leitung' | 'trunk' = 'leitung',
  angeboten?: (komponente: KomponentenObjekt) => readonly number[] | null,
): DockpunktTreffer | null {
  let bester: DockpunktTreffer | null = null
  let besteDistanz = toleranz
  for (const komponente of komponenten) {
    if (komponente.traegerId !== undefined) continue
    const dockpunkte = getDockpoints(komponente)
    const erlaubt = angeboten?.(komponente) ?? null
    for (let i = 0; i < dockpunkte.length; i++) {
      if (erlaubt && !erlaubt.includes(i)) continue
      const istTrunkPunkt = istTrunkDockpunkt(komponente, i)
      if (art === 'trunk' ? !istTrunkPunkt : istTrunkPunkt) continue
      const d = distance(punkt, dockpunkte[i])
      if (d <= besteDistanz) {
        besteDistanz = d
        bester = { objektId: komponente.id, dockpunktIndex: i, punkt: dockpunkte[i] }
      }
    }
  }
  return bester
}

export function gruppiereBenachbarteDockpunkte(
  komponente: KomponentenObjekt,
  startIndex: number,
  polzahl: number,
): number[] {
  const gesamt = getDockpoints(komponente).length
  const indizes: number[] = []
  for (let i = startIndex; i < gesamt && indizes.length < polzahl; i++) {
    if (istTrunkDockpunkt(komponente, i)) break
    indizes.push(i)
  }
  return indizes
}
