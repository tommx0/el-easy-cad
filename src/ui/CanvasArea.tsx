import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { BoundingBox, LeitungsObjekt, Point, TrunkObjekt } from '../document-model'
import {
  gezeigtePfadSegmente,
  istKlemme,
  boundingBoxCenter,
  ermittlePortSchilder,
  ermittleGeschwisterVerbindungen,
  ermittleGruppenVerbindungen,
  ermittleSlotGrafikMarkierungen,
  ermittleEtagenWirkverbindungen,
  ermittleSlotVerbindungen,
  ermittleSlotZielObjektIds,
  distance,
  getBoundingBox,
  giltNurInBauteilen,
  istKalibriert,
  nurAnsichtGrund,
  raumquerungsUmgebung,
  festerRasterSchritt,
  istSchaltplan,
  treppenGeschosshoehe,
  inZeichenreihenfolge,
  sichtbareObjekteAufBlatt,
  trunkNachbarschaft,
  zeichenflaecheBoundingBox,
} from '../document-model'
import type { KomponentenObjekt, SlotGrafikMarkierung } from '../document-model'
import { weltBoundingBoxInhalt } from '../druck'
import {
  getContexts,
  pruepareContext,
  resizeLayers,
  zeichneAuswahlHighlight,
  zeichneTeilstueckZonen,
  zeichneGeschwisterVerbindungen,
  zeichneGruppenVerbindungen,
  zeichneSlotGrafiken,
  zeichneSlotVerbindungen,
  zeichneWirkverbindungsVerweise,
  wirkverbindungsVerweisRechtecke,
  zeichneSlotZielMarkierung,
  findeSlotGrafikUnterZeiger,
  findeSlotGrafikZelle,
  zeichneDockpunkte,
  zeichneFangpunkt,
  zeichnePortNummern,
  zeichneFadenkreuz,
  zeichneFangmarke,
  zeichneGemerkterPunktMarke,
  zeichneSpurlinie,
  zeichneGrid,
  PAPIER_FARBE,
  zeichneHintergrundBild,
  zeichneObjekt,
  zeichneTreppenDerEtageDarunter,
  zeichneFreieLeitungsNummer,
  zeichneTrunkNummernschilder,
  zeichneSchachtEtagenVerweise,
  ermittleSchachtAnzeige,
  zeichneTrunkEnden,
  holeAbgangsTexte,
  holeKnxBeschriftungen,
  holeAbgangsRaeume,
  holeSwitchAnzeigeDaten,
  ermittleKomponentenFlaechen,
  ermittleLinienHindernisse,
  zeichneZeichenflaecheRahmen,
  zeichneKoordinatennetz,
  NETZ_FARBE,
  NETZ_FELDLINIEN_FARBE,
  zeichneNullpunkt,
  zeichneDemoWasserzeichen,
  FrameScheduler,
  TRUNK_ENDE_TOLERANZ_PX,
  OBJEKTFANG_TOLERANZ_PX,
  type CanvasContextSet,
  type KomponentenRenderKontext,
} from '../rendering'
import { assetUrl } from '../persistence'
import {
  berechneKonstruktionsMass,
  findeFangpunkt,
  hintergrundFangObjekte,
  hinweisFuerAnzeige,
  istMassEingabeLeer,
  kombiniereFangarten,
  punktAusEingabe,
  type MassEingabe,
  findeSpurTreffer,
  hitTestObjekt,
  hitTestObjekte,
  merkeOderVergissPunkt,
  wendeSnapAn,
  SPURFANG_VERWEILDAUER_MS,
  type FangTreffer,
  type GemerkterPunkt,
  type PointerInfo,
  type SpurTreffer,
} from '../tools'
import {
  ermittleNetzfeld,
  getFangpunkt,
  netzfeldName,
  nullpunktVon,
  WAND_STAERKE_MIN,
} from '../document-model'
import { istEingabeFeldFokussiert } from './tastatur-fokus'
import { abonniereMassEingabe, fordereMassEingabeAn, meldeZeigerStand } from './statusleiste-signal'
import { useAktivesBlatt, useAppContext, useProject } from './use-app-context'
import { useKatalogStore } from './store/katalog-store'
import { useSettingsStore } from './store/settings-store'
import { useFreigeschalteteModule } from './lizenz-module'
import { hintergrundFangRaster } from './hintergrund-fang-quelle'
import { istModalerDialogOffen, useUiStore } from './store/ui-store'
import { IconMehr } from './components/Icons'
import { BauteilVorgabenLeiste } from './BauteilVorgabenLeiste'
import { VerlegeVorgabenLeiste } from './VerlegeVorgabenLeiste'
import { ZahlenFeld } from './ZahlenFeld'
import { Kontextleiste } from './Kontextleiste'
import { TouchGesten, type TouchGestenZiel } from './touch-gesten'
import { hatTaste } from './befehle/kuerzel'
import { bauplanZeichnungen, tabellenVerknuepfung, verteilerplanZeichnungen } from './verknuepfung'
import { beobachteOberflaechensprache, t } from '../sprache'
import { planspracheVon, planUebersetzer } from '../document-model'

const RECHTSKLICK_ZUG_SCHWELLE_PX = 4
const KONTEXTMENU_TOLERANZ_PX = 6

type Modifikatoren = { shiftKey: boolean; ctrlKey: boolean; altKey: boolean; metaKey?: boolean }

function modifikatorenVon(e: {
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
}): Modifikatoren {
  return { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey }
}

function istFingerOderStift(e: { pointerType: string }): boolean {
  return e.pointerType === 'touch' || e.pointerType === 'pen'
}

function findeTrunkEndeTreffer(
  trunks: TrunkObjekt[],
  punkt: Point,
  toleranz: number,
): { trunkId: string; endeIndex: 0 | 1 } | null {
  for (const trunk of trunks) {
    for (const endeIndex of [0, 1] as const) {
      const ort = endeIndex === 0 ? trunk.wegpunkte[0] : trunk.wegpunkte[trunk.wegpunkte.length - 1]
      if (distance(punkt, ort) <= toleranz) return { trunkId: trunk.id, endeIndex }
    }
  }
  return null
}

