import {
  type GeraeteRegelwerk,
  geraeteRegelwerkSchema,
  STANDARD_REGELWERK,
} from '../document-model'
import rohdaten from './seed-data/geraete-regelwerk.json'

export const MITGELIEFERTES_REGELWERK: GeraeteRegelwerk = (() => {
  const ergebnis = geraeteRegelwerkSchema.safeParse(rohdaten)
  if (ergebnis.success) return ergebnis.data
  console.error('seed-data/geraete-regelwerk.json ist ungueltig', ergebnis.error)
  return STANDARD_REGELWERK
})()
