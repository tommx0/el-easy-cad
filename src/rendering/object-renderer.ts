import type {
  AbgangsText,
  Blattverweis,
  SenkrechterAbgangsRaum,
  Blatt,
  CatalogComponent,
  Fuellung,
  KatalogTextElement,
  Objekt,
  SchraffurMuster,
  Point,
  TreppenSchnitt,
  TabellenKontext,
  Zeichnung,
  WandObjekt,
  WandTeilstueck,
} from '../document-model'
import {
  breiteEntlangWand,
  eingerechneterKombinationsFaktor,
  istKlemme,
  klemmeFolgtInReihe,
  stehtAllein,
  verlegungVon,
  kombinationsRahmen,
  abgeleitetePfadSegmente,
  aufgeloesteVariante,
  baueLeitungsbaumModell,
  bauePlankopfModell,
  baueTabellenModell,
  effektiverFaktor,
  effektiveSichtbarkeit,
  ermittleBemassungsreiheGeometrie,
  ermittleKnotenpunkte,
  bezeichnungsStellen,
  verweisEnden,
  unterbrechungsEnde,
  dockpunktBeschriftungen,
  ermittleTextElementAnker,
  grundGroesseWelt,
  ermittleTreppenGeometrie,
  etageDarunter,
  sichtbareObjekteAufBlatt,
  treppenGeschosshoehe,
  treppenSchnitt,
  ermittleWandKontur,
  istStirnseiteVerdeckt,
  polygonPunkte,
  POTENTIAL_SYMBOL_GROESSE,
  rechteckEcken,
  skalaAusGroessenFaktor,
  STANDARD_SCHRAFFUR_ABSTAND_M,
  STANDARD_SCHRAFFUR_MUSTER,
  STANDARD_WAND_STAERKE,
  TEXT_ZEILENABSTAND,
  textZeilen,
  waehleKomponentenGrafik,
  hatStandardFarbe,
  symbolFarbwert,
  wirksameFuellung,
  zeilenVersatz,
  RAUM_ZEILENABSTAND_FAKTOR,
} from '../document-model'
import type { CatalogStore } from '../persistence'
import { holeKatalogBild } from './katalog-bild-cache'
import { holeEingefaerbtesSymbol } from './symbol-einfaerbung'
import {
  ermittleBeschriftungszeilen,
  reihenHoehenText,
  verlegungsText,
} from './komponenten-beschriftung'
import { zeichneTabelle } from './tabellen-renderer'
import { zeichneBaum } from './baum-renderer'
import { zeichnePlankopf } from './plankopf-renderer'
import { zeichneAbgangsTexte } from './abgang-renderer'
import { zeichneKnxAktor } from './knx-aktor-renderer'
import { ermittleSchachtAnzeige, zeichneKabelschacht } from './kabelschacht-renderer'
import type { ViewTransform } from './view-transform'
import { oberflaechensprache, t } from '../sprache'
import type { Sprache, Uebersetzer } from '../sprache'

export interface KomponentenRenderKontext {
  leitungsverlegungAus?: boolean
  tp: Uebersetzer
  plansprache?: Sprache
  katalogKomponenten: CatalogComponent[]
  catalogStore: CatalogStore
  aufNeuZeichnenAnfordern: () => void
  poeSummen?: ReadonlyMap<string, number>
  querverweisTexte?: ReadonlyMap<string, string>
  abgangsTexte?: ReadonlyMap<string, readonly AbgangsText[]>
  abgangsRaeume?: ReadonlyMap<string, SenkrechterAbgangsRaum>
  stromkreisTexte?: ReadonlyMap<string, string>
  blattverweise?: ReadonlyMap<string, Blattverweis>
  knxBeschriftungen?: ReadonlyMap<string, readonly (string | undefined)[]>
  knxKanalVerweise?: ReadonlyMap<string, readonly (string | undefined)[]>
  verknuepfteBauplaene?: readonly Zeichnung[]
  verknuepfteVerteilerplaene?: readonly Zeichnung[]
  traegerMitModulen?: ReadonlySet<string>
  traegerVollBelegt?: ReadonlySet<string>
  tabellenKontext?: TabellenKontext
  auswahlIds?: ReadonlySet<string>
  assetQuelle?: (assetId: string) => string
  blattAnzeige?: Pick<
    Blatt,
    | 'beschriftungSichtbar'
    | 'bezeichnungSichtbar'
    | 'textGroessenFaktor'
    | 'symbolGroessenFaktor'
    | 'raumNameSichtbar'
    | 'raumFlaecheSichtbar'
    | 'installationshoeheSichtbar'
    | 'komponentenDarstellung'
    | 'schaltverbindungBezeichnungSichtbar'
    | 'kennzeichenSichtbar'
    | 'abgaengeSichtbar'
    | 'stromkreisSichtbar'
  >
  alleObjekteAufBlatt?: readonly Objekt[]
  schaltplan?: boolean
  treppenGeschosshoehe?: number | null
}

const VERBINDUNGSPUNKT_DURCHMESSER_METER = 0.04

const knotenCache = new WeakMap<readonly Objekt[], Point[]>()

function knotenpunkteVon(objekte: readonly Objekt[]): Point[] {
  let knoten = knotenCache.get(objekte)
  if (!knoten) {
    knoten = ermittleKnotenpunkte(objekte)
    knotenCache.set(objekte, knoten)
  }
  return knoten
}

const STANDARD_BLATT_ANZEIGE: NonNullable<KomponentenRenderKontext['blattAnzeige']> = {
  beschriftungSichtbar: true,
  bezeichnungSichtbar: true,
  textGroessenFaktor: 0,
  symbolGroessenFaktor: 0,
  raumNameSichtbar: true,
  raumFlaecheSichtbar: true,
  installationshoeheSichtbar: true,
  komponentenDarstellung: 'symbol',
  schaltverbindungBezeichnungSichtbar: true,
  kennzeichenSichtbar: true,
  abgaengeSichtbar: true,
  stromkreisSichtbar: true,
}

function planTp(rahmen?: KomponentenRenderKontext): Uebersetzer {
  return rahmen?.tp ?? t
}

function planSprache(rahmen?: KomponentenRenderKontext): Sprache {
  return rahmen?.plansprache ?? oberflaechensprache()
}

const SCHALTVERBINDUNG_BEZEICHNUNG_HOEHE_METER = 0.1
const SCHALTVERBINDUNG_BEZEICHNUNG_ABSTAND_METER = 0.03
const SCHALTVERBINDUNG_BEZEICHNUNG_FARBE = '#808080'

function schaltverbindungTextMasse(
  view: ViewTransform,
  skala: number,
): { hoehePx: number; abstandPx: number } {
  return {
    hoehePx: view.laengeToScreen(SCHALTVERBINDUNG_BEZEICHNUNG_HOEHE_METER * skala),
    abstandPx: view.laengeToScreen(SCHALTVERBINDUNG_BEZEICHNUNG_ABSTAND_METER),
  }
}

function zeichneBlattverweise(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'schaltverbindung' }>,
  verweis: Blattverweis | undefined,
  nameSichtbar: boolean,
  skala: number,
): void {
  const { links, rechts } = verweisEnden(objekt)
  const { hoehePx, abstandPx } = schaltverbindungTextMasse(view, skala)
  const pfeilPx = hoehePx * 0.6
  const nameLinks = objekt.bezeichnungNurAmAnfang === true || verweis?.anfang !== undefined
  ctx.save()
  ctx.setLineDash([])
  ctx.font = `${hoehePx}px sans-serif`
  ctx.textBaseline = 'middle'
  const ende = (p: Point, richtung: -1 | 1, name: boolean, ziel: string | undefined) => {
    const s = view.worldToScreen(p)
    let x = s.x + richtung * abstandPx
    ctx.textAlign = richtung < 0 ? 'right' : 'left'
    ctx.fillStyle = SCHALTVERBINDUNG_BEZEICHNUNG_FARBE
    if (name && nameSichtbar) {
      ctx.fillText(objekt.bezeichnung!, x, s.y)
      x += richtung * (ctx.measureText(objekt.bezeichnung!).width + abstandPx)
    }
    if (ziel === undefined) return
    ctx.beginPath()
    ctx.moveTo(x + richtung * pfeilPx, s.y)
    ctx.lineTo(x, s.y - pfeilPx / 2)
    ctx.lineTo(x, s.y + pfeilPx / 2)
    ctx.closePath()
    ctx.fillStyle = objekt.farbe
    ctx.fill()
    ctx.fillStyle = SCHALTVERBINDUNG_BEZEICHNUNG_FARBE
    ctx.fillText(ziel, x + richtung * (pfeilPx + abstandPx), s.y)
  }
  ende(links, -1, nameLinks, verweis?.anfang)
  ende(rechts, 1, !nameLinks, verweis?.ende)
  ctx.restore()
}

