import type { Tool } from '../tool'
import type { AktorkanallisteObjekt } from '../../document-model'
import { STANDARD_TABELLEN_TEXTHOEHE, neueObjektBasis } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { t } from '../../sprache'

export function erzeugeAktorkanallistenTool(): Tool {
  return {
    id: 'aktorkanalliste',
    get bezeichnung() {
      return t('werkzeugnamen.aktorkanalliste')
    },
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.aktorkanalliste.status'))
    },
    onPointerDown(info, ctx) {
      const objekt: AktorkanallisteObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'aktorkanalliste',
        position: info.world,
        verteiler: null,
        titel: null,
        textHoehe: STANDARD_TABELLEN_TEXTHOEHE,
      }
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.aktorkanalliste.einsetzen'),
        ),
      )
      ctx.setAuswahl([objekt.id])
      ctx.zurueckZuAuswahl()
    },
  }
}
