import type { Point, PlankopfModell } from '../document-model'
import { plankopfWertHoehe } from '../document-model'
import { holeAssetBild } from './asset-bild-cache'
import type { ViewTransform } from './view-transform'

export function zeichnePlankopf(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  position: Point,
  modell: PlankopfModell,
  farbe: string,
  strichstaerke: number,
  aufNeuZeichnenAnfordern: () => void,
) {
  const obenLinks = view.worldToScreen(position)
  const breite = view.laengeToScreen(modell.gesamtBreite)
  const hoehe = view.laengeToScreen(modell.gesamtHoehe)
  const innenRand = view.laengeToScreen(modell.innenRand)
  const beschriftungPx = view.laengeToScreen(modell.beschriftungHoehe)

  ctx.save()
  ctx.strokeStyle = farbe
  ctx.fillStyle = farbe
  ctx.lineWidth = strichstaerke
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  ctx.lineWidth = strichstaerke * 1.6
  ctx.strokeRect(obenLinks.x, obenLinks.y, breite, hoehe)
  ctx.lineWidth = strichstaerke

  for (const y of modell.trennlinienY) {
    const py = obenLinks.y + view.laengeToScreen(y)
    ctx.beginPath()
    ctx.moveTo(obenLinks.x, py)
    ctx.lineTo(obenLinks.x + breite, py)
    ctx.stroke()
  }

  for (const zelle of modell.zellen) {
    const x = obenLinks.x + view.laengeToScreen(zelle.x)
    const y = obenLinks.y + view.laengeToScreen(zelle.y)
    const zellenBreite = view.laengeToScreen(zelle.breite)
    const zellenHoehe = view.laengeToScreen(zelle.hoehe)

    if (zelle.x > 0) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + zellenHoehe)
      ctx.stroke()
    }

    const nutzBreite = zellenBreite - innenRand * 2
    if (nutzBreite <= 0) continue

    if (zelle.beschriftung) {
      ctx.font = `${beschriftungPx}px sans-serif`
      ctx.fillText(
        kuerzeAufBreite(ctx, zelle.beschriftung, nutzBreite),
        x + innenRand,
        y + innenRand + beschriftungPx,
      )
    }

    if (zelle.logo) {
      const bildHoehe =
        zellenHoehe - innenRand - (zelle.beschriftung ? beschriftungPx + innenRand : 0)
      const bildBereichY = y + zellenHoehe - innenRand - bildHoehe
      const image = holeAssetBild(zelle.logo.assetId, aufNeuZeichnenAnfordern)
      if (image && image.naturalWidth > 0 && bildHoehe > 0) {
        const skala = Math.min(nutzBreite / image.naturalWidth, bildHoehe / image.naturalHeight)
        const breite = image.naturalWidth * skala
        const hoehe = image.naturalHeight * skala
        ctx.drawImage(image, x + innenRand, bildBereichY + (bildHoehe - hoehe) / 2, breite, hoehe)
      }
    } else if (zelle.text) {
      const wertPx = view.laengeToScreen(plankopfWertHoehe(zelle.hoehe, modell))
      ctx.font = `${wertPx}px sans-serif`
      ctx.fillText(
        kuerzeAufBreite(ctx, zelle.text, nutzBreite),
        x + innenRand,
        y + zellenHoehe - innenRand,
      )
    }
  }

  ctx.restore()
}

export function kuerzeAufBreite(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxBreite: number,
): string {
  if (ctx.measureText(text).width <= maxBreite) return text
  let gekuerzt = text
  while (gekuerzt.length > 0 && ctx.measureText(`${gekuerzt}…`).width > maxBreite) {
    gekuerzt = gekuerzt.slice(0, -1)
  }
  return gekuerzt.length > 0 ? `${gekuerzt}…` : ''
}
