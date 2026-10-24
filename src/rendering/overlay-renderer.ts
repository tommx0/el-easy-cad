import type {
  BemassungsreiheObjekt,
  BoundingBox,
  GeschwisterVerbindung,
  GruppenVerbindung,
  KomponentenObjekt,
  LeitungsObjekt,
  Objekt,
  Point,
  RaumquerungsUmgebung,
  ZonenDefinition,
  Slot,
  SlotGrafikMarkierung,
  SlotVerbindung,
  TabellenKontext,
  Teilstueck,
  TransformRahmen,
} from '../document-model'
import {
  abgeleitetePfadSegmente,
  gezeigtePfadSegmente,
  freieStuecke,
  liegtAufStrecke,
  zonenKuerzel,
  ermittleBemassungsreiheGeometrie,
  ermittleObjektBoundingBox,
  getDockpoints,
  gruppiereSlotsNachZeile,
  istPortKomponente,
  portAnzahl,
  rahmenDrehgriffPunkt,
  rahmenEcken,
  raumBeschriftungsRahmen,
  rotatePoint,
  typHatSlotMatrix,
} from '../document-model'
import {
  ermittleWandStaerke,
  zeichneFenster,
  zeichneObjekt,
  zeichneTuer,
  zeichneWanddurchbruch,
  zeichneWandKontur,
} from './object-renderer'
import type { ViewTransform } from './view-transform'

const SCHEIN_TYPEN: ReadonlySet<Objekt['type']> = new Set<Objekt['type']>([
  'linie',
  'polylinie',
  'bodenplatte',
  'rechteck',
  'kreis',
  'bogen',
  'ellipse',
  'polygon',
  'bemassung',
  'bemassungsreihe',
  'leitung',
  'trunk',
  'schaltverbindung',
])

interface ScheinStil {
  farbe: string
  zusatzBreite: number
}

const AUSWAHL_SCHEIN: ScheinStil = { farbe: 'rgba(47, 125, 209, 0.35)', zusatzBreite: 8 }
const HOVER_SCHEIN: ScheinStil = { farbe: 'rgba(127, 176, 232, 0.35)', zusatzBreite: 5 }

function zeichneSchein(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Objekt,
  stil: ScheinStil,
  alleObjekteAufBlatt?: readonly Objekt[],
  tabellenKontext?: TabellenKontext,
) {
  const blatt = tabellenKontext?.zeichnung.blaetter.find((b) => b.id === tabellenKontext.blattId)
  const pfad =
    objekt.type !== 'leitung'
      ? undefined
      : blatt
        ? gezeigtePfadSegmente(objekt, blatt, tabellenKontext!.zeichnung.installationszonen)
        : alleObjekteAufBlatt
          ? abgeleitetePfadSegmente(objekt, alleObjekteAufBlatt)
          : undefined
  const schein = {
    ...objekt,
    farbe: stil.farbe,
    strichstaerke: objekt.strichstaerke + stil.zusatzBreite,
    linientyp: 'standard',
    ...('fuellung' in objekt ? { fuellung: null } : {}),
    ...(pfad ? { pfadSegmente: pfad } : {}),
    ...(objekt.type === 'schaltverbindung' ? { bezeichnungSichtbar: false } : {}),
  } as Objekt
  zeichneObjekt(ctx, view, schein)
}

export function zeichneAuswahlHighlight(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekte: Objekt[],
  tabellenKontext?: TabellenKontext,
  alleObjekteAufBlatt?: readonly Objekt[],
) {
  ctx.save()
  ctx.strokeStyle = '#2f7dd1'
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 4])
  for (const objekt of objekte) {
    if (objekt.type === 'knotenpunkt') {
      const p = view.worldToScreen(objekt.position)
      ctx.beginPath()
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
      ctx.stroke()
      continue
    }
    zeichneBoundingBoxRahmen(
      ctx,
      view,
      objekt,
      tabellenKontext,
      alleObjekteAufBlatt,
      AUSWAHL_SCHEIN,
    )
  }
  ctx.restore()
}

