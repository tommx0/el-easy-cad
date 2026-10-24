import * as pdfjsLib from 'pdfjs-dist'
import type {
  Blatt,
  DxfEntity,
  Hintergrund,
  HintergrundAusblendung,
  Point,
} from '../document-model'
import {
  hintergrundDrehungVon,
  hintergrundMassstab,
  hintergrundQuelle,
  hintergrundSchluessel,
  istBekannterHintergrund,
  rohWinkelZuWelt,
  rohZuWelt,
  sichtbareIfcEntities,
} from '../document-model'
import type { ViewTransform } from './view-transform'

const RENDER_SKALA = 2 // Pixel pro PDF-Punkt fuer die gecachte Rasterisierung.

interface BitmapEintrag {
  status: 'laedt' | 'fertig' | 'fehler'
  canvas?: HTMLCanvasElement
}

const pdfBitmapCache = new Map<string, BitmapEintrag>()

const pdfBitmapLadePromises = new Map<string, Promise<void>>()

const pdfDokumentCache = new Map<string, Promise<pdfjsLib.PDFDocumentProxy>>()

export function ladeDokument(
  dateiSchluessel: string,
  quelle: string,
): Promise<pdfjsLib.PDFDocumentProxy> {
  let dokument = pdfDokumentCache.get(dateiSchluessel)
  if (!dokument) {
    dokument = pdfjsLib.getDocument({ url: quelle }).promise
    pdfDokumentCache.set(dateiSchluessel, dokument)
    dokument.catch(() => pdfDokumentCache.delete(dateiSchluessel))
  }
  return dokument
}

function ladePdfBitmap(
  hintergrund: Extract<Hintergrund, { typ: 'pdf' }>,
  quelle: string,
): Promise<void> {
  const dateiSchluessel = hintergrundSchluessel(hintergrund)
  const key = `${dateiSchluessel}#${hintergrund.seite}`
  const laufend = pdfBitmapLadePromises.get(key)
  if (laufend) return laufend
  if (pdfBitmapCache.has(key)) return Promise.resolve()

  pdfBitmapCache.set(key, { status: 'laedt' })
  const versuch = ladeDokument(dateiSchluessel, quelle)
    .then((dok) => dok.getPage(hintergrund.seite))
    .then((seite) => {
      const viewport = seite.getViewport({ scale: RENDER_SKALA })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Kein 2D-Context für PDF-Rasterisierung.')
      return seite.render({ canvasContext: ctx, viewport, canvas }).promise.then(() => canvas)
    })
    .then((canvas) => {
      pdfBitmapCache.set(key, { status: 'fertig', canvas })
    })
    .catch(() => {
      pdfBitmapCache.set(key, { status: 'fehler' })
    })
    .finally(() => {
      pdfBitmapLadePromises.delete(key)
    })
  pdfBitmapLadePromises.set(key, versuch)
  return versuch
}

export async function holePdfBitmap(
  hintergrund: Extract<Hintergrund, { typ: 'pdf' }>,
  quelle: string,
): Promise<HTMLCanvasElement | null> {
  const key = `${hintergrundSchluessel(hintergrund)}#${hintergrund.seite}`
  await ladePdfBitmap(hintergrund, quelle)
  const eintrag = pdfBitmapCache.get(key)
  return eintrag?.status === 'fertig' ? (eintrag.canvas ?? null) : null
}

export const PDF_RASTER_SKALA = RENDER_SKALA

export function zeichneHintergrundBild(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  blatt: Blatt,
  onBitmapBereit: () => void,
  assetQuelle?: (assetId: string) => string,
) {
  const hintergrund = blatt.hintergrund
  if (!istBekannterHintergrund(hintergrund)) return
  if (!blatt.hintergrundSichtbar) return
  if (blatt.hintergrundDeckkraft <= 0) return

  ctx.save()
  ctx.globalAlpha = blatt.hintergrundDeckkraft
  try {
    if (hintergrund.typ === 'pdf') {
      const quelle = hintergrundQuelle(hintergrund, assetQuelle)
      if (!quelle) return
      const key = `${hintergrundSchluessel(hintergrund)}#${hintergrund.seite}`
      const eintrag = pdfBitmapCache.get(key)
      if (!eintrag) {
        void ladePdfBitmap(hintergrund, quelle).then(onBitmapBereit)
        return
      }
      if (eintrag.status === 'laedt') {
        void pdfBitmapLadePromises.get(key)?.then(onBitmapBereit)
        return
      }
      if (eintrag.status !== 'fertig' || !eintrag.canvas) return
      zeichneRasterBild(
        ctx,
        view,
        blatt,
        hintergrund.ausschnittOffset,
        hintergrund.breiteRoh,
        hintergrund.hoeheRoh,
        eintrag.canvas,
      )
    } else {
      const entities =
        hintergrund.typ === 'ifc' ? sichtbareIfcEntities(hintergrund) : hintergrund.entities
      zeichneDxfEntities(ctx, view, blatt, entities)
    }
  } finally {
    ctx.restore()
  }
  zeichneAusblendungen(ctx, view, blatt, hintergrund.ausblendungen)
}

