import type { BaumLayoutKnoten, BaumModell, Point } from '../document-model'
import {
  KNOTEN_RAND_ANTEIL,
  STICH_ANTEIL,
  UNTERTITEL_SKALA,
  ZEILEN_HOEHE_ANTEIL,
} from '../document-model'
import type { ViewTransform } from './view-transform'

export function zeichneBaum(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  position: Point,
  modell: BaumModell,
  farbe: string,
  strichstaerke: number,
) {
  const ecke = view.worldToScreen(position)
  const textHoehe = view.laengeToScreen(modell.textHoehe)
  const zeilenHoehe = textHoehe * ZEILEN_HOEHE_ANTEIL
  const rand = textHoehe * KNOTEN_RAND_ANTEIL
  const stich = textHoehe * STICH_ANTEIL
  const schrift = zeilenHoehe / ZEILEN_HOEHE_ANTEIL

  ctx.save()
  ctx.lineWidth = strichstaerke
  ctx.textBaseline = 'middle'

  ctx.fillStyle = farbe
  ctx.font = `bold ${schrift}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(modell.titel, ecke.x, ecke.y + view.laengeToScreen(modell.titelHoehe) / 2)

  const px = (layout: BaumLayoutKnoten) => ({
    x: ecke.x + view.laengeToScreen(layout.x),
    y: ecke.y + view.laengeToScreen(layout.y),
    breite: view.laengeToScreen(layout.breite),
    hoehe: view.laengeToScreen(layout.hoehe),
  })

  const zeichneKnoten = (layout: BaumLayoutKnoten) => {
    const { x, y, breite, hoehe } = px(layout)
    const { knoten } = layout
    const gestrichelt = knoten.art === 'offen' || knoten.art === 'hinweis'
    const radius = knoten.art === 'trunk' ? Math.min(hoehe / 3, textHoehe) : 0

    ctx.save()
    ctx.setLineDash(gestrichelt ? [textHoehe * 0.6, textHoehe * 0.4] : [])
    ctx.lineWidth = strichstaerke * (knoten.art === 'verteiler' ? 2 : 1)
    ctx.strokeStyle = knoten.farbe
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.roundRect(x, y, breite, hoehe, radius)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    if (knoten.art !== 'hinweis') {
      ctx.fillStyle = knoten.farbe
      ctx.fillRect(x, y, Math.max(1, textHoehe * 0.3), hoehe)
      if (knoten.art === 'schacht') zeichneSteigpfeil(ctx, x, y, hoehe, textHoehe)
    }

    ctx.fillStyle = knoten.farbe
    ctx.font = `bold ${schrift}px sans-serif`
    ctx.textAlign = 'left'
    knoten.titel.forEach((zeile, index) => {
      ctx.fillText(zeile, x + rand, y + (index + 0.5) * zeilenHoehe)
    })
    if (knoten.kennzahl) {
      ctx.textAlign = 'right'
      ctx.fillText(knoten.kennzahl, x + breite - rand * 0.6, y + 0.5 * zeilenHoehe)
    }

    ctx.font = `${schrift * UNTERTITEL_SKALA}px sans-serif`
    ctx.textAlign = 'left'
    knoten.untertitel.forEach((zeile, index) => {
      ctx.fillText(zeile, x + rand, y + (knoten.titel.length + index + 0.5) * zeilenHoehe)
    })

    zeichneKanten(layout)
    for (const kind of layout.kinder) zeichneKnoten(kind)
  }

  const zeichneKanten = (layout: BaumLayoutKnoten) => {
    if (layout.kinder.length === 0) return
    const eltern = px(layout)
    const mitteX = eltern.x + eltern.breite / 2
    const unten = eltern.y + eltern.hoehe
    const struktur = layout.kinder.filter((kind) => !kind.gestapelt)
    const stapel = layout.kinder.filter((kind) => kind.gestapelt)
    const ersteKindOben = Math.min(...layout.kinder.map((kind) => px(kind).y))
    const busY = (unten + ersteKindOben) / 2

    ctx.save()
    ctx.strokeStyle = farbe
    ctx.lineWidth = strichstaerke
    ctx.beginPath()
    ctx.moveTo(mitteX, unten)
    ctx.lineTo(mitteX, busY)
    ctx.stroke()

    for (const kind of struktur) {
      const k = px(kind)
      const kindMitteX = k.x + k.breite / 2
      ctx.beginPath()
      ctx.moveTo(mitteX, busY)
      ctx.lineTo(kindMitteX, busY)
      ctx.lineTo(kindMitteX, k.y)
      ctx.stroke()
      if (kind.knoten.kantenText) {
        ctx.fillStyle = farbe
        ctx.font = `${schrift * UNTERTITEL_SKALA}px sans-serif`
        ctx.textAlign = 'left'
        ctx.fillText(kind.knoten.kantenText, kindMitteX + textHoehe * 0.3, (busY + k.y) / 2)
      }
    }

    if (stapel.length > 0) {
      const ersterStapel = px(stapel[0])
      const schieneX = ersterStapel.x - stich
      const letzter = px(stapel[stapel.length - 1])
      ctx.beginPath()
      ctx.moveTo(mitteX, busY)
      ctx.lineTo(schieneX, busY)
      ctx.lineTo(schieneX, letzter.y + letzter.hoehe / 2)
      ctx.stroke()
      for (const kind of stapel) {
        const k = px(kind)
        const mitteY = k.y + k.hoehe / 2
        ctx.beginPath()
        ctx.moveTo(schieneX, mitteY)
        ctx.lineTo(k.x, mitteY)
        ctx.stroke()
        if (kind.knoten.kantenText) {
          ctx.fillStyle = farbe
          ctx.font = `${schrift * UNTERTITEL_SKALA}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(kind.knoten.kantenText, (schieneX + k.x) / 2, mitteY - schrift * 0.6)
        }
      }
    }
    ctx.restore()
  }

  for (const wurzel of modell.wurzeln) zeichneKnoten(wurzel)
  ctx.restore()
}

function zeichneSteigpfeil(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hoehe: number,
  textHoehe: number,
) {
  const mitteX = x + Math.max(1, textHoehe * 0.3) / 2
  const oben = y + hoehe * 0.25
  const unten = y + hoehe * 0.75
  const fluegel = textHoehe * 0.22
  ctx.save()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = Math.max(1, textHoehe * 0.08)
  ctx.beginPath()
  ctx.moveTo(mitteX, oben)
  ctx.lineTo(mitteX, unten)
  ctx.moveTo(mitteX - fluegel, unten - fluegel)
  ctx.lineTo(mitteX, unten)
  ctx.lineTo(mitteX + fluegel, unten - fluegel)
  ctx.stroke()
  ctx.restore()
}
