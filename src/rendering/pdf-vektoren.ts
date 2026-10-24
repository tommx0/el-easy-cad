import * as pdfjsLib from 'pdfjs-dist'
import type { BoundingBox, HintergrundPdf, Point } from '../document-model'
import { hintergrundSchluessel, pdfInhaltsrahmen } from '../document-model'
import type { Matrix, PdfOperatorCodes, Plansegment } from '../erkennung'
import { pdfOperatorenAlsSegmente } from '../erkennung'
import { ladeDokument } from './background-renderer'

const codes: PdfOperatorCodes = {
  constructPath: pdfjsLib.OPS.constructPath,
  transform: pdfjsLib.OPS.transform,
  save: pdfjsLib.OPS.save,
  restore: pdfjsLib.OPS.restore,
  paintFormXObjectBegin: pdfjsLib.OPS.paintFormXObjectBegin,
  paintFormXObjectEnd: pdfjsLib.OPS.paintFormXObjectEnd,
  strichOps: [pdfjsLib.OPS.stroke, pdfjsLib.OPS.closeStroke],
  setStrokeRGBColor: pdfjsLib.OPS.setStrokeRGBColor,
  setFillRGBColor: pdfjsLib.OPS.setFillRGBColor,
  zeichnendeOps: [
    pdfjsLib.OPS.stroke,
    pdfjsLib.OPS.closeStroke,
    pdfjsLib.OPS.fill,
    pdfjsLib.OPS.eoFill,
    pdfjsLib.OPS.fillStroke,
    pdfjsLib.OPS.eoFillStroke,
    pdfjsLib.OPS.closeFillStroke,
    pdfjsLib.OPS.closeEOFillStroke,
  ],
}

const cache = new Map<string, Promise<Plansegment[]>>()

export function ladePdfPlansegmente(
  hintergrund: HintergrundPdf,
  quelle: string,
): Promise<Plansegment[]> {
  const dateiSchluessel = hintergrundSchluessel(hintergrund)
  const key = `${dateiSchluessel}#${hintergrund.seite}`
  const vorhanden = cache.get(key)
  if (vorhanden) return vorhanden

  const versuch = werteSeiteAus(hintergrund, dateiSchluessel, quelle).catch((fehler) => {
    cache.delete(key)
    throw fehler
  })
  cache.set(key, versuch)
  return versuch
}

async function werteSeiteAus(
  hintergrund: HintergrundPdf,
  dateiSchluessel: string,
  quelle: string,
): Promise<Plansegment[]> {
  const dokument = await ladeDokument(dateiSchluessel, quelle)
  return segmenteDerSeite(await dokument.getPage(hintergrund.seite))
}

async function segmenteDerSeite(seite: pdfjsLib.PDFPageProxy): Promise<Plansegment[]> {
  const viewport = seite.getViewport({ scale: 1 })
  const liste = await seite.getOperatorList()

  const basis = viewport.transform as unknown as Matrix
  const inViewport = pdfOperatorenAlsSegmente(liste, codes, basis)

  const hoehe = viewport.height
  const gespiegelt = (p: Point): Point => ({ x: p.x, y: hoehe - p.y })
  return inViewport.map((s) => ({ ...s, a: gespiegelt(s.a), b: gespiegelt(s.b) }))
}

export async function ermittlePdfInhalt(
  dokument: pdfjsLib.PDFDocumentProxy,
  seitenNr: number,
  ausschnitt: { offset: Point; breiteRoh: number; hoeheRoh: number },
): Promise<BoundingBox | null> {
  try {
    const seite = await dokument.getPage(seitenNr)
    const segmente = await segmenteDerSeite(seite)
    const seitenHoehe = seite.getViewport({ scale: 1 }).height
    const dx = ausschnitt.offset.x
    const dy = seitenHoehe - ausschnitt.offset.y - ausschnitt.hoeheRoh
    const linien = segmente.map((s) => ({
      a: { x: s.a.x - dx, y: s.a.y - dy },
      b: { x: s.b.x - dx, y: s.b.y - dy },
    }))
    const innen = (p: Point) =>
      p.x >= 0 && p.x <= ausschnitt.breiteRoh && p.y >= 0 && p.y <= ausschnitt.hoeheRoh
    return pdfInhaltsrahmen(
      linien.filter((l) => innen(l.a) || innen(l.b)),
      ausschnitt.breiteRoh,
      ausschnitt.hoeheRoh,
    )
  } catch {
    return null
  }
}

export async function ladePdfHintergrundLinien(
  hintergrund: HintergrundPdf,
  quelle: string,
): Promise<{ a: Point; b: Point }[]> {
  const segmente = await ladePdfPlansegmente(hintergrund, quelle)
  const dokument = await ladeDokument(hintergrundSchluessel(hintergrund), quelle)
  const seite = await dokument.getPage(hintergrund.seite)
  const seitenHoehe = seite.getViewport({ scale: 1 }).height
  const dx = hintergrund.ausschnittOffset.x
  const dy = seitenHoehe - hintergrund.ausschnittOffset.y - hintergrund.hoeheRoh
  const innen = (p: Point) =>
    p.x >= 0 && p.x <= hintergrund.breiteRoh && p.y >= 0 && p.y <= hintergrund.hoeheRoh
  const linien: { a: Point; b: Point }[] = []
  for (const s of segmente) {
    const a = { x: s.a.x - dx, y: s.a.y - dy }
    const b = { x: s.b.x - dx, y: s.b.y - dy }
    if (innen(a) || innen(b)) linien.push({ a, b })
  }
  return linien
}
