import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import DxfParser from 'dxf-parser'
import { t } from '../sprache'
import type {
  BoundingBox,
  DxfEntity,
  HintergrundDxf,
  HintergrundPdf,
  Point,
} from '../document-model'
import { boundingBoxFromPoints } from '../document-model'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl as string

export type AssetHochladen = (datei: Blob, dateiname: string) => Promise<string>

export function bestimmeHintergrundDateityp(dateiname: string): 'pdf' | 'dxf' | 'ifc' {
  const name = dateiname.toLowerCase()
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.dxf')) return 'dxf'
  if (name.endsWith('.ifc')) return 'ifc'
  throw new Error(t('modell.hintergrundImport.nurPdfOderDxf'))
}

function liesAlsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(t('modell.hintergrundImport.nichtLesbar')))
    reader.readAsDataURL(file)
  })
}

export interface PdfImportSitzung {
  dokument: pdfjsLib.PDFDocumentProxy
  assetId: string
}

export async function oeffnePdfFuerImport(
  file: File,
  ladeHoch: AssetHochladen,
): Promise<PdfImportSitzung> {
  const [dokument, assetId] = await Promise.all([
    liesAlsDataUrl(file).then((datenUrl) => pdfjsLib.getDocument({ url: datenUrl }).promise),
    ladeHoch(file, file.name),
  ])
  return { dokument, assetId }
}

export interface PdfAusschnitt {
  offset: Point
  breiteRoh: number
  hoeheRoh: number
}

export function baueHintergrundPdf(
  sitzung: PdfImportSitzung,
  dateiname: string,
  seite: number,
  ausschnitt: PdfAusschnitt,
  inhaltRoh: BoundingBox | null = null,
): HintergrundPdf {
  return {
    typ: 'pdf',
    dateiname,
    seite,
    seitenAnzahl: sitzung.dokument.numPages,
    assetId: sitzung.assetId,
    datenUrl: null,
    ausschnittOffset: ausschnitt.offset,
    breiteRoh: ausschnitt.breiteRoh,
    hoeheRoh: ausschnitt.hoeheRoh,
    ...(inhaltRoh ? { inhaltRoh } : {}),
    kalibrierung: null,
    ausblendungen: [],
  }
}

export interface SeitenVorschau {
  canvas: HTMLCanvasElement
  skala: number
}

export async function rendereSeitenVorschau(
  dokument: pdfjsLib.PDFDocumentProxy,
  seitenNr: number,
  maxBreitePx: number,
): Promise<SeitenVorschau> {
  const seite = await dokument.getPage(seitenNr)
  const rohViewport = seite.getViewport({ scale: 1 })
  const skala = maxBreitePx / rohViewport.width
  const viewport = seite.getViewport({ scale: skala })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Kein 2D-Context für PDF-Vorschau.')
  await seite.render({ canvasContext: ctx, viewport, canvas }).promise
  return { canvas, skala }
}

interface DxfVertex {
  x: number
  y: number
}
interface DxfRawEntity {
  type: string
  vertices?: DxfVertex[]
  center?: DxfVertex
  radius?: number
  startAngle?: number
  endAngle?: number
  shape?: boolean
}

export async function importiereDxfHintergrund(
  file: File,
  ladeHoch: AssetHochladen,
): Promise<HintergrundDxf> {
  const text = await file.text()
  const parser = new DxfParser()
  const dxf = parser.parseSync(text) as { entities?: DxfRawEntity[] } | null
  const rohEntities = dxf?.entities ?? []
  const entities: DxfEntity[] = []
  const punkteFuerBounds: Point[] = []

  for (const e of rohEntities) {
    if (e.type === 'LINE' && e.vertices && e.vertices.length >= 2) {
      const start = { x: e.vertices[0].x, y: e.vertices[0].y }
      const ende = { x: e.vertices[1].x, y: e.vertices[1].y }
      entities.push({ type: 'linie', start, ende })
      punkteFuerBounds.push(start, ende)
    } else if ((e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') && e.vertices) {
      const punkte = e.vertices.map((v) => ({ x: v.x, y: v.y }))
      entities.push({ type: 'polylinie', punkte, geschlossen: Boolean(e.shape) })
      punkteFuerBounds.push(...punkte)
    } else if (e.type === 'CIRCLE' && e.center && typeof e.radius === 'number') {
      const mittelpunkt = { x: e.center.x, y: e.center.y }
      entities.push({ type: 'kreis', mittelpunkt, radius: e.radius })
      punkteFuerBounds.push(
        { x: mittelpunkt.x - e.radius, y: mittelpunkt.y - e.radius },
        { x: mittelpunkt.x + e.radius, y: mittelpunkt.y + e.radius },
      )
    } else if (e.type === 'ARC' && e.center && typeof e.radius === 'number') {
      const mittelpunkt = { x: e.center.x, y: e.center.y }
      entities.push({
        type: 'bogen',
        mittelpunkt,
        radius: e.radius,
        startWinkel: ((e.startAngle ?? 0) * Math.PI) / 180,
        endWinkel: ((e.endAngle ?? 0) * Math.PI) / 180,
      })
      punkteFuerBounds.push(
        { x: mittelpunkt.x - e.radius, y: mittelpunkt.y - e.radius },
        { x: mittelpunkt.x + e.radius, y: mittelpunkt.y + e.radius },
      )
    }
  }

  const bb = boundingBoxFromPoints(
    punkteFuerBounds.length
      ? punkteFuerBounds
      : [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
  )
  const verschobeneEntities = entities.map((e) => verschiebeEntity(e, -bb.min.x, -bb.min.y))

  const assetId = await ladeHoch(file, file.name)

  return {
    typ: 'dxf',
    dateiname: file.name,
    assetId,
    datenUrl: null,
    entities: verschobeneEntities,
    breiteRoh: bb.max.x - bb.min.x || 1,
    hoeheRoh: bb.max.y - bb.min.y || 1,
    kalibrierung: null,
    ausblendungen: [],
  }
}

function verschiebeEntity(e: DxfEntity, dx: number, dy: number): DxfEntity {
  const v = (p: Point) => ({ x: p.x + dx, y: p.y + dy })
  switch (e.type) {
    case 'linie':
      return { ...e, start: v(e.start), ende: v(e.ende) }
    case 'polylinie':
      return { ...e, punkte: e.punkte.map(v) }
    case 'kreis':
      return { ...e, mittelpunkt: v(e.mittelpunkt) }
    case 'bogen':
      return { ...e, mittelpunkt: v(e.mittelpunkt) }
  }
}
