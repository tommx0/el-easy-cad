import type { KabelschachtObjekt, Point } from '../../document-model'
import {
  STANDARD_SCHACHT_BREITE,
  STANDARD_SCHACHT_HOEHE,
  ebeneFuerNeuesObjekt,
  erzeugeId,
  neueObjektBasis,
  strangNamenImVerbund,
} from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import type { Tool } from '../tool'
import { t } from '../../sprache'

const MINDESTKANTE_METER = 0.02

function rechteckAusEcken(a: Point, b: Point) {
  return {
    ursprung: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) },
    breite: Math.abs(b.x - a.x),
    hoehe: Math.abs(b.y - a.y),
  }
}

function standardgroesseUm(punkt: Point) {
  return {
    ursprung: {
      x: punkt.x - STANDARD_SCHACHT_BREITE / 2,
      y: punkt.y - STANDARD_SCHACHT_HOEHE / 2,
    },
    breite: STANDARD_SCHACHT_BREITE,
    hoehe: STANDARD_SCHACHT_HOEHE,
  }
}

export function erzeugeKabelschachtTool(): Tool {
  let ecke1: Point | null = null
  let ecke2: Point | null = null

  return {
    id: 'kabelschacht',
    get bezeichnung() {
      return t('werkzeugnamen.kabelschacht')
    },
    kuerzel: 'V',
    onActivate(ctx) {
      ecke1 = null
      ecke2 = null
      ctx.setStatus(t('werkzeuge.kabelschacht.ersteEcke'))
    },
    onDeactivate() {
      ecke1 = null
      ecke2 = null
    },
    onPointerDown(info, ctx) {
      if (!ecke1) {
        ecke1 = info.world
        ctx.setStatus(t('werkzeuge.rechteck.gegenecke'))
        return
      }
      const aufgezogen = rechteckAusEcken(ecke1, info.world)
      const masse =
        aufgezogen.breite < MINDESTKANTE_METER || aufgezogen.hoehe < MINDESTKANTE_METER
          ? standardgroesseUm(ecke1)
          : aufgezogen
      ecke1 = null
      ecke2 = null
      ctx.requestOverlayRedraw()

      const blattId = ctx.aktivesBlattId()
      const ebeneId = ebeneFuerNeuesObjekt(
        'kabelschacht',
        ctx.doc.getBlatt(blattId)?.ebenen ?? [],
        ctx.aktiveEbeneId(),
      )
      ctx.oeffneSchachtVerbundDialog(
        { titel: t('werkzeuge.kabelschacht.einfuegen') },
        (auswahl) => {
          if (!auswahl) {
            ctx.zurueckZuAuswahl()
            return
          }
          const verbundId = auswahl.art === 'neu' ? erzeugeId('verbund') : auswahl.verbundId
          const strangNamen = strangNamenImVerbund(ctx.doc.getZeichnung(), verbundId)
          const objekt: KabelschachtObjekt = {
            ...neueObjektBasis(ebeneId),
            type: 'kabelschacht',
            verbundId,
            name: auswahl.name,
            ursprung: masse.ursprung,
            breite: masse.breite,
            hoehe: masse.hoehe,
            drehung: 0,
            geschosshoehe: auswahl.geschosshoehe,
            ...(Object.keys(strangNamen).length > 0 ? { strangNamen: { ...strangNamen } } : {}),
          }
          ctx.commands.execute(
            erzeugeObjektHinzufuegenCommand(
              ctx.doc,
              blattId,
              objekt,
              t('werkzeuge.kabelschacht.einfuegen'),
            ),
          )
          ctx.zurueckZuAuswahl()
        },
      )
    },
    onPointerMove(info, ctx) {
      if (!ecke1) return
      ecke2 = info.world
      ctx.requestOverlayRedraw()
    },
    drawOverlay(g, ctx) {
      if (!ecke1) return
      const masse = ecke2 ? rechteckAusEcken(ecke1, ecke2) : standardgroesseUm(ecke1)
      const gross = masse.breite >= MINDESTKANTE_METER && masse.hoehe >= MINDESTKANTE_METER
      const { ursprung, breite, hoehe } = gross ? masse : standardgroesseUm(ecke1)
      const a = ctx.view.worldToScreen(ursprung)
      const b = ctx.view.worldToScreen({ x: ursprung.x + breite, y: ursprung.y + hoehe })
      const x = Math.min(a.x, b.x)
      const y = Math.min(a.y, b.y)
      const w = Math.abs(b.x - a.x)
      const h = Math.abs(b.y - a.y)
      g.save()
      g.strokeStyle = '#2f7dd1'
      g.lineWidth = 1.5
      g.setLineDash([5, 4])
      g.strokeRect(x, y, w, h)
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x + w, y + h)
      g.moveTo(x + w, y)
      g.lineTo(x, y + h)
      g.stroke()
      g.restore()
    },
  }
}
