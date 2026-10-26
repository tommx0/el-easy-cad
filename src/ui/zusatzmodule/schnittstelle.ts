import type * as React from 'react'
import type * as ReactDOM from 'react-dom/client'
import type * as DocumentModel from '../../document-model'
import type { KiInhalt } from '../../document-model'
import type * as Rendering from '../../rendering'
import type { Sprache } from '../../sprache'
import type * as SpracheModul from '../../sprache'
import type * as Tools from '../../tools'
import type { Tool } from '../../tools'
import type { AppKontext } from '../app-context'
import type { useKatalogStore } from '../store/katalog-store'
import type { useSettingsStore } from '../store/settings-store'
import type { useUiStore } from '../store/ui-store'

export interface Eec {
  readonly schnittstelle: 1
  readonly appVersion: string

  werkzeug<T = unknown>(name: string, eingabe?: Record<string, unknown>): Promise<T>

  ausfuehren(titel: string, aufgabe: ZusatzmodulBefehlFunktion): Promise<void>

  readonly ui: {
    meldung(text: string): void
    auswahl(): string[]
    frage(text: string, optionen?: { titel?: string; ja?: string; nein?: string }): Promise<boolean>
    formular(formular: ZusatzmodulFormular): Promise<Record<string, ZusatzmodulFeldWert> | null>
    fortschritt(anteil: number | null, text?: string): void
    punktWaehlen(hinweis: string): Promise<ZusatzmodulPunkt | null>
    objekteWaehlen(
      hinweis: string,
      optionen?: { arten?: string[]; einzeln?: boolean },
    ): Promise<string[] | null>
    rechteckWaehlen(hinweis: string): Promise<ZusatzmodulBereich | null>
    panel(panel: ZusatzmodulPanel): ZusatzmodulPanelGriff
  }

  readonly modul: {
    readonly kennung: string
    readonly version: string
    t(schluessel: string, werte?: Record<string, string | number>): string
    datei(pfad: string): string
    readonly einstellungen: {
      lesen<T = unknown>(schluessel: string): Promise<T | null>
      schreiben(schluessel: string, wert: unknown): Promise<void>
    }
  }

  readonly modulDaten: {
    lesen<T = unknown>(objektId: string): T | undefined
    schreiben(objektId: string, wert: unknown): void
  }

  readonly sprache: {
    oberflaeche(): Sprache
    plan(): Sprache
  }

  readonly intern: EecIntern
}

export interface EecIntern {
  readonly app: AppKontext
  readonly react: typeof React
  readonly reactDom: typeof ReactDOM
  readonly documentModel: typeof DocumentModel
  readonly tools: typeof Tools
  readonly rendering: typeof Rendering
  readonly sprache: typeof SpracheModul
  readonly stores: {
    readonly ui: typeof useUiStore
    readonly einstellungen: typeof useSettingsStore
    readonly katalog: typeof useKatalogStore
  }
  readonly werkzeuge: {
    registriere(werkzeug: Tool): string
    aktiviere(id: string): void
    entferne(id: string): void
  }
}

export interface ZusatzmodulPunkt {
  x: number
  y: number
}

export interface ZusatzmodulBereich {
  xMin: number
  yMin: number
  xMax: number
  yMax: number
}

export type ZusatzmodulFeldWert = number | string | boolean | null

export type ZusatzmodulFeld =
  | {
      id: string
      art: 'zahl'
      titel: string
      wert?: number | null
      min?: number
      max?: number
      schritt?: number
      einheit?: string
      leerErlaubt?: boolean
    }
  | { id: string; art: 'text'; titel: string; wert?: string }
  | { id: string; art: 'haken'; titel: string; wert?: boolean }
  | {
      id: string
      art: 'auswahl'
      titel: string
      wert?: string
      optionen: { wert: string; titel: string }[]
    }
  | { id: string; art: 'katalog'; titel: string; wert?: string | null; leerErlaubt?: boolean }

export interface ZusatzmodulFormular {
  titel: string
  text?: string
  felder: ZusatzmodulFeld[]
  bestaetigen?: string
  merken?: string
}

export interface ZusatzmodulPanel {
  id: string
  titel: string
  ort?: 'rechts' | 'schwebend'
  erzeuge(behaelter: HTMLElement): void | (() => void)
}

export interface ZusatzmodulPanelGriff {
  zeige(): void
  verberge(): void
  setzeTitel(titel: string): void
  entferne(): void
}

export type ZusatzmodulBefehlFunktion = (
  signal: AbortSignal,
  aufruf: ZusatzmodulAufruf,
) => unknown | Promise<unknown>

export interface ZusatzmodulAufruf {
  quelle: 'menue' | 'panel' | 'ki'
  eingabe: Record<string, unknown>
}

export type ZusatzmodulBefehle = Record<string, ZusatzmodulBefehlFunktion>

export interface ZusatzmodulCode {
  aktivieren(eec: Eec): ZusatzmodulBefehle | Promise<ZusatzmodulBefehle>
  deaktivieren?(): void
}

export class ZusatzmodulWerkzeugFehler extends Error {
  readonly werkzeug: string

  constructor(werkzeug: string, nachricht: string) {
    super(nachricht)
    this.name = 'ZusatzmodulWerkzeugFehler'
    this.werkzeug = werkzeug
  }
}

export class ZusatzmodulAbbruch extends Error {
  constructor() {
    super('Abgebrochen')
    this.name = 'AbortError'
  }
}

export type { KiInhalt }
