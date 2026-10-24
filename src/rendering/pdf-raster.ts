import type { HintergrundPdf } from '../document-model'
import { hintergrundSchluessel } from '../document-model'
import type { Plansegment } from '../erkennung'
import { PDF_RASTER_SKALA, holePdfBitmap } from './background-renderer'
import type { RasterAnalyseAuftrag, RasterAnalyseErgebnis } from './raster-analyse.worker'

const cache = new Map<string, Promise<Plansegment[]>>()

export function ladePdfRastersegmente(
  hintergrund: HintergrundPdf,
  quelle: string,
): Promise<Plansegment[]> {
  const key = `${hintergrundSchluessel(hintergrund)}#${hintergrund.seite}`
  const vorhanden = cache.get(key)
  if (vorhanden) return vorhanden

  const versuch = werteBildAus(hintergrund, quelle).catch((fehler) => {
    cache.delete(key)
    throw fehler
  })
  cache.set(key, versuch)
  return versuch
}

async function werteBildAus(hintergrund: HintergrundPdf, quelle: string): Promise<Plansegment[]> {
  const canvas = await holePdfBitmap(hintergrund, quelle)
  if (!canvas) return []
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []

  const bild = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const grau = alsGraustufen(bild)
  const inPixeln = await imWorker({ breite: canvas.width, hoehe: canvas.height, daten: grau })

  const hoeheRoh = canvas.height / PDF_RASTER_SKALA
  return inPixeln.map((s) => ({
    a: { x: s.a.x / PDF_RASTER_SKALA, y: hoeheRoh - s.a.y / PDF_RASTER_SKALA },
    b: { x: s.b.x / PDF_RASTER_SKALA, y: hoeheRoh - s.b.y / PDF_RASTER_SKALA },
  }))
}

function alsGraustufen(bild: ImageData): Uint8Array {
  const grau = new Uint8Array(bild.width * bild.height)
  for (let i = 0; i < grau.length; i++) {
    const p = i * 4
    const alpha = bild.data[p + 3]
    if (alpha < 16) {
      grau[i] = 255
      continue
    }
    grau[i] = Math.round(0.299 * bild.data[p] + 0.587 * bild.data[p + 1] + 0.114 * bild.data[p + 2])
  }
  return grau
}

function imWorker(auftrag: RasterAnalyseAuftrag): Promise<Plansegment[]> {
  return new Promise((aufloesen, ablehnen) => {
    const worker = new Worker(new URL('./raster-analyse.worker.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = (nachricht: MessageEvent<RasterAnalyseErgebnis>) => {
      aufloesen(nachricht.data.segmente)
      worker.terminate()
    }
    worker.onerror = (fehler) => {
      ablehnen(
        fehler instanceof ErrorEvent ? new Error(fehler.message) : new Error('Worker-Fehler'),
      )
      worker.terminate()
    }
    worker.postMessage(auftrag, [auftrag.daten.buffer])
  })
}
