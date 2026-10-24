import type { BlattGeschoss, LeitungsObjekt, ZonenDefinition } from '../document-model'
import { giltNurInBauteilen } from '../document-model'
import type { RoutingAufruf, RoutingSettings } from './routing-settings'

export function fuerLeitung(
  settings: RoutingSettings,
  leitung: Pick<LeitungsObjekt, 'nurInBauteilen' | 'installationszone'> | undefined,
  geschoss: BlattGeschoss | undefined,
  eigene: readonly ZonenDefinition[] = [],
): RoutingAufruf {
  return giltNurInBauteilen(leitung ?? {}, geschoss, eigene)
    ? { ...settings, nurInBauteilen: true }
    : settings
}
