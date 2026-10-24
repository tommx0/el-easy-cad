import type {
  Blatt,
  CatalogComponent,
  Kabeltyp,
  LeitungsObjekt,
  LeitungsZiel,
  Objekt,
  PortSchild,
  Point,
  Zeichnung,
  TrunkObjekt,
  TrunkKante,
} from '../document-model'
import {
  add,
  effektiveSichtbarkeit,
  ermittleNummernschilder,
  ermittleTeilstueckNamen,
  ermittleTrunkKette,
  istBuendelEnde,
  naechsterPunktAufPfad,
  punktAufPfad,
} from '../document-model'
import type { Bildschirmrechteck, LinienHindernis } from './object-renderer'
import type { ViewTransform } from './view-transform'
import { ermittleLeitungsZusatzzeilen, ermittleTrunkZusatzzeilen } from './leitungs-beschriftung'

const NUMMERNSCHILD_RADIUS_PX = 9
const NUMMERNSCHILD_MINDESTABSTAND_PX = 16
const PORTSCHILD_ABSTAND_PX = 16
const BEZEICHNER_HINDERNIS_ABSTAND_PX = 5
const BEZEICHNER_SCHRITT_PX = 6
const BEZEICHNER_MAX_ABSTAND_PX = 90
const PORTSCHILD_MAX_ABSTAND_PX = 140
const FREIES_STUECK_NAHE_ANTEIL = 0.2

export function bezeichnerPosition(
  view: ViewTransform,
  ankerWelt: Point,
  versatz: Point | null | undefined,
  autoLeitlinieVon: Point,
  sucheAuto: () => { mitte: Point; leitlinie: boolean },
): { mitte: Point; leitlinie: boolean; leitlinieVon: Point } {
  if (versatz) {
    return {
      mitte: view.worldToScreen(add(ankerWelt, versatz)),
      leitlinie: true,
      leitlinieVon: view.worldToScreen(ankerWelt),
    }
  }
  return { ...sucheAuto(), leitlinieVon: autoLeitlinieVon }
}

