import { erweitertAuswahl, type PointerInfo, type Tool, type ToolContext } from '../tool'
import { entf, leertaste, wirksam } from '../kontext-aktionen'
import { hitTestObjekte } from '../hit-test'
import { ermittleAbstaende } from '../abstandsanzeige'
import { auswahlHinweisArt, auswahlHinweisText, type AuswahlHinweisArt } from './auswahl-hinweis'
import type {
  Blatt,
  BoundingBox,
  CatalogComponent,
  Ebene,
  Kabeltyp,
  KnotenpunktObjekt,
  KomponentenObjekt,
  SchaltverbindungAnschluss,
  SchaltverbindungObjekt,
  LeitungsObjekt,
  Objekt,
  PolylinienObjekt,
  BodenplattenObjekt,
  PortSchild,
  Point,
  SlotTreffer,
  TabellenKontext,
  TransformRahmen,
  TrunkObjekt,
  WandObjekt,
  Zeichnung,
} from '../../document-model'
import {
  abgeleitetePfadSegmente,
  add,
  angleBetween,
  baueTabellenModell,
  mitAbgangstext,
  distance,
  effektiveSichtbarkeit,
  ermittleBenachbarteEckpunkte,
  ermittleNummernschilder,
  ermittleOeffnungsGeometrie,
  ermittlePortSchilder,
  ermittleTransformRahmen,
  expandiereTraegerMitModulen,
  findeNaechstenFreienSlot,
  getBoundingBox,
  getDockpoints,
  getFangpunkt,
  hatVerbundeneLeitungenOderTrunks,
  istAufgesetztesModul,
  istBearbeitbar,
  istModul,
  dreheKombinationen,
  istPortKomponente,
  istVerteiler,
  istTransformierbar,
  LEITUNGSLISTE_TYP_SPALTENINDEX,
  leitungslistenKabel,
  naechsterPunktAufPfad,
  nachgefuehrteOeffnungen,
  nachgefuehrteWandAnschluesse,
  teileWandSegment,
  vereinigeWandSegmente,
  verschiebeWandKnoten,
  wandEndenAm,
  nurProportionalSkalierbar,
  nullpunktVon,
  objektRahmen,
  punktAufPfad,
  rahmenDrehgriffPunkt,
  rahmenEcken,
  raumBeschriftungsRahmen,
  rotatePoint,
  sichtbareObjekteAufBlatt,
  sub,
  verschiebeObjekt,
  zelleAmPunkt,
  ermittleEtagenWirkverbindungen,
  zonenNachSegmentZug,
  raeumeKnotenAuf,
  planUebersetzer,
  fremdeLinien,
  istSchaltplan,
  rasteAufLinieEin,
  schleifeEin,
} from '../../document-model'
import type { Command } from '../command'
import {
  erzeugeBlattAendernCommand,
  erzeugeObjektAendernCommand,
  erzeugeObjektAktualisierenCommand,
  erzeugeObjekteEntfernenCommand,
  erzeugeSchachtTrunkAnschlussCommand,
  trunkAmStrang,
  erzeugeTrunkAndockenCommand,
  erzeugeTrunkMergeCommand,
  mitStrangBenennung,
  strangTitelAmSchacht,
} from '../commands'
import {
  berechneGruppenRerouteMitZustand,
  betroffeneLeitungen,
  erzeugeVerschiebungMitRerouteCommand,
  wandIdsAus,
} from '../gruppenverschiebung'
import type { WandVerschiebung } from '../wandfang-verschiebung'
import { berechneWandVerschiebung, wendeNachbarnAn } from '../wandfang-verschiebung'
import { erzeugeWandAenderungCommand } from '../wandseite-umhaengen'
import { frageLoeschung } from '../trunk-loeschen'
import {
  type AusfuehrungsWahl,
  ausfuehrungVon,
  gleicheKetteAn,
  klaereAusfuehrung,
} from '../trunk-ausfuehrung'
import { berechneSchaltverbindungReroute } from '../schaltverbindung-routing'
import type { Transformation } from '../transformieren'
import {
  berechneTransformationLeitungenVorschau,
  berechneTransformationSchaltverbindungenVorschau,
  erzeugeKomponentenDrehenCommand,
  erzeugeTransformationMitRerouteCommand,
  wendeTransformationAn,
} from '../transformieren'
import { ermittleObjekteImAuswahlRechteck } from '../auswahl-rechteck'
import {
  TRANSFORM_DREHGRIFF_ABSTAND_PX,
  TRUNK_ENDE_TOLERANZ_PX,
  ermittleAbgangsBlock,
  abgangsLinksAnker,
  ermittleKomponentenBeschriftungsRechteck,
  ermittleKomponentenFlaechen,
  ermittleLeitungsStueckAutoPosition,
  ermittleLeitungsStueckSchildMasse,
  ermittleLeitungsZusatzzeilen,
  ermittleLinienHindernisse,
  ermittleSchachtAnzeige,
  etagenVerweisRechtecke,
  trefferWirkverbindungsVerweis,
  wirkverbindungsVerweisRechtecke,
  zeichneAbstandslinie,
  zeichneAuswahlHighlight,
  zeichneAuswahlrechteck,
  zeichneBezeichnerLeitlinie,
  zeichneHoverHighlight,
  zeichneBemassungsreiheGriffe,
  zeichneLeitungsGriffe,
  zeichneObjekt,
  zeichneSlotHighlight,
  zeichneTransformGriffe,
  trunkDurchgangStandardVersatzWelt,
  trunkEndeStandardVersatzWelt,
} from '../../rendering'
import type {
  BezeichnerHindernisse,
  KomponentenRenderKontext,
  LeitungsGriffAuswahl,
  ViewTransform,
} from '../../rendering'
import { fuerLeitung, routingHindernisse } from '../../routing'
import type { RoutingHindernisseEingabe } from '../../routing'
import type { LeitungsGriffTreffer } from '../leitung-editing'
import {
  findeSchaltGriff,
  knickEinfuegen,
  knickEntfernen,
  sucheEndeZiel,
  zieheSchaltGriff,
  type SchaltGriff,
} from '../schaltverbindung-editing'
import {
  FORM_GRIFF_TOLERANZ_PX,
  entferneFormPunkt,
  findeFormPunktIndex,
  findeFormSegmentIndex,
  fuegeFormPunktEin,
  verschiebeFormPunkt,
} from '../form-editing'
import { MAGNET_TOLERANZ_PX, wandflaecheUnterZeiger } from './component-tool'
import { fangpunktVerschiebung, wendeSnapAn } from '../snapping'
import type { BemassungsreiheGriff } from '../bemassungsreihe-editing'
import { findeBemassungsreiheGriff, wendeBemassungsreiheGriffAn } from '../bemassungsreihe-editing'
import type { TrunkAblageZiel } from '../trunk-ablage'
import { abzweigeNachfuehren, findeTrunkAblageZiel, frageTrunkVerbindung } from '../trunk-ablage'
import type { SchachtAblageZiel } from '../schacht-ablage'
import { findeSchachtAblageZiel } from '../schacht-ablage'
import {
  LEITUNG_GRIFF_TOLERANZ_PX,
  berechneLeitungenReroutingBeiTrunkAenderung,
  findeEndeIndex,
  findeLeitungsGriff,
  findeSegmentIndex,
  vorschauEndeVerschieben,
  vorschauSegmentVerschieben,
  vorschauSegmentVerschiebenFrei,
  vorschauTrunkDurchgangVerschieben,
  vorschauWegpunktEntfernen,
  vorschauWegpunktEntfernenFrei,
} from '../leitung-editing'
import { t } from '../../sprache'

const TOLERANZ_PX = 6
const MINDEST_ZUG_PX = 3
const TRUNK_DURCHGANG_GRIFF_TOLERANZ_PX = 10
const KOMPONENTEN_BESCHRIFTUNG_GRIFF_RAND_PX = 3
const GRUPPENDRAG_REROUTE_SCHWELLE_PX = 2

const TRUNK_ABLAGE_MARKER_RADIUS_PX = 7

const TRANSFORM_GRIFF_TOLERANZ_PX = 8
const DREH_RASTWINKEL = Math.PI / 12

const PFEILTASTEN_DELTA: Record<string, Point> = {
  ArrowUp: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: -1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
}

const NULLPUNKT_GRIFF_TOLERANZ_PX = 12
const SKALIER_MIN_FAKTOR = 0.05

const LEITUNG_VORSCHAU_FARBE_GUELTIG = '#2f7dd1'
const LEITUNG_VORSCHAU_FARBE_KEIN_PFAD = '#d1382f'

type PfadObjekt = LeitungsObjekt | TrunkObjekt

function pfadSegmenteVon(objekt: PfadObjekt): Point[][] {
  return objekt.type === 'leitung' ? objekt.pfadSegmente : [objekt.wegpunkte]
}

type FormObjekt = WandObjekt | PolylinienObjekt | BodenplattenObjekt

function schaltGriffErgebnis(
  ctx: ToolContext,
  objekte: readonly Objekt[],
  objekt: SchaltverbindungObjekt,
  zug: { griff: SchaltGriff; ziel: Point; raw: Point; frei: boolean },
): { objekt: SchaltverbindungObjekt; ziel: Point | null; alterKnoten: string | null } {
  let ziel = zug.ziel
  let anschluss: SchaltverbindungAnschluss | null = null
  let zielPunkt: Point | null = null
  if (zug.griff.art === 'ende') {
    const treffer = sucheEndeZiel(
      objekte,
      zug.raw,
      ctx.view.laengeToWorld(LEITUNG_GRIFF_TOLERANZ_PX),
      objekt.id,
    )
    anschluss = treffer?.anschluss ?? { art: 'frei' }
    if (treffer) {
      ziel = treffer.punkt
      zielPunkt = treffer.punkt
    }
  }
  const wegpunkte = zieheSchaltGriff(objekt.wegpunkte, zug.griff, ziel, zug.frei)
  const { autoRouting: _automatik, anordnung: _anordnung, ...ohne } = objekt
  void _automatik
  void _anordnung
  let neu: SchaltverbindungObjekt = { ...ohne, wegpunkte }
  let alterKnoten: string | null = null
  if (zug.griff.art === 'ende' && anschluss) {
    const alt = zug.griff.ende === 'start' ? objekt.start : objekt.ziel
    if (
      alt.art === 'knoten' &&
      !(anschluss.art === 'knoten' && anschluss.objektId === alt.objektId)
    )
      alterKnoten = alt.objektId
    neu = zug.griff.ende === 'start' ? { ...neu, start: anschluss } : { ...neu, ziel: anschluss }
  }
  return { objekt: neu, ziel: zielPunkt, alterKnoten }
}

function istFormObjekt(objekt: Objekt): objekt is FormObjekt {
  return objekt.type === 'wand' || objekt.type === 'polylinie' || objekt.type === 'bodenplatte'
}

function istGeschlossenesFormObjekt(objekt: FormObjekt): boolean {
  return objekt.type === 'bodenplatte' || (objekt.type === 'polylinie' && objekt.geschlossen)
}

function mindestFormPunktAnzahl(objekt: FormObjekt): number {
  return istGeschlossenesFormObjekt(objekt) ? 3 : 2
}

function istWandEndpunkt(wand: WandObjekt, punktIndex: number): boolean {
  return punktIndex === 0 || punktIndex === wand.punkte.length - 1
}

function meldungFehlgeschlageneLeitungen(anzahl: number): string {
  return t('werkzeuge.auswahl.durchlaufendNichtGeroutet', { n: anzahl })
}

interface GriffUpdateErgebnis {
  command: Command
  fehlgeschlageneLeitungenAnzahl: number
}

function routingFuerPfad(ctx: ToolContext, objekt: PfadObjekt) {
  if (objekt.type !== 'leitung') return ctx.routingSettings()
  return fuerLeitung(
    ctx.routingSettings(),
    objekt,
    ctx.doc.getBlatt(ctx.aktivesBlattId())?.geschoss,
    ctx.doc.getZeichnung().installationszonen,
  )
}

function erzeugeGriffUpdateCommand(
  ctx: ToolContext,
  objekt: PfadObjekt,
  segmentArrIndex: number,
  neuerPfad: Point[],
  label: string,
  geloestesTrunkEnde?: 0 | 1,
  teilstueckZonen?: LeitungsObjekt['teilstueckZonen'],
): GriffUpdateErgebnis {
  const id = objekt.id

  if (objekt.type === 'trunk') {
    const blattVorher = ctx.doc.getBlatt(ctx.aktivesBlattId())
    const objekteVorher = blattVorher?.objekte ?? []
    const leitungenNeueSegmente = berechneLeitungenReroutingBeiTrunkAenderung(
      objekteVorher,
      id,
      neuerPfad,
      ctx.routingSettings(),
      blattVorher?.geschoss,
    )
    const betroffeneAnzahl = objekteVorher.filter(
      (o) => o.type === 'leitung' && o.trunkDurchgaenge.some((d) => d.trunkId === id),
    ).length
    const command = erzeugeObjektAendernCommand(ctx.doc, ctx.aktivesBlattId(), label, (objekte) =>
      abzweigeNachfuehren(
        objekte.map((o) => {
          if (o.id === id && o.type === 'trunk') {
            const enden = o.enden
            if (
              geloestesTrunkEnde !== undefined &&
              (enden[geloestesTrunkEnde].dockRef || enden[geloestesTrunkEnde].schachtRef)
            ) {
              const neueEnden: [(typeof enden)[0], (typeof enden)[1]] = [enden[0], enden[1]]
              neueEnden[geloestesTrunkEnde] = {
                ...enden[geloestesTrunkEnde],
                dockRef: undefined,
                schachtRef: undefined,
              }
              return { ...o, wegpunkte: neuerPfad, enden: neueEnden }
            }
            return { ...o, wegpunkte: neuerPfad }
          }
          if (o.type === 'leitung') {
            const pfadSegmente = leitungenNeueSegmente.get(o.id)
            if (pfadSegmente) return { ...o, pfadSegmente }
          }
          return o
        }),
        id,
        neuerPfad,
      ),
    )
    return {
      command,
      fehlgeschlageneLeitungenAnzahl: betroffeneAnzahl - leitungenNeueSegmente.size,
    }
  }

  const command = erzeugeObjektAendernCommand(ctx.doc, ctx.aktivesBlattId(), label, (objekte) =>
    objekte.map((o) => {
      if (o.id !== id || o.type !== 'leitung') return o
      const neuePfadSegmente = [...o.pfadSegmente]
      neuePfadSegmente[segmentArrIndex] = neuerPfad
      const { anordnung: _anordnung, ...ohneAnordnung } = o
      if (teilstueckZonen === undefined) return { ...ohneAnordnung, pfadSegmente: neuePfadSegmente }
      const { teilstueckZonen: _alt, ...rest } = ohneAnordnung
      return {
        ...rest,
        pfadSegmente: neuePfadSegmente,
        ...(teilstueckZonen.length > 0 ? { teilstueckZonen } : {}),
      }
    }),
  )
  return { command, fehlgeschlageneLeitungenAnzahl: 0 }
}

function frageAutoRoutingAusschalten(ctx: ToolContext, leitung: LeitungsObjekt): void {
  if (leitung.autoRoutingAus) return
  ctx.oeffneBestaetigung({
    titel: t('werkzeuge.auswahl.autoAusFrage'),
    nachricht: t('werkzeuge.auswahl.autoAusText', { nummer: String(leitung.nummer) }),
    bestaetigenText: t('werkzeuge.auswahl.ausschalten'),
    destruktiv: false,
    callback: (bestaetigt) => {
      if (!bestaetigt) return
      const id = leitung.id
      ctx.commands.execute(
        erzeugeObjektAendernCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          t('werkzeuge.auswahl.autoAus'),
          (objekte) =>
            objekte.map((o) =>
              o.id === id && o.type === 'leitung' ? { ...o, autoRoutingAus: true } : o,
            ),
        ),
      )
    },
  })
}

function erzeugeFormPunkteCommand(
  ctx: ToolContext,
  objekt: FormObjekt,
  neuePunkte: Point[],
  label: string,
): Command {
  const id = objekt.id
  return erzeugeObjektAendernCommand(ctx.doc, ctx.aktivesBlattId(), label, (objekte) => {
    const ergebnis = objekte.map((o) =>
      o.id === id && istFormObjekt(o) ? { ...o, punkte: neuePunkte } : o,
    )
    return objekt.type === 'wand' ? nachgefuehrteOeffnungen(ergebnis) : ergebnis
  })
}

function findeSegmentGriff(
  pfadSegmente: Point[][],
  punkt: Point,
  toleranz: number,
): { segmentArrIndex: number; lokalerIndex: number } | null {
  for (let s = 0; s < pfadSegmente.length; s++) {
    const idx = findeSegmentIndex(pfadSegmente[s], punkt, toleranz)
    if (idx !== null) return { segmentArrIndex: s, lokalerIndex: idx }
  }
  return null
}

function findeVerbundenesTrunkEnde(
  trunks: TrunkObjekt[],
  punkt: Point,
  toleranz: number,
): { blattId: string; trunkId: string; endeIndex: 0 | 1 } | null {
  for (const trunk of trunks) {
    for (const endeIndex of [0, 1] as const) {
      const verbindung = trunk.enden[endeIndex].verbundenesEnde
      if (!verbindung) continue
      const ort = endeIndex === 0 ? trunk.wegpunkte[0] : trunk.wegpunkte[trunk.wegpunkte.length - 1]
      if (distance(punkt, ort) <= toleranz) return verbindung
    }
  }
  return null
}

