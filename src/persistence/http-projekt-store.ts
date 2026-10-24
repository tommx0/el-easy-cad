import type {
  Dokument,
  DokumentAenderung,
  DokumentEingabe,
  DokumentInhalt,
  DokumentInhaltEingabe,
  DokumentMeta,
  GeloeschtesProjekt,
  Projekt,
  ProjektEingabe,
  Stand,
  StandEingabe,
  StandMeta,
} from '../document-model'
import { holeJson, sendeJson, optional } from './api-client'
import type {
  DokumentStorePersistenz,
  EndgueltigGeloescht,
  ProjektFilterEingabe,
  ProjektStore,
  ProjektUebersicht,
  StaendeAntwort,
  ZuletztBearbeitet,
} from './projekt-store'

function abfrage(werte: Record<string, string | undefined>): string {
  const suchparameter = new URLSearchParams()
  for (const [schluessel, wert] of Object.entries(werte)) {
    if (wert !== undefined) suchparameter.set(schluessel, wert)
  }
  const text = suchparameter.toString()
  return text ? `?${text}` : ''
}

export class HttpProjektStore implements ProjektStore {
  liste(filter: ProjektFilterEingabe = {}): Promise<ProjektUebersicht[]> {
    return holeJson<ProjektUebersicht[]>(
      `/projekte${abfrage({
        suche: filter.suche,
        status: filter.status,
        archiviert: filter.archiviert === undefined ? undefined : String(filter.archiviert),
      })}`,
    )
  }

  hole(id: string): Promise<Projekt | undefined> {
    return optional(() => holeJson<Projekt>(`/projekte/${id}`))
  }

  lege(eingabe: ProjektEingabe): Promise<Projekt> {
    return sendeJson<Projekt>('POST', '/projekte', eingabe)
  }

  aendere(id: string, eingabe: ProjektEingabe): Promise<Projekt> {
    return sendeJson<Projekt>('PUT', `/projekte/${id}`, eingabe)
  }

  async loesche(id: string): Promise<void> {
    await sendeJson('DELETE', `/projekte/${id}`)
  }

  papierkorb(): Promise<GeloeschtesProjekt[]> {
    return holeJson<GeloeschtesProjekt[]>('/papierkorb')
  }

  stelleWiederHer(id: string): Promise<Projekt> {
    return sendeJson<Projekt>('POST', `/projekte/${id}/wiederherstellen`)
  }

  loescheEndgueltig(id: string): Promise<EndgueltigGeloescht> {
    return sendeJson<EndgueltigGeloescht>('DELETE', `/projekte/${id}?endgueltig=1`)
  }

  kunden(): Promise<string[]> {
    return holeJson<string[]>('/kunden')
  }
}

export class HttpDokumentStore implements DokumentStorePersistenz {
  liste(projektId: string): Promise<DokumentMeta[]> {
    return holeJson<DokumentMeta[]>(`/projekte/${projektId}/dokumente`)
  }

  hole(id: string): Promise<Dokument | undefined> {
    return optional(() => holeJson<Dokument>(`/dokumente/${id}`))
  }

  lege(projektId: string, eingabe: DokumentEingabe): Promise<DokumentMeta> {
    return sendeJson<DokumentMeta>('POST', `/projekte/${projektId}/dokumente`, eingabe)
  }

  aendere(id: string, aenderung: DokumentAenderung): Promise<DokumentMeta> {
    return sendeJson<DokumentMeta>('PUT', `/dokumente/${id}`, aenderung)
  }

  async loesche(id: string): Promise<void> {
    await sendeJson('DELETE', `/dokumente/${id}`)
  }

  speichereInhalt(id: string, eingabe: DokumentInhaltEingabe): Promise<DokumentInhalt> {
    return sendeJson<DokumentInhalt>('PUT', `/dokumente/${id}/inhalt`, eingabe)
  }

  staende(dokumentId: string): Promise<StaendeAntwort> {
    return holeJson<StaendeAntwort>(`/dokumente/${dokumentId}/staende`)
  }

  sichereStand(dokumentId: string, eingabe: StandEingabe): Promise<StandMeta> {
    return sendeJson<StandMeta>('POST', `/dokumente/${dokumentId}/staende`, eingabe)
  }

  ladeStand(standId: string): Promise<Stand> {
    return holeJson<Stand>(`/staende/${standId}`)
  }

  async loescheStand(standId: string): Promise<void> {
    await sendeJson('DELETE', `/staende/${standId}`)
  }

  zuletztBearbeitet(grenze?: number): Promise<ZuletztBearbeitet[]> {
    return holeJson<ZuletztBearbeitet[]>(
      `/zuletzt-bearbeitet${abfrage({ grenze: grenze === undefined ? undefined : String(grenze) })}`,
    )
  }
}