function zeichneUnterbrechung(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'schaltverbindung' }>,
  verweis: string | undefined,
  nameSichtbar: boolean,
  skala: number,
): void {
  const ende = unterbrechungsEnde(objekt)
  if (!ende) return
  const { hoehePx, abstandPx } = schaltverbindungTextMasse(view, skala)
  const pfeilPx = hoehePx * 0.6
  const s = view.worldToScreen(ende.punkt)
  const nachUnten = -ende.richtung.y
  const senkrecht = Math.abs(nachUnten) > Math.abs(ende.richtung.x)
  ctx.save()
  ctx.setLineDash([])
  ctx.translate(s.x, s.y)
  if (senkrecht) ctx.rotate(-Math.PI / 2)
  const richtung: 1 | -1 = senkrecht ? (nachUnten < 0 ? 1 : -1) : ende.richtung.x > 0 ? 1 : -1
  let x = richtung * abstandPx
  const hinaus = objekt.unterbrechung === 'quelle'
  const spitze = x + (hinaus ? pfeilPx * richtung : 0)
  const grund = x + (hinaus ? 0 : pfeilPx * richtung)
  ctx.beginPath()
  ctx.moveTo(spitze, 0)
  ctx.lineTo(grund, -pfeilPx / 2)
  ctx.lineTo(grund, pfeilPx / 2)
  ctx.closePath()
  ctx.fillStyle = objekt.farbe
  ctx.fill()
  x += richtung * (pfeilPx + abstandPx)
  ctx.font = `${hoehePx}px sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = richtung > 0 ? 'left' : 'right'
  ctx.fillStyle = SCHALTVERBINDUNG_BEZEICHNUNG_FARBE
  if (nameSichtbar) {
    ctx.fillText(objekt.bezeichnung!, x, 0)
    x += richtung * (ctx.measureText(objekt.bezeichnung!).width + abstandPx)
  }
  if (verweis) ctx.fillText(verweis, x, 0)
  ctx.restore()
}

const KOMBINATIONS_RAHMEN_FARBE = '#808080'

export function ermittleSymbolGeometrie(
  objekt: Extract<Objekt, { type: 'komponente' }>,
  view: ViewTransform,
  blattAnzeige: NonNullable<KomponentenRenderKontext['blattAnzeige']>,
): {
  halbXPx: number
  halbYPx: number
  textSkala: number
  mitte: Point
  grundHoehePx: number
} {
  const symbolSkala = skalaAusGroessenFaktor(
    effektiverFaktor(objekt.symbolGroessenFaktor, blattAnzeige.symbolGroessenFaktor),
  )
  const textSkala = skalaAusGroessenFaktor(
    effektiverFaktor(objekt.textGroessenFaktor, blattAnzeige.textGroessenFaktor),
  )
  return {
    halbXPx: (view.laengeToScreen(objekt.breiteWelt ?? objekt.groesseWelt) / 2) * symbolSkala,
    halbYPx: (view.laengeToScreen(objekt.groesseWelt) / 2) * symbolSkala,
    textSkala,
    mitte: view.worldToScreen(objekt.position),
    grundHoehePx: view.laengeToScreen(grundGroesseWelt(objekt)) * symbolSkala,
  }
}

function streckenmitteUndRichtung(punkte: Point[]): { mitte: Point; richtung: number } {
  const laengen: number[] = []
  let gesamt = 0
  for (let i = 0; i < punkte.length - 1; i++) {
    const l = Math.hypot(punkte[i + 1].x - punkte[i].x, punkte[i + 1].y - punkte[i].y)
    laengen.push(l)
    gesamt += l
  }
  if (gesamt === 0) return { mitte: punkte[0], richtung: 0 }
  let rest = gesamt / 2
  for (let i = 0; i < laengen.length; i++) {
    if (rest <= laengen[i] || i === laengen.length - 1) {
      const t = laengen[i] === 0 ? 0 : rest / laengen[i]
      const a = punkte[i]
      const b = punkte[i + 1]
      return {
        mitte: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
        richtung: Math.atan2(b.y - a.y, b.x - a.x),
      }
    }
    rest -= laengen[i]
  }
  return { mitte: punkte[0], richtung: 0 }
}

function zeichneMehrpoligKennzeichnung(
  ctx: CanvasRenderingContext2D,
  punkteScreen: Point[],
  polzahl: number,
  farbe: string,
) {
  const { mitte, richtung } = streckenmitteUndRichtung(punkteScreen)
  const strichWinkel = richtung + Math.PI / 3 // ~60 Grad zur Leitung, IEC-ueblich
  const halbLaenge = 7
  const dx = Math.cos(strichWinkel) * halbLaenge
  const dy = Math.sin(strichWinkel) * halbLaenge
  ctx.save()
  ctx.setLineDash([])
  ctx.strokeStyle = farbe
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(mitte.x - dx, mitte.y - dy)
  ctx.lineTo(mitte.x + dx, mitte.y + dy)
  ctx.stroke()
  ctx.fillStyle = farbe
  ctx.font = '11px sans-serif'
  ctx.textBaseline = 'bottom'
  ctx.fillText(String(polzahl), mitte.x + dx + 3, mitte.y + dy - 3)
  ctx.restore()
}

function zeichneSchutzerdeSymbol(
  ctx: CanvasRenderingContext2D,
  ende: Point,
  winkel: number,
  farbe: string,
) {
  const entlang = { x: Math.cos(winkel), y: Math.sin(winkel) }
  const quer = { x: -Math.sin(winkel), y: Math.cos(winkel) }
  const balkenAbstandPx = 4
  const halbbreitenPx = [7, 5, 3]
  ctx.save()
  ctx.setLineDash([])
  ctx.strokeStyle = farbe
  ctx.lineWidth = 1.5
  halbbreitenPx.forEach((halbbreite, index) => {
    const versatz = (index + 1) * balkenAbstandPx
    const mitte = { x: ende.x + entlang.x * versatz, y: ende.y + entlang.y * versatz }
    ctx.beginPath()
    ctx.moveTo(mitte.x - quer.x * halbbreite, mitte.y - quer.y * halbbreite)
    ctx.lineTo(mitte.x + quer.x * halbbreite, mitte.y + quer.y * halbbreite)
    ctx.stroke()
  })
  ctx.restore()
}

export function zeichneObjekt(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Objekt,
  rahmen?: KomponentenRenderKontext,
) {
  ctx.save()
  ctx.strokeStyle = objekt.farbe
  ctx.lineWidth = objekt.strichstaerke
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.setLineDash(dashMuster(objekt.linientyp, objekt.strichstaerke))

  switch (objekt.type) {
    case 'linie': {
      const a = view.worldToScreen(objekt.start)
      const b = view.worldToScreen(objekt.ende)
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
      break
    }
    case 'polylinie': {
      if (objekt.punkte.length < 2) break
      const punkte = objekt.punkte.map((p) => view.worldToScreen(p))
      const pfad = () => {
        ctx.moveTo(punkte[0].x, punkte[0].y)
        for (const p of punkte.slice(1)) ctx.lineTo(p.x, p.y)
        if (objekt.geschlossen) ctx.closePath()
      }
      fuelleFlaeche(ctx, view, wirksameFuellung(objekt), pfad, () => rahmenAusPunkten(punkte))
      ctx.stroke()
      break
    }
    case 'bodenplatte': {
      if (objekt.punkte.length < 2) break
      const punkte = objekt.punkte.map((p) => view.worldToScreen(p))
      const pfad = () => {
        ctx.moveTo(punkte[0].x, punkte[0].y)
        for (const p of punkte.slice(1)) ctx.lineTo(p.x, p.y)
        ctx.closePath()
      }
      fuelleFlaeche(ctx, view, wirksameFuellung(objekt), pfad, () => rahmenAusPunkten(punkte))
      ctx.stroke()
      break
    }
    case 'rechteck': {
      const mitte = {
        x: objekt.ursprung.x + objekt.breite / 2,
        y: objekt.ursprung.y + objekt.hoehe / 2,
      }
      const mitteScreen = view.worldToScreen(mitte)
      ctx.translate(mitteScreen.x, mitteScreen.y)
      ctx.rotate(-objekt.drehung)
      const w = view.laengeToScreen(objekt.breite)
      const h = view.laengeToScreen(objekt.hoehe)
      fuelleFlaeche(
        ctx,
        view,
        objekt.fuellung,
        () => ctx.rect(-w / 2, -h / 2, w, h),
        () => ({ minX: -w / 2, minY: -h / 2, maxX: w / 2, maxY: h / 2 }),
        objekt.drehung,
      )
      ctx.stroke()
      break
    }
    case 'kreis': {
      const m = view.worldToScreen(objekt.mittelpunkt)
      const r = view.laengeToScreen(objekt.radius)
      fuelleFlaeche(
        ctx,
        view,
        objekt.fuellung,
        () => ctx.arc(m.x, m.y, r, 0, Math.PI * 2),
        () => ({ minX: m.x - r, minY: m.y - r, maxX: m.x + r, maxY: m.y + r }),
      )
      ctx.stroke()
      break
    }
    case 'bogen': {
      const m = view.worldToScreen(objekt.mittelpunkt)
      const r = view.laengeToScreen(objekt.radius)
      ctx.beginPath()
      ctx.arc(m.x, m.y, r, -objekt.endWinkel, -objekt.startWinkel)
      ctx.stroke()
      break
    }
    case 'ellipse': {
      const m = view.worldToScreen(objekt.mittelpunkt)
      const rx = view.laengeToScreen(objekt.radiusX)
      const ry = view.laengeToScreen(objekt.radiusY)
      const rMax = Math.max(rx, ry)
      fuelleFlaeche(
        ctx,
        view,
        objekt.fuellung,
        () => ctx.ellipse(m.x, m.y, rx, ry, -objekt.drehung, 0, Math.PI * 2),
        () => ({ minX: m.x - rMax, minY: m.y - rMax, maxX: m.x + rMax, maxY: m.y + rMax }),
      )
      ctx.stroke()
      break
    }
    case 'polygon': {
      const punkte = polygonPunkte(objekt).map((p) => view.worldToScreen(p))
      fuelleFlaeche(
        ctx,
        view,
        objekt.fuellung,
        () => {
          ctx.moveTo(punkte[0].x, punkte[0].y)
          for (const p of punkte.slice(1)) ctx.lineTo(p.x, p.y)
          ctx.closePath()
        },
        () => rahmenAusPunkten(punkte),
      )
      ctx.stroke()
      break
    }
    case 'punkt': {
      const p = view.worldToScreen(objekt.position)
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(2, objekt.strichstaerke), 0, Math.PI * 2)
      ctx.fillStyle = objekt.farbe
      ctx.fill()
      break
    }
    case 'text': {
      const p = view.worldToScreen(objekt.position)
      const hoehePx = view.laengeToScreen(objekt.hoehe)
      ctx.translate(p.x, p.y)
      ctx.rotate(-objekt.drehung)
      ctx.fillStyle = objekt.farbe
      ctx.font = `${hoehePx}px sans-serif`
      ctx.textBaseline = 'bottom'
      ctx.fillText(objekt.inhalt, 0, 0)
      break
    }
    case 'komponente': {
      const blattAnzeige = rahmen?.blattAnzeige ?? STANDARD_BLATT_ANZEIGE
      const { halbXPx, halbYPx, textSkala, mitte, grundHoehePx } = ermittleSymbolGeometrie(
        objekt,
        view,
        blattAnzeige,
      )

      const kombiRahmen = rahmen?.alleObjekteAufBlatt
        ? kombinationsRahmen(objekt, rahmen.alleObjekteAufBlatt)
        : null
      if (kombiRahmen) {
        ctx.save()
        ctx.strokeStyle = KOMBINATIONS_RAHMEN_FARBE
        ctx.lineWidth = objekt.strichstaerke
        ctx.setLineDash(dashMuster('gepunktet', objekt.strichstaerke))
        ctx.lineCap = 'round'
        ctx.beginPath()
        kombiRahmen.forEach((p, i) => {
          const b = view.worldToScreen(p)
          if (i === 0) ctx.moveTo(b.x, b.y)
          else ctx.lineTo(b.x, b.y)
        })
        ctx.closePath()
        ctx.stroke()
        ctx.restore()
      }

      ctx.save()
      ctx.translate(mitte.x, mitte.y)
      ctx.rotate(-objekt.drehung)

      const knxDaten = objekt.knxAktor
      const component =
        rahmen && !knxDaten
          ? rahmen.katalogKomponenten.find((k) => k.id === objekt.catalogComponentId)
          : undefined
      const aufgeloest = component ? aufgeloesteVariante(component, objekt.variantId) : null
      const eigeneFarben = hatStandardFarbe(objekt.farbe)
      const auswahl = aufgeloest
        ? waehleKomponentenGrafik(
            aufgeloest,
            objekt.darstellung ?? blattAnzeige.komponentenDarstellung,
          )
        : null
      const image = auswahl
        ? holeKatalogBild(auswahl.grafik, rahmen!.aufNeuZeichnenAnfordern)
        : null
      const bildNutzbar = image !== null && image.naturalWidth > 0
      const traegerAusgeblendet = rahmen?.traegerVollBelegt?.has(objekt.id) ?? false

      if (knxDaten) {
        zeichneKnxAktor(
          ctx,
          { ...objekt, knxAktor: knxDaten },
          halbXPx,
          halbYPx,
          rahmen?.knxBeschriftungen?.get(objekt.id),
          rahmen?.knxKanalVerweise?.get(objekt.id),
          planTp(rahmen),
        )
      } else if (!traegerAusgeblendet) {
        if (bildNutzbar && auswahl?.art === 'symbol' && eigeneFarben) {
          zeichneKatalogBild(ctx, image, halbXPx, halbYPx)
        } else if (bildNutzbar && auswahl?.art === 'symbol') {
          zeichneSymbolEingefaerbt(
            ctx,
            image,
            auswahl.grafik.assetId,
            objekt.farbe,
            halbXPx,
            halbYPx,
          )
        } else if (bildNutzbar) {
          ctx.beginPath()
          ctx.rect(-halbXPx, -halbYPx, halbXPx * 2, halbYPx * 2)
          ctx.stroke()
          zeichneKatalogBild(ctx, image, halbXPx, halbYPx)
        } else {
          ctx.fillStyle = '#eef4fc'
          ctx.beginPath()
          ctx.rect(-halbXPx, -halbYPx, halbXPx * 2, halbYPx * 2)
          ctx.fill()
          ctx.stroke()
          ctx.fillStyle = objekt.farbe
          ctx.beginPath()
          ctx.arc(0, 0, Math.max(2, Math.min(halbXPx, halbYPx) * 0.35), 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()

      if (!traegerAusgeblendet) {
        const anschluesse = dockpunktBeschriftungen(objekt.dockpunkte)
        zeichneKatalogTextElemente(
          ctx,
          anschluesse.length
            ? [...(objekt.textElemente ?? []), ...anschluesse]
            : objekt.textElemente,
          mitte,
          objekt.drehung,
          halbXPx,
          halbYPx,
          view.laengeToScreen(grundGroesseWelt(objekt)),
          grundHoehePx,
          textSkala,
          objekt.farbe,
          eigeneFarben,
        )
      }

      const beschriftungszeilen = beschriftungszeilenMitReihe(objekt, rahmen)
      if (beschriftungszeilen.length > 0) {
        zeichneKomponentenBeschriftung(
          ctx,
          view,
          objekt,
          mitte,
          halbXPx,
          halbYPx,
          beschriftungszeilen,
          textSkala,
          standardBeschriftungsposition(rahmen),
        )
      }
      const hoehenAngabe = ermittleReihenHoehenBlock(ctx, view, objekt, rahmen)
      if (hoehenAngabe) {
        ctx.save()
        ctx.font = `${hoehenAngabe.schriftgroesse}px sans-serif`
        ctx.fillStyle = objekt.farbe
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        const r = hoehenAngabe.rechteck
        ctx.fillText(hoehenAngabe.text, r.x, r.y + r.hoehe / 2)
        ctx.restore()
      }
      if (rahmen?.abgangsTexte && blattAnzeige.abgaengeSichtbar)
        zeichneAbgangsTexte(
          ctx,
          view,
          objekt,
          rahmen.abgangsTexte.get(objekt.id) ?? [],
          rahmen.abgangsRaeume?.get(objekt.id),
          objekt.abgangstext?.ausrichtung === 'links'
            ? abgangsLinksAnker(ctx, view, objekt, rahmen)
            : undefined,
        )
      break
    }
    case 'stueckliste':
    case 'leitungsliste':
    case 'switchplan':
    case 'trunkliste':
    case 'raumliste':
    case 'betriebsmittelliste':
    case 'stromkreisverzeichnis':
    case 'aktorkanalliste':
    case 'potentialliste':
    case 'steuerungslogik': {
      if (!rahmen?.tabellenKontext) {
        const p = view.worldToScreen(objekt.position)
        const kante = view.laengeToScreen(objekt.textHoehe * 4)
        ctx.strokeRect(p.x, p.y, kante, kante)
        break
      }
      zeichneTabelle(
        ctx,
        view,
        objekt.position,
        baueTabellenModell(objekt, rahmen.tabellenKontext),
        objekt.farbe,
        objekt.strichstaerke,
      )
      break
    }
    case 'plankopf': {
      if (!rahmen?.tabellenKontext) {
        const p = view.worldToScreen(objekt.position)
        const kante = view.laengeToScreen(1)
        ctx.strokeRect(p.x, p.y, kante, kante / 3)
        break
      }
      zeichnePlankopf(
        ctx,
        view,
        objekt.position,
        bauePlankopfModell(objekt, rahmen.tabellenKontext),
        objekt.farbe,
        objekt.strichstaerke,
        rahmen.aufNeuZeichnenAnfordern,
      )
      break
    }
    case 'leitungsbaum': {
      if (!rahmen?.tabellenKontext) {
        const p = view.worldToScreen(objekt.position)
        const kante = view.laengeToScreen(objekt.textHoehe * 4)
        ctx.strokeRect(p.x, p.y, kante, kante)
        break
      }
      zeichneBaum(
        ctx,
        view,
        objekt.position,
        baueLeitungsbaumModell(objekt, rahmen.tabellenKontext),
        objekt.farbe,
        objekt.strichstaerke,
      )
      break
    }
    case 'leitung': {
      for (const segment of objekt.pfadSegmente) {
        if (segment.length < 2) continue
        const punkte = segment.map((p) => view.worldToScreen(p))
        ctx.beginPath()
        ctx.moveTo(punkte[0].x, punkte[0].y)
        for (const p of punkte.slice(1)) ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }
      break
    }
    case 'trunk': {
      if (objekt.wegpunkte.length >= 2) {
        const punkte = objekt.wegpunkte.map((p) => view.worldToScreen(p))
        ctx.beginPath()
        ctx.moveTo(punkte[0].x, punkte[0].y)
        for (const p of punkte.slice(1)) ctx.lineTo(p.x, p.y)
        ctx.stroke()
        objekt.enden.forEach((ende, index) => {
          if (!ende.verbundenerPfad) return
          const p = punkte[index === 0 ? 0 : punkte.length - 1]
          ctx.beginPath()
          ctx.arc(p.x, p.y, Math.max(3, objekt.strichstaerke), 0, Math.PI * 2)
          ctx.fillStyle = objekt.farbe
          ctx.fill()
        })
      }
      break
    }
    case 'schaltverbindung': {
      if (objekt.wegpunkte.length >= 2) {
        const punkte = objekt.wegpunkte.map((p) => view.worldToScreen(p))
        ctx.beginPath()
        ctx.moveTo(punkte[0].x, punkte[0].y)
        for (const p of punkte.slice(1)) ctx.lineTo(p.x, p.y)
        ctx.stroke()
        if (objekt.zweiteFarbe && objekt.linientyp === 'standard') {
          ctx.save()
          ctx.setLineDash(zweifarbMuster(objekt.strichstaerke))
          ctx.lineCap = 'butt'
          ctx.strokeStyle = objekt.zweiteFarbe
          ctx.stroke()
          ctx.restore()
        }
        if (objekt.polzahl > 1) {
          zeichneMehrpoligKennzeichnung(ctx, punkte, objekt.polzahl, objekt.farbe)
        }
        const radiusPx = view.laengeToScreen(VERBINDUNGSPUNKT_DURCHMESSER_METER / 2)
        const punktePx: Point[] = []
        if (rahmen?.alleObjekteAufBlatt) {
          for (const k of knotenpunkteVon(rahmen.alleObjekteAufBlatt)) {
            if (objekt.wegpunkte.some((w) => Math.hypot(w.x - k.x, w.y - k.y) < 1e-6)) {
              punktePx.push(view.worldToScreen(k))
            }
          }
        } else {
          for (const [anschluss, p] of [
            [objekt.start, punkte[0]],
            [objekt.ziel, punkte[punkte.length - 1]],
          ] as const) {
            if (anschluss.art === 'schaltverbindung') punktePx.push(p)
          }
        }
        for (const p of punktePx) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, Math.max(2, radiusPx), 0, Math.PI * 2)
          ctx.fillStyle = objekt.farbe
          ctx.fill()
        }
        const blattAnzeige = rahmen?.blattAnzeige ?? STANDARD_BLATT_ANZEIGE
        const nameSichtbar =
          !!objekt.bezeichnung &&
          effektiveSichtbarkeit(
            objekt.bezeichnungSichtbar,
            blattAnzeige.schaltverbindungBezeichnungSichtbar,
          )
        if (objekt.unterbrechung && objekt.bezeichnung) {
          zeichneUnterbrechung(
            ctx,
            view,
            objekt,
            rahmen?.blattverweise?.get(objekt.id)?.unterbrechung,
            nameSichtbar,
            skalaAusGroessenFaktor(blattAnzeige.textGroessenFaktor),
          )
        } else if (objekt.blattverweis && objekt.bezeichnung) {
          zeichneBlattverweise(
            ctx,
            view,
            objekt,
            rahmen?.blattverweise?.get(objekt.id),
            nameSichtbar,
            skalaAusGroessenFaktor(blattAnzeige.textGroessenFaktor),
          )
        } else if (nameSichtbar) {
          const { hoehePx, abstandPx } = schaltverbindungTextMasse(
            view,
            skalaAusGroessenFaktor(blattAnzeige.textGroessenFaktor),
          )
          ctx.save()
          ctx.fillStyle = SCHALTVERBINDUNG_BEZEICHNUNG_FARBE
          ctx.font = `${hoehePx}px sans-serif`
          ctx.textAlign = 'left'
          ctx.textBaseline = 'bottom'
          const stellen = bezeichnungsStellen(objekt.wegpunkte)
          for (const stelle of objekt.bezeichnungNurAmAnfang ? stellen.slice(0, 1) : stellen) {
            const p = view.worldToScreen(stelle)
            ctx.fillText(objekt.bezeichnung!, p.x + abstandPx, p.y - abstandPx)
          }
          ctx.restore()
        }
      }
      break
    }
    case 'potential': {
      const p = view.worldToScreen(objekt.position)
      const stubPx = view.laengeToScreen(POTENTIAL_SYMBOL_GROESSE * 0.6)
      const winkel = -objekt.drehung - Math.PI / 2 // 0 Grad Drehung zeigt nach oben
      const ende = { x: p.x + Math.cos(winkel) * stubPx, y: p.y + Math.sin(winkel) * stubPx }
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(ende.x, ende.y)
      ctx.stroke()
      if (objekt.name === 'PE') {
        zeichneSchutzerdeSymbol(ctx, ende, winkel, objekt.farbe)
      } else {
        ctx.beginPath()
        ctx.arc(ende.x, ende.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = objekt.farbe
        ctx.font = '11px sans-serif'
        ctx.textBaseline = 'middle'
        ctx.fillText(objekt.name, ende.x + 5, ende.y)
      }
      break
    }
    case 'kabelschacht': {
      const kontext = rahmen?.tabellenKontext
      zeichneKabelschacht(
        ctx,
        view,
        objekt,
        kontext ? ermittleSchachtAnzeige(kontext.zeichnung, kontext.blattId, objekt) : undefined,
        rahmen?.auswahlIds?.has(objekt.id) ?? false,
      )
      break
    }
    case 'bemassung': {
      zeichneBemassung(ctx, view, objekt)
      break
    }
    case 'bemassungsreihe': {
      zeichneBemassungsreihe(ctx, view, objekt)
      break
    }
    case 'schraffur': {
      zeichneSchraffur(ctx, view, objekt)
      break
    }
    case 'wand': {
      const alleObjekte = rahmen?.alleObjekteAufBlatt ?? []
      const teilstuecke = wandKonturAufBlatt(objekt, alleObjekte)

      const andereWaende = alleObjekte.filter(
        (o): o is Extract<Objekt, { type: 'wand' }> => o.type === 'wand' && o.id !== objekt.id,
      )
      const andereTeile = andereWaende.flatMap((fremd) => wandKonturAufBlatt(fremd, alleObjekte))
      const andereRinge = andereTeile.map((teil) => ({
        aussen: teil.aussen.map((p) => view.worldToScreen(p)),
        innen: teil.innen.map((p) => view.worldToScreen(p)),
      }))

      for (const teil of teilstuecke) {
        const aussen = teil.aussen.map((p) => view.worldToScreen(p))
        const innen = teil.innen.map((p) => view.worldToScreen(p))
        fuelleFlaeche(
          ctx,
          view,
          objekt.fuellung,
          () => wandRingPfad(ctx, aussen, innen),
          () => rahmenAusPunkten([...aussen, ...innen]),
        )
        ctx.save()
        if (andereRinge.length > 0) {
          ctx.beginPath()
          ctx.rect(-1e6, -1e6, 2e6, 2e6)
          for (const ring of andereRinge) wandRingPfad(ctx, ring.aussen, ring.innen)
          ctx.clip('evenodd')
        }
        const offen = offeneStirnseiten(teil, andereTeile)
        ctx.beginPath()
        wandKonturPfad(ctx, aussen, innen, offen)
        ctx.stroke()
        ctx.restore()
      }
      break
    }
    case 'tuer': {
      zeichneTuer(ctx, view, objekt, ermittleWandStaerke(objekt, rahmen?.alleObjekteAufBlatt))
      break
    }
    case 'fenster': {
      zeichneFenster(ctx, view, objekt, ermittleWandStaerke(objekt, rahmen?.alleObjekteAufBlatt))
      break
    }
    case 'wanddurchbruch': {
      zeichneWanddurchbruch(
        ctx,
        view,
        objekt,
        ermittleWandStaerke(objekt, rahmen?.alleObjekteAufBlatt),
      )
      break
    }
    case 'raum': {
      if (objekt.umriss.length >= 3) {
        const punkte = objekt.umriss.map((p) => view.worldToScreen(p))
        fuelleFlaeche(
          ctx,
          view,
          wirksameFuellung(objekt),
          () => {
            ctx.moveTo(punkte[0].x, punkte[0].y)
            for (const p of punkte.slice(1)) ctx.lineTo(p.x, p.y)
            ctx.closePath()
          },
          () => rahmenAusPunkten(punkte),
        )
      }
      if (!objekt.gueltig && objekt.umriss.length >= 3) {
        const punkte = objekt.umriss.map((p) => view.worldToScreen(p))
        ctx.save()
        ctx.setLineDash([6, 4])
        ctx.strokeStyle = '#d1382f'
        ctx.beginPath()
        ctx.moveTo(punkte[0].x, punkte[0].y)
        for (const p of punkte.slice(1)) ctx.lineTo(p.x, p.y)
        ctx.closePath()
        ctx.stroke()
        ctx.restore()
      }
      const blattAnzeige = rahmen?.blattAnzeige ?? STANDARD_BLATT_ANZEIGE
      const nameSichtbar = effektiveSichtbarkeit(objekt.nameSichtbar, blattAnzeige.raumNameSichtbar)
      const flaecheSichtbar = effektiveSichtbarkeit(
        objekt.flaecheSichtbar,
        blattAnzeige.raumFlaecheSichtbar,
      )
      if (nameSichtbar || flaecheSichtbar) {
        const versatz = objekt.beschriftungVersatz
        const mitte = view.worldToScreen({
          x: objekt.mittelpunkt.x + (versatz?.x ?? 0),
          y: objekt.mittelpunkt.y + (versatz?.y ?? 0),
        })
        const hoehePx = view.laengeToScreen(objekt.schriftgroesse)
        const zeilen: string[] = []
        if (nameSichtbar) zeilen.push(objekt.name)
        if (flaecheSichtbar) zeilen.push(`${objekt.flaeche.toFixed(1)} m²`)
        ctx.save()
        ctx.fillStyle = objekt.farbe
        ctx.font = `${hoehePx}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const zeilenAbstandPx = hoehePx * RAUM_ZEILENABSTAND_FAKTOR
        const gesamtHoehe = zeilen.length * zeilenAbstandPx
        zeilen.forEach((zeile, i) => {
          const y = mitte.y - gesamtHoehe / 2 + (i + 0.5) * zeilenAbstandPx
          ctx.fillText(zeile, mitte.x, y)
        })
        ctx.restore()
      }
      break
    }
    case 'treppe': {
      zeichneTreppe(ctx, view, objekt, rahmen?.treppenGeschosshoehe, planTp(rahmen))
      break
    }
  }
  ctx.restore()
}

