import { jsPDF } from 'jspdf'
import type { LizenzModul, Zeichnung } from '../document-model'
import type { KomponentenRahmenBasis } from './druck-canvas'
import { erzeugeDruckCanvas } from './druck-canvas'
import type { PapierWahl } from './layout'
import {
  PAPIER_WIE_ZEICHENFLAECHE,
  berechneAusgabeSeite,
  berechneDruckSeite,
  waehleAusgabePapier,
} from './layout'

export async function exportiereAlsPdf(
  projekt: Zeichnung,
  blattIds: string[],
  komponentenRahmenBasis: KomponentenRahmenBasis,
  wasserzeichenAktiv = false,
  lizenznehmer: string | null = null,
  module: readonly LizenzModul[] = [],
  papierWahl: PapierWahl = PAPIER_WIE_ZEICHENFLAECHE,
): Promise<Blob | null> {
  const blaetter = projekt.blaetter.filter((b) => blattIds.includes(b.id))
  if (blaetter.length === 0) return null

  let pdf: jsPDF | null = null

  for (const blatt of blaetter) {
    const seite = berechneDruckSeite(blatt, module)
    if (!seite || !blatt.zeichenflaeche) continue
    const ausgabe = berechneAusgabeSeite(
      seite,
      waehleAusgabePapier(blatt.zeichenflaeche, papierWahl),
    )
    const canvas = await erzeugeDruckCanvas(
      seite,
      blatt,
      projekt,
      komponentenRahmenBasis,
      wasserzeichenAktiv,
      lizenznehmer,
      ausgabe,
    )
    const bildDaten = canvas.toDataURL('image/png')
    const format = [ausgabe.breiteMm, ausgabe.hoeheMm]
    const orientierung = ausgabe.breiteMm >= ausgabe.hoeheMm ? 'l' : 'p'
    if (!pdf) {
      pdf = new jsPDF({ unit: 'mm', format, orientation: orientierung })
    } else {
      pdf.addPage(format, orientierung)
    }
    pdf.addImage(bildDaten, 'PNG', 0, 0, ausgabe.breiteMm, ausgabe.hoeheMm)
  }

  return pdf?.output('blob') ?? null
}
