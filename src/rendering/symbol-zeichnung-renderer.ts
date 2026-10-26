import type { Point } from '../document-model/geometry'
import type {
  SymbolElement,
  SymbolRadierung,
  SymbolZeichnung,
} from '../document-model/symbol-zeichnung'
import {
  SYMBOL_SCHRIFT,
  SYMBOL_STRICH_BREITE,
  SYMBOL_TEXT_GROESSE,
  SYMBOL_TEXT_ZEILENHOEHE,
  bogenSpanne,
} from '../document-model/symbol-zeichnung'
import { type SymbolFarbe, symbolFarbwert } from '../document-model/symbol-palette'
import type { PfadSegment, ZeichenElement } from '../document-model/studio-zeichnung/modell'
import {
  TEXT_SCHRIFT,
  TEXT_ZEILENHOEHE,
  alsPfadSegmente,
  hatStil,
  istFuellbar,
} from '../document-model/studio-zeichnung/modell'

export interface SymbolZeichnenOptionen {
  bildQuelle?: (datenUrl: string) => CanvasImageSource | null
}

type EbenenErzeuger = (breite: number, hoehe: number) => HTMLCanvasElement | null

function standardEbenenErzeuger(breite: number, hoehe: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = breite
  canvas.height = hoehe
  return canvas
}

let ebenenErzeuger: EbenenErzeuger = standardEbenenErzeuger
let ebene: HTMLCanvasElement | null = null

export function setzeEbenenErzeugerFuerTests(erzeuger: EbenenErzeuger | null) {
  ebenenErzeuger = erzeuger ?? standardEbenenErzeuger
  ebene = null
}

function holeEbene(breite: number, hoehe: number): HTMLCanvasElement | null {
  if (!ebene) ebene = ebenenErzeuger(breite, hoehe)
  if (!ebene) return null
  if (ebene.width !== breite) ebene.width = breite
  if (ebene.height !== hoehe) ebene.height = hoehe
  return ebene
}

function linienzugPfad(ctx: CanvasRenderingContext2D, punkte: Point[], schliessen: boolean) {
  ctx.beginPath()
  ctx.moveTo(punkte[0].x, punkte[0].y)
  for (let i = 1; i < punkte.length; i++) ctx.lineTo(punkte[i].x, punkte[i].y)
  if (schliessen) ctx.closePath()
}