export function zeichneTeilstueckZonen(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  leitungen: readonly LeitungsObjekt[],
  objekteAufBlatt: readonly Objekt[],
  gewaehlt: readonly Teilstueck[] = [],
  umgebung: RaumquerungsUmgebung | null = null,
  zonen: readonly ZonenDefinition[] = [],
) {
  ctx.save()
  ctx.lineCap = 'round'
  for (const leitung of leitungen) {
    const stuecke = freieStuecke(leitung, objekteAufBlatt, umgebung)
    const eigene = gewaehlt.filter((g) => g.leitungId === leitung.id)
    for (const stueck of stuecke) {
      if (!eigene.some((g) => liegtAufStrecke(stueck.von, stueck.bis, g.von, g.bis))) continue
      const a = view.worldToScreen(stueck.von)
      const b = view.worldToScreen(stueck.bis)
      ctx.strokeStyle = 'rgba(224, 120, 47, 0.75)'
      ctx.lineWidth = 7
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const stueck of stuecke) {
      if (!stueck.zone) continue
      const m = view.worldToScreen({
        x: (stueck.von.x + stueck.bis.x) / 2,
        y: (stueck.von.y + stueck.bis.y) / 2,
      })
      const kuerzel = zonenKuerzel(stueck.zone, zonen)
      const halb = Math.max(7, ctx.measureText(kuerzel).width / 2 + 3)
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#e0782f'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(m.x - halb, m.y - 7, 2 * halb, 14, 3)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#b4561b'
      ctx.fillText(kuerzel, m.x, m.y + 0.5)
    }
  }
  ctx.restore()
}

const SLOT_VERBINDUNG_FARBE: Record<SlotVerbindung['richtung'], string> = {
  ausgehend: '#2f7dd1',
  eingehend: '#d17d2f',
}

const WIRKVERBINDUNG_VORSCHAU_FARBE = '#808080'

const BEDIENGERAETE_VERBINDUNG_FARBE = WIRKVERBINDUNG_VORSCHAU_FARBE

const SLOT_FARBEN = [
  '#2f7dd1', // blau
  '#d62f3a', // rot
  '#8e44ad', // violett
  '#17a2b8', // tuerkis
  '#e056b0', // pink
  '#b8a000', // senf
  '#34495e', // schiefergrau
  '#7a4b1e', // braun
] as const

export function slotFarbe(slotIndex: number): string {
  return SLOT_FARBEN[slotIndex % SLOT_FARBEN.length]
}

const SLOT_VERBINDUNG_VERSATZ_PX = 4

export function zeichneSlotVerbindungen(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  verbindungen: readonly SlotVerbindung[],
) {
  if (verbindungen.length === 0) return
  const strecke = (v: SlotVerbindung) => {
    const p = `${v.von.x},${v.von.y}`
    const q = `${v.nach.x},${v.nach.y}`
    return { schluessel: p < q ? `${p}|${q}` : `${q}|${p}`, vorwaerts: p < q }
  }
  const anzahlJeStrecke = new Map<string, number>()
  for (const v of verbindungen) {
    const { schluessel } = strecke(v)
    anzahlJeStrecke.set(schluessel, (anzahlJeStrecke.get(schluessel) ?? 0) + 1)
  }
  const bisherJeStrecke = new Map<string, number>()

  ctx.save()
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  for (const verbindung of verbindungen) {
    const a = view.worldToScreen(verbindung.von)
    const b = view.worldToScreen(verbindung.nach)
    const { schluessel, vorwaerts } = strecke(verbindung)
    const anzahl = anzahlJeStrecke.get(schluessel) ?? 1
    const nummer = bisherJeStrecke.get(schluessel) ?? 0
    bisherJeStrecke.set(schluessel, nummer + 1)
    let dx = 0
    let dy = 0
    const laenge = Math.hypot(b.x - a.x, b.y - a.y)
    if (anzahl > 1 && laenge > 0) {
      const versatz =
        ((nummer - (anzahl - 1) / 2) * SLOT_VERBINDUNG_VERSATZ_PX * (vorwaerts ? 1 : -1)) / laenge
      dx = -(b.y - a.y) * versatz
      dy = (b.x - a.x) * versatz
    }
    ctx.strokeStyle = verbindung.zwischenBediengeraeten
      ? BEDIENGERAETE_VERBINDUNG_FARBE
      : verbindung.richtung === 'ausgehend'
        ? slotFarbe(verbindung.slotIndex)
        : SLOT_VERBINDUNG_FARBE.eingehend
    ctx.beginPath()
    ctx.moveTo(a.x + dx, a.y + dy)
    ctx.lineTo(b.x + dx, b.y + dy)
    ctx.stroke()
  }
  ctx.restore()
}

