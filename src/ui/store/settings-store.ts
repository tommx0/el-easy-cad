import { create } from 'zustand'
import type { AppSettings, SettingsStore } from '../../persistence'
import { STANDARD_INSTALLATIONSHOEHEN_CM } from '../../persistence'
import {
  bereinigterKombinationsFaktor,
  STANDARD_KOMBINATION_FAKTOR,
  VERTEILERPLAN_STANDARD,
  type VerteilerplanAufteilung,
} from '../../document-model'
import type { RoutingSettings } from '../../routing'
import { STANDARD_ROUTING_SETTINGS } from '../../routing'
import type { AnordnenEinstellungen, Fangart, PfeiltastenSchritte } from '../../tools'
import {
  FANGARTEN_RANGFOLGE,
  STANDARD_ANORDNEN_EINSTELLUNGEN,
  STANDARD_FANGARTEN,
  STANDARD_PFEILTASTEN_SCHRITTE,
  vervollstaendigeAnordnenEinstellungen,
} from '../../tools'
import { geltendeKuerzel, kuerzelZuBefehl } from '../befehle/katalog'
import { ermittleWerkzeugleiste } from '../werkzeugleiste-reihenfolge'
import type { SymbolleistenGruppe } from '../symbolleiste-reihenfolge'
import {
  ergaenzeSymbolleistenGruppen,
  ermittleSymbolleiste,
  SYMBOLLEISTE_STANDARD_GRUPPEN,
  SYMBOLLEISTE_STANDARD_REIHENFOLGE,
  vollstaendigeSymbolleiste,
} from '../symbolleiste-reihenfolge'
import { begrenzeSeitenleistenBreite, SEITENLEISTE_BREITE_STANDARD } from '../seitenleiste-breite'
import { begrenzePickerKachelGroesse, PICKER_KACHEL_STANDARD } from '../picker-kachel-groesse'

function gueltigeFangarten(gespeichert: string[] | undefined): Fangart[] {
  if (!gespeichert) return [...STANDARD_FANGARTEN]
  return FANGARTEN_RANGFOLGE.filter((art) => gespeichert.includes(art))
}

export function bereinigteVorgabehoehen(werteCm: readonly number[]): number[] {
  const gerundet = werteCm
    .filter((cm) => Number.isFinite(cm) && cm >= 0)
    .map((cm) => Math.round(cm))
  return [...new Set(gerundet)].sort((a, b) => a - b)
}

export const STANDARD_GRID_BASIS_SCHRITT = 0.5

