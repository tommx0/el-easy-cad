import type { PotentialObjekt } from '../../document-model'
import { neueObjektBasis } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import type { Tool } from '../tool'
import { t } from '../../sprache'

export function erzeugePotentialTool(): Tool {
  return {
    id: 'potential',
    get bezeichnung() {
      return t('werkzeugnamen.potential')
    },
    kuerzel: 'PT',
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.potential.status'))
    },
    onPointerDown(info, ctx) {
      const position = info.world
      ctx.oeffneEingabeDialog(
        {
          titel: t('werkzeuge.potential.titel'),
          label: t('werkzeuge.potential.name'),
          hinweis: t('werkzeuge.potential.hinweis'),
          typ: 'text',
        },
        (wert) => {
          if (wert && wert.trim().length > 0) {
            const objekt: PotentialObjekt = {
              ...neueObjektBasis(ctx.aktiveEbeneId()),
              type: 'potential',
              position,
              drehung: 0,
              name: wert.trim(),
            }
            ctx.commands.execute(
              erzeugeObjektHinzufuegenCommand(
                ctx.doc,
                ctx.aktivesBlattId(),
                objekt,
                t('werkzeuge.potential.setzen'),
              ),
            )
          }
          ctx.zurueckZuAuswahl()
        },
      )
    },
  }
}
