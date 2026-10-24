import type { Point, SchraffurMuster, SchraffurObjekt } from '../../document-model'
import { neueObjektBasis } from '../../document-model'
import { zeichneObjekt } from '../../rendering'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import type { Tool, ToolContext } from '../tool'
import { buchstabe, enter, tastenHinweis, wirksam } from '../kontext-aktionen'
import { t } from '../../sprache'

const MUSTER_REIHENFOLGE: SchraffurMuster[] = ['diagonal', 'kreuz', 'horizontal', 'vertikal']

function musterName(muster: SchraffurMuster): string {
  return t(`werkzeuge.schraffur.musterName.${muster}`)
}
const STANDARD_ABSTAND_M = 0.1

export function erzeugeSchraffurTool(): Tool {
  let punkte: Point[] = []
  let aktuell: Point | null = null
  let muster: SchraffurMuster = 'diagonal'

  function reset() {
    punkte = []
    aktuell = null
  }

  function abschliessen(ctx: ToolContext) {
    if (punkte.length >= 3) {
      const objekt: SchraffurObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'schraffur',
        kontur: [...punkte],
        muster,
        abstand: STANDARD_ABSTAND_M,
      }
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.schraffur.einfuegen'),
        ),
      )
    }
    reset()
    ctx.zurueckZuAuswahl()
  }

  return {
    id: 'schraffur',
    get bezeichnung() {
      return t('werkzeugnamen.schraffur')
    },
    kuerzel: 'H',
    onActivate(ctx) {
      reset()
      ctx.setStatus(
        t('werkzeuge.schraffur.status', {
          muster: musterName(muster),
          tasteM: tastenHinweis(t('werkzeuge.schraffur.statusTasteM')),
          tasteEnter: tastenHinweis(t('werkzeuge.tasten.slashEnter')),
        }),
      )
    },
    onDeactivate() {
      reset()
    },
    onPointerDown(info, ctx) {
      punkte.push(info.world)
      ctx.requestOverlayRedraw()
    },
    onPointerMove(info, ctx) {
      if (punkte.length === 0) return
      aktuell = info.world
      ctx.requestOverlayRedraw()
    },
    onDoubleClick(_info, ctx) {
      if (punkte.length > 0) punkte.pop()
      abschliessen(ctx)
    },
    tastenAktionen() {
      return wirksam(
        buchstabe('m', t('werkzeuge.schraffur.wechseln', { muster: musterName(muster) })),
        punkte.length >= 3 && enter(t('werkzeuge.tasten.fertig')),
      )
    },
    onKeyDown(e, ctx) {
      if (e.key === 'Enter') {
        e.preventDefault()
        abschliessen(ctx)
      } else if (e.key.toLowerCase() === 'm') {
        muster =
          MUSTER_REIHENFOLGE[(MUSTER_REIHENFOLGE.indexOf(muster) + 1) % MUSTER_REIHENFOLGE.length]
        ctx.setStatus(t('werkzeuge.schraffur.muster', { muster: musterName(muster) }))
        ctx.requestOverlayRedraw()
      }
    },
    drawOverlay(g, ctx) {
      const vorschauPunkte = aktuell ? [...punkte, aktuell] : punkte
      if (vorschauPunkte.length < 3) {
        if (vorschauPunkte.length < 2) return
        const screenPunkte = vorschauPunkte.map((p) => ctx.view.worldToScreen(p))
        g.save()
        g.strokeStyle = '#2f7dd1'
        g.lineWidth = 1.5
        g.setLineDash([5, 4])
        g.beginPath()
        g.moveTo(screenPunkte[0].x, screenPunkte[0].y)
        for (const p of screenPunkte.slice(1)) g.lineTo(p.x, p.y)
        g.stroke()
        g.restore()
        return
      }
      const vorschau: SchraffurObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'schraffur',
        kontur: vorschauPunkte,
        muster,
        abstand: STANDARD_ABSTAND_M,
      }
      zeichneObjekt(g, ctx.view, vorschau)
    },
  }
}
