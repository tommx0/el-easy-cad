import type { Tool } from '../tool'
import type { StuecklistenObjekt } from '../../document-model'
import { STANDARD_TABELLEN_TEXTHOEHE, neueObjektBasis } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { t } from '../../sprache'

export function erzeugeStuecklistenTool(): Tool {
  return {
    id: 'stueckliste',
    get bezeichnung() {
      return t('werkzeugnamen.stueckliste')
    },
    kuerzel: 'S',
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.stueckliste.status'))
    },
    onPointerDown(info, ctx) {
      const objekt: StuecklistenObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'stueckliste',
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
          t('werkzeuge.stueckliste.einsetzen'),
        ),
      )
      ctx.setAuswahl([objekt.id])
      ctx.zurueckZuAuswahl()
    },
  }
}
