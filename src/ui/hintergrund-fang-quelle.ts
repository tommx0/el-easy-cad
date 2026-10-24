import type { Blatt, Hintergrund, HintergrundPdf, Point } from '../document-model'
import { hintergrundQuelle } from '../document-model'
import { assetUrl } from '../persistence'
import { ladePdfHintergrundLinien } from '../rendering'
import type { HintergrundFangRaster, RohLinie } from '../tools'
import { baueHintergrundFangRaster, elementeAusHintergrund } from '../tools'

interface Eintrag {
  ursprung: Point
  massstab: number | null
  drehung: number | undefined
  raster: HintergrundFangRaster | null
}

const zwischenspeicher = new WeakMap<Hintergrund, Eintrag>()
const pdfLaden = new WeakMap<HintergrundPdf, Promise<RohLinie[]>>()
const pdfFertig = new WeakMap<HintergrundPdf, RohLinie[]>()

export function ladePdfLinienGemerkt(h: HintergrundPdf): Promise<RohLinie[]> {
  let laden = pdfLaden.get(h)
  if (!laden) {
    const quelle = hintergrundQuelle(h, assetUrl)
    laden = quelle ? ladePdfHintergrundLinien(h, quelle) : Promise.resolve([])
    laden.then(
      (linien) => pdfFertig.set(h, linien),
      () => undefined,
    )
    pdfLaden.set(h, laden)
  }
  return laden
}

export function hintergrundFangRaster(
  blatt: Blatt,
  onBereit: () => void,
): HintergrundFangRaster | null {
  const h = blatt.hintergrund
  if (!h || h.typ === 'unbekannt') return null
  if (!blatt.hintergrundSichtbar || blatt.hintergrundDeckkraft <= 0) return null
  if (blatt.ebenen.some((e) => e.istHintergrundLayer && !e.sichtbar)) return null

  let linien: RohLinie[] | undefined
  if (h.typ === 'pdf') {
    linien = pdfFertig.get(h)
    if (!linien) {
      if (!pdfLaden.has(h)) ladePdfLinienGemerkt(h).then(onBereit, () => undefined)
      return null
    }
  }

  const bisher = zwischenspeicher.get(h)
  if (
    bisher &&
    bisher.massstab === blatt.massstab &&
    bisher.drehung === blatt.hintergrundDrehung &&
    bisher.ursprung.x === blatt.ursprung.x &&
    bisher.ursprung.y === blatt.ursprung.y
  ) {
    return bisher.raster
  }
  const elemente = elementeAusHintergrund(blatt, linien)
  const raster = elemente.length > 0 ? baueHintergrundFangRaster(elemente) : null
  zwischenspeicher.set(h, {
    ursprung: { ...blatt.ursprung },
    massstab: blatt.massstab,
    drehung: blatt.hintergrundDrehung,
    raster,
  })
  return raster
}
