import type { LeitungsObjekt, Point, Teilstueck } from '../../document-model'
import {
  freieStuecke,
  liegtAufStrecke,
  raumquerungsUmgebung,
  sichtbareObjekte,
} from '../../document-model'
import { zeichneTeilstueckZonen } from '../../rendering'
import { enter, tastenHinweis } from '../kontext-aktionen'
import type { Tool, ToolContext } from '../tool'
import { t } from '../../sprache'

const TOLERANZ_PX = 6

function abstand(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const laenge2 = dx * dx + dy * dy
  const t =
    laenge2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / laenge2))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

export function erzeugeTeilstueckZoneTool(): Tool {
  let gewaehlt: Teilstueck[] = []

  function melde(ctx: ToolContext) {
    ctx.meldeTeilstueckAuswahl?.(gewaehlt)
    const taste = tastenHinweis(t('werkzeuge.teilstueckZone.taste'))
    ctx.setStatus(
      gewaehlt.length === 0
        ? t('werkzeuge.teilstueckZone.anklicken', { taste })
        : t('werkzeuge.teilstueckZone.gewaehlt', { n: gewaehlt.length, taste }),
    )
    ctx.requestOverlayRedraw()
  }

  function beenden(ctx: ToolContext) {
    gewaehlt = []
    ctx.meldeTeilstueckAuswahl?.([])
    ctx.zurueckZuAuswahl()
  }

  function leitungenAufBlatt(ctx: ToolContext): LeitungsObjekt[] {
    const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
    if (!blatt) return []
    return sichtbareObjekte(blatt.objekte, blatt.ebenen).filter(
      (o): o is LeitungsObjekt => o.type === 'leitung',
    )
  }

  return {
    id: 'teilstueck-zone',
    get bezeichnung() {
      return t('werkzeugnamen.teilstueck-zone')
    },
    bleibtAktiv: true,
    onActivate(ctx) {
      gewaehlt = []
      melde(ctx)
    },
    onDeactivate(ctx) {
      gewaehlt = []
      ctx.meldeTeilstueckAuswahl?.([])
    },
    onAbbrechen(ctx) {
      beenden(ctx)
      return true
    },
    onPointerDown(info, ctx) {
      if (info.button !== 0) return
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt) return
      const toleranz = ctx.view.laengeToWorld(TOLERANZ_PX)
      let treffer: (Teilstueck & { abstand: number }) | null = null
      for (const leitung of leitungenAufBlatt(ctx))
        for (const s of freieStuecke(leitung, blatt.objekte)) {
          const d = abstand(info.raw, s.von, s.bis)
          if (d <= toleranz && (!treffer || d < treffer.abstand))
            treffer = { leitungId: leitung.id, von: s.von, bis: s.bis, abstand: d }
        }
      if (!treffer) return
      const { abstand: _abstand, ...stueck } = treffer
      const schonGewaehlt = gewaehlt.some(
        (g) =>
          g.leitungId === stueck.leitungId && liegtAufStrecke(stueck.von, stueck.bis, g.von, g.bis),
      )
      gewaehlt = schonGewaehlt
        ? gewaehlt.filter(
            (g) =>
              !(
                g.leitungId === stueck.leitungId &&
                liegtAufStrecke(stueck.von, stueck.bis, g.von, g.bis)
              ),
          )
        : [...gewaehlt, stueck]
      melde(ctx)
    },
    tastenAktionen() {
      return [enter(t('werkzeuge.tasten.fertig'))]
    },
    onKeyDown(e, ctx) {
      if (e.key === 'Enter') beenden(ctx)
    },
    drawOverlay(g, ctx) {
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt) return
      zeichneTeilstueckZonen(
        g,
        ctx.view,
        leitungenAufBlatt(ctx),
        blatt.objekte,
        gewaehlt,
        raumquerungsUmgebung(blatt, ctx.doc.getZeichnung().installationszonen),
        ctx.doc.getZeichnung().installationszonen,
      )
    },
  }
}
