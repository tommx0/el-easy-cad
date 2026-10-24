import type { Point, TreppenForm, TreppenObjekt } from '../../document-model'
import {
  ermittleTreppenStufenanzahlVorschlag,
  neueObjektBasis,
  standardLFormMasse,
} from '../../document-model'
import { zeichneObjekt } from '../../rendering'
import type { BauteilVorgaben } from '../bauteil-vorgaben'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import type { Tool, ToolContext } from '../tool'
import { buchstabe, leertaste, tastenHinweis } from '../kontext-aktionen'
import { t } from '../../sprache'

const FORM_REIHENFOLGE: TreppenForm[] = ['gerade', 'u-podest', 'u-kehre', 'l-kehre']
const VORSCHAU_DECKKRAFT = 0.55

export function erzeugeTreppeAusVorgaben(
  vorgaben: BauteilVorgaben,
  mitte: Point,
  drehung: number,
  ebeneId: string,
): TreppenObjekt {
  const form = vorgaben.treppenForm
  const { laenge: breite, breite: hoehe } = vorgaben.treppenMasse[form]
  return {
    ...neueObjektBasis(ebeneId),
    type: 'treppe',
    form,
    ursprung: { x: mitte.x - breite / 2, y: mitte.y - hoehe / 2 },
    breite,
    hoehe,
    drehung,
    stufenanzahl: ermittleTreppenStufenanzahlVorschlag(form, breite, hoehe),
    laufrichtungGespiegelt: false,
    beschriftungSichtbar: true,
    lFormSpiegelHorizontal: false,
    lFormSpiegelVertikal: false,
    ...standardLFormMasse(breite, hoehe),
  }
}

export function erzeugeTreppeTool(): Tool {
  let mitte: Point | null = null
  let drehung = 0

  function status(ctx: ToolContext) {
    ctx.setStatus(
      t('werkzeuge.treppe.status', { taste: tastenHinweis(t('werkzeuge.treppe.statusTaste')) }),
    )
  }

  return {
    id: 'treppe',
    get bezeichnung() {
      return t('werkzeugnamen.treppe')
    },
    kuerzel: 'ALT+T',
    onActivate(ctx) {
      mitte = null
      status(ctx)
    },
    onDeactivate() {
      mitte = null
    },
    onPointerDown(info, ctx) {
      const objekt = erzeugeTreppeAusVorgaben(
        ctx.bauteilVorgaben(),
        info.world,
        drehung,
        ctx.aktiveEbeneId(),
      )
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.treppe.zeichnen'),
        ),
      )
      mitte = null
      ctx.zurueckZuAuswahl()
    },
    onPointerMove(info, ctx) {
      mitte = info.world
      ctx.requestOverlayRedraw()
    },
    onPointerLeave(ctx) {
      if (!mitte) return
      mitte = null
      ctx.requestOverlayRedraw()
    },
    tastenAktionen(ctx) {
      const form = t(`werkzeuge.treppe.form.${ctx.bauteilVorgaben().treppenForm}`)
      return [
        leertaste(t('werkzeuge.tasten.drehen90')),
        buchstabe('f', t('werkzeuge.treppe.formWechseln', { form })),
      ]
    },
    onKeyDown(e, ctx) {
      if (e.key === ' ') {
        e.preventDefault()
        drehung = (drehung + Math.PI / 2) % (2 * Math.PI)
        ctx.requestOverlayRedraw()
        return
      }
      if (e.key.toLowerCase() === 'f') {
        const form = ctx.bauteilVorgaben().treppenForm
        ctx.setBauteilVorgaben({
          treppenForm:
            FORM_REIHENFOLGE[(FORM_REIHENFOLGE.indexOf(form) + 1) % FORM_REIHENFOLGE.length],
        })
        ctx.requestOverlayRedraw()
      }
    },
    drawOverlay(g, ctx) {
      if (!mitte) return
      const objekt = erzeugeTreppeAusVorgaben(ctx.bauteilVorgaben(), mitte, drehung, '')
      g.save()
      g.globalAlpha = VORSCHAU_DECKKRAFT
      zeichneObjekt(g, ctx.view, objekt, ctx.komponentenRenderKontext())
      g.restore()
    },
  }
}
