import { useCallback, useEffect, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import type {
  DokumentMeta,
  DokumentTyp,
  GeloeschtesProjekt,
  Projekt,
  ProjektStatus,
  Zeichnungsart,
} from '../../document-model'
import { PROJEKT_STATUS } from '../../document-model'
import type { Konfliktbehandlung, MusterArt, ProjektUebersicht } from '../../persistence'
import {
  holeAssetBlob,
  oeffneDateiExtern,
  ladeAssetHoch,
  ladeProjektPaketHoch,
  legeMusterprojektAn,
  legeMusterprojekteBeimErstenStartAn,
  MUSTER_ARTEN,
  ServerFehler,
  speichereDatei,
  pruefeProjektExport,
  starteServerDownload,
  waehleDatei,
  waehleProjektPaket,
} from '../../persistence'
import {
  IconAktualisieren,
  IconArchiv,
  IconDokExcel,
  IconExternOeffnen,
  IconDokNotiz,
  IconDokPdf,
  IconDokZeichnung,
  IconEinstellungen,
  IconExport,
  IconImport,
  IconLeereListe,
  IconPapierkorb,
  IconPlus,
  IconProjekte,
  IconSchliessen,
  IconStift,
  IconSuche,
  IconWiederherstellen,
} from '../components/Icons'
import { useT } from '../sprache-anbindung'
import { useAppContext } from '../use-app-context'
import { useUiStore } from '../store/ui-store'
import { alsPlansprache, alsZeichnungsart, neueZeichnungDialogOptionen } from '../neue-zeichnung'
import {
  formatiereBytes,
  formatiereDatumUhrzeit,
  formatiereDokumentzahl,
  formatiereZeitpunkt,
} from './projekte-format'
import { formatiereDatum } from '../../sprache'
import type { Schluessel, Sprache } from '../../sprache'

type Ansicht = 'projekte' | 'papierkorb'

const DOKUMENT_ICONS: Record<DokumentTyp, () => ReactElement> = {
  zeichnung: IconDokZeichnung,
  pdf: IconDokPdf,
  notiz: IconDokNotiz,
  excel: IconDokExcel,
}

const STATUS_TEXT: Record<ProjektStatus, Schluessel> = {
  angebot: 'verwaltungsdialoge.projekte.status.angebot',
  in_arbeit: 'verwaltungsdialoge.projekte.status.inArbeit',
  abgeschlossen: 'verwaltungsdialoge.projekte.status.abgeschlossen',
}

const DOKUMENT_TYP_TEXT: Record<DokumentTyp, Schluessel> = {
  zeichnung: 'verwaltungsdialoge.projekte.dokumentTyp.zeichnung',
  pdf: 'verwaltungsdialoge.projekte.dokumentTyp.pdf',
  notiz: 'verwaltungsdialoge.projekte.dokumentTyp.notiz',
  excel: 'verwaltungsdialoge.projekte.dokumentTyp.excel',
}

let musterBeimStartAngefragt = false

export function ProjekteDialog() {
  const offen = useUiStore((s) => s.projekteDialogOffen)
  if (!offen) return null
  return <ProjekteDialogInhalt />
}

function ProjekteDialogInhalt() {
  const t = useT()
  const { projektStore, dokumentStore, oeffneDokument, sitzung } = useAppContext()
  const zeigeToast = useUiStore((s) => s.zeigeToast)
  const offenesDokument = useUiStore((s) => s.offenesDokument)
  const produktlizenzStatus = useUiStore((s) => s.produktlizenzStatus)
  const schliessen = () => useUiStore.getState().setProjekteDialogOffen(false)
  const schliessbar = offenesDokument !== null
  const schliesseAufWunsch = () => {
    if (schliessbar) schliessen()
  }

  const [ansicht, setAnsicht] = useState<Ansicht>('projekte')
  const [projekte, setProjekte] = useState<ProjektUebersicht[]>([])
  const [papierkorb, setPapierkorb] = useState<GeloeschtesProjekt[]>([])
  const [suche, setSuche] = useState('')
  const [status, setStatus] = useState<ProjektStatus | ''>('')
  const [mitArchivierten, setMitArchivierten] = useState(false)
  const [gewaehltesProjekt, setGewaehltesProjekt] = useState<string | null>(
    offenesDokument?.projektId ?? null,
  )
  const [dokumente, setDokumente] = useState<DokumentMeta[]>([])
  const [kunden, setKunden] = useState<string[]>([])
  const [fehler, setFehler] = useState<string | null>(null)

  const [neuLaden, setNeuLaden] = useState(0)
  const aktualisiere = useCallback(() => setNeuLaden((n) => n + 1), [])

  const melde = useCallback(
    (f: unknown, ersatz: string) => setFehler(f instanceof Error ? f.message : ersatz),
    [],
  )

  useEffect(() => {
    let abgebrochen = false
    const laden =
      ansicht === 'projekte'
        ? projektStore.liste({
            suche: suche.trim() || undefined,
            status: status || undefined,
            archiviert: mitArchivierten ? 'alle' : false,
          })
        : projektStore.papierkorb()

    laden
      .then((eintraege) => {
        if (abgebrochen) return
        if (ansicht === 'projekte') setProjekte(eintraege as ProjektUebersicht[])
        else setPapierkorb(eintraege as GeloeschtesProjekt[])
        setFehler(null)
      })
      .catch((f: unknown) => {
        if (!abgebrochen) melde(f, t('verwaltungsdialoge.projekte.listeNichtGeladen'))
      })

    return () => {
      abgebrochen = true
    }
  }, [ansicht, projektStore, suche, status, mitArchivierten, neuLaden, melde, t])

  useEffect(() => {
    let abgebrochen = false
    const laden = gewaehltesProjekt ? dokumentStore.liste(gewaehltesProjekt) : Promise.resolve([])
    laden
      .then((liste) => {
        if (!abgebrochen) setDokumente(liste)
      })
      .catch(() => {
        if (!abgebrochen) setDokumente([])
      })
    return () => {
      abgebrochen = true
    }
  }, [gewaehltesProjekt, dokumentStore, neuLaden])

  useEffect(() => {
    if (ansicht !== 'projekte') return
    const intervall = setInterval(aktualisiere, 30_000)
    return () => clearInterval(intervall)
  }, [ansicht, aktualisiere])

  useEffect(() => {
    let abgebrochen = false
    projektStore
      .kunden()
      .then((liste) => {
        if (!abgebrochen) setKunden(liste)
      })
      .catch(() => {
        if (!abgebrochen) setKunden([])
      })
    return () => {
      abgebrochen = true
    }
  }, [projektStore, neuLaden])

  useEffect(() => {
    if (musterBeimStartAngefragt) return
    musterBeimStartAngefragt = true
    legeMusterprojekteBeimErstenStartAn()
      .then((angelegt) => {
        if (angelegt.length > 0) aktualisiere()
      })
      .catch(() => undefined)
  }, [aktualisiere])

  const [musterOffen, setMusterOffen] = useState(false)
  useEffect(() => {
    if (!musterOffen) return
    const schliesse = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') setMusterOffen(false)
        return
      }
      if (e.target instanceof Element && e.target.closest('.projekte-muster')) return
      setMusterOffen(false)
    }
    document.addEventListener('mousedown', schliesse)
    document.addEventListener('keydown', schliesse)
    return () => {
      document.removeEventListener('mousedown', schliesse)
      document.removeEventListener('keydown', schliesse)
    }
  }, [musterOffen])

  async function legeMusterAn(muster: MusterArt) {
    setMusterOffen(false)
    try {
      const ergebnis = await legeMusterprojektAn(muster)
      aktualisiere()
      setGewaehltesProjekt(ergebnis.projektId)
      zeigeToast(t('verwaltungsdialoge.projekte.musterAngelegt', { name: ergebnis.bezeichnung }))
    } catch (f) {
      melde(f, t('verwaltungsdialoge.projekte.musterFehlgeschlagen'))
    }
  }

  function frage(titel: string, label: string, anfangswert: string, dann: (wert: string) => void) {
    useUiStore.getState().oeffneEingabeDialog({ titel, label, anfangswert }, (wert) => {
      if (wert === null) return
      const getrimmt = wert.trim()
      if (getrimmt) dann(getrimmt)
    })
  }

  async function neuesProjekt(bezeichnung: string) {
    try {
      const projekt = await projektStore.lege({
        kunde: '',
        bezeichnung,
        projektnummer: null,
        notiz: null,
        status: 'in_arbeit',
        archiviert: false,
      })
      aktualisiere()
      setGewaehltesProjekt(projekt.id)
    } catch (f) {
      melde(f, t('verwaltungsdialoge.projekte.projektNichtAngelegt'))
    }
  }

  async function aenderePro(projekt: Projekt, aenderung: Partial<Projekt>) {
    try {
      await projektStore.aendere(projekt.id, {
        kunde: aenderung.kunde ?? projekt.kunde,
        bezeichnung: aenderung.bezeichnung ?? projekt.bezeichnung,
        projektnummer: aenderung.projektnummer ?? projekt.projektnummer,
        notiz: aenderung.notiz ?? projekt.notiz,
        status: aenderung.status ?? projekt.status,
        archiviert: aenderung.archiviert ?? projekt.archiviert,
      })
      aktualisiere()
    } catch (f) {
      melde(f, t('verwaltungsdialoge.projekte.aenderungFehlgeschlagen'))
    }
  }

  async function inPapierkorb(projekt: ProjektUebersicht) {
    try {
      await projektStore.loesche(projekt.id)
      if (gewaehltesProjekt === projekt.id) setGewaehltesProjekt(null)
      if (offenesDokument?.projektId === projekt.id) {
        sitzung.schliesse()
        useUiStore.getState().setOffenesDokument(null)
      }
      aktualisiere()
      zeigeToast(t('verwaltungsdialoge.projekte.imPapierkorb', { name: projekt.bezeichnung }))
    } catch (f) {
      melde(f, t('verwaltungsdialoge.projekte.loeschenFehlgeschlagen'))
    }
  }

  async function neuesDokument(
    projektId: string,
    name: string,
    art: Zeichnungsart,
    plansprache: Sprache,
  ) {
    try {
      const dokument = await dokumentStore.lege(projektId, { typ: 'zeichnung', name })
      await oeffneDokument(dokument.id, art, plansprache)
      schliessen()
    } catch (f) {
      melde(f, t('verwaltungsdialoge.projekte.zeichnungNichtAngelegt'))
    }
  }

  async function neueNotiz(projektId: string, name: string) {
    try {
      const dokument = await dokumentStore.lege(projektId, { typ: 'notiz', name })
      await oeffneDokument(dokument.id)
      schliessen()
    } catch (f) {
      melde(f, t('verwaltungsdialoge.projekte.notizNichtAngelegt'))
    }
  }

  async function neuePdfAnlage(projektId: string) {
    const datei = await waehleDatei('.pdf,application/pdf')
    if (!datei) return
    try {
      const assetId = await ladeAssetHoch(datei, datei.name)
      const name = datei.name.replace(/\.pdf$/i, '')
      const dokument = await dokumentStore.lege(projektId, { typ: 'pdf', name })
      await dokumentStore.speichereInhalt(dokument.id, {
        formatVersion: 1,
        version: 0,
        inhalt: null,
        assetId,
      })
      await oeffneDokument(dokument.id)
      schliessen()
    } catch (f) {
      melde(f, t('verwaltungsdialoge.projekte.pdfNichtAngelegt'))
    }
  }

  async function ladeExcelAnlageHerunter(dokument: DokumentMeta) {
    try {
      const geladen = await dokumentStore.hole(dokument.id)
      if (!geladen?.inhalt.assetId)
        throw new Error(t('verwaltungsdialoge.projekte.excelOhneInhalt'))
      const blob = await holeAssetBlob(geladen.inhalt.assetId)
      await speichereDatei(blob, dokument.name, {
        beschreibung: t('verwaltungsdialoge.projekte.excelArbeitsmappe'),
        erweiterungen: ['xlsx'],
      })
    } catch (f) {
      melde(f, t('verwaltungsdialoge.projekte.excelNichtHeruntergeladen'))
    }
  }

  async function oeffneAnlageExtern(dokument: DokumentMeta) {
    try {
      const geladen = await dokumentStore.hole(dokument.id)
      if (!geladen?.inhalt.assetId)
        throw new Error(t('verwaltungsdialoge.projekte.anlageOhneInhalt'))
      const blob = await holeAssetBlob(geladen.inhalt.assetId)
      const weg = await oeffneDateiExtern(
        blob,
        dokument.name,
        dokument.typ === 'pdf' ? 'pdf' : 'xlsx',
      )
      if (weg === 'heruntergeladen') {
        zeigeToast(
          t('verwaltungsdialoge.projekte.stattOeffnenHeruntergeladen', { name: dokument.name }),
        )
      }
    } catch (f) {
      melde(f, t('verwaltungsdialoge.projekte.anlageNichtGeoeffnet'))
    }
  }

  async function benenneDokumentUm(dokument: DokumentMeta, name: string) {
    try {
      await dokumentStore.aendere(dokument.id, { name })
      aktualisiere()
    } catch (f) {
      melde(f, t('verwaltungsdialoge.projekte.umbenennenFehlgeschlagen'))
    }
  }

  async function loescheDokument(dokument: DokumentMeta) {
    try {
      await dokumentStore.loesche(dokument.id)
      setDokumente((alte) => alte.filter((d) => d.id !== dokument.id))
      aktualisiere()
      if (offenesDokument?.dokumentId === dokument.id) {
        sitzung.schliesse()
        useUiStore.getState().setOffenesDokument(null)
      }
    } catch (f) {
      melde(f, t('verwaltungsdialoge.projekte.loeschenFehlgeschlagen'))
    }
  }

  async function importiereProjekt() {
    const datei = await waehleProjektPaket()
    if (!datei) return
    try {
      await fuehreImportAus(datei)
    } catch (f) {
      if (f instanceof ServerFehler && f.istKonflikt) {
        useUiStore.getState().oeffneBestaetigung({
          titel: t('verwaltungsdialoge.projekte.bereitsVorhanden'),
          nachricht: t('verwaltungsdialoge.projekte.ersetzenFrage', { meldung: f.message }),
          bestaetigenText: t('verwaltungsdialoge.projekte.ersetzen'),
          callback: (ersetzen) => {
            void fuehreImportAus(datei, ersetzen ? 'ersetzen' : 'kopie').catch(
              (weiterer: unknown) =>
                melde(weiterer, t('verwaltungsdialoge.projekte.importFehlgeschlagen')),
            )
          },
        })
        return
      }
      melde(f, t('verwaltungsdialoge.projekte.importFehlgeschlagen'))
    }
  }

  async function fuehreImportAus(datei: Blob, konflikt?: Konfliktbehandlung) {
    const ergebnis = await ladeProjektPaketHoch(datei, konflikt)
    aktualisiere()
    setGewaehltesProjekt(ergebnis.projektId)
    zeigeToast(
      t('verwaltungsdialoge.projekte.importiert', {
        name: ergebnis.bezeichnung,
        anzahl: formatiereDokumentzahl(ergebnis.dokumente),
        staende: t('verwaltungsdialoge.projekte.staende', { n: ergebnis.staende }),
      }),
    )
  }

  const gewaehlt = projekte.find((p) => p.id === gewaehltesProjekt) ?? null
  const nachKunde = gruppiereNachKunde(projekte)
  const gefiltert = suche.trim() !== '' || status !== ''

  return (
    <div className="dialog-overlay" onMouseDown={schliesseAufWunsch}>
      <div className="dialog projekte-dialog" onMouseDown={(e) => e.stopPropagation()}>
        <header className="projekte-kopf">
          <div className="projekte-kopf-titel">
            <h2>
              {ansicht === 'projekte'
                ? t('verwaltungsdialoge.projekte.titel')
                : t('verwaltungsdialoge.projekte.papierkorb')}
            </h2>
            <p className="projekte-kopf-unterzeile">
              {ansicht === 'papierkorb'
                ? t('verwaltungsdialoge.projekte.papierkorbHinweis')
                : schliessbar
                  ? t(
                      gefiltert
                        ? 'verwaltungsdialoge.projekte.sichtbarGefiltert'
                        : 'verwaltungsdialoge.projekte.sichtbar',
                      { n: projekte.length },
                    )
                  : t('verwaltungsdialoge.projekte.startHinweis')}
            </p>
            {produktlizenzStatus?.status === 'gueltig' && produktlizenzStatus.lizenznehmer && (
              <p className="projekte-kopf-unterzeile">
                {t('verwaltungsdialoge.projekte.lizenziertFuer', {
                  name: produktlizenzStatus.lizenznehmer,
                })}
              </p>
            )}
          </div>

          {ansicht === 'projekte' && (
            <div className="projekte-suche">
              <IconSuche />
              <input
                type="search"
                placeholder={t('verwaltungsdialoge.projekte.suchePlatzhalter')}
                value={suche}
                onChange={(e) => setSuche(e.target.value)}
              />
            </div>
          )}

          <div className="projekte-kopf-aktionen">
            <button
              type="button"
              className="knopf-icon"
              aria-label={t('verwaltungsdialoge.projekte.einstellungen')}
              title={t('verwaltungsdialoge.projekte.einstellungenTitel')}
              onClick={() => useUiStore.getState().setEinstellungenOffen(true)}
            >
              <IconEinstellungen />
            </button>
            <button
              type="button"
              className="knopf-flach"
              onClick={() => setAnsicht(ansicht === 'projekte' ? 'papierkorb' : 'projekte')}
            >
              {ansicht === 'projekte' ? (
                <>
                  <IconPapierkorb />
                  {t('verwaltungsdialoge.projekte.papierkorbOeffnen')}
                </>
              ) : (
                t('verwaltungsdialoge.projekte.zurueck')
              )}
            </button>
            {schliessbar && (
              <button
                type="button"
                className="knopf-icon"
                aria-label={t('verwaltungsdialoge.allgemein.schliessen')}
                title={t('verwaltungsdialoge.allgemein.schliessen')}
                onClick={schliesseAufWunsch}
              >
                <IconSchliessen />
              </button>
            )}
          </div>
        </header>

        {fehler && <p className="projekte-fehler">{fehler}</p>}

        {ansicht === 'papierkorb' ? (
          <PapierkorbListe
            eintraege={papierkorb}
            beiWiederherstellen={async (projekt) => {
              try {
                await projektStore.stelleWiederHer(projekt.id)
                aktualisiere()
                zeigeToast(
                  t('verwaltungsdialoge.projekte.wiederhergestellt', { name: projekt.bezeichnung }),
                )
              } catch (f) {
                melde(f, t('verwaltungsdialoge.projekte.wiederherstellungFehlgeschlagen'))
              }
            }}
            beiEndgueltig={(projekt) => {
              useUiStore.getState().oeffneBestaetigung({
                titel: t('verwaltungsdialoge.projekte.endgueltigLoeschen'),
                nachricht: t('verwaltungsdialoge.projekte.endgueltigFrage', {
                  name: projekt.bezeichnung,
                }),
                bestaetigenText: t('verwaltungsdialoge.projekte.endgueltigLoeschen'),
                callback: (bestaetigt) => {
                  if (!bestaetigt) return
                  void (async () => {
                    try {
                      const ergebnis = await projektStore.loescheEndgueltig(projekt.id)
                      aktualisiere()
                      zeigeToast(
                        t('verwaltungsdialoge.projekte.endgueltigGeloescht', {
                          anzahl: formatiereDokumentzahl(ergebnis.dokumente),
                          groesse: formatiereBytes(ergebnis.freigegeben),
                        }),
                      )
                    } catch (f) {
                      melde(f, t('verwaltungsdialoge.projekte.loeschenFehlgeschlagen'))
                    }
                  })()
                },
              })
            }}
          />
        ) : (
          <div className="projekte-inhalt">
            <aside className="projekte-spalte">
              <div className="projekte-filter">
                <div
                  className="projekte-chips"
                  role="group"
                  aria-label={t('verwaltungsdialoge.projekte.statusfilter')}
                >
                  <StatusChip aktiv={status === ''} beiKlick={() => setStatus('')}>
                    {t('verwaltungsdialoge.projekte.alle')}
                  </StatusChip>
                  {PROJEKT_STATUS.map((s) => (
                    <StatusChip
                      key={s}
                      aktiv={status === s}
                      beiKlick={() => setStatus(s)}
                      status={s}
                    >
                      {t(STATUS_TEXT[s])}
                    </StatusChip>
                  ))}
                </div>
                <label className="projekte-schalter">
                  <input
                    type="checkbox"
                    checked={mitArchivierten}
                    onChange={(e) => setMitArchivierten(e.target.checked)}
                  />
                  {t('verwaltungsdialoge.projekte.archivierteZeigen')}
                </label>
              </div>

              <div className="projekte-liste">
                {projekte.length === 0 && (
                  <div className="projekte-liste-leer">
                    <IconLeereListe />
                    <p className="projekte-leer">
                      {gefiltert
                        ? t('verwaltungsdialoge.projekte.keinTreffer')
                        : t('verwaltungsdialoge.projekte.nochKeinProjekt')}
                    </p>
                  </div>
                )}
                {nachKunde.map(([kunde, eintraege]) => (
                  <div key={kunde} className="projekte-gruppe">
                    <div className="projekte-gruppe-titel">
                      <span className="projekte-gruppe-name">
                        {kunde || t('verwaltungsdialoge.projekte.ohneKunde')}
                      </span>
                      <span className="projekte-gruppe-zahl">{eintraege.length}</span>
                    </div>
                    {eintraege.map((projekt) => (
                      <button
                        key={projekt.id}
                        type="button"
                        className={`projekte-eintrag${projekt.id === gewaehltesProjekt ? ' aktiv' : ''}${projekt.archiviert ? ' archiviert' : ''}`}
                        onClick={() => setGewaehltesProjekt(projekt.id)}
                      >
                        <span className="projekte-eintrag-zeile">
                          <span className={`status-punkt status-${projekt.status}`} aria-hidden />
                          <span className="projekte-eintrag-name">{projekt.bezeichnung}</span>
                          <span className="projekte-eintrag-zahl">{projekt.anzahlDokumente}</span>
                        </span>
                        <span className="projekte-eintrag-info">
                          {projekt.projektnummer && (
                            <span className="projekte-eintrag-nummer">{projekt.projektnummer}</span>
                          )}
                          <span>{t(STATUS_TEXT[projekt.status])}</span>
                          {projekt.archiviert && (
                            <span>{t('verwaltungsdialoge.projekte.archiviertKlein')}</span>
                          )}
                          <span>{formatiereZeitpunkt(projekt.zuletztGeaendertAm)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <div className="projekte-spalte-fuss">
                <button
                  type="button"
                  className="knopf-primaer"
                  onClick={() =>
                    frage(
                      t('verwaltungsdialoge.projekte.neuesProjekt'),
                      t('verwaltungsdialoge.projekte.bezeichnung'),
                      t('verwaltungsdialoge.projekte.neuesProjekt'),
                      (wert) => void neuesProjekt(wert),
                    )
                  }
                >
                  <IconPlus />
                  {t('verwaltungsdialoge.projekte.neuesProjektKnopf')}
                </button>
                <button
                  type="button"
                  className="knopf-flach"
                  onClick={() => void importiereProjekt()}
                >
                  <IconImport />
                  {t('verwaltungsdialoge.projekte.importieren')}
                </button>
                <div className="projekte-muster">
                  <button
                    type="button"
                    className="knopf-flach"
                    aria-haspopup="menu"
                    aria-expanded={musterOffen}
                    onClick={() => setMusterOffen((offen) => !offen)}
                  >
                    <IconProjekte />
                    {t('verwaltungsdialoge.projekte.muster')}
                  </button>
                  {musterOffen && (
                    <div className="projekte-muster-liste" role="menu">
                      {MUSTER_ARTEN.map((muster) => (
                        <button
                          key={muster}
                          type="button"
                          role="menuitem"
                          onClick={() => void legeMusterAn(muster)}
                        >
                          <IconDokZeichnung />
                          {t(`verwaltungsdialoge.projekte.musterArt.${muster}`)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <section className="projekte-detail">
              {!gewaehlt && (
                <div className="projekte-detail-leer">
                  <IconLeereListe />
                  <p className="projekte-leer">{t('verwaltungsdialoge.projekte.projektWaehlen')}</p>
                </div>
              )}
              {gewaehlt && (
                <ProjektDetail
                  projekt={gewaehlt}
                  dokumente={dokumente}
                  kunden={kunden}
                  offenesDokumentId={offenesDokument?.dokumentId ?? null}
                  beiAktualisieren={aktualisiere}
                  beiAendern={(aenderung) => void aenderePro(gewaehlt, aenderung)}
                  beiFrage={frage}
                  beiOeffnen={(id) => {
                    void oeffneDokument(id)
                    schliessen()
                  }}
                  beiExcelHerunterladen={(dokument) => void ladeExcelAnlageHerunter(dokument)}
                  beiExternOeffnen={(dokument) => void oeffneAnlageExtern(dokument)}
                  beiNeuemDokument={(name, art, plansprache) =>
                    void neuesDokument(gewaehlt.id, name, art, plansprache)
                  }
                  beiNeuerNotiz={(name) => void neueNotiz(gewaehlt.id, name)}
                  beiNeuerPdfAnlage={() => void neuePdfAnlage(gewaehlt.id)}
                  beiVerteilerplanAssistent={() =>
                    useUiStore.getState().setVerteilerplanErzeugen({
                      art: 'projekt',
                      projektId: gewaehlt.id,
                      nachErzeugen: aktualisiere,
                    })
                  }
                  beiDokumentUmbenennen={(dokument, name) => void benenneDokumentUm(dokument, name)}
                  beiDokumentLoeschen={(dokument) => void loescheDokument(dokument)}
                  beiPapierkorb={() => void inPapierkorb(gewaehlt)}
                />
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusChip({
  aktiv,
  status,
  beiKlick,
  children,
}: {
  aktiv: boolean
  status?: ProjektStatus
  beiKlick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={`projekte-chip${aktiv ? ' aktiv' : ''}`}
      aria-pressed={aktiv}
      onClick={beiKlick}
    >
      {status && <span className={`status-punkt status-${status}`} aria-hidden />}
      {children}
    </button>
  )
}

function ProjektDetail({
  projekt,
  dokumente,
  kunden,
  offenesDokumentId,
  beiAktualisieren,
  beiAendern,
  beiFrage,
  beiOeffnen,
  beiExcelHerunterladen,
  beiExternOeffnen,
  beiNeuemDokument,
  beiNeuerNotiz,
  beiNeuerPdfAnlage,
  beiVerteilerplanAssistent,
  beiDokumentUmbenennen,
  beiDokumentLoeschen,
  beiPapierkorb,
}: {
  projekt: ProjektUebersicht
  dokumente: DokumentMeta[]
  kunden: string[]
  offenesDokumentId: string | null
  beiAktualisieren: () => void
  beiAendern: (aenderung: Partial<Projekt>) => void
  beiFrage: (titel: string, label: string, anfangswert: string, dann: (w: string) => void) => void
  beiOeffnen: (dokumentId: string) => void
  beiExcelHerunterladen: (dokument: DokumentMeta) => void
  beiExternOeffnen: (dokument: DokumentMeta) => void
  beiNeuemDokument: (name: string, art: Zeichnungsart, plansprache: Sprache) => void
  beiNeuerNotiz: (name: string) => void
  beiNeuerPdfAnlage: () => void
  beiVerteilerplanAssistent: () => void
  beiDokumentUmbenennen: (dokument: DokumentMeta, name: string) => void
  beiDokumentLoeschen: (dokument: DokumentMeta) => void
  beiPapierkorb: () => void
}) {
  const t = useT()
  return (
    <>
      <header className="projekt-kopf">
        <div className="projekt-kopf-text">
          <h3>{projekt.bezeichnung}</h3>
          <p className="projekt-kopf-meta">
            <span>{projekt.kunde || t('verwaltungsdialoge.projekte.ohneKunde')}</span>
            {projekt.projektnummer && (
              <span className="projekt-kopf-nummer">{projekt.projektnummer}</span>
            )}
            <span>{formatiereDokumentzahl(projekt.anzahlDokumente)}</span>
            <span>
              {t('verwaltungsdialoge.projekte.geaendert', {
                zeitpunkt: formatiereZeitpunkt(projekt.zuletztGeaendertAm),
              })}
            </span>
          </p>
        </div>
        <div className="projekt-kopf-marken">
          {projekt.archiviert && (
            <span className="projekt-marke archiv">
              {t('verwaltungsdialoge.projekte.archiviert')}
            </span>
          )}
          <span className={`projekt-marke status-${projekt.status}`}>
            <span className={`status-punkt status-${projekt.status}`} aria-hidden />
            {t(STATUS_TEXT[projekt.status])}
          </span>
        </div>
      </header>

      <div className="projekt-felder">
        <label className="dialog-feld">
          {t('verwaltungsdialoge.projekte.kunde')}
          <input
            defaultValue={projekt.kunde}
            key={`kunde-${projekt.id}`}
            list="projekte-kundenliste"
            onBlur={(e) => {
              if (e.target.value !== projekt.kunde) beiAendern({ kunde: e.target.value })
            }}
          />
          <datalist id="projekte-kundenliste">
            {kunden.map((kunde) => (
              <option key={kunde} value={kunde} />
            ))}
          </datalist>
        </label>
        <label className="dialog-feld">
          {t('verwaltungsdialoge.projekte.projektnummer')}
          <input
            defaultValue={projekt.projektnummer ?? ''}
            key={`nummer-${projekt.id}`}
            onBlur={(e) => {
              const wert = e.target.value.trim() || null
              if (wert !== projekt.projektnummer) beiAendern({ projektnummer: wert })
            }}
          />
        </label>
        <label className="dialog-feld">
          {t('verwaltungsdialoge.projekte.statusFeld')}
          <select
            value={projekt.status}
            onChange={(e) => beiAendern({ status: e.target.value as ProjektStatus })}
          >
            {PROJEKT_STATUS.map((s) => (
              <option key={s} value={s}>
                {t(STATUS_TEXT[s])}
              </option>
            ))}
          </select>
        </label>
        <label className="dialog-feld projekt-feld-breit">
          {t('verwaltungsdialoge.projekte.notiz')}
          <textarea
            defaultValue={projekt.notiz ?? ''}
            key={`notiz-${projekt.id}`}
            rows={2}
            placeholder={t('verwaltungsdialoge.projekte.notizPlatzhalter')}
            onBlur={(e) => {
              const wert = e.target.value.trim() || null
              if (wert !== projekt.notiz) beiAendern({ notiz: wert })
            }}
          />
        </label>
      </div>

      <div className="projekt-abschnitt-kopf">
        <h4>{t('verwaltungsdialoge.projekte.dokumente')}</h4>
        <span className="projekt-abschnitt-zahl">{dokumente.length}</span>
        <button
          type="button"
          className="knopf-icon"
          aria-label={t('verwaltungsdialoge.projekte.listeAktualisieren')}
          title={t('verwaltungsdialoge.projekte.listeAktualisieren')}
          onClick={beiAktualisieren}
        >
          <IconAktualisieren />
        </button>
      </div>

      <ul className="dokument-liste">
        {dokumente.length === 0 && (
          <li className="dokument-leer">
            <span className="projekte-leer">{t('verwaltungsdialoge.projekte.keineDokumente')}</span>
          </li>
        )}
        {dokumente.map((dokument) => {
          const DokIcon = DOKUMENT_ICONS[dokument.typ]
          return (
            <li
              key={dokument.id}
              className={`dokument-zeile${dokument.id === offenesDokumentId ? ' aktiv' : ''}`}
            >
              <span className={`dokument-symbol typ-${dokument.typ}`} aria-hidden>
                <DokIcon />
              </span>
              <button
                type="button"
                className="dokument-name"
                title={
                  dokument.typ === 'excel'
                    ? t('verwaltungsdialoge.projekte.herunterladen')
                    : t('verwaltungsdialoge.projekte.oeffnen')
                }
                onClick={() =>
                  dokument.typ === 'excel'
                    ? beiExcelHerunterladen(dokument)
                    : beiOeffnen(dokument.id)
                }
              >
                {dokument.name}
              </button>
              <span className="dokument-meta">
                <span>
                  {dokument.zeichnungsart === 'schaltplan'
                    ? t('verwaltungsdialoge.projekte.zeichnungSchaltplan')
                    : t(DOKUMENT_TYP_TEXT[dokument.typ])}
                </span>
                <span title={t('verwaltungsdialoge.projekte.zuletztGeaendert')}>
                  {formatiereDatumUhrzeit(dokument.zuletztGeaendertAm)}
                </span>
              </span>
              <span className="dokument-aktionen">
                {(dokument.typ === 'excel' || dokument.typ === 'pdf') && (
                  <button
                    type="button"
                    className="knopf-icon"
                    aria-label={t('verwaltungsdialoge.projekte.externOeffnen')}
                    title={
                      dokument.typ === 'excel'
                        ? t('verwaltungsdialoge.projekte.inExcelOeffnen')
                        : t('verwaltungsdialoge.projekte.imPdfProgrammOeffnen')
                    }
                    onClick={() => beiExternOeffnen(dokument)}
                  >
                    <IconExternOeffnen />
                  </button>
                )}
                <button
                  type="button"
                  className="knopf-icon"
                  aria-label={t('verwaltungsdialoge.projekte.umbenennen')}
                  title={t('verwaltungsdialoge.projekte.umbenennen')}
                  onClick={() =>
                    beiFrage(
                      t('verwaltungsdialoge.projekte.dokumentUmbenennen'),
                      t('verwaltungsdialoge.projekte.name'),
                      dokument.name,
                      (wert) => beiDokumentUmbenennen(dokument, wert),
                    )
                  }
                >
                  <IconStift />
                </button>
                <button
                  type="button"
                  className="knopf-icon gefahr"
                  aria-label={t('verwaltungsdialoge.projekte.loeschen')}
                  title={t('verwaltungsdialoge.projekte.loeschen')}
                  onClick={() => beiDokumentLoeschen(dokument)}
                >
                  <IconPapierkorb />
                </button>
              </span>
            </li>
          )
        })}
      </ul>

      <div className="dokument-neu">
        <button
          type="button"
          className="knopf-neu"
          onClick={() =>
            useUiStore.getState().oeffneEingabeDialog(
              neueZeichnungDialogOptionen(
                t('verwaltungsdialoge.projekte.zeichnungNummer', {
                  nr: String(dokumente.length + 1),
                }),
              ),
              (wert, auswahl, plansprache) => {
                const name = wert?.trim()
                if (name)
                  beiNeuemDokument(name, alsZeichnungsart(auswahl), alsPlansprache(plansprache))
              },
            )
          }
        >
          <IconDokZeichnung />
          {t('verwaltungsdialoge.projekte.neueZeichnung')}
        </button>
        <button type="button" className="knopf-neu" onClick={beiVerteilerplanAssistent}>
          <IconDokZeichnung />
          {t('verwaltungsdialoge.projekte.verteilerplanAssistent')}
        </button>
        <button
          type="button"
          className="knopf-neu"
          onClick={() =>
            beiFrage(
              t('verwaltungsdialoge.projekte.neueNotizTitel'),
              t('verwaltungsdialoge.projekte.name'),
              t('verwaltungsdialoge.projekte.notizName'),
              beiNeuerNotiz,
            )
          }
        >
          <IconDokNotiz />
          {t('verwaltungsdialoge.projekte.neueNotiz')}
        </button>
        <button type="button" className="knopf-neu" onClick={beiNeuerPdfAnlage}>
          <IconDokPdf />
          {t('verwaltungsdialoge.projekte.pdfAnhaengen')}
        </button>
      </div>

      <footer className="projekt-fuss">
        <button
          type="button"
          className="knopf-flach"
          onClick={() =>
            beiFrage(
              t('verwaltungsdialoge.projekte.projektUmbenennen'),
              t('verwaltungsdialoge.projekte.bezeichnung'),
              projekt.bezeichnung,
              (wert) => beiAendern({ bezeichnung: wert }),
            )
          }
        >
          <IconStift />
          {t('verwaltungsdialoge.projekte.umbenennenKnopf')}
        </button>
        <button
          type="button"
          className="knopf-flach"
          onClick={() => beiAendern({ archiviert: !projekt.archiviert })}
        >
          <IconArchiv />
          {projekt.archiviert
            ? t('verwaltungsdialoge.projekte.ausArchiv')
            : t('verwaltungsdialoge.projekte.archivieren')}
        </button>
        <button
          type="button"
          className="knopf-flach"
          onClick={() =>
            void pruefeProjektExport(projekt.id)
              .then((pruefung) => {
                if (!pruefung.erlaubt) {
                  useUiStore
                    .getState()
                    .zeigeToast(pruefung.meldung ?? t('verwaltungsdialoge.projekte.zuGross'))
                  return
                }
                return starteServerDownload(`/export/projekt/${projekt.id}`)
              })
              .catch((fehler) =>
                useUiStore
                  .getState()
                  .zeigeToast(
                    fehler instanceof Error
                      ? fehler.message
                      : t('verwaltungsdialoge.projekte.exportFehlgeschlagen'),
                  ),
              )
          }
        >
          <IconExport />
          {t('verwaltungsdialoge.projekte.exportieren')}
        </button>
        <button type="button" className="knopf-flach gefahr" onClick={beiPapierkorb}>
          <IconPapierkorb />
          {t('verwaltungsdialoge.projekte.inPapierkorb')}
        </button>
      </footer>
    </>
  )
}

function PapierkorbListe({
  eintraege,
  beiWiederherstellen,
  beiEndgueltig,
}: {
  eintraege: GeloeschtesProjekt[]
  beiWiederherstellen: (projekt: GeloeschtesProjekt) => Promise<void>
  beiEndgueltig: (projekt: GeloeschtesProjekt) => void
}) {
  const t = useT()
  return (
    <ul className="projekte-dokumente papierkorb-liste">
      {eintraege.length === 0 && (
        <li className="papierkorb-leer">
          <IconLeereListe />
          <span className="projekte-leer">{t('verwaltungsdialoge.projekte.papierkorbLeer')}</span>
        </li>
      )}
      {eintraege.map((projekt) => (
        <li key={projekt.id} className="dokument-zeile">
          <span className="dokument-symbol typ-geloescht" aria-hidden>
            <IconPapierkorb />
          </span>
          <span className="projekte-dokument-name">
            {[projekt.kunde, projekt.bezeichnung].filter(Boolean).join(' · ')}
          </span>
          <span className="dokument-meta">
            <span>
              {t('verwaltungsdialoge.projekte.geloeschtAm', {
                datum: formatiereDatum(projekt.geloeschtAm),
              })}
            </span>
          </span>
          <span className="dokument-aktionen immer">
            <button
              type="button"
              className="knopf-flach"
              onClick={() => void beiWiederherstellen(projekt)}
            >
              <IconWiederherstellen />
              {t('verwaltungsdialoge.projekte.wiederherstellen')}
            </button>
            <button
              type="button"
              className="knopf-flach gefahr"
              onClick={() => beiEndgueltig(projekt)}
            >
              {t('verwaltungsdialoge.projekte.endgueltigLoeschen')}
            </button>
          </span>
        </li>
      ))}
    </ul>
  )
}

function gruppiereNachKunde(projekte: ProjektUebersicht[]): [string, ProjektUebersicht[]][] {
  const gruppen = new Map<string, ProjektUebersicht[]>()
  for (const projekt of projekte) {
    const vorhanden = gruppen.get(projekt.kunde)
    if (vorhanden) vorhanden.push(projekt)
    else gruppen.set(projekt.kunde, [projekt])
  }
  return [...gruppen.entries()].sort(([a], [b]) => {
    if (a === '') return 1
    if (b === '') return -1
    return a.localeCompare(b, 'de')
  })
}
