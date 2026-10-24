import type { DocumentStore } from '../document-model'
import { nurAnsichtGrund } from '../document-model'
import { erzeugeBildschirmfoto } from '../druck'
import { assetUrl, KiBruecke, leseKiStatus, type CatalogStore } from '../persistence'
import { holeAbgangsTexte, holeKnxBeschriftungen } from '../rendering'
import { t } from '../sprache'
import { fuehreKiWerkzeugAus, KiFehler, type CommandStack, type KiKontext } from '../tools'
import type { DokumentSitzung } from './dokument-sitzung'
import { gleicheInstallationszonenAb } from './installationszonen-abgleich'
import { gleicheKabeltypenAb } from './kabeltyp-abgleich'
import { freigeschalteteModule } from './lizenz-module'
import { useKabeltypStore } from './store/kabeltyp-store'
import { useKatalogStore } from './store/katalog-store'
import { useSettingsStore } from './store/settings-store'
import { useUiStore } from './store/ui-store'
import { werkzeugName } from './werkzeug-namen'
import {
  bauplanZeichnungen,
  tabellenVerknuepfung,
  verteilerplanZeichnungen,
  type Verknuepfung,
} from './verknuepfung'
import { erzeugeUebersetzer } from '../sprache'
import { planspracheVon } from '../document-model'
import { ausgabeZeile, hinweisAktiv } from './community'

export function verbindeKiSchnittstelle(teile: {
  doc: DocumentStore
  commands: CommandStack
  catalogStore: CatalogStore
  sitzung: DokumentSitzung
  verknuepfung: Verknuepfung
  aktivesWerkzeug: () => string
  oeffneDokument: (dokumentId: string) => Promise<void>
}): KiBruecke {
  const { doc, commands, catalogStore, sitzung, verknuepfung, aktivesWerkzeug, oeffneDokument } =
    teile
  const kontext: KiKontext = {
    doc,
    commands,
    routingSettings: () => useSettingsStore.getState().routing,
    kabeltypen: () => useKabeltypStore.getState().typen,
    schreibsperre: () => {
      if (useUiStore.getState().kiStatus?.nurLesen) {
        return t('aktionen.ki.nurLesen')
      }
      const werkzeug = aktivesWerkzeug()
      return werkzeug === 'auswahl'
        ? null
        : t('aktionen.ki.werkzeugAktiv', { werkzeug: werkzeugName(werkzeug) })
    },
    nurAnsicht: (blatt) => nurAnsichtGrund(blatt, freigeschalteteModule()),
    nachKabeltypAenderung: () => gleicheKabeltypenAb(doc),
    meldeAenderung: (text) => useUiStore.getState().meldeKiAenderung(text),
    vorgaben: () => {
      const ui = useUiStore.getState()
      return {
        wandStaerke: ui.wandStaerke,
        bauteilVorgaben: ui.bauteilVorgaben,
        verlegeVorgaben: ui.verlegeVorgaben,
        klemmenLeiste: ui.klemmenLeiste,
        anordnenEinstellungen: useSettingsStore.getState().anordnenEinstellungen,
        verteilerplan: useSettingsStore.getState().verteilerplanEinstellungen,
        bekannteVerteilerKennzeichen: verknuepfung
          .getStand()
          .verteilerplaene.map((p) => p.zeichnung.verteilerKennzeichen)
          .filter((k): k is string => !!k),
      }
    },
    nachZonenZuweisung: () => gleicheInstallationszonenAb(doc),
    legeVerteilerplanAn: async (zeichnung) => {
      const offen = sitzung.getOffenesDokument()
      if (!offen) throw new KiFehler(t('aktionen.ki.ohneProjekt'))
      const dokument = await sitzung.legeZeichnungAn(offen.projektId, zeichnung)
      void verknuepfung.aktualisiere({
        projektId: offen.projektId,
        dokumentId: offen.dokumentId,
        zeichnungsart: doc.getZeichnung().zeichnungsart,
      })
      useUiStore.getState().oeffneBestaetigung({
        titel: t('aktionen.ki.verteilerplanTitel'),
        nachricht: t('aktionen.ki.verteilerplanFrage', { name: dokument.name }),
        bestaetigenText: t('aktionen.ki.oeffnen'),
        destruktiv: false,
        callback: (bestaetigt) => {
          if (bestaetigt) void oeffneDokument(dokument.id)
        },
      })
      return { name: dokument.name }
    },
    katalogKomponenten: () => useKatalogStore.getState().komponenten,
    kataloge: () => useKatalogStore.getState().kataloge,
    verknuepfteZeichnungen: () => tabellenVerknuepfung(verknuepfung.getStand()),
    dokument: () => {
      const offen = sitzung.getOffenesDokument()
      return offen
        ? { projekt: offen.projektBezeichnung, kunde: offen.kunde, dokument: offen.name }
        : null
    },
    sperrgrund: () => {
      const offen = sitzung.getOffenesDokument()
      if (!offen) return t('aktionen.ki.keineZeichnung')
      if (offen.typ !== 'zeichnung') {
        return t('aktionen.ki.keineZeichnungOffen', { name: offen.name })
      }
      return null
    },
    bildschirmfoto: (blatt, bereich, maxKantePx) => {
      const zeichnung = doc.getZeichnung()
      const katalogKomponenten = useKatalogStore.getState().komponenten
      const stand = verknuepfung.getStand()
      const verknuepfteBauplaene = bauplanZeichnungen(stand)
      const lizenz = useUiStore.getState().produktlizenzStatus
      return erzeugeBildschirmfoto(
        blatt,
        zeichnung,
        {
          katalogKomponenten,
          catalogStore,
          assetQuelle: assetUrl,
          abgangsTexte: holeAbgangsTexte(zeichnung, verknuepfteBauplaene, katalogKomponenten),
          knxBeschriftungen: holeKnxBeschriftungen(zeichnung, verknuepfteBauplaene),
          verknuepfteBauplaene,
          verknuepfteVerteilerplaene: verteilerplanZeichnungen(stand),
        },
        {
          bereich,
          maxKantePx,
          module: freigeschalteteModule(),
          wasserzeichenAktiv: hinweisAktiv(lizenz),
          lizenznehmer: ausgabeZeile(lizenz, erzeugeUebersetzer(planspracheVon(zeichnung))),
        },
      )
    },
  }

  const bruecke = new KiBruecke((aufruf) => fuehreKiWerkzeugAus(aufruf, kontext))
  bruecke.subscribe((zustand) => {
    const ui = useUiStore.getState()
    ui.setKiBrueckeVerbunden(zustand.verbunden)
    if (ui.kiStatus && zustand.client !== ui.kiStatus.client) {
      ui.setKiStatus({ ...ui.kiStatus, client: zustand.client })
    }
  })

  let warAktiv = false
  useUiStore.subscribe((zustand) => {
    const aktiv = zustand.kiStatus?.aktiv ?? false
    if (aktiv === warAktiv) return
    warAktiv = aktiv
    if (aktiv) bruecke.starte()
    else bruecke.stoppe()
  })

  const meldeAktiv = () => bruecke.meldeAktiv()
  window.addEventListener('focus', meldeAktiv)
  window.addEventListener('pointerdown', meldeAktiv, { capture: true })
  window.addEventListener('keydown', meldeAktiv, { capture: true })

  return bruecke
}

export async function ladeKiStatus(): Promise<void> {
  try {
    useUiStore.getState().setKiStatus(await leseKiStatus())
  } catch {
    useUiStore.getState().setKiStatus(null)
  }
}