function punktOderLinienzug(ctx: CanvasRenderingContext2D, punkte: Point[], breite: number) {
  if (punkte.length === 1) {
    ctx.beginPath()
    ctx.arc(punkte[0].x, punkte[0].y, breite / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.lineWidth = breite
  linienzugPfad(ctx, punkte, false)
  ctx.stroke()
}

function strichUndFuellung(
  ctx: CanvasRenderingContext2D,
  breite: number,
  element: { gefuellt: boolean; fuellFarbe?: SymbolFarbe },
  gefuellt = element.gefuellt,
) {
  if (gefuellt) {
    ctx.save()
    ctx.fillStyle = symbolFarbwert(element.fuellFarbe)
    ctx.fill()
    ctx.restore()
  }
  ctx.lineWidth = breite
  ctx.stroke()
}

function pfadAnlegen(ctx: CanvasRenderingContext2D, segmente: PfadSegment[]) {
  ctx.beginPath()
  for (const s of segmente) {
    switch (s.typ) {
      case 'M':
        ctx.moveTo(s.p.x, s.p.y)
        break
      case 'L':
        ctx.lineTo(s.p.x, s.p.y)
        break
      case 'C':
        ctx.bezierCurveTo(s.c1.x, s.c1.y, s.c2.x, s.c2.y, s.p.x, s.p.y)
        break
      case 'Q':
        ctx.quadraticCurveTo(s.c.x, s.c.y, s.p.x, s.p.y)
        break
      case 'Z':
        ctx.closePath()
        break
    }
  }
}

function zeichneVektor(
  ctx: CanvasRenderingContext2D,
  form: ZeichenElement,
  optionen: SymbolZeichnenOptionen,
) {
  if (form.art === 'text') {
    const zeilen = form.text.split('\n')
    const zeilenHoehe = form.groesse * TEXT_ZEILENHOEHE
    ctx.fillStyle = symbolFarbwert(form.farbe)
    ctx.font = `${form.fett ? 'bold ' : ''}${form.groesse}px ${TEXT_SCHRIFT}`
    ctx.textAlign =
      form.ausrichtung === 'links' ? 'left' : form.ausrichtung === 'mittig' ? 'center' : 'right'
    ctx.textBaseline = 'middle'
    ctx.translate(form.position.x, form.position.y)
    ctx.rotate((form.drehung * Math.PI) / 180)
    zeilen.forEach((zeile, i) => {
      ctx.fillText(zeile, 0, ((2 * i - (zeilen.length - 1)) * zeilenHoehe) / 2)
    })
    return
  }
  if (form.art === 'bild') {
    const quelle = optionen.bildQuelle?.(form.datenUrl)
    if (!quelle) return
    ctx.translate(form.mitte.x, form.mitte.y)
    ctx.rotate((form.drehung * Math.PI) / 180)
    ctx.drawImage(quelle, -form.breite / 2, -form.hoehe / 2, form.breite, form.hoehe)
    return
  }
  if (!hatStil(form)) return
  pfadAnlegen(ctx, alsPfadSegmente(form))
  if (istFuellbar(form) && form.fuellung !== 'keine') {
    ctx.fillStyle = symbolFarbwert(form.fuellung)
    ctx.fill()
  }
  if (form.strich > 0) {
    ctx.strokeStyle = symbolFarbwert(form.strichFarbe)
    ctx.lineWidth = form.strich
    if (form.gestrichelt) {
      const strich = Math.max(3, form.strich * 3)
      ctx.setLineDash([strich, strich * 0.7])
    }
    ctx.stroke()
  }
}

export function zeichneSymbolElement(
  ctx: CanvasRenderingContext2D,
  element: SymbolElement,
  optionen: SymbolZeichnenOptionen = {},
) {
  ctx.save()
  const farbe =
    element.art === 'bild' || element.art === 'vektor' ? '#000' : symbolFarbwert(element.farbe)
  ctx.strokeStyle = farbe
  ctx.fillStyle = farbe
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  switch (element.art) {
    case 'linie':
      ctx.lineWidth = SYMBOL_STRICH_BREITE[element.strich]
      ctx.beginPath()
      ctx.moveTo(element.a.x, element.a.y)
      ctx.lineTo(element.b.x, element.b.y)
      ctx.stroke()
      break
    case 'freihand':
      punktOderLinienzug(ctx, element.punkte, SYMBOL_STRICH_BREITE[element.strich])
      break
    case 'polylinie':
      if (element.punkte.length === 1) {
        punktOderLinienzug(ctx, element.punkte, SYMBOL_STRICH_BREITE[element.strich])
        break
      }
      linienzugPfad(ctx, element.punkte, element.geschlossen)
      strichUndFuellung(
        ctx,
        SYMBOL_STRICH_BREITE[element.strich],
        element,
        element.geschlossen && element.gefuellt,
      )
      break
    case 'rechteck':
      ctx.beginPath()
      ctx.rect(element.ecke.x, element.ecke.y, element.breite, element.hoehe)
      strichUndFuellung(ctx, SYMBOL_STRICH_BREITE[element.strich], element)
      break
    case 'kreis':
      ctx.beginPath()
      ctx.arc(element.mitte.x, element.mitte.y, element.radius, 0, Math.PI * 2)
      strichUndFuellung(ctx, SYMBOL_STRICH_BREITE[element.strich], element)
      break
    case 'bogen': {
      const spanne = bogenSpanne(element.startWinkel, element.endWinkel)
      ctx.lineWidth = SYMBOL_STRICH_BREITE[element.strich]
      ctx.beginPath()
      ctx.arc(
        element.mitte.x,
        element.mitte.y,
        element.radius,
        element.startWinkel,
        element.startWinkel + spanne,
      )
      ctx.stroke()
      break
    }
    case 'text': {
      const groesse = SYMBOL_TEXT_GROESSE[element.groesse]
      const zeilen = element.text.split('\n')
      const zeilenHoehe = groesse * SYMBOL_TEXT_ZEILENHOEHE
      const ersteZeileY = element.position.y - ((zeilen.length - 1) * zeilenHoehe) / 2
      ctx.font = `${groesse}px ${SYMBOL_SCHRIFT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      zeilen.forEach((zeile, i) => {
        ctx.fillText(zeile, element.position.x, ersteZeileY + i * zeilenHoehe)
      })
      break
    }
    case 'bild': {
      const quelle = optionen.bildQuelle?.(element.datenUrl)
      if (quelle) {
        ctx.drawImage(quelle, element.ecke.x, element.ecke.y, element.breite, element.hoehe)
      }
      break
    }
    case 'vektor':
      zeichneVektor(ctx, element.form, optionen)
      break
  }
  ctx.restore()
}

function zeichneRadierungen(ctx: CanvasRenderingContext2D, radierungen: SymbolRadierung[]) {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.strokeStyle = '#000'
  ctx.fillStyle = '#000'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const radierung of radierungen) punktOderLinienzug(ctx, radierung.punkte, radierung.breite)
  ctx.restore()
}

export function zeichneSymbolZeichnung(
  ctx: CanvasRenderingContext2D,
  zeichnung: SymbolZeichnung,
  optionen: SymbolZeichnenOptionen = {},
) {
  for (const element of zeichnung.elemente) {
    if (element.radierungen.length === 0) {
      zeichneSymbolElement(ctx, element, optionen)
      continue
    }
    const hilfe = holeEbene(ctx.canvas.width, ctx.canvas.height)
    const hilfeCtx = hilfe?.getContext('2d')
    if (!hilfe || !hilfeCtx) {
      zeichneSymbolElement(ctx, element, optionen)
      continue
    }
    hilfeCtx.setTransform(1, 0, 0, 1, 0, 0)
    hilfeCtx.clearRect(0, 0, hilfe.width, hilfe.height)
    hilfeCtx.setTransform(ctx.getTransform())
    zeichneSymbolElement(hilfeCtx, element, optionen)
    zeichneRadierungen(hilfeCtx, element.radierungen)
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(hilfe, 0, 0)
    ctx.restore()
  }
}