export function ermittleWandStaerke(
  objekt: Extract<Objekt, { type: 'tuer' | 'fenster' | 'wanddurchbruch' }>,
  alleObjekteAufBlatt?: readonly Objekt[],
): number {
  const wand = alleObjekteAufBlatt?.find((o) => o.id === objekt.wandId)
  return wand?.type === 'wand' ? wand.staerke : STANDARD_WAND_STAERKE
}

export function zeichneWanddurchbruch(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'wanddurchbruch' }>,
  wandStaerke: number,
): void {
  const mitte = view.worldToScreen(objekt.position)
  const halbBreitePx = view.laengeToScreen(objekt.breite) / 2
  zeichneZargen(ctx, view, mitte, objekt.richtung, halbBreitePx, wandStaerke)
}

export function zeichneWandKontur(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: WandObjekt,
  alleObjekteAufBlatt: readonly Objekt[] | undefined,
): void {
  const teilstuecke = wandKonturAufBlatt(objekt, alleObjekteAufBlatt ?? [])
  for (const teil of teilstuecke) {
    const aussen = teil.aussen.map((p) => view.worldToScreen(p))
    const innen = teil.innen.map((p) => view.worldToScreen(p))
    ctx.beginPath()
    wandKonturPfad(ctx, aussen, innen, teil)
    ctx.stroke()
  }
}

