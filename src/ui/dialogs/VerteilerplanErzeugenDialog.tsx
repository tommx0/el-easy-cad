import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  Blatt,
  BestueckungsEintrag,
  CatalogComponent,
  KomponentenObjekt,
  Schnellvorgabe,
  VerteilerNetz,
  VerteilerAngaben,
  VerteilerArt,
} from '../../document-model'
import {
  artVon,
  alleVerteiler,
  assistentVerteiler,
  baueVerteilerBaum,
  einzelklemmen,
  einzelklemmenInLeiste,
  ETAGEN_VORSCHLAEGE,
  erzeugeVerteilerplan,
  istVerteiler,
  normiereVerteilerKennzeichen,
  planeKnxZuordnung,
  raeumeZurAuswahl,
  netzDerVorgabe,
  STANDARD_SCHNELLVORGABE,
  startBestueckung,
  VERTEILER_ARTEN,
  verteilerKennzeichenText,
  verteilerKennzeichenVorschlag,
  verteilerplanNameVorschlag,
  verwendungVorschlaege,
  zeichenflaecheBoundingBox,
} from '../../document-model'
import type { GeleseneZeichnung } from '../../persistence'
import type { KomponentenRenderKontext } from '../../rendering'
import { zeichneAnordnenVorschau } from '../../rendering'
import type { Sprache, Uebersetzer } from '../../sprache'
import { erzeugeBestueckungCommand } from '../../tools'
import { useKatalogStore } from '../store/katalog-store'
import { useSettingsStore } from '../store/settings-store'
import type { VerteilerplanAssistentZiel } from '../store/ui-store'
import { useUiStore } from '../store/ui-store'
import { useAppContext, useProject } from '../use-app-context'
import { PruefHinweis } from '../components/PruefHinweis'
import { useT } from '../sprache-anbindung'
import { BaumBearbeiten, type BestueckungsQuelle } from './VerteilerDialog'
import { ArtWahl, RaumVorschlagFelder } from './RaeumeVorschlagenDialog'
import {
  raumVorschlagStart,
  rechneRaumVorschlag,
  type RaumVorschlagZustand,
} from './raeume-vorschlag'
import { planspracheVon, planUebersetzer } from '../../document-model'
import { oberflaechensprache } from '../../sprache'

const BILD_BREITE = 240
const BILD_HOEHE = 151

export function VerteilerplanErzeugenDialog() {
  const ziel = useUiStore((s) => s.verteilerplanErzeugen)
  if (!ziel) return null
  return <Assistent ziel={ziel} />
}

type Schritt = 'quelle' | 'vorgabe' | 'raeume' | 'baum' | 'name'

type QuellenArt = 'bauplan' | 'raeume' | 'neu'

interface BauplanVerteiler {
  dokumentId: string | null
  dokumentName: string
  blattId: string
  verteiler: KomponentenObjekt & { verteiler: NonNullable<KomponentenObjekt['verteiler']> }
}

function verteilerAus(gelesen: readonly GeleseneZeichnung[]): BauplanVerteiler[] {
  return gelesen.flatMap(({ dokument, zeichnung }) =>
    alleVerteiler(zeichnung).flatMap(({ blattId, verteiler }) =>
      istVerteiler(verteiler)
        ? [{ dokumentId: dokument.id, dokumentName: dokument.name, blattId, verteiler }]
        : [],
    ),
  )
}

