import type { Tool } from '../tool'
import type { PlankopfObjekt } from '../../document-model'
import {
  PLANKOPF_STANDARD_BREITE_MM,
  erzeugeDinPlankopfZeilen,
  neueObjektBasis,
  planspracheVon,
} from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { t } from '../../sprache'

export function erzeugePlankopfTool(): Tool {
  return {
    id: 'plankopf',
    get bezeichnung() {
      return t('werkzeugnamen.plankopf')
    },
    kuerzel: 'Q',
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.plankopf.status'))
    },
    onPointerDown(info, ctx) {
      const objekt: PlankopfObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'plankopf',
        position: info.world,
        breiteMm: PLANKOPF_STANDARD_BREITE_MM,
        zeilen: erzeugeDinPlankopfZeilen(new Date(), planspracheVon(ctx.doc.getZeichnung())),
      }
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.plankopf.einsetzen'),
        ),
      )
      ctx.setAuswahl([objekt.id])
      ctx.zurueckZuAuswahl()
    },
  }
}
