import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useAppContext } from './use-app-context'
import { useHatModul } from './lizenz-module'
import { useSettingsStore } from './store/settings-store'
import { useZusatzmodulStore } from './store/zusatzmodul-store'
import { useBefehle } from './befehle/use-befehle'
import { befehlNachId, befehlName } from './befehle/katalog'
import { useT } from './sprache-anbindung'
import {
  BLATT_SICHTBARKEITEN,
  OBJEKT_SICHTBARKEITEN,
  WIRKVERBINDUNG_SICHTBARKEIT,
} from './befehle/blatt-sichtbarkeit'
import { BefehlIcon } from './befehle/BefehlIcon'
import { anzeige } from './befehle/kuerzel'
import {
  EINLAGE_WERKZEUGE,
  GEOMETRIE_WERKZEUGE,
  NETZ_WERKZEUGE,
  WAND_RAUM_WERKZEUGE,
} from './menue-gliederung'
import { zusatzmodulDateiUrl, type ZuletztBearbeitet } from '../persistence'
import {
  IconAllesAuswaehlen,
  IconAusblendungenListe,
  IconAuswahlAufheben,
  IconAutomatischAnordnen,
  IconBeschriftung,
  IconBlattverwaltung,
  IconDokExcel,
  IconDokZeichnung,
  IconDrucken,
  IconEigenschaftenPanel,
  IconKontextleiste,
  IconEinfuegen,
  IconEinstellungen,
  IconEinstellungenEinspielen,
  IconEinstellungenSichern,
  IconExport,
  IconFang,
  IconFehlerprotokoll,
  IconHaken,
  IconHintergrund,
  IconHintergrundLaden,
  IconHintergrundLoeschen,
  IconImport,
  IconBuch,
  IconInfo,
  IconKabeltypen,
  IconInstallationszonen,
  IconKatalog,
  IconKatalogImport,
  IconKomponenteNeu,
  IconKopieren,
  IconNeu,
  IconNullpunktAlle,
  IconNullpunktAufheben,
  IconObjektfang,
  IconPapierkorb,
  IconParagraf,
  IconPfeilRechts,
  IconProjekte,
  IconRaster,
  IconRueckgaengig,
  IconSchere,
  IconSeitenleiste,
  IconSicherung,
  IconSpeichern,
  IconSpurfang,
  IconHintergrundfang,
  IconWandfang,
  IconHintergrundUmwandeln,
  IconSymbolleiste,
  IconTastatur,
  IconUhr,
  IconVollbild,
  IconDreid,
  IconWerkzeugSchluessel,
  IconWiederholen,
  IconZeichenflaeche,
  IconZoom100,
  IconZoomAlles,
  IconZoomRaus,
  IconZoomRein,
  WerkzeugIcon,
} from './components/Icons'

interface MenuProps {
  titel: string
  id: string
  offen: string | null
  setOffen: (id: string | null) => void
  children: ReactNode
}

function Menu({ titel, id, offen, setOffen, children }: MenuProps) {
  return (
    <div className="menu">
      <button
        type="button"
        className={`menu-titel${offen === id ? ' offen' : ''}`}
        aria-haspopup="true"
        aria-expanded={offen === id}
        onClick={() => setOffen(offen === id ? null : id)}
        onMouseEnter={() => {
          if (offen !== null) setOffen(id)
        }}
      >
        {titel}
      </button>
      {offen === id && <div className="menu-dropdown">{children}</div>}
    </div>
  )
}

function MenuEintrag({
  onClick,
  disabled,
  kuerzel,
  icon,
  haken,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  kuerzel?: string
  icon?: ReactNode
  haken?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="menu-eintrag"
      role={haken === undefined ? undefined : 'menuitemcheckbox'}
      aria-checked={haken}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="menu-eintrag-icon">{icon}</span>
      <span className="menu-eintrag-text">{children}</span>
      {haken && (
        <span className="menu-eintrag-haken">
          <IconHaken />
        </span>
      )}
      {kuerzel && <span className="menu-eintrag-kuerzel">{kuerzel}</span>}
    </button>
  )
}

const FLYOUT_VERZOEGERUNG_MS = 120

