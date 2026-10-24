import type { Tool } from '../tool'
import type { RaumlisteObjekt } from '../../document-model'
import { STANDARD_TABELLEN_TEXTHOEHE, neueObjektBasis } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { t } from '../../sprache'

export function erzeugeRaumlistenTool(): Tool {
  return {
    id: 'raumliste',
    get bezeichnung() {
      return t('werkzeugnamen.raumliste')
    },
    kuerzel: 'RL',
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.raumliste.status'))
    },
    onPointerDown(info, ctx) {
      const objekt: RaumlisteObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'raumliste',
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
          t('werkzeuge.raumliste.einsetzen'),
        ),
      )
      ctx.setAuswahl([objekt.id])
      ctx.zurueckZuAuswahl()
    },
  }
}
