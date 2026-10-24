import type { Tool } from '../tool'
import type { StromkreisverzeichnisObjekt } from '../../document-model'
import { STANDARD_TABELLEN_TEXTHOEHE, neueObjektBasis } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { t } from '../../sprache'

export function erzeugeStromkreisverzeichnisTool(): Tool {
  return {
    id: 'stromkreisverzeichnis',
    get bezeichnung() {
      return t('werkzeugnamen.stromkreisverzeichnis')
    },
    kuerzel: 'SV',
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.stromkreisverzeichnis.status'))
    },
    onPointerDown(info, ctx) {
      const objekt: StromkreisverzeichnisObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'stromkreisverzeichnis',
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
          t('werkzeuge.stromkreisverzeichnis.einsetzen'),
        ),
      )
      ctx.setAuswahl([objekt.id])
      ctx.zurueckZuAuswahl()
    },
  }
}
