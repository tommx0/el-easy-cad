import { useMemo, useState } from 'react'
import type {
  CatalogComponent,
  KomponentenObjekt,
  PortBelegung,
  PortZuweisung,
  SchachtAnKette,
  SwitchAmTrunk,
  VerteilerAuswahl,
  Zeichnung,
} from '../../document-model'
import {
  aufgeloesteVariante,
  komponentenText,
  beschreibeSchachtStraenge,
  ermittleErreichbareGeraete,
  ermittlePoeSummeWatt,
  ermittlePortBelegung,
  ermittleSchachtStraenge,
  ermittleSchaechteAnKette,
  ermittleSwitchesAnKette,
  ermittleVerteilerAnKette,
  istPortKomponente,
  naechsteFreieStrangNummer,
  portBezeichnung,
  portRasterLayout,
  pruefeStrangAnschluss,
  sammlePortZuweisungen,
  strangNamenImVerbund,
  strangTitel,
  switchBezeichnung,
  verteilerKennzeichenText,
} from '../../document-model'
import {
  erzeugeInterneVerbindungCommand,
  erzeugeObjektAktualisierenCommand,
  erzeugeObjektEntfernenCommand,
} from '../../tools'
import { oberflaechensprache, type Schluessel, type Uebersetzer } from '../../sprache'
import type { BuendelZiel, SwitchPortZiel } from '../store/ui-store'
import { useAppContext, useProject } from '../use-app-context'
import { useKatalogStore } from '../store/katalog-store'
import { useUiStore } from '../store/ui-store'
import { useT } from '../sprache-anbindung'
import { VerteilerInhalt } from './VerteilerDialog'

