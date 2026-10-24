import { t } from '../sprache'
import type { Zeichnungsart } from './zeichnungsart'

export const PROJEKT_STATUS = ['angebot', 'in_arbeit', 'abgeschlossen'] as const

export type ProjektStatus = (typeof PROJEKT_STATUS)[number]

export const PROJEKT_STATUS_TEXT: Record<ProjektStatus, string> = {
  get angebot() {
    return t('verwaltungsdialoge.projekte.status.angebot')
  },
  get in_arbeit() {
    return t('verwaltungsdialoge.projekte.status.inArbeit')
  },
  get abgeschlossen() {
    return t('verwaltungsdialoge.projekte.status.abgeschlossen')
  },
}

export interface Projekt {
  id: string
  kunde: string
  bezeichnung: string
  projektnummer: string | null
  notiz: string | null
  status: ProjektStatus
  archiviert: boolean
  erstelltAm: string
  zuletztGeaendertAm: string
}

export interface ProjektUebersicht extends Projekt {
  anzahlDokumente: number
}

export interface GeloeschtesProjekt extends Projekt {
  geloeschtAm: string
}

export const DOKUMENT_TYPEN = ['zeichnung', 'pdf', 'notiz', 'excel'] as const

export type DokumentTyp = (typeof DOKUMENT_TYPEN)[number]

export const DOKUMENT_TYP_TEXT: Record<DokumentTyp, string> = {
  get zeichnung() {
    return t('verwaltungsdialoge.projekte.dokumentTyp.zeichnung')
  },
  get pdf() {
    return t('verwaltungsdialoge.projekte.dokumentTyp.pdf')
  },
  get notiz() {
    return t('verwaltungsdialoge.projekte.dokumentTyp.notiz')
  },
  get excel() {
    return t('verwaltungsdialoge.projekte.dokumentTyp.excel')
  },
}

export interface DokumentMeta {
  id: string
  projektId: string
  typ: DokumentTyp
  name: string
  reihenfolge: number
  quelleDokumentId: string | null
  erstelltAm: string
  zuletztGeaendertAm: string
  zeichnungsart?: Zeichnungsart
  verteilerKennzeichen?: string
}

export interface DokumentInhalt {
  formatVersion: number
  version: number
  inhalt: string | null
  assetId: string | null
}

export interface Dokument extends DokumentMeta {
  inhalt: DokumentInhalt
}

export interface StandMeta {
  id: string
  dokumentId: string
  name: string
  bemerkung: string | null
  formatVersion: number
  groesse: number
  erstelltAm: string
}

export interface Stand extends StandMeta {
  inhalt: string
}