interface NummernschildTreffer {
  trunk: TrunkObjekt
  leitungId: string
  art: 'eintritt' | 'austritt'
}

function findeNummernschildTreffer(
  trunks: TrunkObjekt[],
  objekteAufBlatt: Objekt[],
  punkt: Point,
  toleranz: number,
): NummernschildTreffer | null {
  let bester: (NummernschildTreffer & { distanz: number }) | null = null
  for (const trunk of trunks) {
    for (const schild of ermittleNummernschilder(trunk, objekteAufBlatt)) {
      const d = distance(punkt, schild.punkt)
      if (d <= toleranz && (!bester || d < bester.distanz)) {
        bester = { trunk, leitungId: schild.leitungId, art: schild.art, distanz: d }
      }
    }
  }
  return bester
}

type BezeichnerZiel =
  | { art: 'leitung-nummer'; leitungId: string }
  | {
      art: 'trunk-durchgang'
      leitungId: string
      durchgangIndex: number
      richtung: 'eintritt' | 'austritt'
    }
  | { art: 'trunk-ende'; trunkId: string; endeIndex: 0 | 1 }
  | { art: 'raum'; raumId: string }
  | { art: 'komponente'; komponenteId: string }
  | { art: 'abgangstext'; komponenteId: string }

function bezeichnerZielObjektId(ziel: BezeichnerZiel): string {
  if (ziel.art === 'trunk-ende') return ziel.trunkId
  if (ziel.art === 'raum') return ziel.raumId
  if (ziel.art === 'komponente' || ziel.art === 'abgangstext') return ziel.komponenteId
  return ziel.leitungId
}

function bezeichnerZielBearbeitbar(blatt: Blatt, ziel: BezeichnerZiel): boolean {
  const objekt = blatt.objekte.find((o) => o.id === bezeichnerZielObjektId(ziel))
  return !objekt || istBearbeitbar(objekt, blatt.ebenen)
}

let bezeichnerMessKontext: CanvasRenderingContext2D | null = null
function holeBezeichnerMessKontext(): CanvasRenderingContext2D {
  if (!bezeichnerMessKontext) {
    const kontext = document.createElement('canvas').getContext('2d')
    if (!kontext)
      throw new Error('Canvas-2D-Kontext fuer Bezeichner-Trefferbereich nicht verfuegbar')
    bezeichnerMessKontext = kontext
  }
  return bezeichnerMessKontext
}

function leitungsNummerAutoVersatzWelt(
  view: ViewTransform,
  leitung: LeitungsObjekt,
  blatt: Blatt,
  kabeltypen: readonly Kabeltyp[],
  hindernisse: BezeichnerHindernisse,
  pfad: readonly Point[],
  ankerWelt: Point,
  katalog: readonly CatalogComponent[],
): Point {
  const messKontext = holeBezeichnerMessKontext()
  const zusatzzeilen = ermittleLeitungsZusatzzeilen(leitung, blatt, kabeltypen, katalog)
  const { breite, hoehe } = ermittleLeitungsStueckSchildMasse(
    messKontext,
    view.zoomFaktor(),
    zusatzzeilen,
  )
  const anker = view.worldToScreen(ankerWelt)
  const { mitte } = ermittleLeitungsStueckAutoPosition(
    view,
    leitung,
    anker,
    hindernisse,
    pfad,
    0.5,
    breite,
    hoehe,
  )
  return sub(view.screenToWorld(mitte), ankerWelt)
}

interface BezeichnerTreffer {
  ziel: BezeichnerZiel
  ankerWelt: Point
  versatz: Point
  versatzGespeichert: boolean
}

function findeBezeichnerTreffer(
  objekteAufBlatt: Objekt[],
  blatt: Blatt,
  view: ViewTransform,
  punkt: Point,
  toleranz: number,
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  hindernisse: BezeichnerHindernisse,
  komponentenKontext?: KomponentenRenderKontext,
): BezeichnerTreffer | null {
  let bester: (BezeichnerTreffer & { distanz: number }) | null = null
  const pruefe = (
    ziel: BezeichnerZiel,
    ankerWelt: Point,
    versatzRoh: Point | null | undefined,
    standardVersatz: Point = { x: 0, y: 0 },
    rahmen?: BoundingBox,
    maxDistanz: number = toleranz,
  ) => {
    const versatz = versatzRoh ?? standardVersatz
    const distanz = rahmen
      ? Math.hypot(
          Math.max(rahmen.min.x - punkt.x, 0, punkt.x - rahmen.max.x),
          Math.max(rahmen.min.y - punkt.y, 0, punkt.y - rahmen.max.y),
        )
      : distance(punkt, add(ankerWelt, versatz))
    if (distanz <= maxDistanz && (!bester || distanz < bester.distanz)) {
      bester = { ziel, ankerWelt, versatz, versatzGespeichert: versatzRoh != null, distanz }
    }
  }
  const portSchilderJeTrunk = new Map<string, Map<string, PortSchild>>()
  const portSchildFuer = (trunk: TrunkObjekt, leitungId: string): PortSchild | undefined => {
    let jeLeitung = portSchilderJeTrunk.get(trunk.id)
    if (!jeLeitung) {
      jeLeitung = new Map(
        ermittlePortSchilder(zeichnung, blatt.id, trunk, katalog).map((s) => [s.leitungId, s]),
      )
      portSchilderJeTrunk.set(trunk.id, jeLeitung)
    }
    return jeLeitung.get(leitungId)
  }
  const sichtbareIds = new Set(sichtbareObjekteAufBlatt(blatt, objekteAufBlatt).map((o) => o.id))
  for (const o of objekteAufBlatt) {
    if (o.type === 'leitung') {
      if (
        o.trunkDurchgaenge.length === 0 &&
        effektiveSichtbarkeit(o.bezeichnungSichtbar, blatt.leitungBezeichnungSichtbar)
      ) {
        const pfad = o.pfadSegmente[0]
        if (pfad && pfad.length >= 2) {
          const ankerWelt = punktAufPfad(pfad, 0.5)
          pruefe(
            { art: 'leitung-nummer', leitungId: o.id },
            ankerWelt,
            o.nummerVersatz,
            o.nummerVersatz
              ? undefined
              : leitungsNummerAutoVersatzWelt(
                  view,
                  o,
                  blatt,
                  zeichnung.kabeltypen,
                  hindernisse,
                  pfad,
                  ankerWelt,
                  katalog,
                ),
          )
        }
      }
      o.trunkDurchgaenge.forEach((durchgang, durchgangIndex) => {
        const trunk = objekteAufBlatt.find(
          (t): t is TrunkObjekt => t.type === 'trunk' && t.id === durchgang.trunkId,
        )
        if (!trunk) return
        const istLetzter = durchgangIndex === o.trunkDurchgaenge.length - 1
        pruefe(
          { art: 'trunk-durchgang', leitungId: o.id, durchgangIndex, richtung: 'eintritt' },
          punktAufPfad(trunk.wegpunkte, durchgang.eintrittT),
          durchgang.eintrittVersatz,
          trunkDurchgangStandardVersatzWelt(
            view,
            trunk,
            durchgang.eintrittT,
            istLetzter ? portSchildFuer(trunk, o.id) : undefined,
          ),
        )
        pruefe(
          { art: 'trunk-durchgang', leitungId: o.id, durchgangIndex, richtung: 'austritt' },
          punktAufPfad(trunk.wegpunkte, durchgang.austrittT),
          durchgang.austrittVersatz,
        )
      })
    }
    if (
      o.type === 'trunk' &&
      o.wegpunkte.length > 0 &&
      effektiveSichtbarkeit(o.bezeichnungSichtbar, blatt.trunkBezeichnungSichtbar)
    ) {
      const letzter = o.wegpunkte.length - 1
      pruefe(
        { art: 'trunk-ende', trunkId: o.id, endeIndex: 0 },
        o.wegpunkte[0],
        o.enden[0].beschriftungVersatz,
        trunkEndeStandardVersatzWelt(view, o, 0),
      )
      pruefe(
        { art: 'trunk-ende', trunkId: o.id, endeIndex: 1 },
        o.wegpunkte[letzter],
        o.enden[1].beschriftungVersatz,
        trunkEndeStandardVersatzWelt(view, o, 1),
      )
    }
    if (o.type === 'raum') {
      const name = effektiveSichtbarkeit(o.nameSichtbar, blatt.raumNameSichtbar)
      const flaeche = effektiveSichtbarkeit(o.flaecheSichtbar, blatt.raumFlaecheSichtbar)
      if (name || flaeche) {
        pruefe(
          { art: 'raum', raumId: o.id },
          o.mittelpunkt,
          o.beschriftungVersatz,
          undefined,
          raumBeschriftungsRahmen(o, { name, flaeche }),
        )
      }
    }
    if (o.type === 'komponente' && sichtbareIds.has(o.id)) {
      const rechteck = ermittleKomponentenBeschriftungsRechteck(
        holeBezeichnerMessKontext(),
        view,
        o,
        komponentenKontext,
      )
      if (rechteck) {
        const a = view.screenToWorld({ x: rechteck.x, y: rechteck.y })
        const b = view.screenToWorld({
          x: rechteck.x + rechteck.breite,
          y: rechteck.y + rechteck.hoehe,
        })
        const mitteWelt = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        pruefe(
          { art: 'komponente', komponenteId: o.id },
          o.position,
          o.beschriftungVersatz,
          sub(mitteWelt, o.position),
          {
            min: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) },
            max: { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y) },
          },
          view.laengeToWorld(KOMPONENTEN_BESCHRIFTUNG_GRIFF_RAND_PX),
        )
      }
      const abgaenge = komponentenKontext?.abgangsTexte
      if (abgaenge && blatt.abgaengeSichtbar) {
        const mess = holeBezeichnerMessKontext()
        const block = ermittleAbgangsBlock(
          mess,
          view,
          o,
          abgaenge.get(o.id) ?? [],
          komponentenKontext?.abgangsRaeume?.get(o.id),
          o.abgangstext?.ausrichtung === 'links'
            ? abgangsLinksAnker(mess, view, o, komponentenKontext)
            : undefined,
        )
        if (block) {
          const r = block.rechteck
          const a = view.screenToWorld({ x: r.x, y: r.y })
          const b = view.screenToWorld({ x: r.x + r.breite, y: r.y + r.hoehe })
          pruefe(
            { art: 'abgangstext', komponenteId: o.id },
            block.ankerWelt,
            o.abgangstext?.versatz,
            { x: 0, y: 0 },
            {
              min: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) },
              max: { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y) },
            },
            view.laengeToWorld(KOMPONENTEN_BESCHRIFTUNG_GRIFF_RAND_PX),
          )
        }
      }
    }
  }
  return bester
}

interface BezeichnerDragZustand {
  ziel: BezeichnerZiel
  ankerWelt: Point
  startScreen: Point
  startWorld: Point
  startVersatz: Point
  aktuellerVersatz: Point
}

function erzeugeBezeichnerVersatzCommand(
  ctx: ToolContext,
  ziel: BezeichnerZiel,
  versatz: Point | null,
): Command {
  const blattId = ctx.aktivesBlattId()
  switch (ziel.art) {
    case 'leitung-nummer':
      return erzeugeObjektAendernCommand(
        ctx.doc,
        blattId,
        t('werkzeuge.auswahl.nummerVerschieben'),
        (objekte) =>
          objekte.map((o) =>
            o.id === ziel.leitungId && o.type === 'leitung' ? { ...o, nummerVersatz: versatz } : o,
          ),
      )
    case 'trunk-durchgang':
      return erzeugeObjektAendernCommand(
        ctx.doc,
        blattId,
        ziel.richtung === 'eintritt'
          ? t('werkzeuge.auswahl.eintrittsschild')
          : t('werkzeuge.auswahl.austrittsschild'),
        (objekte) =>
          objekte.map((o) => {
            if (o.id !== ziel.leitungId || o.type !== 'leitung') return o
            const trunkDurchgaenge = o.trunkDurchgaenge.map((d, i) =>
              i === ziel.durchgangIndex
                ? {
                    ...d,
                    ...(ziel.richtung === 'eintritt'
                      ? { eintrittVersatz: versatz }
                      : { austrittVersatz: versatz }),
                  }
                : d,
            )
            return { ...o, trunkDurchgaenge }
          }),
      )
    case 'trunk-ende':
      return erzeugeObjektAendernCommand(
        ctx.doc,
        blattId,
        t('werkzeuge.auswahl.trunkBezeichnung'),
        (objekte) =>
          objekte.map((o) => {
            if (o.id !== ziel.trunkId || o.type !== 'trunk') return o
            const enden = o.enden.map((e, i) =>
              i === ziel.endeIndex ? { ...e, beschriftungVersatz: versatz } : e,
            ) as typeof o.enden
            return { ...o, enden }
          }),
      )
    case 'raum':
      return erzeugeObjektAendernCommand(
        ctx.doc,
        blattId,
        t('werkzeuge.auswahl.raumbeschriftung'),
        (objekte) =>
          objekte.map((o) =>
            o.id === ziel.raumId && o.type === 'raum' ? { ...o, beschriftungVersatz: versatz } : o,
          ),
      )
    case 'abgangstext':
      return erzeugeObjektAendernCommand(
        ctx.doc,
        blattId,
        t('werkzeuge.auswahl.zielbezeichnung'),
        (objekte) =>
          objekte.map((o) =>
            o.id === ziel.komponenteId && o.type === 'komponente'
              ? mitAbgangstext(o, { versatz: versatz ?? undefined })
              : o,
          ),
      )
    case 'komponente':
      return erzeugeObjektAendernCommand(
        ctx.doc,
        blattId,
        t('werkzeuge.auswahl.komponentenbeschriftung'),
        (objekte) =>
          objekte.map((o) =>
            o.id === ziel.komponenteId && o.type === 'komponente'
              ? { ...o, beschriftungVersatz: versatz }
              : o,
          ),
      )
  }
}

interface TrunkDurchgangDragZustand {
  trunkId: string
  leitungId: string
  art: 'eintritt' | 'austritt'
  startScreen: Point
  zielWorld: Point
}

interface PfadDragZustand {
  objektTyp: PfadObjekt['type']
  objektId: string
  segmentArrIndex: number
  lokalerSegmentIndex: number
  hindernisse: RoutingHindernisseEingabe
  startScreen: Point
  ziel: Point
  vorschau: Point[] | null
}

interface FormPunktDragZustand {
  objektId: string
  objektTyp: FormObjekt['type']
  punktIndex: number
  startScreen: Point
  ziel: Point
}

interface BemassungsreiheDragZustand {
  objektId: string
  griff: BemassungsreiheGriff
  startScreen: Point
  ziel: Point
}

interface OeffnungDragZustand {
  objektId: string
  wandId: string
  startScreen: Point
  ziel: Point
}

interface PfadEndeDragZustand {
  objektId: string
  endeIndex: 0 | 1
  hindernisse: RoutingHindernisseEingabe
  startScreen: Point
  ziel: Point
  vorschau: Point[] | null
  ablageZiel: TrunkAblageZiel | null
  schachtZiel: SchachtAblageZiel | null
}

interface RechteckAuswahlZustand {
  startScreen: Point
  startRaw: Point
  aktuellRaw: Point
  additiv: boolean
}

interface GruppenDragZustand {
  objektIds: Set<string>
  komponentenIds: Set<string>
  startWorld: Point
  aktuellesDelta: Point
  letzteRerouteDelta: Point | null
  letzteRerouteVorschau: Map<string, Point[][]>
  letzteSchaltRerouteVorschau: Map<string, Point[]>
  magnetModulId: string | null
  magnetZiel: SlotTreffer | null
  fangStart: Point | null
  startRaw: Point
  wand: WandVerschiebung | null
}

function verschiebungImDrag(drag: GruppenDragZustand, info: PointerInfo, ctx: ToolContext): Point {
  const zeigerDelta = { x: info.world.x - drag.startWorld.x, y: info.world.y - drag.startWorld.y }
  if (!drag.fangStart || !ctx.istSnapAktiv()) return zeigerDelta
  const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
  const bezug = blatt ? nullpunktVon(blatt) : undefined
  const schritt = ctx.gridSchritt()
  const zeigerGerastert = wendeSnapAn(info.raw, true, schritt, bezug)
  if (info.world.x !== zeigerGerastert.x || info.world.y !== zeigerGerastert.y) return zeigerDelta
  const rohDelta = sub(info.raw, drag.startRaw)
  if (ctx.view.laengeToScreen(Math.hypot(rohDelta.x, rohDelta.y)) < MINDEST_ZUG_PX) {
    return { x: 0, y: 0 }
  }
  return fangpunktVerschiebung(drag.fangStart, rohDelta, schritt, bezug)
}

interface NullpunktDragZustand {
  startScreen: Point
  ziel: Point
}

type TransformGriffTreffer = { art: 'drehen' } | { art: 'skalieren'; eckeIndex: 0 | 1 | 2 | 3 }

interface TransformDragZustand {
  objektIds: Set<string>
  komponentenIds: Set<string>
  zentrum: Point
  rahmenDrehung: number
  lokalMin: Point
  lokalMax: Point
  griff: TransformGriffTreffer
  nurProportional: boolean
  startScreen: Point
  startWinkel: number
  aktuelleTransformation: Transformation
}