const wandKonturCache = new WeakMap<readonly Objekt[], WeakMap<WandObjekt, WandTeilstueck[]>>()

function wandKonturAufBlatt(wand: WandObjekt, alleObjekte: readonly Objekt[]): WandTeilstueck[] {
  let jeWand = wandKonturCache.get(alleObjekte)
  if (!jeWand) {
    jeWand = new WeakMap()
    wandKonturCache.set(alleObjekte, jeWand)
  }
  let kontur = jeWand.get(wand)
  if (!kontur) {
    kontur = ermittleWandKontur(wand, alleObjekte)
    jeWand.set(wand, kontur)
  }
  return kontur
}

const offeneStirnseitenCache = new WeakMap<
  WandTeilstueck,
  Pick<WandTeilstueck, 'startOffen' | 'endeOffen'>
>()

function offeneStirnseiten(
  teil: WandTeilstueck,
  andereTeile: readonly WandTeilstueck[],
): Pick<WandTeilstueck, 'startOffen' | 'endeOffen'> {
  const gemerkt = offeneStirnseitenCache.get(teil)
  if (gemerkt) return gemerkt
  const n = teil.aussen.length - 1
  const ergebnis = {
    startOffen:
      (teil.startOffen ?? true) &&
      !istStirnseiteVerdeckt(teil.innen[0], teil.aussen[0], andereTeile),
    endeOffen:
      (teil.endeOffen ?? true) &&
      !istStirnseiteVerdeckt(teil.aussen[n], teil.innen[n], andereTeile),
  }
  offeneStirnseitenCache.set(teil, ergebnis)
  return ergebnis
}

