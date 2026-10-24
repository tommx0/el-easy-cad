import type { Point, SlotMatrixGrafik, TabellenModell, TabellenZeile } from '../document-model'
import type { ViewTransform } from './view-transform'

export const SLOT_MATRIX_GRAU = '#b9b9b9'
export const SLOT_MATRIX_ROT = '#d62f3a'
const SLOT_MATRIX_SPALT_ANTEIL = 0.06

export function zeichneSlotMatrixGrafik(
  ctx: CanvasRenderingContext2D,
  links: number,
  oben: number,
  seite: number,
  matrix: SlotMatrixGrafik,
) {
  const reihen = matrix.reihen.length
  if (reihen === 0) return
  const spalt = seite * SLOT_MATRIX_SPALT_ANTEIL
  const reihenHoehe = (seite - spalt * (reihen - 1)) / reihen
  let slotIndex = 0
  ctx.save()
  matrix.reihen.forEach((spalten, reihe) => {
    const y = oben + reihe * (reihenHoehe + spalt)
    const slotBreite = (seite - spalt * (spalten - 1)) / spalten
    for (let s = 0; s < spalten; s++, slotIndex++) {
      ctx.fillStyle = slotIndex === matrix.hervorgehoben ? SLOT_MATRIX_ROT : SLOT_MATRIX_GRAU
      ctx.fillRect(links + s * (slotBreite + spalt), y, slotBreite, reihenHoehe)
    }
  })
  ctx.restore()
}

export function zeichneTabelle(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  position: Point,
  modell: TabellenModell,
  farbe: string,
  strichstaerke: number,
) {
  const linkeKante = view.worldToScreen(position)
  const breite = view.laengeToScreen(modell.gesamtBreite)
  const zeilenHoehe = view.laengeToScreen(modell.kopfHoehe)
  const titelHoehe = view.laengeToScreen(modell.titelHoehe)
  const schriftgroesse = zeilenHoehe / 1.6
  const innenRand = schriftgroesse * 0.4

  ctx.save()
  ctx.strokeStyle = farbe
  ctx.fillStyle = farbe
  ctx.lineWidth = strichstaerke
  ctx.textBaseline = 'middle'

  ctx.font = `bold ${schriftgroesse}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(modell.titel, linkeKante.x, linkeKante.y + titelHoehe / 2)

  const tabellenOben = linkeKante.y + titelHoehe
  const alleZeilen = modell.summe ? [...modell.zeilen, modell.summe] : modell.zeilen
  const zeilenHoehenPx = alleZeilen.map((zeile) => view.laengeToScreen(zeile.hoehe))
  const inhaltHoehe = zeilenHoehenPx.reduce((summe, h) => summe + h, zeilenHoehe)

  ctx.strokeRect(linkeKante.x, tabellenOben, breite, inhaltHoehe)

  let spaltenX = linkeKante.x
  for (const spalte of modell.spalten.slice(0, -1)) {
    spaltenX += view.laengeToScreen(spalte.breite)
    ctx.beginPath()
    ctx.moveTo(spaltenX, tabellenOben)
    ctx.lineTo(spaltenX, tabellenOben + inhaltHoehe)
    ctx.stroke()
  }

  const grafikSeite = view.laengeToScreen(modell.grafikSeite)

  const zeichneZeile = (
    oben: number,
    hoehe: number,
    zellen: string[][],
    fett: boolean,
    grafik?: TabellenZeile['grafik'],
  ) => {
    ctx.font = `${fett ? 'bold ' : ''}${schriftgroesse}px sans-serif`
    let x = linkeKante.x
    modell.spalten.forEach((spalte, index) => {
      const spaltenBreite = view.laengeToScreen(spalte.breite)
      if (grafik?.spalte === index) {
        zeichneSlotMatrixGrafik(
          ctx,
          x + (spaltenBreite - grafikSeite) / 2,
          oben + (hoehe - grafikSeite) / 2,
          grafikSeite,
          grafik.matrix,
        )
        x += spaltenBreite
        return
      }
      const texte = zellen[index] ?? ['']
      texte.forEach((text, zeilenIndex) => {
        const y = oben + (zeilenIndex + 0.5) * zeilenHoehe
        if (spalte.ausrichtung === 'rechts') {
          ctx.textAlign = 'right'
          ctx.fillText(text, x + spaltenBreite - innenRand, y)
        } else {
          ctx.textAlign = 'left'
          ctx.fillText(text, x + innenRand, y)
        }
      })
      x += spaltenBreite
    })
    ctx.beginPath()
    ctx.moveTo(linkeKante.x, oben + hoehe)
    ctx.lineTo(linkeKante.x + breite, oben + hoehe)
    ctx.stroke()
  }

  zeichneZeile(
    tabellenOben,
    zeilenHoehe,
    modell.spalten.map((spalte) => [spalte.kopf]),
    true,
  )

  let y = tabellenOben + zeilenHoehe
  alleZeilen.forEach((zeile, index) => {
    const hoehe = zeilenHoehenPx[index]
    const istSumme = modell.summe !== null && index === alleZeilen.length - 1
    zeichneZeile(y, hoehe, zeile.zellen, istSumme, zeile.grafik)
    y += hoehe
  })

  ctx.restore()
}
