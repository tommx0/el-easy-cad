import type { Fangart } from '../tools'
import { t } from '../sprache'

export function fangartName(art: Fangart): string {
  return t(`befehle.fangart.${art}`)
}

export const FANGART_BEFEHL_ID: Record<Fangart, string> = {
  endpunkt: 'ansicht.objektfang-endpunkt',
  mitte: 'ansicht.objektfang-mitte',
  zentrum: 'ansicht.objektfang-zentrum',
  quadrant: 'ansicht.objektfang-quadrant',
  dock: 'ansicht.objektfang-dock',
  schnitt: 'ansicht.objektfang-schnitt',
  naechster: 'ansicht.objektfang-naechster',
}