function wandKonturPfad(
  ctx: CanvasRenderingContext2D,
  aussen: Point[],
  innen: Point[],
  teil: Pick<WandTeilstueck, 'startOffen' | 'endeOffen'>,
): void {
  const startOffen = teil.startOffen ?? true
  const endeOffen = teil.endeOffen ?? true
  const letzterAussen = aussen[aussen.length - 1]
  const geschlossen =
    Math.abs(aussen[0].x - letzterAussen.x) < 1e-6 && Math.abs(aussen[0].y - letzterAussen.y) < 1e-6
  if (geschlossen || (startOffen && endeOffen)) {
    wandRingPfad(ctx, aussen, innen)
    return
  }
  ctx.moveTo(aussen[0].x, aussen[0].y)
  for (const p of aussen.slice(1)) ctx.lineTo(p.x, p.y)
  if (endeOffen) ctx.lineTo(innen[innen.length - 1].x, innen[innen.length - 1].y)
  else ctx.moveTo(innen[innen.length - 1].x, innen[innen.length - 1].y)
  for (let i = innen.length - 2; i >= 0; i--) ctx.lineTo(innen[i].x, innen[i].y)
  if (startOffen) ctx.lineTo(aussen[0].x, aussen[0].y)
}

export function zeichneTuer(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'tuer' }>,
  wandStaerke: number,
): void {
  const mitte = view.worldToScreen(objekt.position)
  const breitePx = view.laengeToScreen(objekt.breite)
  const halbBreitePx = breitePx / 2

  ctx.save()
  ctx.translate(mitte.x, mitte.y)
  ctx.rotate(-objekt.richtung)

  const hingeX = objekt.gespiegelt ? halbBreitePx : -halbBreitePx
  const otherX = objekt.gespiegelt ? -halbBreitePx : halbBreitePx
  const leafY = objekt.schwenkInnen ? breitePx : -breitePx

  ctx.beginPath()
  ctx.moveTo(hingeX, 0)
  ctx.lineTo(hingeX, leafY)
  ctx.stroke()

  ctx.beginPath()
  const winkelZuAnderer = Math.atan2(0, otherX - hingeX)
  const winkelZuBlattende = Math.atan2(leafY, 0)
  const delta = normalisiereWinkelPositiv(winkelZuBlattende - winkelZuAnderer)
  ctx.arc(hingeX, 0, breitePx, winkelZuAnderer, winkelZuBlattende, delta > Math.PI)
  ctx.stroke()
  ctx.restore()

  zeichneZargen(ctx, view, mitte, objekt.richtung, halbBreitePx, wandStaerke)
}

export function zeichneFenster(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'fenster' }>,
  wandStaerke: number,
): void {
  const mitte = view.worldToScreen(objekt.position)
  const halbBreitePx = view.laengeToScreen(objekt.breite) / 2
  const versatzPx = view.laengeToScreen(wandStaerke) / 6

  ctx.save()
  ctx.translate(mitte.x, mitte.y)
  ctx.rotate(-objekt.richtung) // Vorzeichenwechsel: siehe Kommentar in zeichneTuer.
  ctx.beginPath()
  for (const y of [-versatzPx, versatzPx]) {
    ctx.moveTo(-halbBreitePx, y)
    ctx.lineTo(halbBreitePx, y)
  }
  ctx.stroke()
  ctx.restore()

  zeichneZargen(ctx, view, mitte, objekt.richtung, halbBreitePx, wandStaerke)
}

function zeichneZargen(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  mitte: { x: number; y: number },
  richtung: number,
  halbBreitePx: number,
  wandStaerke: number,
): void {
  const halbStaerkePx = view.laengeToScreen(wandStaerke) / 2
  ctx.save()
  ctx.translate(mitte.x, mitte.y)
  ctx.rotate(-richtung) // Vorzeichenwechsel: siehe Kommentar in zeichneTuer.
  ctx.beginPath()
  for (const x of [-halbBreitePx, halbBreitePx]) {
    ctx.moveTo(x, -halbStaerkePx)
    ctx.lineTo(x, halbStaerkePx)
  }
  ctx.stroke()
  ctx.restore()
}

function normalisiereWinkelPositiv(winkel: number): number {
  const zweiPi = Math.PI * 2
  const r = winkel % zweiPi
  return r < 0 ? r + zweiPi : r
}

export function zweifarbMuster(strichstaerke: number): number[] {
  return [5 * strichstaerke, 5 * strichstaerke]
}

export function dashMuster(typ: Objekt['linientyp'], strichstaerke: number): number[] {
  const s = strichstaerke
  switch (typ) {
    case 'gestrichelt':
      return [4 * s, 3 * s]
    case 'gepunktet':
      return [1 * s, 2.5 * s]
    case 'strichpunkt':
      return [5 * s, 2 * s, 1 * s, 2 * s]
    case 'standard':
    default:
      return []
  }
}

