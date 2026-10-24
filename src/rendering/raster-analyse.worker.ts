import type { Plansegment } from '../erkennung'
import { STANDARD_RASTER_OPTIONEN, erkenneRasterlinien } from '../erkennung'

export interface RasterAnalyseAuftrag {
  breite: number
  hoehe: number
  daten: Uint8Array
}

export interface RasterAnalyseErgebnis {
  segmente: Plansegment[]
}

self.onmessage = (nachricht: MessageEvent<RasterAnalyseAuftrag>) => {
  const { breite, hoehe, daten } = nachricht.data
  const segmente = erkenneRasterlinien({ breite, hoehe, daten }, STANDARD_RASTER_OPTIONEN)
  const antwort: RasterAnalyseErgebnis = { segmente }
  self.postMessage(antwort)
}