function ermittleNurProportional(teilnehmer: Objekt[]): boolean {
  if (teilnehmer.some((o) => nurProportionalSkalierbar(o.type))) return true
  if (teilnehmer.some((o) => o.type === 'treppe' && o.form === 'l-kehre')) return true
  if (teilnehmer.length <= 1) return false
  return teilnehmer.some((o) => (objektRahmen(o)?.drehung ?? 0) !== 0)
}

function ermittleTransformGriffTreffer(
  rahmen: TransformRahmen,
  punktWelt: Point,
  view: ViewTransform,
): TransformGriffTreffer | null {
  const toleranz = view.laengeToWorld(TRANSFORM_GRIFF_TOLERANZ_PX)
  const versatzWelt = view.laengeToWorld(TRANSFORM_DREHGRIFF_ABSTAND_PX)
  const drehgriff = rahmenDrehgriffPunkt(rahmen, versatzWelt)
  if (distance(punktWelt, drehgriff) <= toleranz) return { art: 'drehen' }
  const ecken = rahmenEcken(rahmen)
  for (let i = 0; i < ecken.length; i++) {
    if (distance(punktWelt, ecken[i]) <= toleranz) {
      return { art: 'skalieren', eckeIndex: i as 0 | 1 | 2 | 3 }
    }
  }
  return null
}

function berechneTransformationAusGriff(
  drag: TransformDragZustand,
  mausWelt: Point,
  shiftGedrueckt: boolean,
): Transformation {
  if (drag.griff.art === 'drehen') {
    const aktuellerWinkel = angleBetween(drag.zentrum, mausWelt)
    let delta = aktuellerWinkel - drag.startWinkel
    if (shiftGedrueckt) delta = Math.round(delta / DREH_RASTWINKEL) * DREH_RASTWINKEL
    return { art: 'drehen', winkel: delta }
  }
  const eckenLokal: Point[] = [
    { x: drag.lokalMin.x, y: drag.lokalMin.y },
    { x: drag.lokalMax.x, y: drag.lokalMin.y },
    { x: drag.lokalMax.x, y: drag.lokalMax.y },
    { x: drag.lokalMin.x, y: drag.lokalMax.y },
  ]
  const eckeLokal = eckenLokal[drag.griff.eckeIndex]
  const lokalerMausPunkt = rotatePoint(mausWelt, drag.zentrum, -drag.rahmenDrehung)
  const lokalOffsetX = lokalerMausPunkt.x - drag.zentrum.x
  const lokalOffsetY = lokalerMausPunkt.y - drag.zentrum.y
  let faktorX = eckeLokal.x !== 0 ? lokalOffsetX / eckeLokal.x : 1
  let faktorY = eckeLokal.y !== 0 ? lokalOffsetY / eckeLokal.y : 1
  faktorX = Math.max(SKALIER_MIN_FAKTOR, faktorX)
  faktorY = Math.max(SKALIER_MIN_FAKTOR, faktorY)
  if (drag.nurProportional || shiftGedrueckt) {
    const faktor = (faktorX + faktorY) / 2
    faktorX = faktor
    faktorY = faktor
  }
  return { art: 'skalieren', faktorX, faktorY }
}

function wegpunkteMitNeuemEnde(wegpunkte: Point[], endeIndex: 0 | 1, punkt: Point): Point[] {
  const kopie = [...wegpunkte]
  kopie[endeIndex === 0 ? 0 : kopie.length - 1] = punkt
  return kopie
}

function meldeTrunkAblage(
  ctx: ToolContext,
  fehlgeschlageneAnzahl: number,
  was: 'verschmolzen' | 'angedockt',
): void {
  const teile = [
    t(was === 'verschmolzen' ? 'werkzeuge.trunk.verschmolzen' : 'werkzeuge.trunk.angedockt'),
  ]
  if (fehlgeschlageneAnzahl > 0) {
    teile.push(meldungFehlgeschlageneLeitungen(fehlgeschlageneAnzahl))
  }
  ctx.setStatus(teile.join(' '))
}

function verschiebeTrunkEndeFrei(
  ctx: ToolContext,
  objekt: TrunkObjekt,
  endeIndex: 0 | 1,
  hindernisse: RoutingHindernisseEingabe,
  zielWelt: Point,
): void {
  const neuerPfad = vorschauEndeVerschieben(
    objekt.wegpunkte,
    hindernisse,
    ctx.routingSettings(),
    endeIndex,
    zielWelt,
  )
  if (!neuerPfad) {
    ctx.setStatus(t('werkzeuge.auswahl.trunkEndeNicht'))
    return
  }
  const { command, fehlgeschlageneLeitungenAnzahl } = erzeugeGriffUpdateCommand(
    ctx,
    objekt,
    0,
    neuerPfad,
    t('werkzeuge.auswahl.trunkEndeVerschieben'),
    endeIndex,
  )
  ctx.commands.execute(command)
  if (fehlgeschlageneLeitungenAnzahl > 0) {
    ctx.setStatus(meldungFehlgeschlageneLeitungen(fehlgeschlageneLeitungenAnzahl))
  }
}

function fuehreTrunkAblageAus(
  ctx: ToolContext,
  quelle: TrunkObjekt,
  endeIndex: 0 | 1,
  ziel: TrunkAblageZiel,
  hindernisse: RoutingHindernisseEingabe,
): void {
  const blattId = ctx.aktivesBlattId()
  const zielTrunk = ctx.doc
    .getBlatt(blattId)
    ?.objekte.find((o): o is TrunkObjekt => o.type === 'trunk' && o.id === ziel.trunkId)
  if (!zielTrunk) return
  klaereAusfuehrung(
    (optionen) => ctx.oeffneBestaetigung(optionen),
    { name: zielTrunk.name, trunk: zielTrunk },
    { name: quelle.name, trunk: quelle },
    (wahl) => {
      if (wahl) verbindeTrunkAblage(ctx, quelle, endeIndex, ziel, hindernisse, wahl)
      else ctx.setStatus(t('werkzeuge.trunk.nichtVerbunden'))
      ctx.requestOverlayRedraw()
    },
  )
}

function verbindeTrunkAblage(
  ctx: ToolContext,
  quelle: TrunkObjekt,
  endeIndex: 0 | 1,
  ziel: TrunkAblageZiel,
  hindernisse: RoutingHindernisseEingabe,
  wahl: AusfuehrungsWahl,
): void {
  const blattId = ctx.aktivesBlattId()
  try {
    if (ziel.art === 'ende') {
      const ergebnis = erzeugeTrunkMergeCommand(
        ctx.doc,
        blattId,
        ziel.trunkId,
        ziel.endeIndex,
        quelle.id,
        endeIndex,
        ctx.routingSettings(),
        t('werkzeuge.trunk.verschmelzen'),
      )
      ergebnis.command.do()
      ctx.commands.push(gleicheKetteAn(ctx.doc, blattId, ziel.trunkId, wahl, ergebnis.command))
      ctx.setAuswahl([ziel.trunkId])
      meldeTrunkAblage(ctx, ergebnis.fehlgeschlageneRerouteAnzahl, 'verschmolzen')
      return
    }
    const neuerPfad =
      vorschauEndeVerschieben(
        quelle.wegpunkte,
        hindernisse,
        ctx.routingSettings(),
        endeIndex,
        ziel.punkt,
      ) ?? wegpunkteMitNeuemEnde(quelle.wegpunkte, endeIndex, ziel.punkt)
    const ergebnis = erzeugeTrunkAndockenCommand(
      ctx.doc,
      blattId,
      quelle.id,
      endeIndex,
      ziel.trunkId,
      ziel.t,
      neuerPfad,
      ctx.routingSettings(),
      t('werkzeuge.trunk.andocken'),
    )
    ergebnis.command.do()
    ctx.commands.push(gleicheKetteAn(ctx.doc, blattId, quelle.id, wahl, ergebnis.command))
    meldeTrunkAblage(ctx, ergebnis.fehlgeschlageneRerouteAnzahl, 'angedockt')
  } catch (fehler) {
    ctx.setStatus(fehler instanceof Error ? fehler.message : t('werkzeuge.trunk.verbindenNicht'))
  }
}