function zeichneAusblendungen(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  blatt: Blatt,
  ausblendungen: HintergrundAusblendung[],
) {
  if (ausblendungen.length === 0) return
  ctx.save()
  ctx.globalAlpha = 1
  ctx.fillStyle = '#ffffff'
  const gedreht = hintergrundDrehungVon(blatt) !== 0
  for (const ausblendung of ausblendungen) {
    const { eckeA: a, eckeB: b } = ausblendung
    if (!gedreht) {
      const sa = view.worldToScreen(rohZuWelt(blatt, a))
      const sb = view.worldToScreen(rohZuWelt(blatt, b))
      ctx.fillRect(
        Math.min(sa.x, sb.x),
        Math.min(sa.y, sb.y),
        Math.abs(sb.x - sa.x),
        Math.abs(sb.y - sa.y),
      )
      continue
    }
    const ecken = [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }].map((p) =>
      view.worldToScreen(rohZuWelt(blatt, p)),
    )
    ctx.beginPath()
    ctx.moveTo(ecken[0].x, ecken[0].y)
    for (const p of ecken.slice(1)) ctx.lineTo(p.x, p.y)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

export async function ladeAlleHintergrundBitmaps(
  blaetter: Blatt[],
  assetQuelle: (assetId: string) => string,
  onFortschritt?: (erledigt: number, gesamt: number) => void,
): Promise<void> {
  const gesehen = new Set<string>()
  const arbeiten: { hintergrund: Extract<Hintergrund, { typ: 'pdf' }>; quelle: string }[] = []

  for (const blatt of blaetter) {
    const hintergrund = blatt.hintergrund
    if (!hintergrund || hintergrund.typ !== 'pdf') continue
    const quelle = hintergrundQuelle(hintergrund, assetQuelle)
    if (!quelle) continue
    const key = `${hintergrundSchluessel(hintergrund)}#${hintergrund.seite}`
    if (gesehen.has(key) || pdfBitmapCache.has(key)) continue
    gesehen.add(key)
    arbeiten.push({ hintergrund, quelle })
  }

  const gesamt = arbeiten.length
  if (gesamt === 0) return

  let erledigt = 0
  onFortschritt?.(erledigt, gesamt)
  await Promise.all(
    arbeiten.map(({ hintergrund, quelle }) =>
      ladePdfBitmap(hintergrund, quelle).then(() => {
        erledigt += 1
        onFortschritt?.(erledigt, gesamt)
      }),
    ),
  )
}

function zeichneRasterBild(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  blatt: Blatt,
  ausschnittOffset: Point,
  breiteRoh: number,
  hoeheRoh: number,
  bild: HTMLCanvasElement,
) {
  const obenLinksWelt = rohZuWelt(blatt, { x: 0, y: hoeheRoh })
  const obenLinksScreen = view.worldToScreen(obenLinksWelt)
  const breiteScreen = view.laengeToScreen(breiteRoh * hintergrundMassstab(blatt))
  const hoeheScreen = view.laengeToScreen(hoeheRoh * hintergrundMassstab(blatt))
  const sx = ausschnittOffset.x * RENDER_SKALA
  const sy = ausschnittOffset.y * RENDER_SKALA
  const sBreite = breiteRoh * RENDER_SKALA
  const sHoehe = hoeheRoh * RENDER_SKALA
  ctx.save()
  ctx.imageSmoothingEnabled = true
  const drehung = hintergrundDrehungVon(blatt)
  if (drehung === 0) {
    ctx.drawImage(
      bild,
      sx,
      sy,
      sBreite,
      sHoehe,
      obenLinksScreen.x,
      obenLinksScreen.y,
      breiteScreen,
      hoeheScreen,
    )
  } else {
    ctx.translate(obenLinksScreen.x, obenLinksScreen.y)
    ctx.rotate(-drehung)
    ctx.drawImage(bild, sx, sy, sBreite, sHoehe, 0, 0, breiteScreen, hoeheScreen)
  }
  ctx.restore()
}

function zeichneDxfEntities(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  blatt: Blatt,
  entities: DxfEntity[],
) {
  ctx.save()
  ctx.strokeStyle = '#7a8699'
  ctx.lineWidth = 1
  for (const e of entities) {
    ctx.beginPath()
    if (e.type === 'linie') {
      const a = view.worldToScreen(rohZuWelt(blatt, e.start))
      const b = view.worldToScreen(rohZuWelt(blatt, e.ende))
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
    } else if (e.type === 'polylinie') {
      const punkte = e.punkte.map((p) => view.worldToScreen(rohZuWelt(blatt, p)))
      if (punkte.length === 0) continue
      ctx.moveTo(punkte[0].x, punkte[0].y)
      for (const p of punkte.slice(1)) ctx.lineTo(p.x, p.y)
      if (e.geschlossen) ctx.closePath()
    } else if (e.type === 'kreis') {
      const m = view.worldToScreen(rohZuWelt(blatt, e.mittelpunkt))
      const r = view.laengeToScreen(e.radius * hintergrundMassstab(blatt))
      ctx.arc(m.x, m.y, r, 0, Math.PI * 2)
    } else if (e.type === 'bogen') {
      const m = view.worldToScreen(rohZuWelt(blatt, e.mittelpunkt))
      const r = view.laengeToScreen(e.radius * hintergrundMassstab(blatt))
      ctx.arc(
        m.x,
        m.y,
        r,
        -rohWinkelZuWelt(blatt, e.endWinkel),
        -rohWinkelZuWelt(blatt, e.startWinkel),
      )
    }
    ctx.stroke()
  }
  ctx.restore()
}
