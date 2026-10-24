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

export interface ProjektUebersicht extends Projekt {
  anzahlDokumente: number
}

export interface ProjektFilterEingabe {
  suche?: string
  status?: Projekt['status']
  archiviert?: boolean | 'alle'
}

export interface EndgueltigGeloescht {
  papierkorb: false
  dokumente: number
  assets: string[]
  freigegeben: number
}

export interface ProjektStore {
  liste(filter?: ProjektFilterEingabe): Promise<ProjektUebersicht[]>
  hole(id: string): Promise<Projekt | undefined>
  lege(eingabe: ProjektEingabe): Promise<Projekt>
  aendere(id: string, eingabe: ProjektEingabe): Promise<Projekt>
  loesche(id: string): Promise<void>
  papierkorb(): Promise<GeloeschtesProjekt[]>
  stelleWiederHer(id: string): Promise<Projekt>
  loescheEndgueltig(id: string): Promise<EndgueltigGeloescht>
  kunden(): Promise<string[]>
}

export interface StaendeAntwort {
  staende: StandMeta[]
  groesseGesamt: number
}

export interface ZuletztBearbeitet extends DokumentMeta {
  projektBezeichnung: string
  kunde: string
}

export interface DokumentStorePersistenz {
  liste(projektId: string): Promise<DokumentMeta[]>
  hole(id: string): Promise<Dokument | undefined>
  lege(projektId: string, eingabe: DokumentEingabe): Promise<DokumentMeta>
  aendere(id: string, aenderung: DokumentAenderung): Promise<DokumentMeta>
  loesche(id: string): Promise<void>
  speichereInhalt(id: string, eingabe: DokumentInhaltEingabe): Promise<DokumentInhalt>
  staende(dokumentId: string): Promise<StaendeAntwort>
  sichereStand(dokumentId: string, eingabe: StandEingabe): Promise<StandMeta>
  ladeStand(standId: string): Promise<Stand>
  loescheStand(standId: string): Promise<void>
  zuletztBearbeitet(grenze?: number): Promise<ZuletztBearbeitet[]>
}
