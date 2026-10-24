import type { Tool } from '../tool'
import type { SteuerungslogikObjekt } from '../../document-model'
import { STANDARD_TABELLEN_TEXTHOEHE, neueObjektBasis } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { t } from '../../sprache'

export function erzeugeSteuerungslogikTool(): Tool {
  return {
    id: 'steuerungslogik',
    get bezeichnung() {
      return t('werkzeugnamen.steuerungslogik')
    },
    kuerzel: 'SL',
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.steuerungslogik.status'))
    },
    onPointerDown(info, ctx) {
      const objekt: SteuerungslogikObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'steuerungslogik',
        position: info.world,
        umfang: 'blatt',
        titel: null,
        textHoehe: STANDARD_TABELLEN_TEXTHOEHE,
        unbelegteSlotsAusblenden: false,
      }
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.steuerungslogik.einsetzen'),
        ),
      )
      ctx.setAuswahl([objekt.id])
      ctx.zurueckZuAuswahl()
    },
  }
}
