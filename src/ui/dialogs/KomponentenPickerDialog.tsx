import { useMemo, useState, type CSSProperties } from 'react'
import type {
  Ansteuerung,
  CatalogComponent,
  DockpunkteKonfiguration,
  Fangpunkt,
  KatalogTextElement,
  KomponentenDarstellung,
  KomponentenTyp,
  ModulTraegerKonfiguration,
  Montageort,
  SlotMatrix,
  SlotVorlage,
} from '../../document-model'
import {
  istSwitchOderPatchpanelKatalogEintrag,
  katalogText,
  komponentenText,
  niedrigsteArtikelnummerVariante,
  sichtbareKataloge,
  sichtbareKomponenten,
  variantenText,
  waehleKomponentenGrafik,
} from '../../document-model'
import type { CatalogStore } from '../../persistence'
import { useAktivesBlatt, useAppContext } from '../use-app-context'
import { useKatalogStore } from '../store/katalog-store'
import { useUiStore } from '../store/ui-store'
import { useSettingsStore } from '../store/settings-store'
import {
  PICKER_KACHEL_KOMPAKT_BIS,
  PICKER_KACHEL_MAX,
  PICKER_KACHEL_MIN,
  PICKER_KACHEL_SCHRITT,
} from '../picker-kachel-groesse'
import { useKatalogBildUrl } from '../use-katalog-bild-url'
import { useSprache, useT } from '../sprache-anbindung'
import { passtZurKatalogSuche } from './katalog-suche'
import { kategorieOptionenFuerKatalog } from './picker-kategorien'