interface FuellRahmen {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function wandRingPfad(ctx: CanvasRenderingContext2D, aussen: Point[], innen: Point[]): void {
  const letzterAussen = aussen[aussen.length - 1]
  const geschlossen =
    Math.abs(aussen[0].x - letzterAussen.x) < 1e-6 && Math.abs(aussen[0].y - letzterAussen.y) < 1e-6
  if (geschlossen) {
    ctx.moveTo(aussen[0].x, aussen[0].y)
    for (const p of aussen.slice(1)) ctx.lineTo(p.x, p.y)
    ctx.closePath()
    ctx.moveTo(innen[innen.length - 1].x, innen[innen.length - 1].y)
    for (let i = innen.length - 2; i >= 0; i--) ctx.lineTo(innen[i].x, innen[i].y)
    ctx.closePath()
    return
  }
  ctx.moveTo(aussen[0].x, aussen[0].y)
  for (const p of aussen.slice(1)) ctx.lineTo(p.x, p.y)
  for (let i = innen.length - 1; i >= 0; i--) ctx.lineTo(innen[i].x, innen[i].y)
  ctx.closePath()
}

function rahmenAusPunkten(punkte: Point[]): FuellRahmen {
  return punkte.reduce<FuellRahmen>(
    (acc, p) => ({
      minX: Math.min(acc.minX, p.x),
      minY: Math.min(acc.minY, p.y),
      maxX: Math.max(acc.maxX, p.x),
      maxY: Math.max(acc.maxY, p.y),
    }),
    { minX: punkte[0].x, minY: punkte[0].y, maxX: punkte[0].x, maxY: punkte[0].y },
  )
}

function fuelleFlaeche(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  fuellung: Fuellung | null,
  pfad: () => void,
  rahmen: () => FuellRahmen,
  gegenDrehung = 0,
) {
  ctx.beginPath()
  pfad()
  if (!fuellung) return
  ctx.save()
  ctx.globalAlpha = fuellung.deckkraft
  if (fuellung.art === 'farbe') {
    ctx.fillStyle = fuellung.farbe
    ctx.fill()
  } else {
    ctx.clip()
    zeichneLinienschar(
      ctx,
      rahmen(),
      fuellung.farbe,
      fuellung.muster ?? STANDARD_SCHRAFFUR_MUSTER,
      Math.max(3, view.laengeToScreen(fuellung.abstand ?? STANDARD_SCHRAFFUR_ABSTAND_M)),
      gegenDrehung,
    )
  }
  ctx.restore()
  ctx.beginPath()
  pfad()
}

const MUSTER_WINKEL: Record<SchraffurMuster, number[]> = {
  diagonal: [Math.PI / 4],
  kreuz: [Math.PI / 4, -Math.PI / 4],
  horizontal: [Math.PI / 2],
  vertikal: [0],
}

function zeichneLinienschar(
  ctx: CanvasRenderingContext2D,
  rahmen: FuellRahmen,
  farbe: string,
  muster: SchraffurMuster,
  abstandPx: number,
  gegenDrehung = 0,
) {
  const diag = Math.hypot(rahmen.maxX - rahmen.minX, rahmen.maxY - rahmen.minY) + abstandPx * 2
  ctx.strokeStyle = farbe
  ctx.lineWidth = 1
  ctx.setLineDash([])
  for (const winkel of MUSTER_WINKEL[muster]) {
    ctx.save()
    ctx.translate((rahmen.minX + rahmen.maxX) / 2, (rahmen.minY + rahmen.maxY) / 2)
    ctx.rotate(gegenDrehung + winkel)
    ctx.beginPath()
    for (let x = -diag; x <= diag; x += abstandPx) {
      ctx.moveTo(x, -diag)
      ctx.lineTo(x, diag)
    }
    ctx.stroke()
    ctx.restore()
  }
}

export function zeichneKatalogBild(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  halbXPx: number,
  halbYPx: number,
) {
  const zielBreite = halbXPx * 2
  const zielHoehe = halbYPx * 2
  ctx.drawImage(image, -zielBreite / 2, -zielHoehe / 2, zielBreite, zielHoehe)
}

function zeichneSymbolEingefaerbt(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  assetId: string,
  farbe: string,
  halbXPx: number,
  halbYPx: number,
) {
  const m = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null
  const geraeteSkala = m ? Math.hypot(m.a, m.b) || 1 : 1
  const raster = holeEingefaerbtesSymbol(
    image,
    assetId,
    farbe,
    halbXPx * 2 * geraeteSkala,
    halbYPx * 2 * geraeteSkala,
  )
  if (raster) {
    ctx.drawImage(raster, -halbXPx, -halbYPx, halbXPx * 2, halbYPx * 2)
  } else {
    zeichneKatalogBild(ctx, image, halbXPx, halbYPx)
  }
}

const TEXT_AUSRICHTUNG_HORIZONTAL: Record<
  KatalogTextElement['ausrichtungHorizontal'],
  CanvasTextAlign
> = { links: 'left', mittig: 'center', rechts: 'right' }
const TEXT_AUSRICHTUNG_VERTIKAL: Record<
  KatalogTextElement['ausrichtungVertikal'],
  CanvasTextBaseline
> = { oben: 'top', mittig: 'middle', unten: 'bottom' }

function zeichneKatalogTextElemente(
  ctx: CanvasRenderingContext2D,
  textElemente: KatalogTextElement[] | undefined,
  mitte: { x: number; y: number },
  drehung: number,
  halbXPx: number,
  halbYPx: number,
  groesseWeltPx: number,
  bezugHoehePx: number,
  textSkala: number,
  farbe: string,
  eigeneFarben = false,
) {
  if (!textElemente?.length) return
  ctx.save()
  ctx.fillStyle = farbe
  for (const element of textElemente) {
    const anker = ermittleTextElementAnker(element, drehung, halbXPx, halbYPx, bezugHoehePx)
    ctx.fillStyle = eigeneFarben && element.farbe ? symbolFarbwert(element.farbe) : farbe
    ctx.textAlign = TEXT_AUSRICHTUNG_HORIZONTAL[anker.ausrichtungHorizontal]
    ctx.textBaseline = TEXT_AUSRICHTUNG_VERTIKAL[anker.ausrichtungVertikal]
    const schrift = Math.max(6, element.groesseAnteil * groesseWeltPx * textSkala)
    ctx.font = `${schrift}px sans-serif`
    const zeilen = textZeilen(element)
    const gedreht = anker.zeichenDrehung !== 0
    const ax = mitte.x + anker.x
    const ay = mitte.y + anker.y
    if (gedreht) {
      ctx.save()
      ctx.translate(ax, ay)
      ctx.rotate(-anker.zeichenDrehung)
    }
    zeilen.forEach((zeile, i) => {
      const versatz = zeilenVersatz(i, zeilen.length, anker.ausrichtungVertikal)
      const dy = versatz * schrift * TEXT_ZEILENABSTAND
      if (gedreht) ctx.fillText(zeile, 0, dy)
      else ctx.fillText(zeile, ax, ay + dy)
    })
    if (gedreht) ctx.restore()
  }
  ctx.restore()
}

const BESCHRIFTUNG_ABSTAND_PX = 6

type BeschriftungsPosition = 'rechts' | 'links' | 'oben' | 'unten'

function standardBeschriftungsposition(rahmen?: KomponentenRenderKontext): BeschriftungsPosition {
  return rahmen?.schaltplan ? 'links' : 'rechts'
}

function ermittleBeschriftungsAnker(
  position: BeschriftungsPosition,
  mitte: { x: number; y: number },
  halbXPx: number,
  halbYPx: number,
  schriftgroesse: number,
  zeilenabstand: number,
  anzahlZeilen: number,
): { x: number; ersteZeileY: number; textAlign: CanvasTextAlign } {
  const blockHoehe = (anzahlZeilen - 1) * zeilenabstand
  switch (position) {
    case 'links':
      return {
        x: mitte.x - halbXPx - BESCHRIFTUNG_ABSTAND_PX,
        ersteZeileY: mitte.y - blockHoehe / 2,
        textAlign: 'right',
      }
    case 'oben':
      return {
        x: mitte.x,
        ersteZeileY: mitte.y - halbYPx - BESCHRIFTUNG_ABSTAND_PX - schriftgroesse / 2 - blockHoehe,
        textAlign: 'center',
      }
    case 'unten':
      return {
        x: mitte.x,
        ersteZeileY: mitte.y + halbYPx + BESCHRIFTUNG_ABSTAND_PX + schriftgroesse / 2,
        textAlign: 'center',
      }
    case 'rechts':
    default:
      return {
        x: mitte.x + halbXPx + BESCHRIFTUNG_ABSTAND_PX,
        ersteZeileY: mitte.y - blockHoehe / 2,
        textAlign: 'left',
      }
  }
}

interface KomponentenBeschriftungsBlock {
  schriftgroesse: number
  zeilenabstand: number
  textAlign: CanvasTextAlign
  textX: number
  ersteZeileY: number
  rechteck: Bildschirmrechteck
}

function ermittleBeschriftungsBlock(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'komponente' }>,
  mitte: { x: number; y: number },
  halbXPx: number,
  halbYPx: number,
  zeilen: readonly string[],
  textSkala: number,
  standardPosition: BeschriftungsPosition,
): KomponentenBeschriftungsBlock {
  const kombiSkala = eingerechneterKombinationsFaktor(objekt)
  const schriftgroesse = 11 * view.zoomFaktor() * textSkala * kombiSkala
  const zeilenabstand = schriftgroesse + 2
  ctx.font = `${schriftgroesse}px sans-serif`
  const breite = Math.max(...zeilen.map((zeile) => ctx.measureText(zeile).width))
  const hoehe = (zeilen.length - 1) * zeilenabstand + schriftgroesse
  const anker = ermittleBeschriftungsAnker(
    objekt.beschriftungsposition ?? standardPosition,
    mitte,
    halbXPx,
    halbYPx,
    schriftgroesse,
    zeilenabstand,
    zeilen.length,
  )
  let links =
    anker.textAlign === 'left'
      ? anker.x
      : anker.textAlign === 'right'
        ? anker.x - breite
        : anker.x - breite / 2
  let oben = anker.ersteZeileY - schriftgroesse / 2
  const versatz = objekt.beschriftungVersatz
  if (versatz) {
    const blockMitte = view.worldToScreen({
      x: objekt.position.x + versatz.x,
      y: objekt.position.y + versatz.y,
    })
    links = blockMitte.x - breite / 2
    oben = blockMitte.y - hoehe / 2
  }
  return {
    schriftgroesse,
    zeilenabstand,
    textAlign: anker.textAlign,
    textX:
      anker.textAlign === 'left'
        ? links
        : anker.textAlign === 'right'
          ? links + breite
          : links + breite / 2,
    ersteZeileY: oben + schriftgroesse / 2,
    rechteck: { x: links, y: oben, breite, hoehe },
  }
}

function zeichneKomponentenBeschriftung(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'komponente' }>,
  mitte: { x: number; y: number },
  halbXPx: number,
  halbYPx: number,
  zeilen: string[],
  textSkala: number,
  standardPosition: BeschriftungsPosition,
) {
  ctx.save()
  const block = ermittleBeschriftungsBlock(
    ctx,
    view,
    objekt,
    mitte,
    halbXPx,
    halbYPx,
    zeilen,
    textSkala,
    standardPosition,
  )
  ctx.fillStyle = objekt.farbe
  ctx.textAlign = block.textAlign
  ctx.textBaseline = 'middle'
  let y = block.ersteZeileY
  for (const zeile of zeilen) {
    ctx.fillText(zeile, block.textX, y)
    y += block.zeilenabstand
  }
  ctx.restore()
}

function zeichneBemassung(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'bemassung' }>,
) {
  const a = objekt.start
  const b = objekt.ende
  const laenge = Math.hypot(b.x - a.x, b.y - a.y)
  if (laenge === 0) return
  const richtung = { x: (b.x - a.x) / laenge, y: (b.y - a.y) / laenge }
  const normale = { x: -richtung.y, y: richtung.x }
  const versatz = objekt.versatz
  const a2 = { x: a.x + normale.x * versatz, y: a.y + normale.y * versatz }
  const b2 = { x: b.x + normale.x * versatz, y: b.y + normale.y * versatz }

  const aS = view.worldToScreen(a)
  const bS = view.worldToScreen(b)
  const a2S = view.worldToScreen(a2)
  const b2S = view.worldToScreen(b2)

  ctx.beginPath()
  ctx.moveTo(aS.x, aS.y)
  ctx.lineTo(a2S.x, a2S.y)
  ctx.moveTo(bS.x, bS.y)
  ctx.lineTo(b2S.x, b2S.y)
  ctx.moveTo(a2S.x, a2S.y)
  ctx.lineTo(b2S.x, b2S.y)
  ctx.stroke()

  zeichnePfeil(ctx, a2S, b2S)
  zeichnePfeil(ctx, b2S, a2S)

  const text = objekt.textOverride ?? `${laenge.toFixed(2)} m`
  const mitte = { x: (a2S.x + b2S.x) / 2, y: (a2S.y + b2S.y) / 2 }
  const schriftgroesse = 12 * view.zoomFaktor()
  ctx.save()
  ctx.fillStyle = objekt.farbe
  ctx.font = `${schriftgroesse}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(text, mitte.x, mitte.y - 3)
  ctx.restore()
}

function zeichneBemassungsreihe(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'bemassungsreihe' }>,
) {
  const geometrie = ermittleBemassungsreiheGeometrie(objekt)

  ctx.beginPath()
  for (const hilfslinie of geometrie.hilfslinien) {
    const von = view.worldToScreen(hilfslinie.von)
    const bis = view.worldToScreen(hilfslinie.bis)
    ctx.moveTo(von.x, von.y)
    ctx.lineTo(bis.x, bis.y)
  }
  for (const masslinie of geometrie.masslinien) {
    const von = view.worldToScreen(masslinie.von)
    const bis = view.worldToScreen(masslinie.bis)
    ctx.moveTo(von.x, von.y)
    ctx.lineTo(bis.x, bis.y)
  }
  ctx.stroke()

  const schriftgroesse = 12 * view.zoomFaktor()
  for (const masslinie of geometrie.masslinien) {
    const von = view.worldToScreen(masslinie.von)
    const bis = view.worldToScreen(masslinie.bis)
    zeichnePfeil(ctx, von, bis)
    zeichnePfeil(ctx, bis, von)
    ctx.save()
    ctx.fillStyle = objekt.farbe
    ctx.font = `${schriftgroesse}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`${masslinie.laenge.toFixed(2)} m`, (von.x + bis.x) / 2, (von.y + bis.y) / 2 - 3)
    ctx.restore()
  }
}

