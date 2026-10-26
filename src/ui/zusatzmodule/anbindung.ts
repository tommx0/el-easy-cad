import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import * as documentModel from '../../document-model'
import type { DocumentStore } from '../../document-model'
import * as rendering from '../../rendering'
import * as sprache from '../../sprache'
import * as tools from '../../tools'
import { fuehreKiWerkzeugAus, type CommandStack, type KiKontext } from '../../tools'
import type { AppKontext } from '../app-context'
import { useKatalogStore } from '../store/katalog-store'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'
import { ZusatzmodulWirt } from './wirt'

export function erzeugeZusatzmodulWirt(teile: {
  doc: DocumentStore
  commands: CommandStack
  kiKontext: KiKontext
  app: () => AppKontext
}): ZusatzmodulWirt {
  const { doc, commands, kiKontext, app } = teile
  const modulKontext: KiKontext = {
    ...kiKontext,
    schreibsperre: () => null,
    meldeAenderung: () => {},
  }
  return new ZusatzmodulWirt({
    commands,
    appVersion: __APP_VERSION__,
    fuehreWerkzeugAus: (aufruf) => fuehreKiWerkzeugAus(aufruf, modulKontext),
    intern: () => ({
      app: app(),
      react: React,
      reactDom: ReactDOM,
      documentModel,
      tools,
      rendering,
      sprache,
      stores: { ui: useUiStore, einstellungen: useSettingsStore, katalog: useKatalogStore },
    }),
    melde: (text) => useUiStore.getState().zeigeToast(text),
    auswahl: () => [...useUiStore.getState().auswahlIds],
    oberflaechensprache: () => sprache.oberflaechensprache(),
    plansprache: () => documentModel.planspracheVon(doc.getZeichnung()),
  })
}
