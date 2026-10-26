import type * as React from 'react'
import type * as ReactDOM from 'react-dom/client'
import type * as DocumentModel from '../../document-model'
import type { KiInhalt } from '../../document-model'
import type * as Rendering from '../../rendering'
import type { Sprache } from '../../sprache'
import type * as SpracheModul from '../../sprache'
import type * as Tools from '../../tools'
import type { AppKontext } from '../app-context'
import type { useKatalogStore } from '../store/katalog-store'
import type { useSettingsStore } from '../store/settings-store'
import type { useUiStore } from '../store/ui-store'

export interface Eec {
  readonly schnittstelle: 1
  readonly appVersion: string

  werkzeug<T = unknown>(name: string, eingabe?: Record<string, unknown>): Promise<T>

  readonly ui: {
    meldung(text: string): void
    auswahl(): string[]
  }

  readonly modul: {
    readonly kennung: string
    readonly version: string
    t(schluessel: string, werte?: Record<string, string | number>): string
    datei(pfad: string): string
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
}

export type ZusatzmodulBefehlFunktion = (signal: AbortSignal) => void | Promise<void>

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

export type { KiInhalt }
