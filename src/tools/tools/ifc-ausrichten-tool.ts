import type { DxfEntity, Point } from '../../document-model'
import type { StarreAusrichtung } from '../../ifc'
import { AUSRICHTEN_WARNSCHWELLE, berechneAusrichtung, huelleVonEntities } from '../../ifc'
import type { IfcAusrichtAuftrag, Tool, ToolContext } from '../tool'
import { formatiereZahl, t, type Schluessel } from '../../sprache'

export function erzeugeIfcAusrichtenTool(): Tool {
  let auftrag: IfcAusrichtAuftrag | null = null
  let versatz: Point = { x: 0, y: 0 }
  let punkte: Point[] = []
  let maus: Point | null = null

  const TEXTE: Schluessel[] = [
    'werkzeuge.ifcAusrichten.schritt1',
    'werkzeuge.ifcAusrichten.schritt2',
    'werkzeuge.ifcAusrichten.schritt3',
    'werkzeuge.ifcAusrichten.schritt4',
  ]

  function status(ctx: ToolContext) {
    ctx.setStatus(t(auftrag ? TEXTE[punkte.length] : 'werkzeuge.ifcAusrichten.keinGeschoss'))
  }

  function frage(ctx: ToolContext, a: StarreAusrichtung) {
    const m = (meter: number) =>
      formatiereZahl(meter, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const prozent = formatiereZahl(Math.abs(a.abweichung) * 100, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
    const warnung =
      Math.abs(a.abweichung) > AUSRICHTEN_WARNSCHWELLE ? t('werkzeuge.ifcAusrichten.warnung') : ''
    const fertig = auftrag
    ctx.oeffneBestaetigung({
      titel: t('werkzeuge.ifcAusrichten.titel'),
      nachricht: t('werkzeuge.ifcAusrichten.frage', {
        plan: m(a.abstandPlan),
        ifc: m(a.abstandIfc),
        prozent,
        warnung,
      }),
      bestaetigenText: t('werkzeuge.ifcAusrichten.uebernehmen'),
      destruktiv: false,
      callback: (bestaetigt) => {
        if (bestaetigt && fertig) fertig.uebernehmen(a)
        auftrag = null
        punkte = []
        ctx.zurueckZuAuswahl()
      },
    })
  }

  return {
    id: 'ifc-ausrichten',
    get bezeichnung() {
      return t('werkzeugnamen.ifc-ausrichten')
    },
    onActivate(ctx, vorgabe) {
      if (vorgabe?.art === 'ifc-ausrichten') {
        auftrag = vorgabe.auftrag
        const huelle = huelleVonEntities(auftrag.entities)
        const mitte = auftrag.vorschauMitte
        versatz = huelle
          ? {
              x: mitte.x - (huelle.min.x + huelle.max.x) / 2,
              y: mitte.y - (huelle.min.y + huelle.max.y) / 2,
            }
          : { x: 0, y: 0 }
      }
      punkte = []
      status(ctx)
    },
    onDeactivate() {
      auftrag = null
      punkte = []
      maus = null
    },
    onPointerMove(info, ctx) {
      maus = info.world
      ctx.requestOverlayRedraw()
    },
    onPointerDown(info, ctx) {
      if (!auftrag || info.button !== 0) return
      punkte.push(punkte.length < 2 ? info.world : info.raw)
      ctx.requestOverlayRedraw()
      if (punkte.length < 4) {
        status(ctx)
        return
      }
      const [planA, planB, vorschauA, vorschauB] = punkte
      const zurueck = (p: Point) => ({ x: p.x - versatz.x, y: p.y - versatz.y })
      const ausrichtung = berechneAusrichtung(planA, planB, zurueck(vorschauA), zurueck(vorschauB))
      if (!ausrichtung) {
        punkte = []
        ctx.setStatus(t('werkzeuge.ifcAusrichten.zusammen'))
        return
      }
      frage(ctx, ausrichtung)
    },
    drawOverlay(g, ctx) {
      if (!auftrag) return
      g.save()
      g.strokeStyle = 'rgba(224, 120, 47, 0.85)'
      g.lineWidth = 1
      g.beginPath()
      zeichneLinien(g, auftrag.entities, (p) =>
        ctx.view.worldToScreen({ x: p.x + versatz.x, y: p.y + versatz.y }),
      )
      g.stroke()
      const farben = ['#2f7dd1', '#2f7dd1', '#e0782f', '#e0782f']
      const bildschirm = punkte.map((p) => ctx.view.worldToScreen(p))
      bildschirm.forEach((p, i) => {
        g.fillStyle = farben[i]
        g.beginPath()
        g.arc(p.x, p.y, 5, 0, Math.PI * 2)
        g.fill()
      })
      g.setLineDash([4, 3])
      for (const [von, bis, farbe] of [
        [0, 1, '#2f7dd1'],
        [2, 3, '#e0782f'],
      ] as const) {
        const a = bildschirm[von]
        const b =
          bildschirm[bis] ?? (punkte.length === bis && maus ? ctx.view.worldToScreen(maus) : null)
        if (!a || !b) continue
        g.strokeStyle = farbe
        g.beginPath()
        g.moveTo(a.x, a.y)
        g.lineTo(b.x, b.y)
        g.stroke()
      }
      g.restore()
    },
  }
}

function zeichneLinien(
  g: CanvasRenderingContext2D,
  entities: readonly DxfEntity[],
  zuBildschirm: (p: Point) => Point,
) {
  for (const e of entities) {
    if (e.type === 'linie') {
      const a = zuBildschirm(e.start)
      const b = zuBildschirm(e.ende)
      g.moveTo(a.x, a.y)
      g.lineTo(b.x, b.y)
    } else if (e.type === 'polylinie' && e.punkte.length > 0) {
      const erster = zuBildschirm(e.punkte[0])
      g.moveTo(erster.x, erster.y)
      for (const p of e.punkte.slice(1)) {
        const q = zuBildschirm(p)
        g.lineTo(q.x, q.y)
      }
      if (e.geschlossen) g.lineTo(erster.x, erster.y)
    }
  }
}
