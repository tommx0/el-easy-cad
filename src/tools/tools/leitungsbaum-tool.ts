import type { Tool } from '../tool'
import type { LeitungsbaumObjekt } from '../../document-model'
import { STANDARD_BAUM_TEXTHOEHE, neueObjektBasis } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { t } from '../../sprache'

export function erzeugeLeitungsbaumTool(): Tool {
  return {
    id: 'leitungsbaum',
    get bezeichnung() {
      return t('werkzeugnamen.leitungsbaum')
    },
    kuerzel: 'M',
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.leitungsbaum.status'))
    },
    onPointerDown(info, ctx) {
      const objekt: LeitungsbaumObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'leitungsbaum',
        position: info.world,
        gliederung: 'trunk',
        umfang: 'blatt',
        titel: null,
        textHoehe: STANDARD_BAUM_TEXTHOEHE,
        zielBreite: null,
        einpassen: true,
        trunksAnzeigen: true,
      }
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.leitungsbaum.einsetzen'),
        ),
      )
      ctx.setAuswahl([objekt.id])
      ctx.zurueckZuAuswahl()
    },
  }
}