export function KomponentenPickerDialog() {
  const picker = useUiStore((s) => s.komponentenPicker)
  const komponenten = useKatalogStore((s) => s.komponenten)
  const kataloge = useKatalogStore((s) => s.kataloge)
  const { catalogStore, settingsStore } = useAppContext()
  const gespeicherteKachelGroesse = useSettingsStore((s) => s.pickerKachelGroesse)
  const setPickerKachelGroesse = useSettingsStore((s) => s.setPickerKachelGroesse)
  const [ziehKachelGroesse, setZiehKachelGroesse] = useState<number | null>(null)
  const kachelGroesse = ziehKachelGroesse ?? gespeicherteKachelGroesse
  const darstellung = useAktivesBlatt().komponentenDarstellung
  const t = useT()
  const sprache = useSprache()
  const [suchtext, setSuchtext] = useState('')
  const [kategorie, setKategorie] = useState('')
  const [katalogId, setKatalogId] = useState('')
  const [ausgewaehlteId, setAusgewaehlteId] = useState<string | null>(null)
  const [variantId, setVariantId] = useState<string | null>(null)

  const aktiveKataloge = useMemo(
    () => sichtbareKataloge(kataloge).filter((k) => k.aktiv),
    [kataloge],
  )
  const zurueckgezogeneKatalogIds = useMemo(
    () => new Set(kataloge.filter((k) => k.ausgemustert).map((k) => k.id)),
    [kataloge],
  )
  const inaktiveKatalogIds = useMemo(
    () => new Set(kataloge.filter((k) => !k.aktiv).map((k) => k.id)),
    [kataloge],
  )

  const festerKatalogId = picker?.nurKatalogId
  const wirksamerKatalogId =
    festerKatalogId ?? (aktiveKataloge.some((k) => k.id === katalogId) ? katalogId : '')
  const kategorien = useMemo(
    () =>
      kategorieOptionenFuerKatalog(
        sichtbareKomponenten(komponenten, kataloge),
        wirksamerKatalogId,
        festerKatalogId ? new Set<string>() : inaktiveKatalogIds,
        sprache,
      ),
    [komponenten, kataloge, wirksamerKatalogId, inaktiveKatalogIds, festerKatalogId, sprache],
  )
  const wirksameKategorie = kategorien.some((k) => k.wert === kategorie) ? kategorie : ''

  const gefiltert = useMemo(() => {
    return komponenten.filter((k) => {
      if (
        !festerKatalogId &&
        picker?.filter !== 'betriebsmittel' &&
        inaktiveKatalogIds.has(k.katalogId)
      )
        return false
      if (picker?.filter === 'betriebsmittel' && !k.kennzeichenBuchstabe?.trim()) return false
      if (k.ausgemustert || zurueckgezogeneKatalogIds.has(k.katalogId)) return false
      if (k.knxAktor && festerKatalogId) return false
      if (wirksamerKatalogId && k.katalogId !== wirksamerKatalogId) return false
      if (wirksameKategorie && k.kategorie !== wirksameKategorie) return false
      if (picker?.filter === 'switchPatchpanel' && !istSwitchOderPatchpanelKatalogEintrag(k))
        return false
      return passtZurKatalogSuche(k, suchtext)
    })
  }, [
    komponenten,
    suchtext,
    wirksameKategorie,
    wirksamerKatalogId,
    inaktiveKatalogIds,
    zurueckgezogeneKatalogIds,
    picker?.filter,
    festerKatalogId,
  ])

  if (!picker) return null

  function schliessenMit(
    ergebnis: {
      catalogComponentId: string
      variantId: string | null
      dockpunkte?: DockpunkteKonfiguration
      fangpunkt?: Fangpunkt
      textElemente?: KatalogTextElement[]
      breitenFaktor?: number
      hoehenFaktor?: number
      kombinierbar?: boolean
      montageort?: Montageort
      modulTraeger?: ModulTraegerKonfiguration
      modulSystem?: string
      typ?: KomponentenTyp
      slotVorlagen?: SlotVorlage[]
      slotMatrixVorlage?: SlotMatrix
      slotAnzahlAus?: string
      ansteuerung?: Ansteuerung
      kennzeichenBuchstabe?: string
      betriebsmittelRolle?: 'spule' | 'kontaktblock'
      bauart?: 'patchpanel' | 'verteiler'
    } | null,
  ) {
    const callback = picker!.callback
    setAusgewaehlteId(null)
    setVariantId(null)
    setSuchtext('')
    useUiStore.getState().schliesseKomponentenPicker()
    callback(ergebnis)
  }

  function uebernehmeKachelGroesse() {
    if (ziehKachelGroesse === null) return
    setPickerKachelGroesse(settingsStore, ziehKachelGroesse)
    setZiehKachelGroesse(null)
  }

  const ausgewaehlteKomponente = komponenten.find((k) => k.id === ausgewaehlteId) ?? null

  function waehleUndBestaetige(k: CatalogComponent) {
    const vorausgewaehlt = niedrigsteArtikelnummerVariante(k)
    schliessenMit({
      catalogComponentId: k.id,
      variantId: vorausgewaehlt ? vorausgewaehlt.id : null,
      dockpunkte: k.dockpunkte,
      fangpunkt: k.fangpunkt,
      textElemente: k.textElemente,
      breitenFaktor: k.breitenFaktor,
      hoehenFaktor: k.hoehenFaktor,
      kombinierbar: k.kombinierbar,
      montageort: k.montageort,
      modulTraeger: k.modulTraeger,
      modulSystem: k.modulSystem,
      typ: k.typ,
      slotVorlagen: k.slotVorlagen,
      slotMatrixVorlage: k.slotMatrixVorlage,
      slotAnzahlAus: k.slotAnzahlAus,
      ansteuerung: k.ansteuerung,
      kennzeichenBuchstabe: k.kennzeichenBuchstabe,
      betriebsmittelRolle: k.betriebsmittelRolle,
      bauart: k.bauart,
    })
  }

  return (
    <div className="dialog-overlay" onMouseDown={() => schliessenMit(null)}>
      <div className="dialog dialog-katalog dialog-picker" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{picker.titel ?? t('katalogdialoge.picker.titel')}</h2>
        <div className="katalog-filterzeile">
          <input
            className="katalog-suche"
            placeholder={t('katalogdialoge.gemeinsam.suche')}
            value={suchtext}
            onChange={(e) => setSuchtext(e.target.value)}
          />
          {aktiveKataloge.length > 1 && !festerKatalogId && (
            <select value={wirksamerKatalogId} onChange={(e) => setKatalogId(e.target.value)}>
              <option value="">{t('katalogdialoge.gemeinsam.alleKataloge')}</option>
              {aktiveKataloge.map((katalog) => (
                <option key={katalog.id} value={katalog.id}>
                  {katalogText(katalog, 'name', sprache)}
                </option>
              ))}
            </select>
          )}
          <select value={wirksameKategorie} onChange={(e) => setKategorie(e.target.value)}>
            <option value="">{t('katalogdialoge.gemeinsam.alleKategorien')}</option>
            {kategorien.map((k) => (
              <option key={k.wert} value={k.wert}>
                {k.text}
              </option>
            ))}
          </select>
          <label className="picker-kachelgroesse" title={t('katalogdialoge.picker.kachelgroesse')}>
            <span>{t('katalogdialoge.picker.kachelgroesse')}</span>
            <input
              type="range"
              min={PICKER_KACHEL_MIN}
              max={PICKER_KACHEL_MAX}
              step={PICKER_KACHEL_SCHRITT}
              value={kachelGroesse}
              onChange={(e) => setZiehKachelGroesse(Number(e.target.value))}
              onPointerUp={uebernehmeKachelGroesse}
              onKeyUp={uebernehmeKachelGroesse}
              onBlur={uebernehmeKachelGroesse}
            />
          </label>
        </div>
        <div
          className={`katalog-grid katalog-grid-picker${
            kachelGroesse <= PICKER_KACHEL_KOMPAKT_BIS ? ' kompakt' : ''
          }`}
          style={{ '--kachel-groesse': `${kachelGroesse}px` } as CSSProperties}
        >
          {gefiltert.length === 0 && (
            <p className="dialog-hinweis">{t('katalogdialoge.gemeinsam.keineKomponenten')}</p>
          )}
          {gefiltert.map((k) => (
            <KomponentenKarte
              key={k.id}
              komponente={k}
              catalogStore={catalogStore}
              darstellung={darstellung}
              ausgewaehlt={k.id === ausgewaehlteId}
              onClick={() => {
                setAusgewaehlteId(k.id)
                const vorausgewaehlt = niedrigsteArtikelnummerVariante(k)
                setVariantId(vorausgewaehlt ? vorausgewaehlt.id : null)
              }}
              onDoubleClick={() => waehleUndBestaetige(k)}
            />
          ))}
        </div>
        {ausgewaehlteKomponente && ausgewaehlteKomponente.varianten.length > 0 && (
          <label className="dialog-feld">
            {t('katalogdialoge.picker.variante')}
            <select value={variantId ?? ''} onChange={(e) => setVariantId(e.target.value || null)}>
              {ausgewaehlteKomponente.varianten.map((v) => (
                <option key={v.id} value={v.id}>
                  {(v.farbe && variantenText(ausgewaehlteKomponente, v, 'farbe', sprache)) ??
                    (v.name && variantenText(ausgewaehlteKomponente, v, 'name', sprache)) ??
                    v.id}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="dialog-aktionen">
          <button type="button" onClick={() => schliessenMit(null)}>
            {t('katalogdialoge.gemeinsam.abbrechen')}
          </button>
          <button
            type="button"
            className="primaer"
            disabled={!ausgewaehlteId}
            onClick={() =>
              ausgewaehlteId &&
              schliessenMit({
                catalogComponentId: ausgewaehlteId,
                variantId,
                dockpunkte: ausgewaehlteKomponente?.dockpunkte,
                fangpunkt: ausgewaehlteKomponente?.fangpunkt,
                textElemente: ausgewaehlteKomponente?.textElemente,
                breitenFaktor: ausgewaehlteKomponente?.breitenFaktor,
                hoehenFaktor: ausgewaehlteKomponente?.hoehenFaktor,
                kombinierbar: ausgewaehlteKomponente?.kombinierbar,
                montageort: ausgewaehlteKomponente?.montageort,
                modulTraeger: ausgewaehlteKomponente?.modulTraeger,
                modulSystem: ausgewaehlteKomponente?.modulSystem,
                typ: ausgewaehlteKomponente?.typ,
                slotVorlagen: ausgewaehlteKomponente?.slotVorlagen,
                slotMatrixVorlage: ausgewaehlteKomponente?.slotMatrixVorlage,
                slotAnzahlAus: ausgewaehlteKomponente?.slotAnzahlAus,
                ansteuerung: ausgewaehlteKomponente?.ansteuerung,
                kennzeichenBuchstabe: ausgewaehlteKomponente?.kennzeichenBuchstabe,
                betriebsmittelRolle: ausgewaehlteKomponente?.betriebsmittelRolle,
                bauart: ausgewaehlteKomponente?.bauart,
              })
            }
          >
            {picker.bestaetigenText ?? t('katalogdialoge.picker.platzieren')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function KomponentenKarte({
  komponente,
  catalogStore,
  darstellung,
  ausgewaehlt,
  onClick,
  onDoubleClick,
}: {
  komponente: CatalogComponent
  catalogStore: CatalogStore
  darstellung: KomponentenDarstellung
  ausgewaehlt: boolean
  onClick: () => void
  onDoubleClick?: () => void
}) {
  const sprache = useSprache()
  const bildUrl = useKatalogBildUrl(
    waehleKomponentenGrafik(komponente, darstellung)?.grafik,
    catalogStore,
  )
  return (
    <button
      type="button"
      className={`katalog-karte${ausgewaehlt ? ' ausgewaehlt' : ''}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <span className="katalog-karte-bild">
        {bildUrl ? <img src={bildUrl} alt="" /> : <span className="katalog-karte-platzhalter" />}
      </span>
      <span className="katalog-karte-name">{komponentenText(komponente, 'name', sprache)}</span>
      <span className="katalog-karte-info">
        {[komponente.hersteller, komponente.artikelnummer].filter(Boolean).join(' · ')}
      </span>
    </button>
  )
}
