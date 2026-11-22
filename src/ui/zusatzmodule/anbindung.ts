import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import * as documentModel from '../../document-model'
import type { DocumentStore } from '../../document-model'
import * as rendering from '../../rendering'
import * as sprache from '../../sprache'
import { t } from '../../sprache'
import {
  bereinigterDateiname,
  leseModulExcel,
  schreibeModulExcel,
  speichereDatei,
  waehleDatei,
  zusatzmodulDateiUrl,
} from '../../persistence'
import * as tools from '../../tools'
import {
  erzeugeObjektAendernCommand,
  erzeugeZeichnungAendernCommand,
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
import { druckKontextFuer, druckLizenz } from '../druck-kontext'
import { exportiereAlsPdf, PAPIER_WIE_ZEICHENFLAECHE } from '../../druck'
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
    auswaehlen: (ids, zeigen) => {
      const ui = useUiStore.getState()
      const erstes = ids.map(findeObjekt).find((f) => f !== null)
      if (!erstes) {
        ui.setAuswahlIds([])
        return 0
      }
      const gewaehlt = erstes.blatt.objekte.filter((o) => ids.includes(o.id))
      if (zeigen) {
        const bereich = gewaehlt
          .map((o) => documentModel.getBoundingBox(o))
          .reduce((a, b) => documentModel.unionBoundingBox(a, b))
        window.dispatchEvent(
          new CustomEvent('eleasycad:sprung-zu-blatt', {
            detail: { blattId: erstes.blatt.id, bereich, objektIds: gewaehlt.map((o) => o.id) },
          }),
        )
      } else {
        if (doc.getAktivesBlatt().id !== erstes.blatt.id) doc.setAktivesBlatt(erstes.blatt.id)
        ui.setAuswahlIds(gewaehlt.map((o) => o.id))
      }
      return gewaehlt.length
    },
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
      const dockStandVon = (s: string) => {
        const alt = useZusatzmodulStore.getState().panels.find((p) => p.schluessel === s)
        return {
          ...(alt?.angedockt ? { angedockt: alt.angedockt } : {}),
          ...(alt?.dockBreite ? { dockBreite: alt.dockBreite } : {}),
        }
      }
      const schluessel = `${kennung}:${panel.id}`
      const store = () => useZusatzmodulStore.getState()
      store().setzePanel({
        schluessel,
        kennung,
        titel: panel.titel,
        ort: panel.ort ?? 'rechts',
        ...(panel.breite ? { breite: Math.min(Math.max(panel.breite, 200), 1600) } : {}),
        ...(panel.andockbar && panel.ort === 'schwebend' ? { andockbar: true } : {}),
        ...(panel.hoehe ? { hoehe: Math.min(Math.max(panel.hoehe, 200), 1400) } : {}),
        ...dockStandVon(schluessel),
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

    leseZeichnungsModulDaten: (kennung) => doc.getZeichnung().modulDaten?.[kennung],
    zeichnungsModulDatenCommand: (kennung, wert, label) => {
      const modulDaten: Record<string, unknown> = { ...doc.getZeichnung().modulDaten }
      if (wert === undefined) delete modulDaten[kennung]
      else modulDaten[kennung] = wert
      return erzeugeZeichnungAendernCommand(doc, label, {
        modulDaten: Object.keys(modulDaten).length > 0 ? modulDaten : undefined,
      })
    },
    speichere: (blob, vorschlagName, typ) =>
      speichereDatei(blob, bereinigterDateiname(vorschlagName), typ),
    async oeffne(typ) {
      const datei = await waehleDatei(typ.erweiterungen.map((e) => `.${e}`).join(','))
      return datei ? { name: datei.name, inhalt: new Uint8Array(await datei.arrayBuffer()) } : null
    },
    excelLesen: (inhalt) => leseModulExcel(inhalt),
    excelSchreiben: (blaetter) => schreibeModulExcel(blaetter),

    dokumente: {
      async liste() {
        const offenId = app().sitzung.getOffenesDokument()?.dokumentId
        return (await app().sitzung.zeichnungenImProjekt()).map((d) => ({
          id: d.id,
          name: d.name,
          zeichnungsart: d.zeichnungsart ?? 'bauplan',
          offen: d.id === offenId,
        }))
      },
      lies: (dokumentId) => app().sitzung.liesZeichnung(dokumentId),
      async schreibe(dokumentId, zeichnung) {
        const { sitzung } = app()
        if (dokumentId) {
          await sitzung.schreibeZeichnung(dokumentId, zeichnung)
          return { id: dokumentId, name: zeichnung.name, zeichnungsart: 'bauplan', offen: false }
        }
        const offen = sitzung.getOffenesDokument()
        if (!offen) throw new Error(t('aktionen.zusatzmodule.ohneProjekt'))
        const neu = await sitzung.legeZeichnungAn(offen.projektId, zeichnung)
        return { id: neu.id, name: neu.name, zeichnungsart: 'bauplan', offen: false }
      },
    },
    async pdf(zeichnung, blattIds, gedrehtBlattIds = []) {
      const quelle = zeichnung ?? doc.getZeichnung()
      const ids = blattIds ?? quelle.blaetter.filter((b) => b.zeichenflaeche).map((b) => b.id)
      const { demoAktiv, lizenznehmer, module } = druckLizenz()
      const kontext = druckKontextFuer(quelle, {
        katalogKomponenten: useKatalogStore.getState().komponenten,
        catalogStore: app().catalogStore,
        verknuepfung: app().verknuepfung,
      })
      return exportiereAlsPdf(
        quelle,
        ids,
        kontext,
        demoAktiv,
        lizenznehmer,
        module,
        PAPIER_WIE_ZEICHENFLAECHE,
        new Set(gedrehtBlattIds),
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
