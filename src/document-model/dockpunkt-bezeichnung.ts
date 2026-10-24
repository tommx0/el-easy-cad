import type {
  DockpunktBeschriftung,
  DockpunkteKonfiguration,
  FreierDockpunkt,
  KatalogTextElement,
} from './catalog'

export const DOCKPUNKT_BESCHRIFTUNG_STANDARD: DockpunktBeschriftung = {
  groesseAnteil: 0.07,
  ausrichtungHorizontal: 'links',
  ausrichtungVertikal: 'unten',
  bildschirmVersatz: { x: 0.05, y: -0.04 },
}

export function dockpunktBezeichnung(
  konfiguration: DockpunkteKonfiguration | undefined,
  index: number,
): string | null {
  if (konfiguration?.modus !== 'frei') return null
  const text = konfiguration.punkte[index]?.bezeichnung?.trim()
  return text ? text : null
}

export function dockpunktBeschriftungAlsTextElement(
  punkt: FreierDockpunkt,
): KatalogTextElement | null {
  const text = punkt.bezeichnung?.trim()
  if (!text) return null
  const lage = punkt.beschriftung ?? DOCKPUNKT_BESCHRIFTUNG_STANDARD
  if (lage.ausblenden) return null
  return {
    xAnteil: lage.xAnteil ?? punkt.xAnteil,
    yAnteil: lage.yAnteil ?? punkt.yAnteil,
    text,
    groesseAnteil: lage.groesseAnteil,
    ausrichtungHorizontal: lage.ausrichtungHorizontal,
    ausrichtungVertikal: lage.ausrichtungVertikal,
    ...(lage.bildschirmVersatz ? { bildschirmVersatz: lage.bildschirmVersatz } : {}),
    ...(lage.beiDrehung ? { beiDrehung: lage.beiDrehung } : {}),
    ...(lage.farbe ? { farbe: lage.farbe } : {}),
  }
}

export function dockpunktBeschriftungen(
  konfiguration: DockpunkteKonfiguration | undefined,
): KatalogTextElement[] {
  if (konfiguration?.modus !== 'frei') return []
  return konfiguration.punkte.flatMap((p) => dockpunktBeschriftungAlsTextElement(p) ?? [])
}
