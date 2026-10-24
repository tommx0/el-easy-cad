import { useEffect, useState } from 'react'
import { boundingBoxFromPoints, erzeugeBauteilObjekte, istKalibriert } from '../../document-model'
import type { BauteilOptionen, Bauteilfunde, Planlinien } from '../../erkennung'
import { ErkennungAbgebrochen, erkenneBauteile, messeProbe, wandToleranzen } from '../../erkennung'
import { erzeugeObjektAendernCommand } from '../../tools'
import { ladePlanlinien } from '../erkennung-planlinien'
import { useUiStore } from '../store/ui-store'
import { useAktivesBlatt, useAppContext } from '../use-app-context'
import { ZahlenFeld } from '../ZahlenFeld'
import type { Schluessel, Uebersetzer } from '../../sprache'
import { formatiereZahl } from '../../sprache'
import { useT } from '../sprache-anbindung'
import { befehlName } from '../befehle/katalog'

const PROBEN_ART: Record<'wand' | 'tuer' | 'fenster', Schluessel> = {
  wand: 'zeichendialoge.bauteilerkennung.wand',
  tuer: 'zeichendialoge.bauteilerkennung.tuer',
  fenster: 'zeichendialoge.bauteilerkennung.fenster',
}

export function BauteilerkennungDialog() {
  const offen = useUiStore((s) => s.bauteilerkennungOffen)
  const optionen = useUiStore((s) => s.erkennungsOptionen)
  const funde = useUiStore((s) => s.erkennungsVorschau)
  const probe = useUiStore((s) => s.erkennungsProbe)
  const probeStaerke = useUiStore((s) => s.erkennungsProbeStaerke)
  const probeFarbe = useUiStore((s) => s.erkennungsProbeFarbe)
  const probenart = useUiStore((s) => s.erkennungsProbenart)
  const { doc, commands, overlaySignal, aktiviereTool } = useAppContext()
  const blatt = useAktivesBlatt()
  const t = useT()

  const hintergrund = blatt.hintergrund
  const kalibriert = istKalibriert(hintergrund)

  const [geladen, setGeladen] = useState<{ blattId: string; linien: Planlinien | null } | null>(
    null,
  )
  const linien = geladen?.blattId === blatt.id ? geladen.linien : null
  const laedt = offen && kalibriert && geladen?.blattId !== blatt.id

  useEffect(() => {
    if (!offen) return
    let verworfen = false
    void ladePlanlinien(blatt).then((ergebnis) => {
      if (!verworfen) setGeladen({ blattId: blatt.id, linien: ergebnis })
    })
    return () => {
      verworfen = true
    }
  }, [offen, blatt])

  const [gerechnetMit, setGerechnetMit] = useState<string | null>(null)
  const [rechnet, setRechnet] = useState(false)
  const [abbruch, setAbbruch] = useState<string | null>(null)
  const einstellungsSchluessel = JSON.stringify(optionen)
  const veraltet = gerechnetMit !== null && gerechnetMit !== einstellungsSchluessel

  const erkennen = () => {
    if (!linien || rechnet) return
    setRechnet(true)
    window.setTimeout(() => {
      try {
        useUiStore.getState().setErkennungsVorschau(erkenneBauteile(linien, optionen))
        setAbbruch(null)
      } catch (fehler) {
        useUiStore.getState().setErkennungsVorschau({ waende: [], oeffnungen: [], treppen: [] })
        setAbbruch(
          fehler instanceof ErkennungAbgebrochen
            ? fehler.grund === 'zeit'
              ? t('zeichendialoge.bauteilerkennung.abbruchZeit')
              : t('zeichendialoge.bauteilerkennung.abbruchLinien')
            : t('zeichendialoge.bauteilerkennung.fehlgeschlagen'),
        )
      }
      overlaySignal.request()
      setGerechnetMit(JSON.stringify(useUiStore.getState().erkennungsOptionen))
      setRechnet(false)
    }, 0)
  }

  useEffect(() => {
    if (!probe || !linien) return
    const messung = messeProbe(
      linien.segmente,
      boundingBoxFromPoints([probe.a, probe.b]),
      wandToleranzen(optionen.empfindlichkeit, linien.herkunft),
      probenart,
    )
    useUiStore.getState().setErkennungsProbe(null)
    if (!messung.staerke) return
    if (messung.art === 'wand') {
      useUiStore.getState().meldeErkennungsProbeStaerke(messung.staerke, messung.farbe)
    } else {
      useUiStore.getState().meldeErkennungsProbeOeffnung(messung.staerke, messung.farbe)
    }
  }, [probe, linien, optionen.empfindlichkeit, probenart])

  if (!offen) return null

  const aendere = (teil: Partial<BauteilOptionen>) =>
    useUiStore.getState().setErkennungsOptionen({ ...optionen, ...teil })

  const schliessen = () => {
    useUiStore.getState().setBauteilerkennungOffen(false)
    aktiviereTool('auswahl')
    overlaySignal.request()
  }

  const uebernehmen = () => {
    if (funde.waende.length === 0 && funde.treppen.length === 0) return
    const { objekte: neue } = erzeugeBauteilObjekte(funde, blatt.aktiveEbeneId)
    commands.execute(
      erzeugeObjektAendernCommand(
        doc,
        blatt.id,
        t('zeichendialoge.bauteilerkennung.titel'),
        (objekte) => [...objekte, ...neue],
      ),
    )
    schliessen()
  }

  const probenArtName = t(PROBEN_ART[probenart])

  const probeKnopf = (art: typeof probenart) => (
    <button
      type="button"
      className={probenart === art ? 'aktiv' : undefined}
      onClick={() => {
        useUiStore.getState().setErkennungsProbenart(art)
        aktiviereTool('erkennung-probe')
      }}
    >
      {t(PROBEN_ART[art])}
    </button>
  )

  const schalter = (
    label: Schluessel,
    an: boolean,
    aendern: (v: boolean) => void,
    deaktiviert = false,
  ) => (
    <label
      className="erkennung-schalter"
      title={deaktiviert ? t('zeichendialoge.bauteilerkennung.brauchtWaende') : undefined}
    >
      <input
        type="checkbox"
        checked={an && !deaktiviert}
        disabled={deaktiviert}
        onChange={(e) => aendern(e.target.checked)}
      />
      <span>{t(label)}</span>
    </label>
  )

  const zahlenfeld = (label: Schluessel, wert: number, aendern: (v: number) => void) => (
    <label className="dialog-feld">
      <span>{t(label)}</span>
      <ZahlenFeld step={0.01} min={0.01} value={wert} onCommit={aendern} />
    </label>
  )

  return (
    <div className="erkennung-assistent">
      <h2>
        {t('zeichendialoge.bauteilerkennung.titel')} <span className="erkennung-alpha">Alpha</span>
      </h2>
      <p className="dialog-hinweis">
        {t('zeichendialoge.bauteilerkennung.untertitel', { name: blatt.name })}
      </p>
      <p className="erkennung-alpha-hinweis">{t('zeichendialoge.bauteilerkennung.alphaHinweis')}</p>

      {!hintergrund ? (
        <p className="dialog-hinweis">{t('zeichendialoge.bauteilerkennung.keinHintergrund')}</p>
      ) : !kalibriert ? (
        <p className="dialog-hinweis">
          {t('zeichendialoge.bauteilerkennung.nichtKalibriert', {
            werkzeug: befehlName('kalibrieren', t),
          })}
        </p>
      ) : (
        <>
          <div className="erkennung-proben">
            <span className="dialog-hinweis">
              {t('zeichendialoge.bauteilerkennung.probeAufziehen')}
            </span>
            <div className="erkennung-zeile">
              {probeKnopf('wand')}
              {probeKnopf('tuer')}
              {probeKnopf('fenster')}
            </div>
            <span className="dialog-hinweis">
              {probeStaerke
                ? t('zeichendialoge.bauteilerkennung.gemessen', {
                    art: probenArtName,
                    wert: formatiereZahl(probeStaerke * 100, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }),
                  })
                : t('zeichendialoge.bauteilerkennung.probeHinweis')}
            </span>
          </div>

          {(probeFarbe || optionen.farbe) && (
            <label className="erkennung-schalter erkennung-farbe">
              <input
                type="checkbox"
                checked={Boolean(optionen.farbe)}
                onChange={(e) => aendere({ farbe: e.target.checked ? probeFarbe : null })}
              />
              <span>
                {t('zeichendialoge.bauteilerkennung.nurLinienIn')}{' '}
                <span
                  className="erkennung-farbtupfer"
                  style={{ background: optionen.farbe ?? probeFarbe ?? undefined }}
                />
                {optionen.farbe ?? probeFarbe}
              </span>
            </label>
          )}

          <label className="dialog-feld">
            <span>{t('zeichendialoge.bauteilerkennung.empfindlichkeit')}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={optionen.empfindlichkeit}
              onChange={(e) => aendere({ empfindlichkeit: Number(e.target.value) })}
            />
          </label>

          <div className="erkennung-felder">
            {zahlenfeld('zeichendialoge.bauteilerkennung.staerkeVon', optionen.staerkeMin, (v) =>
              aendere({ staerkeMin: v }),
            )}
            {zahlenfeld('zeichendialoge.bauteilerkennung.staerkeBis', optionen.staerkeMax, (v) =>
              aendere({ staerkeMax: v }),
            )}
            {zahlenfeld(
              'zeichendialoge.bauteilerkennung.mindestlaenge',
              optionen.mindestWandLaenge,
              (v) => aendere({ mindestWandLaenge: v }),
            )}
          </div>

          <div className="erkennung-schalter-gruppe">
            {schalter(
              'zeichendialoge.bauteilerkennung.waende',
              optionen.waendeSuchen !== false,
              (v) => aendere({ waendeSuchen: v }),
            )}
            {schalter(
              'zeichendialoge.bauteilerkennung.tueren',
              optionen.tuerenSuchen !== false,
              (v) => aendere({ tuerenSuchen: v }),
              optionen.waendeSuchen === false,
            )}
            {schalter(
              'zeichendialoge.bauteilerkennung.fensterMehrzahl',
              optionen.fensterSuchen !== false,
              (v) => aendere({ fensterSuchen: v }),
              optionen.waendeSuchen === false,
            )}
            {schalter(
              'zeichendialoge.bauteilerkennung.treppen',
              optionen.treppenSuchen !== false,
              (v) => aendere({ treppenSuchen: v }),
            )}
          </div>

          <button
            type="button"
            className="erkennung-starten primaer"
            onClick={erkennen}
            disabled={!linien || rechnet || laedt}
          >
            {rechnet
              ? t('zeichendialoge.bauteilerkennung.wirdGesucht')
              : gerechnetMit === null
                ? t('zeichendialoge.bauteilerkennung.erkennen')
                : t('zeichendialoge.bauteilerkennung.erneutErkennen')}
          </button>

          {(abbruch || funde.warnung) && (
            <p className="erkennung-warnung">{abbruch ?? funde.warnung}</p>
          )}

          <p className="erkennung-ergebnis">
            {laedt
              ? t('zeichendialoge.bauteilerkennung.wirdAusgewertet')
              : !linien || linien.segmente.length === 0
                ? t('zeichendialoge.bauteilerkennung.keineLinien')
                : gerechnetMit === null
                  ? t('zeichendialoge.bauteilerkennung.start', {
                      knopf: t('zeichendialoge.bauteilerkennung.erkennen'),
                    })
                  : funde.waende.length === 0 &&
                      funde.treppen.length === 0 &&
                      funde.oeffnungen.length === 0
                    ? t('zeichendialoge.bauteilerkennung.nichtsGefunden')
                    : ergebnisText(t, funde)}
            {veraltet && (
              <span className="erkennung-veraltet">
                {' '}
                {t('zeichendialoge.bauteilerkennung.veraltet')}
              </span>
            )}
          </p>
        </>
      )}

      <div className="dialog-aktionen">
        <button type="button" onClick={schliessen}>
          {t('zeichendialoge.gemeinsam.schliessen')}
        </button>
        <button
          type="button"
          className="primaer"
          onClick={uebernehmen}
          disabled={funde.waende.length === 0 && funde.treppen.length === 0}
        >
          {t('zeichendialoge.gemeinsam.uebernehmen')}
        </button>
      </div>
    </div>
  )
}

function ergebnisText(t: Uebersetzer, funde: Bauteilfunde): string {
  const tueren = funde.oeffnungen.filter((o) => o.art === 'tuer').length
  const fenster = funde.oeffnungen.length - tueren
  const teile: string[] = []
  const zaehle = (n: number, schluessel: Schluessel) => {
    if (n > 0) teile.push(t(schluessel, { n }))
  }
  zaehle(funde.waende.length, 'zeichendialoge.bauteilerkennung.anzahlWandzuege')
  zaehle(tueren, 'zeichendialoge.bauteilerkennung.anzahlTueren')
  zaehle(fenster, 'zeichendialoge.bauteilerkennung.anzahlFenster')
  zaehle(funde.treppen.length, 'zeichendialoge.bauteilerkennung.anzahlTreppen')

  const letzte = teile.pop() ?? ''
  const aufzaehlung =
    teile.length > 0
      ? t('zeichendialoge.bauteilerkennung.aufzaehlung', { liste: teile.join(', '), letzte })
      : letzte
  return t('zeichendialoge.bauteilerkennung.gefunden', { aufzaehlung })
}