interface SettingsState {
  gridBasisSchritt: number
  pfeiltastenSchritte: PfeiltastenSchritte
  installationshoehenVorgabenCm: number[]
  kombinationsFaktor: number
  pickerKachelGroesse: number
  routing: RoutingSettings
  objektfangArten: Fangart[]
  firmenlogoAssetId: string | null
  firmenlogoDateiname: string | null
  tastenkuerzel: Record<string, string | null>
  belegung: Record<string, string | null>
  nachKuerzel: Record<string, string>
  werkzeugleisteReihenfolge: string[]
  werkzeugleisteAusgeblendet: string[]
  werkzeugleisteVollstaendig: string[]
  werkzeugleiste: string[]
  symbolleisteReihenfolge: string[]
  symbolleisteEingeblendet: string[] | null
  symbolleisteVollstaendig: string[]
  symbolleiste: string[]
  symbolleisteAnzeigen: boolean
  symbolleisteGruppen: SymbolleistenGruppe[]
  seitenleisteSichtbar: boolean
  seitenleisteAngedockt: boolean
  seitenleisteBreite: number
  eigenschaftenSichtbar: boolean
  kontextleisteSichtbar: boolean
  kontextleisteVersatz: { x: number; y: number } | null
  datenschutzAkzeptiertStand: string | null
  bemassungVariante: AppSettings['bemassungVariante']
  einfuehrungBeimStartZeigen: boolean
  anordnenEinstellungen: AnordnenEinstellungen
  verteilerplanEinstellungen: {
    maxSicherungenJeBlatt: number
    maxKlemmenJeBlatt: number
    aufteilung: VerteilerplanAufteilung
    stromkreisSchutzId?: string
    stromkreisKlemmeId?: string | null
    knxReserveProzent?: number
  }
  stromkreisImPanel: boolean
  sprache: string | null
  verknuepfungNachLeitung: boolean
  leitungenErstNachLoslassen: boolean
  geladen: boolean
  laden: (store: SettingsStore) => Promise<void>
  setDatenschutzAkzeptiert: (store: SettingsStore, stand: string) => void
  setGridBasisSchritt: (store: SettingsStore, wert: number) => void
  setPfeiltastenSchritt: (store: SettingsStore, art: 'klein' | 'gross', meter: number) => void
  setInstallationshoehenVorgaben: (store: SettingsStore, werteCm: readonly number[]) => void
  setKombinationsFaktor: (store: SettingsStore, faktor: number) => void
  setPickerKachelGroesse: (store: SettingsStore, groesse: number) => void
  setRoutingSetting: <K extends keyof RoutingSettings>(
    store: SettingsStore,
    feld: K,
    wert: RoutingSettings[K],
  ) => void
  toggleObjektfangArt: (store: SettingsStore, art: Fangart) => void
  setFirmenlogo: (store: SettingsStore, assetId: string | null, dateiname: string | null) => void
  setKuerzel: (store: SettingsStore, befehlId: string, kuerzel: string | null) => void
  kuerzelZuruecksetzen: (store: SettingsStore, befehlId?: string) => void
  setWerkzeugleisteReihenfolge: (store: SettingsStore, reihenfolge: string[]) => void
  toggleWerkzeugSichtbarkeit: (store: SettingsStore, id: string) => void
  werkzeugleisteZuruecksetzen: (store: SettingsStore) => void
  setSymbolleisteReihenfolge: (store: SettingsStore, reihenfolge: string[]) => void
  toggleSymbolleisteBefehl: (store: SettingsStore, id: string) => void
  symbolleisteZuruecksetzen: (store: SettingsStore) => void
  toggleSymbolleisteAnzeigen: (store: SettingsStore) => void
  erstelleSymbolleisteGruppe: (store: SettingsStore, name: string) => string
  benenneSymbolleisteGruppeUm: (store: SettingsStore, gruppeId: string, name: string) => void
  loescheSymbolleisteGruppe: (store: SettingsStore, gruppeId: string) => void
  verschiebeSymbolleisteBefehl: (
    store: SettingsStore,
    befehlId: string,
    zielGruppeId: string | null,
  ) => void
  setSymbolleisteGruppenReihenfolge: (
    store: SettingsStore,
    gruppeId: string,
    befehle: string[],
  ) => void
  toggleSeitenleisteSichtbar: (store: SettingsStore) => void
  toggleSeitenleisteAngedockt: (store: SettingsStore) => void
  setSeitenleisteBreite: (store: SettingsStore, breite: number) => void
  toggleEigenschaftenSichtbar: (store: SettingsStore) => void
  setKontextleisteSichtbar: (store: SettingsStore, sichtbar: boolean) => void
  setKontextleisteVersatz: (store: SettingsStore, versatz: { x: number; y: number } | null) => void
  setBemassungVariante: (store: SettingsStore, wert: AppSettings['bemassungVariante']) => void
  setEinfuehrungBeimStartZeigen: (store: SettingsStore, wert: boolean) => void
  setAnordnenEinstellungen: (store: SettingsStore, wert: AnordnenEinstellungen) => void
  setVerteilerplanEinstellungen: (
    store: SettingsStore,
    wert: SettingsState['verteilerplanEinstellungen'],
  ) => void
  setStromkreisImPanel: (store: SettingsStore, wert: boolean) => void
  setSprache: (store: SettingsStore, wert: string | null) => void
  setVerknuepfungNachLeitung: (store: SettingsStore, wert: boolean) => void
  setLeitungenErstNachLoslassen: (store: SettingsStore, wert: boolean) => void
  leiteBefehleNeuAb: () => void
}

