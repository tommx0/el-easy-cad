import {
  zeichneOeffnungsVorschau,
  zeichneRaumVorschau,
  zeichneTreppenVorschau,
  zeichneWandVorschau,
} from '../../rendering'
import type { Tool } from '../tool'
import { t } from '../../sprache'

export function erzeugeIfcBauteileVorschauTool(): Tool {
  return {
    id: 'ifc-bauteile-vorschau',
    get bezeichnung() {
      return t('werkzeugnamen.ifc-bauteile-vorschau')
    },
    bleibtAktiv: true,
    onActivate(ctx) {
      ctx.setStatus(t('werkzeuge.ifcBauteileVorschau.status'))
    },
    drawOverlay(g, ctx) {
      const vorschau = ctx.ifcBauteileVorschau()
      zeichneWandVorschau(g, ctx.view, vorschau.waende)
      zeichneOeffnungsVorschau(g, ctx.view, vorschau.waende, vorschau.oeffnungen)
      zeichneTreppenVorschau(g, ctx.view, vorschau.treppen)
      zeichneRaumVorschau(g, ctx.view, vorschau.raeume ?? [])
    },
  }
}
