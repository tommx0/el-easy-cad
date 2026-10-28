import type { BlattGeschoss, LeitungsObjekt, ZonenDefinition } from '../document-model'
import { DECKENSTAERKE_ANNAHME_METER, giltNurInBauteilen, zonenHoeheMeter } from '../document-model'
import type { RoutingAufruf, RoutingSettings } from './routing-settings'

export function fuerLeitung(
  settings: RoutingSettings,
  leitung: Pick<LeitungsObjekt, 'nurInBauteilen' | 'installationszone'> | undefined,
  geschoss: BlattGeschoss | undefined,
  eigene: readonly ZonenDefinition[] = [],
): RoutingAufruf {
  const hoehe = zonenHoeheMeter(
    geschoss,
    leitung?.installationszone ?? geschoss?.installationszone,
    geschoss?.deckenstaerke ?? DECKENSTAERKE_ANNAHME_METER,
    eigene,
  )
  const nurInBauteilen = giltNurInBauteilen(leitung ?? {}, geschoss, eigene)
  if (!nurInBauteilen && hoehe === null) return settings
  return {
    ...settings,
    ...(nurInBauteilen && { nurInBauteilen: true }),
    ...(hoehe !== null && { leitungHoeheMeter: hoehe }),
  }
}
