import type { Tool } from '../tool'
import type { PotentiallisteObjekt } from '../../document-model'
import { STANDARD_TABELLEN_TEXTHOEHE, neueObjektBasis } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { t } from '../../sprache'

export function erzeugePotentiallistenTool(): Tool {
  return {
    id: 'potentialliste',
    get bezeichnung() {
      return t('werkzeugnamen.potentialliste')
    },
    kuerzel: 'PL',
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.potentialliste.status'))
    },
    onPointerDown(info, ctx) {
      const objekt: PotentiallisteObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'potentialliste',
        position: info.world,
        umfang: 'blatt',
        titel: null,
        textHoehe: STANDARD_TABELLEN_TEXTHOEHE,
      }
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.potentialliste.einsetzen'),
        ),
      )
      ctx.setAuswahl([objekt.id])
      ctx.zurueckZuAuswahl()
    },
  }
}