export function zeichneTrunkNummernschilder(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  trunk: TrunkObjekt,
  blatt: Blatt,
  objekteAufBlatt: readonly Objekt[],
  portSchilder: readonly PortSchild[] = [],
  hindernisse: BezeichnerHindernisse = { flaechen: [], linien: [] },
) {
  const ausgeblendet = new Set(
    objekteAufBlatt
      .filter(
        (o) =>
          o.type === 'leitung' &&
          !effektiveSichtbarkeit(o.bezeichnungSichtbar, blatt.leitungBezeichnungSichtbar),
      )
      .map((o) => o.id),
  )
  const schilder = ermittleNummernschilder(trunk, objekteAufBlatt).filter(
    (s) => !ausgeblendet.has(s.leitungId),
  )
  const portSchilderSichtbar = portSchilder.filter((s) => !ausgeblendet.has(s.leitungId))
  const portProLeitung = new Map(portSchilderSichtbar.map((s) => [s.leitungId, s]))
  if (schilder.length === 0 && portSchilderSichtbar.length === 0) return

  const positionen = schilder
    .map((schild) => ({ schild, screen: view.worldToScreen(schild.punkt) }))
    .sort((a, b) => a.screen.x - b.screen.x)
  const versaetze: number[] = new Array(positionen.length).fill(0)
  for (let i = 1; i < positionen.length; i++) {
    const distanz = Math.hypot(
      positionen[i].screen.x - positionen[i - 1].screen.x,
      positionen[i].screen.y - positionen[i - 1].screen.y,
    )
    if (distanz < NUMMERNSCHILD_MINDESTABSTAND_PX) {
      versaetze[i] = versaetze[i - 1] === 0 ? NUMMERNSCHILD_MINDESTABSTAND_PX : -versaetze[i - 1]
    }
  }

  const zoomFaktorSchild = view.zoomFaktor()
  const radiusPx = NUMMERNSCHILD_RADIUS_PX * zoomFaktorSchild

  ctx.save()
  ctx.font = `${11 * zoomFaktorSchild}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  positionen.forEach(({ schild, screen }, i) => {
    const y = screen.y - versaetze[i]
    const portSchild = portProLeitung.get(schild.leitungId)
    if (portSchild) {
      if (schild.art === 'eintritt') {
        const { mitte, leitlinie, leitlinieVon } = bezeichnerPosition(
          view,
          schild.punkt,
          schild.versatz,
          screen,
          () => {
            const position = findePortschildPosition(
              ctx,
              view,
              trunk,
              portSchild,
              zoomFaktorSchild,
              hindernisse,
            )
            return { mitte: { x: position.x, y: position.y }, leitlinie: position.leitlinie }
          },
        )
        if (leitlinie) {
          zeichneBezeichnerLeitlinie(ctx, leitlinieVon, mitte)
        }
        zeichnePille(ctx, mitte.x, mitte.y, portSchild.text, '#2f7dd1', zoomFaktorSchild)
      }
      return
    }
    const { mitte, leitlinie, leitlinieVon } = bezeichnerPosition(
      view,
      schild.punkt,
      schild.versatz,
      { x: screen.x, y },
      () => {
        const t = naechsterPunktAufPfad(trunk.wegpunkte, schild.punkt)?.t ?? 0
        const normale = pfadNormaleAufBildschirm(view, trunk.wegpunkte, t)
        return sucheBezeichnerPosition({
          standardAbstand: 0,
          maxAbstand: BEZEICHNER_MAX_ABSTAND_PX * zoomFaktorSchild,
          schritt: BEZEICHNER_SCHRITT_PX * zoomFaktorSchild,
          richtungen: [normale, { x: -normale.x, y: -normale.y }],
          mitteFuer: (abstand, richtung) => ({
            x: screen.x + richtung.x * abstand,
            y: y + richtung.y * abstand,
          }),
          breite: radiusPx * 2,
          hoehe: radiusPx * 2,
          hindernisse,
          ausgenommeneObjektIds: new Set([trunk.id, schild.leitungId]),
          mindestAbstandHindernis: BEZEICHNER_HINDERNIS_ABSTAND_PX * zoomFaktorSchild,
        })
      },
    )
    if (leitlinie) {
      zeichneBezeichnerLeitlinie(ctx, leitlinieVon, mitte)
    }
    ctx.beginPath()
    ctx.fillStyle = schild.art === 'eintritt' ? '#2f7dd1' : '#7a4fd1'
    ctx.arc(mitte.x, mitte.y, radiusPx, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.fillText(String(schild.nummer), mitte.x, mitte.y + 0.5)
  })

  ctx.restore()
}

function istKomponentenEnde(ziel: LeitungsZiel): boolean {
  return ziel.art === 'dock' || istBuendelEnde(ziel)
}

export function ermittleLeitungsStueckSchildMasse(
  messKontext: CanvasRenderingContext2D,
  zoomFaktorSchild: number,
  zusatzzeilen: readonly string[],
): { breite: number; hoehe: number } {
  const radiusPx = NUMMERNSCHILD_RADIUS_PX * zoomFaktorSchild
  const zeilenHoehe = 12 * zoomFaktorSchild
  messKontext.save()
  messKontext.font = `${11 * zoomFaktorSchild}px sans-serif`
  const zeilenBreite = zusatzzeilen.reduce(
    (max, zeile) => Math.max(max, messKontext.measureText(zeile).width),
    0,
  )
  messKontext.restore()
  return {
    breite: Math.max(radiusPx * 2, zeilenBreite),
    hoehe: radiusPx * 2 + zusatzzeilen.length * zeilenHoehe,
  }
}

export function ermittleLeitungsStueckAutoPosition(
  view: ViewTransform,
  leitung: LeitungsObjekt,
  anker: Point,
  hindernisse: BezeichnerHindernisse,
  pfad: readonly Point[],
  ankerT: number,
  breite: number,
  hoehe: number,
): { mitte: Point; leitlinie: boolean } {
  const zoomFaktorSchild = view.zoomFaktor()
  const normale = pfadNormaleAufBildschirm(view, pfad, ankerT)
  return sucheBezeichnerPosition({
    standardAbstand: 0,
    maxAbstand: BEZEICHNER_MAX_ABSTAND_PX * zoomFaktorSchild,
    schritt: BEZEICHNER_SCHRITT_PX * zoomFaktorSchild,
    richtungen: [normale, { x: -normale.x, y: -normale.y }],
    mitteFuer: (abstand, richtung) => ({
      x: anker.x + richtung.x * abstand,
      y: anker.y + richtung.y * abstand,
    }),
    breite,
    hoehe,
    hindernisse,
    ausgenommeneObjektIds: new Set([leitung.id]),
    mindestAbstandHindernis: BEZEICHNER_HINDERNIS_ABSTAND_PX * zoomFaktorSchild,
  })
}

function zeichneEinLeitungsStueckSchild(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  leitung: LeitungsObjekt,
  hindernisse: BezeichnerHindernisse,
  zusatzzeilen: readonly string[],
  pfad: readonly Point[],
  ankerT: number,
  versatz: Point | null | undefined,
) {
  const ankerWelt = punktAufPfad(pfad as Point[], ankerT)
  const anker = view.worldToScreen(ankerWelt)

  const zoomFaktorSchild = view.zoomFaktor()
  const radiusPx = NUMMERNSCHILD_RADIUS_PX * zoomFaktorSchild

  ctx.save()
  ctx.font = `${11 * zoomFaktorSchild}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const { breite, hoehe } = ermittleLeitungsStueckSchildMasse(ctx, zoomFaktorSchild, zusatzzeilen)

  const { mitte, leitlinie, leitlinieVon } = bezeichnerPosition(
    view,
    ankerWelt,
    versatz,
    anker,
    () =>
      ermittleLeitungsStueckAutoPosition(
        view,
        leitung,
        anker,
        hindernisse,
        pfad,
        ankerT,
        breite,
        hoehe,
      ),
  )

  const kreisMitteY = mitte.y - hoehe / 2 + radiusPx
  if (leitlinie) {
    zeichneBezeichnerLeitlinie(ctx, leitlinieVon, { x: mitte.x, y: kreisMitteY })
  }
  ctx.beginPath()
  ctx.fillStyle = '#6b6b6b'
  ctx.arc(mitte.x, kreisMitteY, radiusPx, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.fillText(String(leitung.nummer), mitte.x, kreisMitteY + 0.5)

  ctx.fillStyle = '#4a4a4a'
  const zeilenHoehe = 12 * zoomFaktorSchild
  zusatzzeilen.forEach((zeile, i) => {
    ctx.fillText(zeile, mitte.x, kreisMitteY + radiusPx + zeilenHoehe * (i + 0.5))
  })
  ctx.restore()
}

export function zeichneFreieLeitungsNummer(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  leitung: LeitungsObjekt,
  blatt: Blatt,
  hindernisse: BezeichnerHindernisse = { flaechen: [], linien: [] },
  kabeltypen: readonly Kabeltyp[] = [],
  katalog: readonly CatalogComponent[] = [],
) {
  if (!effektiveSichtbarkeit(leitung.bezeichnungSichtbar, blatt.leitungBezeichnungSichtbar)) return
  const zusatzzeilen = ermittleLeitungsZusatzzeilen(leitung, blatt, kabeltypen, katalog)
  const letzterIndex = leitung.pfadSegmente.length - 1
  leitung.pfadSegmente.forEach((pfad, index) => {
    if (!pfad || pfad.length < 2) return
    const amStart = letzterIndex > 0 && index === 0 && istKomponentenEnde(leitung.start)
    const amEnde = letzterIndex > 0 && index === letzterIndex && istKomponentenEnde(leitung.ziel)
    const ankerT = amStart
      ? FREIES_STUECK_NAHE_ANTEIL
      : amEnde
        ? 1 - FREIES_STUECK_NAHE_ANTEIL
        : 0.5
    const versatz = letzterIndex === 0 ? leitung.nummerVersatz : null
    zeichneEinLeitungsStueckSchild(
      ctx,
      view,
      leitung,
      hindernisse,
      zusatzzeilen,
      pfad,
      ankerT,
      versatz,
    )
  })
}

function pfadNormaleAufBildschirm(
  view: ViewTransform,
  pfad: readonly Point[],
  t: number,
): { x: number; y: number } {
  const delta = 0.01
  const a = view.worldToScreen(punktAufPfad(pfad as Point[], Math.max(0, t - delta)))
  const b = view.worldToScreen(punktAufPfad(pfad as Point[], Math.min(1, t + delta)))
  const dx = b.x - a.x
  const dy = b.y - a.y
  const laenge = Math.hypot(dx, dy)
  if (laenge === 0) return { x: 0, y: 1 }
  const normale = { x: -dy / laenge, y: dx / laenge }
  if (normale.y < 0 || (normale.y === 0 && normale.x < 0)) {
    return { x: -normale.x, y: -normale.y }
  }
  return normale
}

export function schildBeruehrtFlaeche(
  mitteX: number,
  mitteY: number,
  breite: number,
  hoehe: number,
  hindernis: Bildschirmrechteck,
  abstand: number,
): boolean {
  return (
    mitteX - breite / 2 < hindernis.x + hindernis.breite + abstand &&
    mitteX + breite / 2 > hindernis.x - abstand &&
    mitteY - hoehe / 2 < hindernis.y + hindernis.hoehe + abstand &&
    mitteY + hoehe / 2 > hindernis.y - abstand
  )
}

export function schildBeruehrtLinie(
  mitteX: number,
  mitteY: number,
  breite: number,
  hoehe: number,
  linie: readonly Point[],
  strichstaerkePx: number,
  abstand: number,
): boolean {
  if (linie.length < 2) return false
  const schwelle = strichstaerkePx / 2 + abstand
  const testpunkte: Point[] = [
    { x: mitteX, y: mitteY },
    { x: mitteX - breite / 2, y: mitteY - hoehe / 2 },
    { x: mitteX + breite / 2, y: mitteY - hoehe / 2 },
    { x: mitteX - breite / 2, y: mitteY + hoehe / 2 },
    { x: mitteX + breite / 2, y: mitteY + hoehe / 2 },
    { x: mitteX, y: mitteY - hoehe / 2 },
    { x: mitteX, y: mitteY + hoehe / 2 },
    { x: mitteX - breite / 2, y: mitteY },
    { x: mitteX + breite / 2, y: mitteY },
  ]
  return testpunkte.some(
    (p) => (naechsterPunktAufPfad(linie as Point[], p)?.distanz ?? Infinity) < schwelle,
  )
}

export interface BezeichnerHindernisse {
  flaechen: readonly Bildschirmrechteck[]
  linien: readonly LinienHindernis[]
}

export function bezeichnerBeruehrtHindernis(
  mitteX: number,
  mitteY: number,
  breite: number,
  hoehe: number,
  hindernisse: BezeichnerHindernisse,
  ausgenommeneObjektIds: ReadonlySet<string>,
  abstand: number,
): boolean {
  if (
    hindernisse.flaechen.some((f) =>
      schildBeruehrtFlaeche(mitteX, mitteY, breite, hoehe, f, abstand),
    )
  ) {
    return true
  }
  return hindernisse.linien.some(
    (l) =>
      !ausgenommeneObjektIds.has(l.objektId) &&
      schildBeruehrtLinie(mitteX, mitteY, breite, hoehe, l.punkte, l.strichstaerkePx, abstand),
  )
}

export function trimmePolylinieAmEnde(
  punkte: readonly Point[],
  vomStart: boolean,
  distanz: number,
): Point[] {
  const liste = vomStart ? [...punkte] : [...punkte].reverse()
  if (liste.length < 2) return []
  let rest = distanz
  for (let i = 0; i < liste.length - 1; i++) {
    const a = liste[i]
    const b = liste[i + 1]
    const segLaenge = Math.hypot(b.x - a.x, b.y - a.y)
    if (segLaenge <= rest) {
      rest -= segLaenge
      continue
    }
    const anteil = segLaenge === 0 ? 0 : rest / segLaenge
    const geschnitten: Point[] = [
      { x: a.x + (b.x - a.x) * anteil, y: a.y + (b.y - a.y) * anteil },
      ...liste.slice(i + 1),
    ]
    return vomStart ? geschnitten : geschnitten.reverse()
  }
  return []
}

export function hindernisseOhneEigeneNaehe(
  hindernisse: BezeichnerHindernisse,
  eigenerTrunkId: string,
  vomStart: boolean,
  distanz: number,
): BezeichnerHindernisse {
  const linien = hindernisse.linien.flatMap((l) => {
    if (l.objektId !== eigenerTrunkId) return [l]
    const punkte = trimmePolylinieAmEnde(l.punkte, vomStart, distanz)
    return punkte.length >= 2 ? [{ ...l, punkte }] : []
  })
  return { flaechen: hindernisse.flaechen, linien }
}

export function sucheBezeichnerPosition(opts: {
  standardAbstand: number
  maxAbstand: number
  schritt: number
  richtungen: readonly Point[]
  mitteFuer: (abstand: number, richtung: Point) => Point
  breite: number
  hoehe: number
  hindernisse: BezeichnerHindernisse
  ausgenommeneObjektIds: ReadonlySet<string>
  mindestAbstandHindernis?: number
}): { mitte: Point; leitlinie: boolean } {
  const mindestAbstand = opts.mindestAbstandHindernis ?? BEZEICHNER_HINDERNIS_ABSTAND_PX
  for (const richtung of opts.richtungen) {
    for (let abstand = opts.standardAbstand; abstand <= opts.maxAbstand; abstand += opts.schritt) {
      const mitte = opts.mitteFuer(abstand, richtung)
      if (
        !bezeichnerBeruehrtHindernis(
          mitte.x,
          mitte.y,
          opts.breite,
          opts.hoehe,
          opts.hindernisse,
          opts.ausgenommeneObjektIds,
          mindestAbstand,
        )
      ) {
        return { mitte, leitlinie: abstand > opts.standardAbstand }
      }
    }
  }
  return { mitte: opts.mitteFuer(opts.standardAbstand, opts.richtungen[0]), leitlinie: false }
}

export function zeichneBezeichnerLeitlinie(ctx: CanvasRenderingContext2D, von: Point, nach: Point) {
  ctx.save()
  ctx.strokeStyle = 'rgba(120, 120, 120, 0.8)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(von.x, von.y)
  ctx.lineTo(nach.x, nach.y)
  ctx.stroke()
  ctx.restore()
}

function findePortschildPosition(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  trunk: TrunkObjekt,
  schild: PortSchild,
  zoomFaktor: number,
  hindernisse: BezeichnerHindernisse,
): { x: number; y: number; leitlinie: boolean } {
  const eintritt = view.worldToScreen(schild.punkt)
  const normale = pfadNormaleAufBildschirm(view, trunk.wegpunkte, schild.t)
  let bevorzugt = normale
  if (schild.ankerPunkt) {
    const anker = view.worldToScreen(schild.ankerPunkt)
    const seite = (anker.x - eintritt.x) * normale.x + (anker.y - eintritt.y) * normale.y
    if (seite < 0) bevorzugt = { x: -normale.x, y: -normale.y }
  }

  const paddingX = 6 * zoomFaktor
  const breite = ctx.measureText(schild.text).width + paddingX * 2
  const hoehe = 16 * zoomFaktor
  const startAbstand = PORTSCHILD_ABSTAND_PX * zoomFaktor + hoehe / 2

  const { mitte, leitlinie } = sucheBezeichnerPosition({
    standardAbstand: startAbstand,
    maxAbstand: PORTSCHILD_MAX_ABSTAND_PX * zoomFaktor,
    schritt: BEZEICHNER_SCHRITT_PX * zoomFaktor,
    richtungen: [bevorzugt, { x: -bevorzugt.x, y: -bevorzugt.y }],
    mitteFuer: (abstand, richtung) => ({
      x: eintritt.x + richtung.x * abstand,
      y: eintritt.y + richtung.y * abstand,
    }),
    breite,
    hoehe,
    hindernisse,
    ausgenommeneObjektIds: new Set([trunk.id, schild.leitungId]),
    mindestAbstandHindernis: BEZEICHNER_HINDERNIS_ABSTAND_PX * zoomFaktor,
  })
  return { x: mitte.x, y: mitte.y, leitlinie }
}

function zeichnePille(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  farbe: string,
  zoomFaktor: number,
) {
  const paddingX = 6 * zoomFaktor
  const hoehe = 16 * zoomFaktor
  const breite = ctx.measureText(text).width + paddingX * 2
  const radius = hoehe / 2
  ctx.beginPath()
  ctx.roundRect(x - breite / 2, y - hoehe / 2, breite, hoehe, radius)
  ctx.fillStyle = farbe
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, x, y + 0.5)
}