function zeichneTreppe(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'treppe' }>,
  geschossHoehe: number | null | undefined,
  tp: Uebersetzer,
) {
  const schnitt = geschossHoehe === undefined ? null : treppenSchnitt(objekt, geschossHoehe)
  if (schnitt) {
    zeichneGeschnitteneTreppe(ctx, view, objekt, schnitt)
    zeichneStufenzahl(ctx, view, objekt, schnitt.pfeilUnten[0], tp)
    return
  }
  const geometrie = ermittleTreppenGeometrie(objekt)

  const konturScreen = (geometrie.kontur ?? rechteckEcken(objekt)).map((p) => view.worldToScreen(p))
  ctx.beginPath()
  ctx.moveTo(konturScreen[0].x, konturScreen[0].y)
  for (const p of konturScreen.slice(1)) ctx.lineTo(p.x, p.y)
  ctx.closePath()
  ctx.stroke()

  ctx.beginPath()
  for (const [a, b] of geometrie.stufenlinien) {
    const aS = view.worldToScreen(a)
    const bS = view.worldToScreen(b)
    ctx.moveTo(aS.x, aS.y)
    ctx.lineTo(bS.x, bS.y)
  }
  ctx.stroke()

  const pfeilScreen = geometrie.pfeilPunkte.map((p) => view.worldToScreen(p))
  ctx.save()
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(pfeilScreen[0].x, pfeilScreen[0].y)
  for (const p of pfeilScreen.slice(1)) ctx.lineTo(p.x, p.y)
  ctx.stroke()
  const spitze = pfeilScreen[pfeilScreen.length - 1]
  const vorSpitze = pfeilScreen[pfeilScreen.length - 2] ?? pfeilScreen[0]
  zeichnePfeil(ctx, spitze, vorSpitze)
  ctx.restore()

  zeichneStufenzahl(ctx, view, objekt, geometrie.pfeilPunkte[0], tp)
}