export function SwitchPortDialog() {
  const t = useT()
  const dialog = useUiStore((s) => s.switchPortDialog)
  const komponenten = useKatalogStore((s) => s.komponenten)
  const { doc, commands } = useAppContext()
  const [auswahl, setAuswahl] = useState<SwitchPortZiel | null>(null)
  const [schachtAuswahl, setSchachtAuswahl] = useState<SchachtStrangWahl | null>(null)
  const [rubrikWahl, setRubrikWahl] = useState<Rubrik | null>(null)
  const [verteilerWahl, setVerteilerWahl] = useState<{
    blattId: string
    objektId: string
    anschluesse: VerteilerAuswahl[]
  } | null>(null)
  const [verbindenQuelle, setVerbindenQuelle] = useState<SwitchPortZiel | null>(null)
  const [verbindenZiel, setVerbindenZiel] = useState<SwitchPortZiel | null>(null)
  const [filterId, setFilterId] = useState<string | null>(null)
  const [etageFilter, setEtageFilter] = useState<string | null>(null)
  const [typFilter, setTypFilter] = useState<string | null>(null)
  const zeichnung = useProject()

  const switches = useMemo<SwitchAmTrunk[]>(() => {
    if (!dialog) return []
    if (dialog.quelle.art === 'trunk') {
      return ermittleSwitchesAnKette(zeichnung, dialog.quelle.blattId, dialog.quelle.trunkId)
    }
    const blatt = zeichnung.blaetter.find((b) => b.id === dialog.quelle.blattId)
    const komponente = blatt?.objekte.find(
      (o): o is KomponentenObjekt =>
        o.type === 'komponente' &&
        dialog.quelle.art === 'switch' &&
        o.id === dialog.quelle.objektId,
    )
    if (!blatt || !komponente || !istPortKomponente(komponente)) return []
    return [
      {
        blattId: blatt.id,
        blattName: blatt.name,
        switchInstanz: komponente,
        trunkId: '',
        trunkName: '',
        endeIndex: 0,
      },
    ]
  }, [dialog, zeichnung])

  const zuweisungen = useMemo(() => sammlePortZuweisungen(zeichnung), [zeichnung])

  const erreichbareGeraete = useMemo<SwitchAmTrunk[]>(() => {
    if (!verbindenQuelle) return []
    return ermittleErreichbareGeraete(zeichnung, verbindenQuelle.blattId, verbindenQuelle.objektId)
  }, [zeichnung, verbindenQuelle])

  const schaechte = useMemo<SchachtAnKette[]>(() => {
    if (!dialog?.schachtErlaubt || dialog.quelle.art !== 'trunk') return []
    const eigenesBlatt = dialog.quelle.blattId
    return ermittleSchaechteAnKette(zeichnung, eigenesBlatt, dialog.quelle.trunkId).filter(
      (s) => s.blattId === eigenesBlatt,
    )
  }, [dialog, zeichnung])

  const verteilerEintraege = useMemo(
    () =>
      dialog?.modus === 'zuweisen' && dialog.quelle.art === 'trunk'
        ? ermittleVerteilerAnKette(zeichnung, dialog.quelle.blattId, dialog.quelle.trunkId)
        : [],
    [dialog, zeichnung],
  )

  const istPatchpanel = (eintrag: SwitchAmTrunk) =>
    komponenten.find((k) => k.id === eintrag.switchInstanz.catalogComponentId)?.bauart ===
    'patchpanel'
  const switchEintraege = switches.filter((e) => !istPatchpanel(e))
  const patchpanelEintraege = switches.filter(istPatchpanel)

  const verfuegbareRubriken: Rubrik[] = []
  if (switchEintraege.length > 0) verfuegbareRubriken.push('switch')
  if (patchpanelEintraege.length > 0) verfuegbareRubriken.push('patchpanel')
  if (verteilerEintraege.length > 0) verfuegbareRubriken.push('verteiler')
  if (schaechte.length > 0) verfuegbareRubriken.push('schacht')
  const rubrik = rubrikWahl ?? verfuegbareRubriken[0] ?? 'switch'
  const sichtbareEintraege =
    rubrik === 'patchpanel' ? patchpanelEintraege : rubrik === 'switch' ? switchEintraege : []
  const eintraegeGefiltert = sichtbareEintraege
    .filter((e) => !filterId || e.switchInstanz.id === filterId)
    .filter((e) => !etageFilter || e.blattName === etageFilter)
    .filter(
      (e) => !typFilter || (ermittleKatalogEintrag(e, komponenten)?.name ?? null) === typFilter,
    )
  const mehrereBlaetterEintraege = sichtbareEintraege.some(
    (e) => e.blattId !== sichtbareEintraege[0]?.blattId,
  )
  const geraeteTypNamen = [
    ...new Set(
      sichtbareEintraege
        .map((e) => ermittleKatalogEintrag(e, komponenten)?.name)
        .filter((n): n is string => n !== null && n !== undefined),
    ),
  ].sort((a, b) => a.localeCompare(b, 'de'))

  if (!dialog) return null

  const zuweisenModus = dialog.modus === 'zuweisen'
  const aktuelleAuswahl = auswahl ?? dialog.vorauswahl ?? null

  function schliessenMit(ziel: BuendelZiel | null) {
    const callback = dialog!.callback
    setAuswahl(null)
    setSchachtAuswahl(null)
    setVerteilerWahl(null)
    setRubrikWahl(null)
    setFilterId(null)
    setEtageFilter(null)
    setTypFilter(null)
    setVerbindenQuelle(null)
    setVerbindenZiel(null)
    useUiStore.getState().schliesseSwitchPortDialog()
    callback(ziel)
  }

  function bestaetigeVerbindung() {
    if (!verbindenQuelle || !verbindenZiel) return
    commands.execute(erzeugeInterneVerbindungCommand(doc, verbindenQuelle, verbindenZiel))
    setVerbindenQuelle(null)
    setVerbindenZiel(null)
  }

  function trenneVerbindung(zuweisung: PortZuweisung) {
    commands.execute(
      erzeugeObjektEntfernenCommand(
        doc,
        zuweisung.leitungBlattId,
        zuweisung.leitungId,
        t('verteilerdialoge.switchPort.trennenUndo'),
      ),
    )
  }

  function setzeBeschriftung(eintrag: SwitchAmTrunk, portIndex: number, text: string) {
    const bisher = eintrag.switchInstanz.portBeschriftungen ?? {}
    const neu = { ...bisher }
    if (text.trim()) neu[String(portIndex)] = text
    else delete neu[String(portIndex)]
    commands.execute(
      erzeugeObjektAktualisierenCommand(
        doc,
        eintrag.blattId,
        eintrag.switchInstanz.id,
        { portBeschriftungen: Object.keys(neu).length > 0 ? neu : undefined },
        t('verteilerdialoge.switchPort.beschriftungUndo'),
      ),
    )
  }

  return (
    <div className="dialog-overlay" onMouseDown={() => schliessenMit(null)}>
      <div className="dialog dialog-switchport" onMouseDown={(e) => e.stopPropagation()}>
        <h2>
          {verbindenQuelle
            ? t('verteilerdialoge.switchPort.titelIntern')
            : !zuweisenModus
              ? t('verteilerdialoge.switchPort.titelBelegung')
              : schaechte.length > 0 || verteilerEintraege.length > 0
                ? t('verteilerdialoge.switchPort.titelZiel')
                : t('verteilerdialoge.switchPort.titelPort')}
        </h2>

        {verbindenQuelle && (
          <p className="dialog-hinweis">
            {t('verteilerdialoge.switchPort.internErklaerung', {
              port: portBezeichnung(verbindenQuelle.portIndex),
              geraet:
                switchBezeichnung(zeichnung, verbindenQuelle, komponenten, oberflaechensprache()) ??
                t('verteilerdialoge.switchPort.diesemGeraet'),
            })}
          </p>
        )}

        {!verbindenQuelle && verfuegbareRubriken.length > 1 && (
          <div className="switchport-rubriken" role="tablist">
            {verfuegbareRubriken.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={rubrik === r}
                className={rubrik === r ? 'aktiv' : undefined}
                onClick={() => {
                  setRubrikWahl(r)
                  setFilterId(null)
                  setEtageFilter(null)
                  setTypFilter(null)
                }}
              >
                {t(RUBRIK_TITEL[r])}
              </button>
            ))}
          </div>
        )}

        {!verbindenQuelle &&
          switches.length === 0 &&
          schaechte.length === 0 &&
          verteilerEintraege.length === 0 && (
            <p className="dialog-hinweis">{t('verteilerdialoge.switchPort.nichtsAmTrunk')}</p>
          )}

        {verbindenQuelle && erreichbareGeraete.length === 0 && (
          <p className="dialog-hinweis">{t('verteilerdialoge.switchPort.keinGeraet')}</p>
        )}

        {!verbindenQuelle && rubrik === 'verteiler' && (
          <div className="switchport-liste">
            {verteilerEintraege.map((v) => (
              <div key={v.verteiler.id} className="switchport-karte">
                <h3>
                  {v.verteiler.verteiler
                    ? verteilerKennzeichenText(v.verteiler.verteiler.kennzeichen)
                    : t('verteilerdialoge.switchPort.rubrikVerteiler')}
                  <span className="switchport-blatt"> ({v.blattName})</span>
                </h3>
                {v.verteiler.verteiler && (
                  <VerteilerInhalt
                    zeichnung={zeichnung}
                    blattId={v.blattId}
                    verteiler={{ ...v.verteiler, verteiler: v.verteiler.verteiler }}
                    katalog={komponenten}
                    auswahl={
                      verteilerWahl?.objektId === v.verteiler.id ? verteilerWahl.anschluesse : []
                    }
                    onAuswahl={(anschluesse) =>
                      setVerteilerWahl({
                        blattId: v.blattId,
                        objektId: v.verteiler.id,
                        anschluesse,
                      })
                    }
                    bearbeitbar={false}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {!verbindenQuelle && rubrik === 'schacht' && (
          <div className="switchport-liste">
            {schaechte.map((schacht) => (
              <SchachtKarte
                key={schacht.schachtId}
                schacht={schacht}
                zeichnung={zeichnung}
                katalog={komponenten}
                mehrereBlaetter={schaechte.some((s) => s.blattId !== schaechte[0].blattId)}
                auswahl={schachtAuswahl}
                onWaehleStrang={(strang, neu, vorhandenerName) =>
                  setSchachtAuswahl({
                    schachtId: schacht.schachtId,
                    blattId: schacht.blattId,
                    strang,
                    neu,
                    vorhandenerName,
                    name: vorhandenerName,
                  })
                }
                onName={(name) => setSchachtAuswahl((alt) => alt && { ...alt, name })}
              />
            ))}
          </div>
        )}

        {!verbindenQuelle && rubrik !== 'schacht' && sichtbareEintraege.length > 1 && (
          <>
            {mehrereBlaetterEintraege && (
              <label className="switchport-filter">
                {t('verteilerdialoge.switchPort.etage')}
                <select
                  value={etageFilter ?? ''}
                  onChange={(e) => setEtageFilter(e.target.value || null)}
                >
                  <option value="">{t('verteilerdialoge.switchPort.alle')}</option>
                  {[...new Set(sichtbareEintraege.map((e) => e.blattName))]
                    .sort((a, b) => a.localeCompare(b, 'de'))
                    .map((blattName) => (
                      <option key={blattName} value={blattName}>
                        {blattName}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {geraeteTypNamen.length > 1 && (
              <label className="switchport-filter">
                {t('verteilerdialoge.switchPort.geraetetyp')}
                <select
                  value={typFilter ?? ''}
                  onChange={(e) => setTypFilter(e.target.value || null)}
                >
                  <option value="">{t('verteilerdialoge.switchPort.alle')}</option>
                  {geraeteTypNamen.map((typName) => (
                    <option key={typName} value={typName}>
                      {typName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="switchport-filter">
              {t('verteilerdialoge.switchPort.filter')}
              <select value={filterId ?? ''} onChange={(e) => setFilterId(e.target.value || null)}>
                <option value="">
                  {t('verteilerdialoge.switchPort.alleAnzeigen', { n: sichtbareEintraege.length })}
                </option>
                {[...sichtbareEintraege]
                  .sort((a, b) =>
                    ermittleAnzeigeName(a, komponenten).localeCompare(
                      ermittleAnzeigeName(b, komponenten),
                      'de',
                    ),
                  )
                  .map((eintrag) => (
                    <option key={eintrag.switchInstanz.id} value={eintrag.switchInstanz.id}>
                      {ermittleAnzeigeName(eintrag, komponenten)}
                      {mehrereBlaetterEintraege ? ` (${eintrag.blattName})` : ''}
                    </option>
                  ))}
              </select>
            </label>
          </>
        )}

        <div className="switchport-liste">
          {(verbindenQuelle ? erreichbareGeraete : eintraegeGefiltert).map((eintrag) => (
            <SwitchKarte
              key={eintrag.switchInstanz.id}
              eintrag={eintrag}
              belegung={ermittlePortBelegung(
                eintrag.switchInstanz,
                zuweisungen.get(eintrag.switchInstanz.id),
                komponenten,
              )}
              katalogName={ermittleKatalogEintrag(eintrag, komponenten)}
              mehrereBlaetter={
                verbindenQuelle
                  ? erreichbareGeraete.some((s) => s.blattId !== erreichbareGeraete[0].blattId)
                  : switches.some((s) => s.blattId !== switches[0].blattId)
              }
              auswaehlbar={verbindenQuelle ? true : zuweisenModus}
              auswahl={verbindenQuelle ? verbindenZiel : aktuelleAuswahl}
              eigeneZuweisung={verbindenQuelle ? null : (dialog.vorauswahl ?? null)}
              onWaehlePort={(portIndex) =>
                verbindenQuelle
                  ? setVerbindenZiel({
                      blattId: eintrag.blattId,
                      objektId: eintrag.switchInstanz.id,
                      portIndex,
                    })
                  : setAuswahl({
                      blattId: eintrag.blattId,
                      objektId: eintrag.switchInstanz.id,
                      portIndex,
                    })
              }
              onBeschriftung={(portIndex, text) => setzeBeschriftung(eintrag, portIndex, text)}
              zeichnung={zeichnung}
              katalog={komponenten}
              verwaltbar={!zuweisenModus && !verbindenQuelle}
              onVerbinden={(portIndex) =>
                setVerbindenQuelle({
                  blattId: eintrag.blattId,
                  objektId: eintrag.switchInstanz.id,
                  portIndex,
                })
              }
              onTrennen={trenneVerbindung}
            />
          ))}
        </div>

        <div className="dialog-aktionen">
          {verbindenQuelle ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setVerbindenQuelle(null)
                  setVerbindenZiel(null)
                }}
              >
                {t('verteilerdialoge.switchPort.zurueck')}
              </button>
              <button
                type="button"
                className="primaer"
                disabled={verbindenZiel === null}
                onClick={bestaetigeVerbindung}
              >
                {t('verteilerdialoge.switchPort.verbinden')}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => schliessenMit(null)}>
              {zuweisenModus
                ? t('verteilerdialoge.allgemein.abbrechen')
                : t('verteilerdialoge.allgemein.schliessen')}
            </button>
          )}
          {!verbindenQuelle && zuweisenModus && rubrik === 'schacht' && (
            <button
              type="button"
              className="primaer"
              disabled={schachtAuswahl === null}
              onClick={() =>
                schachtAuswahl &&
                schliessenMit({
                  art: 'schacht',
                  blattId: schachtAuswahl.blattId,
                  schachtId: schachtAuswahl.schachtId,
                  strang: schachtAuswahl.strang,
                  ...(schachtAuswahl.neu ||
                  schachtAuswahl.name.trim() !== schachtAuswahl.vorhandenerName
                    ? { name: schachtAuswahl.name }
                    : {}),
                })
              }
            >
              {t('verteilerdialoge.schachtAnschluss.anschliessen')}
            </button>
          )}
          {!verbindenQuelle && zuweisenModus && rubrik === 'verteiler' && (
            <button
              type="button"
              className="primaer"
              disabled={!verteilerWahl || verteilerWahl.anschluesse.length === 0}
              onClick={() => verteilerWahl && schliessenMit({ art: 'verteiler', ...verteilerWahl })}
            >
              {t('verteilerdialoge.verteiler.zuweisen')}
            </button>
          )}
          {zuweisenModus && rubrik !== 'schacht' && rubrik !== 'verteiler' && (
            <button
              type="button"
              className="primaer"
              disabled={aktuelleAuswahl === null}
              onClick={() => aktuelleAuswahl && schliessenMit({ art: 'port', ...aktuelleAuswahl })}
            >
              {t('verteilerdialoge.verteiler.zuweisen')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

type Rubrik = 'switch' | 'patchpanel' | 'verteiler' | 'schacht'

const RUBRIK_TITEL: Record<Rubrik, Schluessel> = {
  switch: 'verteilerdialoge.switchPort.rubrikSwitch',
  patchpanel: 'verteilerdialoge.switchPort.rubrikPatchpanel',
  verteiler: 'verteilerdialoge.switchPort.rubrikVerteiler',
  schacht: 'verteilerdialoge.switchPort.rubrikSchacht',
}

function ermittleAnzeigeName(eintrag: SwitchAmTrunk, katalog: readonly CatalogComponent[]): string {
  const katalogName = ermittleKatalogEintrag(eintrag, katalog)?.name ?? null
  return eintrag.switchInstanz.beschriftung?.trim() || katalogName || 'Switch'
}

function ermittleKatalogEintrag(
  eintrag: SwitchAmTrunk,
  katalog: readonly CatalogComponent[],
): { name: string; artikelnummer: string | null } | null {
  const komponente = katalog.find((k) => k.id === eintrag.switchInstanz.catalogComponentId)
  return komponente
    ? aufgeloesteVariante(komponente, eintrag.switchInstanz.variantId, oberflaechensprache())
    : null
}

interface SchachtStrangWahl {
  schachtId: string
  blattId: string
  strang: number
  neu: boolean
  vorhandenerName: string
  name: string
}

function SchachtKarte({
  schacht,
  zeichnung,
  katalog,
  mehrereBlaetter,
  auswahl,
  onWaehleStrang,
  onName,
}: {
  schacht: SchachtAnKette
  zeichnung: Zeichnung
  katalog: readonly CatalogComponent[]
  mehrereBlaetter: boolean
  auswahl: SchachtStrangWahl | null
  onWaehleStrang: (strang: number, neu: boolean, vorhandenerName: string) => void
  onName: (name: string) => void
}) {
  const t = useT()
  const straenge = ermittleSchachtStraenge(zeichnung, schacht.verbundId).filter(
    (strang) => strang.art === 'leitung',
  )
  const neueNummer = naechsteFreieStrangNummer(zeichnung, schacht.verbundId)
  const anzeigen = new Map(
    beschreibeSchachtStraenge(zeichnung, schacht.verbundId, katalog).map((a) => [a.nummer, a]),
  )
  const namen = strangNamenImVerbund(zeichnung, schacht.verbundId)
  const gewaehlt = auswahl?.schachtId === schacht.schachtId ? auswahl : null

  return (
    <div className="switchport-karte">
      <h3>
        {schacht.schachtName}
        {mehrereBlaetter && <span className="switchport-blatt"> ({schacht.blattName})</span>}
      </h3>
      <fieldset className="dialog-feld">
        <legend>{t('verteilerdialoge.inhalt.strang')}</legend>
        {straenge.map((strang) => {
          const pruefung = pruefeStrangAnschluss(strang, 'leitung', schacht.blattId, '')
          const anzeige = anzeigen.get(strang.nummer)
          const etagen = [...new Set(anzeige?.eintraege.map((e) => e.blattName) ?? [])].join(', ')
          return (
            <label key={strang.nummer} className="dialog-radio-zeile">
              <input
                type="radio"
                name={`strang-${schacht.schachtId}`}
                checked={
                  auswahl?.schachtId === schacht.schachtId && auswahl.strang === strang.nummer
                }
                disabled={!pruefung.erlaubt}
                onChange={() =>
                  onWaehleStrang(strang.nummer, false, namen[String(strang.nummer)] ?? '')
                }
              />
              {strangTitel(strang.nummer, anzeige?.name)} –{' '}
              {anzeige?.kurz ?? t('verteilerdialoge.switchPort.leitung')} ({etagen})
              {!pruefung.erlaubt && (
                <span className="dialog-hinweis">
                  {' '}
                  ({t('verteilerdialoge.switchPort.strangBelegt')})
                </span>
              )}
            </label>
          )
        })}
        <label className="dialog-radio-zeile">
          <input
            type="radio"
            name={`strang-${schacht.schachtId}`}
            checked={auswahl?.schachtId === schacht.schachtId && auswahl.strang === neueNummer}
            onChange={() => onWaehleStrang(neueNummer, true, '')}
          />
          {t('verteilerdialoge.schachtAnschluss.neuerStrang', { nummer: String(neueNummer) })}
        </label>
      </fieldset>
      {gewaehlt && (
        <label className="dialog-feld">
          <span>
            {t('verteilerdialoge.schachtAnschluss.strangName', {
              nummer: String(gewaehlt.strang),
            })}
          </span>
          <input
            value={gewaehlt.name}
            placeholder={t('verteilerdialoge.schachtAnschluss.strangNameBeispiel')}
            onChange={(e) => onName(e.target.value)}
          />
        </label>
      )}
    </div>
  )
}

const FRONT_BREITE = 100
const FRONT_HOEHE_JE_ZEILE = 11
const FRONT_HOEHE_RAND = 3

function SwitchKarte({
  eintrag,
  belegung,
  katalogName,
  mehrereBlaetter,
  auswaehlbar,
  auswahl,
  eigeneZuweisung,
  onWaehlePort,
  onBeschriftung,
  zeichnung,
  katalog,
  verwaltbar,
  onVerbinden,
  onTrennen,
}: {
  eintrag: SwitchAmTrunk
  belegung: PortBelegung[]
  katalogName: { name: string; artikelnummer: string | null } | null
  mehrereBlaetter: boolean
  auswaehlbar: boolean
  auswahl: SwitchPortZiel | null
  eigeneZuweisung: SwitchPortZiel | null
  onWaehlePort: (portIndex: number) => void
  onBeschriftung: (portIndex: number, text: string) => void
  zeichnung: Zeichnung
  katalog: readonly CatalogComponent[]
  verwaltbar: boolean
  onVerbinden: (portIndex: number) => void
  onTrennen: (zuweisung: PortZuweisung) => void
}) {
  const t = useT()
  const instanz = eintrag.switchInstanz
  const raster = instanz.dockpunkte?.modus === 'ports' ? portRasterLayout(instanz.dockpunkte) : null
  const belegt = (port: PortBelegung) =>
    port.belegtDurch !== null &&
    !(eigeneZuweisung?.objektId === instanz.id && eigeneZuweisung.portIndex === port.portIndex)
  const belegteAnzahl = belegung.filter(belegt).length
  const poeSumme = ermittlePoeSummeWatt(belegung)
  const anzeigeName = instanz.beschriftung?.trim() || katalogName?.name || 'Switch'

  const zeilenGesamt =
    (raster?.zeilenAnzahl ?? 1) + (raster && raster.trunkPunkte.length > 0 ? 1 : 0)
  const hoehe = FRONT_HOEHE_RAND * 2 + FRONT_HOEHE_JE_ZEILE * zeilenGesamt
  const abstandEinheiten = portAbstand(raster?.ports.map((p) => p.xAnteil) ?? []) * FRONT_BREITE
  const portBreite = Math.min(8, Math.max(1.6, abstandEinheiten * 0.72))
  const portHoehe = Math.min(portBreite * 1.1, hoehe * 0.16)
  const beschriftungLesbar = portBreite >= 4.5
  const [eingeklappt, setEingeklappt] = useState(true)

  return (
    <section className="switchport-karte">
      <header className="switchport-kopf">
        <button
          type="button"
          className="switchport-einklapp-button"
          aria-expanded={!eingeklappt}
          aria-label={
            eingeklappt
              ? t('verteilerdialoge.switchPort.listeEinblenden')
              : t('verteilerdialoge.switchPort.listeAusblenden')
          }
          onClick={() => setEingeklappt(!eingeklappt)}
        >
          {eingeklappt ? '▸' : '▾'}
        </button>
        <strong>{anzeigeName}</strong>
        {katalogName?.artikelnummer && <span> · {katalogName.artikelnummer}</span>}
        {mehrereBlaetter && (
          <span className="katalog-badge katalog-badge-standard">{eintrag.blattName}</span>
        )}
        <span className="switchport-kennzahlen">
          {t('verteilerdialoge.switchPort.kennzahlen', {
            belegt: belegteAnzahl,
            gesamt: belegung.length,
            watt: poeSumme,
          })}
        </span>
      </header>

      {raster && (
        <svg
          className="switchport-front"
          viewBox={`0 0 ${FRONT_BREITE} ${hoehe}`}
          role="img"
          aria-label={t('verteilerdialoge.switchPort.frontansicht', { name: anzeigeName })}
        >
          <rect
            x={0.6}
            y={0.6}
            width={FRONT_BREITE - 1.2}
            height={hoehe - 1.2}
            rx={2}
            className="switchport-gehaeuse"
          />
          {raster.ports.map((punkt) => {
            const port = belegung[punkt.index]
            if (!port) return null
            const istBelegt = belegt(port)
            const istGewaehlt =
              auswahl?.objektId === instanz.id && auswahl.portIndex === punkt.index
            const mitteY = hoehe - punkt.yAnteil * hoehe
            const x = punkt.xAnteil * FRONT_BREITE - portBreite / 2
            return (
              <g key={punkt.index}>
                <rect
                  x={x}
                  y={mitteY - portHoehe / 2}
                  width={portBreite}
                  height={portHoehe}
                  rx={0.6}
                  className={
                    istGewaehlt
                      ? 'switchport-port switchport-port-gewaehlt'
                      : istBelegt
                        ? 'switchport-port switchport-port-belegt'
                        : 'switchport-port switchport-port-frei'
                  }
                  onClick={() => auswaehlbar && !istBelegt && onWaehlePort(punkt.index)}
                  style={{ cursor: auswaehlbar && !istBelegt ? 'pointer' : 'default' }}
                >
                  <title>{portTooltip(t, port, istBelegt)}</title>
                </rect>
                {beschriftungLesbar && (
                  <text
                    x={punkt.xAnteil * FRONT_BREITE}
                    y={mitteY + portHoehe / 2 + 2.6}
                    className="switchport-portnummer"
                  >
                    {punkt.index + 1}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      )}

      {!eingeklappt && (
        <table className="switchport-tabelle">
          <thead>
            <tr>
              <th>{t('verteilerdialoge.switchPort.port')}</th>
              <th>{t('verteilerdialoge.knxAktor.beschriftung')}</th>
              <th>{t('verteilerdialoge.switchPort.ltg')}</th>
              <th>{t('verteilerdialoge.switchPort.geraet')}</th>
              <th className="switchport-spalte-watt">W</th>
              {verwaltbar && (
                <th className="switchport-spalte-aktion">
                  {t('verteilerdialoge.switchPort.aktion')}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {belegung.map((port) => (
              <tr
                key={port.portIndex}
                className={
                  auswahl?.objektId === instanz.id && auswahl.portIndex === port.portIndex
                    ? 'switchport-zeile-gewaehlt'
                    : undefined
                }
              >
                <td>{port.bezeichnung}</td>
                <td>
                  <PortBeschriftungFeld
                    key={port.beschriftung ?? ''}
                    wert={port.beschriftung ?? ''}
                    gesperrt={port.beschriftungVonGegenstelle}
                    onUebernehmen={(text) => onBeschriftung(port.portIndex, text)}
                  />
                </td>
                <td>{port.belegtDurch?.leitungsNummer ?? ''}</td>
                <td>
                  {port.gegenueber
                    ? t('verteilerdialoge.switchPort.intern', {
                        geraet:
                          switchBezeichnung(
                            zeichnung,
                            port.gegenueber,
                            katalog,
                            oberflaechensprache(),
                          ) ?? t('verteilerdialoge.switchPort.geraet'),
                        port: portBezeichnung(port.gegenueber.portIndex),
                      })
                    : ((port.gegenstelleKatalog &&
                        komponentenText(port.gegenstelleKatalog, 'name', oberflaechensprache())) ??
                      (port.belegtDurch
                        ? t('verteilerdialoge.switchPort.unbekannt')
                        : t('verteilerdialoge.switchPort.frei')))}
                </td>
                <td className="switchport-spalte-watt">
                  {port.belegtDurch
                    ? port.poeGepflegt
                      ? `${port.poeWatt}`
                      : t('verteilerdialoge.switchPort.nichtGepflegt')
                    : ''}
                </td>
                {verwaltbar && (
                  <td className="switchport-spalte-aktion">
                    {!port.belegtDurch && (
                      <button
                        type="button"
                        className="switchport-verbinden"
                        onClick={() => onVerbinden(port.portIndex)}
                      >
                        {t('verteilerdialoge.switchPort.verbindenKnopf')}
                      </button>
                    )}
                    {port.belegtDurch && port.gegenueber && (
                      <button
                        type="button"
                        className="switchport-trennen"
                        onClick={() => onTrennen(port.belegtDurch!)}
                      >
                        {t('verteilerdialoge.switchPort.trennen')}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function portAbstand(xAnteile: number[]): number {
  let kleinster = 1
  for (let i = 1; i < xAnteile.length; i++) {
    const d = Math.abs(xAnteile[i] - xAnteile[i - 1])
    if (d > 0) kleinster = Math.min(kleinster, d)
  }
  return xAnteile.length < 2 ? 0.5 : kleinster
}

function portTooltip(t: Uebersetzer, port: PortBelegung, istBelegt: boolean): string {
  if (!istBelegt) {
    return port.beschriftung
      ? t('verteilerdialoge.switchPort.tooltipFreiMit', {
          port: port.bezeichnung,
          beschriftung: port.beschriftung,
        })
      : t('verteilerdialoge.switchPort.tooltipFrei', { port: port.bezeichnung })
  }
  const teile = [port.bezeichnung]
  if (port.beschriftung) teile.push(port.beschriftung)
  if (port.belegtDurch)
    teile.push(
      t('verteilerdialoge.switchPort.tooltipLeitung', {
        nummer: String(port.belegtDurch.leitungsNummer),
      }),
    )
  if (port.gegenstelleKatalog)
    teile.push(komponentenText(port.gegenstelleKatalog, 'name', oberflaechensprache()))
  teile.push(
    port.poeGepflegt ? `${port.poeWatt} W` : t('verteilerdialoge.switchPort.poeNichtGepflegt'),
  )
  return teile.join(' · ')
}

function PortBeschriftungFeld({
  wert,
  gesperrt,
  onUebernehmen,
}: {
  wert: string
  gesperrt: boolean
  onUebernehmen: (text: string) => void
}) {
  const t = useT()
  const [entwurf, setEntwurf] = useState(wert)
  if (gesperrt) {
    return (
      <input
        className="switchport-beschriftung"
        value={wert}
        disabled
        title={t('verteilerdialoge.switchPort.beschriftungGesperrt')}
      />
    )
  }
  return (
    <input
      className="switchport-beschriftung"
      value={entwurf}
      placeholder="—"
      onChange={(e) => setEntwurf(e.target.value)}
      onBlur={() => entwurf !== wert && onUebernehmen(entwurf)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setEntwurf(wert)
      }}
    />
  )
}