export const ENDE_SCHILD_ABSTAND_PX = 14

const VERBINDUNGSLABEL_ABSTAND_NAEHERUNG_PX = 40

export function trunkEndeStandardVersatzWelt(
  view: ViewTransform,
  trunk: TrunkObjekt,
  endeIndex: 0 | 1,
): Point {
  if (trunk.enden[endeIndex].verbundenesEnde) {
    return { x: view.laengeToWorld(VERBINDUNGSLABEL_ABSTAND_NAEHERUNG_PX), y: 0 }
  }
  const letzter = trunk.wegpunkte.length - 1
  const punkt = endeIndex === 0 ? trunk.wegpunkte[0] : trunk.wegpunkte[letzter]
  const nachbarIndex = endeIndex === 0 ? Math.min(1, letzter) : Math.max(0, letzter - 1)
  const nachbar = trunk.wegpunkte[nachbarIndex]
  const dx = punkt.x - nachbar.x
  const dy = punkt.y - nachbar.y
  const laenge = Math.hypot(dx, dy)
  const richtung = laenge > 0 ? { x: dx / laenge, y: dy / laenge } : { x: 0, y: 1 }
  const abstand = view.laengeToWorld(ENDE_SCHILD_ABSTAND_PX)
  return { x: richtung.x * abstand, y: richtung.y * abstand }
}

