import {
  grundrissEbenenName,
  ifcGruppenEbenenName,
  type HintergrundHerkunft,
} from '../document-model'
import { t } from '../sprache'
import type { Uebersetzer } from '../sprache'

export function umwandelnBlattText(
  typ: HintergrundHerkunft,
  anzahl: number,
  tp?: Uebersetzer,
): string {
  const werte = { grundriss: grundrissEbenenName(tp), beispiel: ifcGruppenEbenenName('waende', tp) }
  return [
    t('aktionen.umwandeln.einBlatt', { anzahl }),
    t(
      typ === 'ifc' ? 'aktionen.umwandeln.ebeneGruppen' : 'aktionen.umwandeln.ebeneGrundriss',
      werte,
    ),
    t(`aktionen.umwandeln.verbleib.${typ}`),
  ].join(' ')
}
