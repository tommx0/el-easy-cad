import type { Point } from '../../document-model'
import { angleBetween, distance, neueObjektBasis, polygonPunkte } from '../../document-model'
import type { PolygonObjekt } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import type { Tool } from '../tool'
import { plusMinus, tastenHinweis } from '../kontext-aktionen'
import { t } from '../../sprache'

const STANDARD_SEITENANZAHL = 6

export function erzeugePolygonTool(): Tool {
  let mittelpunkt: Point | null = null
  let aktuell: Point | null = null
  let seitenAnzahl = STANDARD_SEITENANZAHL

  return {
    id: 'polygon',
    get bezeichnung() {
      return t('werkzeugnamen.polygon')
    },
    kuerzel: 'PO',
    onActivate(ctx) {
      mittelpunkt = null
      aktuell = null
      seitenAnzahl = STANDARD_SEITENANZAHL
      ctx.setStatus(
        t('werkzeuge.polygon.mittelpunkt', {
          n: seitenAnzahl,
          taste: tastenHinweis(t('werkzeuge.polygon.mittelpunktTaste')),
        }),
      )
    },
    onDeactivate() {
      mittelpunkt = null
      aktuell = null
    },
    onPointerDown(info, ctx) {
      if (!mittelpunkt) {
        mittelpunkt = info.world
        ctx.setStatus(t('werkzeuge.polygon.eckpunkt'))
        return
      }
      const radius = distance(mittelpunkt, info.world)
      if (radius > 0) {
        const objekt: PolygonObjekt = {
          ...neueObjektBasis(ctx.aktiveEbeneId()),
          type: 'polygon',
          mittelpunkt,
          radius,
          seitenAnzahl,
          drehung: angleBetween(mittelpunkt, info.world),
          fuellung: null,
        }
        ctx.commands.execute(
          erzeugeObjektHinzufuegenCommand(
            ctx.doc,
            ctx.aktivesBlattId(),
            objekt,
            t('werkzeuge.polygon.zeichnen'),
          ),
        )
      }
      mittelpunkt = null
      aktuell = null
      ctx.zurueckZuAuswahl()
    },
    onPointerMove(info, ctx) {
      if (!mittelpunkt) return
      aktuell = info.world
      ctx.requestOverlayRedraw()
    },
    tastenAktionen() {
      return plusMinus(
        t('werkzeuge.polygon.seiten'),
        String(seitenAnzahl),
        t('werkzeuge.polygon.weniger'),
        t('werkzeuge.polygon.mehr'),
      )
    },
    onKeyDown(e, ctx) {
      if (e.key === '+' || e.key === '=') {
        seitenAnzahl = Math.min(24, seitenAnzahl + 1)
        ctx.setStatus(t('werkzeuge.polygon.anzahl', { n: seitenAnzahl }))
        ctx.requestOverlayRedraw()
      } else if (e.key === '-') {
        seitenAnzahl = Math.max(3, seitenAnzahl - 1)
        ctx.setStatus(t('werkzeuge.polygon.anzahl', { n: seitenAnzahl }))
        ctx.requestOverlayRedraw()
      }
    },
    drawOverlay(g, ctx) {
      if (!mittelpunkt || !aktuell) return
      const vorschau: PolygonObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'polygon',
        mittelpunkt,
        radius: distance(mittelpunkt, aktuell),
        seitenAnzahl,
        drehung: angleBetween(mittelpunkt, aktuell),
        fuellung: null,
      }
      const punkte = polygonPunkte(vorschau).map((p) => ctx.view.worldToScreen(p))
      g.save()
      g.strokeStyle = '#2f7dd1'
      g.lineWidth = 1.5
      g.setLineDash([5, 4])
      g.beginPath()
      g.moveTo(punkte[0].x, punkte[0].y)
      for (const p of punkte.slice(1)) g.lineTo(p.x, p.y)
      g.closePath()
      g.stroke()
      g.restore()
    },
  }
}
