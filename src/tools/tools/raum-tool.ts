import type { RaumObjekt } from '../../document-model'
import {
  ebeneFuerNeuesObjekt,
  ermittleRaumGeometrie,
  neueObjektBasis,
  planUebersetzer,
  pointInPolygon,
  standardRaumName,
  STANDARD_RAUM_SCHRIFTGROESSE,
} from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import type { Tool, ToolContext } from '../tool'
import { t } from '../../sprache'

export function erzeugeRaumTool(): Tool {
  function status(ctx: ToolContext) {
    ctx.setStatus(t('werkzeuge.raum.status'))
  }

  return {
    id: 'raum',
    get bezeichnung() {
      return t('werkzeugnamen.raum')
    },
    kuerzel: 'RA',
    bleibtAktiv: true,
    onActivate(ctx) {
      status(ctx)
    },
    onAbbrechen(ctx) {
      ctx.zurueckZuAuswahl()
      return true
    },
    onPointerDown(info, ctx) {
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt) return
      const ergebnis = ermittleRaumGeometrie(blatt.objekte, info.raw)
      if (!ergebnis) {
        ctx.setStatus(t('werkzeuge.raum.nichtUmschlossen'))
        return
      }
      const bestehenderRaum = blatt.objekte.find(
        (o): o is RaumObjekt => o.type === 'raum' && pointInPolygon(o.mittelpunkt, ergebnis.umriss),
      )
      if (bestehenderRaum) {
        ctx.setAuswahl([bestehenderRaum.id])
        ctx.setStatus(t('werkzeuge.raum.vorhanden'))
        return
      }
      const objekt: RaumObjekt = {
        ...neueObjektBasis(ebeneFuerNeuesObjekt('raum', blatt.ebenen, ctx.aktiveEbeneId())),
        type: 'raum',
        punktImRaum: info.raw,
        name: standardRaumName(planUebersetzer(ctx.doc.getZeichnung())),
        schriftgroesse: STANDARD_RAUM_SCHRIFTGROESSE,
        gueltig: true,
        fuellung: null,
        ...ergebnis,
      }
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.raum.anlegen'),
        ),
      )
      ctx.setAuswahl([objekt.id])
      status(ctx)
    },
  }
}
