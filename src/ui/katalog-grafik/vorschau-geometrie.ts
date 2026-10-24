import type { DockpunkteKonfiguration, Fangpunkt, FreierDockpunkt } from '../../document-model'
import { portRasterLayout } from '../../document-model'

export const SYMBOL_VORSCHAU_HOEHE = 160

export function symbolVorschauBreite(breitenFaktor: number | undefined): number {
  return SYMBOL_VORSCHAU_HOEHE * (breitenFaktor ?? 1)
}

export function symbolVorschauHoehe(hoehenFaktor: number | undefined): number {
  return SYMBOL_VORSCHAU_HOEHE * (hoehenFaktor ?? 1)
}

export function rundeAnteil(wert: number): number {
  return Math.round(wert * 1000) / 1000
}

const STANDARD_8_PUNKTE: readonly FreierDockpunkt[] = [
  { xAnteil: 0, yAnteil: 0 }, // Ecke unten links
  { xAnteil: 0.5, yAnteil: 0 }, // Kante unten Mitte
  { xAnteil: 1, yAnteil: 0 }, // Ecke unten rechts
  { xAnteil: 1, yAnteil: 0.5 }, // Kante rechts Mitte
  { xAnteil: 1, yAnteil: 1 }, // Ecke oben rechts
  { xAnteil: 0.5, yAnteil: 1 }, // Kante oben Mitte
  { xAnteil: 0, yAnteil: 1 }, // Ecke oben links
  { xAnteil: 0, yAnteil: 0.5 }, // Kante links Mitte
]

export function standardDockpunkte(): FreierDockpunkt[] {
  return STANDARD_8_PUNKTE.map((p) => ({ ...p }))
}

export function dockpunktAnteile(dockpunkte: DockpunkteKonfiguration | undefined): Fangpunkt[] {
  if (!dockpunkte) return standardDockpunkte()
  if (dockpunkte.modus === 'frei') return dockpunkte.punkte
  const raster = portRasterLayout(dockpunkte)
  return [...raster.ports, ...raster.trunkPunkte]
}

const FANGPUNKT_EINRASTEN_EINHEITEN = 10

export function rasteFangpunktEin(
  xAnteil: number,
  yAnteil: number,
  kandidaten: readonly Fangpunkt[],
  breitenFaktor: number | undefined,
  hoehenFaktor?: number,
): Fangpunkt {
  const breite = symbolVorschauBreite(breitenFaktor)
  const hoehe = symbolVorschauHoehe(hoehenFaktor)
  let bester: Fangpunkt | null = null
  let besteDistanz = FANGPUNKT_EINRASTEN_EINHEITEN
  for (const kandidat of [...kandidaten, { xAnteil: 0.5, yAnteil: 0.5 }]) {
    const d = Math.hypot(
      (kandidat.xAnteil - xAnteil) * breite,
      (kandidat.yAnteil - yAnteil) * hoehe,
    )
    if (d <= besteDistanz) {
      besteDistanz = d
      bester = kandidat
    }
  }
  return bester
    ? { xAnteil: bester.xAnteil, yAnteil: bester.yAnteil }
    : { xAnteil: rundeAnteil(xAnteil), yAnteil: rundeAnteil(yAnteil) }
}
