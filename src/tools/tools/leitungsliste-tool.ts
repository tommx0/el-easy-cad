import type { Tool } from '../tool'
import type { LeitungslisteObjekt } from '../../document-model'
import { STANDARD_TABELLEN_TEXTHOEHE, neueObjektBasis } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { t } from '../../sprache'

export function erzeugeLeitungslistenTool(): Tool {
  return {
    id: 'leitungsliste',
    get bezeichnung() {
      return t('werkzeugnamen.leitungsliste')
    },
    kuerzel: 'F',
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.leitungsliste.status'))
    },
    onPointerDown(info, ctx) {
      const objekt: LeitungslisteObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'leitungsliste',
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
          t('werkzeuge.leitungsliste.einsetzen'),
        ),
      )
      ctx.setAuswahl([objekt.id])
      ctx.zurueckZuAuswahl()
    },
  }
}
