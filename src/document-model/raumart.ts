import type { Uebersetzer } from '../sprache'
import { t } from '../sprache'

export const RAUMART_IDS = [
  'kueche',
  'bad',
  'wc',
  'kind',
  'schlafen',
  'arbeiten',
  'wohnen',
  'essen',
  'hauswirtschaft',
  'hobby',
  'flur',
  'freisitz',
  'abstell',
  'keller',
  'sonstige',
] as const

export type RaumartId = (typeof RAUMART_IDS)[number]

export function istRaumartId(wert: unknown): wert is RaumartId {
  return typeof wert === 'string' && (RAUMART_IDS as readonly string[]).includes(wert)
}

export function raumartName(raumart: RaumartId, uebersetze: Uebersetzer = t): string {
  return uebersetze(`beschriftung.raumart.${raumart}`)
}

export function raumNameNachRaumartWechsel(
  name: string,
  alteRaumart: RaumartId | undefined,
  neueRaumart: RaumartId | undefined,
  uebersetze: Uebersetzer,
): string {
  if (!neueRaumart) return name
  const aktuell = name.trim()
  const istVorgabe =
    aktuell === '' ||
    aktuell === uebersetze('beschriftung.raum.vorgabeName') ||
    (alteRaumart !== undefined && aktuell === raumartName(alteRaumart, uebersetze))
  return istVorgabe ? raumartName(neueRaumart, uebersetze) : name
}