export function CanvasArea() {
  const {
    view,
    doc,
    toolManager,
    toolContext,
    overlaySignal,
    canvasGroesse,
    catalogStore,
    kameraProBlatt,
    verknuepfung,
  } = useAppContext()
  const freigeschaltet = useFreigeschalteteModule()
  const blatt = useAktivesBlatt()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hintergrundCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const inhaltCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const kontexteRef = useRef<CanvasContextSet | null>(null)
  const groesseRef = canvasGroesse
  const vorherigeBlattId = useRef<string | null>(null)
  const mausScreenRef = useRef<Point | null>(null)
  const massEingabeRef = useRef<MassEingabe | null>(null)
  const panRef = useRef<{ startScreen: Point; startOffset: Point; bewegt: boolean } | null>(null)
  const letzterFangTrefferRef = useRef<FangTreffer | null>(null)
  const letzterSpurTrefferRef = useRef<SpurTreffer | null>(null)
  const gemerktePunkteRef = useRef<GemerkterPunkt[]>([])
  const verweilTimerRef = useRef<number | null>(null)
  const hoverKomponenteIdRef = useRef<string | null>(null)
  const dTasteGehaltenRef = useRef(false)
  const slotGrafikenRef = useRef<readonly SlotGrafikMarkierung[]>([])
  const slotLupeObjektIdRef = useRef<string | null>(null)
  const slotZeigerSlotIdRef = useRef<string | null>(null)
  const slotAuswahlRef = useRef<{ objektId: string; slotId: string } | null>(null)
  const slotKlickLaeuftRef = useRef(false)
  const verweilPunktRef = useRef<Point | null>(null)
  const [, forceRender] = useState(0)
  const [canvasVermessen, setCanvasVermessen] = useState(false)

  const [hinweisEingeklappt, setHinweisEingeklappt] = useState(false)

  const statusText = useUiStore((s) => s.statusText)
  const kontextleisteSichtbar = useSettingsStore((s) => s.kontextleisteSichtbar)
  const touchBedienung = useUiStore((s) => s.touchBedienung)
  const auswahlIds = useUiStore((s) => s.auswahlIds)
  const aktivesToolId = useUiStore((s) => s.aktivesToolId)
  const wandStaerke = useUiStore((s) => s.wandStaerke)
  const setWandStaerke = useUiStore((s) => s.setWandStaerke)
  const zeichnung = useProject()

  const zeichnenRef = useRef({
    hintergrund: () => {},
    inhalt: () => {},
    overlay: () => {},
  })
  const hintergrundScheduler = useRef(
    new FrameScheduler(() => zeichnenRef.current.hintergrund()),
  ).current
  const inhaltScheduler = useRef(new FrameScheduler(() => zeichnenRef.current.inhalt())).current
  const overlayScheduler = useRef(new FrameScheduler(() => zeichnenRef.current.overlay())).current

  function zoomeAufAlles() {
    const zeichnung = doc.getZeichnung()
    const aktuell = zeichnung.blaetter.find((b) => b.id === blatt.id) ?? blatt
    const bb = weltBoundingBoxInhalt(aktuell)
    if (bb) {
      view.fitBoundingBox(bb, groesseRef)
    } else {
      view.scale = 100
      view.offset = { x: groesseRef.breite / 2, y: groesseRef.hoehe / 2 }
    }
  }

  function zoomeAufDruckbereich() {
    if (!blatt.zeichenflaeche) {
      zoomeAufAlles()
      return
    }
    view.fitBoundingBox(zeichenflaecheBoundingBox(blatt.zeichenflaeche), groesseRef)
  }

  zeichnenRef.current.hintergrund = () => {
    const ctxSet = kontexteRef.current
    if (!ctxSet) return
    pruepareContext(ctxSet.hintergrund)
    const { breite, hoehe } = groesseRef
    const { rasterSichtbar } = useUiStore.getState()
    const { gridBasisSchritt } = useSettingsStore.getState()
    const hatHintergrundbild = Boolean(blatt.hintergrund)

    if (!hatHintergrundbild && rasterSichtbar) {
      zeichneGrid(
        ctxSet.hintergrund,
        view,
        breite,
        hoehe,
        gridBasisSchritt,
        false,
        nullpunktVon(blatt),
        festerRasterSchritt(zeichnung),
      )
    } else {
      ctxSet.hintergrund.save()
      ctxSet.hintergrund.fillStyle = PAPIER_FARBE
      ctxSet.hintergrund.fillRect(0, 0, breite, hoehe)
      ctxSet.hintergrund.restore()
    }

    if (hatHintergrundbild) {
      zeichneHintergrundBild(
        ctxSet.hintergrund,
        view,
        blatt,
        () => hintergrundScheduler.request(),
        assetUrl,
      )
      if (rasterSichtbar) {
        zeichneGrid(
          ctxSet.hintergrund,
          view,
          breite,
          hoehe,
          gridBasisSchritt,
          true,
          nullpunktVon(blatt),
          festerRasterSchritt(zeichnung),
        )
      }
    }

    if (istSchaltplan(zeichnung) && blatt.zeichenflaeche) {
      zeichneKoordinatennetz(ctxSet.hintergrund, view, blatt.zeichenflaeche, {
        farbe: NETZ_FARBE,
        linienbreitePx: 1,
        feldlinien: { farbe: NETZ_FELDLINIEN_FARBE, linienbreitePx: 1 },
      })
    }
  }

  zeichnenRef.current.inhalt = () => {
    const ctxSet = kontexteRef.current
    if (!ctxSet) return
    pruepareContext(ctxSet.inhalt)
    const { breite, hoehe } = groesseRef
    ctxSet.inhalt.clearRect(0, 0, breite, hoehe)
    const katalogKomponenten = useKatalogStore.getState().komponenten
    const switchDaten = holeSwitchAnzeigeDaten(
      doc.getZeichnung(),
      katalogKomponenten,
      verteilerplanZeichnungen(verknuepfung.getStand()),
    )
    const komponentenRahmen: KomponentenRenderKontext = {
      tp: planUebersetzer(doc.getZeichnung()),
      plansprache: planspracheVon(doc.getZeichnung()),
      katalogKomponenten,
      catalogStore,
      aufNeuZeichnenAnfordern: () => inhaltScheduler.request(),
      poeSummen: switchDaten.poeSummen,
      traegerMitModulen: switchDaten.traegerMitModulen,
      traegerVollBelegt: switchDaten.traegerVollBelegt,
      querverweisTexte: switchDaten.querverweisTexte,
      knxKanalVerweise: switchDaten.knxKanalVerweise,
      stromkreisTexte: switchDaten.stromkreisTexte,
      blattverweise: switchDaten.blattverweise,
      abgangsTexte: doc.getZeichnung().verteilerKennzeichen
        ? holeAbgangsTexte(
            doc.getZeichnung(),
            bauplanZeichnungen(verknuepfung.getStand()),
            katalogKomponenten,
          )
        : undefined,
      abgangsRaeume: doc.getZeichnung().verteilerKennzeichen
        ? holeAbgangsRaeume(doc.getZeichnung())
        : undefined,
      knxBeschriftungen: doc.getZeichnung().verteilerKennzeichen
        ? holeKnxBeschriftungen(doc.getZeichnung(), bauplanZeichnungen(verknuepfung.getStand()))
        : undefined,
      tabellenKontext: {
        zeichnung: doc.getZeichnung(),
        blattId: blatt.id,
        katalog: katalogKomponenten,
        ...tabellenVerknuepfung(verknuepfung.getStand()),
      },
      auswahlIds: new Set(useUiStore.getState().auswahlIds),
      blattAnzeige: blatt,
      alleObjekteAufBlatt: blatt.objekte,
      schaltplan: istSchaltplan(doc.getZeichnung()),
      treppenGeschosshoehe: treppenGeschosshoehe(doc.getZeichnung(), blatt),
    }
    zeichneTreppenDerEtageDarunter(ctxSet.inhalt, view, doc.getZeichnung(), blatt)
    const sichtbareBlattObjekte = sichtbareObjekteAufBlatt(blatt)
    for (const objekt of inZeichenreihenfolge(sichtbareBlattObjekte, blatt.objekte)) {
      const gezeigt =
        objekt.type === 'leitung'
          ? gezeigtePfadSegmente(objekt, blatt, doc.getZeichnung().installationszonen)
          : null
      if (objekt.type === 'leitung' && gezeigt !== objekt.pfadSegmente) {
        zeichneObjekt(ctxSet.inhalt, view, { ...objekt, pfadSegmente: gezeigt! }, komponentenRahmen)
      } else {
        zeichneObjekt(ctxSet.inhalt, view, objekt, komponentenRahmen)
      }
    }

    const zeichnung = doc.getZeichnung()
    const bezeichnerHindernisse = {
      flaechen: ermittleKomponentenFlaechen(ctxSet.inhalt, view, blatt.objekte, komponentenRahmen),
      linien: ermittleLinienHindernisse(view, blatt.objekte),
    }
    const trunkKanten = trunkNachbarschaft(zeichnung)
    for (const objekt of sichtbareBlattObjekte) {
      if (objekt.type === 'leitung') {
        zeichneFreieLeitungsNummer(
          ctxSet.inhalt,
          view,
          objekt,
          blatt,
          bezeichnerHindernisse,
          doc.getZeichnung().kabeltypen,
          katalogKomponenten,
        )
        continue
      }
      if (objekt.type !== 'trunk') continue
      zeichneTrunkNummernschilder(
        ctxSet.inhalt,
        view,
        objekt,
        blatt,
        blatt.objekte,
        ermittlePortSchilder(zeichnung, blatt.id, objekt, katalogKomponenten),
        bezeichnerHindernisse,
      )
      zeichneTrunkEnden(
        ctxSet.inhalt,
        view,
        zeichnung,
        blatt.id,
        objekt,
        blatt,
        bezeichnerHindernisse,
        trunkKanten,
      )
    }

    if (useUiStore.getState().produktlizenzStatus?.betriebsmodus === 'demo') {
      zeichneDemoWasserzeichen(ctxSet.inhalt, breite, hoehe, komponentenRahmen.tp)
    }
  }

  zeichnenRef.current.overlay = () => {
    const ctxSet = kontexteRef.current
    if (!ctxSet) return
    pruepareContext(ctxSet.overlay)
    const { breite, hoehe } = groesseRef
    ctxSet.overlay.clearRect(0, 0, breite, hoehe)
    const komponenten = blatt.objekte.filter((o): o is KomponentenObjekt => o.type === 'komponente')
    const zeigeAlleDockpunkte =
      toolManager.getAktivesToolId() === 'leitung' || dTasteGehaltenRef.current
    const sichtbareKomponenten = zeigeAlleDockpunkte
      ? komponenten
      : komponenten.filter((k) => k.id === hoverKomponenteIdRef.current)
    if (sichtbareKomponenten.length > 0) {
      zeichneDockpunkte(
        ctxSet.overlay,
        view,
        sichtbareKomponenten,
        toolManager.getAktivesTool()?.dockpunkteAngeboten?.(),
      )
      zeichnePortNummern(ctxSet.overlay, view, sichtbareKomponenten)
    }
    const auswahl = useUiStore.getState().auswahlIds
    if (auswahl.length > 0) {
      const objekte = blatt.objekte.filter((o) => auswahl.includes(o.id))
      if (objekte.length > 0) {
        zeichneAuswahlHighlight(
          ctxSet.overlay,
          view,
          objekte,
          {
            zeichnung: doc.getZeichnung(),
            blattId: blatt.id,
            katalog: useKatalogStore.getState().komponenten,
          },
          blatt.objekte,
        )
      }
      const mitTeilstuecken = objekte.filter(
        (o): o is LeitungsObjekt =>
          o.type === 'leitung' &&
          (!!o.teilstueckZonen?.length || giltNurInBauteilen(o, blatt.geschoss)),
      )
      if (mitTeilstuecken.length > 0)
        zeichneTeilstueckZonen(
          ctxSet.overlay,
          view,
          mitTeilstuecken,
          blatt.objekte,
          [],
          raumquerungsUmgebung(blatt, doc.getZeichnung().installationszonen),
          doc.getZeichnung().installationszonen,
        )
      if (objekte.length === 1 && objekte[0].type === 'komponente') {
        zeichneFangpunkt(ctxSet.overlay, view, getFangpunkt(objekte[0]))
      }
      for (const objekt of objekte) {
        if (objekt.type !== 'kabelschacht') continue
        zeichneSchachtEtagenVerweise(
          ctxSet.overlay,
          view,
          objekt,
          ermittleSchachtAnzeige(
            doc.getZeichnung(),
            blatt.id,
            objekt,
            useKatalogStore.getState().komponenten,
          ),
        )
      }
      const komponentenInAuswahl = objekte.filter(
        (o): o is KomponentenObjekt => o.type === 'komponente',
      )
      const ausgewaehlteKomponenten = komponentenInAuswahl.length === 1 ? komponentenInAuswahl : []
      const linienKomponenten = blatt.wirkverbindungSichtbar ? ausgewaehlteKomponenten : []
      const slotVerbindungen = linienKomponenten.flatMap((o) =>
        ermittleSlotVerbindungen(o, blatt.id, doc.getZeichnung()),
      )
      if (slotVerbindungen.length > 0) {
        zeichneSlotVerbindungen(ctxSet.overlay, view, slotVerbindungen)
      }
      for (const o of linienKomponenten) {
        const verweise = ermittleEtagenWirkverbindungen(
          o,
          blatt.id,
          doc.getZeichnung(),
          useKatalogStore.getState().komponenten,
          planUebersetzer(doc.getZeichnung()),
        )
        zeichneWirkverbindungsVerweise(
          ctxSet.overlay,
          view,
          wirkverbindungsVerweisRechtecke(view, o, blatt, verweise),
        )
      }
      const gruppenVerbindungen = linienKomponenten.flatMap((o) =>
        ermittleGruppenVerbindungen(o, blatt.id, doc.getZeichnung()),
      )
      if (gruppenVerbindungen.length > 0) {
        zeichneGruppenVerbindungen(ctxSet.overlay, view, gruppenVerbindungen)
      }
      const geschwisterVerbindungen = linienKomponenten.flatMap((o) =>
        ermittleGeschwisterVerbindungen(o, blatt.id, doc.getZeichnung()),
      )
      if (geschwisterVerbindungen.length > 0) {
        zeichneGeschwisterVerbindungen(ctxSet.overlay, view, geschwisterVerbindungen)
      }
      const slotGrafikMarkierungen = ermittleSlotGrafikMarkierungen(
        ausgewaehlteKomponenten,
        blatt.id,
        doc.getZeichnung(),
      )
      slotGrafikenRef.current = slotGrafikMarkierungen
      const grafikVorhanden = (id: string | null) =>
        id !== null && slotGrafikMarkierungen.some((m) => m.objektId === id)
      if (!grafikVorhanden(slotLupeObjektIdRef.current)) {
        slotLupeObjektIdRef.current = null
        slotZeigerSlotIdRef.current = null
      }
      if (!grafikVorhanden(slotAuswahlRef.current?.objektId ?? null)) slotAuswahlRef.current = null
      const slotAuswahl = slotAuswahlRef.current
      if (slotAuswahl) {
        const quelle = blatt.objekte.find(
          (o): o is KomponentenObjekt => o.type === 'komponente' && o.id === slotAuswahl.objektId,
        )
        const zielIds = quelle
          ? new Set(
              ermittleSlotZielObjektIds(quelle, slotAuswahl.slotId, blatt.id, doc.getZeichnung()),
            )
          : new Set<string>()
        if (zielIds.size > 0) {
          zeichneSlotZielMarkierung(
            ctxSet.overlay,
            view,
            blatt.objekte.filter((o) => zielIds.has(o.id)),
          )
        }
      }
      if (slotGrafikMarkierungen.length > 0) {
        zeichneSlotGrafiken(ctxSet.overlay, view, slotGrafikMarkierungen, {
          vergroessertObjektId: slotLupeObjektIdRef.current,
          zeigerSlotId: slotZeigerSlotIdRef.current,
          gewaehlt: slotAuswahlRef.current,
        })
      }
    } else {
      slotGrafikenRef.current = []
      slotLupeObjektIdRef.current = null
      slotZeigerSlotIdRef.current = null
      slotAuswahlRef.current = null
    }
    if (
      blatt.zeichenflaeche &&
      !istSchaltplan(zeichnung) &&
      toolManager.getAktivesToolId() !== 'zeichenflaeche-verschieben'
    ) {
      zeichneZeichenflaecheRahmen(
        ctxSet.overlay,
        view,
        blatt.zeichenflaeche,
        planUebersetzer(doc.getZeichnung()),
      )
    }
    const liveNullpunkt = toolManager.getAktivesTool()?.liveNullpunkt?.() ?? null
    const nullpunktWerkzeugLaeuft =
      toolManager.getAktivesTool()?.konstruktionsStrecke?.() &&
      toolManager.getAktivesToolId() === 'nullpunkt'
    if (liveNullpunkt) {
      zeichneNullpunkt(ctxSet.overlay, view, liveNullpunkt, blatt.nullpunktRichtung)
    } else if (blatt.nullpunkt && !nullpunktWerkzeugLaeuft) {
      zeichneNullpunkt(ctxSet.overlay, view, blatt.nullpunkt, blatt.nullpunktRichtung)
    }
    for (const gemerkt of gemerktePunkteRef.current) {
      zeichneGemerkterPunktMarke(ctxSet.overlay, view, gemerkt.punkt)
    }
    if (letzterSpurTrefferRef.current) {
      for (const gerade of letzterSpurTrefferRef.current.geraden) {
        zeichneSpurlinie(ctxSet.overlay, view, gerade.punkt, gerade.richtung, breite, hoehe)
      }
      if (letzterSpurTrefferRef.current.art === 'spurkreuz') {
        zeichneFangmarke(ctxSet.overlay, view, letzterSpurTrefferRef.current.punkt, 'schnitt')
      }
    }
    if (letzterFangTrefferRef.current) {
      zeichneFangmarke(
        ctxSet.overlay,
        view,
        letzterFangTrefferRef.current.punkt,
        letzterFangTrefferRef.current.art,
      )
    }
    toolManager.drawOverlay(ctxSet.overlay)
    if (mausScreenRef.current) {
      zeichneFadenkreuz(ctxSet.overlay, mausScreenRef.current, breite, hoehe)
    }
    meldeStatus()
    const ui = useUiStore.getState()
    if (useSettingsStore.getState().kontextleisteSichtbar || ui.touchBedienung) {
      ui.setKontextAktionen(toolManager.getAktivesTool()?.tastenAktionen?.(toolContext) ?? [])
    } else if (ui.kontextAktionen.length > 0) {
      ui.setKontextAktionen([])
    }
  }

  function meldeStatus() {
    const screen = mausScreenRef.current
    const aktivesBlatt = doc.getAktivesBlatt()
    const bezug = nullpunktVon(aktivesBlatt)
    const welt = screen ? view.screenToWorld(screen) : null
    const feld =
      welt && aktivesBlatt.zeichenflaeche && istSchaltplan(doc.getZeichnung())
        ? ermittleNetzfeld(aktivesBlatt.zeichenflaeche, welt)
        : null
    const strecke = offeneKonstruktionsStrecke()
    if (!strecke) massEingabeRef.current = null
    meldeZeigerStand({
      welt: welt ? { x: welt.x - bezug.x, y: welt.y - bezug.y } : null,
      zoomProzent: view.zoomFaktor() * 100,
      mass: strecke ? berechneKonstruktionsMass(strecke) : null,
      netzfeld: feld ? netzfeldName(feld) : null,
    })
  }

  function alleSchichtenNeuZeichnen() {
    hintergrundScheduler.request()
    inhaltScheduler.request()
    overlayScheduler.request()
    meldeStatus()
  }

  useEffect(() => {
    const container = containerRef.current
    if (
      !container ||
      !hintergrundCanvasRef.current ||
      !inhaltCanvasRef.current ||
      !overlayCanvasRef.current
    )
      return
    kontexteRef.current = getContexts({
      hintergrund: hintergrundCanvasRef.current,
      inhalt: inhaltCanvasRef.current,
      overlay: overlayCanvasRef.current,
    })

    const beobachter = new ResizeObserver((eintraege) => {
      const eintrag = eintraege[0]
      if (!eintrag) return
      const { width, height } = eintrag.contentRect
      groesseRef.breite = width
      groesseRef.hoehe = height
      resizeLayers(
        {
          hintergrund: hintergrundCanvasRef.current!,
          inhalt: inhaltCanvasRef.current!,
          overlay: overlayCanvasRef.current!,
        },
        width,
        height,
      )
      alleSchichtenNeuZeichnen()
      if (width > 0 && height > 0) {
        setCanvasVermessen(true)
      }
    })
    beobachter.observe(container)
    return () => beobachter.disconnect()
  }, [])

  useEffect(() => {
    const map = kameraProBlatt
    const vorherige = vorherigeBlattId.current
    if (vorherige && vorherige !== blatt.id) {
      map.set(vorherige, { scale: view.scale, offset: { ...view.offset } })
    }
    const gespeichert = map.get(blatt.id)
    if (gespeichert) {
      view.scale = gespeichert.scale
      view.offset = gespeichert.offset
    } else if (groesseRef.breite > 0 && groesseRef.hoehe > 0) {
      zoomeAufDruckbereich()
      map.set(blatt.id, { scale: view.scale, offset: { ...view.offset } })
    }
    vorherigeBlattId.current = blatt.id
    alleSchichtenNeuZeichnen()
  }, [blatt.id, canvasVermessen])

  useEffect(() => {
    return doc.subscribe(() => {
      inhaltScheduler.request()
      hintergrundScheduler.request()
      overlayScheduler.request()
      gemerktePunkteRef.current = []
    })
  }, [])

  useEffect(() => {
    return verknuepfung.subscribe(() => inhaltScheduler.request())
  }, [])

  useEffect(() => {
    return overlaySignal.subscribe(() => overlayScheduler.request())
  }, [])

  useEffect(() => {
    const keineMods = { shiftKey: false, ctrlKey: false, altKey: false }
    return abonniereMassEingabe((ereignis) => {
      massEingabeRef.current = ereignis.eingabe
      const strecke = offeneKonstruktionsStrecke()
      if (!strecke?.eingebbar) return
      if (ereignis.art === 'bestaetigen' && istMassEingabeLeer(ereignis.eingabe)) {
        toolManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))
        overlayScheduler.request()
        return
      }
      const basis = mausScreenRef.current
        ? pointerInfoAusScreen(mausScreenRef.current, 0, keineMods).world
        : strecke.bis
      const ziel = pointerInfoFuerPunkt(mitMassEingabe(basis))
      if (ereignis.art === 'aenderung') {
        toolManager.handlePointerMove(ziel)
      } else {
        toolManager.handlePointerDown(ziel)
        massEingabeRef.current = null
        if (mausScreenRef.current) {
          toolManager.handlePointerMove(pointerInfoAusScreen(mausScreenRef.current, 0, keineMods))
        }
      }
      overlayScheduler.request()
    })
  }, [])

  useEffect(() => {
    function handleZiffer(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || !/^[0-9.,]$/.test(e.key)) return
      if (istEingabeFeldFokussiert() || istModalerDialogOffen()) return
      const strecke = offeneKonstruktionsStrecke()
      if (!strecke?.eingebbar) return
      e.preventDefault()
      e.stopPropagation()
      fordereMassEingabeAn(e.key)
    }
    window.addEventListener('keydown', handleZiffer, true)
    return () => window.removeEventListener('keydown', handleZiffer, true)
  }, [])

  useEffect(() => {
    return toolManager.subscribe(() => {
      gemerktePunkteRef.current = []
      overlayScheduler.request()
    })
  }, [])

  useEffect(() => {
    let vorherRasterSichtbar = useUiStore.getState().rasterSichtbar
    const ausUiStore = useUiStore.subscribe((s) => {
      if (s.rasterSichtbar !== vorherRasterSichtbar) {
        vorherRasterSichtbar = s.rasterSichtbar
        hintergrundScheduler.request()
      }
    })
    let vorherGridBasisSchritt = useSettingsStore.getState().gridBasisSchritt
    let vorherKontextleiste = useSettingsStore.getState().kontextleisteSichtbar
    const ausSettingsStore = useSettingsStore.subscribe((s) => {
      if (s.gridBasisSchritt !== vorherGridBasisSchritt) {
        vorherGridBasisSchritt = s.gridBasisSchritt
        hintergrundScheduler.request()
      }
      if (s.kontextleisteSichtbar !== vorherKontextleiste) {
        vorherKontextleiste = s.kontextleisteSichtbar
        overlayScheduler.request()
      }
    })
    const ausSprache = beobachteOberflaechensprache(() => {
      hintergrundScheduler.request()
      inhaltScheduler.request()
      overlayScheduler.request()
      forceRender((n) => n + 1)
    })
    return () => {
      ausUiStore()
      ausSettingsStore()
      ausSprache()
    }
  }, [])

  const vorherigeAuswahlRef = useRef<string[]>([])
  useEffect(() => {
    overlayScheduler.request()
    const betrifftSchacht = (ids: string[]) =>
      blatt.objekte.some((o) => o.type === 'kabelschacht' && ids.includes(o.id))
    if (betrifftSchacht(auswahlIds) || betrifftSchacht(vorherigeAuswahlRef.current)) {
      inhaltScheduler.request()
    }
    vorherigeAuswahlRef.current = auswahlIds
  }, [auswahlIds])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!hatTaste(e) || e.repeat || e.key.toLowerCase() !== 'd' || istEingabeFeldFokussiert())
        return
      dTasteGehaltenRef.current = true
      overlayScheduler.request()
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (!hatTaste(e) || e.key.toLowerCase() !== 'd') return
      dTasteGehaltenRef.current = false
      overlayScheduler.request()
    }
    function handleBlur() {
      dTasteGehaltenRef.current = false
      overlayScheduler.request()
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  useEffect(() => {
    function aufZoomAlles() {
      zoomeAufAlles()
      kameraProBlatt.set(blatt.id, { scale: view.scale, offset: { ...view.offset } })
      alleSchichtenNeuZeichnen()
      forceRender((n) => n + 1)
    }
    function aufZoom100() {
      const zentrum = { x: groesseRef.breite / 2, y: groesseRef.hoehe / 2 }
      view.setZoom100(zentrum, groesseRef)
      kameraProBlatt.set(blatt.id, { scale: view.scale, offset: { ...view.offset } })
      alleSchichtenNeuZeichnen()
      forceRender((n) => n + 1)
    }
    function aufZoomFaktor(faktor: number) {
      const zentrum = { x: groesseRef.breite / 2, y: groesseRef.hoehe / 2 }
      view.zoomAt(zentrum, faktor)
      kameraProBlatt.set(blatt.id, { scale: view.scale, offset: { ...view.offset } })
      alleSchichtenNeuZeichnen()
      forceRender((n) => n + 1)
    }
    function aufEinpassen(ereignis: Event) {
      const bb = (ereignis as CustomEvent<BoundingBox>).detail
      if (!bb) return
      view.fitBoundingBox(bb, groesseRef)
      kameraProBlatt.set(blatt.id, { scale: view.scale, offset: { ...view.offset } })
      alleSchichtenNeuZeichnen()
      forceRender((n) => n + 1)
    }
    const zoomAlles = () => aufZoomAlles()
    const zoom100 = () => aufZoom100()
    const zoomIn = () => aufZoomFaktor(1.25)
    const zoomOut = () => aufZoomFaktor(1 / 1.25)
    window.addEventListener('eleasycad:zoom-alles', zoomAlles)
    window.addEventListener('eleasycad:zoom-100', zoom100)
    window.addEventListener('eleasycad:zoom-in', zoomIn)
    window.addEventListener('eleasycad:zoom-out', zoomOut)
    window.addEventListener('eleasycad:einpassen', aufEinpassen)
    return () => {
      window.removeEventListener('eleasycad:einpassen', aufEinpassen)
      window.removeEventListener('eleasycad:zoom-alles', zoomAlles)
      window.removeEventListener('eleasycad:zoom-100', zoom100)
      window.removeEventListener('eleasycad:zoom-in', zoomIn)
      window.removeEventListener('eleasycad:zoom-out', zoomOut)
    }
  }, [blatt.id])

  useEffect(() => {
    function aufSprungZuBlatt(e: Event) {
      const detail = (
        e as CustomEvent<{
          blattId: string
          trunkId?: string
          endeIndex?: 0 | 1
          objektId?: string
          bereich?: BoundingBox
          objektIds?: string[]
        }>
      ).detail
      if (!detail) return
      if (detail.bereich) {
        doc.setAktivesBlatt(detail.blattId)
        const rand = 2
        view.fitBoundingBox(
          {
            min: { x: detail.bereich.min.x - rand, y: detail.bereich.min.y - rand },
            max: { x: detail.bereich.max.x + rand, y: detail.bereich.max.y + rand },
          },
          groesseRef,
        )
        kameraProBlatt.set(detail.blattId, { scale: view.scale, offset: { ...view.offset } })
        useUiStore.getState().setAuswahlIds(detail.objektIds ?? [])
        alleSchichtenNeuZeichnen()
        forceRender((n) => n + 1)
        return
      }
      const zielBlatt = doc.getBlatt(detail.blattId)
      const zielTrunk = zielBlatt?.objekte.find(
        (o): o is TrunkObjekt => o.type === 'trunk' && o.id === detail.trunkId,
      )
      doc.setAktivesBlatt(detail.blattId)
      const zielObjekt = detail.objektId
        ? zielBlatt?.objekte.find((o) => o.id === detail.objektId)
        : undefined
      if (zielObjekt) {
        const bb = getBoundingBox(zielObjekt)
        view.centerOn(boundingBoxCenter(bb), groesseRef)
        kameraProBlatt.set(detail.blattId, { scale: view.scale, offset: { ...view.offset } })
        useUiStore.getState().setAuswahlIds([zielObjekt.id])
      } else if (zielTrunk) {
        const punkt =
          detail.endeIndex === 0
            ? zielTrunk.wegpunkte[0]
            : zielTrunk.wegpunkte[zielTrunk.wegpunkte.length - 1]
        view.centerOn(punkt, groesseRef)
        kameraProBlatt.set(detail.blattId, {
          scale: view.scale,
          offset: { ...view.offset },
        })
        useUiStore.getState().setAuswahlIds([zielTrunk.id])
      }
      alleSchichtenNeuZeichnen()
      forceRender((n) => n + 1)
    }
    window.addEventListener('eleasycad:sprung-zu-blatt', aufSprungZuBlatt)
    return () => window.removeEventListener('eleasycad:sprung-zu-blatt', aufSprungZuBlatt)
  }, [])

  function objektUndSpurfangAnwenden(raw: Point, altKey: boolean): Point {
    letzterFangTrefferRef.current = null
    letzterSpurTrefferRef.current = null
    if (altKey) return raw
    const { objektfangAktiv, spurfangAktiv, hintergrundfangAktiv } = useUiStore.getState()
    if (!objektfangAktiv) return raw
    const toleranz = view.laengeToWorld(OBJEKTFANG_TOLERANZ_PX)
    const arten = kombiniereFangarten(
      useSettingsStore.getState().objektfangArten,
      toolManager.getAktivesTool()?.zusaetzlicheFangarten ?? [],
    )
    const raster =
      hintergrundfangAktiv && !nurAnsichtGrund(blatt, freigeschaltet)
        ? hintergrundFangRaster(blatt, () => overlayScheduler.request())
        : null
    const fangObjekte = raster
      ? [...blatt.objekte, ...hintergrundFangObjekte(raster, raw, toleranz)]
      : blatt.objekte
    const treffer = findeFangpunkt(fangObjekte, raw, toleranz, arten, {
      zeichnung: doc.getZeichnung(),
      blattId: blatt.id,
      katalog: useKatalogStore.getState().komponenten,
    })
    if (treffer) {
      letzterFangTrefferRef.current = treffer
      return treffer.punkt
    }
    if (spurfangAktiv) {
      const spurTreffer = findeSpurTreffer(gemerktePunkteRef.current, raw, toleranz)
      if (spurTreffer) {
        letzterSpurTrefferRef.current = spurTreffer
        return spurTreffer.punkt
      }
    }
    return raw
  }

  function verweilAktualisieren(treffer: FangTreffer | null, keineMaustasteGedrueckt: boolean) {
    const kandidat = keineMaustasteGedrueckt && useUiStore.getState().spurfangAktiv ? treffer : null
    const bisherigerPunkt = verweilPunktRef.current
    if (kandidat && bisherigerPunkt && distance(kandidat.punkt, bisherigerPunkt) < 1e-9) return
    if (verweilTimerRef.current !== null) {
      window.clearTimeout(verweilTimerRef.current)
      verweilTimerRef.current = null
    }
    verweilPunktRef.current = kandidat?.punkt ?? null
    if (!kandidat) return
    verweilTimerRef.current = window.setTimeout(() => {
      gemerktePunkteRef.current = merkeOderVergissPunkt(
        gemerktePunkteRef.current,
        { punkt: kandidat.punkt, richtung: kandidat.richtung },
        Date.now(),
      )
      overlayScheduler.request()
    }, SPURFANG_VERWEILDAUER_MS)
  }

  function pointerInfoAus(
    clientX: number,
    clientY: number,
    button: number,
    mods: Modifikatoren,
  ): PointerInfo | null {
    const container = containerRef.current
    if (!container) return null
    const rect = container.getBoundingClientRect()
    return pointerInfoAusScreen({ x: clientX - rect.left, y: clientY - rect.top }, button, mods)
  }

  function pointerInfoAusScreen(screen: Point, button: number, mods: Modifikatoren): PointerInfo {
    const raw = view.screenToWorld(screen)
    const gefangen = objektUndSpurfangAnwenden(raw, mods.altKey)
    const { snapAktiv } = useUiStore.getState()
    const world =
      gefangen === raw
        ? wendeSnapAn(
            raw,
            snapAktiv,
            toolContext.gridSchritt(),
            nullpunktVon(doc.getAktivesBlatt()),
          )
        : gefangen
    return { screen, world, raw, button, ...mods }
  }

  function offeneKonstruktionsStrecke() {
    if (istSchaltplan(doc.getZeichnung())) return null
    return toolManager.getAktivesTool()?.konstruktionsStrecke?.() ?? null
  }

  function mitMassEingabe(world: Point): Point {
    const eingabe = massEingabeRef.current
    if (!eingabe || istMassEingabeLeer(eingabe)) return world
    const strecke = offeneKonstruktionsStrecke()
    if (!strecke?.eingebbar) return world
    return punktAusEingabe({ ...strecke, bis: world }, eingabe)
  }

  function pointerInfoFuerPunkt(world: Point): PointerInfo {
    return {
      screen: view.worldToScreen(world),
      world,
      raw: world,
      button: 0,
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
    }
  }

  const letzteFingerEingabeRef = useRef(0)
  const keineModifikatoren: Modifikatoren = { shiftKey: false, ctrlKey: false, altKey: false }

  function kameraMerken() {
    kameraProBlatt.set(blatt.id, { scale: view.scale, offset: { ...view.offset } })
  }

  const gestenZielRef = useRef<TouchGestenZiel | null>(null)
  gestenZielRef.current = {
    links(phase, p) {
      letzteFingerEingabeRef.current = Date.now()
      if (phase === 'runter') zeigerRunter(p.x, p.y, 0, keineModifikatoren)
      else if (phase === 'bewegt') zeigerBewegt(p.x, p.y, 0, true, keineModifikatoren)
      else zeigerHoch(p.x, p.y, 0, keineModifikatoren)
    },
    rechts(phase, p) {
      letzteFingerEingabeRef.current = Date.now()
      if (phase === 'runter') zeigerRunter(p.x, p.y, 2, keineModifikatoren)
      else if (phase === 'bewegt') zeigerBewegt(p.x, p.y, 2, true, keineModifikatoren)
      else zeigerHoch(p.x, p.y, 2, keineModifikatoren)
    },
    rechtsAbbrechen() {
      if (!panRef.current) return
      panRef.current = null
      kameraMerken()
    },
    doppelklick(p) {
      letzteFingerEingabeRef.current = Date.now()
      const info = pointerInfoAus(p.x, p.y, 0, keineModifikatoren)
      if (info) toolManager.handleDoubleClick(info)
    },
    zweiFinger(mitte, faktor, verschiebung) {
      letzteFingerEingabeRef.current = Date.now()
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      view.offset = { x: view.offset.x + verschiebung.x, y: view.offset.y + verschiebung.y }
      view.zoomAt({ x: mitte.x - rect.left, y: mitte.y - rect.top }, faktor)
      alleSchichtenNeuZeichnen()
    },
    zweiFingerEnde() {
      kameraMerken()
      forceRender((n) => n + 1)
    },
    langDruckErkannt() {
      navigator.vibrate?.(30)
    },
  }
  const gestenRef = useRef<TouchGesten | null>(null)
  gestenRef.current ??= new TouchGesten({
    links: (phase, p) => gestenZielRef.current?.links(phase, p),
    rechts: (phase, p) => gestenZielRef.current?.rechts(phase, p),
    rechtsAbbrechen: () => gestenZielRef.current?.rechtsAbbrechen(),
    doppelklick: (p) => gestenZielRef.current?.doppelklick(p),
    zweiFinger: (mitte, faktor, v) => gestenZielRef.current?.zweiFinger(mitte, faktor, v),
    zweiFingerEnde: () => gestenZielRef.current?.zweiFingerEnde(),
    langDruckErkannt: () => gestenZielRef.current?.langDruckErkannt(),
  })
  const gesten = gestenRef.current

  function zeigerRunter(clientX: number, clientY: number, button: number, mods: Modifikatoren) {
    if (button === 2) {
      panRef.current = {
        startScreen: { x: clientX, y: clientY },
        startOffset: { ...view.offset },
        bewegt: false,
      }
      return
    }
    if (button === 0 && slotGrafikKlick(clientX, clientY)) {
      slotKlickLaeuftRef.current = true
      return
    }
    const info = pointerInfoAus(clientX, clientY, button, mods)
    if (info) toolManager.handlePointerDown(info)
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!(e.target instanceof HTMLCanvasElement)) return
    if (istFingerOderStift(e)) {
      e.preventDefault()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      if (!useUiStore.getState().touchBedienung) useUiStore.getState().setTouchBedienung(true)
      gesten.runter(e.pointerId, { x: e.clientX, y: e.clientY })
      return
    }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    zeigerRunter(e.clientX, e.clientY, e.button, modifikatorenVon(e))
  }

  function zeigerBewegt(
    clientX: number,
    clientY: number,
    button: number,
    tasteGedrueckt: boolean,
    mods: Modifikatoren,
  ) {
    const container = containerRef.current
    if (container) {
      const rect = container.getBoundingClientRect()
      mausScreenRef.current = { x: clientX - rect.left, y: clientY - rect.top }
    }
    if (panRef.current) {
      const dx = clientX - panRef.current.startScreen.x
      const dy = clientY - panRef.current.startScreen.y
      if (Math.hypot(dx, dy) > RECHTSKLICK_ZUG_SCHWELLE_PX) panRef.current.bewegt = true
      view.offset = { x: panRef.current.startOffset.x + dx, y: panRef.current.startOffset.y + dy }
      alleSchichtenNeuZeichnen()
      return
    }
    const info = pointerInfoAus(clientX, clientY, button, mods)
    if (info) toolManager.handlePointerMove({ ...info, world: mitMassEingabe(info.world) })
    let hoverKomponenteId: string | null = null
    if (info) {
      const toleranz = view.laengeToWorld(4)
      for (let i = blatt.objekte.length - 1; i >= 0; i--) {
        const objekt = blatt.objekte[i]
        if (objekt.type === 'komponente' && hitTestObjekt(objekt, info.raw, toleranz)) {
          hoverKomponenteId = objekt.id
          break
        }
      }
    }
    hoverKomponenteIdRef.current = hoverKomponenteId
    const zeigerScreen = mausScreenRef.current
    if (zeigerScreen && !tasteGedrueckt) {
      const lupe = findeSlotGrafikUnterZeiger(
        view,
        slotGrafikenRef.current,
        zeigerScreen,
        slotLupeObjektIdRef.current,
      )
      slotLupeObjektIdRef.current = lupe
      slotZeigerSlotIdRef.current = lupe
        ? findeSlotGrafikZelle(view, slotGrafikenRef.current, zeigerScreen, lupe)
        : null
      if (container) container.style.cursor = lupe ? 'pointer' : ''
    }
    verweilAktualisieren(letzterFangTrefferRef.current, !tasteGedrueckt)
    overlayScheduler.request()
    meldeStatus()
  }

  function slotGrafikKlick(clientX: number, clientY: number): boolean {
    const container = containerRef.current
    const lupe = slotLupeObjektIdRef.current
    if (!container || !lupe) return false
    const rect = container.getBoundingClientRect()
    const punkt = { x: clientX - rect.left, y: clientY - rect.top }
    const slotId = findeSlotGrafikZelle(view, slotGrafikenRef.current, punkt, lupe)
    if (!slotId) {
      return findeSlotGrafikUnterZeiger(view, slotGrafikenRef.current, punkt, lupe) !== null
    }
    const vorher = slotAuswahlRef.current
    slotAuswahlRef.current =
      vorher && vorher.objektId === lupe && vorher.slotId === slotId
        ? null
        : { objektId: lupe, slotId }
    overlayScheduler.request()
    return true
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (istFingerOderStift(e)) {
      if (e.buttons !== 0 || e.pointerType === 'touch') {
        gesten.bewegt(e.pointerId, { x: e.clientX, y: e.clientY })
        return
      }
    }
    zeigerBewegt(e.clientX, e.clientY, e.button, e.buttons !== 0, modifikatorenVon(e))
  }

  function zeigerHoch(clientX: number, clientY: number, button: number, mods: Modifikatoren) {
    if (panRef.current) {
      const warBewegt = panRef.current.bewegt
      if (!warBewegt) {
        const info = pointerInfoAus(clientX, clientY, button, mods)
        if (info && toolManager.handleRightClick(info)) {
          panRef.current = null
          return
        }
        if (toolManager.getAktivesToolId() === 'teilstueck-zone') {
          if (useUiStore.getState().teilstueckAuswahl.length > 0)
            useUiStore.getState().oeffneKontextMenu({ x: clientX, y: clientY, art: 'teilstuecke' })
          panRef.current = null
          return
        }
        const toleranz = view.laengeToWorld(KONTEXTMENU_TOLERANZ_PX)
        const trunkEndeToleranz = view.laengeToWorld(TRUNK_ENDE_TOLERANZ_PX)
        const trunks = blatt.objekte.filter((o): o is TrunkObjekt => o.type === 'trunk')
        const trunkEndeTreffer = info
          ? findeTrunkEndeTreffer(trunks, info.raw, trunkEndeToleranz)
          : null
        const treffer = info
          ? hitTestObjekte(blatt.objekte, info.raw, toleranz, {
              zeichnung: doc.getZeichnung(),
              blattId: blatt.id,
              katalog: useKatalogStore.getState().komponenten,
            })
          : null
        const aktuelleAuswahl = useUiStore.getState().auswahlIds
        if (trunkEndeTreffer) {
          useUiStore.getState().setAuswahlIds([trunkEndeTreffer.trunkId])
          useUiStore.getState().oeffneKontextMenu({
            x: clientX,
            y: clientY,
            art: 'trunk-ende',
            objektId: trunkEndeTreffer.trunkId,
            endeIndex: trunkEndeTreffer.endeIndex,
          })
        } else if (treffer && aktuelleAuswahl.includes(treffer.id) && aktuelleAuswahl.length > 1) {
          useUiStore.getState().oeffneKontextMenu({
            x: clientX,
            y: clientY,
            art: 'mehrfachauswahl',
          })
        } else if (info && treffer && treffer.type === 'leitung') {
          useUiStore.getState().setAuswahlIds([treffer.id])
          useUiStore.getState().oeffneKontextMenu({
            x: clientX,
            y: clientY,
            art: 'leitung',
            objektId: treffer.id,
            weltPunkt: info.raw,
          })
        } else if (info && treffer && treffer.type === 'trunk') {
          useUiStore.getState().setAuswahlIds([treffer.id])
          useUiStore.getState().oeffneKontextMenu({
            x: clientX,
            y: clientY,
            art: 'trunk',
            objektId: treffer.id,
            weltPunkt: info.raw,
          })
        } else if (treffer && treffer.type === 'schaltverbindung') {
          useUiStore.getState().setAuswahlIds([treffer.id])
          useUiStore.getState().oeffneKontextMenu({
            x: clientX,
            y: clientY,
            art: 'schaltverbindung',
            objektId: treffer.id,
          })
        } else if (treffer && treffer.ausBauteil) {
          useUiStore.getState().setAuswahlIds([treffer.id])
          useUiStore.getState().oeffneKontextMenu({
            x: clientX,
            y: clientY,
            art: 'bauteil',
            objektId: treffer.id,
          })
        } else if (treffer && treffer.type === 'kabelschacht') {
          useUiStore.getState().setAuswahlIds([treffer.id])
          useUiStore.getState().oeffneKontextMenu({
            x: clientX,
            y: clientY,
            art: 'kabelschacht',
            objektId: treffer.id,
          })
        } else if (treffer && treffer.type === 'komponente' && istKlemme(treffer)) {
          useUiStore.getState().setAuswahlIds([treffer.id])
          useUiStore.getState().oeffneKontextMenu({
            x: clientX,
            y: clientY,
            art: 'klemme',
            objektId: treffer.id,
          })
        } else if (treffer && treffer.type === 'leitungsbaum') {
          useUiStore.getState().setAuswahlIds([treffer.id])
          useUiStore.getState().oeffneKontextMenu({
            x: clientX,
            y: clientY,
            art: 'leitungsbaum',
            objektId: treffer.id,
          })
        } else {
          useUiStore.getState().oeffneKontextMenu({ x: clientX, y: clientY, art: 'leer' })
        }
      } else {
        kameraProBlatt.set(blatt.id, { scale: view.scale, offset: { ...view.offset } })
      }
      panRef.current = null
      return
    }
    if (slotKlickLaeuftRef.current) {
      slotKlickLaeuftRef.current = false
      return
    }
    const info = pointerInfoAus(clientX, clientY, button, mods)
    if (info) toolManager.handlePointerUp(info)
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (istFingerOderStift(e)) {
      gesten.hoch(e.pointerId, { x: e.clientX, y: e.clientY }, e.timeStamp)
      return
    }
    if (!(e.target instanceof HTMLCanvasElement)) return
    zeigerHoch(e.clientX, e.clientY, e.button, modifikatorenVon(e))
  }

  function handleDoubleClick(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    if (!(e.target instanceof HTMLCanvasElement)) return
    if (slotLupeObjektIdRef.current !== null) return
    if (Date.now() - letzteFingerEingabeRef.current < 1000) return
    const info = pointerInfoAus(e.clientX, e.clientY, e.button, modifikatorenVon(e))
    if (info) toolManager.handleDoubleClick(info)
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    const faktor = Math.exp(-e.deltaY * 0.0015)
    view.zoomAt(cursor, faktor)
    kameraProBlatt.set(blatt.id, { scale: view.scale, offset: { ...view.offset } })
    alleSchichtenNeuZeichnen()
    forceRender((n) => n + 1)
  }
  const handleWheelRef = useRef(handleWheel)
  handleWheelRef.current = handleWheel

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    function onWheel(e: WheelEvent) {
      handleWheelRef.current(e)
    }
    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [])

  const nichtKalibriert = blatt.hintergrund !== null && !istKalibriert(blatt.hintergrund)
  const nurAnsicht = nurAnsichtGrund(blatt, freigeschaltet)

  return (
    <main
      className="canvas-area"
      aria-label={t('aktionen.canvas.zeichenflaeche')}
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={(e) => {
        if (istFingerOderStift(e)) gesten.abbrechen(e.pointerId)
      }}
      onPointerLeave={() => {
        mausScreenRef.current = null
        toolManager.handlePointerLeave()
        verweilAktualisieren(null, true)
        letzterFangTrefferRef.current = null
        letzterSpurTrefferRef.current = null
        hoverKomponenteIdRef.current = null
        overlayScheduler.request()
        meldeStatus()
      }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas className="canvas-layer" ref={hintergrundCanvasRef} />
      <canvas className="canvas-layer" ref={inhaltCanvasRef} />
      <canvas className="canvas-layer" ref={overlayCanvasRef} />
      {nurAnsicht && <div className="nicht-kalibriert-banner nur-ansicht-banner">{nurAnsicht}</div>}
      {nichtKalibriert && (
        <div className="nicht-kalibriert-banner">{t('aktionen.canvas.nichtKalibriert')}</div>
      )}
      {(aktivesToolId === 'leitung' || aktivesToolId === 'trunk') && (
        <VerlegeVorgabenLeiste werkzeug={aktivesToolId} blatt={blatt} />
      )}
      {(aktivesToolId === 'wand' || aktivesToolId === 'wandrechteck') && (
        <div className="canvas-wandstaerke-leiste">
          <label className="feld">
            {t('aktionen.canvas.wandstaerke')}
            <ZahlenFeld
              min={WAND_STAERKE_MIN}
              step={0.01}
              value={wandStaerke}
              onCommit={setWandStaerke}
            />
          </label>
        </div>
      )}
      {(aktivesToolId === 'tuer' || aktivesToolId === 'fenster' || aktivesToolId === 'treppe') && (
        <BauteilVorgabenLeiste werkzeug={aktivesToolId} />
      )}
      <Kontextleiste />
      <div className="canvas-statusleiste">
        <button
          type="button"
          className="canvas-statusleiste-einklapp-button"
          aria-expanded={!hinweisEingeklappt}
          aria-label={
            hinweisEingeklappt
              ? t('aktionen.canvas.hinweisEinblenden')
              : t('aktionen.canvas.hinweisAusblenden')
          }
          onClick={() => setHinweisEingeklappt((v) => !v)}
        >
          <IconMehr offen={hinweisEingeklappt} />
        </button>
        <span className="canvas-statusleiste-text" hidden={hinweisEingeklappt}>
          {hinweisFuerAnzeige(statusText ?? '', !(kontextleisteSichtbar || touchBedienung))}
        </span>
      </div>
    </main>
  )
}