export function trunkDurchgangStandardVersatzWelt(
  view: ViewTransform,
  trunk: TrunkObjekt,
  t: number,
  portSchild: PortSchild | undefined,
): Point {
  if (!portSchild) return { x: 0, y: 0 }
  const eintritt = view.worldToScreen(punktAufPfad(trunk.wegpunkte, t))
  const normale = pfadNormaleAufBildschirm(view, trunk.wegpunkte, t)
  let bevorzugt = normale
  if (portSchild.ankerPunkt) {
    const anker = view.worldToScreen(portSchild.ankerPunkt)
    const seite = (anker.x - eintritt.x) * normale.x + (anker.y - eintritt.y) * normale.y
    if (seite < 0) bevorzugt = { x: -normale.x, y: -normale.y }
  }
  const zoomFaktor = view.zoomFaktor()
  const hoehe = 16 * zoomFaktor
  const abstandWelt = view.laengeToWorld(PORTSCHILD_ABSTAND_PX * zoomFaktor + hoehe / 2)
  return { x: bevorzugt.x * abstandWelt, y: bevorzugt.y * abstandWelt }
}

export function endeBuchstabe(endeIndex: 0 | 1): 'A' | 'B' {
  return endeIndex === 0 ? 'A' : 'B'
}

export interface TrunkEndeBeschriftung {
  endeIndex: 0 | 1
  punkt: Point
  nachbarPunkt: Point
  text: string
  verweis: boolean
  versatz: Point | null
}

