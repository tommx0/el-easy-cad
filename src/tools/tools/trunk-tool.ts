import type { Tool, ToolContext } from '../tool'
import { enter, entf, tastenHinweis, wirksam } from '../kontext-aktionen'
import type { KomponentenObjekt, Point, TrunkDockRef, TrunkObjekt } from '../../document-model'
import {
  ebeneFuerNeuesObjekt,
  findeNaechstenDockpunkt,
  naechsterFreierTrunkName,
  neueObjektBasis,
} from '../../document-model'
import { wendeWinkelSnapAn } from '../snapping'
import {
  erzeugeObjektHinzufuegenCommand,
  erzeugeSchachtTrunkAnschlussCommand,
  erzeugeTrunkAndockenCommand,
  erzeugeTrunkMergeCommand,
  mitStrangBenennung,
  strangTitelAmSchacht,
} from '../commands'
import type { Command } from '../command'
import { CompositeCommand } from '../command'
import { gleicheKetteAn, klaereAusfuehrung } from '../trunk-ausfuehrung'
import type { TrunkAblageZiel } from '../trunk-ablage'
import { findeTrunkAblageZiel, frageTrunkVerbindung } from '../trunk-ablage'
import type { SchachtAblageZiel } from '../schacht-ablage'
import { findeSchachtAblageZiel } from '../schacht-ablage'
import { TRUNK_ENDE_TOLERANZ_PX, zeichneDockpunktHighlight } from '../../rendering'
import { t } from '../../sprache'

export const TRUNK_STANDARD_STRICHSTAERKE = 5
export const TRUNK_STANDARD_FARBE = '#C0392B'
const VORSCHAU_FARBE = '#2f7dd1'
const TRUNK_DOCKPUNKT_TOLERANZ_PX = 10
const TRUNK_PFAD_TOLERANZ_PX = 10
const SCHACHT_TOLERANZ_PX = 8

function komponentenAufBlatt(ctx: ToolContext): KomponentenObjekt[] {
  const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
  if (!blatt) return []
  return blatt.objekte.filter((o): o is KomponentenObjekt => o.type === 'komponente')
}

function trunkZielPunkt(ctx: ToolContext, ziel: TrunkAblageZiel): Point | null {
  if (ziel.art === 'pfad') return ziel.punkt
  const trunk = ctx.doc
    .getBlatt(ctx.aktivesBlattId())
    ?.objekte.find((o): o is TrunkObjekt => o.type === 'trunk' && o.id === ziel.trunkId)
  if (!trunk || trunk.wegpunkte.length === 0) return null
  return trunk.wegpunkte[ziel.endeIndex === 0 ? 0 : trunk.wegpunkte.length - 1]
}

function trunkAufBlatt(ctx: ToolContext, trunkId: string): TrunkObjekt | undefined {
  return ctx.doc
    .getBlatt(ctx.aktivesBlattId())
    ?.objekte.find((o): o is TrunkObjekt => o.type === 'trunk' && o.id === trunkId)
}

function verbindeGezeichnetesEnde(
  ctx: ToolContext,
  trunkId: string,
  endeIndex: 0 | 1,
  ziel: TrunkAblageZiel,
): Command | null {
  const blattId = ctx.aktivesBlattId()
  const trunk = ctx.doc
    .getBlatt(blattId)
    ?.objekte.find((o): o is TrunkObjekt => o.type === 'trunk' && o.id === trunkId)
  if (!trunk) {
    ctx.setStatus(t('werkzeuge.trunk.nurEinEnde'))
    return null
  }
  const zielName = trunkAufBlatt(ctx, ziel.trunkId)?.name ?? t('werkzeuge.trunk.andererTrunk')
  try {
    if (ziel.art === 'ende') {
      const { command } = erzeugeTrunkMergeCommand(
        ctx.doc,
        blattId,
        ziel.trunkId,
        ziel.endeIndex,
        trunkId,
        endeIndex,
        ctx.routingSettings(),
        t('werkzeuge.trunk.verschmelzen'),
      )
      command.do()
      ctx.setStatus(t('werkzeuge.trunk.verschmolzenMit', { name: zielName }))
      return command
    }
    const { command } = erzeugeTrunkAndockenCommand(
      ctx.doc,
      blattId,
      trunkId,
      endeIndex,
      ziel.trunkId,
      ziel.t,
      trunk.wegpunkte,
      ctx.routingSettings(),
      t('werkzeuge.trunk.andocken'),
    )
    command.do()
    ctx.setStatus(t('werkzeuge.trunk.angedocktAn', { name: zielName }))
    return command
  } catch (fehler) {
    ctx.setStatus(fehler instanceof Error ? fehler.message : t('werkzeuge.trunk.verbindenNicht'))
    return null
  }
}

