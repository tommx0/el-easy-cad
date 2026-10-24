import type { Tool } from '../tool'
import type { TrunklisteObjekt } from '../../document-model'
import { STANDARD_TABELLEN_TEXTHOEHE, neueObjektBasis } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { t } from '../../sprache'

export function erzeugeTrunklistenTool(): Tool {
  return {
    id: 'trunkliste',
    get bezeichnung() {
      return t('werkzeugnamen.trunkliste')
    },
    kuerzel: 'J',
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.trunkliste.status'))
    },
    onPointerDown(info, ctx) {
      const objekt: TrunklisteObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'trunkliste',
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
          t('werkzeuge.trunkliste.einsetzen'),
        ),
      )
      ctx.setAuswahl([objekt.id])
      ctx.zurueckZuAuswahl()
    },
  }
}
