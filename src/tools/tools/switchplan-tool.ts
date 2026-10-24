import type { Tool } from '../tool'
import type { SwitchplanObjekt } from '../../document-model'
import {
  STANDARD_TABELLEN_TEXTHOEHE,
  ermittleAlleSwitches,
  neueObjektBasis,
} from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { t } from '../../sprache'

function erzeugePortplanTool(konfig: {
  id: 'switchplan' | 'patchpanelplan'
  kuerzel?: string
  planArt: 'switch' | 'patchpanel'
}): Tool {
  const id = konfig.id
  return {
    id,
    get bezeichnung() {
      return t(`werkzeugnamen.${id}`)
    },
    kuerzel: konfig.kuerzel,

    onActivate(ctx) {
      ctx.setStatus(t(`werkzeuge.${id}.status`))
    },

    onPointerDown(info, ctx) {
      const kandidaten = ermittleAlleSwitches(
        ctx.doc.getZeichnung(),
        ctx.katalogKomponenten(),
        konfig.planArt,
      )
      const einziger = kandidaten.length === 1 ? kandidaten[0] : null
      const objekt: SwitchplanObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'switchplan',
        position: info.world,
        switchBlattId: einziger ? einziger.blattId : null,
        switchObjektId: einziger ? einziger.objektId : null,
        titel: null,
        textHoehe: STANDARD_TABELLEN_TEXTHOEHE,
        planArt: konfig.planArt,
      }
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t(`werkzeuge.${id}.einsetzen`),
        ),
      )
      ctx.setAuswahl([objekt.id])
      ctx.zurueckZuAuswahl()
      if (!einziger) {
        ctx.setStatus(
          t(kandidaten.length === 0 ? `werkzeuge.${id}.keinGeraet` : `werkzeuge.${id}.eingesetzt`),
        )
      }
    },
  }
}

export function erzeugeSwitchplanTool(): Tool {
  return erzeugePortplanTool({
    id: 'switchplan',
    kuerzel: 'P',
    planArt: 'switch',
  })
}

export function erzeugePatchpanelplanTool(): Tool {
  return erzeugePortplanTool({
    id: 'patchpanelplan',
    planArt: 'patchpanel',
  })
}