interface OffeneVerbindung {
  endeIndex: 0 | 1
  ziel: TrunkAblageZiel
}

function frageUndVerbinde(
  ctx: ToolContext,
  trunkId: string,
  verbindungen: OffeneVerbindung[],
  index: number,
  folge: Command[],
  schachtAnschluesse: OffenerSchachtAnschluss[] = [],
) {
  const fertig = () => frageUndSchliesseAn(ctx, trunkId, schachtAnschluesse, 0, folge)
  if (index >= verbindungen.length) {
    fertig()
    return
  }
  if (!trunkAufBlatt(ctx, trunkId)) {
    fertig()
    return
  }
  const { endeIndex, ziel } = verbindungen[index]
  frageTrunkVerbindung(
    ctx,
    ziel,
    trunkAufBlatt(ctx, ziel.trunkId)?.name ?? t('werkzeuge.trunk.andererTrunk'),
    t(endeIndex === 0 ? 'werkzeuge.trunk.anfangspunkt' : 'werkzeuge.trunk.endpunkt'),
    (bestaetigt) => {
      const weiter = () =>
        frageUndVerbinde(ctx, trunkId, verbindungen, index + 1, folge, schachtAnschluesse)
      const gezeichnet = trunkAufBlatt(ctx, trunkId)
      const zielTrunk = trunkAufBlatt(ctx, ziel.trunkId)
      if (!bestaetigt || !gezeichnet || !zielTrunk) {
        weiter()
        return
      }
      klaereAusfuehrung(
        (optionen) => ctx.oeffneBestaetigung(optionen),
        { name: zielTrunk.name, trunk: zielTrunk },
        { name: gezeichnet.name, trunk: gezeichnet },
        (wahl) => {
          const command = wahl ? verbindeGezeichnetesEnde(ctx, trunkId, endeIndex, ziel) : null
          if (command && wahl) {
            folge.push(gleicheKetteAn(ctx.doc, ctx.aktivesBlattId(), ziel.trunkId, wahl, command))
          } else if (!wahl) ctx.setStatus(t('werkzeuge.trunk.nichtVerbunden'))
          weiter()
        },
      )
    },
  )
}

interface OffenerSchachtAnschluss {
  endeIndex: 0 | 1
  ziel: SchachtAblageZiel
}

