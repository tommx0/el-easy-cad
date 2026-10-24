export type AnordnenRichtung = 'automatisch' | 'oben-unten' | 'links-rechts'
export type KreuzungsVermeidung = 'gering' | 'mittel' | 'stark' | 'immer'
export type AnordnenLage = 'ecke' | 'mitte'

export interface AnordnenEinstellungen {
  richtung: AnordnenRichtung
  lageBeruecksichtigen: boolean
  kinderSeitlich: boolean
  komponentenAbstandCm: number | null
  reihenAbstandCm: number | null
  bahnabstandMm: number | null
  kreuzungen: KreuzungsVermeidung
  nurRechtwinklig: boolean
  buendeln: boolean
  raster: boolean
  lage: AnordnenLage
  trunksBilden: boolean
  trunkMindestLeitungen: number
  trunkMindestLaengeM: number
}

export const STANDARD_ANORDNEN_EINSTELLUNGEN: AnordnenEinstellungen = {
  richtung: 'automatisch',
  lageBeruecksichtigen: false,
  kinderSeitlich: true,
  komponentenAbstandCm: null,
  reihenAbstandCm: null,
  bahnabstandMm: null,
  kreuzungen: 'stark',
  nurRechtwinklig: true,
  buendeln: true,
  raster: true,
  lage: 'ecke',
  trunksBilden: true,
  trunkMindestLeitungen: 5,
  trunkMindestLaengeM: 2,
}

export const KREUZ_FAKTOR: Record<KreuzungsVermeidung, number> = {
  gering: 1,
  mittel: 4,
  stark: 20,
  immer: 200,
}

export const SCHALTPLAN_BAHNABSTAND_MM = 2.5
export const BAUPLAN_BAHNABSTAND_MM = 2

export function vervollstaendigeAnordnenEinstellungen(
  gespeichert: Partial<AnordnenEinstellungen> | undefined,
): AnordnenEinstellungen {
  return { ...STANDARD_ANORDNEN_EINSTELLUNGEN, ...gespeichert }
}