export function erzeugeAuswahlTool(): Tool {
  let hoverId: string | null = null
  let gruppenDrag: GruppenDragZustand | null = null
  let rechteckAuswahl: RechteckAuswahlZustand | null = null
  let pfadDrag: PfadDragZustand | null = null
  let pfadEndeDrag: PfadEndeDragZustand | null = null
  let ausgewaehlterGriff: LeitungsGriffTreffer | null = null
  let trunkDurchgangDrag: TrunkDurchgangDragZustand | null = null
  let transformDrag: TransformDragZustand | null = null
  let bezeichnerDrag: BezeichnerDragZustand | null = null
  let nullpunktDrag: NullpunktDragZustand | null = null
  let formPunktDrag: FormPunktDragZustand | null = null
  let schaltDrag: {
    objektId: string
    griff: SchaltGriff
    startScreen: Point
    ziel: Point
    raw: Point
    frei: boolean
  } | null = null
  let ausgewaehlterSchaltKnick: { objektId: string; index: number } | null = null
  let oeffnungDrag: OeffnungDragZustand | null = null
  let bemassungsreiheDrag: BemassungsreiheDragZustand | null = null
  let ausgewaehlterFormPunkt: { objektId: string; punktIndex: number } | null = null
  let letzteHinweisArt: AuswahlHinweisArt | null = null

  function aktuellesBlatt(ctx: ToolContext) {
    return ctx.doc.getBlatt(ctx.aktivesBlattId())
  }

  function einschleifbaresBauteil(
    ctx: ToolContext,
    drag: GruppenDragZustand,
  ): KomponentenObjekt | null {
    if (!istSchaltplan(ctx.doc.getZeichnung())) return null
    if (drag.objektIds.size !== 1 || drag.komponentenIds.size !== 1) return null
    if (drag.magnetModulId || drag.wand) return null
    const o = aktuellesBlatt(ctx)?.objekte.find((x) => drag.komponentenIds.has(x.id))
    return o?.type === 'komponente' ? o : null
  }

  function vorschauRenderKontext(
    ctx: ToolContext,
    alleObjekte: readonly Objekt[],
    bewegteObjekte: readonly Objekt[],
  ): KomponentenRenderKontext {
    const bewegtNachId = new Map(bewegteObjekte.map((o) => [o.id, o]))
    return {
      ...ctx.komponentenRenderKontext(),
      alleObjekteAufBlatt: alleObjekte.map((o) => bewegtNachId.get(o.id) ?? o),
    }
  }

  function vorschauWandNachbarn(
    alleObjekte: readonly Objekt[],
    bewegteObjekte: readonly Objekt[],
  ): Map<string, Objekt> {
    const ergebnis = new Map<string, Objekt>()
    const bewegtNachId = new Map(bewegteObjekte.map((o) => [o.id, o]))
    const bewegteWandIds = wandIdsAus(alleObjekte, bewegtNachId.keys())
    if (bewegteWandIds.size === 0) return ergebnis
    const virtuell = alleObjekte.map((o) => bewegtNachId.get(o.id) ?? o)
    const nachgefuehrt = nachgefuehrteOeffnungen(
      nachgefuehrteWandAnschluesse(alleObjekte, virtuell, bewegteWandIds),
    )
    nachgefuehrt.forEach((o, i) => {
      if (o !== virtuell[i]) ergebnis.set(o.id, o)
    })
    return ergebnis
  }

  function drehbareKomponentenIds(ctx: ToolContext): string[] {
    const blatt = aktuellesBlatt(ctx)
    if (!blatt) return []
    return ctx.getAuswahl().filter((id) => {
      const objekt = blatt.objekte.find((o) => o.id === id)
      return objekt?.type === 'komponente' && istBearbeitbar(objekt, blatt.ebenen)
    })
  }

  function hinweisAktualisieren(ctx: ToolContext) {
    const blatt = aktuellesBlatt(ctx)
    const auswahl = ctx.getAuswahl()
    const art = auswahlHinweisArt(blatt ? blatt.objekte.filter((o) => auswahl.includes(o.id)) : [])
    if (art === letzteHinweisArt) return
    letzteHinweisArt = art
    ctx.setStatus(auswahlHinweisText(art))
  }

  function zuruecksetzenFormBearbeitung() {
    formPunktDrag = null
    ausgewaehlterFormPunkt = null
    oeffnungDrag = null
    bemassungsreiheDrag = null
  }

  function knotenImDrag(objekte: readonly Objekt[]): Map<string, KnotenpunktObjekt> {
    const ergebnis = new Map<string, KnotenpunktObjekt>()
    if (!gruppenDrag) return ergebnis
    for (const o of objekte)
      if (o.type === 'knotenpunkt' && gruppenDrag.objektIds.has(o.id)) ergebnis.set(o.id, o)
    return ergebnis
  }

  function zuruecksetzenPfadBearbeitung() {
    schaltDrag = null
    ausgewaehlterSchaltKnick = null
    pfadDrag = null
    pfadEndeDrag = null
    ausgewaehlterGriff = null
  }

  function starteGruppenDrag(
    objekte: Objekt[],
    ids: string[],
    start: PointerInfo,
    angefassteId: string,
    ctx: ToolContext,
    ebenen: readonly Ebene[],
  ) {
    const objektIds = new Set(
      ids.filter((id) => {
        const objekt = objekte.find((o) => o.id === id)
        if (!objekt) return false
        return (
          objekt.type !== 'leitung' && objekt.type !== 'trunk' && istBearbeitbar(objekt, ebenen)
        )
      }),
    )
    const wandBewegtMit = [...objektIds].some(
      (id) => objekte.find((o) => o.id === id)?.type === 'wand',
    )
    if (!wandBewegtMit) {
      for (const id of [...objektIds]) {
        if (objekte.find((o) => o.id === id)?.type === 'raum') objektIds.delete(id)
      }
    }
    if (objektIds.size === 0) {
      gruppenDrag = null
      return
    }
    const komponentenIds = new Set(
      [...objektIds].filter((id) => objekte.find((o) => o.id === id)?.type === 'komponente'),
    )
    let magnetModulId: string | null = null
    if (objektIds.size === 1) {
      const einziges = objekte.find((o) => objektIds.has(o.id))
      if (einziges && istModul(einziges)) {
        if (hatVerbundeneLeitungenOderTrunks(objekte, einziges.id)) {
          ctx.setStatus(t('werkzeuge.auswahl.modulMitLeitungen'))
        } else {
          magnetModulId = einziges.id
        }
      }
    }
    const angefasste = objekte.find((o) => o.id === angefassteId)
    gruppenDrag = {
      objektIds,
      komponentenIds,
      startWorld: start.world,
      aktuellesDelta: { x: 0, y: 0 },
      letzteRerouteDelta: null,
      letzteRerouteVorschau: new Map(),
      letzteSchaltRerouteVorschau: new Map(),
      magnetModulId,
      magnetZiel: null,
      fangStart:
        angefasste?.type === 'komponente' && objektIds.has(angefasste.id)
          ? getFangpunkt(angefasste)
          : null,
      startRaw: start.raw,
      wand: null,
    }
  }

  return {
    id: 'auswahl',
    get bezeichnung() {
      return t('werkzeugnamen.auswahl')
    },
    bleibtAktiv: true,

    onActivate(ctx) {
      letzteHinweisArt = null
      hinweisAktualisieren(ctx)
    },
    onDeactivate() {
      hoverId = null
      gruppenDrag = null
      rechteckAuswahl = null
      trunkDurchgangDrag = null
      transformDrag = null
      bezeichnerDrag = null
      nullpunktDrag = null
      zuruecksetzenPfadBearbeitung()
      zuruecksetzenFormBearbeitung()
    },

    onDoubleClick(info: PointerInfo, ctx: ToolContext) {
      const blatt = aktuellesBlatt(ctx)
      if (!blatt) return

      const bezeichnerToleranz = ctx.view.laengeToWorld(TRUNK_DURCHGANG_GRIFF_TOLERANZ_PX)
      const bezeichnerTreffer = findeBezeichnerTreffer(
        blatt.objekte,
        blatt,
        ctx.view,
        info.raw,
        bezeichnerToleranz,
        ctx.doc.getZeichnung(),
        ctx.katalogKomponenten(),
        { flaechen: [], linien: [] },
        ctx.komponentenRenderKontext(),
      )
      if (
        bezeichnerTreffer &&
        bezeichnerTreffer.versatzGespeichert &&
        bezeichnerZielBearbeitbar(blatt, bezeichnerTreffer.ziel)
      ) {
        ctx.commands.execute(erzeugeBezeichnerVersatzCommand(ctx, bezeichnerTreffer.ziel, null))
        ctx.requestOverlayRedraw()
        return
      }

      const toleranz = ctx.view.laengeToWorld(TOLERANZ_PX)
      const treffer = hitTestObjekte(
        sichtbareObjekteAufBlatt(blatt),
        info.raw,
        toleranz,
        tabellenKontextVon(ctx),
      )
      if (!treffer) return

      if (istVerteiler(treffer)) {
        ctx.oeffneVerteilerDialog(
          { blattId: blatt.id, objektId: treffer.id, modus: 'uebersicht' },
          () => {},
        )
        return
      }

      if (treffer.type === 'komponente' && istPortKomponente(treffer)) {
        ctx.oeffneSwitchPortDialog(
          {
            quelle: { art: 'switch', blattId: blatt.id, objektId: treffer.id },
            modus: 'uebersicht',
          },
          () => {},
        )
        return
      }

      if (treffer.type === 'plankopf') {
        ctx.oeffnePlankopfDialog(treffer.id)
        return
      }

      if (treffer.type === 'leitungsliste') {
        const kontext = tabellenKontextVon(ctx)
        const modell = baueTabellenModell(treffer, kontext)
        const zelle = zelleAmPunkt(modell, treffer.position, info.raw)
        if (zelle?.spaltenIndex === LEITUNGSLISTE_TYP_SPALTENINDEX) {
          const kabel = leitungslistenKabel(kontext.zeichnung, kontext.blattId, treffer.umfang)[
            zelle.zeilenIndex
          ]
          if (kabel) ctx.oeffneLeitungslisteKabeltypDialog(kabel.nummer)
        }
        return
      }

      if (treffer.type === 'schaltverbindung') {
        const knick = knickEinfuegen(
          treffer.wegpunkte,
          info.raw,
          ctx.view.laengeToWorld(LEITUNG_GRIFF_TOLERANZ_PX),
        )
        if (!knick) return
        ctx.commands.execute(
          erzeugeObjektAktualisierenCommand(
            ctx.doc,
            ctx.aktivesBlattId(),
            treffer.id,
            { wegpunkte: knick.wegpunkte, autoRouting: undefined, anordnung: undefined },
            t('werkzeuge.auswahl.knickEinfuegen'),
          ),
        )
        ctx.setAuswahl([treffer.id])
        ausgewaehlterSchaltKnick = { objektId: treffer.id, index: knick.index }
        ctx.requestOverlayRedraw()
        return
      }

      if (treffer.type === 'leitung' || treffer.type === 'trunk') {
        const griffToleranz = ctx.view.laengeToWorld(LEITUNG_GRIFF_TOLERANZ_PX)
        const pfadSegmente = pfadSegmenteVon(treffer)
        const griff = findeSegmentGriff(pfadSegmente, info.raw, griffToleranz)
        if (!griff) return
        const frei = treffer.type === 'leitung' && treffer.autoRoutingAus
        const neuerPfad = frei
          ? vorschauSegmentVerschiebenFrei(
              pfadSegmente[griff.segmentArrIndex],
              griff.lokalerIndex,
              info.raw,
            )
          : vorschauSegmentVerschieben(
              pfadSegmente[griff.segmentArrIndex],
              routingHindernisse(blatt.objekte, ctx.routingSettings().sicherheitsabstandMeter),
              routingFuerPfad(ctx, treffer),
              griff.lokalerIndex,
              info.raw,
            )
        if (!neuerPfad) {
          ctx.setStatus(t('werkzeuge.auswahl.wegpunktNicht'))
          return
        }
        const { command, fehlgeschlageneLeitungenAnzahl } = erzeugeGriffUpdateCommand(
          ctx,
          treffer,
          griff.segmentArrIndex,
          neuerPfad,
          t('werkzeuge.auswahl.wegpunktHinzufuegen'),
        )
        ctx.commands.execute(command)
        if (fehlgeschlageneLeitungenAnzahl > 0) {
          ctx.setStatus(meldungFehlgeschlageneLeitungen(fehlgeschlageneLeitungenAnzahl))
        }
        if (treffer.type === 'leitung') frageAutoRoutingAusschalten(ctx, treffer)
        ctx.requestOverlayRedraw()
        return
      }

      if (treffer.type === 'wand') {
        const blatt = aktuellesBlatt(ctx)
        const geteilt = blatt ? teileWandSegment(blatt.objekte, treffer.id, info.raw) : null
        if (geteilt) {
          ctx.commands.execute(
            erzeugeObjektAendernCommand(
              ctx.doc,
              ctx.aktivesBlattId(),
              t('werkzeuge.wandTeilen.teilen'),
              () => nachgefuehrteOeffnungen(geteilt),
            ),
          )
        }
        ctx.requestOverlayRedraw()
        return
      }

      if (treffer.type === 'polylinie' || treffer.type === 'bodenplatte') {
        const formToleranz = ctx.view.laengeToWorld(FORM_GRIFF_TOLERANZ_PX)
        const kanten = istGeschlossenesFormObjekt(treffer)
          ? [...treffer.punkte, treffer.punkte[0]]
          : treffer.punkte
        const segmentIndex = findeFormSegmentIndex(kanten, info.raw, formToleranz)
        if (segmentIndex === null) return
        const neuePunkte = fuegeFormPunktEin(treffer.punkte, segmentIndex, info.raw)
        ctx.commands.execute(
          erzeugeFormPunkteCommand(
            ctx,
            treffer,
            neuePunkte,
            t('werkzeuge.auswahl.punktHinzufuegen'),
          ),
        )
        ctx.requestOverlayRedraw()
        return
      }

      if (treffer.type !== 'komponente') return
      ctx.setAuswahl([treffer.id])
      const blattId = ctx.aktivesBlattId()
      const objektId = treffer.id
      ctx.oeffneEingabeDialog(
        {
          titel: t('werkzeuge.auswahl.beschriftungTitel'),
          label: t('werkzeuge.auswahl.beschriftungLabel'),
          typ: 'text',
          anfangswert: treffer.beschriftung ?? '',
        },
        (wert) => {
          if (wert === null) return
          const command = erzeugeObjektAendernCommand(
            ctx.doc,
            blattId,
            t('werkzeuge.auswahl.beschriftungAendern'),
            (objekte) =>
              objekte.map((o) =>
                o.id === objektId && o.type === 'komponente'
                  ? { ...o, beschriftung: wert.trim() || undefined }
                  : o,
              ),
          )
          ctx.commands.execute(command)
        },
      )
    },

    onPointerDown(info: PointerInfo, ctx: ToolContext) {
      const blatt = aktuellesBlatt(ctx)
      if (!blatt) return
      const toleranz = ctx.view.laengeToWorld(TOLERANZ_PX)

      if (!erweitertAuswahl(info)) {
        if (blatt.nullpunkt) {
          const nullpunktToleranz = ctx.view.laengeToWorld(NULLPUNKT_GRIFF_TOLERANZ_PX)
          if (distance(info.raw, blatt.nullpunkt) <= nullpunktToleranz) {
            nullpunktDrag = { startScreen: info.screen, ziel: info.raw }
            gruppenDrag = null
            rechteckAuswahl = null
            zuruecksetzenPfadBearbeitung()
            zuruecksetzenFormBearbeitung()
            ctx.requestOverlayRedraw()
            return
          }
        }

        const auswahlIds = ctx.getAuswahl()
        for (const objekt of blatt.objekte) {
          if (objekt.type !== 'kabelschacht' || !auswahlIds.includes(objekt.id)) continue
          const anzeige = ermittleSchachtAnzeige(ctx.doc.getZeichnung(), blatt.id, objekt)
          const treffer = etagenVerweisRechtecke(ctx.view, objekt, anzeige).find(
            ({ rechteck }) =>
              info.screen.x >= rechteck.x &&
              info.screen.x <= rechteck.x + rechteck.breite &&
              info.screen.y >= rechteck.y &&
              info.screen.y <= rechteck.y + rechteck.hoehe,
          )
          if (treffer) {
            window.dispatchEvent(
              new CustomEvent('eleasycad:sprung-zu-blatt', {
                detail: { blattId: treffer.zeile.blattId, objektId: treffer.zeile.schachtId },
              }),
            )
            return
          }
        }

        const ausgewaehlteKomponenten = blatt.objekte.filter(
          (o): o is KomponentenObjekt => o.type === 'komponente' && auswahlIds.includes(o.id),
        )
        if (
          blatt.wirkverbindungSichtbar &&
          ausgewaehlteKomponenten.length === 1 &&
          auswahlIds.length === ausgewaehlteKomponenten.length
        ) {
          const komponente = ausgewaehlteKomponenten[0]
          const verweise = ermittleEtagenWirkverbindungen(
            komponente,
            blatt.id,
            ctx.doc.getZeichnung(),
            ctx.katalogKomponenten(),
            planUebersetzer(ctx.doc.getZeichnung()),
          )
          const verweis = trefferWirkverbindungsVerweis(
            wirkverbindungsVerweisRechtecke(ctx.view, komponente, blatt, verweise),
            info.screen,
          )
          if (verweis) {
            window.dispatchEvent(
              new CustomEvent('eleasycad:sprung-zu-blatt', {
                detail: { blattId: verweis.blattId, objektId: verweis.objektId },
              }),
            )
            return
          }
        }

        const trunkEndeToleranz = ctx.view.laengeToWorld(TRUNK_ENDE_TOLERANZ_PX)
        const trunks = blatt.objekte.filter((o): o is TrunkObjekt => o.type === 'trunk')
        const sprungZiel = findeVerbundenesTrunkEnde(trunks, info.raw, trunkEndeToleranz)
        if (sprungZiel) {
          window.dispatchEvent(new CustomEvent('eleasycad:sprung-zu-blatt', { detail: sprungZiel }))
          return
        }

        const nummernschildToleranz = ctx.view.laengeToWorld(TRUNK_DURCHGANG_GRIFF_TOLERANZ_PX)
        if (info.shiftKey) {
          const nummernschildTreffer = findeNummernschildTreffer(
            trunks,
            blatt.objekte,
            info.raw,
            nummernschildToleranz,
          )
          if (nummernschildTreffer && istBearbeitbar(nummernschildTreffer.trunk, blatt.ebenen)) {
            trunkDurchgangDrag = {
              trunkId: nummernschildTreffer.trunk.id,
              leitungId: nummernschildTreffer.leitungId,
              art: nummernschildTreffer.art,
              startScreen: info.screen,
              zielWorld: info.world,
            }
            pfadDrag = null
            gruppenDrag = null
            rechteckAuswahl = null
            zuruecksetzenPfadBearbeitung()
            zuruecksetzenFormBearbeitung()
            ctx.requestOverlayRedraw()
            return
          }
        }

        const bezeichnerHindernisse: BezeichnerHindernisse = {
          flaechen: ermittleKomponentenFlaechen(
            holeBezeichnerMessKontext(),
            ctx.view,
            blatt.objekte,
            ctx.komponentenRenderKontext(),
          ),
          linien: ermittleLinienHindernisse(ctx.view, blatt.objekte),
        }
        const bezeichnerTreffer = findeBezeichnerTreffer(
          blatt.objekte,
          blatt,
          ctx.view,
          info.raw,
          nummernschildToleranz,
          ctx.doc.getZeichnung(),
          ctx.katalogKomponenten(),
          bezeichnerHindernisse,
          ctx.komponentenRenderKontext(),
        )
        if (bezeichnerTreffer && bezeichnerZielBearbeitbar(blatt, bezeichnerTreffer.ziel)) {
          bezeichnerDrag = {
            ziel: bezeichnerTreffer.ziel,
            ankerWelt: bezeichnerTreffer.ankerWelt,
            startScreen: info.screen,
            startWorld: info.world,
            startVersatz: bezeichnerTreffer.versatz,
            aktuellerVersatz: bezeichnerTreffer.versatz,
          }
          pfadDrag = null
          gruppenDrag = null
          rechteckAuswahl = null
          zuruecksetzenPfadBearbeitung()
          zuruecksetzenFormBearbeitung()
          ctx.requestOverlayRedraw()
          return
        }
      }

      const auswahlVorKlick = ctx.getAuswahl()
      if (auswahlVorKlick.length === 1) {
        const ausgewaehltesObjektRoh = blatt.objekte.find((o) => o.id === auswahlVorKlick[0])
        const ausgewaehltesObjekt =
          ausgewaehltesObjektRoh && istBearbeitbar(ausgewaehltesObjektRoh, blatt.ebenen)
            ? ausgewaehltesObjektRoh
            : undefined
        if (
          ausgewaehltesObjekt &&
          (ausgewaehltesObjekt.type === 'leitung' || ausgewaehltesObjekt.type === 'trunk')
        ) {
          const griffToleranz = ctx.view.laengeToWorld(LEITUNG_GRIFF_TOLERANZ_PX)
          if (ausgewaehltesObjekt.type === 'trunk') {
            const endeIndex = findeEndeIndex(ausgewaehltesObjekt.wegpunkte, info.raw, griffToleranz)
            if (endeIndex !== null) {
              ausgewaehlterGriff = null
              gruppenDrag = null
              rechteckAuswahl = null
              pfadEndeDrag = {
                schachtZiel: null,
                objektId: ausgewaehltesObjekt.id,
                endeIndex,
                hindernisse: routingHindernisse(
                  blatt.objekte,
                  ctx.routingSettings().sicherheitsabstandMeter,
                ),
                startScreen: info.screen,
                ziel: info.world,
                vorschau: null,
                ablageZiel: null,
              }
              ctx.requestOverlayRedraw()
              return
            }
          }
          const pfadSegmente = pfadSegmenteVon(ausgewaehltesObjekt)
          const griff = findeLeitungsGriff(pfadSegmente, info.raw, griffToleranz)
          if (griff && griff.art === 'wegpunkt') {
            ausgewaehlterGriff = griff
            pfadDrag = null
            gruppenDrag = null
            rechteckAuswahl = null
            ctx.requestOverlayRedraw()
            return
          }
          if (griff && griff.art === 'segment') {
            ausgewaehlterGriff = null
            gruppenDrag = null
            rechteckAuswahl = null
            pfadDrag = {
              objektTyp: ausgewaehltesObjekt.type,
              objektId: ausgewaehltesObjekt.id,
              segmentArrIndex: griff.segmentArrIndex,
              lokalerSegmentIndex: griff.lokalerIndex,
              hindernisse: routingHindernisse(
                blatt.objekte,
                ctx.routingSettings().sicherheitsabstandMeter,
              ),
              startScreen: info.screen,
              ziel: info.world,
              vorschau: pfadSegmente[griff.segmentArrIndex],
            }
            ctx.requestOverlayRedraw()
            return
          }
        } else if (ausgewaehltesObjekt && ausgewaehltesObjekt.type === 'schaltverbindung') {
          const griff = findeSchaltGriff(
            ausgewaehltesObjekt.wegpunkte,
            info.raw,
            ctx.view.laengeToWorld(LEITUNG_GRIFF_TOLERANZ_PX),
          )
          if (griff) {
            zuruecksetzenPfadBearbeitung()
            zuruecksetzenFormBearbeitung()
            gruppenDrag = null
            rechteckAuswahl = null
            if (griff.art === 'ecke')
              ausgewaehlterSchaltKnick = { objektId: ausgewaehltesObjekt.id, index: griff.index }
            schaltDrag = {
              objektId: ausgewaehltesObjekt.id,
              griff,
              startScreen: info.screen,
              ziel: info.world,
              raw: info.raw,
              frei: info.ctrlKey === true,
            }
            ctx.requestOverlayRedraw()
            return
          }
        } else if (ausgewaehltesObjekt && istFormObjekt(ausgewaehltesObjekt)) {
          const formToleranz = ctx.view.laengeToWorld(FORM_GRIFF_TOLERANZ_PX)
          const punktIndex = findeFormPunktIndex(ausgewaehltesObjekt.punkte, info.raw, formToleranz)
          if (punktIndex !== null) {
            zuruecksetzenPfadBearbeitung()
            gruppenDrag = null
            rechteckAuswahl = null
            ausgewaehlterFormPunkt = { objektId: ausgewaehltesObjekt.id, punktIndex }
            formPunktDrag = {
              objektId: ausgewaehltesObjekt.id,
              objektTyp: ausgewaehltesObjekt.type,
              punktIndex,
              startScreen: info.screen,
              ziel: info.world,
            }
            ctx.requestOverlayRedraw()
            return
          }
        } else if (ausgewaehltesObjekt && ausgewaehltesObjekt.type === 'bemassungsreihe') {
          const griff = findeBemassungsreiheGriff(
            ausgewaehltesObjekt,
            info.raw,
            ctx.view.laengeToWorld(FORM_GRIFF_TOLERANZ_PX),
          )
          if (griff) {
            zuruecksetzenPfadBearbeitung()
            zuruecksetzenFormBearbeitung()
            gruppenDrag = null
            rechteckAuswahl = null
            bemassungsreiheDrag = {
              objektId: ausgewaehltesObjekt.id,
              griff,
              startScreen: info.screen,
              ziel: info.world,
            }
            ctx.requestOverlayRedraw()
            return
          }
        } else if (
          ausgewaehltesObjekt &&
          (ausgewaehltesObjekt.type === 'tuer' ||
            ausgewaehltesObjekt.type === 'fenster' ||
            ausgewaehltesObjekt.type === 'wanddurchbruch')
        ) {
          const oeffnungToleranz = ctx.view.laengeToWorld(TOLERANZ_PX)
          const wand = blatt.objekte.find(
            (o): o is WandObjekt => o.type === 'wand' && o.id === ausgewaehltesObjekt.wandId,
          )
          if (
            wand &&
            distance(info.raw, ausgewaehltesObjekt.position) <=
              oeffnungToleranz + ausgewaehltesObjekt.breite / 2
          ) {
            zuruecksetzenPfadBearbeitung()
            zuruecksetzenFormBearbeitung()
            gruppenDrag = null
            rechteckAuswahl = null
            oeffnungDrag = {
              objektId: ausgewaehltesObjekt.id,
              wandId: wand.id,
              startScreen: info.screen,
              ziel: info.world,
            }
            ctx.requestOverlayRedraw()
            return
          }
        }
      }

      if (!erweitertAuswahl(info) && auswahlVorKlick.length > 0) {
        const rahmen = ermittleTransformRahmen(blatt.objekte, auswahlVorKlick)
        const griff = rahmen ? ermittleTransformGriffTreffer(rahmen, info.raw, ctx.view) : null
        if (rahmen && griff) {
          const alleTeilnehmer = blatt.objekte.filter(
            (o) => auswahlVorKlick.includes(o.id) && istTransformierbar(o.type),
          )
          const teilnehmer = alleTeilnehmer.filter(
            (o) =>
              !(istAufgesetztesModul(o) && !auswahlVorKlick.includes(o.traegerId)) &&
              istBearbeitbar(o, blatt.ebenen),
          )
          if (teilnehmer.length < alleTeilnehmer.length) {
            ctx.setStatus(t('werkzeuge.auswahl.moduleMitGehaeuse'))
          }
          if (teilnehmer.length === 0) {
            ctx.requestOverlayRedraw()
            return
          }
          transformDrag = {
            objektIds: new Set(teilnehmer.map((o) => o.id)),
            komponentenIds: new Set(
              teilnehmer.filter((o) => o.type === 'komponente').map((o) => o.id),
            ),
            zentrum: rahmen.zentrum,
            rahmenDrehung: rahmen.drehung,
            lokalMin: rahmen.lokalMin,
            lokalMax: rahmen.lokalMax,
            griff,
            nurProportional: ermittleNurProportional(teilnehmer),
            startScreen: info.screen,
            startWinkel: angleBetween(rahmen.zentrum, info.world),
            aktuelleTransformation:
              griff.art === 'drehen'
                ? { art: 'drehen', winkel: 0 }
                : { art: 'skalieren', faktorX: 1, faktorY: 1 },
          }
          gruppenDrag = null
          rechteckAuswahl = null
          zuruecksetzenPfadBearbeitung()
          zuruecksetzenFormBearbeitung()
          ctx.requestOverlayRedraw()
          return
        }
      }

      zuruecksetzenPfadBearbeitung()
      zuruecksetzenFormBearbeitung()

      if (erweitertAuswahl(info)) {
        const treffer = hitTestObjekte(
          sichtbareObjekteAufBlatt(blatt),
          info.raw,
          toleranz,
          tabellenKontextVon(ctx),
        )
        if (treffer) {
          const aktuelleAuswahl = ctx.getAuswahl()
          ctx.setAuswahl(
            aktuelleAuswahl.includes(treffer.id)
              ? aktuelleAuswahl.filter((id) => id !== treffer.id)
              : [...aktuelleAuswahl, treffer.id],
          )
          gruppenDrag = null
        } else {
          rechteckAuswahl = {
            startScreen: info.screen,
            startRaw: info.raw,
            aktuellRaw: info.raw,
            additiv: true,
          }
        }
        ctx.requestOverlayRedraw()
        return
      }

      const treffer = hitTestObjekte(
        sichtbareObjekteAufBlatt(blatt),
        info.raw,
        toleranz,
        tabellenKontextVon(ctx),
      )
      if (treffer) {
        const aktuelleAuswahl = ctx.getAuswahl()
        if (aktuelleAuswahl.includes(treffer.id) && aktuelleAuswahl.length > 1) {
          starteGruppenDrag(blatt.objekte, aktuelleAuswahl, info, treffer.id, ctx, blatt.ebenen)
        } else {
          ctx.setAuswahl([treffer.id])
          starteGruppenDrag(blatt.objekte, [treffer.id], info, treffer.id, ctx, blatt.ebenen)
        }
      } else {
        rechteckAuswahl = {
          startScreen: info.screen,
          startRaw: info.raw,
          aktuellRaw: info.raw,
          additiv: false,
        }
      }
      ctx.requestOverlayRedraw()
    },

    onPointerMove(info: PointerInfo, ctx: ToolContext) {
      if (nullpunktDrag) {
        nullpunktDrag.ziel = info.raw
        ctx.requestOverlayRedraw()
        return
      }
      if (transformDrag) {
        transformDrag.aktuelleTransformation = berechneTransformationAusGriff(
          transformDrag,
          info.world,
          info.shiftKey,
        )
        ctx.requestOverlayRedraw()
        return
      }
      if (rechteckAuswahl) {
        rechteckAuswahl.aktuellRaw = info.raw
        ctx.requestOverlayRedraw()
        return
      }
      if (gruppenDrag) {
        gruppenDrag.aktuellesDelta = verschiebungImDrag(gruppenDrag, info, ctx)
        gruppenDrag.magnetZiel = null
        if (gruppenDrag.magnetModulId) {
          const blatt = aktuellesBlatt(ctx)
          const modul = blatt?.objekte.find((o) => o.id === gruppenDrag!.magnetModulId)
          if (blatt && modul?.type === 'komponente') {
            gruppenDrag.magnetZiel = findeNaechstenFreienSlot(
              blatt.objekte,
              info.raw,
              ctx.view.laengeToWorld(MAGNET_TOLERANZ_PX),
              modul,
            )
          }
        }
        gruppenDrag.wand = null
        const blattWand = aktuellesBlatt(ctx)
        if (!gruppenDrag.magnetZiel && gruppenDrag.komponentenIds.size > 0 && blattWand) {
          gruppenDrag.wand = berechneWandVerschiebung(
            blattWand.objekte,
            gruppenDrag.komponentenIds,
            gruppenDrag.objektIds,
            gruppenDrag.aktuellesDelta,
            wandflaecheUnterZeiger(ctx, info.raw, gruppenDrag.komponentenIds),
            (punkt) => wandflaecheUnterZeiger(ctx, punkt, gruppenDrag!.komponentenIds),
            ctx.doc.getZeichnung(),
          )
        }
        const bauteil = einschleifbaresBauteil(ctx, gruppenDrag)
        const delta = gruppenDrag.aktuellesDelta
        if (bauteil && blattWand && (delta.x !== 0 || delta.y !== 0)) {
          const gerastet = rasteAufLinieEin(
            blattWand.objekte,
            { ...bauteil, position: add(bauteil.position, delta) },
            false,
            fremdeLinien(blattWand.objekte, bauteil.id),
          )
          if (gerastet) gruppenDrag.aktuellesDelta = sub(gerastet.position, bauteil.position)
        }
        ctx.requestOverlayRedraw()
        return
      }
      if (trunkDurchgangDrag) {
        trunkDurchgangDrag.zielWorld = info.world
        ctx.requestOverlayRedraw()
        return
      }
      if (bezeichnerDrag) {
        bezeichnerDrag.aktuellerVersatz = add(
          bezeichnerDrag.startVersatz,
          sub(info.world, bezeichnerDrag.startWorld),
        )
        ctx.requestOverlayRedraw()
        return
      }
      if (pfadDrag) {
        pfadDrag.ziel = info.world
        ctx.requestOverlayRedraw()
        return
      }
      if (formPunktDrag) {
        formPunktDrag.ziel = info.world
        ctx.requestOverlayRedraw()
        return
      }
      if (schaltDrag) {
        schaltDrag.ziel = info.world
        schaltDrag.raw = info.raw
        schaltDrag.frei = info.ctrlKey === true
        ctx.requestOverlayRedraw()
        return
      }
      if (oeffnungDrag) {
        oeffnungDrag.ziel = info.world
        ctx.requestOverlayRedraw()
        return
      }
      if (bemassungsreiheDrag) {
        bemassungsreiheDrag.ziel = info.world
        ctx.requestOverlayRedraw()
        return
      }
      if (pfadEndeDrag) {
        pfadEndeDrag.ziel = info.world
        const blattFuerZiel = aktuellesBlatt(ctx)
        const trunkZiel = blattFuerZiel
          ? findeTrunkAblageZiel(
              blattFuerZiel.objekte,
              pfadEndeDrag.objektId,
              info.raw,
              ctx.view.laengeToWorld(TRUNK_ENDE_TOLERANZ_PX),
              ctx.view.laengeToWorld(TOLERANZ_PX),
            )
          : null
        pfadEndeDrag.schachtZiel =
          blattFuerZiel && trunkZiel?.art !== 'ende'
            ? findeSchachtAblageZiel(
                blattFuerZiel.objekte,
                info.raw,
                ctx.view.laengeToWorld(TOLERANZ_PX),
              )
            : null
        pfadEndeDrag.ablageZiel = pfadEndeDrag.schachtZiel ? null : trunkZiel
        ctx.setStatus(
          pfadEndeDrag.schachtZiel
            ? t('werkzeuge.auswahl.loslassenSchacht')
            : pfadEndeDrag.ablageZiel === null
              ? null
              : pfadEndeDrag.ablageZiel.art === 'ende'
                ? t('werkzeuge.auswahl.loslassenVerschmelzen')
                : t('werkzeuge.auswahl.loslassenAbzweig'),
        )
        ctx.requestOverlayRedraw()
        return
      }
      const blatt = aktuellesBlatt(ctx)
      if (!blatt) return
      const toleranz = ctx.view.laengeToWorld(TOLERANZ_PX)
      const treffer = hitTestObjekte(
        sichtbareObjekteAufBlatt(blatt),
        info.raw,
        toleranz,
        tabellenKontextVon(ctx),
      )
      const neueHoverId = treffer?.id ?? null
      if (neueHoverId !== hoverId) {
        hoverId = neueHoverId
        ctx.requestOverlayRedraw()
      }
    },

    onPointerUp(info: PointerInfo, ctx: ToolContext) {
      if (nullpunktDrag) {
        const zugPx = Math.hypot(
          info.screen.x - nullpunktDrag.startScreen.x,
          info.screen.y - nullpunktDrag.startScreen.y,
        )
        if (zugPx >= MINDEST_ZUG_PX) {
          ctx.commands.execute(
            erzeugeBlattAendernCommand(
              ctx.doc,
              ctx.aktivesBlattId(),
              t('werkzeuge.auswahl.nullpunktVerschieben'),
              {
                nullpunkt: nullpunktDrag.ziel,
              },
            ),
          )
        }
        nullpunktDrag = null
        ctx.requestOverlayRedraw()
        return
      }
      if (transformDrag) {
        const transformation = berechneTransformationAusGriff(
          transformDrag,
          info.world,
          info.shiftKey,
        )
        const hatSichGeaendert =
          transformation.art === 'drehen'
            ? Math.abs(transformation.winkel) > 1e-9
            : Math.hypot(
                info.screen.x - transformDrag.startScreen.x,
                info.screen.y - transformDrag.startScreen.y,
              ) >= MINDEST_ZUG_PX
        if (hatSichGeaendert) {
          const { command, fehlgeschlageneLeitungenAnzahl } =
            erzeugeTransformationMitRerouteCommand(
              ctx.doc,
              ctx.aktivesBlattId(),
              transformDrag.objektIds,
              transformDrag.zentrum,
              transformation,
              ctx.routingSettings(),
              t(
                transformDrag.griff.art === 'drehen'
                  ? 'werkzeuge.auswahl.objekteDrehen'
                  : 'werkzeuge.auswahl.objekteSkalieren',
              ),
            )
          ctx.commands.execute(command)
          if (fehlgeschlageneLeitungenAnzahl > 0) {
            ctx.setStatus(meldungFehlgeschlageneLeitungen(fehlgeschlageneLeitungenAnzahl))
          }
        }
        transformDrag = null
        ctx.requestOverlayRedraw()
        return
      }
      if (trunkDurchgangDrag) {
        const zugPx = Math.hypot(
          info.screen.x - trunkDurchgangDrag.startScreen.x,
          info.screen.y - trunkDurchgangDrag.startScreen.y,
        )
        if (zugPx >= MINDEST_ZUG_PX) {
          const blatt = aktuellesBlatt(ctx)
          const trunk = blatt?.objekte.find(
            (o): o is TrunkObjekt => o.id === trunkDurchgangDrag!.trunkId && o.type === 'trunk',
          )
          const leitung = blatt?.objekte.find(
            (o): o is LeitungsObjekt =>
              o.id === trunkDurchgangDrag!.leitungId && o.type === 'leitung',
          )
          if (blatt && trunk && leitung) {
            const neuerT = naechsterPunktAufPfad(trunk.wegpunkte, info.world)?.t ?? 0
            const hindernisse = routingHindernisse(
              blatt.objekte,
              ctx.routingSettings().sicherheitsabstandMeter,
            )
            const ergebnis = vorschauTrunkDurchgangVerschieben(
              leitung,
              trunk,
              blatt.objekte,
              hindernisse,
              routingFuerPfad(ctx, leitung),
              trunkDurchgangDrag.art,
              neuerT,
            )
            if (ergebnis) {
              const leitungId = leitung.id
              const command = erzeugeObjektAendernCommand(
                ctx.doc,
                ctx.aktivesBlattId(),
                trunkDurchgangDrag.art === 'eintritt'
                  ? t('werkzeuge.auswahl.eintrittspunkt')
                  : t('werkzeuge.auswahl.austrittspunkt'),
                (objekte) =>
                  objekte.map((o) =>
                    o.id === leitungId && o.type === 'leitung'
                      ? {
                          ...o,
                          trunkDurchgaenge: ergebnis.trunkDurchgaenge,
                          pfadSegmente: ergebnis.pfadSegmente,
                        }
                      : o,
                  ),
              )
              ctx.commands.execute(command)
            } else {
              ctx.setStatus(t('werkzeuge.auswahl.punktNicht'))
            }
          }
        }
        trunkDurchgangDrag = null
        ctx.requestOverlayRedraw()
        return
      }
      if (bezeichnerDrag) {
        const zugPx = Math.hypot(
          info.screen.x - bezeichnerDrag.startScreen.x,
          info.screen.y - bezeichnerDrag.startScreen.y,
        )
        if (zugPx >= MINDEST_ZUG_PX) {
          ctx.commands.execute(
            erzeugeBezeichnerVersatzCommand(
              ctx,
              bezeichnerDrag.ziel,
              bezeichnerDrag.aktuellerVersatz,
            ),
          )
        } else {
          ctx.setAuswahl([bezeichnerZielObjektId(bezeichnerDrag.ziel)])
        }
        bezeichnerDrag = null
        ctx.requestOverlayRedraw()
        return
      }
      if (pfadDrag) {
        const zugPx = Math.hypot(
          info.screen.x - pfadDrag.startScreen.x,
          info.screen.y - pfadDrag.startScreen.y,
        )
        if (zugPx >= MINDEST_ZUG_PX) {
          const blatt = aktuellesBlatt(ctx)
          const objekt = blatt?.objekte.find((o) => o.id === pfadDrag!.objektId)
          if (objekt && (objekt.type === 'leitung' || objekt.type === 'trunk')) {
            const pfad = pfadSegmenteVon(objekt)[pfadDrag.segmentArrIndex]
            const frei = objekt.type === 'leitung' && objekt.autoRoutingAus
            const neuerPfad = frei
              ? vorschauSegmentVerschiebenFrei(pfad, pfadDrag.lokalerSegmentIndex, info.world)
              : vorschauSegmentVerschieben(
                  pfad,
                  pfadDrag.hindernisse,
                  routingFuerPfad(ctx, objekt),
                  pfadDrag.lokalerSegmentIndex,
                  info.world,
                )
            if (neuerPfad) {
              const { command, fehlgeschlageneLeitungenAnzahl } = erzeugeGriffUpdateCommand(
                ctx,
                objekt,
                pfadDrag.segmentArrIndex,
                neuerPfad,
                objekt.type === 'trunk'
                  ? t('werkzeuge.auswahl.trunkSegment')
                  : t('werkzeuge.auswahl.leitungssegment'),
                undefined,
                objekt.type === 'leitung' && objekt.teilstueckZonen?.length
                  ? (zonenNachSegmentZug(
                      objekt,
                      pfad,
                      pfadDrag.lokalerSegmentIndex,
                      neuerPfad,
                      info.world,
                    ) ?? [])
                  : undefined,
              )
              ctx.commands.execute(command)
              if (fehlgeschlageneLeitungenAnzahl > 0) {
                ctx.setStatus(meldungFehlgeschlageneLeitungen(fehlgeschlageneLeitungenAnzahl))
              }
              if (objekt.type === 'leitung') frageAutoRoutingAusschalten(ctx, objekt)
            } else {
              ctx.setStatus(t('werkzeuge.auswahl.segmentNicht'))
            }
          }
        }
        pfadDrag = null
        ctx.requestOverlayRedraw()
        return
      }
      if (schaltDrag) {
        const zug = schaltDrag
        schaltDrag = null
        const zugPx = Math.hypot(
          info.screen.x - zug.startScreen.x,
          info.screen.y - zug.startScreen.y,
        )
        const blatt = aktuellesBlatt(ctx)
        const objekt = blatt?.objekte.find((o) => o.id === zug.objektId)
        if (zugPx >= MINDEST_ZUG_PX && blatt && objekt?.type === 'schaltverbindung') {
          const ergebnis = schaltGriffErgebnis(ctx, blatt.objekte, objekt, zug)
          ctx.commands.execute(
            erzeugeObjektAendernCommand(
              ctx.doc,
              ctx.aktivesBlattId(),
              t(
                zug.griff.art === 'ende'
                  ? 'werkzeuge.auswahl.verbindungsende'
                  : 'werkzeuge.auswahl.verbindungAendern',
              ),
              (objekte) => {
                const neu = objekte.map((o) => (o.id === objekt.id ? ergebnis.objekt : o))
                return ergebnis.alterKnoten ? raeumeKnotenAuf(neu, [ergebnis.alterKnoten]) : neu
              },
            ),
          )
          ausgewaehlterSchaltKnick = null
          if (objekt.autoRouting) ctx.setStatus(t('werkzeuge.auswahl.autoAusVerbindung'))
        }
        ctx.requestOverlayRedraw()
        return
      }
      if (formPunktDrag) {
        const zugPx = Math.hypot(
          info.screen.x - formPunktDrag.startScreen.x,
          info.screen.y - formPunktDrag.startScreen.y,
        )
        if (zugPx >= MINDEST_ZUG_PX) {
          const blatt = aktuellesBlatt(ctx)
          const objekt = blatt?.objekte.find((o) => o.id === formPunktDrag!.objektId)
          if (
            blatt &&
            objekt &&
            objekt.type === 'wand' &&
            istWandEndpunkt(objekt, formPunktDrag.punktIndex)
          ) {
            const alterPunkt = objekt.punkte[formPunktDrag.punktIndex]
            const neuePosition = info.world
            ctx.commands.execute(
              erzeugeObjektAendernCommand(
                ctx.doc,
                ctx.aktivesBlattId(),
                t('werkzeuge.auswahl.wandpunkt'),
                (objekte) =>
                  nachgefuehrteOeffnungen(verschiebeWandKnoten(objekte, alterPunkt, neuePosition)),
              ),
            )
          } else if (objekt && istFormObjekt(objekt)) {
            const neuePunkte = verschiebeFormPunkt(
              objekt.punkte,
              formPunktDrag.punktIndex,
              info.world,
            )
            ctx.commands.execute(
              erzeugeFormPunkteCommand(
                ctx,
                objekt,
                neuePunkte,
                objekt.type === 'wand'
                  ? t('werkzeuge.auswahl.wandpunkt')
                  : objekt.type === 'bodenplatte'
                    ? t('werkzeuge.auswahl.plattenpunkt')
                    : t('werkzeuge.auswahl.polylinienpunkt'),
              ),
            )
          }
        }
        formPunktDrag = null
        ctx.requestOverlayRedraw()
        return
      }
      if (oeffnungDrag) {
        const zugPx = Math.hypot(
          info.screen.x - oeffnungDrag.startScreen.x,
          info.screen.y - oeffnungDrag.startScreen.y,
        )
        if (zugPx >= MINDEST_ZUG_PX) {
          const blatt = aktuellesBlatt(ctx)
          const wand = blatt?.objekte.find(
            (o): o is WandObjekt => o.type === 'wand' && o.id === oeffnungDrag!.wandId,
          )
          const treffer = wand ? naechsterPunktAufPfad(wand.punkte, oeffnungDrag.ziel) : null
          const geometrie =
            wand && treffer ? ermittleOeffnungsGeometrie(wand, { t: treffer.t }) : null
          if (treffer && geometrie) {
            ctx.commands.execute(
              erzeugeObjektAktualisierenCommand(
                ctx.doc,
                ctx.aktivesBlattId(),
                oeffnungDrag.objektId,
                { t: treffer.t, ...geometrie },
                t('werkzeuge.auswahl.positionAufWand'),
              ),
            )
          }
        }
        oeffnungDrag = null
        ctx.requestOverlayRedraw()
        return
      }
      if (bemassungsreiheDrag) {
        const zug = bemassungsreiheDrag
        const zugPx = Math.hypot(
          info.screen.x - zug.startScreen.x,
          info.screen.y - zug.startScreen.y,
        )
        const objekt = aktuellesBlatt(ctx)?.objekte.find((o) => o.id === zug.objektId)
        if (zugPx >= MINDEST_ZUG_PX && objekt?.type === 'bemassungsreihe') {
          const geaendert = wendeBemassungsreiheGriffAn(objekt, zug.griff, info.world)
          ctx.commands.execute(
            erzeugeObjektAktualisierenCommand(
              ctx.doc,
              ctx.aktivesBlattId(),
              objekt.id,
              { punkte: geaendert.punkte, versatz: geaendert.versatz },
              t(
                zug.griff.art === 'punkt'
                  ? 'werkzeuge.auswahl.messpunkt'
                  : 'werkzeuge.auswahl.masslinie',
              ),
            ),
          )
        }
        bemassungsreiheDrag = null
        ctx.requestOverlayRedraw()
        return
      }
      if (pfadEndeDrag) {
        const zugPx = Math.hypot(
          info.screen.x - pfadEndeDrag.startScreen.x,
          info.screen.y - pfadEndeDrag.startScreen.y,
        )
        if (zugPx >= MINDEST_ZUG_PX) {
          const blatt = aktuellesBlatt(ctx)
          const objekt = blatt?.objekte.find(
            (o): o is TrunkObjekt => o.id === pfadEndeDrag!.objektId && o.type === 'trunk',
          )
          if (objekt && pfadEndeDrag.schachtZiel) {
            const { endeIndex, schachtZiel, hindernisse } = pfadEndeDrag
            const zielWelt = info.world
            const blattId = ctx.aktivesBlattId()
            pfadEndeDrag = null
            ctx.oeffneSchachtAnschlussDialog(
              {
                blattId,
                schachtId: schachtZiel.schachtId,
                art: 'trunk',
                objektId: objekt.id,
              },
              (ergebnis) => {
                if (ergebnis?.art !== 'strang') {
                  verschiebeTrunkEndeFrei(ctx, objekt, endeIndex, hindernisse, zielWelt)
                  ctx.requestOverlayRedraw()
                  return
                }
                const { strang } = ergebnis
                const benennung = {
                  blattId,
                  schachtId: schachtZiel.schachtId,
                  strang,
                  name: ergebnis.name,
                }
                const anschliessen = (wahl: AusfuehrungsWahl | null) => {
                  if (!wahl) {
                    ctx.setStatus(t('werkzeuge.auswahl.nichtAngeschlossen'))
                    ctx.requestOverlayRedraw()
                    return
                  }
                  try {
                    const command = erzeugeSchachtTrunkAnschlussCommand(
                      ctx.doc,
                      blattId,
                      objekt.id,
                      endeIndex,
                      schachtZiel.schachtId,
                      strang,
                      t('werkzeuge.trunk.anSchacht'),
                      ctx.routingSettings(),
                    )
                    const mitName = mitStrangBenennung(ctx.doc, command, [benennung])
                    ctx.commands.push(gleicheKetteAn(ctx.doc, blattId, objekt.id, wahl, mitName))
                    ctx.setStatus(
                      t('werkzeuge.trunk.anStrang', {
                        titel: strangTitelAmSchacht(ctx.doc, benennung),
                      }),
                    )
                  } catch (fehler) {
                    ctx.setStatus(
                      fehler instanceof Error
                        ? fehler.message
                        : t('werkzeuge.trunk.anschlussNicht'),
                    )
                  }
                  ctx.requestOverlayRedraw()
                }
                const vorhanden = trunkAmStrang(
                  ctx.doc.getZeichnung(),
                  blattId,
                  schachtZiel.schachtId,
                  strang,
                  objekt.id,
                )
                if (!vorhanden) anschliessen(ausfuehrungVon(objekt))
                else
                  klaereAusfuehrung(
                    (optionen) => ctx.oeffneBestaetigung(optionen),
                    { name: vorhanden.trunk.name, trunk: vorhanden.trunk },
                    { name: objekt.name, trunk: objekt },
                    anschliessen,
                  )
              },
            )
            ctx.requestOverlayRedraw()
            return
          }
          if (objekt && pfadEndeDrag.ablageZiel) {
            const { endeIndex, ablageZiel, hindernisse } = pfadEndeDrag
            const zielWelt = info.world
            const zielName =
              blatt?.objekte.find(
                (o): o is TrunkObjekt => o.type === 'trunk' && o.id === ablageZiel.trunkId,
              )?.name ?? t('werkzeuge.trunk.andererTrunk')
            const endeText = t('werkzeuge.trunk.gezogenesEnde')
            frageTrunkVerbindung(ctx, ablageZiel, zielName, endeText, (bestaetigt) => {
              if (bestaetigt) {
                fuehreTrunkAblageAus(ctx, objekt, endeIndex, ablageZiel, hindernisse)
              } else {
                verschiebeTrunkEndeFrei(ctx, objekt, endeIndex, hindernisse, zielWelt)
              }
              ctx.requestOverlayRedraw()
            })
            pfadEndeDrag = null
            ctx.requestOverlayRedraw()
            return
          }
          if (objekt) {
            verschiebeTrunkEndeFrei(
              ctx,
              objekt,
              pfadEndeDrag.endeIndex,
              pfadEndeDrag.hindernisse,
              info.world,
            )
          }
        }
        pfadEndeDrag = null
        ctx.requestOverlayRedraw()
        return
      }

      if (rechteckAuswahl) {
        const zugPx = Math.hypot(
          info.screen.x - rechteckAuswahl.startScreen.x,
          info.screen.y - rechteckAuswahl.startScreen.y,
        )
        if (zugPx < MINDEST_ZUG_PX) {
          if (!rechteckAuswahl.additiv) ctx.setAuswahl([])
        } else {
          const blatt = aktuellesBlatt(ctx)
          if (blatt) {
            const treffer = ermittleObjekteImAuswahlRechteck(
              sichtbareObjekteAufBlatt(blatt),
              rechteckAuswahl.startRaw,
              info.raw,
              tabellenKontextVon(ctx),
            )
            ctx.setAuswahl(
              rechteckAuswahl.additiv
                ? Array.from(new Set([...ctx.getAuswahl(), ...treffer]))
                : treffer,
            )
          }
        }
        rechteckAuswahl = null
        ctx.requestOverlayRedraw()
        return
      }

      if (gruppenDrag) {
        const zugPx = ctx.view.laengeToScreen(
          Math.hypot(gruppenDrag.aktuellesDelta.x, gruppenDrag.aktuellesDelta.y),
        )
        if (zugPx >= MINDEST_ZUG_PX) {
          const blatt = aktuellesBlatt(ctx)
          if (blatt) {
            const delta = gruppenDrag.aktuellesDelta
            const komponentenNeuePositionen = new Map<string, Point>()
            for (const id of gruppenDrag.komponentenIds) {
              const original = blatt.objekte.find((o) => o.id === id)
              if (original && original.type === 'komponente') {
                komponentenNeuePositionen.set(id, {
                  x: original.position.x + delta.x,
                  y: original.position.y + delta.y,
                })
              }
            }
            const sonstigeVerschiebungen = new Map<string, Point>()
            for (const id of gruppenDrag.objektIds) {
              if (!gruppenDrag.komponentenIds.has(id)) sonstigeVerschiebungen.set(id, delta)
            }
            let komponentenPatches: Map<string, Partial<KomponentenObjekt>> | undefined
            let label = t(
              gruppenDrag.objektIds.size > 1
                ? 'werkzeuge.auswahl.objekteVerschieben'
                : 'werkzeuge.auswahl.objektVerschieben',
            )
            if (gruppenDrag.magnetModulId) {
              const modul = blatt.objekte.find((o) => o.id === gruppenDrag!.magnetModulId)
              const ziel = gruppenDrag.magnetZiel
              if (modul?.type === 'komponente') {
                if (ziel) {
                  komponentenPatches = new Map([
                    [
                      modul.id,
                      {
                        position: ziel.punkt,
                        drehung: ziel.drehung,
                        groesseWelt: ziel.slotGroesse,
                        breiteWelt: undefined,
                        hoehenFaktor: undefined,
                        traegerId: ziel.traegerId,
                        slotIndex: ziel.slotIndex,
                      },
                    ],
                  ])
                  label = t('werkzeuge.auswahl.modulAufsetzen')
                } else if (istAufgesetztesModul(modul) && !gruppenDrag.wand) {
                  komponentenPatches = new Map([
                    [modul.id, { traegerId: undefined, slotIndex: undefined }],
                  ])
                  label = t('werkzeuge.auswahl.modulAbziehen')
                }
              }
            }
            let nachbearbeiten: ((objekte: Objekt[]) => Objekt[]) | undefined
            const wand = gruppenDrag.wand
            if (!komponentenPatches && wand) {
              komponentenPatches = wand.zustaende
              for (const [id, zustand] of wand.zustaende) {
                if (zustand.position) komponentenNeuePositionen.set(id, zustand.position)
              }
              label = wand.label
              nachbearbeiten = (objekte) => wendeNachbarnAn(objekte, wand.nachbarn)
            }
            const bauteil = einschleifbaresBauteil(ctx, gruppenDrag)
            let eingeschleift = 0
            if (bauteil && !komponentenPatches && !nachbearbeiten) {
              nachbearbeiten = (objekte) => {
                const ergebnis = schleifeEin(objekte, bauteil.id, fremdeLinien(objekte, bauteil.id))
                eingeschleift = ergebnis.anzahl
                return ergebnis.objekte
              }
            }
            const { command, fehlgeschlageneLeitungenAnzahl } =
              erzeugeVerschiebungMitRerouteCommand(
                ctx.doc,
                ctx.aktivesBlattId(),
                komponentenNeuePositionen,
                sonstigeVerschiebungen,
                ctx.routingSettings(),
                label,
                komponentenPatches,
                nachbearbeiten,
              )
            ctx.commands.execute(command)
            if (eingeschleift > 0)
              ctx.setStatus(t('werkzeuge.auswahl.eingeschleift', { n: eingeschleift }))
            if (fehlgeschlageneLeitungenAnzahl > 0) {
              ctx.setStatus(
                t('werkzeuge.auswahl.angeschlossenNichtGeroutet', {
                  n: fehlgeschlageneLeitungenAnzahl,
                }),
              )
            }
          }
        }
        gruppenDrag = null
        ctx.requestOverlayRedraw()
        return
      }
    },

    onKeyDown(e: KeyboardEvent, ctx: ToolContext) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const auswahl = ctx.getAuswahl()
        if (auswahl.length === 0) return
        e.preventDefault()

        if (
          auswahl.length === 1 &&
          ausgewaehlterSchaltKnick !== null &&
          ausgewaehlterSchaltKnick.objektId === auswahl[0]
        ) {
          const { objektId, index } = ausgewaehlterSchaltKnick
          ausgewaehlterSchaltKnick = null
          const objekt = aktuellesBlatt(ctx)?.objekte.find((o) => o.id === objektId)
          if (objekt?.type === 'schaltverbindung') {
            const wegpunkte = knickEntfernen(objekt.wegpunkte, index)
            ctx.commands.execute(
              erzeugeObjektAktualisierenCommand(
                ctx.doc,
                ctx.aktivesBlattId(),
                objektId,
                { wegpunkte, autoRouting: undefined, anordnung: undefined },
                t('werkzeuge.auswahl.knickEntfernen'),
              ),
            )
          }
          ctx.requestOverlayRedraw()
          return
        }

        if (auswahl.length === 1 && ausgewaehlterGriff !== null) {
          const blatt = aktuellesBlatt(ctx)
          const objekt = blatt?.objekte.find((o) => o.id === auswahl[0])
          const griff = ausgewaehlterGriff
          ausgewaehlterGriff = null
          if (blatt && objekt && (objekt.type === 'leitung' || objekt.type === 'trunk')) {
            const pfad = pfadSegmenteVon(objekt)[griff.segmentArrIndex]
            const frei = objekt.type === 'leitung' && objekt.autoRoutingAus
            const neuerPfad = frei
              ? vorschauWegpunktEntfernenFrei(pfad, griff.lokalerIndex)
              : vorschauWegpunktEntfernen(
                  pfad,
                  routingHindernisse(blatt.objekte, ctx.routingSettings().sicherheitsabstandMeter),
                  routingFuerPfad(ctx, objekt),
                  griff.lokalerIndex,
                )
            if (neuerPfad) {
              const { command, fehlgeschlageneLeitungenAnzahl } = erzeugeGriffUpdateCommand(
                ctx,
                objekt,
                griff.segmentArrIndex,
                neuerPfad,
                t('werkzeuge.auswahl.wegpunktEntfernen'),
              )
              ctx.commands.execute(command)
              if (fehlgeschlageneLeitungenAnzahl > 0) {
                ctx.setStatus(meldungFehlgeschlageneLeitungen(fehlgeschlageneLeitungenAnzahl))
              }
              if (objekt.type === 'leitung') frageAutoRoutingAusschalten(ctx, objekt)
            } else {
              ctx.setStatus(t('werkzeuge.auswahl.wegpunktNichtEntfernt'))
            }
            ctx.requestOverlayRedraw()
            return
          }
        }

        if (
          auswahl.length === 1 &&
          ausgewaehlterFormPunkt !== null &&
          ausgewaehlterFormPunkt.objektId === auswahl[0]
        ) {
          const blatt = aktuellesBlatt(ctx)
          const objekt = blatt?.objekte.find((o) => o.id === auswahl[0])
          const { punktIndex } = ausgewaehlterFormPunkt
          ausgewaehlterFormPunkt = null
          if (blatt && objekt && objekt.type === 'wand' && istWandEndpunkt(objekt, punktIndex)) {
            const vereint = vereinigeWandSegmente(
              blatt.objekte,
              objekt.punkte[punktIndex],
              objekt.id,
            )
            if (vereint) {
              ctx.commands.execute(
                erzeugeObjektAendernCommand(
                  ctx.doc,
                  ctx.aktivesBlattId(),
                  t('werkzeuge.auswahl.wandecke'),
                  () => nachgefuehrteOeffnungen(vereint),
                ),
              )
            } else {
              ctx.setStatus(t('werkzeuge.auswahl.eckpunktNicht'))
            }
            ctx.requestOverlayRedraw()
            return
          }
          if (blatt && objekt && istFormObjekt(objekt)) {
            const neuePunkte = entferneFormPunkt(
              objekt.punkte,
              punktIndex,
              mindestFormPunktAnzahl(objekt),
            )
            if (neuePunkte) {
              ctx.commands.execute(
                erzeugeFormPunkteCommand(
                  ctx,
                  objekt,
                  neuePunkte,
                  t('werkzeuge.auswahl.punktEntfernen'),
                ),
              )
            } else {
              ctx.setStatus(t('werkzeuge.auswahl.zuWenigePunkte'))
            }
            ctx.requestOverlayRedraw()
            return
          }
        }

        const blattId = ctx.aktivesBlattId()
        const blatt = aktuellesBlatt(ctx)
        const loeschbareAuswahl = blatt
          ? auswahl.filter((id) => {
              const objekt = blatt.objekte.find((o) => o.id === id)
              return objekt && istBearbeitbar(objekt, blatt.ebenen)
            })
          : auswahl
        if (loeschbareAuswahl.length === 0) {
          ctx.setStatus(t('werkzeuge.auswahl.gesperrt'))
          return
        }
        frageLoeschung(
          ctx.oeffneBestaetigung,
          ctx.doc,
          blattId,
          loeschbareAuswahl,
          (bestaetigt) => {
            if (!bestaetigt) return
            ctx.commands.execute(
              erzeugeObjekteEntfernenCommand(
                ctx.doc,
                blattId,
                loeschbareAuswahl,
                loeschbareAuswahl.length > 1
                  ? t('werkzeuge.auswahl.objekteLoeschen', { n: loeschbareAuswahl.length })
                  : t('werkzeuge.auswahl.objektLoeschen'),
              ),
            )
            ctx.setAuswahl(auswahl.filter((id) => !loeschbareAuswahl.includes(id)))
            ctx.requestOverlayRedraw()
          },
        )
        gruppenDrag = null
        rechteckAuswahl = null
        zuruecksetzenPfadBearbeitung()
        zuruecksetzenFormBearbeitung()
        return
      }

      if (e.key === ' ') {
        const komponentenIds = drehbareKomponentenIds(ctx)
        if (komponentenIds.length === 0) return
        e.preventDefault()
        const blatt = aktuellesBlatt(ctx)
        const anWand = new Set(
          komponentenIds.filter((id) => {
            const o = blatt?.objekte.find((x) => x.id === id)
            return o?.type === 'komponente' && o.wandstelle !== undefined
          }),
        )
        const frei = komponentenIds.filter((id) => !anWand.has(id))
        if (frei.length > 0) {
          const { command, fehlgeschlageneLeitungenAnzahl } = erzeugeKomponentenDrehenCommand(
            ctx.doc,
            ctx.aktivesBlattId(),
            frei,
            Math.PI / 2,
            ctx.routingSettings(),
            t(
              frei.length > 1
                ? 'werkzeuge.auswahl.komponentenDrehen'
                : 'werkzeuge.auswahl.komponenteDrehen',
            ),
          )
          ctx.commands.execute(command)
          if (fehlgeschlageneLeitungenAnzahl > 0) {
            ctx.setStatus(meldungFehlgeschlageneLeitungen(fehlgeschlageneLeitungenAnzahl))
          }
        }
        if (anWand.size > 0) {
          ctx.commands.execute(
            erzeugeWandAenderungCommand(
              ctx.doc,
              ctx.aktivesBlattId(),
              t('werkzeuge.auswahl.kombinationDrehen'),
              (objekte) => dreheKombinationen(objekte, anWand),
              ctx.routingSettings(),
            ),
          )
        }
        ctx.requestOverlayRedraw()
        return
      }

      const pfeilDelta = PFEILTASTEN_DELTA[e.key]
      if (pfeilDelta) {
        const blatt = aktuellesBlatt(ctx)
        const komponentenIds = blatt
          ? ctx.getAuswahl().filter((id) => {
              const objekt = blatt.objekte.find((o) => o.id === id)
              return objekt?.type === 'komponente' && istBearbeitbar(objekt, blatt.ebenen)
            })
          : []
        if (komponentenIds.length === 0) return
        e.preventDefault()
        const schritte = ctx.pfeiltastenSchritte()
        const schritt = e.shiftKey ? schritte.grossMeter : schritte.kleinMeter
        const komponentenNeuePositionen = new Map<string, Point>()
        for (const id of komponentenIds) {
          const original = blatt!.objekte.find((o) => o.id === id)
          if (original?.type === 'komponente') {
            komponentenNeuePositionen.set(id, {
              x: original.position.x + pfeilDelta.x * schritt,
              y: original.position.y + pfeilDelta.y * schritt,
            })
          }
        }
        const { command, fehlgeschlageneLeitungenAnzahl } = erzeugeVerschiebungMitRerouteCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          komponentenNeuePositionen,
          new Map(),
          ctx.routingSettings(),
          t(
            komponentenIds.length > 1
              ? 'werkzeuge.auswahl.komponentenVerschieben'
              : 'werkzeuge.auswahl.komponenteVerschieben',
          ),
        )
        ctx.commands.execute(command)
        if (fehlgeschlageneLeitungenAnzahl > 0) {
          ctx.setStatus(meldungFehlgeschlageneLeitungen(fehlgeschlageneLeitungenAnzahl))
        }
        ctx.requestOverlayRedraw()
      }
    },

    tastenAktionen(ctx) {
      const auswahl = ctx.getAuswahl()
      return wirksam(
        drehbareKomponentenIds(ctx).length > 0 && leertaste(t('werkzeuge.tasten.drehen90')),
        auswahl.length > 0 &&
          entf(
            ausgewaehlterGriff || ausgewaehlterFormPunkt
              ? t('werkzeuge.auswahl.punktEntfernen')
              : t('werkzeuge.auswahl.loeschen'),
          ),
      )
    },

    drawOverlay(g: CanvasRenderingContext2D, ctx: ToolContext) {
      hinweisAktualisieren(ctx)
      const blatt = aktuellesBlatt(ctx)
      if (!blatt) return
      const auswahl = ctx.getAuswahl()
      if (hoverId && !auswahl.includes(hoverId)) {
        const hoverObjekt = blatt.objekte.find((o) => o.id === hoverId)
        if (hoverObjekt) zeichneHoverHighlight(g, ctx.view, hoverObjekt, undefined, blatt.objekte)
      }

      if (transformDrag) {
        const teilnehmerObjekte = blatt.objekte.filter((o) => transformDrag!.objektIds.has(o.id))
        const transformierteObjekte = teilnehmerObjekte.map((o) =>
          wendeTransformationAn(o, transformDrag!.zentrum, transformDrag!.aktuelleTransformation),
        )
        const modulZustaende = new Map<string, Partial<KomponentenObjekt>>()
        for (const o of transformierteObjekte) {
          if (o.type === 'komponente') {
            modulZustaende.set(o.id, {
              position: o.position,
              drehung: o.drehung,
              groesseWelt: o.groesseWelt,
              breiteWelt: o.breiteWelt,
            })
          }
        }
        expandiereTraegerMitModulen(blatt.objekte, modulZustaende)
        for (const [id, zustand] of modulZustaende) {
          if (transformDrag.objektIds.has(id)) continue
          const original = blatt.objekte.find((o) => o.id === id)
          if (original?.type === 'komponente') {
            transformierteObjekte.push({ ...original, ...zustand })
          }
        }
        const transformKontext = vorschauRenderKontext(ctx, blatt.objekte, transformierteObjekte)
        for (const o of transformierteObjekte) zeichneObjekt(g, ctx.view, o, transformKontext)
        if (transformierteObjekte.length > 0)
          zeichneAuswahlHighlight(g, ctx.view, transformierteObjekte, undefined, blatt.objekte)

        if (transformDrag.komponentenIds.size > 0 && ctx.leitungenErstNachLoslassen?.()) {
          const bewegt = new Map<string, KomponentenObjekt>()
          for (const o of transformierteObjekte) if (o.type === 'komponente') bewegt.set(o.id, o)
          zeichneErstNachLoslassen(g, ctx, blatt.objekte, bewegt)
        } else if (transformDrag.komponentenIds.size > 0) {
          const vorschau = berechneTransformationLeitungenVorschau(
            blatt.objekte,
            transformDrag.objektIds,
            transformDrag.zentrum,
            transformDrag.aktuelleTransformation,
            ctx.routingSettings(),
            blatt.geschoss,
          )
          const betroffen = betroffeneLeitungen(blatt.objekte, transformDrag.komponentenIds)
          const schaltVorschau = berechneTransformationSchaltverbindungenVorschau(
            blatt.objekte,
            transformDrag.objektIds,
            transformDrag.zentrum,
            transformDrag.aktuelleTransformation,
            ctx.routingSettings(),
          )
          g.save()
          g.strokeStyle = LEITUNG_VORSCHAU_FARBE_GUELTIG
          g.lineWidth = 2
          for (const leitung of betroffen) {
            const pfadSegmente = vorschau.get(leitung.id) ?? leitung.pfadSegmente
            for (const segment of pfadSegmente) {
              if (segment.length < 2) continue
              const punkte = segment.map((p) => ctx.view.worldToScreen(p))
              g.beginPath()
              g.moveTo(punkte[0].x, punkte[0].y)
              for (const p of punkte.slice(1)) g.lineTo(p.x, p.y)
              g.stroke()
            }
          }
          zeichneVerlaeufe(g, ctx, schaltVorschau)
          g.restore()
        }
        return
      }

      if (trunkDurchgangDrag) {
        const trunk = blatt.objekte.find(
          (o): o is TrunkObjekt => o.id === trunkDurchgangDrag!.trunkId && o.type === 'trunk',
        )
        const leitung = blatt.objekte.find(
          (o): o is LeitungsObjekt =>
            o.id === trunkDurchgangDrag!.leitungId && o.type === 'leitung',
        )
        if (trunk && leitung) {
          const neuerT =
            naechsterPunktAufPfad(trunk.wegpunkte, trunkDurchgangDrag.zielWorld)?.t ?? 0
          const hindernisse = routingHindernisse(
            blatt.objekte,
            ctx.routingSettings().sicherheitsabstandMeter,
          )
          const ergebnis = vorschauTrunkDurchgangVerschieben(
            leitung,
            trunk,
            blatt.objekte,
            hindernisse,
            routingFuerPfad(ctx, leitung),
            trunkDurchgangDrag.art,
            neuerT,
          )
          const durchgangIndex = leitung.trunkDurchgaenge.findIndex((d) => d.trunkId === trunk.id)
          const segmentIndex = durchgangIndex + (trunkDurchgangDrag.art === 'eintritt' ? 0 : 1)
          const basisSegmente = abgeleitetePfadSegmente(leitung, blatt.objekte)
          const pfad = ergebnis ? ergebnis.pfadSegmente[segmentIndex] : basisSegmente[segmentIndex]
          if (pfad && pfad.length >= 2) {
            const punkte = pfad.map((p) => ctx.view.worldToScreen(p))
            g.save()
            g.setLineDash(ergebnis ? [] : [5, 4])
            g.strokeStyle = ergebnis
              ? LEITUNG_VORSCHAU_FARBE_GUELTIG
              : LEITUNG_VORSCHAU_FARBE_KEIN_PFAD
            g.lineWidth = 2
            g.beginPath()
            g.moveTo(punkte[0].x, punkte[0].y)
            for (const p of punkte.slice(1)) g.lineTo(p.x, p.y)
            g.stroke()
            g.restore()
          }
          const snapPunkt = ctx.view.worldToScreen(punktAufPfad(trunk.wegpunkte, neuerT))
          g.save()
          g.fillStyle = ergebnis ? LEITUNG_VORSCHAU_FARBE_GUELTIG : LEITUNG_VORSCHAU_FARBE_KEIN_PFAD
          g.beginPath()
          g.arc(snapPunkt.x, snapPunkt.y, 6, 0, Math.PI * 2)
          g.fill()
          g.strokeStyle = '#ffffff'
          g.lineWidth = 1.5
          g.stroke()
          g.restore()
        }
        return
      }

      if (bezeichnerDrag) {
        const von = ctx.view.worldToScreen(bezeichnerDrag.ankerWelt)
        const nach = ctx.view.worldToScreen(
          add(bezeichnerDrag.ankerWelt, bezeichnerDrag.aktuellerVersatz),
        )
        zeichneBezeichnerLeitlinie(g, von, nach)
        g.save()
        g.fillStyle = '#2f7dd1'
        g.beginPath()
        g.arc(nach.x, nach.y, 6, 0, Math.PI * 2)
        g.fill()
        g.strokeStyle = '#ffffff'
        g.lineWidth = 1.5
        g.stroke()
        g.restore()
        return
      }

      if (pfadDrag) {
        const objekt = blatt.objekte.find((o) => o.id === pfadDrag!.objektId)
        if (objekt && (objekt.type === 'leitung' || objekt.type === 'trunk')) {
          const pfad = pfadSegmenteVon(objekt)[pfadDrag.segmentArrIndex]
          const neuerPfad =
            objekt.type === 'leitung' && objekt.autoRoutingAus
              ? vorschauSegmentVerschiebenFrei(pfad, pfadDrag.lokalerSegmentIndex, pfadDrag.ziel)
              : vorschauSegmentVerschieben(
                  pfad,
                  pfadDrag.hindernisse,
                  routingFuerPfad(ctx, objekt),
                  pfadDrag.lokalerSegmentIndex,
                  pfadDrag.ziel,
                )
          if (neuerPfad) pfadDrag.vorschau = neuerPfad
          const punkte = (pfadDrag.vorschau ?? pfad).map((p) => ctx.view.worldToScreen(p))
          g.save()
          g.setLineDash(neuerPfad ? [] : [5, 4])
          g.strokeStyle = neuerPfad
            ? LEITUNG_VORSCHAU_FARBE_GUELTIG
            : LEITUNG_VORSCHAU_FARBE_KEIN_PFAD
          g.lineWidth = objekt.type === 'trunk' ? objekt.strichstaerke : 2
          g.beginPath()
          g.moveTo(punkte[0].x, punkte[0].y)
          for (const p of punkte.slice(1)) g.lineTo(p.x, p.y)
          g.stroke()
          g.restore()
        }
        return
      }

      if (schaltDrag) {
        const objekt = blatt.objekte.find((o) => o.id === schaltDrag!.objektId)
        if (objekt?.type === 'schaltverbindung') {
          const { objekt: neu, ziel } = schaltGriffErgebnis(ctx, blatt.objekte, objekt, schaltDrag)
          const punkte = neu.wegpunkte.map((p) => ctx.view.worldToScreen(p))
          g.save()
          g.strokeStyle = LEITUNG_VORSCHAU_FARBE_GUELTIG
          g.lineWidth = 2
          g.beginPath()
          g.moveTo(punkte[0].x, punkte[0].y)
          for (const p of punkte.slice(1)) g.lineTo(p.x, p.y)
          g.stroke()
          if (ziel) {
            const z = ctx.view.worldToScreen(ziel)
            g.beginPath()
            g.arc(z.x, z.y, 6, 0, Math.PI * 2)
            g.stroke()
          }
          g.restore()
        }
        return
      }

      if (formPunktDrag) {
        const objekt = blatt.objekte.find((o) => o.id === formPunktDrag!.objektId)
        if (objekt && istFormObjekt(objekt)) {
          const achsen =
            objekt.type === 'wand' && istWandEndpunkt(objekt, formPunktDrag.punktIndex)
              ? wandEndenAm(blatt.objekte, objekt.punkte[formPunktDrag.punktIndex]).map((e) => {
                  const punkte = [...e.wand.punkte]
                  punkte[e.istStart ? 0 : punkte.length - 1] = formPunktDrag!.ziel
                  return punkte
                })
              : [verschiebeFormPunkt(objekt.punkte, formPunktDrag.punktIndex, formPunktDrag.ziel)]
          g.save()
          g.strokeStyle = LEITUNG_VORSCHAU_FARBE_GUELTIG
          g.lineWidth = 2
          for (const achse of achsen) {
            const punkte = achse.map((p) => ctx.view.worldToScreen(p))
            g.beginPath()
            g.moveTo(punkte[0].x, punkte[0].y)
            for (const p of punkte.slice(1)) g.lineTo(p.x, p.y)
            if (istGeschlossenesFormObjekt(objekt)) g.closePath()
            g.stroke()
          }
          g.restore()
        }
        return
      }

      if (oeffnungDrag) {
        const wand = blatt.objekte.find(
          (o): o is WandObjekt => o.type === 'wand' && o.id === oeffnungDrag!.wandId,
        )
        const objekt = blatt.objekte.find((o) => o.id === oeffnungDrag!.objektId)
        const treffer = wand ? naechsterPunktAufPfad(wand.punkte, oeffnungDrag.ziel) : null
        if (wand && objekt && treffer) {
          const geometrie = ermittleOeffnungsGeometrie(wand, { t: treffer.t })
          if (geometrie) {
            const vorschau = { ...objekt, ...geometrie } as Objekt
            g.save()
            g.globalAlpha = 0.7
            zeichneObjekt(g, ctx.view, vorschau, ctx.komponentenRenderKontext())
            g.restore()

            const eckpunkte = ermittleBenachbarteEckpunkte(wand, treffer.t)
            if (eckpunkte) {
              zeichneAbstandslinie(
                g,
                ctx.view,
                geometrie.position,
                eckpunkte.vorher.punkt,
                eckpunkte.vorher.abstandMeter,
              )
              zeichneAbstandslinie(
                g,
                ctx.view,
                geometrie.position,
                eckpunkte.nachher.punkt,
                eckpunkte.nachher.abstandMeter,
              )
            }
          }
        }
        return
      }

      if (bemassungsreiheDrag) {
        const zug = bemassungsreiheDrag
        const objekt = blatt.objekte.find((o) => o.id === zug.objektId)
        if (objekt?.type === 'bemassungsreihe') {
          const vorschau = wendeBemassungsreiheGriffAn(objekt, zug.griff, zug.ziel)
          g.save()
          g.globalAlpha = 0.7
          zeichneObjekt(g, ctx.view, vorschau)
          g.restore()
          zeichneBemassungsreiheGriffe(g, ctx.view, vorschau)
        }
        return
      }

      if (pfadEndeDrag) {
        const objekt = blatt.objekte.find(
          (o): o is TrunkObjekt => o.id === pfadEndeDrag!.objektId && o.type === 'trunk',
        )
        if (objekt) {
          const neuerPfad = vorschauEndeVerschieben(
            objekt.wegpunkte,
            pfadEndeDrag.hindernisse,
            ctx.routingSettings(),
            pfadEndeDrag.endeIndex,
            pfadEndeDrag.ziel,
          )
          if (neuerPfad) pfadEndeDrag.vorschau = neuerPfad
          const punkte = (pfadEndeDrag.vorschau ?? objekt.wegpunkte).map((p) =>
            ctx.view.worldToScreen(p),
          )
          g.save()
          g.setLineDash(neuerPfad ? [] : [5, 4])
          g.strokeStyle = neuerPfad
            ? LEITUNG_VORSCHAU_FARBE_GUELTIG
            : LEITUNG_VORSCHAU_FARBE_KEIN_PFAD
          g.lineWidth = objekt.strichstaerke
          g.beginPath()
          g.moveTo(punkte[0].x, punkte[0].y)
          for (const p of punkte.slice(1)) g.lineTo(p.x, p.y)
          g.stroke()
          g.restore()

          const ablageZiel = pfadEndeDrag.ablageZiel
          if (ablageZiel) {
            const zielTrunk = blatt.objekte.find(
              (o): o is TrunkObjekt => o.type === 'trunk' && o.id === ablageZiel.trunkId,
            )
            const weltPunkt =
              ablageZiel.art === 'pfad'
                ? ablageZiel.punkt
                : zielTrunk &&
                  zielTrunk.wegpunkte[
                    ablageZiel.endeIndex === 0 ? 0 : zielTrunk.wegpunkte.length - 1
                  ]
            if (weltPunkt) {
              const mitte = ctx.view.worldToScreen(weltPunkt)
              g.save()
              g.strokeStyle = LEITUNG_VORSCHAU_FARBE_GUELTIG
              g.fillStyle = LEITUNG_VORSCHAU_FARBE_GUELTIG
              g.lineWidth = 2
              g.beginPath()
              g.arc(mitte.x, mitte.y, TRUNK_ABLAGE_MARKER_RADIUS_PX, 0, Math.PI * 2)
              if (ablageZiel.art === 'ende') g.fill()
              else g.stroke()
              g.restore()
            }
          }
        }
        return
      }

      if (rechteckAuswahl) {
        const treffer = ermittleObjekteImAuswahlRechteck(
          sichtbareObjekteAufBlatt(blatt),
          rechteckAuswahl.startRaw,
          rechteckAuswahl.aktuellRaw,
        )
        const alleTrefferIds = rechteckAuswahl.additiv
          ? Array.from(new Set([...auswahl, ...treffer]))
          : treffer
        const trefferObjekte = blatt.objekte.filter((o) => alleTrefferIds.includes(o.id))
        if (trefferObjekte.length > 0)
          zeichneAuswahlHighlight(g, ctx.view, trefferObjekte, undefined, blatt.objekte)
        zeichneAuswahlrechteck(g, ctx.view, rechteckAuswahl.startRaw, rechteckAuswahl.aktuellRaw)
        return
      }

      if (gruppenDrag) {
        const delta = gruppenDrag.aktuellesDelta
        const bewegteObjekte = blatt.objekte.filter((o) => gruppenDrag!.objektIds.has(o.id))
        const vorschauZustaende = new Map<string, Partial<KomponentenObjekt>>()
        for (const id of gruppenDrag.komponentenIds) {
          const original = blatt.objekte.find((o) => o.id === id)
          if (original?.type === 'komponente') {
            vorschauZustaende.set(id, {
              position: { x: original.position.x + delta.x, y: original.position.y + delta.y },
            })
          }
        }
        if (gruppenDrag.magnetZiel && gruppenDrag.magnetModulId) {
          const ziel = gruppenDrag.magnetZiel
          zeichneSlotHighlight(g, ctx.view, ziel)
          vorschauZustaende.set(gruppenDrag.magnetModulId, {
            position: ziel.punkt,
            drehung: ziel.drehung,
            groesseWelt: ziel.slotGroesse,
            breiteWelt: undefined,
            hoehenFaktor: undefined,
          })
        }
        if (gruppenDrag.wand) {
          for (const [id, zustand] of gruppenDrag.wand.zustaende) {
            vorschauZustaende.set(id, { ...vorschauZustaende.get(id), ...zustand })
          }
        }
        expandiereTraegerMitModulen(
          blatt.objekte,
          vorschauZustaende,
          gruppenDrag.magnetModulId ? new Set([gruppenDrag.magnetModulId]) : undefined,
        )
        const verschobeneObjekte = bewegteObjekte.map((o) => {
          if (o.type === 'komponente') {
            const zustand = vorschauZustaende.get(o.id)
            if (zustand) return { ...o, ...zustand }
          }
          return verschiebeObjekt(o, delta)
        })
        for (const [id, zustand] of vorschauZustaende) {
          if (gruppenDrag.objektIds.has(id)) continue
          const original = blatt.objekte.find((o) => o.id === id)
          if (original?.type === 'komponente') {
            verschobeneObjekte.push({ ...original, ...zustand })
          }
        }
        const mitgezogeneNachbarn = vorschauWandNachbarn(blatt.objekte, verschobeneObjekte)
        const gezeichnet = [
          ...verschobeneObjekte.map((o) => mitgezogeneNachbarn.get(o.id) ?? o),
          ...[...mitgezogeneNachbarn.values()].filter((o) => !gruppenDrag!.objektIds.has(o.id)),
        ]
        const dragKontext = vorschauRenderKontext(ctx, blatt.objekte, gezeichnet)
        for (const o of gezeichnet) zeichneObjekt(g, ctx.view, o, dragKontext)
        if (verschobeneObjekte.length > 0)
          zeichneAuswahlHighlight(g, ctx.view, verschobeneObjekte, undefined, blatt.objekte)

        if (verschobeneObjekte.length === 1 && verschobeneObjekte[0].type === 'komponente') {
          const bewegteIds = new Set(verschobeneObjekte.map((o) => o.id))
          const bb = getBoundingBox(verschobeneObjekte[0])
          const abstaende = ermittleAbstaende(
            { x: (bb.min.x + bb.max.x) / 2, y: (bb.min.y + bb.max.y) / 2 },
            (bb.max.x - bb.min.x) / 2,
            (bb.max.y - bb.min.y) / 2,
            blatt.objekte.filter((o) => !bewegteIds.has(o.id)),
          )
          for (const abstand of abstaende) {
            zeichneAbstandslinie(
              g,
              ctx.view,
              abstand.vonPunkt,
              abstand.zuPunkt,
              abstand.entfernungMeter,
            )
          }
        }

        if (gruppenDrag.komponentenIds.size > 0 && ctx.leitungenErstNachLoslassen?.()) {
          const bewegt = new Map<string, KomponentenObjekt>()
          for (const id of gruppenDrag.komponentenIds) {
            const original = blatt.objekte.find((o) => o.id === id)
            if (original?.type !== 'komponente') continue
            const zustand = gruppenDrag.wand?.zustaende.get(id)
            bewegt.set(id, {
              ...original,
              ...zustand,
              position: zustand?.position ?? {
                x: original.position.x + delta.x,
                y: original.position.y + delta.y,
              },
            })
          }
          zeichneErstNachLoslassen(g, ctx, blatt.objekte, bewegt)
        } else if (gruppenDrag.komponentenIds.size > 0 || knotenImDrag(blatt.objekte).size > 0) {
          const schwelle = ctx.view.laengeToWorld(GRUPPENDRAG_REROUTE_SCHWELLE_PX)
          const letztesDelta = gruppenDrag.letzteRerouteDelta
          const bewegungGenug = !letztesDelta || distance(delta, letztesDelta) > schwelle
          if (bewegungGenug) {
            const komponentenNeuePositionen = new Map<string, Point>()
            for (const id of gruppenDrag.komponentenIds) {
              const original = blatt.objekte.find((o) => o.id === id)
              if (original && original.type === 'komponente') {
                komponentenNeuePositionen.set(
                  id,
                  gruppenDrag.wand?.zustaende.get(id)?.position ?? {
                    x: original.position.x + delta.x,
                    y: original.position.y + delta.y,
                  },
                )
              }
            }
            const positionsZustaende = new Map<string, Partial<KomponentenObjekt>>()
            for (const [id, position] of komponentenNeuePositionen) {
              positionsZustaende.set(id, { ...gruppenDrag.wand?.zustaende.get(id), position })
            }
            gruppenDrag.letzteRerouteVorschau = berechneGruppenRerouteMitZustand(
              blatt.objekte,
              positionsZustaende,
              ctx.routingSettings(),
              blatt.geschoss,
            )
            const knotenNeu = new Map<string, Point>()
            for (const k of knotenImDrag(blatt.objekte).values())
              knotenNeu.set(k.id, { x: k.position.x + delta.x, y: k.position.y + delta.y })
            gruppenDrag.letzteSchaltRerouteVorschau = berechneSchaltverbindungReroute(
              blatt.objekte,
              positionsZustaende,
              ctx.routingSettings(),
              gruppenDrag.objektIds,
              knotenNeu,
            )
            gruppenDrag.letzteRerouteDelta = delta
          }
          const betroffen = betroffeneLeitungen(blatt.objekte, gruppenDrag.komponentenIds)
          g.save()
          g.strokeStyle = LEITUNG_VORSCHAU_FARBE_GUELTIG
          g.lineWidth = 2
          for (const leitung of betroffen) {
            const pfadSegmente =
              gruppenDrag.letzteRerouteVorschau.get(leitung.id) ?? leitung.pfadSegmente
            for (const segment of pfadSegmente) {
              if (segment.length < 2) continue
              const punkte = segment.map((p) => ctx.view.worldToScreen(p))
              g.beginPath()
              g.moveTo(punkte[0].x, punkte[0].y)
              for (const p of punkte.slice(1)) g.lineTo(p.x, p.y)
              g.stroke()
            }
          }
          zeichneVerlaeufe(g, ctx, gruppenDrag.letzteSchaltRerouteVorschau)
          g.restore()
        }
        return
      }

      const ausgewaehlteObjekte = blatt.objekte.filter((o) => auswahl.includes(o.id))
      if (ausgewaehlteObjekte.length > 0) {
        zeichneAuswahlHighlight(g, ctx.view, ausgewaehlteObjekte, undefined, blatt.objekte)
      }
      const einzelObjekt = ausgewaehlteObjekte.length === 1 ? ausgewaehlteObjekte[0] : null
      if (einzelObjekt && (einzelObjekt.type === 'leitung' || einzelObjekt.type === 'trunk')) {
        zeichneLeitungsGriffe(
          g,
          ctx.view,
          pfadSegmenteVon(einzelObjekt),
          ausgewaehlterGriff,
          einzelObjekt.type === 'trunk',
        )
      } else if (einzelObjekt && einzelObjekt.type === 'schaltverbindung') {
        const knick =
          ausgewaehlterSchaltKnick?.objektId === einzelObjekt.id
            ? {
                art: 'wegpunkt' as const,
                segmentArrIndex: 0,
                lokalerIndex: ausgewaehlterSchaltKnick.index,
              }
            : null
        zeichneLeitungsGriffe(g, ctx.view, [einzelObjekt.wegpunkte], knick, true)
      } else if (einzelObjekt && istFormObjekt(einzelObjekt)) {
        const formGriffAuswahl: LeitungsGriffAuswahl | null =
          ausgewaehlterFormPunkt && ausgewaehlterFormPunkt.objektId === einzelObjekt.id
            ? {
                art: 'wegpunkt',
                segmentArrIndex: 0,
                lokalerIndex: ausgewaehlterFormPunkt.punktIndex,
              }
            : null
        zeichneLeitungsGriffe(g, ctx.view, [einzelObjekt.punkte], formGriffAuswahl, true)
      } else if (einzelObjekt && einzelObjekt.type === 'bemassungsreihe') {
        zeichneBemassungsreiheGriffe(g, ctx.view, einzelObjekt)
      } else {
        const rahmen = ermittleTransformRahmen(blatt.objekte, auswahl)
        if (rahmen) zeichneTransformGriffe(g, ctx.view, rahmen)
      }
    },

    liveNullpunkt() {
      return nullpunktDrag ? nullpunktDrag.ziel : null
    },
  }
}