function zeichneStufenzahl(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'treppe' }>,
  antritt: Point,
  tp: Uebersetzer,
) {
  if (!objekt.beschriftungSichtbar) return
  const schriftgroessePx = Math.max(8, view.laengeToScreen(0.15))
  const antrittS = view.worldToScreen(antritt)
  ctx.save()
  ctx.fillStyle = objekt.farbe
  ctx.font = `${schriftgroessePx}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(
    tp('beschriftung.treppe.stufen', { n: objekt.stufenanzahl }),
    antrittS.x,
    antrittS.y - 4,
  )
  ctx.restore()
}

function zeichneGeschnitteneTreppe(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'treppe' }>,
  schnitt: TreppenSchnitt,
) {
  const eigenesMuster = dashMuster(objekt.linientyp, objekt.strichstaerke)
  const gestrichelt = dashMuster('gestrichelt', objekt.strichstaerke)
  ctx.setLineDash(gestrichelt)
  zeichnePolygone(ctx, view, schnitt.oben)
  zeichnePolylinie(ctx, view, schnitt.pfeilOben)
  ctx.setLineDash(eigenesMuster)
  zeichnePolygone(ctx, view, schnitt.unten)
  ctx.save()
  ctx.setLineDash([])
  zeichnePolylinie(ctx, view, schnitt.pfeilUnten)
  zeichnePolylinie(ctx, view, schnitt.schnittlinie)
  zeichnePfeilAmEnde(ctx, view, schnitt.pfeilOben)
  ctx.restore()
}

export function zeichneTreppeVonUnten(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'treppe' }>,
  geschossHoehe: number | null,
) {
  const schnitt = treppenSchnitt(objekt, geschossHoehe)
  if (!schnitt) return
  ctx.save()
  ctx.strokeStyle = objekt.farbe
  ctx.lineWidth = objekt.strichstaerke
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.setLineDash(dashMuster(objekt.linientyp, objekt.strichstaerke))
  zeichnePolygone(ctx, view, schnitt.oben)
  ctx.setLineDash([])
  zeichnePolylinie(ctx, view, schnitt.pfeilOben)
  zeichnePolylinie(ctx, view, schnitt.schnittlinie)
  zeichnePfeilAmEnde(ctx, view, schnitt.pfeilOben)
  ctx.restore()
}

export function zeichneTreppenDerEtageDarunter(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  zeichnung: Zeichnung,
  blatt: Blatt,
) {
  const unten = etageDarunter(zeichnung, blatt)
  if (!unten) return
  const treppen = sichtbareObjekteAufBlatt(unten).filter(
    (o): o is Extract<Objekt, { type: 'treppe' }> => o.type === 'treppe',
  )
  if (treppen.length === 0) return
  const hoehe = treppenGeschosshoehe(zeichnung, unten)
  for (const treppe of treppen) zeichneTreppeVonUnten(ctx, view, treppe, hoehe)
}

function zeichnePolygone(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  polygone: readonly Point[][],
) {
  ctx.beginPath()
  for (const polygon of polygone) {
    const punkte = polygon.map((p) => view.worldToScreen(p))
    ctx.moveTo(punkte[0].x, punkte[0].y)
    for (const p of punkte.slice(1)) ctx.lineTo(p.x, p.y)
    ctx.closePath()
  }
  ctx.stroke()
}

function zeichnePolylinie(ctx: CanvasRenderingContext2D, view: ViewTransform, punkte: Point[]) {
  if (punkte.length < 2) return
  const s = punkte.map((p) => view.worldToScreen(p))
  ctx.beginPath()
  ctx.moveTo(s[0].x, s[0].y)
  for (const p of s.slice(1)) ctx.lineTo(p.x, p.y)
  ctx.stroke()
}

function zeichnePfeilAmEnde(ctx: CanvasRenderingContext2D, view: ViewTransform, punkte: Point[]) {
  if (punkte.length < 2) return
  const spitze = view.worldToScreen(punkte[punkte.length - 1])
  const vorSpitze = view.worldToScreen(punkte[punkte.length - 2])
  zeichnePfeil(ctx, spitze, vorSpitze)
}

function zeichnePfeil(
  ctx: CanvasRenderingContext2D,
  spitze: { x: number; y: number },
  richtungZu: { x: number; y: number },
) {
  const winkel = Math.atan2(richtungZu.y - spitze.y, richtungZu.x - spitze.x)
  const laenge = 8
  const breite = 4
  ctx.save()
  ctx.beginPath()
  ctx.translate(spitze.x, spitze.y)
  ctx.rotate(winkel)
  ctx.moveTo(0, 0)
  ctx.lineTo(laenge, breite)
  ctx.lineTo(laenge, -breite)
  ctx.closePath()
  ctx.fillStyle = ctx.strokeStyle as string
  ctx.fill()
  ctx.restore()
}

function zeichneSchraffur(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'schraffur' }>,
) {
  if (objekt.kontur.length < 3) return
  const punkte = objekt.kontur.map((p) => view.worldToScreen(p))
  const pfad = () => {
    ctx.moveTo(punkte[0].x, punkte[0].y)
    for (const p of punkte.slice(1)) ctx.lineTo(p.x, p.y)
    ctx.closePath()
  }
  fuelleFlaeche(
    ctx,
    view,
    {
      art: 'schraffur',
      farbe: objekt.farbe,
      muster: objekt.muster,
      abstand: objekt.abstand,
      deckkraft: 1,
    },
    pfad,
    () => rahmenAusPunkten(punkte),
  )

  ctx.save()
  ctx.strokeStyle = objekt.farbe
  ctx.lineWidth = objekt.strichstaerke
  ctx.stroke()
  ctx.restore()
}

export interface Bildschirmrechteck {
  x: number
  y: number
  breite: number
  hoehe: number
}

export function ermittleKomponentenFlaechen(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekte: readonly Objekt[],
  rahmen?: KomponentenRenderKontext,
): Bildschirmrechteck[] {
  const flaechen: Bildschirmrechteck[] = []
  const blattAnzeige = rahmen?.blattAnzeige ?? STANDARD_BLATT_ANZEIGE
  for (const objekt of objekte) {
    if (objekt.type !== 'komponente') continue
    const { halbXPx, halbYPx, mitte } = ermittleSymbolGeometrie(objekt, view, blattAnzeige)
    flaechen.push({
      x: mitte.x - halbXPx,
      y: mitte.y - halbYPx,
      breite: halbXPx * 2,
      hoehe: halbYPx * 2,
    })
    const beschriftung = ermittleKomponentenBeschriftungsRechteck(ctx, view, objekt, rahmen)
    if (beschriftung) flaechen.push(beschriftung)
    const hoehenAngabe = ermittleReihenHoehenBlock(ctx, view, objekt, rahmen)
    if (hoehenAngabe) flaechen.push(hoehenAngabe.rechteck)
  }
  return flaechen
}

const HOEHENANGABE_ABSTAND_METER = 0.005

export function ermittleReihenHoehenBlock(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'komponente' }>,
  rahmen?: KomponentenRenderKontext,
): { text: string; schriftgroesse: number; rechteck: Bildschirmrechteck } | null {
  const stelle = objekt.wandstelle
  const kombination = objekt.kombination
  if (!stelle || !kombination || stehtAllein(objekt) || rahmen?.schaltplan) return null
  const blattAnzeige = rahmen?.blattAnzeige ?? STANDARD_BLATT_ANZEIGE
  if (
    !effektiveSichtbarkeit(
      objekt.installationshoeheSichtbar,
      blattAnzeige.installationshoeheSichtbar,
    )
  ) {
    return null
  }
  const roh = { x: Math.cos(stelle.richtung), y: Math.sin(stelle.richtung) }
  const p0 = view.worldToScreen(stelle.punkt)
  const p1 = view.worldToScreen({ x: stelle.punkt.x + roh.x, y: stelle.punkt.y + roh.y })
  const waagerechtImBild = Math.abs(p1.x - p0.x) >= Math.abs(p1.y - p0.y)
  const u = waagerechtImBild && p1.x < p0.x ? { x: -roh.x, y: -roh.y } : roh
  const anfang = (g: Extract<Objekt, { type: 'komponente' }>) =>
    (g.position.x - stelle.punkt.x) * u.x +
    (g.position.y - stelle.punkt.y) * u.y -
    breiteEntlangWand(g) / 2
  const alle = rahmen?.alleObjekteAufBlatt ?? []
  const eigenerAnfang = anfang(objekt)
  const aufBlatt = alle.some((o) => o.id === objekt.id)
  const eigeneVerlegung = verlegungVon(objekt)
  let ersteDerReihe = true
  let ersteDerKombination = true
  let gemischt = false
  if (aufBlatt) {
    for (const o of alle) {
      if (
        o.type !== 'komponente' ||
        o.id === objekt.id ||
        o.wandstelle?.id !== stelle.id ||
        o.kombination?.hoeheCm !== kombination.hoeheCm ||
        stehtAllein(o)
      ) {
        continue
      }
      if (verlegungVon(o) !== eigeneVerlegung) gemischt = true
      const a = anfang(o)
      const davor =
        a < eigenerAnfang - 1e-6 ||
        (a < eigenerAnfang + 1e-6 &&
          (o.kombination.nr < kombination.nr ||
            (o.kombination.nr === kombination.nr && o.kombination.platz < kombination.platz)))
      if (!davor) continue
      ersteDerReihe = false
      if (o.kombination.nr === kombination.nr) ersteDerKombination = false
    }
  }
  const tp = planTp(rahmen)
  const kuerzel = verlegungsText(eigeneVerlegung, tp)
  let text: string
  if (ersteDerReihe) text = `${reihenHoehenText(kombination.hoeheCm, tp)} ${kuerzel}`
  else if (gemischt && ersteDerKombination) text = kuerzel
  else return null

  const { textSkala, halbXPx, mitte } = ermittleSymbolGeometrie(objekt, view, blattAnzeige)
  const symbolSkala =
    halbXPx / (view.laengeToScreen(objekt.breiteWelt ?? objekt.groesseWelt) / 2 || 1)
  const halbeBreite = (breiteEntlangWand(objekt) / 2) * symbolSkala
  const vorn = view.worldToScreen({ x: objekt.position.x - u.x, y: objekt.position.y - u.y })
  const laenge = Math.hypot(vorn.x - mitte.x, vorn.y - mitte.y) || 1
  const d = { x: (vorn.x - mitte.x) / laenge, y: (vorn.y - mitte.y) / laenge }
  const schriftgroesse =
    11 * view.zoomFaktor() * textSkala * eingerechneterKombinationsFaktor(objekt)
  const hoehenDerStelle = [
    ...new Set(
      alle
        .filter(
          (o): o is Extract<Objekt, { type: 'komponente' }> =>
            o.type === 'komponente' &&
            o.wandstelle?.id === stelle.id &&
            o.kombination !== undefined &&
            !stehtAllein(o),
        )
        .map((o) => o.kombination!.hoeheCm),
    ),
  ].sort((a, b) => b - a)
  const rang =
    Math.abs(d.x) >= Math.SQRT1_2 ? 0 : Math.max(0, hoehenDerStelle.indexOf(kombination.hoeheCm))
  const abstand =
    view.laengeToScreen(halbeBreite + HOEHENANGABE_ABSTAND_METER * 2) +
    schriftgroesse * 0.3 +
    rang * schriftgroesse * 1.25
  const anker = { x: mitte.x + d.x * abstand, y: mitte.y + d.y * abstand }
  ctx.save()
  ctx.font = `${schriftgroesse}px sans-serif`
  const breite = ctx.measureText(text).width
  ctx.restore()
  const hoehe = schriftgroesse
  const x =
    Math.abs(d.x) >= Math.SQRT1_2
      ? d.x < 0
        ? anker.x - breite
        : anker.x
      : anker.x - breite / 2 + (d.x * breite) / 2
  const y =
    Math.abs(d.x) >= Math.SQRT1_2 ? anker.y - hoehe / 2 : d.y < 0 ? anker.y - hoehe : anker.y
  return { text, schriftgroesse, rechteck: { x, y, breite, hoehe } }
}

export function ermittleKomponentenBeschriftungsRechteck(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'komponente' }>,
  rahmen?: KomponentenRenderKontext,
): Bildschirmrechteck | null {
  const blattAnzeige = rahmen?.blattAnzeige ?? STANDARD_BLATT_ANZEIGE
  const zeilen = beschriftungszeilenMitReihe(objekt, rahmen)
  if (zeilen.length === 0) return null
  const { halbXPx, halbYPx, textSkala, mitte } = ermittleSymbolGeometrie(objekt, view, blattAnzeige)
  ctx.save()
  const block = ermittleBeschriftungsBlock(
    ctx,
    view,
    objekt,
    mitte,
    halbXPx,
    halbYPx,
    zeilen,
    textSkala,
    standardBeschriftungsposition(rahmen),
  )
  ctx.restore()
  return block.rechteck
}

const ABGANG_UNTER_KENNZEICHEN_PX = 2

export function abgangsLinksAnker(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Extract<Objekt, { type: 'komponente' }>,
  rahmen?: KomponentenRenderKontext,
): Point {
  const blattAnzeige = rahmen?.blattAnzeige ?? STANDARD_BLATT_ANZEIGE
  const { halbXPx, halbYPx, textSkala, mitte } = ermittleSymbolGeometrie(objekt, view, blattAnzeige)
  const x = mitte.x - halbXPx - BESCHRIFTUNG_ABSTAND_PX
  let y = mitte.y - halbYPx
  const standard = standardBeschriftungsposition(rahmen)
  const zeilen = beschriftungszeilenMitReihe(objekt, rahmen)
  if (
    zeilen.length > 0 &&
    (objekt.beschriftungsposition ?? standard) === 'links' &&
    !objekt.beschriftungVersatz
  ) {
    ctx.save()
    const block = ermittleBeschriftungsBlock(
      ctx,
      view,
      objekt,
      mitte,
      halbXPx,
      halbYPx,
      zeilen,
      textSkala,
      standard,
    )
    ctx.restore()
    y = block.rechteck.y + block.rechteck.hoehe + ABGANG_UNTER_KENNZEICHEN_PX
  }
  return view.screenToWorld({ x, y })
}

function eigeneBeschriftungszeilen(
  objekt: Extract<Objekt, { type: 'komponente' }>,
  rahmen?: KomponentenRenderKontext,
): string[] {
  const blattAnzeige = rahmen?.blattAnzeige ?? STANDARD_BLATT_ANZEIGE
  return ermittleBeschriftungszeilen(
    objekt,
    rahmen?.katalogKomponenten ?? [],
    rahmen?.poeSummen?.get(objekt.id),
    rahmen?.traegerMitModulen?.has(objekt.id),
    effektiveSichtbarkeit(objekt.bezeichnungSichtbar, blattAnzeige.bezeichnungSichtbar),
    effektiveSichtbarkeit(objekt.beschriftungSichtbar, blattAnzeige.beschriftungSichtbar),
    !rahmen?.schaltplan &&
      effektiveSichtbarkeit(
        objekt.installationshoeheSichtbar,
        blattAnzeige.installationshoeheSichtbar,
      ),
    rahmen?.querverweisTexte?.get(objekt.id),
    effektiveSichtbarkeit(objekt.kennzeichenSichtbar, blattAnzeige.kennzeichenSichtbar),
    effektiveSichtbarkeit(objekt.stromkreisSichtbar, blattAnzeige.stromkreisSichtbar)
      ? rahmen?.stromkreisTexte?.get(objekt.id)
      : undefined,
    istKlemme(objekt) && klemmeFolgtInReihe(objekt, rahmen?.alleObjekteAufBlatt ?? []),
    planTp(rahmen),
    planSprache(rahmen),
  )
}

export function beschriftungszeilenMitReihe(
  objekt: Extract<Objekt, { type: 'komponente' }>,
  rahmen?: KomponentenRenderKontext,
): string[] {
  const reihen = reihenDerStelle(objekt, rahmen?.alleObjekteAufBlatt)
  if (!reihen) return eigeneBeschriftungszeilen(objekt, rahmen)
  const enden = reihen.map((r) => r[r.length - 1])
  const traeger = enden.reduce((a, b) =>
    b.position.x > a.position.x + 1e-6 ||
    (Math.abs(b.position.x - a.position.x) <= 1e-6 && b.position.y > a.position.y)
      ? b
      : a,
  )
  if (traeger.id !== objekt.id) {
    return objekt.beschriftungVersatz ? eigeneBeschriftungszeilen(objekt, rahmen) : []
  }
  return [...reihen]
    .sort((a, b) => {
      const ea = a[a.length - 1].position
      const eb = b[b.length - 1].position
      return eb.y - ea.y || ea.x - eb.x
    })
    .flatMap((reihe) =>
      reihe
        .filter((g) => g.id === objekt.id || !g.beschriftungVersatz)
        .flatMap((g) => eigeneBeschriftungszeilen(g.id === objekt.id ? objekt : g, rahmen)),
    )
}

function reihenDerStelle(
  objekt: Extract<Objekt, { type: 'komponente' }>,
  alle: readonly Objekt[] | undefined,
): Extract<Objekt, { type: 'komponente' }>[][] | null {
  if (!objekt.kombination || !objekt.wandstelle || stehtAllein(objekt) || !alle) return null
  const stelleId = objekt.wandstelle.id
  const glieder = alle.filter(
    (o): o is Extract<Objekt, { type: 'komponente' }> =>
      o.type === 'komponente' &&
      o.wandstelle?.id === stelleId &&
      o.kombination !== undefined &&
      !stehtAllein(o),
  )
  if (!glieder.some((o) => o.id === objekt.id)) return null
  const jeHoehe = new Map<number, Extract<Objekt, { type: 'komponente' }>[]>()
  for (const g of glieder) {
    const liste = jeHoehe.get(g.kombination!.hoeheCm)
    if (liste) liste.push(g)
    else jeHoehe.set(g.kombination!.hoeheCm, [g])
  }
  return [...jeHoehe.values()].map((reihe) =>
    reihe.sort(
      (a, b) =>
        a.kombination!.nr - b.kombination!.nr || a.kombination!.platz - b.kombination!.platz,
    ),
  )
}

export interface LinienHindernis {
  objektId: string
  punkte: Point[]
  strichstaerkePx: number
}

export function ermittleLinienHindernisse(
  view: ViewTransform,
  objekte: readonly Objekt[],
): LinienHindernis[] {
  const hindernisse: LinienHindernis[] = []
  for (const objekt of objekte) {
    if (objekt.type === 'leitung') {
      for (const segment of abgeleitetePfadSegmente(objekt, objekte)) {
        if (segment.length < 2) continue
        hindernisse.push({
          objektId: objekt.id,
          punkte: segment.map((p) => view.worldToScreen(p)),
          strichstaerkePx: objekt.strichstaerke,
        })
      }
    } else if (objekt.type === 'trunk' && objekt.wegpunkte.length >= 2) {
      hindernisse.push({
        objektId: objekt.id,
        punkte: objekt.wegpunkte.map((p) => view.worldToScreen(p)),
        strichstaerkePx: objekt.strichstaerke,
      })
    }
  }
  return hindernisse
}
