import type { DocumentStore } from '../document-model'
import { FORMAT_KENNUNG, oberflaechensprache, t } from '../sprache'
import {
  base64AusBytes,
  bytesAusBase64,
  einstellungsPatchAus,
  erzeugeDateiname,
  erzeugeSicherung,
  holeAssetBlob,
  ladeAssetHoch,
  liesSicherung,
  oeffneUploadDialog,
  planeKabeltypUebernahme,
  planeZonenUebernahme,
  speichereDatei,
  type AppSettings,
  type EinstellungsBereich,
  type EinstellungsSicherung,
  type FirmenlogoDaten,
  type InstallationszonenStore,
  type KabeltypStore,
  type SettingsStore,
} from '../persistence'
import { gleicheKabeltypenAb } from './kabeltyp-abgleich'
import { gleicheInstallationszonenAb } from './installationszonen-abgleich'
import { useInstallationszonenStore } from './store/installationszonen-store'
import { useKabeltypStore } from './store/kabeltyp-store'
import { useSettingsStore } from './store/settings-store'
import { useUiStore } from './store/ui-store'

export function bereichName(bereich: EinstellungsBereich): string {
  switch (bereich) {
    case 'oberflaeche':
      return t('verwaltungsdialoge.einstellungenAustausch.bereiche.oberflaeche')
    case 'zeichnen':
      return t('verwaltungsdialoge.einstellungenAustausch.bereiche.zeichnen')
    case 'autorouting':
      return t('verwaltungsdialoge.einstellungenAustausch.bereiche.autorouting')
    case 'firmenlogoUndKabeltypen':
      return t('verwaltungsdialoge.einstellungenAustausch.bereiche.firmenlogoUndKabeltypen')
  }
}

export function bereichHinweis(bereich: EinstellungsBereich): string {
  switch (bereich) {
    case 'oberflaeche':
      return t('verwaltungsdialoge.einstellungenAustausch.bereichHinweise.oberflaeche')
    case 'zeichnen':
      return t('verwaltungsdialoge.einstellungenAustausch.bereichHinweise.zeichnen')
    case 'autorouting':
      return t('verwaltungsdialoge.einstellungenAustausch.bereichHinweise.autorouting')
    case 'firmenlogoUndKabeltypen':
      return t('verwaltungsdialoge.einstellungenAustausch.bereichHinweise.firmenlogoUndKabeltypen')
  }
}

export function geltendeEinstellungen(): Partial<AppSettings> {
  const s = useSettingsStore.getState()
  return {
    werkzeugleiste: {
      reihenfolge: s.werkzeugleisteReihenfolge,
      ausgeblendet: s.werkzeugleisteAusgeblendet,
    },
    symbolleiste: {
      reihenfolge: s.symbolleisteReihenfolge,
      eingeblendet: s.symbolleisteEingeblendet,
      anzeigen: s.symbolleisteAnzeigen,
      gruppen: s.symbolleisteGruppen,
    },
    seitenleiste: {
      sichtbar: s.seitenleisteSichtbar,
      angedockt: s.seitenleisteAngedockt,
      breite: s.seitenleisteBreite,
    },
    eigenschaftenSichtbar: s.eigenschaftenSichtbar,
    kontextleiste: { sichtbar: s.kontextleisteSichtbar, versatz: s.kontextleisteVersatz },
    tastenkuerzel: s.tastenkuerzel,
    stromkreisImPanel: s.stromkreisImPanel,
    sprache: s.sprache,
    pickerKachelGroesse: s.pickerKachelGroesse,
    objektfangArten: [...s.objektfangArten],
    gridBasisSchritt: s.gridBasisSchritt,
    pfeiltastenSchrittKleinMeter: s.pfeiltastenSchritte.kleinMeter,
    pfeiltastenSchrittGrossMeter: s.pfeiltastenSchritte.grossMeter,
    bemassungVariante: s.bemassungVariante,
    installationshoehenVorgabenCm: [...s.installationshoehenVorgabenCm],
    kombinationsFaktor: s.kombinationsFaktor,
    verknuepfungNachLeitung: s.verknuepfungNachLeitung,
    routingKostenProLaenge: s.routing.kostenProLaenge,
    routingKosten90: s.routing.kosten90,
    routingKosten45: s.routing.kosten45,
    routingSicherheitsabstandMeter: s.routing.sicherheitsabstandMeter,
    routingMaxSuchbereichErweiterungen: s.routing.maxSuchbereichErweiterungen,
    routingWandfuehrung: s.routing.wandfuehrung,
    routingWandabstandMeter: s.routing.wandabstandMeter,
    routingWandBevorzugung: s.routing.wandBevorzugung,
    routingWandQuerungsKosten: s.routing.wandQuerungsKosten,
    routingParallelAbstandMeter: s.routing.parallelAbstandMeter,
    leitungenErstNachLoslassen: s.leitungenErstNachLoslassen,
  }
}

