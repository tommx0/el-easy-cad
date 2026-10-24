import type { Tool } from '../tool'
import type { PunktObjektMitPosition } from '../../document-model'
import { neueObjektBasis } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { t } from '../../sprache'

export function erzeugePunktTool(): Tool {
  return {
    id: 'punkt',
    get bezeichnung() {
      return t('werkzeugnamen.punkt')
    },
    kuerzel: 'P',
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.punkt.status'))
    },
    onPointerDown(info, ctx) {
      const objekt: PunktObjektMitPosition = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'punkt',
        position: info.world,
      }
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.punkt.zeichnen'),
        ),
      )
      ctx.zurueckZuAuswahl()
    },
  }
}