export function ermittleTrunkEndeBeschriftungen(
  zeichnung: Zeichnung,
  blattId: string,
  trunk: TrunkObjekt,
  vorberechneteKanten?: Map<string, TrunkKante[]>,
): TrunkEndeBeschriftung[] {
  if (trunk.wegpunkte.length === 0) return []
  const namen = ermittleTeilstueckNamen(
    zeichnung,
    ermittleTrunkKette(zeichnung, blattId, trunk.id, vorberechneteKanten),
  )
  const eigenerName = namen.get(trunk.id) ?? trunk.name
  const letzter = trunk.wegpunkte.length - 1
  return trunk.enden.map((ende, index) => {
    const endeIndex = index as 0 | 1
    const punkt = endeIndex === 0 ? trunk.wegpunkte[0] : trunk.wegpunkte[letzter]
    const nachbarIndex = endeIndex === 0 ? Math.min(1, letzter) : Math.max(0, letzter - 1)
    const basis = `${eigenerName} ${endeBuchstabe(endeIndex)}`
    const versatz = ende.beschriftungVersatz ?? null
    const verbindung = ende.verbundenesEnde
    if (!verbindung) {
      return {
        endeIndex,
        punkt,
        nachbarPunkt: trunk.wegpunkte[nachbarIndex],
        text: basis,
        verweis: false,
        versatz,
      }
    }
    const zielBlatt = zeichnung.blaetter.find((b) => b.id === verbindung.blattId)
    const zielTrunk = zielBlatt?.objekte.find(
      (o): o is TrunkObjekt => o.type === 'trunk' && o.id === verbindung.trunkId,
    )
    const zielName = zielTrunk
      ? (ermittleTeilstueckNamen(
          zeichnung,
          ermittleTrunkKette(
            zeichnung,
            verbindung.blattId,
            verbindung.trunkId,
            vorberechneteKanten,
          ),
        ).get(verbindung.trunkId) ?? zielTrunk.name)
      : '?'
    return {
      endeIndex,
      punkt,
      nachbarPunkt: trunk.wegpunkte[nachbarIndex],
      text: `${basis} -> ${zielBlatt?.name ?? '?'} / ${zielName}`,
      verweis: true,
      versatz,
    }
  })
}

