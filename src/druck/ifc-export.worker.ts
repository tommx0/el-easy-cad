import { IfcAPI } from 'web-ifc'
import wasmUrl from 'web-ifc/web-ifc.wasm?url'
import type { IfcExportModell } from '../ifc'
import { schreibeIfc } from '../ifc'

export interface IfcExportAuftrag {
  modell: IfcExportModell
  guidPraefix: string
  anwendung: string
}

export type IfcExportAntwort =
  { art: 'fertig'; daten: Uint8Array } | { art: 'fehler'; meldung: string }

let api: IfcAPI | null = null

self.onmessage = async (nachricht: MessageEvent<IfcExportAuftrag>) => {
  try {
    if (!api) {
      api = new IfcAPI()
      await api.Init((pfad) => (pfad.endsWith('.wasm') ? wasmUrl : pfad), true)
    }
    const { modell, guidPraefix, anwendung } = nachricht.data
    const daten = schreibeIfc(api, modell, { guidPraefix, anwendung })
    const antwort: IfcExportAntwort = { art: 'fertig', daten }
    self.postMessage(antwort, { transfer: [daten.buffer] })
  } catch (fehler) {
    const antwort: IfcExportAntwort = {
      art: 'fehler',
      meldung: fehler instanceof Error ? fehler.message : '',
    }
    self.postMessage(antwort)
  }
}