function frageUndSchliesseAn(
  ctx: ToolContext,
  trunkId: string,
  anschluesse: OffenerSchachtAnschluss[],
  index: number,
  folge: Command[],
) {
  const fertig = () => {
    ctx.commands.push(
      folge.length === 1
        ? folge[0]
        : new CompositeCommand(t('werkzeuge.trunk.zeichnenVerbinden'), folge),
    )
  }
  if (index >= anschluesse.length || !trunkAufBlatt(ctx, trunkId)) {
    fertig()
    return
  }
  const { endeIndex, ziel } = anschluesse[index]
  const blattId = ctx.aktivesBlattId()
  ctx.oeffneSchachtAnschlussDialog(
    { blattId, schachtId: ziel.schachtId, art: 'trunk', objektId: trunkId },
    (ergebnis) => {
      const strang = ergebnis?.art === 'strang' ? ergebnis.strang : null
      if (strang !== null) {
        const benennung = {
          blattId,
          schachtId: ziel.schachtId,
          strang,
          name: ergebnis?.art === 'strang' ? ergebnis.name : undefined,
        }
        try {
          const command = erzeugeSchachtTrunkAnschlussCommand(
            ctx.doc,
            blattId,
            trunkId,
            endeIndex,
            ziel.schachtId,
            strang,
            t('werkzeuge.trunk.anSchacht'),
            ctx.routingSettings(),
          )
          folge.push(mitStrangBenennung(ctx.doc, command, [benennung]))
          ctx.setStatus(
            t('werkzeuge.trunk.anStrang', { titel: strangTitelAmSchacht(ctx.doc, benennung) }),
          )
        } catch (fehler) {
          ctx.setStatus(
            fehler instanceof Error ? fehler.message : t('werkzeuge.trunk.anschlussNicht'),
          )
        }
      }
      frageUndSchliesseAn(ctx, trunkId, anschluesse, index + 1, folge)
    },
  )
}