async function holeFirmenlogo(): Promise<FirmenlogoDaten | null> {
  const { firmenlogoAssetId, firmenlogoDateiname } = useSettingsStore.getState()
  if (!firmenlogoAssetId) return null
  const blob = await holeAssetBlob(firmenlogoAssetId)
  return {
    dateiname: firmenlogoDateiname ?? 'firmenlogo',
    mime: blob.type || 'application/octet-stream',
    daten: base64AusBytes(new Uint8Array(await blob.arrayBuffer())),
  }
}

export async function sichereEinstellungen(
  bereiche: readonly EinstellungsBereich[],
  kabeltypStore: KabeltypStore,
  installationszonenStore: InstallationszonenStore,
): Promise<boolean> {
  const mitLogoUndKabeln = bereiche.includes('firmenlogoUndKabeltypen')
  const sicherung = erzeugeSicherung({
    einstellungen: geltendeEinstellungen(),
    firmenlogo: mitLogoUndKabeln ? await holeFirmenlogo() : null,
    kabeltypen: mitLogoUndKabeln ? await kabeltypStore.alle() : [],
    installationszonen: mitLogoUndKabeln ? await installationszonenStore.alle() : [],
    bereiche,
    programmVersion: __APP_VERSION__,
    erstellt: new Date(),
  })
  const datum = new Date().toISOString().slice(0, 10)
  const blob = new Blob([JSON.stringify(sicherung, null, 2)], { type: 'application/json' })
  const dateiname = erzeugeDateiname(
    ['el-easy-cad', t('verwaltungsdialoge.einstellungenAustausch.dateinameTeil'), datum],
    'json',
  )
  return speichereDatei(blob, dateiname, {
    beschreibung: t('verwaltungsdialoge.einstellungenAustausch.dateiBeschreibung'),
    erweiterungen: ['json'],
  })
}

export async function waehleEinstellungsDatei(): Promise<void> {
  const datei = await oeffneUploadDialog()
  if (!datei) return
  try {
    const sicherung = liesSicherung(datei.text)
    useUiStore
      .getState()
      .setEinstellungenAustausch({ art: 'einspielen', sicherung, dateiname: datei.name })
  } catch (fehler) {
    useUiStore
      .getState()
      .zeigeToast(
        fehler instanceof Error
          ? fehler.message
          : t('verwaltungsdialoge.einstellungenAustausch.nichtGelesen'),
      )
  }
}

interface EinspielenKontext {
  settingsStore: SettingsStore
  kabeltypStore: KabeltypStore
  installationszonenStore: InstallationszonenStore
  doc: DocumentStore
}

export async function spieleEinstellungenEin(
  sicherung: EinstellungsSicherung,
  bereiche: readonly EinstellungsBereich[],
  { settingsStore, kabeltypStore, installationszonenStore, doc }: EinspielenKontext,
): Promise<string> {
  const patch: Partial<AppSettings> = einstellungsPatchAus(sicherung, bereiche)
  const logoUndKabel = bereiche.includes('firmenlogoUndKabeltypen')
    ? sicherung.bereiche.firmenlogoUndKabeltypen
    : undefined
  if (logoUndKabel) {
    const logo = logoUndKabel.firmenlogo
    if (logo) {
      const blob = new Blob([bytesAusBase64(logo.daten)], { type: logo.mime })
      patch.firmenlogoAssetId = await ladeAssetHoch(blob, logo.dateiname)
      patch.firmenlogoDateiname = logo.dateiname
    }
  }

  await settingsStore.speichern(patch)
  await useSettingsStore.getState().laden(settingsStore)

  const teile = bereiche.filter((b) => b !== 'firmenlogoUndKabeltypen').map(bereichName)
  if (logoUndKabel) {
    const plan = planeKabeltypUebernahme(await kabeltypStore.alle(), logoUndKabel.kabeltypen)
    for (const typ of plan.zuSpeichern) await kabeltypStore.speichern(typ)
    await useKabeltypStore.getState().laden(kabeltypStore)
    gleicheKabeltypenAb(doc)
    if (logoUndKabel.firmenlogo)
      teile.push(t('verwaltungsdialoge.einstellungenAustausch.firmenlogo'))
    teile.push(
      t('verwaltungsdialoge.einstellungenAustausch.kabeltypen', { n: plan.zuSpeichern.length }),
    )
    const zonen = planeZonenUebernahme(
      await installationszonenStore.alle(),
      logoUndKabel.installationszonen ?? [],
    )
    if (zonen.zuSpeichern.length > 0) {
      for (const zone of zonen.zuSpeichern) await installationszonenStore.speichern(zone)
      await useInstallationszonenStore.getState().laden(installationszonenStore)
      gleicheInstallationszonenAb(doc)
      teile.push(
        t('verwaltungsdialoge.einstellungenAustausch.installationszonen', {
          n: zonen.zuSpeichern.length,
        }),
      )
    }
  }
  const liste = new Intl.ListFormat(FORMAT_KENNUNG[oberflaechensprache()], {
    type: 'conjunction',
  }).format(teile)
  return t('verwaltungsdialoge.einstellungenAustausch.uebernommen', { liste })
}
