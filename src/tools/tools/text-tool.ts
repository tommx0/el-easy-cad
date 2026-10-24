import type { TextObjekt } from '../../document-model'
import { neueObjektBasis } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import type { Tool } from '../tool'
import { t } from '../../sprache'

const STANDARD_TEXTHOEHE_M = 0.25

export function erzeugeTextTool(): Tool {
  return {
    id: 'text',
    get bezeichnung() {
      return t('werkzeugnamen.text')
    },
    kuerzel: 'T',
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.text.status'))
    },
    onPointerDown(info, ctx) {
      const position = info.world
      ctx.oeffneEingabeDialog(
        { titel: t('werkzeuge.text.einfuegen'), label: t('werkzeuge.text.inhalt'), typ: 'text' },
        (wert) => {
          if (wert && wert.trim().length > 0) {
            const objekt: TextObjekt = {
              ...neueObjektBasis(ctx.aktiveEbeneId()),
              type: 'text',
              position,
              inhalt: wert.trim(),
              hoehe: STANDARD_TEXTHOEHE_M,
              drehung: 0,
            }
            ctx.commands.execute(
              erzeugeObjektHinzufuegenCommand(
                ctx.doc,
                ctx.aktivesBlattId(),
                objekt,
                t('werkzeuge.text.einfuegen'),
              ),
            )
          }
          ctx.zurueckZuAuswahl()
        },
      )
    },
  }
}
