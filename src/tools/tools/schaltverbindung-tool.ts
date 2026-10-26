import type { Tool, ToolContext } from '../tool'
import {
  buchstabe,
  enter,
  gerade as geradeKnopf,
  GERADE_TASTE,
  tab,
  tastenHinweis,
  wirksam,
  ziffernGruppe,
} from '../kontext-aktionen'
import type { Objekt, Point, SchaltverbindungAnschluss } from '../../document-model'
import {
  GERADE_AUSRICHTEN_PAPIER_METER,
  SCHALTPLAN_MASSSTAB_NENNER,
  distance,
  geradeAufSchaltverbindung,
  istSchaltplan,
  schleifeLinienDurch,
  sucheSchaltverbindungTreffer,
} from '../../document-model'
import { erzeugeObjektAendernCommand, erzeugeObjektHinzufuegenCommand } from '../commands'
import { wendeWinkelSnapAn } from '../snapping'
import { schaltplanHindernisse, verlegeSchaltverbindung } from '../schaltverbindung-routing'
import {
  aderToleranz,
  aderverlaeufeFuer,
  baueAdern as baueAdernIn,
  objekteZuAdern,
  sucheDockTrefferIn,
  type Ader,
  type DockTreffer,
} from '../schaltverbindung-bauen'
import { zeichneDockpunktHighlight } from '../../rendering'
import { t } from '../../sprache'

const DOCKPUNKT_TOLERANZ_PX = 10
const STANDARD_POLZAHL = 1
const VORSCHAU_FARBE = '#2f7dd1'
const VORSCHAU_FARBE_KEIN_PFAD = '#d1382f'

function objekteAufBlatt(ctx: ToolContext): Objekt[] {
  return ctx.doc.getBlatt(ctx.aktivesBlattId())?.objekte ?? []
}

function sucheDockTreffer(ctx: ToolContext, weltpunkt: Point, polzahl: number): DockTreffer | null {
  return sucheDockTrefferIn(
    objekteAufBlatt(ctx),
    weltpunkt,
    polzahl,
    ctx.view.laengeToWorld(DOCKPUNKT_TOLERANZ_PX),
  )
}

function ausrichtVersatz(ctx: ToolContext): number {
  const nenner =
    ctx.doc.getBlatt(ctx.aktivesBlattId())?.zeichenflaeche?.massstabNenner ??
    SCHALTPLAN_MASSSTAB_NENNER
  return GERADE_AUSRICHTEN_PAPIER_METER * nenner
}

function sucheTreffer(
  ctx: ToolContext,
  weltpunkt: Point,
  polzahl: number,
  anker?: Point,
): DockTreffer | null {
  const dock = sucheDockTreffer(ctx, weltpunkt, polzahl)
  if (dock) return dock
  const linie = sucheSchaltverbindungTreffer(
    objekteAufBlatt(ctx),
    weltpunkt,
    ctx.view.laengeToWorld(DOCKPUNKT_TOLERANZ_PX),
  )
  if (!linie) return null
  return {
    anschluss: { art: 'schaltverbindung', objektId: linie.objekt.id },
    punkte: [
      anker
        ? geradeAufSchaltverbindung(
            anker,
            linie.punkt,
            linie.objekt.wegpunkte,
            ausrichtVersatz(ctx),
          )
        : linie.punkt,
    ],
  }
}