const GRUPPEN_VERBINDUNG_FARBE = '#2fa14d'

export function zeichneGruppenVerbindungen(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  verbindungen: readonly GruppenVerbindung[],
) {
  if (verbindungen.length === 0) return
  ctx.save()
  ctx.strokeStyle = GRUPPEN_VERBINDUNG_FARBE
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  for (const { von, nach } of verbindungen) {
    const a = view.worldToScreen(von)
    const b = view.worldToScreen(nach)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  ctx.restore()
}

export function zeichneGeschwisterVerbindungen(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  verbindungen: readonly GeschwisterVerbindung[],
) {
  if (verbindungen.length === 0) return
  ctx.save()
  ctx.strokeStyle = BEDIENGERAETE_VERBINDUNG_FARBE
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  for (const { von, nach } of verbindungen) {
    const a = view.worldToScreen(von)
    const b = view.worldToScreen(nach)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  ctx.restore()
}

export function zeichneWirkverbindungVorschau(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  von: Point,
  bis: Point,
) {
  const a = view.worldToScreen(von)
  const b = view.worldToScreen(bis)
  ctx.save()
  ctx.strokeStyle = WIRKVERBINDUNG_VORSCHAU_FARBE
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  ctx.restore()
}

export function zeichneWirkverbindungZielLinien(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  von: Point,
  ziele: readonly Point[],
) {
  if (ziele.length === 0) return
  ctx.save()
  ctx.strokeStyle = WIRKVERBINDUNG_VORSCHAU_FARBE
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  const a = view.worldToScreen(von)
  for (const ziel of ziele) {
    const b = view.worldToScreen(ziel)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  ctx.restore()
}

export function zeichneWirkverbindungZielHighlight(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekte: Objekt[],
) {
  ctx.save()
  ctx.strokeStyle = GRUPPEN_VERBINDUNG_FARBE
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 4])
  for (const objekt of objekte) {
    zeichneBoundingBoxRahmen(ctx, view, objekt)
  }
  ctx.restore()
}

const SLOT_GRAFIK_FARBE: Record<SlotGrafikMarkierung['richtung'], string> = {
  ausgehend: SLOT_VERBINDUNG_FARBE.ausgehend,
  eingehend: SLOT_VERBINDUNG_FARBE.eingehend,
  aktiv: WIRKVERBINDUNG_VORSCHAU_FARBE,
}

const SLOT_GRAFIK_ZELLE_PX = 9
const SLOT_GRAFIK_ABSTAND_PX = 2
const SLOT_GRAFIK_MIN_ZEILE_PX = 5
const SLOT_GRAFIK_PADDING_PX = 4
const SLOT_GRAFIK_VERSATZ_PX = 14
const SLOT_GRAFIK_LEER_FARBE = '#ffffff'
const SLOT_GRAFIK_BELEGT_FARBE = '#b9b9b9'
const SLOT_GRAFIK_RAND_FARBE = '#8f8f8f'
const SLOT_GRAFIK_HINTERGRUND_FARBE = 'rgba(255, 255, 255, 0.92)'
const SLOT_GRAFIK_ZEIGER_RAND_FARBE = '#3a3a3a'
const SLOT_MARKIERUNG_FLAECHE_FARBE = 'rgba(255, 214, 0, 0.35)'
const SLOT_MARKIERUNG_RAND_FARBE = '#e0a800'
export const SLOT_GRAFIK_LUPE_FAKTOR = 2.6

export function zeichneSlotGrafiken(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  markierungen: readonly SlotGrafikMarkierung[],
  anzeige: SlotGrafikAnzeige = {},
) {
  for (const markierung of markierungen) zeichneSlotGrafik(ctx, view, markierung, anzeige)
}

function zeichneSlotGrafik(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  markierung: SlotGrafikMarkierung,
  anzeige: SlotGrafikAnzeige,
) {
  const { slots } = markierung
  const vergroessert = anzeige.vergroessertObjektId === markierung.objektId
  const layout = berechneSlotGrafikLayout(view, markierung, vergroessert)
  if (!layout) return
  const massstab = vergroessert ? SLOT_GRAFIK_LUPE_FAKTOR : 1
  const hervorgehoben = new Set(markierung.hervorgehobeneSlotIds)
  const hervorhebungFarbe = (slot: Slot) =>
    markierung.richtung === 'ausgehend'
      ? slotFarbe(slots.indexOf(slot))
      : SLOT_GRAFIK_FARBE[markierung.richtung]

  ctx.save()
  ctx.setLineDash([])
  ctx.lineWidth = 1
  ctx.fillStyle = SLOT_GRAFIK_HINTERGRUND_FARBE
  ctx.strokeStyle = SLOT_GRAFIK_RAND_FARBE
  ctx.fillRect(layout.rahmen.x, layout.rahmen.y, layout.rahmen.w, layout.rahmen.h)
  ctx.strokeRect(layout.rahmen.x, layout.rahmen.y, layout.rahmen.w, layout.rahmen.h)

  const slotNach = new Map(slots.map((slot) => [slot.id, slot]))
  const gewaehlt =
    anzeige.gewaehlt?.objektId === markierung.objektId ? anzeige.gewaehlt.slotId : null
  for (const { slotId, x, y, w, h } of layout.zellen) {
    const slot = slotNach.get(slotId)
    if (!slot) continue
    const farbe = hervorgehoben.has(slotId) ? hervorhebungFarbe(slot) : null
    ctx.fillStyle =
      farbe ?? (slot.ziele.length > 0 ? SLOT_GRAFIK_BELEGT_FARBE : SLOT_GRAFIK_LEER_FARBE)
    ctx.strokeStyle = farbe ?? SLOT_GRAFIK_RAND_FARBE
    ctx.lineWidth = 1
    ctx.fillRect(x, y, w, h)
    ctx.strokeRect(x, y, w, h)
    if (slotId === gewaehlt) {
      ctx.strokeStyle = SLOT_MARKIERUNG_RAND_FARBE
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)
    } else if (vergroessert && slotId === anzeige.zeigerSlotId) {
      ctx.strokeStyle = SLOT_GRAFIK_ZEIGER_RAND_FARBE
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)
    }
  }

  const zeigerSlot = vergroessert ? slotNach.get(anzeige.zeigerSlotId ?? '') : undefined
  if (zeigerSlot?.bezeichnung) {
    const text = zeigerSlot.bezeichnung
    ctx.font = `${Math.round(9 * massstab)}px sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    const breiteText = ctx.measureText(text).width
    const hoeheText = Math.round(12 * massstab)
    const textX = layout.rahmen.x
    const textY = layout.rahmen.y + layout.rahmen.h + 2
    ctx.fillStyle = SLOT_GRAFIK_HINTERGRUND_FARBE
    ctx.strokeStyle = SLOT_GRAFIK_RAND_FARBE
    ctx.lineWidth = 1
    ctx.fillRect(textX, textY, breiteText + 6, hoeheText)
    ctx.strokeRect(textX, textY, breiteText + 6, hoeheText)
    ctx.fillStyle = '#333333'
    ctx.fillText(text, textX + 3, textY + Math.round(2 * massstab))
  }
  ctx.restore()
}

export interface SlotGrafikAnzeige {
  vergroessertObjektId?: string | null
  zeigerSlotId?: string | null
  gewaehlt?: { objektId: string; slotId: string } | null
}

export interface SlotGrafikZelle {
  slotId: string
  x: number
  y: number
  w: number
  h: number
}

export interface SlotGrafikLayout {
  objektId: string
  rahmen: { x: number; y: number; w: number; h: number }
  zellen: SlotGrafikZelle[]
}

export function berechneSlotGrafikLayout(
  view: ViewTransform,
  markierung: SlotGrafikMarkierung,
  vergroessert = false,
): SlotGrafikLayout | null {
  const { slots, slotMatrix, typ } = markierung
  if (slots.length === 0) return null
  const massstab = vergroessert ? SLOT_GRAFIK_LUPE_FAKTOR : 1
  const zellenPx = SLOT_GRAFIK_ZELLE_PX * massstab
  const abstandPx = SLOT_GRAFIK_ABSTAND_PX * massstab
  const minZeilePx = SLOT_GRAFIK_MIN_ZEILE_PX * massstab
  const paddingPx = SLOT_GRAFIK_PADDING_PX * massstab

  const zellen: SlotGrafikZelle[] = []
  let breite: number
  let hoehe: number
  if (typHatSlotMatrix(typ)) {
    const gruppen = gruppiereSlotsNachZeile(slots, slotMatrix)
    const anzahl = Math.max(1, gruppen.length)
    const seite = Math.max(zellenPx * 2 + abstandPx, anzahl * minZeilePx + (anzahl - 1) * abstandPx)
    breite = seite
    hoehe = seite
    const zeilenHoehe = (seite - (anzahl - 1) * abstandPx) / anzahl
    for (const gruppe of gruppen) {
      const zellenBreite = (seite - (gruppe.spalten - 1) * abstandPx) / gruppe.spalten
      gruppe.slots.forEach(({ slot }, spalte0) => {
        zellen.push({
          slotId: slot.id,
          x: spalte0 * (zellenBreite + abstandPx),
          y: gruppe.zeile0 * (zeilenHoehe + abstandPx),
          w: zellenBreite,
          h: zeilenHoehe,
        })
      })
    }
  } else {
    breite = zellenPx
    hoehe = slots.length * zellenPx + (slots.length - 1) * abstandPx
    slots.forEach((slot, zeile0) => {
      zellen.push({
        slotId: slot.id,
        x: 0,
        y: zeile0 * (zellenPx + abstandPx),
        w: zellenPx,
        h: zellenPx,
      })
    })
  }

  const anker = view.worldToScreen(markierung.position)
  const startX = anker.x + SLOT_GRAFIK_VERSATZ_PX
  const startY = anker.y - SLOT_GRAFIK_VERSATZ_PX - hoehe

  return {
    objektId: markierung.objektId,
    rahmen: {
      x: startX - paddingPx,
      y: startY - paddingPx,
      w: breite + paddingPx * 2,
      h: hoehe + paddingPx * 2,
    },
    zellen: zellen.map((z) => ({ ...z, x: startX + z.x, y: startY + z.y })),
  }
}

export function findeSlotGrafikUnterZeiger(
  view: ViewTransform,
  markierungen: readonly SlotGrafikMarkierung[],
  punkt: { x: number; y: number },
  vergroessertObjektId: string | null,
): string | null {
  for (let i = markierungen.length - 1; i >= 0; i--) {
    const markierung = markierungen[i]
    const layout = berechneSlotGrafikLayout(
      view,
      markierung,
      vergroessertObjektId === markierung.objektId,
    )
    if (!layout) continue
    const { x, y, w, h } = layout.rahmen
    if (punkt.x >= x && punkt.x <= x + w && punkt.y >= y && punkt.y <= y + h) {
      return markierung.objektId
    }
  }
  return null
}

export function findeSlotGrafikZelle(
  view: ViewTransform,
  markierungen: readonly SlotGrafikMarkierung[],
  punkt: { x: number; y: number },
  objektId: string,
): string | null {
  const markierung = markierungen.find((m) => m.objektId === objektId)
  if (!markierung) return null
  const layout = berechneSlotGrafikLayout(view, markierung, true)
  if (!layout) return null
  for (const zelle of layout.zellen) {
    if (
      punkt.x >= zelle.x &&
      punkt.x <= zelle.x + zelle.w &&
      punkt.y >= zelle.y &&
      punkt.y <= zelle.y + zelle.h
    ) {
      return zelle.slotId
    }
  }
  return null
}

export function zeichneSlotZielMarkierung(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekte: readonly Objekt[],
) {
  if (objekte.length === 0) return
  ctx.save()
  ctx.setLineDash([])
  ctx.lineWidth = 2
  ctx.fillStyle = SLOT_MARKIERUNG_FLAECHE_FARBE
  ctx.strokeStyle = SLOT_MARKIERUNG_RAND_FARBE
  for (const objekt of objekte) {
    const bb = ermittleObjektBoundingBox(objekt)
    const a = view.worldToScreen({ x: bb.min.x, y: bb.max.y })
    const b = view.worldToScreen({ x: bb.max.x, y: bb.min.y })
    const x = Math.min(a.x, b.x)
    const y = Math.min(a.y, b.y)
    const w = Math.max(1, Math.abs(b.x - a.x))
    const h = Math.max(1, Math.abs(b.y - a.y))
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6)
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6)
  }
  ctx.restore()
}

export function zeichneHoverHighlight(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Objekt,
  tabellenKontext?: TabellenKontext,
  alleObjekteAufBlatt?: readonly Objekt[],
) {
  ctx.save()
  ctx.strokeStyle = '#7fb0e8'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  zeichneBoundingBoxRahmen(ctx, view, objekt, tabellenKontext, alleObjekteAufBlatt, HOVER_SCHEIN)
  ctx.restore()
}

function zeichneBoundingBoxRahmen(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: Objekt,
  tabellenKontext?: TabellenKontext,
  alleObjekteAufBlatt?: readonly Objekt[],
  schein?: ScheinStil,
) {
  if (schein && SCHEIN_TYPEN.has(objekt.type)) {
    zeichneSchein(ctx, view, objekt, schein, alleObjekteAufBlatt, tabellenKontext)
    return
  }
  if (objekt.type === 'tuer' || objekt.type === 'fenster' || objekt.type === 'wanddurchbruch') {
    const wandStaerke = ermittleWandStaerke(objekt, alleObjekteAufBlatt)
    if (objekt.type === 'tuer') zeichneTuer(ctx, view, objekt, wandStaerke)
    else if (objekt.type === 'fenster') zeichneFenster(ctx, view, objekt, wandStaerke)
    else zeichneWanddurchbruch(ctx, view, objekt, wandStaerke)
    return
  }
  if (objekt.type === 'wand') {
    zeichneWandKontur(ctx, view, objekt, alleObjekteAufBlatt)
    return
  }
  if (objekt.type === 'raum') {
    if (objekt.umriss.length >= 3) {
      const punkte = objekt.umriss.map((p) => view.worldToScreen(p))
      ctx.beginPath()
      ctx.moveTo(punkte[0].x, punkte[0].y)
      for (const p of punkte.slice(1)) ctx.lineTo(p.x, p.y)
      ctx.closePath()
      ctx.stroke()
    }
    zeichneWeltRechteck(ctx, view, raumBeschriftungsRahmen(objekt))
    return
  }
  zeichneWeltRechteck(ctx, view, ermittleObjektBoundingBox(objekt, tabellenKontext))
}

function zeichneWeltRechteck(ctx: CanvasRenderingContext2D, view: ViewTransform, bb: BoundingBox) {
  const a = view.worldToScreen({ x: bb.min.x, y: bb.max.y })
  const b = view.worldToScreen({ x: bb.max.x, y: bb.min.y })
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const w = Math.max(1, Math.abs(b.x - a.x))
  const h = Math.max(1, Math.abs(b.y - a.y))
  ctx.strokeRect(x - 4, y - 4, w + 8, h + 8)
}

export function zeichneFadenkreuz(
  ctx: CanvasRenderingContext2D,
  screenPunkt: { x: number; y: number },
  breite: number,
  hoehe: number,
) {
  ctx.save()
  ctx.strokeStyle = 'rgba(60, 60, 60, 0.35)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(screenPunkt.x + 0.5, 0)
  ctx.lineTo(screenPunkt.x + 0.5, hoehe)
  ctx.moveTo(0, screenPunkt.y + 0.5)
  ctx.lineTo(breite, screenPunkt.y + 0.5)
  ctx.stroke()
  ctx.restore()
}

export function zeichneSlotHighlight(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  slot: { punkt: Point; drehung: number; slotGroesse: number },
) {
  const halb = slot.slotGroesse / 2
  const eckenLokal: Point[] = [
    { x: slot.punkt.x - halb, y: slot.punkt.y - halb },
    { x: slot.punkt.x + halb, y: slot.punkt.y - halb },
    { x: slot.punkt.x + halb, y: slot.punkt.y + halb },
    { x: slot.punkt.x - halb, y: slot.punkt.y + halb },
  ]
  const ecken = eckenLokal.map((e) =>
    view.worldToScreen(slot.drehung === 0 ? e : rotatePoint(e, slot.punkt, slot.drehung)),
  )
  ctx.save()
  ctx.strokeStyle = '#2f7dd1'
  ctx.fillStyle = 'rgba(47, 125, 209, 0.12)'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(ecken[0].x, ecken[0].y)
  for (const e of ecken.slice(1)) ctx.lineTo(e.x, e.y)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export function zeichneDockpunktHighlight(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  punkt: Point,
  bezeichnung?: string | null,
) {
  const p = view.worldToScreen(punkt)
  ctx.save()
  ctx.strokeStyle = '#2f7dd1'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
  ctx.stroke()
  if (bezeichnung) zeichneAndockHinweis(ctx, p, bezeichnung)
  ctx.restore()
}

function zeichneAndockHinweis(ctx: CanvasRenderingContext2D, p: Point, text: string) {
  const schrift = 12
  const rand = 3
  ctx.font = `${schrift}px sans-serif`
  const breite = ctx.measureText(text).width + 2 * rand
  const hoehe = schrift + 2 * rand
  const x = p.x + 10
  const y = p.y - 10 - hoehe
  ctx.fillStyle = '#2f7dd1'
  ctx.fillRect(x, y, breite, hoehe)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + rand, y + hoehe / 2)
}

export function zeichneFangpunkt(ctx: CanvasRenderingContext2D, view: ViewTransform, punkt: Point) {
  const p = view.worldToScreen(punkt)
  const arm = 7
  ctx.save()
  ctx.strokeStyle = '#c2185b'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(p.x - arm, p.y)
  ctx.lineTo(p.x + arm, p.y)
  ctx.moveTo(p.x, p.y - arm)
  ctx.lineTo(p.x, p.y + arm)
  ctx.moveTo(p.x + 4, p.y)
  ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

export interface LeitungsGriffAuswahl {
  art: 'wegpunkt' | 'segment'
  segmentArrIndex: number
  lokalerIndex: number
}

export function zeichneLeitungsGriffe(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  pfadSegmente: Point[][],
  ausgewaehlterGriff: LeitungsGriffAuswahl | null,
  zeigeEndpunktGriffe = false,
) {
  ctx.save()
  ctx.fillStyle = '#2f7dd1'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  for (const wp of pfadSegmente) {
    for (let i = 0; i < wp.length - 1; i++) {
      const mitte = { x: (wp[i].x + wp[i + 1].x) / 2, y: (wp[i].y + wp[i + 1].y) / 2 }
      const p = view.worldToScreen(mitte)
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  }
  const GROESSE = 5
  pfadSegmente.forEach((wp, segmentArrIndex) => {
    for (let i = 1; i < wp.length - 1; i++) {
      const p = view.worldToScreen(wp[i])
      const istAusgewaehlt =
        ausgewaehlterGriff?.art === 'wegpunkt' &&
        ausgewaehlterGriff.segmentArrIndex === segmentArrIndex &&
        ausgewaehlterGriff.lokalerIndex === i
      ctx.fillStyle = istAusgewaehlt ? '#d1382f' : '#2f7dd1'
      ctx.fillRect(p.x - GROESSE, p.y - GROESSE, GROESSE * 2, GROESSE * 2)
      ctx.strokeRect(p.x - GROESSE, p.y - GROESSE, GROESSE * 2, GROESSE * 2)
    }
  })
  if (zeigeEndpunktGriffe && pfadSegmente.length > 0) {
    const ersterAbschnitt = pfadSegmente[0]
    const letzterAbschnitt = pfadSegmente[pfadSegmente.length - 1]
    const enden = [ersterAbschnitt[0], letzterAbschnitt[letzterAbschnitt.length - 1]]
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#2f7dd1'
    ctx.lineWidth = 2
    for (const ende of enden) {
      const p = view.worldToScreen(ende)
      ctx.beginPath()
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    ctx.restore()
  }
  ctx.restore()
}

export function zeichneBemassungsreiheGriffe(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: BemassungsreiheObjekt,
) {
  const GROESSE = 5
  ctx.save()
  ctx.fillStyle = '#2f7dd1'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  for (const punkt of objekt.punkte) {
    const p = view.worldToScreen(punkt)
    ctx.fillRect(p.x - GROESSE, p.y - GROESSE, GROESSE * 2, GROESSE * 2)
    ctx.strokeRect(p.x - GROESSE, p.y - GROESSE, GROESSE * 2, GROESSE * 2)
  }
  const griff = view.worldToScreen(ermittleBemassungsreiheGeometrie(objekt).versatzGriff)
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#2f7dd1'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(griff.x, griff.y, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export function zeichneDockpunkte(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  komponenten: KomponentenObjekt[],
  angeboten?: ((komponente: KomponentenObjekt) => readonly number[] | null) | null,
) {
  ctx.save()
  ctx.fillStyle = '#e07b00'
  for (const komponente of komponenten) {
    const erlaubt = angeboten?.(komponente) ?? null
    for (const [index, punkt] of getDockpoints(komponente).entries()) {
      if (erlaubt && !erlaubt.includes(index)) continue
      const p = view.worldToScreen(punkt)
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

export function zeichnePortNummern(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  komponenten: KomponentenObjekt[],
) {
  ctx.save()
  ctx.fillStyle = '#8a4b00'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  for (const komponente of komponenten) {
    if (!istPortKomponente(komponente)) continue
    const anzahl = portAnzahl(komponente)
    if (anzahl === 0) continue
    const dockpunkte = getDockpoints(komponente)
    const indizes = anzahl === 1 ? [0] : [0, anzahl - 1]
    for (const index of indizes) {
      const p = view.worldToScreen(dockpunkte[index])
      ctx.fillText(String(index + 1), p.x, p.y - 6)
    }
  }
  ctx.restore()
}

export const TRANSFORM_GRIFF_GROESSE_PX = 5
export const TRANSFORM_DREHGRIFF_ABSTAND_PX = 22

export function zeichneTransformGriffe(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  rahmen: TransformRahmen,
) {
  const weltEcken = rahmenEcken(rahmen)
  const eckenScreen = weltEcken.map((p) => view.worldToScreen(p))
  const versatzWelt = view.laengeToWorld(TRANSFORM_DREHGRIFF_ABSTAND_PX)
  const drehgriffScreen = view.worldToScreen(rahmenDrehgriffPunkt(rahmen, versatzWelt))
  const obenMitteScreen = view.worldToScreen({
    x: (weltEcken[2].x + weltEcken[3].x) / 2,
    y: (weltEcken[2].y + weltEcken[3].y) / 2,
  })

  ctx.save()
  ctx.strokeStyle = '#2f7dd1'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(obenMitteScreen.x, obenMitteScreen.y)
  ctx.lineTo(drehgriffScreen.x, drehgriffScreen.y)
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  const G = TRANSFORM_GRIFF_GROESSE_PX
  for (const p of eckenScreen) {
    ctx.beginPath()
    ctx.rect(p.x - G, p.y - G, G * 2, G * 2)
    ctx.fill()
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(drehgriffScreen.x, drehgriffScreen.y, G, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export function zeichneAuswahlrechteck(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  a: Point,
  b: Point,
) {
  const p1 = view.worldToScreen(a)
  const p2 = view.worldToScreen(b)
  const x = Math.min(p1.x, p2.x)
  const y = Math.min(p1.y, p2.y)
  const w = Math.abs(p2.x - p1.x)
  const h = Math.abs(p2.y - p1.y)
  ctx.save()
  ctx.strokeStyle = '#2f7dd1'
  ctx.fillStyle = 'rgba(47, 125, 209, 0.08)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  ctx.fillRect(x, y, w, h)
  ctx.strokeRect(x, y, w, h)
  ctx.restore()
}