function zeichneErstNachLoslassen(
  g: CanvasRenderingContext2D,
  ctx: ToolContext,
  objekte: readonly Objekt[],
  bewegt: ReadonlyMap<string, KomponentenObjekt>,
) {
  const neuerAnschluss = (objektId: string, index: number | undefined) => {
    const o = bewegt.get(objektId)
    return o && index !== undefined ? getDockpoints(o)[index] : undefined
  }
  const strich = (punkte: readonly Point[]) => {
    if (punkte.length < 2) return
    const bild = punkte.map((p) => ctx.view.worldToScreen(p))
    g.beginPath()
    g.moveTo(bild[0].x, bild[0].y)
    for (const p of bild.slice(1)) g.lineTo(p.x, p.y)
    g.stroke()
  }
  const verlaeufe: Point[][] = []
  const anschluesse: [Point, Point][] = []
  for (const o of objekte) {
    if (o.type === 'leitung') {
      const start =
        o.start.art === 'dock'
          ? neuerAnschluss(o.start.objektId, o.start.dockpunktIndex)
          : undefined
      const ziel =
        o.ziel.art === 'dock' ? neuerAnschluss(o.ziel.objektId, o.ziel.dockpunktIndex) : undefined
      if (!start && !ziel) continue
      verlaeufe.push(...o.pfadSegmente)
      const erster = o.pfadSegmente[0]?.[0]
      const letztes = o.pfadSegmente[o.pfadSegmente.length - 1]
      const letzter = letztes?.[letztes.length - 1]
      if (start && erster) anschluesse.push([erster, start])
      if (ziel && letzter) anschluesse.push([letzter, ziel])
    } else if (o.type === 'schaltverbindung') {
      const start =
        o.start.art === 'dock'
          ? neuerAnschluss(o.start.objektId, o.start.dockpunktIndizes[0])
          : undefined
      const ziel =
        o.ziel.art === 'dock'
          ? neuerAnschluss(o.ziel.objektId, o.ziel.dockpunktIndizes[0])
          : undefined
      if (!start && !ziel) continue
      verlaeufe.push(o.wegpunkte)
      if (start) anschluesse.push([o.wegpunkte[0], start])
      if (ziel) anschluesse.push([o.wegpunkte[o.wegpunkte.length - 1], ziel])
    }
  }
  g.save()
  g.strokeStyle = LEITUNG_VORSCHAU_FARBE_GUELTIG
  g.lineWidth = 2
  for (const v of verlaeufe) strich(v)
  g.setLineDash([6, 4])
  for (const [von, bis] of anschluesse) strich([von, bis])
  g.restore()
}

function zeichneVerlaeufe(
  g: CanvasRenderingContext2D,
  ctx: ToolContext,
  verlaeufe: ReadonlyMap<string, Point[]>,
) {
  for (const verlauf of verlaeufe.values()) {
    if (verlauf.length < 2) continue
    const punkte = verlauf.map((p) => ctx.view.worldToScreen(p))
    g.beginPath()
    g.moveTo(punkte[0].x, punkte[0].y)
    for (const p of punkte.slice(1)) g.lineTo(p.x, p.y)
    g.stroke()
  }
}

function tabellenKontextVon(ctx: ToolContext): TabellenKontext {
  return {
    zeichnung: ctx.doc.getZeichnung(),
    blattId: ctx.aktivesBlattId(),
    katalog: ctx.katalogKomponenten(),
    ...ctx.verknuepfteZeichnungen?.(),
  }
}