export function erzeugeSchaltverbindungTool(): Tool {
  let polzahl: 1 | 2 | 3 | 4 | 5 = STANDARD_POLZAHL
  let mehrlinig = false
  let seiteUmgekehrt = false
  let punkte: Point[] = []
  let start: SchaltverbindungAnschluss | null = null
  let aktuell: Point | null = null
  let hoverPunkte: Point[] = []
  let hoverBezeichnungen: (string | null)[] = []
  let aderHoverPunkte: Point[] = []
  let vorschauAdern: Point[][] | null = null
  let keinPfad = false
  let endstueckCache: { anker: Point; ziel: Point; pfad: Point[] | null } | null = null
  let strgGehalten = false
  let geradeEinmal = false

  function zuruecksetzen() {
    punkte = []
    start = null
    aktuell = null
    hoverPunkte = []
    hoverBezeichnungen = []
    aderHoverPunkte = []
    vorschauAdern = null
    keinPfad = false
    endstueckCache = null
    geradeEinmal = false
  }

  function verlaufZumZiel(
    ctx: ToolContext,
    ziel: Point,
    zielAnschluss: SchaltverbindungAnschluss,
    gerade: boolean,
  ): Point[] | null {
    if (gerade) return [...punkte, ziel]
    const anker = ausgerichteterStart(ctx, ziel) ?? punkte[punkte.length - 1]
    if (
      !endstueckCache ||
      distance(endstueckCache.anker, anker) > 1e-9 ||
      distance(endstueckCache.ziel, ziel) > 1e-9
    ) {
      const objekte = objekteAufBlatt(ctx)
      const settings = ctx.routingSettings()
      const ankerAnschluss: SchaltverbindungAnschluss =
        punkte.length === 1 && start ? start : { art: 'frei' }
      endstueckCache = {
        anker,
        ziel,
        pfad: verlegeSchaltverbindung(
          anker,
          ziel,
          ankerAnschluss,
          zielAnschluss,
          objekte,
          schaltplanHindernisse(objekte),
          settings,
        ),
      }
    }
    const pfad = endstueckCache.pfad
    return pfad ? [...punkte.slice(0, -1), ...pfad] : null
  }

  function ausgerichteterStart(ctx: ToolContext, ziel: Point): Point | null {
    if (punkte.length !== 1 || start?.art !== 'schaltverbindung') return null
    const startId = start.objektId
    const linie = objekteAufBlatt(ctx).find((o) => o.id === startId)
    if (linie?.type !== 'schaltverbindung') return null
    return geradeAufSchaltverbindung(ziel, punkte[0], linie.wegpunkte, ausrichtVersatz(ctx))
  }

  function aderAnzahl(): number {
    return mehrlinig ? polzahl : 1
  }

  function suchPolzahl(): number {
    return mehrlinig ? 1 : polzahl
  }

  function aderverlaeufe(verlauf: Point[]): Point[][] {
    return aderverlaeufeFuer(verlauf, aderAnzahl(), seiteUmgekehrt)
  }

  function status(): string {
    const modus = mehrlinig
      ? t('werkzeuge.schaltverbindung.mehrlinigModus', { n: polzahl })
      : t('werkzeuge.schaltverbindung.einlinigModus', { n: polzahl })
    const tasten = t(
      mehrlinig
        ? 'werkzeuge.schaltverbindung.tastenMehrlinig'
        : 'werkzeuge.schaltverbindung.tastenEinlinig',
    )
    const hinweis = `${modus}${tastenHinweis(tasten)}`
    if (punkte.length === 0) {
      return t('werkzeuge.schaltverbindung.start', { hinweis })
    }
    return t('werkzeuge.schaltverbindung.weiter', {
      hinweis,
      tasteStrg: tastenHinweis(t('werkzeuge.tasten.strgGerade')),
      tasteEnter: tastenHinweis(t('werkzeuge.tasten.slashEnter')),
    })
  }

  function baueAdern(
    ctx: ToolContext,
    verlauf: Point[],
    von: SchaltverbindungAnschluss,
    bis: SchaltverbindungAnschluss,
  ): Ader[] {
    return baueAdernIn(objekteAufBlatt(ctx), verlauf, von, bis, {
      aderAnzahl: aderAnzahl(),
      polzahl,
      seiteUmgekehrt,
      toleranz: aderToleranz(ctx.view.laengeToWorld(DOCKPUNKT_TOLERANZ_PX)),
    })
  }

  function abschliessen(
    ctx: ToolContext,
    ziel: SchaltverbindungAnschluss,
    verlauf: Point[] = punkte,
    autoRouting = false,
  ) {
    let durchgeschleift = 0
    if (verlauf.length >= 2 && start) {
      const blattId = ctx.aktivesBlattId()
      const adern = baueAdern(ctx, [...verlauf], start, ziel)
      const objekte = objekteZuAdern(ctx.aktiveEbeneId(), verlauf, adern, polzahl, autoRouting)
      const ids = objekte.map((o) => o.id)
      const durchschleifen = istSchaltplan(ctx.doc.getZeichnung())
      durchgeschleift = durchschleifen
        ? schleifeLinienDurch([...objekteAufBlatt(ctx), ...objekte], ids).bauteile
        : 0
      if (objekte.length === 1 && durchgeschleift === 0) {
        ctx.commands.execute(
          erzeugeObjektHinzufuegenCommand(
            ctx.doc,
            blattId,
            objekte[0],
            t('werkzeuge.schaltverbindung.zeichnen'),
          ),
        )
      } else {
        ctx.commands.execute(
          erzeugeObjektAendernCommand(
            ctx.doc,
            blattId,
            objekte.length === 1
              ? t('werkzeuge.schaltverbindung.zeichnen')
              : t('werkzeuge.schaltverbindung.zeichnenAdern', { n: objekte.length }),
            (bestand) =>
              durchschleifen
                ? schleifeLinienDurch([...bestand, ...objekte], ids).objekte
                : [...bestand, ...objekte],
          ),
        )
      }
    }
    zuruecksetzen()
    ctx.zurueckZuAuswahl()
    if (durchgeschleift > 0)
      ctx.setStatus(t('werkzeuge.schaltverbindung.durchgeschleift', { n: durchgeschleift }))
  }

  function aktualisiereAderHover(ctx: ToolContext) {
    aderHoverPunkte = []
    vorschauAdern = null
    keinPfad = false
    if (punkte.length === 0 || !aktuell) return
    const zielHover = sucheTreffer(ctx, aktuell, suchPolzahl(), punkte[punkte.length - 1])
    const geroutet = zielHover
      ? verlaufZumZiel(ctx, aktuell, zielHover.anschluss, strgGehalten || geradeEinmal)
      : null
    keinPfad = zielHover !== null && geroutet === null
    const adern = baueAdern(
      ctx,
      geroutet ?? [...punkte, aktuell],
      start ?? { art: 'frei' },
      zielHover?.anschluss ?? { art: 'frei' },
    )
    vorschauAdern = adern.map((a) => a.wegpunkte)
    for (const ader of adern.slice(1)) {
      if (ader.start.art !== 'frei') aderHoverPunkte.push(ader.wegpunkte[0])
      if (ader.ziel.art !== 'frei') aderHoverPunkte.push(ader.wegpunkte[ader.wegpunkte.length - 1])
    }
  }

  return {
    id: 'schaltverbindung',
    get bezeichnung() {
      return t('werkzeugnamen.schaltverbindung')
    },
    kuerzel: 'SV',

    onActivate(ctx) {
      zuruecksetzen()
      ctx.setStatus(status())
    },

    onDeactivate() {
      zuruecksetzen()
    },

    onPointerMove(info, ctx) {
      strgGehalten = info.ctrlKey
      const treffer = sucheTreffer(ctx, info.raw, suchPolzahl(), punkte[punkte.length - 1])
      hoverPunkte = treffer?.punkte ?? []
      hoverBezeichnungen = treffer?.bezeichnungen ?? []
      if (punkte.length === 0) {
        aktuell = null
      } else if (treffer) {
        aktuell = treffer.punkte[0]
      } else {
        aktuell = wendeWinkelSnapAn(punkte[punkte.length - 1], info.world, info.shiftKey)
      }
      aktualisiereAderHover(ctx)
      ctx.requestOverlayRedraw()
    },

    onPointerLeave(ctx) {
      hoverPunkte = []
      hoverBezeichnungen = []
      aderHoverPunkte = []
      ctx.requestOverlayRedraw()
    },

    onPointerDown(info, ctx) {
      const treffer = sucheTreffer(ctx, info.raw, suchPolzahl(), punkte[punkte.length - 1])

      if (punkte.length === 0) {
        if (treffer) {
          start = treffer.anschluss
          punkte = [treffer.punkte[0]]
        } else {
          start = { art: 'frei' }
          punkte = [info.world]
        }
        ctx.setStatus(status())
        ctx.requestOverlayRedraw()
        return
      }

      if (treffer) {
        const gerade = info.ctrlKey || geradeEinmal
        const verlauf = verlaufZumZiel(ctx, treffer.punkte[0], treffer.anschluss, gerade)
        if (!verlauf) {
          ctx.setStatus(t('werkzeuge.schaltverbindung.keinWeg'))
          return
        }
        abschliessen(ctx, treffer.anschluss, verlauf, punkte.length === 1 && !gerade)
        return
      }

      const punkt = wendeWinkelSnapAn(punkte[punkte.length - 1], info.world, info.shiftKey)
      punkte = [...punkte, punkt]
      ctx.setStatus(status())
      ctx.requestOverlayRedraw()
    },

    onDoubleClick(_info, ctx) {
      if (punkte.length > 0) punkte = punkte.slice(0, -1)
      if (punkte.length >= 2) abschliessen(ctx, { art: 'frei' })
    },

    tastenAktionen() {
      return wirksam(
        ziffernGruppe(
          t(mehrlinig ? 'werkzeuge.schaltverbindung.adern' : 'werkzeuge.schaltverbindung.pole'),
          [1, 2, 3, 4, 5],
          polzahl,
        ),
        buchstabe('m', t('werkzeuge.schaltverbindung.mehrlinig'), mehrlinig),
        mehrlinig && tab(t('werkzeuge.schaltverbindung.seiteWechseln')),
        punkte.length >= 2 && enter(t('werkzeuge.schaltverbindung.fertigFrei')),
        punkte.length > 0 && geradeKnopf(geradeEinmal || strgGehalten),
      )
    },

    onKeyDown(e, ctx) {
      if (e.key === 'Control' || e.key === GERADE_TASTE) {
        if (e.key === 'Control') strgGehalten = true
        else geradeEinmal = !geradeEinmal
        aktualisiereAderHover(ctx)
        ctx.requestOverlayRedraw()
        return
      }
      if (e.key === 'Enter' && punkte.length >= 2) {
        e.preventDefault()
        abschliessen(ctx, { art: 'frei' })
        return
      }
      if (e.key.toLowerCase() === 'm') {
        mehrlinig = !mehrlinig
        aktualisiereAderHover(ctx)
        ctx.setStatus(status())
        ctx.requestOverlayRedraw()
        return
      }
      if (e.key === 'Tab' && mehrlinig) {
        e.preventDefault()
        seiteUmgekehrt = !seiteUmgekehrt
        aktualisiereAderHover(ctx)
        ctx.requestOverlayRedraw()
        return
      }
      const ziffer = Number(e.key)
      if (Number.isInteger(ziffer) && ziffer >= 1 && ziffer <= 5) {
        polzahl = ziffer as 1 | 2 | 3 | 4 | 5
        mehrlinig = polzahl > 1
        aktualisiereAderHover(ctx)
        ctx.setStatus(status())
        ctx.requestOverlayRedraw()
      }
    },

    onKeyUp(e, ctx) {
      if (e.key !== 'Control') return
      strgGehalten = false
      aktualisiereAderHover(ctx)
      ctx.requestOverlayRedraw()
    },

    drawOverlay(g, ctx) {
      hoverPunkte.forEach((p, i) =>
        zeichneDockpunktHighlight(g, ctx.view, p, hoverBezeichnungen[i]),
      )
      for (const p of aderHoverPunkte) zeichneDockpunktHighlight(g, ctx.view, p)
      if (punkte.length === 0) return
      const verlauf = aktuell ? [...punkte, aktuell] : punkte
      g.save()
      g.strokeStyle = keinPfad ? VORSCHAU_FARBE_KEIN_PFAD : VORSCHAU_FARBE
      g.lineWidth = 1.5
      g.setLineDash([5, 4])
      for (const ader of aktuell && vorschauAdern ? vorschauAdern : aderverlaeufe(verlauf)) {
        const screenPunkte = ader.map((p) => ctx.view.worldToScreen(p))
        g.beginPath()
        g.moveTo(screenPunkte[0].x, screenPunkte[0].y)
        for (const p of screenPunkte.slice(1)) g.lineTo(p.x, p.y)
        g.stroke()
      }
      g.setLineDash([])
      for (const p of punkte.map((q) => ctx.view.worldToScreen(q))) {
        g.beginPath()
        g.arc(p.x, p.y, 3, 0, Math.PI * 2)
        g.fillStyle = VORSCHAU_FARBE
        g.fill()
      }
      g.restore()
    },

    konstruktionsStrecke() {
      if (punkte.length === 0 || !aktuell) return null
      return {
        von: punkte[punkte.length - 1],
        bis: aktuell,
        davor: punkte[punkte.length - 2] ?? null,
        eingebbar: true,
      }
    },
  }
}