export function zeichneTrunkEnden(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  zeichnung: Zeichnung,
  blattId: string,
  trunk: TrunkObjekt,
  blatt: Blatt,
  hindernisse: BezeichnerHindernisse = { flaechen: [], linien: [] },
  vorberechneteKanten?: Map<string, TrunkKante[]>,
) {
  if (!effektiveSichtbarkeit(trunk.bezeichnungSichtbar, blatt.trunkBezeichnungSichtbar)) return
  const zusatzzeilen = ermittleTrunkZusatzzeilen(trunk, blatt)
  for (const beschriftung of ermittleTrunkEndeBeschriftungen(
    zeichnung,
    blattId,
    trunk,
    vorberechneteKanten,
  )) {
    if (beschriftung.verweis) {
      zeichneTrunkVerbindungslabel(
        ctx,
        view,
        beschriftung.punkt,
        beschriftung.text,
        beschriftung.versatz,
        hindernisse,
        {
          trunkId: trunk.id,
          vomStart: beschriftung.endeIndex === 0,
        },
      )
    } else {
      zeichneTrunkEndeSchild(
        ctx,
        view,
        beschriftung,
        trunk.farbe,
        hindernisse,
        trunk.id,
        zusatzzeilen,
      )
    }
  }
}

function zeichneTrunkEndeSchild(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  beschriftung: TrunkEndeBeschriftung,
  farbe: string,
  hindernisse: BezeichnerHindernisse,
  eigenerTrunkId: string,
  zusatzzeilen: readonly string[],
) {
  const p = view.worldToScreen(beschriftung.punkt)
  const nachbar = view.worldToScreen(beschriftung.nachbarPunkt)
  const dx = p.x - nachbar.x
  const dy = p.y - nachbar.y
  const laenge = Math.hypot(dx, dy)
  const richtung = laenge > 0 ? { x: dx / laenge, y: dy / laenge } : { x: 0, y: -1 }
  const zoomFaktor = view.zoomFaktor()
  ctx.save()
  ctx.font = `${11 * zoomFaktor}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const paddingX = 6 * zoomFaktor
  const pillBreite = ctx.measureText(beschriftung.text).width + paddingX * 2
  const pillHoehe = 16 * zoomFaktor
  const zeilenHoehe = 12 * zoomFaktor
  const zeilenBreite = zusatzzeilen.reduce(
    (max, zeile) => Math.max(max, ctx.measureText(zeile).width),
    0,
  )
  const breite = Math.max(pillBreite, zeilenBreite)
  const hoehe = pillHoehe + zusatzzeilen.length * zeilenHoehe
  const standardAbstand = ENDE_SCHILD_ABSTAND_PX * zoomFaktor
  const mindestAbstandHindernis = BEZEICHNER_HINDERNIS_ABSTAND_PX * zoomFaktor
  const eigeneNaehe = standardAbstand + breite / 2 + hoehe / 2 + mindestAbstandHindernis
  const { mitte, leitlinie, leitlinieVon } = bezeichnerPosition(
    view,
    beschriftung.punkt,
    beschriftung.versatz,
    p,
    () =>
      sucheBezeichnerPosition({
        standardAbstand,
        maxAbstand: BEZEICHNER_MAX_ABSTAND_PX * zoomFaktor,
        schritt: BEZEICHNER_SCHRITT_PX * zoomFaktor,
        richtungen: [richtung],
        mitteFuer: (abstand, r) => ({ x: p.x + r.x * abstand, y: p.y + r.y * abstand }),
        breite,
        hoehe,
        hindernisse: hindernisseOhneEigeneNaehe(
          hindernisse,
          eigenerTrunkId,
          beschriftung.endeIndex === 0,
          eigeneNaehe,
        ),
        ausgenommeneObjektIds: new Set(),
        mindestAbstandHindernis,
      }),
  )
  const pillMitteY = mitte.y - hoehe / 2 + pillHoehe / 2
  if (leitlinie) zeichneBezeichnerLeitlinie(ctx, leitlinieVon, { x: mitte.x, y: pillMitteY })
  zeichnePille(ctx, mitte.x, pillMitteY, beschriftung.text, farbe, zoomFaktor)
  ctx.fillStyle = '#4a4a4a'
  zusatzzeilen.forEach((zeile, i) => {
    ctx.fillText(zeile, mitte.x, pillMitteY + pillHoehe / 2 + zeilenHoehe * (i + 0.5))
  })
  ctx.restore()
}

export const TRUNK_ENDE_TOLERANZ_PX = 14

export function zeichneTrunkVerbindungslabel(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  punkt: Point,
  text: string,
  versatz: Point | null,
  hindernisse: BezeichnerHindernisse = { flaechen: [], linien: [] },
  eigenerTrunk: { trunkId: string; vomStart: boolean },
) {
  const p = view.worldToScreen(punkt)
  const zoomFaktorLabel = view.zoomFaktor()
  ctx.save()
  ctx.font = `${11 * zoomFaktorLabel}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  const paddingX = 5 * zoomFaktorLabel
  const hoehe = 16 * zoomFaktorLabel
  const breiteGesamt = ctx.measureText(text).width + paddingX * 2
  const standardAbstand = 10 * zoomFaktorLabel + breiteGesamt / 2
  const mindestAbstandHindernis = BEZEICHNER_HINDERNIS_ABSTAND_PX * zoomFaktorLabel
  const eigeneNaehe = standardAbstand + breiteGesamt / 2 + hoehe / 2 + mindestAbstandHindernis
  const { mitte, leitlinie, leitlinieVon } = bezeichnerPosition(view, punkt, versatz, p, () =>
    sucheBezeichnerPosition({
      standardAbstand,
      maxAbstand: BEZEICHNER_MAX_ABSTAND_PX * zoomFaktorLabel + breiteGesamt / 2,
      schritt: BEZEICHNER_SCHRITT_PX * zoomFaktorLabel,
      richtungen: [{ x: 1, y: 0 }],
      mitteFuer: (abstand, richtung) => ({ x: p.x + richtung.x * abstand, y: p.y }),
      breite: breiteGesamt,
      hoehe,
      hindernisse: hindernisseOhneEigeneNaehe(
        hindernisse,
        eigenerTrunk.trunkId,
        eigenerTrunk.vomStart,
        eigeneNaehe,
      ),
      ausgenommeneObjektIds: new Set(),
      mindestAbstandHindernis,
    }),
  )
  if (leitlinie) zeichneBezeichnerLeitlinie(ctx, leitlinieVon, mitte)
  const x = mitte.x - breiteGesamt / 2
  ctx.fillStyle = 'rgba(47, 125, 209, 0.92)'
  ctx.fillRect(x, mitte.y - hoehe / 2, breiteGesamt, hoehe)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, x + paddingX, mitte.y + 0.5)
  ctx.restore()
}

export function zeichneTrunkEndeHighlight(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  punkt: Point,
) {
  const p = view.worldToScreen(punkt)
  ctx.save()
  ctx.strokeStyle = '#2f7dd1'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(p.x, p.y, 9, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}
