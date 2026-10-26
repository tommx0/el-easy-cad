import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import * as documentModel from '../../document-model'
import type { DocumentStore } from '../../document-model'
import * as rendering from '../../rendering'
import * as sprache from '../../sprache'
import { t } from '../../sprache'
import { zusatzmodulDateiUrl } from '../../persistence'
import * as tools from '../../tools'
import {
  erzeugeObjektAendernCommand,
  fuehreKiWerkzeugAus,
  zuBlatt,
  ZUSATZMODUL_ABFRAGE_TOOL_ID,
  type CommandStack,
  type KiKontext,
  type ZusatzmodulAbfrageErgebnis,
  type ZusatzmodulAbfrageTool,
} from '../../tools'
import type { AppKontext } from '../app-context'
import { setzeZusatzmodulBefehle, type Befehl } from '../befehle/katalog'
import { useKatalogStore } from '../store/katalog-store'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'
import { useZusatzmodulStore, zusatzmodulText } from '../store/zusatzmodul-store'
import { setzeZusatzmodulWerkzeugName } from '../werkzeug-namen'
import type { ZusatzmodulFeldWert, ZusatzmodulPanelGriff } from './schnittstelle'
import { ZusatzmodulWirt, type AbfrageErgebnis, type Warten } from './wirt'

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

  function findeObjekt(objektId: string) {
    for (const blatt of doc.getZeichnung().blaetter) {
      const objekt = blatt.objekte.find((o) => o.id === objektId)
      if (objekt) return { blatt, objekt }
    }
    return null
  }

  function inMetern(roh: ZusatzmodulAbfrageErgebnis | null): AbfrageErgebnis | null {
    if (!roh) return null
    const blatt = doc.getAktivesBlatt()
    if (roh.art === 'objekte') return roh
    if (roh.art === 'punkt') return { art: 'punkt', punkt: zuBlatt(roh.punkt, blatt) }
    const a = zuBlatt(roh.von, blatt)
    const b = zuBlatt(roh.bis, blatt)
    return {
      art: 'rechteck',
      bereich: {
        xMin: Math.min(a.x, b.x),
        yMin: Math.min(a.y, b.y),
        xMax: Math.max(a.x, b.x),
        yMax: Math.max(a.y, b.y),
      },
    }
  }

  function warten<T>(
    starte: (fertig: (wert: T) => void) => void,
    schliesse: () => void,
  ): Warten<T> {
    let fertig: (wert: T) => void = () => {}
    const ergebnis = new Promise<T>((aufloesen) => {
      let erledigt = false
      fertig = (wert) => {
        if (erledigt) return
        erledigt = true
        aufloesen(wert)
      }
    })
    starte((wert) => fertig(wert))
    return { ergebnis, schliesse: () => schliesse() }
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
    kiSchreibsperre: () => kiKontext.schreibsperre(),
    meldeKiAenderung: (text) => kiKontext.meldeAenderung(text),
    auswahl: () => [...useUiStore.getState().auswahlIds],
    oberflaechensprache: () => sprache.oberflaechensprache(),
    plansprache: () => documentModel.planspracheVon(doc.getZeichnung()),

    frage: (text, optionen) => {
      let melde: (ja: boolean) => void = () => {}
      return warten<boolean>(
        (fertig) => {
          melde = fertig
          useUiStore.getState().oeffneBestaetigung({
            titel: optionen.titel,
            nachricht: text,
            bestaetigenText: optionen.ja ?? t('aktionen.zusatzmodule.ja'),
            destruktiv: false,
            callback: (ja) => fertig(ja),
          })
        },
        () => {
          useUiStore.getState().schliesseBestaetigung()
          melde(false)
        },
      )
    },

    formular: (kennung, formular) => {
      let melde: (werte: Record<string, ZusatzmodulFeldWert> | null) => void = () => {}
      return warten(
        (fertig) => {
          melde = fertig
          useUiStore.getState().setModulFormular({ kennung, formular, fertig })
        },
        () => {
          useUiStore.getState().setModulFormular(null)
          melde(null)
        },
      )
    },

    abfrage: (auftrag) => {
      const werkzeug = app().toolManager.getTool(ZUSATZMODUL_ABFRAGE_TOOL_ID) as
        ZusatzmodulAbfrageTool | undefined
      return warten<AbfrageErgebnis | null>(
        (fertig) => {
          if (!werkzeug) {
            fertig(null)
            return
          }
          werkzeug.setzeAuftrag({ ...auftrag, fertig: (roh) => fertig(inMetern(roh)) })
          app().aktiviereTool(ZUSATZMODUL_ABFRAGE_TOOL_ID)
        },
        () => werkzeug?.brecheAb(),
      )
    },

    zeigePanel: (kennung, panel): ZusatzmodulPanelGriff => {
      const schluessel = `${kennung}:${panel.id}`
      const store = () => useZusatzmodulStore.getState()
      store().setzePanel({
        schluessel,
        kennung,
        titel: panel.titel,
        ort: panel.ort ?? 'rechts',
        sichtbar: true,
        erzeuge: panel.erzeuge,
      })
      return {
        zeige: () => store().aenderePanel(schluessel, { sichtbar: true }),
        verberge: () => store().aenderePanel(schluessel, { sichtbar: false }),
        setzeTitel: (titel) => store().aenderePanel(schluessel, { titel }),
        entferne: () => store().entfernePanel(schluessel),
      }
    },

    registriereWerkzeug: (werkzeug) => {
      app().toolManager.registriere(werkzeug)
      setzeZusatzmodulWerkzeugName(werkzeug.id, werkzeug.bezeichnung)
    },
    aktiviereWerkzeug: (id) => {
      if (app().toolManager.getTool(id)) app().aktiviereTool(id)
    },
    entferneWerkzeug: (id) => {
      const { toolManager } = app()
      const warAktiv = toolManager.getAktivesToolId() === id
      toolManager.entferne(id)
      if (warAktiv) useUiStore.getState().setAktivesToolId('auswahl')
      setzeZusatzmodulWerkzeugName(id, null)
    },

    leseModulDaten: (kennung, objektId) => findeObjekt(objektId)?.objekt.modulDaten?.[kennung],
    modulDatenCommand: (kennung, objektId, wert, label) => {
      const fund = findeObjekt(objektId)
      if (!fund) return null
      return erzeugeObjektAendernCommand(doc, fund.blatt.id, label, (objekte) =>
        objekte.map((o) => {
          if (o.id !== objektId) return o
          const modulDaten: Record<string, unknown> = { ...o.modulDaten }
          if (wert === undefined) delete modulDaten[kennung]
          else modulDaten[kennung] = wert
          return { ...o, modulDaten: Object.keys(modulDaten).length > 0 ? modulDaten : undefined }
        }),
      )
    },

    nachBestand: (eintraege) => {
      const texte = useZusatzmodulStore.getState().texte
      const befehle: Befehl[] = eintraege
        .filter((e) => e.aktiv)
        .flatMap(({ manifest, ...rest }) =>
          manifest.befehle.map((b): Befehl => {
            const titel = zusatzmodulText(texte[manifest.kennung], b.titel)
            const icon = b.icon ?? manifest.icon
            return {
              id: documentModel.zusatzmodulBefehlId(manifest.kennung, b.id),
              gruppe: 'module',
              standard: null,
              name: manifest.befehle.length === 1 ? manifest.name : `${manifest.name}: ${titel}`,
              iconUrl: icon
                ? zusatzmodulDateiUrl(
                    manifest.kennung,
                    documentModel.zusatzmodulLadeVersion({ manifest, ...rest }),
                    icon,
                  )
                : undefined,
              zusatzmodul: {
                kennung: manifest.kennung,
                befehlId: b.id,
                nurZeichnungsart: b.nurZeichnungsart,
              },
            }
          }),
        )
      setzeZusatzmodulBefehle(befehle)
      useSettingsStore.getState().leiteBefehleNeuAb()
    },
  })
}
