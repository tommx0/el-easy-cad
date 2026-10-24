import type { Tool } from '../tool'
import type { BetriebsmittellisteObjekt } from '../../document-model'
import { STANDARD_TABELLEN_TEXTHOEHE, neueObjektBasis } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { t } from '../../sprache'

export function erzeugeBetriebsmittellistenTool(): Tool {
  return {
    id: 'betriebsmittelliste',
    get bezeichnung() {
      return t('werkzeugnamen.betriebsmittelliste')
    },
    kuerzel: 'BM',
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.betriebsmittelliste.status'))
    },
    onPointerDown(info, ctx) {
      const objekt: BetriebsmittellisteObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'betriebsmittelliste',
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
          t('werkzeuge.betriebsmittelliste.einsetzen'),
        ),
      )
      ctx.setAuswahl([objekt.id])
      ctx.zurueckZuAuswahl()
    },
  }
}