function Assistent({ ziel }: { ziel: VerteilerplanAssistentZiel }) {
  const t = useT()
  const { sitzung, settingsStore, oeffneDokument, verknuepfung, doc, commands } = useAppContext()
  const zeichnung = useProject()
  const katalog = useKatalogStore((s) => s.komponenten)
  const einstellungen = useSettingsStore((s) => s.verteilerplanEinstellungen)
  const setEinstellungen = useSettingsStore((s) => s.setVerteilerplanEinstellungen)
  const offen = sitzung.getOffenesDokument()
  const projektId = (ziel.art === 'projekt' ? ziel.projektId : undefined) ?? offen?.projektId

  const ausDialog: BauplanVerteiler | null = useMemo(() => {
    if (ziel.art !== 'verteiler') return null
    const blatt = zeichnung.blaetter.find((b) => b.id === ziel.blattId)
    const v = blatt?.objekte.find((o) => o.id === ziel.objektId)
    return v && istVerteiler(v)
      ? { dokumentId: null, dokumentName: offen?.name ?? '', blattId: ziel.blattId, verteiler: v }
      : null
  }, [ziel, zeichnung, offen])
  const gemerkt =
    ziel.art === 'projekt' &&
    ziel.projektId === undefined &&
    zeichnung.zeichnungsart === 'schaltplan'
      ? (zeichnung.verteilerAssistent ?? null)
      : null

  const [schritt, setSchritt] = useState<Schritt>(
    ziel.art === 'verteiler' ? 'name' : gemerkt ? 'baum' : 'quelle',
  )
  const [quellenArt, setQuellenArt] = useState<QuellenArt>(
    gemerkt ? (gemerkt.raeume ? 'raeume' : 'neu') : 'bauplan',
  )
  const neu = quellenArt !== 'bauplan'
  const [gelesen, setGelesen] = useState<{
    verteiler: BauplanVerteiler[]
    bauplaene: GeleseneZeichnung[]
    planKennzeichen: string[]
  } | null>(null)
  const [raumBauplanId, setRaumBauplanId] = useState<string | null>(
    gemerkt?.raeume?.dokumentId ?? null,
  )
  const [raumZustand, setRaumZustand] = useState<RaumVorschlagZustand | null>(null)
  const [gewaehlt, setGewaehlt] = useState<number>(0)
  const [vorgabe, setVorgabe] = useState<Schnellvorgabe>(() => ({
    ...STANDARD_SCHNELLVORGABE,
    drehstrom: gemerkt?.netz !== 'wechselstrom',
    art: gemerkt?.angaben.art ?? 'UV',
  }))
  const [aufgebautMit, setAufgebautMit] = useState<Schnellvorgabe | null>(() =>
    gemerkt ? { ...vorgabe } : null,
  )
  const [bestueckung, setBestueckung] = useState<BestueckungsEintrag[]>(
    () => gemerkt?.bestueckung.map((e) => ({ ...e })) ?? [],
  )
  const bestueckungRef = useRef(bestueckung)
  const [angabenEingabe, setAngabenEingabe] = useState<VerteilerAngaben>(
    gemerkt?.angaben ?? { art: 'UV' },
  )
  const [artEingabe, setArtEingabe] = useState<VerteilerArt | null>(null)
  const [kennzeichenEingabe, setKennzeichenEingabe] = useState<string | null>(null)
  const [nameEingabe, setNameEingabe] = useState<string | null>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [fehlend, setFehlend] = useState<string[]>([])
  const leiste = useUiStore((s) => s.klemmenLeiste)
  const [ueberfuehren, setUeberfuehren] = useState(true)

  useEffect(() => {
    if (!projektId) return
    let abgebrochen = false
    sitzung
      .verteilerQuellen(projektId)
      .then(({ bauplaene, planKennzeichen }) => {
        if (abgebrochen) return
        const verteiler = verteilerAus(bauplaene)
        setGelesen({ verteiler, bauplaene, planKennzeichen })
        if (verteiler.length === 0) setQuellenArt((a) => (a === 'bauplan' ? 'neu' : a))
      })
      .catch(() => {
        if (!abgebrochen) setGelesen({ verteiler: [], bauplaene: [], planKennzeichen: [] })
      })
    return () => {
      abgebrochen = true
    }
  }, [projektId, sitzung])

  const bauplanVerteiler: BauplanVerteiler | null =
    ausDialog ?? (!neu ? (gelesen?.verteiler[gewaehlt] ?? null) : null)
  const art: VerteilerArt =
    artEingabe ??
    (bauplanVerteiler ? artVon(bauplanVerteiler.verteiler.verteiler) : angabenEingabe.art)
  const angaben = useMemo(() => ({ ...angabenEingabe, art }), [angabenEingabe, art])
  const vorgabeMitArt = useMemo(() => ({ ...vorgabe, art }), [vorgabe, art])
  function setAngaben(a: VerteilerAngaben) {
    setAngabenEingabe(a)
    if (a.art !== art) setArtEingabe(a.art)
  }
  function setzeArt(a: VerteilerArt) {
    if (a !== art) setArtEingabe(a)
  }
  const festesKennzeichen =
    bauplanVerteiler?.verteiler.verteiler.kennzeichen ??
    (gemerkt ? (zeichnung.verteilerKennzeichen ?? null) : null)
  const vergeben = useMemo(
    () => [
      ...(gelesen?.planKennzeichen ?? []),
      ...(gelesen?.verteiler.map((v) => v.verteiler.verteiler.kennzeichen) ?? []),
    ],
    [gelesen],
  )
  const kennzeichen =
    festesKennzeichen ??
    normiereVerteilerKennzeichen(
      kennzeichenEingabe ?? verteilerKennzeichenVorschlag(angaben, vergeben),
    )
  const name = nameEingabe ?? verteilerplanNameVorschlag(angaben, kennzeichen)

  const alte = useMemo(
    () => (ausDialog ? einzelklemmen(ausDialog.verteiler.verteiler.bestueckung) : []),
    [ausDialog],
  )
  const umstellung = useMemo(
    () =>
      ausDialog && alte.length > 0
        ? einzelklemmenInLeiste(ausDialog.verteiler.verteiler.bestueckung, katalog, leiste)
        : null,
    [ausDialog, alte, katalog, leiste],
  )
  const umstellen = ueberfuehren && umstellung !== null && umstellung.umbenannt.size > 0
  const knxOffen = useMemo(
    () =>
      ausDialog
        ? planeKnxZuordnung({ zeichnung, verteiler: ausDialog.verteiler, katalog }).zuweisungen
            .length
        : 0,
    [ausDialog, zeichnung, katalog],
  )

  const raumBauplan =
    gelesen?.bauplaene.find((b) => b.dokument.id === raumBauplanId) ?? gelesen?.bauplaene[0] ?? null
  const raumListe = useMemo(
    () => (raumBauplan ? raeumeZurAuswahl(raumBauplan.zeichnung, katalog, null) : []),
    [raumBauplan, katalog],
  )
  const raumZustandMitArt = useMemo(
    () => (raumZustand ? { ...raumZustand, vorgabe: { ...raumZustand.vorgabe, art } } : null),
    [raumZustand, art],
  )
  const raumVorschlag = useMemo(
    () =>
      schritt === 'raeume' && raumBauplan && raumZustandMitArt
        ? rechneRaumVorschlag(raumZustandMitArt, {
            zeichnung: raumBauplan.zeichnung,
            katalog,
            bestueckung,
          })
        : null,
    [schritt, raumBauplan, raumZustandMitArt, katalog, bestueckung],
  )

  const netzNeu = netzDerVorgabe(
    quellenArt === 'raeume' && raumZustand ? raumZustand.vorgabe : vorgabe,
  )
  const verteilerFuerPlan = useMemo(() => {
    if (neu) return assistentVerteiler(kennzeichen, bestueckung, netzNeu, art)
    if (!bauplanVerteiler) return null
    const v = bauplanVerteiler.verteiler
    return {
      ...v,
      verteiler: { ...v.verteiler, art, ...(umstellen ? { bestueckung: umstellung.liste } : {}) },
    }
  }, [neu, kennzeichen, bestueckung, netzNeu, art, bauplanVerteiler, umstellen, umstellung])

  const quellZeichnung = neu
    ? quellenArt === 'raeume'
      ? raumBauplan?.zeichnung
      : undefined
    : bauplanVerteiler?.dokumentId === null
      ? zeichnung
      : gelesen?.bauplaene.find((b) => b.dokument.id === bauplanVerteiler?.dokumentId)?.zeichnung
  const plansprache = quellZeichnung ? planspracheVon(quellZeichnung) : oberflaechensprache()

  const ergebnis = useMemo(() => {
    if (schritt !== 'name' || !verteilerFuerPlan) return null
    const plan = erzeugeVerteilerplan(verteilerFuerPlan, katalog, {
      name: name.trim() || verteilerplanNameVorschlag(angaben, kennzeichen),
      maxSicherungenJeBlatt: einstellungen.maxSicherungenJeBlatt,
      maxKlemmenJeBlatt: einstellungen.maxKlemmenJeBlatt,
      aufteilung: einstellungen.aufteilung,
      plansprache,
    })
    if (neu)
      plan.zeichnung.verteilerAssistent = {
        angaben: ohneLeere(angaben),
        bestueckung,
        ...(netzNeu === 'wechselstrom' ? { netz: netzNeu } : {}),
        ...(quellenArt === 'raeume' && raumBauplan && raumZustand
          ? { raeume: { dokumentId: raumBauplan.dokument.id, auswahl: raumZustand.auswahl } }
          : {}),
      }
    return plan
  }, [
    schritt,
    verteilerFuerPlan,
    katalog,
    name,
    kennzeichen,
    einstellungen,
    neu,
    angaben,
    bestueckung,
    netzNeu,
    quellenArt,
    raumBauplan,
    raumZustand,
    plansprache,
  ])

  function schliessen() {
    useUiStore.getState().setVerteilerplanErzeugen(null)
  }

  function setzeZahl(feld: 'maxSicherungenJeBlatt' | 'maxKlemmenJeBlatt', wert: string) {
    const zahl = Math.round(Number(wert))
    if (!Number.isFinite(zahl) || zahl < 1) return
    setEinstellungen(settingsStore, { ...einstellungen, [feld]: Math.min(zahl, 64) })
  }

  const quelle: BestueckungsQuelle = {
    liste: bestueckung,
    aktuelleListe: () => bestueckungRef.current,
    schreibe: (_label, liste) => {
      bestueckungRef.current = liste
      setBestueckung(liste)
    },
  }

  function zuRaeumen() {
    if (!raumZustand)
      setRaumZustand(
        raumVorschlagStart(
          raumListe,
          gemerkt?.raeume?.dokumentId === raumBauplan?.dokument.id
            ? gemerkt?.raeume?.auswahl
            : undefined,
          einstellungen.knxReserveProzent,
          gemerkt?.netz,
          art,
        ),
      )
    setSchritt('raeume')
  }

  function quellenArtWaehlen(art: QuellenArt) {
    if (art === quellenArt) return
    setQuellenArt(art)
    quelle.schreibe('Quelle gewechselt', [])
    setAufgebautMit(null)
    setRaumZustand(null)
  }

  function weiter() {
    if (schritt === 'quelle') {
      if (quellenArt === 'raeume') zuRaeumen()
      else setSchritt(neu ? 'vorgabe' : 'name')
    } else if (schritt === 'raeume') {
      if (raumVorschlag) quelle.schreibe('Baum aus Räumen', raumVorschlag.liste)
      setSchritt('baum')
    } else if (schritt === 'vorgabe') {
      if (aufgebautMit === null || JSON.stringify(aufgebautMit) !== JSON.stringify(vorgabeMitArt)) {
        const start = startBestueckung(vorgabeMitArt, katalog)
        quelle.schreibe('Startbaum', start.liste)
        setFehlend(start.fehlend)
        setAufgebautMit(vorgabeMitArt)
      }
      setSchritt('baum')
    } else if (schritt === 'baum') setSchritt('name')
  }

  function zurueck() {
    if (schritt === 'name') setSchritt(neu ? 'baum' : 'quelle')
    else if (schritt === 'baum') {
      if (quellenArt === 'raeume') zuRaeumen()
      else setSchritt('vorgabe')
    } else if (schritt === 'vorgabe' || schritt === 'raeume') setSchritt('quelle')
  }

  async function erzeugen() {
    if (!ergebnis || !projektId) return
    setLaeuft(true)
    try {
      if (umstellen && ausDialog)
        commands.execute(
          erzeugeBestueckungCommand(
            doc,
            ausDialog.blattId,
            ausDialog.verteiler.id,
            t('verteilerdialoge.verteiler.ueberfuehrenUndo'),
            umstellung.liste,
            umstellung.umbenannt,
          ),
        )
      const dokument = await sitzung.legeZeichnungAn(projektId, ergebnis.zeichnung)
      schliessen()
      if (ziel.art === 'projekt') ziel.nachErzeugen?.()
      const jetzt = sitzung.getOffenesDokument()
      if (jetzt && jetzt.projektId === projektId)
        void verknuepfung.aktualisiere({
          projektId: jetzt.projektId,
          dokumentId: jetzt.dokumentId,
          zeichnungsart: zeichnung.zeichnungsart,
        })
      useUiStore.getState().oeffneBestaetigung({
        titel: t('verteilerdialoge.assistent.angelegtTitel'),
        nachricht: t('verteilerdialoge.assistent.angelegtNachricht', { name: dokument.name }),
        bestaetigenText: t('verteilerdialoge.schaltplanZuordnen.oeffnen'),
        destruktiv: false,
        callback: (bestaetigt) => {
          if (!bestaetigt) return
          useUiStore.getState().setProjekteDialogOffen(false)
          void oeffneDokument(dokument.id)
        },
      })
    } catch (fehler) {
      useUiStore
        .getState()
        .zeigeToast(
          fehler instanceof Error ? fehler.message : t('verteilerdialoge.assistent.anlegenFehler'),
        )
    } finally {
      setLaeuft(false)
    }
  }

  const schritte: Schritt[] =
    ziel.art === 'verteiler'
      ? ['name']
      : quellenArt === 'raeume'
        ? ['quelle', 'raeume', 'baum', 'name']
        : neu
          ? ['quelle', 'vorgabe', 'baum', 'name']
          : ['quelle', 'name']
  const nummer = schritte.indexOf(schritt) + 1
  const kannWeiter =
    schritt === 'quelle'
      ? quellenArt === 'raeume'
        ? raumBauplan !== null
        : neu || bauplanVerteiler !== null
      : schritt === 'raeume'
        ? (raumVorschlag?.zeilen.length ?? 0) > 0
        : schritt !== 'name'

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div
        className="dialog dialog-verteiler dialog-verteilerplan-assistent"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2>
          {t('verteilerdialoge.assistent.titel')}
          {schritte.length > 1 && (
            <span className="assistent-schritt">
              {' '}
              · {t('verteilerdialoge.assistent.schritt', { nummer, gesamt: schritte.length })}
            </span>
          )}
        </h2>
        {!projektId ? (
          <p className="dialog-hinweis">{t('verteilerdialoge.assistent.keinProjekt')}</p>
        ) : schritt === 'quelle' ? (
          <QuelleSchritt
            gelesen={gelesen?.verteiler ?? null}
            bauplaene={gelesen?.bauplaene ?? null}
            art={quellenArt}
            gewaehlt={gewaehlt}
            raumBauplanId={raumBauplan?.dokument.id ?? null}
            onArt={quellenArtWaehlen}
            onGewaehlt={setGewaehlt}
            onRaumBauplan={(id) => {
              setRaumBauplanId(id)
              setRaumZustand(null)
              quelle.schreibe('Bauplan gewechselt', [])
            }}
          />
        ) : schritt === 'raeume' ? (
          raumZustandMitArt && raumVorschlag ? (
            <>
              <p className="dialog-hinweis">
                {t('verteilerdialoge.assistent.raeumeHinweis', {
                  name: raumBauplan?.dokument.name ?? '',
                })}
              </p>
              <RaumVorschlagFelder
                raeume={raumListe}
                zustand={raumZustandMitArt}
                onZustand={(z) => {
                  setRaumZustand(z)
                  setzeArt(z.vorgabe.art)
                }}
                vorschlag={raumVorschlag}
                katalog={katalog}
                mitKette={bestueckung.length === 0}
              />
            </>
          ) : (
            <p className="dialog-hinweis">{t('verteilerdialoge.assistent.bauplaeneLesen')}</p>
          )
        ) : schritt === 'vorgabe' ? (
          <VorgabeSchritt
            vorgabe={vorgabeMitArt}
            onVorgabe={(v) => {
              setVorgabe(v)
              setzeArt(v.art)
            }}
            aufgebaut={aufgebautMit !== null}
          />
        ) : schritt === 'baum' ? (
          <>
            <p className="dialog-hinweis">
              {festesKennzeichen
                ? t('verteilerdialoge.assistent.baumFuer', {
                    kennzeichen: verteilerKennzeichenText(festesKennzeichen),
                  })
                : t('verteilerdialoge.assistent.baumNeu')}
            </p>
            {fehlend.length > 0 && (
              <p className="dialog-hinweis verteiler-warnung">
                {t('verteilerdialoge.raeume.fehlend', { liste: fehlend.join(', ') })}
              </p>
            )}
            <BaumSchritt
              quelle={quelle}
              kennzeichen={kennzeichen}
              katalog={katalog}
              netz={netzNeu}
            />
          </>
        ) : !ergebnis ? (
          <p className="dialog-hinweis">{t('verteilerdialoge.knxZuordnen.verteilerFehlt')}</p>
        ) : (
          <>
            <AngabenFelder
              angaben={angaben}
              onAngaben={setAngaben}
              kennzeichen={kennzeichen}
              kennzeichenFest={festesKennzeichen !== null}
              onKennzeichen={setKennzeichenEingabe}
              name={name}
              onName={setNameEingabe}
            />
            <div className="verteilerplan-felder">
              <label className="dialog-feld">
                {t('verteilerdialoge.assistent.maxSicherungen')}
                <input
                  type="number"
                  min={1}
                  max={64}
                  value={einstellungen.maxSicherungenJeBlatt}
                  onChange={(e) => setzeZahl('maxSicherungenJeBlatt', e.target.value)}
                />
              </label>
              <label className="dialog-feld">
                {t('verteilerdialoge.assistent.maxKlemmen')}
                <input
                  type="number"
                  min={1}
                  max={64}
                  value={einstellungen.maxKlemmenJeBlatt}
                  onChange={(e) => setzeZahl('maxKlemmenJeBlatt', e.target.value)}
                />
              </label>
            </div>
            <div className="assistent-quelle verteilerplan-aufteilung">
              <span className="dialog-hinweis">{t('verteilerdialoge.assistent.aufteilung')}</span>
              <label className="dialog-radio-zeile">
                <input
                  type="radio"
                  checked={einstellungen.aufteilung === 'ganz'}
                  onChange={() =>
                    setEinstellungen(settingsStore, { ...einstellungen, aufteilung: 'ganz' })
                  }
                />
                {t('verteilerdialoge.assistent.aufteilungGanz')}
              </label>
              <label className="dialog-radio-zeile">
                <input
                  type="radio"
                  checked={einstellungen.aufteilung === 'fortlaufend'}
                  onChange={() =>
                    setEinstellungen(settingsStore, { ...einstellungen, aufteilung: 'fortlaufend' })
                  }
                />
                {t('verteilerdialoge.assistent.aufteilungFortlaufend')}
              </label>
            </div>
            {umstellung && umstellung.umbenannt.size > 0 && (
              <label className="dialog-radio-zeile">
                <input
                  type="checkbox"
                  checked={ueberfuehren}
                  disabled={laeuft}
                  onChange={(e) => setUeberfuehren(e.target.checked)}
                />
                {t('verteilerdialoge.assistent.ueberfuehren', {
                  n: alte.length,
                  liste: einzelklemmenText(alte.map((e) => e.kennzeichen)),
                  leiste,
                  alt: alte[0].kennzeichen,
                  neu: umstellung.umbenannt.get(alte[0].kennzeichen) ?? '',
                })}
              </label>
            )}
            {ausDialog && knxOffen > 0 && (
              <p className="dialog-hinweis verteiler-hinweis">
                {t('verteilerdialoge.verteiler.knxOffen', { n: knxOffen })}{' '}
                <button
                  disabled={laeuft}
                  onClick={() =>
                    useUiStore.getState().setKnxZuordnen({
                      blattId: ausDialog.blattId,
                      objektId: ausDialog.verteiler.id,
                    })
                  }
                >
                  {t('verteilerdialoge.verteiler.knxZuordnenKnopf')}
                </button>
              </p>
            )}
            <p className="verteilerplan-zusammenfassung">
              {t('verteilerdialoge.assistent.zusammenfassung', {
                blaetter: ergebnis.zeichnung.blaetter.length,
                stromkreise: ergebnis.stromkreise,
                rcd: ergebnis.rcd,
              })}
              {ergebnis.aktoren.length > 0 && ` · ${aktorenText(t, ergebnis.aktoren)}`}
            </p>
            {ergebnis.hinweise.length > 0 && (
              <ul className="dialog-hinweis verteiler-hinweis">
                {ergebnis.hinweise.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
            <div className="verteilerplan-vorschau">
              {ergebnis.zeichnung.blaetter.map((blatt) => (
                <figure key={blatt.id}>
                  <BlattBild blatt={blatt} plansprache={plansprache} />
                  <figcaption>{blatt.name}</figcaption>
                </figure>
              ))}
            </div>
          </>
        )}
        {projektId && <PruefHinweis />}
        <div className="dialog-aktionen">
          <button onClick={schliessen}>{t('verteilerdialoge.allgemein.abbrechen')}</button>
          {nummer > 1 && (
            <button onClick={zurueck} disabled={laeuft}>
              {t('verteilerdialoge.assistent.zurueck')}
            </button>
          )}
          {schritt === 'name' ? (
            <button
              className="primaer"
              disabled={!ergebnis || laeuft || !kennzeichen}
              onClick={() => void erzeugen()}
            >
              {laeuft
                ? t('verteilerdialoge.assistent.laeuft')
                : t('verteilerdialoge.assistent.erzeugen')}
            </button>
          ) : (
            <button className="primaer" disabled={!kannWeiter || !projektId} onClick={weiter}>
              {t('verteilerdialoge.assistent.weiter')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ohneLeere(angaben: VerteilerAngaben): VerteilerAngaben {
  const ergebnis: VerteilerAngaben = { art: angaben.art }
  for (const feld of ['etage', 'wohnung', 'verwendung'] as const) {
    const wert = angaben[feld]?.trim()
    if (wert) ergebnis[feld] = wert
  }
  return ergebnis
}

function QuelleSchritt({
  gelesen,
  bauplaene,
  art,
  gewaehlt,
  raumBauplanId,
  onArt,
  onGewaehlt,
  onRaumBauplan,
}: {
  gelesen: BauplanVerteiler[] | null
  bauplaene: GeleseneZeichnung[] | null
  art: QuellenArt
  gewaehlt: number
  raumBauplanId: string | null
  onArt: (art: QuellenArt) => void
  onGewaehlt: (index: number) => void
  onRaumBauplan: (dokumentId: string) => void
}) {
  const leer = gelesen !== null && gelesen.length === 0
  const ohneBauplan = bauplaene !== null && bauplaene.length === 0
  const t = useT()
  return (
    <div className="assistent-quelle">
      <label className="dialog-radio-zeile">
        <input
          type="radio"
          checked={art === 'bauplan'}
          disabled={leer}
          onChange={() => onArt('bauplan')}
        />
        {t('verteilerdialoge.assistent.quelleBauplan')}
      </label>
      <div className="assistent-einrueckung">
        {gelesen === null ? (
          <span className="dialog-hinweis">{t('verteilerdialoge.assistent.bauplaeneLesen')}</span>
        ) : leer ? (
          <span className="dialog-hinweis">{t('verteilerdialoge.assistent.keinVerteiler')}</span>
        ) : (
          <select
            value={gewaehlt}
            disabled={art !== 'bauplan'}
            onChange={(e) => onGewaehlt(Number(e.target.value))}
          >
            {gelesen.map((v, i) => (
              <option key={`${v.dokumentId}-${v.verteiler.id}`} value={i}>
                {t(
                  v.dokumentId === null
                    ? 'verteilerdialoge.assistent.verteilerOffen'
                    : 'verteilerdialoge.assistent.verteilerEintrag',
                  {
                    kennzeichen: verteilerKennzeichenText(v.verteiler.verteiler.kennzeichen),
                    plan: v.dokumentName,
                    n: v.verteiler.verteiler.bestueckung.length,
                  },
                )}
              </option>
            ))}
          </select>
        )}
      </div>
      <label className="dialog-radio-zeile">
        <input
          type="radio"
          checked={art === 'raeume'}
          disabled={ohneBauplan}
          onChange={() => onArt('raeume')}
        />
        {t('verteilerdialoge.assistent.quelleRaeume')}
      </label>
      <div className="assistent-einrueckung">
        {bauplaene === null ? (
          <span className="dialog-hinweis">{t('verteilerdialoge.assistent.bauplaeneLesen')}</span>
        ) : ohneBauplan ? (
          <span className="dialog-hinweis">{t('verteilerdialoge.assistent.keinBauplan')}</span>
        ) : (
          <select
            value={raumBauplanId ?? ''}
            disabled={art !== 'raeume'}
            onChange={(e) => onRaumBauplan(e.target.value)}
          >
            {bauplaene.map((b) => (
              <option key={b.dokument.id} value={b.dokument.id}>
                {b.dokument.name}
              </option>
            ))}
          </select>
        )}
        <p className="dialog-hinweis">{t('verteilerdialoge.assistent.quelleRaeumeHinweis')}</p>
      </div>
      <label className="dialog-radio-zeile">
        <input type="radio" checked={art === 'neu'} onChange={() => onArt('neu')} />
        {t('verteilerdialoge.assistent.quelleNeu')}
      </label>
      <p className="dialog-hinweis assistent-einrueckung">
        {t('verteilerdialoge.assistent.quelleNeuHinweis')}
      </p>
    </div>
  )
}

function VorgabeSchritt({
  vorgabe,
  onVorgabe,
  aufgebaut,
}: {
  vorgabe: Schnellvorgabe
  onVorgabe: (v: Schnellvorgabe) => void
  aufgebaut: boolean
}) {
  const setze = (patch: Partial<Schnellvorgabe>) => onVorgabe({ ...vorgabe, ...patch })
  const zahl = (wert: string) => Math.max(0, Math.min(48, Math.round(Number(wert)) || 0))
  const t = useT()
  return (
    <div className="assistent-vorgabe">
      <ArtWahl art={vorgabe.art} onArt={(art) => setze({ art })} />
      <span className="assistent-zeile">
        {t('verteilerdialoge.raeume.netz')}
        <label className="dialog-radio-zeile">
          <input
            type="radio"
            checked={vorgabe.drehstrom}
            onChange={() => setze({ drehstrom: true })}
          />
          {t('verteilerdialoge.raeume.drehstrom')}
        </label>
        <label className="dialog-radio-zeile">
          <input
            type="radio"
            checked={!vorgabe.drehstrom}
            onChange={() => setze({ drehstrom: false })}
          />
          {t('verteilerdialoge.raeume.wechselstrom')}
        </label>
      </span>
      <label className="dialog-radio-zeile">
        <input
          type="checkbox"
          checked={vorgabe.einspeiseklemme}
          onChange={(e) => setze({ einspeiseklemme: e.target.checked })}
        />
        {t('verteilerdialoge.raeume.einspeiseklemme')} ({vorgabe.drehstrom ? '3P+N+PE' : '1P+N+PE'})
      </label>
      {vorgabe.art === 'HV' && (
        <>
          <label className="dialog-radio-zeile">
            <input
              type="checkbox"
              checked={vorgabe.sls}
              onChange={(e) => setze({ sls: e.target.checked })}
            />
            {t('verteilerdialoge.raeume.sls')}
          </label>
          <label className="dialog-radio-zeile">
            <input
              type="checkbox"
              checked={vorgabe.blitzschutz}
              onChange={(e) => setze({ blitzschutz: e.target.checked })}
            />
            {t('verteilerdialoge.assistent.blitzschutz')}
          </label>
          <label className="dialog-radio-zeile">
            <input
              type="checkbox"
              checked={vorgabe.zaehler}
              onChange={(e) => setze({ zaehler: e.target.checked })}
            />
            {t('verteilerdialoge.raeume.zaehler')}
          </label>
          <label className="dialog-radio-zeile">
            <input
              type="checkbox"
              checked={vorgabe.sicherungNachZaehler}
              onChange={(e) => setze({ sicherungNachZaehler: e.target.checked })}
            />
            {t('verteilerdialoge.raeume.sicherungNachZaehler')}
          </label>
        </>
      )}
      <span className="assistent-zeile">
        <label className="dialog-feld">
          RCD
          <input
            type="number"
            min={0}
            max={48}
            value={vorgabe.rcd}
            onChange={(e) => setze({ rcd: zahl(e.target.value) })}
          />
        </label>
        <label className="dialog-feld">
          {t('verteilerdialoge.raeume.rcdTyp')}
          <input
            value={vorgabe.rcdTyp}
            placeholder={t('verteilerdialoge.raeume.rcdTypBeispiel')}
            onChange={(e) => setze({ rcdTyp: e.target.value })}
          />
        </label>
      </span>
      <span className="assistent-zeile">
        <label className="dialog-feld">
          {vorgabe.rcd > 0 ? t('verteilerdialoge.assistent.lsJeRcd') : 'LS'}
          <input
            type="number"
            min={0}
            max={48}
            value={vorgabe.lsJeRcd}
            onChange={(e) => setze({ lsJeRcd: zahl(e.target.value) })}
          />
        </label>
        <label className="dialog-feld">
          {t('verteilerdialoge.raeume.lsTyp')}
          <input
            value={vorgabe.lsTyp}
            placeholder={t('verteilerdialoge.raeume.lsTypBeispiel')}
            onChange={(e) => setze({ lsTyp: e.target.value })}
          />
        </label>
      </span>
      <label className="dialog-radio-zeile">
        <input
          type="checkbox"
          checked={vorgabe.klemmeJeLs}
          onChange={(e) => setze({ klemmeJeLs: e.target.checked })}
        />
        {t('verteilerdialoge.assistent.klemmeJeLs')}
      </label>
      {aufgebaut && (
        <p className="dialog-hinweis">{t('verteilerdialoge.assistent.vorgabeGeaendert')}</p>
      )}
    </div>
  )
}

function BaumSchritt({
  quelle,
  kennzeichen,
  katalog,
  netz,
}: {
  quelle: BestueckungsQuelle
  kennzeichen: string
  katalog: readonly CatalogComponent[]
  netz: VerteilerNetz
}) {
  const baum = useMemo(
    () => baueVerteilerBaum(assistentVerteiler(kennzeichen, quelle.liste, netz), katalog),
    [kennzeichen, quelle.liste, netz, katalog],
  )
  return (
    <BaumBearbeiten
      quelle={quelle}
      baum={baum}
      belegung={KEINE_BELEGUNG}
      katalog={katalog}
      netz={netz}
      bearbeitbar
      mitPlan={false}
    />
  )
}

const KEINE_BELEGUNG = new Map<string, { leitungen: string[]; geraete: string }>()

function AngabenFelder({
  angaben,
  onAngaben,
  kennzeichen,
  kennzeichenFest,
  onKennzeichen,
  name,
  onName,
}: {
  angaben: VerteilerAngaben
  onAngaben: (a: VerteilerAngaben) => void
  kennzeichen: string
  kennzeichenFest: boolean
  onKennzeichen: (k: string | null) => void
  name: string
  onName: (n: string | null) => void
}) {
  const setze = (patch: Partial<VerteilerAngaben>) => onAngaben({ ...angaben, ...patch })
  const t = useT()
  return (
    <div className="assistent-angaben">
      <label className="dialog-feld">
        {t('verteilerdialoge.raeume.art')}
        <select
          value={angaben.art}
          onChange={(e) => setze({ art: e.target.value as VerteilerArt })}
        >
          {VERTEILER_ARTEN.map((a) => (
            <option key={a.art} value={a.art}>
              {a.name} (+{a.art})
            </option>
          ))}
        </select>
      </label>
      <label className="dialog-feld">
        {t('verteilerdialoge.switchPort.etage')}
        <input
          list="assistent-etagen"
          value={angaben.etage ?? ''}
          placeholder={t('verteilerdialoge.assistent.etageBeispiel')}
          onChange={(e) => setze({ etage: e.target.value })}
        />
        <datalist id="assistent-etagen">
          {ETAGEN_VORSCHLAEGE.map((e) => (
            <option key={e} value={e} />
          ))}
        </datalist>
      </label>
      <label className="dialog-feld">
        {t('verteilerdialoge.assistent.wohnung')}
        <input
          value={angaben.wohnung ?? ''}
          placeholder={t('verteilerdialoge.assistent.wohnungBeispiel')}
          onChange={(e) => setze({ wohnung: e.target.value })}
        />
      </label>
      <label className="dialog-feld">
        {t('verteilerdialoge.assistent.verwendung')}
        <input
          list="assistent-verwendung"
          value={angaben.verwendung ?? ''}
          placeholder={t('verteilerdialoge.assistent.verwendungBeispiel')}
          onChange={(e) => setze({ verwendung: e.target.value })}
        />
        <datalist id="assistent-verwendung">
          {verwendungVorschlaege().map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      </label>
      <label className="dialog-feld">
        {t('verteilerdialoge.knxAktor.kennzeichen')}
        <input
          value={verteilerKennzeichenText(kennzeichen)}
          disabled={kennzeichenFest}
          title={kennzeichenFest ? t('verteilerdialoge.assistent.kennzeichenFest') : undefined}
          onChange={(e) => onKennzeichen(e.target.value)}
        />
      </label>
      <label className="dialog-feld assistent-name">
        {t('verteilerdialoge.schachtVerbund.name')}
        <input value={name} onChange={(e) => onName(e.target.value)} />
      </label>
      <button
        type="button"
        className="assistent-vorschlag"
        onClick={() => {
          onKennzeichen(null)
          onName(null)
        }}
      >
        {t('verteilerdialoge.assistent.vorschlag')}
      </button>
    </div>
  )
}

function einzelklemmenText(kennzeichen: readonly string[]): string {
  return kennzeichen.length > 2
    ? `${kennzeichen[0]} … ${kennzeichen[kennzeichen.length - 1]}`
    : kennzeichen.join(', ')
}

function BlattBild({ blatt, plansprache }: { blatt: Blatt; plansprache: Sprache }) {
  const { catalogStore } = useAppContext()
  const katalogKomponenten = useKatalogStore((s) => s.komponenten)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !blatt.zeichenflaeche) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = BILD_BREITE * dpr
    canvas.height = BILD_HOEHE * dpr
    let laeuft = true
    const zeichne = () => {
      if (!laeuft) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const rahmen: KomponentenRenderKontext = {
        tp: planUebersetzer({ plansprache }),
        plansprache,
        katalogKomponenten,
        catalogStore,
        aufNeuZeichnenAnfordern: () => requestAnimationFrame(zeichne),
        blattAnzeige: blatt,
        alleObjekteAufBlatt: blatt.objekte,
        schaltplan: true,
      }
      zeichneAnordnenVorschau(
        ctx,
        BILD_BREITE,
        BILD_HOEHE,
        blatt,
        zeichenflaecheBoundingBox(blatt.zeichenflaeche!),
        rahmen,
      )
    }
    zeichne()
    return () => {
      laeuft = false
    }
  }, [blatt, catalogStore, katalogKomponenten, plansprache])

  return (
    <canvas
      ref={canvasRef}
      className="verteilerplan-bild"
      style={{ width: BILD_BREITE, height: BILD_HOEHE }}
    />
  )
}

function aktorenText(
  t: Uebersetzer,
  aktoren: readonly { titel: string; baugroesse: number; belegt: number }[],
): string {
  const belegt = aktoren.reduce((n, a) => n + a.belegt, 0)
  const frei = aktoren.reduce((n, a) => n + a.baugroesse - a.belegt, 0)
  return t('verteilerdialoge.assistent.aktoren', {
    anzahl: t('verteilerdialoge.assistent.aktorenAnzahl', { n: aktoren.length }),
    titel: aktoren.map((a) => a.titel).join(', '),
    kanaele: t('verteilerdialoge.assistent.kanaeleBelegt', { n: belegt }),
    frei,
  })
}
