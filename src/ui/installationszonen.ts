import {
  alleZonen,
  brauchtRaumhoehe,
  hoeheDerZone,
  RUECKFALL_RAUMHOEHE_METER,
  DECKENSTAERKE_ANNAHME_METER,
  zonenDefinition,
  zonenText as zonenBezeichnung,
  type Installationszone,
  type ZonenBauteil,
  type ZonenDefinition,
} from '../document-model'
import { oberflaechensprache, t } from '../sprache'
import type { Schluessel, Sprache } from '../sprache'

export const BAUTEIL_TEXT: Record<ZonenBauteil, Schluessel> = {
  wand: 'katalogdialoge.installationszonen.bauteilWand',
  decke: 'katalogdialoge.installationszonen.bauteilDecke',
  boden: 'katalogdialoge.installationszonen.bauteilBoden',
}

export function geltendeZonen(
  eigene: readonly ZonenDefinition[] = [],
  bestand: readonly ZonenDefinition[] = [],
): ZonenDefinition[] {
  const zonen = new Map(alleZonen(eigene).map((z) => [z.id, z]))
  for (const z of bestand) {
    const vorhanden = zonen.get(z.id)
    if (vorhanden?.herkunft === 'standard') zonen.set(z.id, { ...vorhanden, aktiv: z.aktiv })
    else if (z.herkunft === 'benutzer') zonen.set(z.id, z)
  }
  return [...zonen.values()]
}

export function zonenAuswahl(
  eigene: readonly ZonenDefinition[] = [],
  {
    bestand = [],
    bauteile,
    aktuelle = [],
  }: {
    bestand?: readonly ZonenDefinition[]
    bauteile?: readonly ZonenBauteil[]
    aktuelle?: readonly (Installationszone | undefined)[]
  } = {},
): ZonenDefinition[] {
  const hoehe = (z: ZonenDefinition) =>
    hoeheDerZone(z, RUECKFALL_RAUMHOEHE_METER, DECKENSTAERKE_ANNAHME_METER) ?? 0
  return geltendeZonen(eigene, bestand)
    .filter((z) => z.aktiv || aktuelle.includes(z.id))
    .filter((z) => !bauteile || bauteile.includes(z.bauteil))
    .map((z, index) => ({ z, index }))
    .sort(
      (a, b) =>
        (a.z.sortierung ?? 0) - (b.z.sortierung ?? 0) ||
        hoehe(b.z) - hoehe(a.z) ||
        a.index - b.index,
    )
    .map(({ z }) => z)
}

export function zonenBeschreibung(zone: ZonenDefinition): string {
  const cm = (m: number) =>
    t('katalogdialoge.installationszonen.zentimeter', { wert: Math.round(m * 1000) / 10 })
  const bauteil = t(BAUTEIL_TEXT[zone.bauteil])
  const art =
    zone.verlegung === 'auf'
      ? t('katalogdialoge.installationszonen.artAuf')
      : zone.tiefe === undefined
        ? zone.bauteil === 'decke'
          ? t('katalogdialoge.installationszonen.artInRohdecke')
          : t('katalogdialoge.installationszonen.artIn')
        : t('katalogdialoge.installationszonen.artInTiefe', { tiefe: cm(zone.tiefe) })
  if (zone.bauteil !== 'wand' || !zone.hoehe)
    return t('katalogdialoge.installationszonen.beschreibung', { bauteil, art })
  const abstand = cm(zone.hoehe.abstand)
  const hoehe =
    zone.hoehe.bezug === 'decke'
      ? t('katalogdialoge.installationszonen.hoeheUnterDecke', { abstand })
      : t('katalogdialoge.installationszonen.hoeheUeberBoden', { abstand })
  return t('katalogdialoge.installationszonen.beschreibungMitHoehe', { bauteil, art, hoehe })
}

export function zonenAnzeige(
  zone: ZonenDefinition,
  sprache: Sprache = oberflaechensprache(),
): string {
  return zonenBezeichnung(zone, sprache)
}

export function zonenText(
  zone: Installationszone | undefined,
  eigene: readonly ZonenDefinition[] = [],
  sprache: Sprache = oberflaechensprache(),
): string {
  if (zone === undefined) return t('katalogdialoge.installationszonen.keineAngabe')
  const definition = zonenDefinition(zone, eigene)
  return definition
    ? zonenAnzeige(definition, sprache)
    : t('katalogdialoge.installationszonen.unbekannt', { zone })
}

export function zoneBrauchtRaumhoehe(
  zone: Installationszone | undefined,
  eigene: readonly ZonenDefinition[] = [],
): boolean {
  return brauchtRaumhoehe(zonenDefinition(zone, eigene))
}
