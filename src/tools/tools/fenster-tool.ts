import type { FensterObjekt } from '../../document-model'
import { ermittleOeffnungsGeometrie, neueObjektBasis } from '../../document-model'
import { zeichneObjekt } from '../../rendering'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { findeNaechsteWand, type WandTreffer } from '../wand-platzierung'
import type { Tool, ToolContext } from '../tool'
import { t } from '../../sprache'

const VORSCHAU_DECKKRAFT = 0.55

export function erzeugeFensterTool(): Tool {
  let ziel: WandTreffer | null = null
  let anzahl = 0

  function status(ctx: ToolContext) {
    ctx.setStatus(
      !ziel
        ? t('werkzeuge.fenster.wandZeigen')
        : anzahl > 0
          ? t('werkzeuge.fenster.weitere', { n: anzahl })
          : t('werkzeuge.fenster.klicken'),
    )
  }

  function erzeugeInstanz(ctx: ToolContext): FensterObjekt | null {
    if (!ziel) return null
    const geometrie = ermittleOeffnungsGeometrie(ziel.wand, { t: ziel.t })
    if (!geometrie) return null
    const vorgaben = ctx.bauteilVorgaben()
    return {
      ...neueObjektBasis(ctx.aktiveEbeneId()),
      type: 'fenster',
      wandId: ziel.wand.id,
      t: ziel.t,
      breite: vorgaben.fensterBreite,
      hoehe: vorgaben.fensterHoehe,
      bruestungshoehe: vorgaben.fensterBruestung,
      ...geometrie,
    }
  }

  return {
    id: 'fenster',
    get bezeichnung() {
      return t('werkzeugnamen.fenster')
    },
    kuerzel: 'UMSCHALT+F',
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
          t('werkzeuge.fenster.einsetzen'),
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
