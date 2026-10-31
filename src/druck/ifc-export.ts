import type { CatalogComponent, LizenzModul, Zeichnung } from '../document-model'
import { istSchaltplan } from '../document-model'
import { baueExportModell } from '../ifc'
import { t } from '../sprache'
import type { IfcExportAntwort, IfcExportAuftrag } from './ifc-export.worker'

export interface IfcExportErgebnis {
  datei: Blob
  bericht: string[]
}

export async function exportiereAlsIfc(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  optionen: { module: readonly LizenzModul[]; anwendung: string; leitungsverlegungAus?: boolean },
): Promise<IfcExportErgebnis> {
  if (istSchaltplan(zeichnung)) throw new Error(t('ifc.export.schaltplan'))
  const modell = baueExportModell({
    zeichnung,
    katalog,
    module: optionen.module,
    leitungsverlegungAus: optionen.leitungsverlegungAus,
  })
  const auftrag: IfcExportAuftrag = {
    modell,
    guidPraefix: zeichnung.id,
    anwendung: optionen.anwendung,
  }
  const worker = new Worker(new URL('./ifc-export.worker.ts', import.meta.url), { type: 'module' })
  try {
    const daten = await new Promise<Uint8Array>((aufloesen, ablehnen) => {
      worker.onmessage = (nachricht: MessageEvent<IfcExportAntwort>) => {
        const antwort = nachricht.data
        if (antwort.art === 'fertig') aufloesen(antwort.daten)
        else ablehnen(new Error(antwort.meldung || t('ifc.export.fehlgeschlagen')))
      }
      worker.onerror = (ereignis) =>
        ablehnen(new Error(ereignis.message || t('ifc.export.fehlgeschlagen')))
      worker.postMessage(auftrag)
    })
    return {
      datei: new Blob([daten as BlobPart], { type: 'application/x-step' }),
      bericht: modell.bericht,
    }
  } finally {
    worker.terminate()
  }
}
