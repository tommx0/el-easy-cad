import type { WanddurchbruchObjekt } from '../../document-model'
import {
  ermittleOeffnungsGeometrie,
  neueObjektBasis,
  STANDARD_WANDDURCHBRUCH_BREITE,
} from '../../document-model'
import { zeichneObjekt } from '../../rendering'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { findeNaechsteWand, type WandTreffer } from '../wand-platzierung'
import type { Tool, ToolContext } from '../tool'
import { t } from '../../sprache'

const VORSCHAU_DECKKRAFT = 0.55

export function erzeugeWanddurchbruchTool(): Tool {
  let ziel: WandTreffer | null = null
  let anzahl = 0

  function status(ctx: ToolContext) {
    ctx.setStatus(
      !ziel
        ? t('werkzeuge.wanddurchbruch.wandZeigen')
        : anzahl > 0
          ? t('werkzeuge.wanddurchbruch.weitere', { n: anzahl })
          : t('werkzeuge.wanddurchbruch.klicken'),
    )
  }

  function erzeugeInstanz(ctx: ToolContext): WanddurchbruchObjekt | null {
    if (!ziel) return null
    const geometrie = ermittleOeffnungsGeometrie(ziel.wand, { t: ziel.t })
    if (!geometrie) return null
    return {
      ...neueObjektBasis(ctx.aktiveEbeneId()),
      type: 'wanddurchbruch',
      wandId: ziel.wand.id,
      t: ziel.t,
      breite: STANDARD_WANDDURCHBRUCH_BREITE,
      ...geometrie,
    }
  }

  return {
    id: 'wanddurchbruch',
    get bezeichnung() {
      return t('werkzeugnamen.wanddurchbruch')
    },
    kuerzel: 'ALT+W',
    bleibtAktiv: true,
    onActivate(ctx) {
      ziel = null
      anzahl = 0
      status(ctx)
    },
    onDeactivate() {
      ziel = null
      anzahl = 0
    },
    onAbbrechen(ctx) {
      ziel = null
      anzahl = 0
      ctx.zurueckZuAuswahl()
      return true
    },
    onPointerMove(info, ctx) {
      ziel = findeNaechsteWand(ctx, info.world)
      status(ctx)
      ctx.requestOverlayRedraw()
    },
    onPointerLeave(ctx) {
      if (!ziel) return
      ziel = null
      ctx.requestOverlayRedraw()
    },
    onPointerDown(_info, ctx) {
      const objekt = erzeugeInstanz(ctx)
      if (!objekt) return
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.wanddurchbruch.einsetzen'),
        ),
      )
      anzahl += 1
      status(ctx)
    },
    drawOverlay(g, ctx) {
      if (!ziel) return
      const objekt = erzeugeInstanz(ctx)
      if (!objekt) return
      g.save()
      g.globalAlpha = VORSCHAU_DECKKRAFT
      zeichneObjekt(g, ctx.view, objekt, ctx.komponentenRenderKontext())
      g.restore()
    },
  }
}