export function erzeugeTrunkTool(): Tool {
  let punkte: Point[] = []
  let punkteDockRefs: (TrunkDockRef | null)[] = []
  let punkteTrunkZiele: (TrunkAblageZiel | null)[] = []
  let punkteSchachtZiele: (SchachtAblageZiel | null)[] = []
  let aktuell: Point | null = null
  let hoverDock: ReturnType<typeof findeNaechstenDockpunkt> = null
  let hoverTrunkZiel: TrunkAblageZiel | null = null
  let hoverSchachtZiel: SchachtAblageZiel | null = null

  function zuruecksetzen() {
    punkte = []
    punkteDockRefs = []
    punkteTrunkZiele = []
    punkteSchachtZiele = []
    aktuell = null
    hoverDock = null
    hoverTrunkZiel = null
    hoverSchachtZiel = null
  }

  function statusText(): string {
    if (punkte.length === 0) {
      return t('werkzeuge.trunk.anfang')
    }
    return t('werkzeuge.trunk.weiter', {
      tasteEnter: tastenHinweis(t('werkzeuge.tasten.oderEnter')),
      tasteEntf: tastenHinweis(t('werkzeuge.tasten.oderEntf')),
    })
  }

  function letztenPunktEntfernen(ctx: ToolContext) {
    if (punkte.length === 0) return
    punkte.pop()
    punkteDockRefs.pop()
    punkteTrunkZiele.pop()
    punkteSchachtZiele.pop()
    ctx.setStatus(statusText())
    ctx.requestOverlayRedraw()
  }

  function abschliessen(ctx: ToolContext) {
    if (punkte.length >= 2) {
      const ersterDock = punkteDockRefs[0]
      const letzterDock = punkteDockRefs[punkteDockRefs.length - 1]
      const ebeneId = ebeneFuerNeuesObjekt(
        'trunk',
        ctx.doc.getBlatt(ctx.aktivesBlattId())?.ebenen ?? [],
        ctx.aktiveEbeneId(),
      )
      const vorgaben = ctx.verlegeVorgaben()
      const objekt: TrunkObjekt = {
        ...neueObjektBasis(ebeneId, {
          farbe: TRUNK_STANDARD_FARBE,
          strichstaerke: TRUNK_STANDARD_STRICHSTAERKE,
        }),
        type: 'trunk',
        name: naechsterFreierTrunkName(ctx.doc.getZeichnung()),
        wegpunkte: [...punkte],
        enden: [
          ersterDock ? { dockRef: ersterDock } : {},
          letzterDock ? { dockRef: letzterDock } : {},
        ],
        ...(vorgaben.trunkAusfuehrung && vorgaben.trunkAusfuehrung !== 'buendel'
          ? { ausfuehrung: vorgaben.trunkAusfuehrung }
          : {}),
        ...(vorgaben.trunkAusfuehrung && vorgaben.trunkAbmessung
          ? { abmessung: vorgaben.trunkAbmessung }
          : {}),
        ...(vorgaben.trunkZone ? { installationszone: vorgaben.trunkZone } : {}),
      }
      const hinzufuegen = erzeugeObjektHinzufuegenCommand(
        ctx.doc,
        ctx.aktivesBlattId(),
        objekt,
        t('werkzeuge.trunk.zeichnen'),
      )
      const verbindungen: OffeneVerbindung[] = []
      const zielAnfang = punkteTrunkZiele[0]
      const zielEnde = punkteTrunkZiele[punkteTrunkZiele.length - 1]
      if (zielAnfang) verbindungen.push({ endeIndex: 0, ziel: zielAnfang })
      if (zielEnde) verbindungen.push({ endeIndex: 1, ziel: zielEnde })

      const schachtAnschluesse: OffenerSchachtAnschluss[] = []
      const schachtAnfang = punkteSchachtZiele[0]
      const schachtEnde = punkteSchachtZiele[punkteSchachtZiele.length - 1]
      if (schachtAnfang) schachtAnschluesse.push({ endeIndex: 0, ziel: schachtAnfang })
      if (schachtEnde) schachtAnschluesse.push({ endeIndex: 1, ziel: schachtEnde })

      if (verbindungen.length === 0 && schachtAnschluesse.length === 0) {
        ctx.commands.execute(hinzufuegen)
      } else {
        hinzufuegen.do()
        frageUndVerbinde(ctx, objekt.id, verbindungen, 0, [hinzufuegen], schachtAnschluesse)
      }
    }
    zuruecksetzen()
    ctx.zurueckZuAuswahl()
  }

  return {
    id: 'trunk',
    get bezeichnung() {
      return t('werkzeugnamen.trunk')
    },
    kuerzel: 'U',

    onActivate(ctx) {
      zuruecksetzen()
      ctx.setStatus(statusText())
    },

    onDeactivate() {
      zuruecksetzen()
    },

    onPointerDown(info, ctx) {
      if (hoverDock) {
        punkte.push(hoverDock.punkt)
        punkteDockRefs.push({
          objektId: hoverDock.objektId,
          dockpunktIndex: hoverDock.dockpunktIndex,
        })
        punkteTrunkZiele.push(null)
        punkteSchachtZiele.push(null)
      } else if (hoverTrunkZiel) {
        punkte.push(trunkZielPunkt(ctx, hoverTrunkZiel) ?? info.world)
        punkteDockRefs.push(null)
        punkteTrunkZiele.push(hoverTrunkZiel)
        punkteSchachtZiele.push(null)
      } else if (hoverSchachtZiel) {
        punkte.push(hoverSchachtZiel.punkt)
        punkteDockRefs.push(null)
        punkteTrunkZiele.push(null)
        punkteSchachtZiele.push(hoverSchachtZiel)
      } else {
        const vorheriger = punkte[punkte.length - 1]
        punkte.push(
          vorheriger ? wendeWinkelSnapAn(vorheriger, info.world, info.shiftKey) : info.world,
        )
        punkteDockRefs.push(null)
        punkteTrunkZiele.push(null)
        punkteSchachtZiele.push(null)
      }
      ctx.setStatus(statusText())
      ctx.requestOverlayRedraw()
    },

    onPointerMove(info, ctx) {
      const toleranz = ctx.view.laengeToWorld(TRUNK_DOCKPUNKT_TOLERANZ_PX)
      const objekteAufBlatt = ctx.doc.getBlatt(ctx.aktivesBlattId())?.objekte ?? []
      hoverDock = findeNaechstenDockpunkt(komponentenAufBlatt(ctx), info.raw, toleranz, 'trunk')
      const trunkZiel = hoverDock
        ? null
        : findeTrunkAblageZiel(
            objekteAufBlatt,
            null,
            info.raw,
            ctx.view.laengeToWorld(TRUNK_ENDE_TOLERANZ_PX),
            ctx.view.laengeToWorld(TRUNK_PFAD_TOLERANZ_PX),
          )
      hoverSchachtZiel =
        hoverDock || trunkZiel?.art === 'ende'
          ? null
          : findeSchachtAblageZiel(
              objekteAufBlatt,
              info.raw,
              ctx.view.laengeToWorld(SCHACHT_TOLERANZ_PX),
            )
      hoverTrunkZiel = hoverSchachtZiel ? null : trunkZiel
      if (punkte.length === 0) {
        ctx.requestOverlayRedraw()
        return
      }
      aktuell = hoverDock
        ? hoverDock.punkt
        : hoverSchachtZiel
          ? hoverSchachtZiel.punkt
          : (hoverTrunkZiel && trunkZielPunkt(ctx, hoverTrunkZiel)) ||
            wendeWinkelSnapAn(punkte[punkte.length - 1], info.world, info.shiftKey)
      ctx.requestOverlayRedraw()
    },

    onDoubleClick(_info, ctx) {
      if (punkte.length > 0) {
        punkte.pop()
        punkteDockRefs.pop()
        punkteTrunkZiele.pop()
        punkteSchachtZiele.pop()
      }
      abschliessen(ctx)
    },

    onRightClick(_info, ctx) {
      if (punkte.length === 0) return false
      letztenPunktEntfernen(ctx)
      return true
    },

    tastenAktionen() {
      return wirksam(
        punkte.length >= 2 && enter(t('werkzeuge.tasten.fertig')),
        punkte.length > 0 && entf(t('werkzeuge.tasten.punktZurueck')),
      )
    },

    onKeyDown(e, ctx) {
      if (e.key === 'Enter') {
        e.preventDefault()
        abschliessen(ctx)
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        letztenPunktEntfernen(ctx)
      }
    },

    drawOverlay(g, ctx) {
      if (hoverDock) {
        zeichneDockpunktHighlight(g, ctx.view, hoverDock.punkt)
      }
      if (hoverSchachtZiel) {
        const mitte = ctx.view.worldToScreen(hoverSchachtZiel.punkt)
        g.save()
        g.strokeStyle = VORSCHAU_FARBE
        g.lineWidth = 2
        g.strokeRect(mitte.x - 5, mitte.y - 5, 10, 10)
        g.restore()
      }
      if (hoverTrunkZiel) {
        const weltPunkt = trunkZielPunkt(ctx, hoverTrunkZiel)
        if (weltPunkt) {
          const mitte = ctx.view.worldToScreen(weltPunkt)
          g.save()
          g.strokeStyle = VORSCHAU_FARBE
          g.fillStyle = VORSCHAU_FARBE
          g.lineWidth = 2
          g.beginPath()
          g.arc(mitte.x, mitte.y, 7, 0, Math.PI * 2)
          if (hoverTrunkZiel.art === 'ende') g.fill()
          else g.stroke()
          g.restore()
        }
      }
      if (punkte.length === 0) return
      const screenPunkte = punkte.map((p) => ctx.view.worldToScreen(p))
      g.save()
      g.strokeStyle = VORSCHAU_FARBE
      g.lineWidth = TRUNK_STANDARD_STRICHSTAERKE
      g.setLineDash([6, 5])
      g.beginPath()
      g.moveTo(screenPunkte[0].x, screenPunkte[0].y)
      for (const p of screenPunkte.slice(1)) g.lineTo(p.x, p.y)
      if (aktuell) {
        const a = ctx.view.worldToScreen(aktuell)
        g.lineTo(a.x, a.y)
      }
      g.stroke()
      g.setLineDash([])
      for (const p of screenPunkte) {
        g.beginPath()
        g.arc(p.x, p.y, 4, 0, Math.PI * 2)
        g.fillStyle = VORSCHAU_FARBE
        g.fill()
      }
      g.restore()
    },
  }
}