function abgeleitet(tastenkuerzel: Record<string, string | null>) {
  const belegung = geltendeKuerzel(tastenkuerzel)
  return { tastenkuerzel, belegung, nachKuerzel: kuerzelZuBefehl(belegung) }
}

function abgeleiteteWerkzeugleiste(reihenfolge: string[], ausgeblendet: string[]) {
  return {
    werkzeugleisteReihenfolge: reihenfolge,
    werkzeugleisteAusgeblendet: ausgeblendet,
    werkzeugleisteVollstaendig: ermittleWerkzeugleiste(reihenfolge, []),
    werkzeugleiste: ermittleWerkzeugleiste(reihenfolge, ausgeblendet),
  }
}

function abgeleiteteSymbolleiste(
  reihenfolge: string[],
  eingeblendet: string[] | null,
  gruppen: SymbolleistenGruppe[],
) {
  return {
    symbolleisteReihenfolge: reihenfolge,
    symbolleisteEingeblendet: eingeblendet,
    symbolleisteGruppen: gruppen,
    symbolleisteVollstaendig: vollstaendigeSymbolleiste(reihenfolge, gruppen),
    symbolleiste: ermittleSymbolleiste(reihenfolge, eingeblendet, gruppen),
  }
}

const ROUTING_FELD_ZU_SETTING: Record<keyof RoutingSettings, keyof AppSettings> = {
  kostenProLaenge: 'routingKostenProLaenge',
  kosten90: 'routingKosten90',
  kosten45: 'routingKosten45',
  sicherheitsabstandMeter: 'routingSicherheitsabstandMeter',
  maxSuchbereichErweiterungen: 'routingMaxSuchbereichErweiterungen',
  wandfuehrung: 'routingWandfuehrung',
  wandabstandMeter: 'routingWandabstandMeter',
  wandBevorzugung: 'routingWandBevorzugung',
  wandQuerungsKosten: 'routingWandQuerungsKosten',
  parallelAbstandMeter: 'routingParallelAbstandMeter',
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  gridBasisSchritt: STANDARD_GRID_BASIS_SCHRITT,
  pfeiltastenSchritte: { ...STANDARD_PFEILTASTEN_SCHRITTE },
  installationshoehenVorgabenCm: [...STANDARD_INSTALLATIONSHOEHEN_CM],
  kombinationsFaktor: STANDARD_KOMBINATION_FAKTOR,
  pickerKachelGroesse: PICKER_KACHEL_STANDARD,
  routing: STANDARD_ROUTING_SETTINGS,
  objektfangArten: [...STANDARD_FANGARTEN],
  firmenlogoAssetId: null,
  firmenlogoDateiname: null,
  ...abgeleitet({}),
  ...abgeleiteteWerkzeugleiste([], []),
  ...abgeleiteteSymbolleiste([...SYMBOLLEISTE_STANDARD_REIHENFOLGE], null, [
    ...SYMBOLLEISTE_STANDARD_GRUPPEN,
  ]),
  symbolleisteAnzeigen: true,
  seitenleisteSichtbar: true,
  seitenleisteAngedockt: true,
  seitenleisteBreite: SEITENLEISTE_BREITE_STANDARD,
  eigenschaftenSichtbar: true,
  kontextleisteSichtbar: true,
  kontextleisteVersatz: null,
  datenschutzAkzeptiertStand: null,
  bemassungVariante: 'bemassung',
  einfuehrungBeimStartZeigen: true,
  anordnenEinstellungen: { ...STANDARD_ANORDNEN_EINSTELLUNGEN },
  verteilerplanEinstellungen: { ...VERTEILERPLAN_STANDARD },
  stromkreisImPanel: true,
  sprache: null,
  verknuepfungNachLeitung: true,
  leitungenErstNachLoslassen: false,
  geladen: false,

  laden: async (store) => {
    const gespeichert = await store.laden()
    const nachtrag = ergaenzeSymbolleistenGruppen(
      gespeichert.symbolleiste?.gruppen ?? [...SYMBOLLEISTE_STANDARD_GRUPPEN],
      gespeichert.symbolleiste?.eingeblendet ?? null,
      gespeichert.symbolleisteNachtraege ?? [],
    )
    if (nachtrag.erledigt.length !== (gespeichert.symbolleisteNachtraege ?? []).length) {
      const gruppenGespeichert = gespeichert.symbolleiste?.gruppen !== undefined
      void store.speichern({
        symbolleisteNachtraege: nachtrag.erledigt,
        ...(gespeichert.symbolleiste && gruppenGespeichert
          ? { symbolleiste: { ...gespeichert.symbolleiste, gruppen: nachtrag.gruppen } }
          : {}),
      })
    }
    set({
      gridBasisSchritt: gespeichert.gridBasisSchritt ?? STANDARD_GRID_BASIS_SCHRITT,
      pfeiltastenSchritte: {
        kleinMeter:
          gespeichert.pfeiltastenSchrittKleinMeter ?? STANDARD_PFEILTASTEN_SCHRITTE.kleinMeter,
        grossMeter:
          gespeichert.pfeiltastenSchrittGrossMeter ?? STANDARD_PFEILTASTEN_SCHRITTE.grossMeter,
      },
      installationshoehenVorgabenCm: gespeichert.installationshoehenVorgabenCm
        ? bereinigteVorgabehoehen(gespeichert.installationshoehenVorgabenCm)
        : [...STANDARD_INSTALLATIONSHOEHEN_CM],
      kombinationsFaktor: bereinigterKombinationsFaktor(
        gespeichert.kombinationsFaktor ?? STANDARD_KOMBINATION_FAKTOR,
      ),
      pickerKachelGroesse: begrenzePickerKachelGroesse(
        gespeichert.pickerKachelGroesse ?? PICKER_KACHEL_STANDARD,
      ),
      routing: {
        kostenProLaenge:
          gespeichert.routingKostenProLaenge ?? STANDARD_ROUTING_SETTINGS.kostenProLaenge,
        kosten90: gespeichert.routingKosten90 ?? STANDARD_ROUTING_SETTINGS.kosten90,
        kosten45: gespeichert.routingKosten45 ?? STANDARD_ROUTING_SETTINGS.kosten45,
        sicherheitsabstandMeter:
          gespeichert.routingSicherheitsabstandMeter ??
          STANDARD_ROUTING_SETTINGS.sicherheitsabstandMeter,
        maxSuchbereichErweiterungen:
          gespeichert.routingMaxSuchbereichErweiterungen ??
          STANDARD_ROUTING_SETTINGS.maxSuchbereichErweiterungen,
        wandfuehrung: gespeichert.routingWandfuehrung ?? STANDARD_ROUTING_SETTINGS.wandfuehrung,
        wandabstandMeter:
          gespeichert.routingWandabstandMeter ?? STANDARD_ROUTING_SETTINGS.wandabstandMeter,
        wandBevorzugung:
          gespeichert.routingWandBevorzugung ?? STANDARD_ROUTING_SETTINGS.wandBevorzugung,
        wandQuerungsKosten:
          gespeichert.routingWandQuerungsKosten ?? STANDARD_ROUTING_SETTINGS.wandQuerungsKosten,
        parallelAbstandMeter:
          gespeichert.routingParallelAbstandMeter ?? STANDARD_ROUTING_SETTINGS.parallelAbstandMeter,
      },
      objektfangArten: gueltigeFangarten(gespeichert.objektfangArten),
      firmenlogoAssetId: gespeichert.firmenlogoAssetId ?? null,
      firmenlogoDateiname: gespeichert.firmenlogoDateiname ?? null,
      ...abgeleitet(gespeichert.tastenkuerzel ?? {}),
      ...abgeleiteteWerkzeugleiste(
        gespeichert.werkzeugleiste?.reihenfolge ?? [],
        gespeichert.werkzeugleiste?.ausgeblendet ?? [],
      ),
      ...abgeleiteteSymbolleiste(
        gespeichert.symbolleiste?.reihenfolge ?? [...SYMBOLLEISTE_STANDARD_REIHENFOLGE],
        gespeichert.symbolleiste?.eingeblendet ?? null,
        nachtrag.gruppen,
      ),
      symbolleisteAnzeigen: gespeichert.symbolleiste?.anzeigen ?? true,
      seitenleisteSichtbar: gespeichert.seitenleiste?.sichtbar ?? true,
      seitenleisteAngedockt: gespeichert.seitenleiste?.angedockt ?? true,
      seitenleisteBreite: begrenzeSeitenleistenBreite(
        gespeichert.seitenleiste?.breite ?? SEITENLEISTE_BREITE_STANDARD,
      ),
      eigenschaftenSichtbar: gespeichert.eigenschaftenSichtbar ?? true,
      kontextleisteSichtbar: gespeichert.kontextleiste?.sichtbar ?? true,
      kontextleisteVersatz: gespeichert.kontextleiste?.versatz ?? null,
      datenschutzAkzeptiertStand: gespeichert.datenschutzAkzeptiertStand ?? null,
      bemassungVariante: gespeichert.bemassungVariante ?? 'bemassung',
      einfuehrungBeimStartZeigen: gespeichert.einfuehrungBeimStartZeigen ?? true,
      anordnenEinstellungen: vervollstaendigeAnordnenEinstellungen(gespeichert.automatischAnordnen),
      verteilerplanEinstellungen: { ...VERTEILERPLAN_STANDARD, ...gespeichert.verteilerplan },
      stromkreisImPanel: gespeichert.stromkreisImPanel ?? true,
      sprache: gespeichert.sprache ?? null,
      verknuepfungNachLeitung: gespeichert.verknuepfungNachLeitung ?? true,
      leitungenErstNachLoslassen: gespeichert.leitungenErstNachLoslassen ?? false,
      geladen: true,
    })
  },

  setDatenschutzAkzeptiert: (store, stand) => {
    set({ datenschutzAkzeptiertStand: stand })
    void store.speichern({ datenschutzAkzeptiertStand: stand })
  },

  setGridBasisSchritt: (store, wert) => {
    set({ gridBasisSchritt: wert })
    void store.speichern({ gridBasisSchritt: wert })
  },

  setPfeiltastenSchritt: (store, art, meter) => {
    const bisher = get().pfeiltastenSchritte
    if (art === 'klein') {
      set({ pfeiltastenSchritte: { ...bisher, kleinMeter: meter } })
      void store.speichern({ pfeiltastenSchrittKleinMeter: meter })
    } else {
      set({ pfeiltastenSchritte: { ...bisher, grossMeter: meter } })
      void store.speichern({ pfeiltastenSchrittGrossMeter: meter })
    }
  },

  setInstallationshoehenVorgaben: (store, werteCm) => {
    const bereinigt = bereinigteVorgabehoehen(werteCm)
    set({ installationshoehenVorgabenCm: bereinigt })
    void store.speichern({ installationshoehenVorgabenCm: bereinigt })
  },

  setKombinationsFaktor: (store, faktor) => {
    const bereinigt = bereinigterKombinationsFaktor(faktor)
    set({ kombinationsFaktor: bereinigt })
    void store.speichern({ kombinationsFaktor: bereinigt })
  },

  setPickerKachelGroesse: (store, groesse) => {
    const begrenzt = begrenzePickerKachelGroesse(groesse)
    set({ pickerKachelGroesse: begrenzt })
    void store.speichern({ pickerKachelGroesse: begrenzt })
  },

  setRoutingSetting: (store, feld, wert) => {
    set({ routing: { ...get().routing, [feld]: wert } })
    void store.speichern({ [ROUTING_FELD_ZU_SETTING[feld]]: wert })
  },

  toggleObjektfangArt: (store, art) => {
    const bisher = get().objektfangArten
    const neu = bisher.includes(art) ? bisher.filter((a) => a !== art) : [...bisher, art]
    set({ objektfangArten: neu })
    void store.speichern({ objektfangArten: neu })
  },

  setFirmenlogo: (store, assetId, dateiname) => {
    set({ firmenlogoAssetId: assetId, firmenlogoDateiname: dateiname })
    void store.speichern({ firmenlogoAssetId: assetId, firmenlogoDateiname: dateiname })
  },

  setKuerzel: (store, befehlId, kuerzel) => {
    const bisher = get().belegung
    const neu = { ...get().tastenkuerzel, [befehlId]: kuerzel }
    if (kuerzel) {
      for (const [id, vorhandenes] of Object.entries(bisher)) {
        if (id !== befehlId && vorhandenes === kuerzel) neu[id] = null
      }
    }
    set(abgeleitet(neu))
    void store.speichern({ tastenkuerzel: neu })
  },

  kuerzelZuruecksetzen: (store, befehlId) => {
    if (befehlId === undefined) {
      set(abgeleitet({}))
      void store.speichern({ tastenkuerzel: {} })
      return
    }
    const neu = { ...get().tastenkuerzel }
    delete neu[befehlId]
    const standard = geltendeKuerzel(neu)[befehlId]
    if (standard) {
      for (const [id, kuerzel] of Object.entries(geltendeKuerzel(neu))) {
        if (id !== befehlId && kuerzel === standard) neu[id] = null
      }
    }
    set(abgeleitet(neu))
    void store.speichern({ tastenkuerzel: neu })
  },

  setWerkzeugleisteReihenfolge: (store, reihenfolge) => {
    const ausgeblendet = get().werkzeugleisteAusgeblendet
    set(abgeleiteteWerkzeugleiste(reihenfolge, ausgeblendet))
    void store.speichern({ werkzeugleiste: { reihenfolge, ausgeblendet } })
  },

  toggleWerkzeugSichtbarkeit: (store, id) => {
    const bisher = get().werkzeugleisteAusgeblendet
    const neu = bisher.includes(id)
      ? bisher.filter((vorhanden) => vorhanden !== id)
      : [...bisher, id]
    const reihenfolge = get().werkzeugleisteReihenfolge
    set(abgeleiteteWerkzeugleiste(reihenfolge, neu))
    void store.speichern({ werkzeugleiste: { reihenfolge, ausgeblendet: neu } })
  },

  werkzeugleisteZuruecksetzen: (store) => {
    set(abgeleiteteWerkzeugleiste([], []))
    void store.speichern({ werkzeugleiste: { reihenfolge: [], ausgeblendet: [] } })
  },

  setSymbolleisteReihenfolge: (store, reihenfolge) => {
    const {
      symbolleisteEingeblendet: eingeblendet,
      symbolleisteAnzeigen: anzeigen,
      symbolleisteGruppen: gruppen,
    } = get()
    set(abgeleiteteSymbolleiste(reihenfolge, eingeblendet, gruppen))
    void store.speichern({ symbolleiste: { reihenfolge, eingeblendet, anzeigen, gruppen } })
  },

  toggleSymbolleisteBefehl: (store, id) => {
    const {
      symbolleisteReihenfolge: reihenfolge,
      symbolleisteAnzeigen: anzeigen,
      symbolleisteGruppen: gruppen,
    } = get()
    const bisher = get().symbolleiste
    const eingeblendet = bisher.includes(id)
      ? bisher.filter((vorhanden) => vorhanden !== id)
      : [...bisher, id]
    set(abgeleiteteSymbolleiste(reihenfolge, eingeblendet, gruppen))
    void store.speichern({ symbolleiste: { reihenfolge, eingeblendet, anzeigen, gruppen } })
  },

  symbolleisteZuruecksetzen: (store) => {
    const anzeigen = get().symbolleisteAnzeigen
    const reihenfolge = [...SYMBOLLEISTE_STANDARD_REIHENFOLGE]
    const gruppen = [...SYMBOLLEISTE_STANDARD_GRUPPEN]
    set(abgeleiteteSymbolleiste(reihenfolge, null, gruppen))
    void store.speichern({
      symbolleiste: { reihenfolge, eingeblendet: null, anzeigen, gruppen },
    })
  },

  toggleSymbolleisteAnzeigen: (store) => {
    const anzeigen = !get().symbolleisteAnzeigen
    set({ symbolleisteAnzeigen: anzeigen })
    void store.speichern({
      symbolleiste: {
        reihenfolge: get().symbolleisteReihenfolge,
        eingeblendet: get().symbolleisteEingeblendet,
        anzeigen,
        gruppen: get().symbolleisteGruppen,
      },
    })
  },

  erstelleSymbolleisteGruppe: (store, name) => {
    const {
      symbolleisteReihenfolge: reihenfolge,
      symbolleisteEingeblendet: eingeblendet,
      symbolleisteAnzeigen: anzeigen,
      symbolleisteGruppen: bisherigeGruppen,
    } = get()
    const id = `gruppe-${Date.now()}`
    const gruppen = [...bisherigeGruppen, { id, name, befehle: [] }]
    const neueReihenfolge = vollstaendigeSymbolleiste(reihenfolge, gruppen)
    set(abgeleiteteSymbolleiste(neueReihenfolge, eingeblendet, gruppen))
    void store.speichern({
      symbolleiste: { reihenfolge: neueReihenfolge, eingeblendet, anzeigen, gruppen },
    })
    return id
  },

  benenneSymbolleisteGruppeUm: (store, gruppeId, name) => {
    const {
      symbolleisteReihenfolge: reihenfolge,
      symbolleisteEingeblendet: eingeblendet,
      symbolleisteAnzeigen: anzeigen,
      symbolleisteGruppen: bisherigeGruppen,
    } = get()
    const gruppen = bisherigeGruppen.map((gruppe) =>
      gruppe.id === gruppeId ? { ...gruppe, name } : gruppe,
    )
    set(abgeleiteteSymbolleiste(reihenfolge, eingeblendet, gruppen))
    void store.speichern({ symbolleiste: { reihenfolge, eingeblendet, anzeigen, gruppen } })
  },

  loescheSymbolleisteGruppe: (store, gruppeId) => {
    const {
      symbolleisteReihenfolge: reihenfolge,
      symbolleisteEingeblendet: eingeblendet,
      symbolleisteAnzeigen: anzeigen,
      symbolleisteGruppen: bisherigeGruppen,
    } = get()
    const gruppen = bisherigeGruppen.filter((gruppe) => gruppe.id !== gruppeId)
    const neueReihenfolge = vollstaendigeSymbolleiste(
      reihenfolge.filter((id) => id !== gruppeId),
      gruppen,
    )
    set(abgeleiteteSymbolleiste(neueReihenfolge, eingeblendet, gruppen))
    void store.speichern({
      symbolleiste: { reihenfolge: neueReihenfolge, eingeblendet, anzeigen, gruppen },
    })
  },

  verschiebeSymbolleisteBefehl: (store, befehlId, zielGruppeId) => {
    const {
      symbolleisteReihenfolge: reihenfolge,
      symbolleisteEingeblendet: eingeblendet,
      symbolleisteAnzeigen: anzeigen,
      symbolleisteGruppen: bisherigeGruppen,
    } = get()
    const ohneBefehl = bisherigeGruppen.map((gruppe) => ({
      ...gruppe,
      befehle: gruppe.befehle.filter((id) => id !== befehlId),
    }))
    const gruppen = zielGruppeId
      ? ohneBefehl.map((gruppe) =>
          gruppe.id === zielGruppeId
            ? { ...gruppe, befehle: [...gruppe.befehle, befehlId] }
            : gruppe,
        )
      : ohneBefehl
    const neueReihenfolge = vollstaendigeSymbolleiste(reihenfolge, gruppen)
    set(abgeleiteteSymbolleiste(neueReihenfolge, eingeblendet, gruppen))
    void store.speichern({
      symbolleiste: { reihenfolge: neueReihenfolge, eingeblendet, anzeigen, gruppen },
    })
  },

  setSymbolleisteGruppenReihenfolge: (store, gruppeId, befehle) => {
    const {
      symbolleisteReihenfolge: reihenfolge,
      symbolleisteEingeblendet: eingeblendet,
      symbolleisteAnzeigen: anzeigen,
      symbolleisteGruppen: bisherigeGruppen,
    } = get()
    const gruppen = bisherigeGruppen.map((gruppe) =>
      gruppe.id === gruppeId ? { ...gruppe, befehle } : gruppe,
    )
    set(abgeleiteteSymbolleiste(reihenfolge, eingeblendet, gruppen))
    void store.speichern({ symbolleiste: { reihenfolge, eingeblendet, anzeigen, gruppen } })
  },

  toggleSeitenleisteSichtbar: (store) => {
    const sichtbar = !get().seitenleisteSichtbar
    set({ seitenleisteSichtbar: sichtbar })
    void store.speichern({
      seitenleiste: {
        sichtbar,
        angedockt: get().seitenleisteAngedockt,
        breite: get().seitenleisteBreite,
      },
    })
  },

  toggleSeitenleisteAngedockt: (store) => {
    const angedockt = !get().seitenleisteAngedockt
    set({ seitenleisteAngedockt: angedockt })
    void store.speichern({
      seitenleiste: {
        sichtbar: get().seitenleisteSichtbar,
        angedockt,
        breite: get().seitenleisteBreite,
      },
    })
  },

  setSeitenleisteBreite: (store, breite) => {
    const begrenzt = begrenzeSeitenleistenBreite(breite)
    set({ seitenleisteBreite: begrenzt })
    void store.speichern({
      seitenleiste: {
        sichtbar: get().seitenleisteSichtbar,
        angedockt: get().seitenleisteAngedockt,
        breite: begrenzt,
      },
    })
  },

  toggleEigenschaftenSichtbar: (store) => {
    const sichtbar = !get().eigenschaftenSichtbar
    set({ eigenschaftenSichtbar: sichtbar })
    void store.speichern({ eigenschaftenSichtbar: sichtbar })
  },

  setKontextleisteSichtbar: (store, sichtbar) => {
    set({ kontextleisteSichtbar: sichtbar })
    void store.speichern({ kontextleiste: { sichtbar, versatz: get().kontextleisteVersatz } })
  },

  setKontextleisteVersatz: (store, versatz) => {
    set({ kontextleisteVersatz: versatz })
    void store.speichern({ kontextleiste: { sichtbar: get().kontextleisteSichtbar, versatz } })
  },

  setBemassungVariante: (store, wert) => {
    if (get().bemassungVariante === wert) return
    set({ bemassungVariante: wert })
    void store.speichern({ bemassungVariante: wert })
  },

  setAnordnenEinstellungen: (store, wert) => {
    set({ anordnenEinstellungen: wert })
    void store.speichern({ automatischAnordnen: wert })
  },

  setVerteilerplanEinstellungen: (store, wert) => {
    set({ verteilerplanEinstellungen: wert })
    void store.speichern({ verteilerplan: wert })
  },

  setStromkreisImPanel: (store, wert) => {
    if (get().stromkreisImPanel === wert) return
    set({ stromkreisImPanel: wert })
    void store.speichern({ stromkreisImPanel: wert })
  },

  setSprache: (store, wert) => {
    if (get().sprache === wert) return
    set({ sprache: wert })
    void store.speichern({ sprache: wert })
  },

  setVerknuepfungNachLeitung: (store, wert) => {
    if (get().verknuepfungNachLeitung === wert) return
    set({ verknuepfungNachLeitung: wert })
    void store.speichern({ verknuepfungNachLeitung: wert })
  },

  setLeitungenErstNachLoslassen: (store, wert) => {
    if (get().leitungenErstNachLoslassen === wert) return
    set({ leitungenErstNachLoslassen: wert })
    void store.speichern({ leitungenErstNachLoslassen: wert })
  },

  leiteBefehleNeuAb: () => {
    const s = get()
    set({
      ...abgeleitet(s.tastenkuerzel),
      ...abgeleiteteSymbolleiste(
        s.symbolleisteReihenfolge,
        s.symbolleisteEingeblendet,
        s.symbolleisteGruppen,
      ),
    })
  },

  setEinfuehrungBeimStartZeigen: (store, wert) => {
    if (get().einfuehrungBeimStartZeigen === wert) return
    set({ einfuehrungBeimStartZeigen: wert })
    void store.speichern({ einfuehrungBeimStartZeigen: wert })
  },
}))