function MenuUntermenue({
  titel,
  icon,
  children,
}: {
  titel: string
  icon?: ReactNode
  children: ReactNode
}) {
  const [offen, setOffen] = useState(false)
  const [nachLinks, setNachLinks] = useState(false)
  const flyoutRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<number | null>(null)

  function planeZustand(neu: boolean) {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setOffen(neu), FLYOUT_VERZOEGERUNG_MS)
  }

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  useLayoutEffect(() => {
    if (!offen || !flyoutRef.current) return
    const rechts = flyoutRef.current.getBoundingClientRect().right
    setNachLinks(rechts > window.innerWidth - 8)
  }, [offen])

  return (
    <div
      className="menu-unter"
      onMouseEnter={() => planeZustand(true)}
      onMouseLeave={() => planeZustand(false)}
    >
      <button
        type="button"
        className={`menu-eintrag menu-eintrag-mit-unter${offen ? ' offen' : ''}`}
        aria-haspopup="true"
        aria-expanded={offen}
        onClick={() => setOffen(!offen)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setOffen(true)
          if (e.key === 'ArrowLeft') setOffen(false)
        }}
      >
        <span className="menu-eintrag-icon">{icon}</span>
        <span className="menu-eintrag-text">{titel}</span>
        <span className="menu-eintrag-pfeil">
          <IconPfeilRechts />
        </span>
      </button>
      {offen && (
        <div
          className={`menu-dropdown menu-flyout${nachLinks ? ' nach-links' : ''}`}
          ref={flyoutRef}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function MenuTrenner() {
  return <div className="menu-trenner" />
}

function Befehl({
  id,
  icon,
  label,
  schliesse,
}: {
  id: string
  icon?: ReactNode
  label?: string
  schliesse: () => void
}) {
  const befehle = useBefehle()
  const belegung = useSettingsStore((s) => s.belegung)
  const eintrag = befehlNachId(id)
  const aktion = befehle[id]
  if (!eintrag || !aktion || aktion.verborgen) return null
  const kuerzel = belegung[id]
  return (
    <MenuEintrag
      onClick={() => {
        schliesse()
        aktion.ausfuehren()
      }}
      disabled={aktion.deaktiviert}
      kuerzel={eintrag.festeAnzeige ?? (kuerzel ? anzeige(kuerzel) : undefined)}
      icon={icon ?? (eintrag.werkzeugId ? <WerkzeugIcon id={eintrag.werkzeugId} /> : undefined)}
      haken={aktion.haken}
    >
      {(label ?? befehlName(eintrag.id)) + (aktion.labelZusatz ?? '')}
    </MenuEintrag>
  )
}

function ZusatzmodulEintraege({ schliesse }: { schliesse: () => void }) {
  const t = useT()
  const { zusatzmodule, doc } = useAppContext()
  const eintraege = useZusatzmodulStore((s) => s.eintraege)
  useZusatzmodulStore((s) => s.texte)
  const laufend = useZusatzmodulStore((s) => s.laufend)
  const aktive = eintraege.filter((e) => e.aktiv)
  if (aktive.length === 0) {
    return (
      <MenuEintrag onClick={() => {}} disabled>
        {t('menue.keineModule')}
      </MenuEintrag>
    )
  }
  const zeichnungsart = doc.getZeichnung().zeichnungsart
  return (
    <>
      {aktive.map(({ manifest }) => {
        const icon = manifest.icon ? (
          <img
            className="menu-modul-icon"
            src={zusatzmodulDateiUrl(manifest.kennung, manifest.version, manifest.icon)}
            alt=""
          />
        ) : undefined
        const eintrag = (befehl: (typeof manifest.befehle)[number], titel: string, key: string) => (
          <MenuEintrag
            key={key}
            icon={
              befehl.icon ? (
                <img
                  className="menu-modul-icon"
                  src={zusatzmodulDateiUrl(manifest.kennung, manifest.version, befehl.icon)}
                  alt=""
                />
              ) : (
                icon
              )
            }
            disabled={
              laufend !== null ||
              (befehl.nurZeichnungsart !== undefined && befehl.nurZeichnungsart !== zeichnungsart)
            }
            onClick={() => {
              schliesse()
              void zusatzmodule.fuehreAus(manifest.kennung, befehl.id)
            }}
          >
            {titel}
          </MenuEintrag>
        )
        const [einziger] = manifest.befehle
        if (manifest.befehle.length === 1 && einziger) {
          return eintrag(einziger, manifest.name, manifest.kennung)
        }
        return (
          <MenuUntermenue key={manifest.kennung} titel={manifest.name} icon={icon}>
            {manifest.befehle.map((b) =>
              eintrag(b, zusatzmodule.befehlTitel(manifest, b.id), b.id),
            )}
          </MenuUntermenue>
        )
      })}
    </>
  )
}

export function MenuBar() {
  const t = useT()
  const [offen, setOffen] = useState<string | null>(null)
  const menuBarRef = useRef<HTMLElement | null>(null)
  const { oeffneDokument, zuletztBearbeitet } = useAppContext()
  const bim = useHatModul('bim')
  const schliessen = () => setOffen(null)
  const [zuletzteDokumente, setZuletzteDokumente] = useState<ZuletztBearbeitet[]>([])

  useEffect(() => {
    function schliesseBeiAuszen(e: MouseEvent) {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) setOffen(null)
    }
    window.addEventListener('pointerdown', schliesseBeiAuszen)
    return () => window.removeEventListener('pointerdown', schliesseBeiAuszen)
  }, [])

  useEffect(() => {
    if (offen === null) return
    function aufTaste(e: KeyboardEvent) {
      if (e.key === 'Escape') setOffen(null)
    }
    window.addEventListener('keydown', aufTaste)
    return () => window.removeEventListener('keydown', aufTaste)
  }, [offen])

  useEffect(() => {
    if (offen === 'datei') {
      zuletztBearbeitet()
        .then(setZuletzteDokumente)
        .catch(() => setZuletzteDokumente([]))
    }
  }, [offen, zuletztBearbeitet])

  return (
    <nav className="menu-bar" aria-label={t('menue.hauptmenue')} ref={menuBarRef}>
      <Menu titel={t('menue.datei')} id="datei" offen={offen} setOffen={setOffen}>
        <Befehl schliesse={schliessen} id="datei.projekte" icon={<IconProjekte />} />
        <Befehl schliesse={schliessen} id="datei.neue-zeichnung" icon={<IconNeu />} />
        <Befehl schliesse={schliessen} id="datei.verteilerplan-assistent" />
        <MenuUntermenue titel={t('menue.zuletztBearbeitet')} icon={<IconUhr />}>
          {zuletzteDokumente.length === 0 && (
            <div className="menu-eintrag menu-eintrag-info">
              <span className="menu-eintrag-icon" />
              <span className="menu-eintrag-text">{t('menue.nochKeineDokumente')}</span>
            </div>
          )}
          {zuletzteDokumente.map((eintrag) => (
            <MenuEintrag
              key={eintrag.id}
              onClick={() => {
                setOffen(null)
                void oeffneDokument(eintrag.id)
              }}
              icon={<IconDokZeichnung />}
            >
              {[eintrag.kunde, eintrag.projektBezeichnung, eintrag.name]
                .filter(Boolean)
                .join(' · ')}
            </MenuEintrag>
          ))}
        </MenuUntermenue>
        <MenuTrenner />
        <Befehl schliesse={schliessen} id="datei.speichern" icon={<IconSpeichern />} />
        <MenuUntermenue titel={t('menue.importieren')} icon={<IconImport />}>
          <Befehl
            schliesse={schliessen}
            id="datei.import-zeichnung"
            icon={<IconDokZeichnung />}
            label={t('menue.importZeichnung')}
          />
          <Befehl
            schliesse={schliessen}
            id="datei.import-hintergrund"
            icon={<IconHintergrundLaden />}
            label={bim ? t('menue.importHintergrundIfc') : t('menue.importHintergrund')}
          />
          <Befehl
            schliesse={schliessen}
            id="datei.import-katalog"
            icon={<IconKatalog />}
            label={t('menue.importKatalog')}
          />
        </MenuUntermenue>
        <MenuUntermenue titel={t('menue.exportieren')} icon={<IconExport />}>
          <Befehl
            schliesse={schliessen}
            id="datei.export-zeichnung"
            icon={<IconDokZeichnung />}
            label={t('menue.exportZeichnung')}
          />
          <Befehl
            schliesse={schliessen}
            id="datei.export-plan"
            icon={<IconExport />}
            label={t('menue.exportPlan')}
          />
          <Befehl
            schliesse={schliessen}
            id="datei.export-excel"
            icon={<IconDokExcel />}
            label={t('menue.exportExcel')}
          />
          <Befehl
            schliesse={schliessen}
            id="datei.export-ifc"
            icon={<IconExport />}
            label={t('menue.exportIfc')}
          />
        </MenuUntermenue>
        <Befehl schliesse={schliessen} id="datei.drucken" icon={<IconDrucken />} />
        <MenuTrenner />
        <Befehl schliesse={schliessen} id="datei.sicherung" icon={<IconSicherung />} />
      </Menu>

      <Menu titel={t('menue.bearbeiten')} id="bearbeiten" offen={offen} setOffen={setOffen}>
        <Befehl schliesse={schliessen} id="bearbeiten.rueckgaengig" icon={<IconRueckgaengig />} />
        <Befehl schliesse={schliessen} id="bearbeiten.wiederholen" icon={<IconWiederholen />} />
        <MenuTrenner />
        <Befehl schliesse={schliessen} id="bearbeiten.ausschneiden" icon={<IconSchere />} />
        <Befehl schliesse={schliessen} id="bearbeiten.kopieren" icon={<IconKopieren />} />
        <Befehl schliesse={schliessen} id="bearbeiten.einfuegen" icon={<IconEinfuegen />} />
        <Befehl schliesse={schliessen} id="bearbeiten.loeschen" icon={<IconPapierkorb />} />
        <MenuTrenner />
        <Befehl
          schliesse={schliessen}
          id="bearbeiten.alles-auswaehlen"
          icon={<IconAllesAuswaehlen />}
        />
        <Befehl
          schliesse={schliessen}
          id="bearbeiten.auswahl-aufheben"
          icon={<IconAuswahlAufheben />}
        />
        <MenuTrenner />
        <Befehl
          schliesse={schliessen}
          id="bearbeiten.automatisch-anordnen"
          icon={<IconAutomatischAnordnen />}
        />
      </Menu>

      <Menu titel={t('menue.zeichnen')} id="zeichnen" offen={offen} setOffen={setOffen}>
        <Befehl schliesse={schliessen} id="werkzeug.auswahl" />
        <MenuTrenner />
        {NETZ_WERKZEUGE.map((id) => (
          <Befehl schliesse={schliessen} key={id} id={id} />
        ))}
        <Befehl schliesse={schliessen} id="bearbeiten.leitungen-neu-verlegen" />
        <MenuTrenner />
        <MenuUntermenue titel={t('menue.waendeRaeume')} icon={<WerkzeugIcon id="wand" />}>
          {WAND_RAUM_WERKZEUGE.map((id) => (
            <Befehl schliesse={schliessen} key={id} id={id} />
          ))}
        </MenuUntermenue>
        <MenuUntermenue titel={t('menue.geometrie')} icon={<WerkzeugIcon id="linie" />}>
          {GEOMETRIE_WERKZEUGE.map((id) => (
            <Befehl schliesse={schliessen} key={id} id={id} />
          ))}
        </MenuUntermenue>
        <Befehl schliesse={schliessen} id="werkzeug.trimmen" />
        <Befehl schliesse={schliessen} id="werkzeug.wandteilen" />
        <MenuTrenner />
        <MenuUntermenue titel={t('menue.planEinlagen')} icon={<WerkzeugIcon id="stueckliste" />}>
          {EINLAGE_WERKZEUGE.map((id) => (
            <Befehl schliesse={schliessen} key={id} id={id} />
          ))}
        </MenuUntermenue>
      </Menu>

      <Menu titel={t('menue.blatt')} id="blatt" offen={offen} setOffen={setOffen}>
        <Befehl
          schliesse={schliessen}
          id="blatt.zeichenflaeche-einrichten"
          icon={<IconZeichenflaeche />}
        />
        <Befehl schliesse={schliessen} id="werkzeug.zeichenflaeche-verschieben" />
        <Befehl
          schliesse={schliessen}
          id="blatt.beschriftung-groesse"
          icon={<IconBeschriftung />}
        />
        <MenuUntermenue titel={t('menue.beschriftungenAnzeigen')} icon={<IconBeschriftung />}>
          {BLATT_SICHTBARKEITEN.map(({ id }) => (
            <Befehl schliesse={schliessen} key={id} id={id} icon={<BefehlIcon id={id} />} />
          ))}
        </MenuUntermenue>
        <Befehl
          schliesse={schliessen}
          id={WIRKVERBINDUNG_SICHTBARKEIT.id}
          icon={<BefehlIcon id={WIRKVERBINDUNG_SICHTBARKEIT.id} />}
        />
        {OBJEKT_SICHTBARKEITEN.map(({ id }) => (
          <Befehl schliesse={schliessen} key={id} id={id} icon={<BefehlIcon id={id} />} />
        ))}
        <MenuTrenner />
        <Befehl schliesse={schliessen} id="werkzeug.nullpunkt" />
        <Befehl schliesse={schliessen} id="blatt.nullpunkt-alle" icon={<IconNullpunktAlle />} />
        <Befehl schliesse={schliessen} id="blatt.ausrichten" />
        <Befehl schliesse={schliessen} id="blatt.etagen" />
        <Befehl
          schliesse={schliessen}
          id="blatt.nullpunkt-aufheben"
          icon={<IconNullpunktAufheben />}
        />
        <MenuTrenner />
        <Befehl
          schliesse={schliessen}
          id="datei.import-hintergrund"
          icon={<IconHintergrundLaden />}
          label={t('menue.hintergrundplanEinlesen')}
        />
        <Befehl schliesse={schliessen} id="blatt.ifc-nachladen" icon={<IconHintergrundLaden />} />
        <Befehl schliesse={schliessen} id="blatt.ifc-bauteilgruppen" />
        <Befehl schliesse={schliessen} id="blatt.ifc-bauteile" />
        <Befehl schliesse={schliessen} id="ansicht.hintergrund" icon={<IconHintergrund />} />
        <Befehl schliesse={schliessen} id="werkzeug.kalibrieren" />
        <Befehl schliesse={schliessen} id="werkzeug.hintergrund-ausblenden" />
        <Befehl
          schliesse={schliessen}
          id="blatt.hintergrund-ausblendungen"
          icon={<IconAusblendungenListe />}
        />
        <Befehl
          schliesse={schliessen}
          id="blatt.hintergrund-loeschen"
          icon={<IconHintergrundLoeschen />}
        />
        <Befehl
          schliesse={schliessen}
          id="blatt.hintergrund-umwandeln"
          icon={<IconHintergrundUmwandeln />}
        />
        <Befehl schliesse={schliessen} id="blatt.ebenen" />
        <MenuTrenner />
        <Befehl schliesse={schliessen} id="blatt.verwaltung" icon={<IconBlattverwaltung />} />
      </Menu>

      <Menu titel={t('menue.ansicht')} id="ansicht" offen={offen} setOffen={setOffen}>
        <MenuUntermenue titel={t('menue.zoom')} icon={<IconZoomRein />}>
          <Befehl schliesse={schliessen} id="ansicht.zoom-rein" icon={<IconZoomRein />} />
          <Befehl schliesse={schliessen} id="ansicht.zoom-raus" icon={<IconZoomRaus />} />
          <Befehl schliesse={schliessen} id="werkzeug.zoom-fenster" />
          <Befehl schliesse={schliessen} id="ansicht.zoom-alles" icon={<IconZoomAlles />} />
          <Befehl schliesse={schliessen} id="ansicht.zoom-100" icon={<IconZoom100 />} />
        </MenuUntermenue>
        <MenuTrenner />
        <Befehl
          schliesse={schliessen}
          id="ansicht.raster"
          icon={<IconRaster />}
          label={t('menue.raster')}
        />
        <Befehl
          schliesse={schliessen}
          id="ansicht.fang"
          icon={<IconFang />}
          label={t('menue.fangRaster')}
        />
        <Befehl
          schliesse={schliessen}
          id="ansicht.objektfang"
          icon={<IconObjektfang />}
          label={t('menue.objektfang')}
        />
        <Befehl
          schliesse={schliessen}
          id="ansicht.spurfang"
          icon={<IconSpurfang />}
          label={t('menue.spurlinien')}
        />
        <Befehl
          schliesse={schliessen}
          id="ansicht.hintergrundfang"
          icon={<IconHintergrundfang />}
          label={t('menue.fangHintergrund')}
        />
        <Befehl
          schliesse={schliessen}
          id="ansicht.wandfang"
          icon={<IconWandfang />}
          label={t('menue.wandfang')}
        />
        <Befehl
          schliesse={schliessen}
          id="ansicht.hintergrund"
          icon={<IconHintergrund />}
          label={t('menue.hintergrund')}
        />
        <MenuTrenner />
        <Befehl
          schliesse={schliessen}
          id="ansicht.symbolleiste"
          icon={<IconSymbolleiste />}
          label={t('menue.symbolleiste')}
        />
        <Befehl
          schliesse={schliessen}
          id="ansicht.seitenleiste"
          icon={<IconSeitenleiste />}
          label={t('menue.seitenleiste')}
        />
        <Befehl
          schliesse={schliessen}
          id="ansicht.eigenschaften"
          icon={<IconEigenschaftenPanel />}
          label={t('menue.eigenschaften')}
        />
        <Befehl
          schliesse={schliessen}
          id="ansicht.kontextleiste"
          icon={<IconKontextleiste />}
          label={t('menue.tastenfunktionen')}
        />
        <Befehl schliesse={schliessen} id="ansicht.vollbild" icon={<IconVollbild />} />
        <Befehl schliesse={schliessen} id="ansicht.dreid" icon={<IconDreid />} />
      </Menu>

      <Menu titel={t('menue.katalog')} id="katalog" offen={offen} setOffen={setOffen}>
        <Befehl schliesse={schliessen} id="katalog.oeffnen" icon={<IconKatalog />} />
        <Befehl schliesse={schliessen} id="katalog.komponente-neu" icon={<IconKomponenteNeu />} />
        <MenuTrenner />
        <Befehl schliesse={schliessen} id="katalog.kabeltypen" icon={<IconKabeltypen />} />
        <Befehl
          schliesse={schliessen}
          id="katalog.installationszonen"
          icon={<IconInstallationszonen />}
        />
        <MenuTrenner />
        <Befehl schliesse={schliessen} id="datei.import-katalog" icon={<IconKatalogImport />} />
        <Befehl schliesse={schliessen} id="datei.import-bibliothek" icon={<IconKatalogImport />} />
        <Befehl schliesse={schliessen} id="datei.export-bibliothek" icon={<IconExport />} />
      </Menu>

      <Menu titel={t('menue.extras')} id="extras" offen={offen} setOffen={setOffen}>
        <Befehl schliesse={schliessen} id="extras.einstellungen" icon={<IconEinstellungen />} />
        <Befehl schliesse={schliessen} id="extras.tastenkuerzel" icon={<IconTastatur />} />
        <MenuTrenner />
        <Befehl
          schliesse={schliessen}
          id="extras.einstellungen-sichern"
          icon={<IconEinstellungenSichern />}
        />
        <Befehl
          schliesse={schliessen}
          id="extras.einstellungen-einspielen"
          icon={<IconEinstellungenEinspielen />}
        />
        <MenuTrenner />
        <Befehl
          schliesse={schliessen}
          id="extras.modulfelder-reparieren"
          icon={<IconWerkzeugSchluessel />}
        />
      </Menu>

      <Menu titel={t('menue.module')} id="module" offen={offen} setOffen={setOffen}>
        <Befehl schliesse={schliessen} id="module.hinzufuegen" />
        <Befehl schliesse={schliessen} id="module.anzeigen" />
        <Befehl schliesse={schliessen} id="module.entfernen" />
        <MenuTrenner />
        <ZusatzmodulEintraege schliesse={schliessen} />
      </Menu>

      <Menu titel={t('menue.hilfe')} id="hilfe" offen={offen} setOffen={setOffen}>
        <Befehl schliesse={schliessen} id="hilfe.hinweise" icon={<IconInfo />} />
        <Befehl schliesse={schliessen} id="hilfe.handbuch" icon={<IconBuch />} />
        <MenuTrenner />
        <Befehl schliesse={schliessen} id="hilfe.ueber" icon={<IconInfo />} />
        <Befehl schliesse={schliessen} id="hilfe.meine-lizenz" icon={<IconParagraf />} />
        <Befehl schliesse={schliessen} id="hilfe.lizenzen" icon={<IconParagraf />} />
        <MenuTrenner />
        <Befehl schliesse={schliessen} id="hilfe.fehlerprotokoll" icon={<IconFehlerprotokoll />} />
      </Menu>
    </nav>
  )
}
