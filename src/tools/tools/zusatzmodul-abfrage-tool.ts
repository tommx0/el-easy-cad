import type { Point } from '../../document-model'
import { hitTestObjekte } from '../hit-test'
import type { Tool, ToolContext } from '../tool'

export const ZUSATZMODUL_ABFRAGE_TOOL_ID = 'zusatzmodul-abfrage'

const TOLERANZ_PX = 6

export type ZusatzmodulAbfrageErgebnis =
  | { art: 'punkt'; punkt: Point }
  | { art: 'objekte'; ids: string[] }
  | { art: 'rechteck'; von: Point; bis: Point }

export interface ZusatzmodulAbfrageAuftrag {
  art: 'punkt' | 'objekte' | 'rechteck'
  hinweis: string
  arten?: readonly string[]
  einzeln?: boolean
  fertig(ergebnis: ZusatzmodulAbfrageErgebnis | null): void
}

export interface ZusatzmodulAbfrageTool extends Tool {
  setzeAuftrag(auftrag: ZusatzmodulAbfrageAuftrag): void
  brecheAb(): void
}

export function erzeugeZusatzmodulAbfrageTool(): ZusatzmodulAbfrageTool {
  let auftrag: ZusatzmodulAbfrageAuftrag | null = null
  let gewaehlt: string[] = []
  let ecke1: Point | null = null
  let ecke2: Point | null = null

  function beende(ctx: ToolContext | null, ergebnis: ZusatzmodulAbfrageErgebnis | null) {
    const offen = auftrag
    auftrag = null
    ecke1 = null
    ecke2 = null
    gewaehlt = []
    if (!offen) return
    ctx?.zurueckZuAuswahl()
    offen.fertig(ergebnis)
  }

  let letzterKontext: ToolContext | null = null

  return {
    id: ZUSATZMODUL_ABFRAGE_TOOL_ID,
    bezeichnung: 'Modul-Abfrage',
    bleibtAktiv: true,

    setzeAuftrag(neu) {
      auftrag?.fertig(null)
      auftrag = neu
      gewaehlt = []
      ecke1 = null
      ecke2 = null
    },

    brecheAb() {
      beende(letzterKontext, null)
    },

    onActivate(ctx) {
      letzterKontext = ctx
      if (auftrag) ctx.setStatus(auftrag.hinweis)
    },

    onDeactivate(ctx) {
      const offen = auftrag
      auftrag = null
      gewaehlt = []
      ecke1 = null
      ecke2 = null
      ctx.setAuswahl([])
      offen?.fertig(null)
    },

    onPointerDown(info, ctx) {
      if (!auftrag || info.button !== 0) return
      if (auftrag.art === 'punkt') {
        beende(ctx, { art: 'punkt', punkt: info.world })
        return
      }
      if (auftrag.art === 'rechteck') {
        ecke1 = info.world
        ecke2 = info.world
        return
      }
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt) return
      const arten = auftrag.arten
      const kandidaten = arten ? blatt.objekte.filter((o) => arten.includes(o.type)) : blatt.objekte
      const treffer = hitTestObjekte(kandidaten, info.raw, ctx.view.laengeToWorld(TOLERANZ_PX))
      if (!treffer) return
      if (auftrag.einzeln) {
        ctx.setAuswahl([])
        beende(ctx, { art: 'objekte', ids: [treffer.id] })
        return
      }
      gewaehlt = gewaehlt.includes(treffer.id)
        ? gewaehlt.filter((id) => id !== treffer.id)
        : [...gewaehlt, treffer.id]
      ctx.setAuswahl(gewaehlt)
    },

    onPointerMove(info) {
      if (auftrag?.art === 'rechteck' && ecke1) ecke2 = info.world
    },

    onPointerUp(info, ctx) {
      if (auftrag?.art !== 'rechteck' || !ecke1) return
      const von = ecke1
      const bis = info.world
      if (von.x === bis.x || von.y === bis.y) {
        ecke1 = null
        ecke2 = null
        return
      }
      beende(ctx, { art: 'rechteck', von, bis })
    },

    onKeyDown(e, ctx) {
      if (auftrag?.art === 'objekte' && e.key === 'Enter') {
        e.preventDefault()
        const ids = gewaehlt
        ctx.setAuswahl([])
        beende(ctx, { art: 'objekte', ids })
      }
    },

    onAbbrechen(ctx) {
      ctx.setAuswahl([])
      beende(ctx, null)
      return true
    },

    drawOverlay(g, ctx) {
      if (auftrag?.art !== 'rechteck' || !ecke1 || !ecke2) return
      const a = ctx.view.worldToScreen(ecke1)
      const b = ctx.view.worldToScreen(ecke2)
      g.save()
      g.strokeStyle = '#2f7dd1'
      g.lineWidth = 1.5
      g.setLineDash([5, 4])
      g.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y))
      g.restore()
    },
  }
}
