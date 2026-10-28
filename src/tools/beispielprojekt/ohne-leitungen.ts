import type { Zeichnung } from '../../document-model'
import { abgeglicheneKabeltypen } from '../../document-model'

export function ohneLeitungenUndTrunks(zeichnung: Zeichnung): Zeichnung {
  const ohne: Zeichnung = {
    ...zeichnung,
    blaetter: zeichnung.blaetter.map((blatt) => ({
      ...blatt,
      objekte: blatt.objekte
        .filter((o) => o.type !== 'leitung' && o.type !== 'trunk')
        .map((o) => {
          if (o.type !== 'kabelschacht' || !o.strangNamen) return o
          const { strangNamen: _verwaist, ...schacht } = o
          return schacht
        }),
    })),
  }
  return { ...ohne, kabeltypen: abgeglicheneKabeltypen(ohne, []) }
}
