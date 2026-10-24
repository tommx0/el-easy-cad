import type { TuerObjekt } from '../../document-model'
import { ermittleOeffnungsGeometrie, neueObjektBasis } from '../../document-model'
import { zeichneObjekt } from '../../rendering'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { findeNaechsteWand, type WandTreffer } from '../wand-platzierung'
import type { Tool, ToolContext } from '../tool'
import { leertaste, tastenHinweis } from '../kontext-aktionen'
import { t } from '../../sprache'

const VORSCHAU_DECKKRAFT = 0.55

const TUER_VARIANTEN: ReadonlyArray<Pick<TuerObjekt, 'gespiegelt' | 'schwenkInnen'>> = [
  { gespiegelt: false, schwenkInnen: false },
  { gespiegelt: true, schwenkInnen: false },
  { gespiegelt: true, schwenkInnen: true },
  { gespiegelt: false, schwenkInnen: true },
]

export function erzeugeTuerTool(): Tool {
  let ziel: WandTreffer | null = null
  let anzahl = 0
  let variantenIndex = 0

  function status(ctx: ToolContext) {
    const taste = tastenHinweis(t('werkzeuge.tuer.taste'))
    ctx.setStatus(
      !ziel
        ? t('werkzeuge.tuer.wandZeigen', { taste })
        : anzahl > 0
          ? t('werkzeuge.tuer.weitere', { n: anzahl, taste })
          : t('werkzeuge.tuer.klicken', { taste }),
    )
  }

  function erzeugeInstanz(ctx: ToolContext): TuerObjekt | null {
    if (!ziel) return null
    const geometrie = ermittleOeffnungsGeometrie(ziel.wand, { t: ziel.t })
    if (!geometrie) return null
    const vorgaben = ctx.bauteilVorgaben()
    return {
      ...neueObjektBasis(ctx.aktiveEbeneId()),
      type: 'tuer',
      wandId: ziel.wand.id,
      t: ziel.t,
      breite: vorgaben.tuerBreite,
      hoehe: vorgaben.tuerHoehe,
      ...TUER_VARIANTEN[variantenIndex],
      ...geometrie,
    }
  }

  return {
    id: 'tuer',
    get bezeichnung() {
      return t('werkzeugnamen.tuer')
    },
    kuerzel: 'UMSCHALT+T',
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
          t('werkzeuge.tuer.einsetzen'),
        ),
      )
      anzahl += 1
      status(ctx)
    },
    onKeyDown(e, ctx) {
      if (e.key !== ' ') return
      e.preventDefault()
      variantenIndex = (variantenIndex + 1) % TUER_VARIANTEN.length
      status(ctx)
      ctx.requestOverlayRedraw()
    },
    tastenAktionen() {
      const jetzt = TUER_VARIANTEN[variantenIndex]
      const naechste = TUER_VARIANTEN[(variantenIndex + 1) % TUER_VARIANTEN.length]
      return [
        leertaste(
          t(
            jetzt.gespiegelt !== naechste.gespiegelt
              ? 'werkzeuge.tuer.anschlag'
              : 'werkzeuge.tuer.oeffnungsseite',
          ),
        ),
      ]
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
