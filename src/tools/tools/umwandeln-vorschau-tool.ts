import { zeichneUmwandelnVorschau } from '../../rendering'
import type { Tool } from '../tool'
import { t } from '../../sprache'

export function erzeugeUmwandelnVorschauTool(): Tool {
  return {
    id: 'umwandeln-vorschau',
    get bezeichnung() {
      return t('werkzeugnamen.umwandeln-vorschau')
    },
    bleibtAktiv: true,
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.umwandelnVorschau.status'))
    },
    drawOverlay(g, ctx) {
      zeichneUmwandelnVorschau(g, ctx.view, ctx.umwandelnVorschau())
    },
  }
}
