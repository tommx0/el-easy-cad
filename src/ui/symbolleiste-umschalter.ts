import type { Befehlsaktion } from './befehle/aktionen'

export interface GruppenUmschalter {
  id: string
  aktion: Befehlsaktion
}

export function istUmschalter(aktion: Befehlsaktion): boolean {
  return aktion.haken !== undefined
}

export function zeigtAlleSchalter(eintraege: readonly GruppenUmschalter[]): boolean {
  return eintraege.filter((e) => istUmschalter(e.aktion)).length >= 2
}

export function umzuschaltende(
  eintraege: readonly GruppenUmschalter[],
  ziel: boolean,
  erledigt: ReadonlySet<string> = new Set(),
): GruppenUmschalter[] {
  return eintraege.filter(
    (e) =>
      istUmschalter(e.aktion) &&
      !e.aktion.deaktiviert &&
      e.aktion.haken !== ziel &&
      !erledigt.has(e.id),
  )
}
