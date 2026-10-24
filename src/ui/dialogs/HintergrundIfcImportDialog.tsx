import { useEffect, useRef, useState } from 'react'
import type { IfcBauteilGruppe } from '../../document-model'
import { ifcGruppeInfo, sichtbareIfcEntities } from '../../document-model'
import type { Grundrisse } from '../../ifc'
import type { IfcGeschossInfo } from '../../rendering'
import { IFC_SCHNITTHOEHE_VORGABE, zeichneIfcVorschau } from '../../rendering'
import { useUiStore } from '../store/ui-store'
import { formatiereZahl } from '../../sprache'
import { useT } from '../sprache-anbindung'

const VORAUSWAHL_ANTEIL = 0.1

const VORSCHAU_BREITE = 300
const VORSCHAU_HOEHE = 240
const VORSCHAU_VERZOEGERUNG_MS = 350

interface FreierSchnitt {
  id: number
  name: string
  hoeheText: string
}

function formatHoehe(meter: number): string {
  return formatiereZahl(meter, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  })
}

interface Vorschau {
  schluessel: string
  grundrisse: Grundrisse | null
  fehler: string | null
}

function vorauswahl(geschosse: IfcGeschossInfo[]): Set<number> {
  const meiste = Math.max(0, ...geschosse.map((g) => g.elementAnzahl))
  return new Set(
    geschosse
      .filter((g) => g.elementAnzahl > 0 && g.elementAnzahl >= meiste * VORAUSWAHL_ANTEIL)
      .map((g) => g.expressId),
  )
}

function formatKote(kote: number): string {
  const text = formatHoehe(Math.abs(kote))
  return `${kote < 0 ? '−' : '+'}${text} m`
}

function liesZahl(text: string): number | null {
  const wert = Number(text.trim().replace(',', '.'))
  return text.trim() !== '' && Number.isFinite(wert) ? wert : null
}

export function HintergrundIfcImportDialog() {
  const zustand = useUiStore((s) => s.hintergrundIfcImportDialog)
  const t = useT()

  const [auswahl, setAuswahl] = useState<Set<number>>(new Set())
  const [leereZeigen, setLeereZeigen] = useState(false)
  const [schnitthoeheText, setSchnitthoeheText] = useState(() =>
    formatHoehe(IFC_SCHNITTHOEHE_VORGABE),
  )
  const [ausrichten, setAusrichten] = useState(true)
  const [fortschritt, setFortschritt] = useState<{ erledigt: number; gesamt: number } | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [vorschauZiel, setVorschauZiel] = useState<string | null>(null)
  const [vorschau, setVorschau] = useState<Vorschau | null>(null)
  const [freieSchnitte, setFreieSchnitte] = useState<FreierSchnitt[]>([])
  const [ausgeblendet, setAusgeblendet] = useState<Set<IfcBauteilGruppe>>(new Set())
  const naechsteSchnittId = useRef(1)
  const vorschauCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const [vorherigerZustand, setVorherigerZustand] = useState(zustand)
  if (zustand !== vorherigerZustand) {
    setVorherigerZustand(zustand)
    setAuswahl(zustand ? vorauswahl(zustand.sitzung.geschosse) : new Set())
    setLeereZeigen(false)
    setSchnitthoeheText(formatHoehe(IFC_SCHNITTHOEHE_VORGABE))
    setAusrichten(true)
    setFortschritt(null)
    setFehler(null)
    setVorschauZiel(null)
    setVorschau(null)
    setFreieSchnitte([])
    setAusgeblendet(new Set())
  }

  const schnitthoeheVorschau = liesZahl(schnitthoeheText)
  let vorschauAuftrag: { geschossId: number } | { freieHoehe: number } | null = null
  let vorschauHoehe: number | null = null
  if (vorschauZiel?.startsWith('g:')) {
    vorschauAuftrag = { geschossId: Number(vorschauZiel.slice(2)) }
    vorschauHoehe =
      schnitthoeheVorschau !== null && schnitthoeheVorschau > 0 ? schnitthoeheVorschau : null
  } else if (vorschauZiel?.startsWith('f:')) {
    const frei = freieSchnitte.find((f) => `f:${f.id}` === vorschauZiel)
    const hoehe = frei ? liesZahl(frei.hoeheText) : null
    if (hoehe !== null) {
      vorschauAuftrag = { freieHoehe: hoehe }
      vorschauHoehe = hoehe
    }
  }
  const vorschauSchluessel =
    zustand && vorschauAuftrag && vorschauHoehe !== null
      ? `${vorschauZiel}@${vorschauHoehe}@${ausrichten && !zustand.lageVorgabe}`
      : null

  useEffect(() => {
    if (!zustand || !vorschauAuftrag || vorschauSchluessel === null) return
    const ziel = vorschauAuftrag
    let abgebrochen = false
    const zeitgeber = setTimeout(() => {
      zustand.sitzung
        .vorschau({
          ziel,
          schnitthoehe: schnitthoeheVorschau ?? 1,
          ausrichten,
          lage: zustand.lageVorgabe ?? undefined,
        })
        .then(
          (grundrisse) => {
            if (!abgebrochen)
              setVorschau({ schluessel: vorschauSchluessel, grundrisse, fehler: null })
          },
          (e: unknown) => {
            if (abgebrochen) return
            const meldung =
              e instanceof Error ? e.message : t('zeichendialoge.ifcImport.vorschauFehlgeschlagen')
            setVorschau({ schluessel: vorschauSchluessel, grundrisse: null, fehler: meldung })
          },
        )
    }, VORSCHAU_VERZOEGERUNG_MS)
    return () => {
      abgebrochen = true
      clearTimeout(zeitgeber)
    }
  }, [zustand, vorschauSchluessel, schnitthoeheVorschau, ausrichten])

  useEffect(() => {
    const canvas = vorschauCanvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = VORSCHAU_BREITE * dpr
    canvas.height = VORSCHAU_HOEHE * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, VORSCHAU_BREITE, VORSCHAU_HOEHE)
    const geschoss = vorschau?.grundrisse?.geschosse[0]
    if (vorschau?.schluessel !== vorschauSchluessel || !geschoss?.huelle) return
    const entities = sichtbareIfcEntities({
      entities: geschoss.entities,
      bauteile: geschoss.bauteile,
      ausgeblendeteGruppen: [...ausgeblendet],
    })
    zeichneIfcVorschau(ctx, entities, geschoss.huelle, VORSCHAU_BREITE, VORSCHAU_HOEHE)
  }, [vorschau, vorschauSchluessel, ausgeblendet])

  if (!zustand) return null
  const { sitzung, lageVorgabe, aktuellesBlattLeer, callback } = zustand
  const laeuft = fortschritt !== null
  const schnitthoehe = liesZahl(schnitthoeheText)
  const schnitthoeheGueltig = schnitthoehe !== null && schnitthoehe > 0 && schnitthoehe < 10
  const sichtbar = sitzung.geschosse.filter(
    (g) => leereZeigen || g.elementAnzahl > 0 || auswahl.has(g.expressId),
  )
  const leere =
    sitzung.geschosse.length - sitzung.geschosse.filter((g) => g.elementAnzahl > 0).length
  const gewaehlt = sitzung.geschosse.filter((g) => auswahl.has(g.expressId))
  const freieGueltig = freieSchnitte.every(
    (f) => f.name.trim() !== '' && liesZahl(f.hoeheText) !== null,
  )
  const anzahl = gewaehlt.length + freieSchnitte.length

  function schnittHinzufuegen() {
    const id = naechsteSchnittId.current++
    const angesehen = vorschauZiel?.startsWith('g:')
      ? sitzung.geschosse.find((g) => `g:${g.expressId}` === vorschauZiel)
      : undefined
    const letzte =
      freieSchnitte.length > 0 ? liesZahl(freieSchnitte[freieSchnitte.length - 1].hoeheText) : null
    const hoehe = angesehen
      ? angesehen.kote + (schnitthoehe ?? 1)
      : letzte !== null
        ? letzte + 3
        : (schnitthoehe ?? 1)
    setFreieSchnitte((bisher) => [
      ...bisher,
      { id, name: `Schnitt ${bisher.length + 1}`, hoeheText: formatHoehe(hoehe) },
    ])
    setVorschauZiel(`f:${id}`)
  }

  function schnittAendern(id: number, aenderung: Partial<FreierSchnitt>) {
    setFreieSchnitte((bisher) => bisher.map((f) => (f.id === id ? { ...f, ...aenderung } : f)))
  }

  function schnittEntfernen(id: number) {
    setFreieSchnitte((bisher) => bisher.filter((f) => f.id !== id))
    if (vorschauZiel === `f:${id}`) setVorschauZiel(null)
  }

  function schliesse() {
    sitzung.schliesse()
    useUiStore.getState().schliesseHintergrundIfcImportDialog()
  }

  function abbrechen() {
    callback(null)
    schliesse()
  }

  function gruppeUmschalten(gruppe: IfcBauteilGruppe) {
    setAusgeblendet((bisher) => {
      const neu = new Set(bisher)
      if (neu.has(gruppe)) neu.delete(gruppe)
      else neu.add(gruppe)
      return neu
    })
  }

  function umschalten(id: number) {
    setAuswahl((bisher) => {
      const neu = new Set(bisher)
      if (neu.has(id)) neu.delete(id)
      else neu.add(id)
      return neu
    })
  }

  async function uebernehmen() {
    if (anzahl === 0 || !schnitthoeheGueltig || schnitthoehe === null || !freieGueltig) return
    const freie = freieSchnitte.map((f) => ({
      name: f.name.trim(),
      hoehe: liesZahl(f.hoeheText) as number,
    }))
    setFehler(null)
    setFortschritt({ erledigt: 0, gesamt: anzahl })
    try {
      const grundrisse = await sitzung.importiere(
        {
          geschossIds: gewaehlt.map((g) => g.expressId),
          freieHoehen: freie.map((f) => f.hoehe),
          schnitthoehe,
          ausrichten,
          lage: lageVorgabe ?? undefined,
        },
        (erledigt, gesamt) => setFortschritt({ erledigt, gesamt }),
      )
      callback({
        grundrisse,
        geschosse: gewaehlt,
        freieSchnitte: freie,
        schnitthoehe,
        ausgeblendeteGruppen: sitzung.gruppen
          .map((g) => g.gruppe)
          .filter((g) => ausgeblendet.has(g)),
      })
      schliesse()
    } catch (e) {
      if (useUiStore.getState().hintergrundIfcImportDialog !== zustand) return
      setFortschritt(null)
      setFehler(e instanceof Error ? e.message : t('zeichendialoge.ifcImport.fehlgeschlagen'))
    }
  }

  const ziel =
    anzahl === 1 && aktuellesBlattLeer
      ? t('zeichendialoge.ifcImport.zielAktuellesBlatt')
      : anzahl === 1
        ? t('zeichendialoge.ifcImport.zielAusrichten')
        : t('zeichendialoge.ifcImport.zielNeueBlaetter', { n: anzahl })

  return (
    <div className="dialog-overlay">
      <div className="dialog dialog-ifc">
        <h2>{t('zeichendialoge.ifcImport.titel')}</h2>
        <p className="dialog-hinweis">
          {t('zeichendialoge.ifcImport.hinweis', {
            datei: sitzung.dateiname,
            groesse: formatiereZahl(sitzung.groesse / (1024 * 1024), {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }),
          })}
        </p>

        <div className="ifc-auswahl">
          <div className="ifc-geschosse">
            {sichtbar.map((g) => (
              <div
                key={g.expressId}
                className={`ifc-geschoss-zeile${vorschauZiel === `g:${g.expressId}` ? ' aktiv' : ''}`}
              >
                <input
                  type="checkbox"
                  aria-label={t('zeichendialoge.ifcImport.geschossUebernehmen', { name: g.name })}
                  checked={auswahl.has(g.expressId)}
                  disabled={laeuft}
                  onChange={() => umschalten(g.expressId)}
                />
                <button
                  type="button"
                  className="ifc-geschoss-wahl"
                  title={t('zeichendialoge.ifcImport.vorschauZeigen')}
                  onClick={() => setVorschauZiel(`g:${g.expressId}`)}
                >
                  <span className="ifc-geschoss-name">{g.name}</span>
                  <span className="ifc-geschoss-kote">{formatKote(g.kote)}</span>
                  <span className="ifc-geschoss-anzahl">
                    {t('zeichendialoge.ifcImport.elemente', { n: g.elementAnzahl })}
                  </span>
                </button>
              </div>
            ))}
            {sichtbar.length === 0 && (
              <p className="dialog-hinweis">{t('zeichendialoge.ifcImport.keineGeschosse')}</p>
            )}
          </div>
          <div className="ifc-vorschau" aria-label={t('zeichendialoge.ifcImport.vorschauAria')}>
            <canvas
              ref={vorschauCanvasRef}
              style={{ width: VORSCHAU_BREITE, height: VORSCHAU_HOEHE }}
            />
            <span className="ifc-vorschau-hinweis">
              {vorschauZiel === null
                ? t('zeichendialoge.ifcImport.geschossAnklicken')
                : vorschau?.schluessel !== vorschauSchluessel
                  ? t('zeichendialoge.ifcImport.vorschauWirdBerechnet')
                  : vorschau?.fehler
                    ? vorschau.fehler
                    : !vorschau?.grundrisse?.geschosse[0]?.huelle
                      ? t('zeichendialoge.ifcImport.nichtsGeschnitten')
                      : ''}
            </span>
          </div>
        </div>

        <div className="dialog-knopfreihe">
          <button
            type="button"
            disabled={laeuft}
            onClick={() => setAuswahl(new Set(sichtbar.map((g) => g.expressId)))}
          >
            {t('zeichendialoge.ifcImport.alle')}
          </button>
          <button type="button" disabled={laeuft} onClick={() => setAuswahl(new Set())}>
            {t('zeichendialoge.ifcImport.keine')}
          </button>
        </div>
        {leere > 0 && (
          <label className="dialog-feld-checkbox">
            <input
              type="checkbox"
              checked={leereZeigen}
              disabled={laeuft}
              onChange={(e) => setLeereZeigen(e.target.checked)}
            />
            {t('zeichendialoge.ifcImport.leereAnzeigen', { n: leere })}
          </label>
        )}

        {sitzung.gruppen.length > 0 && (
          <div className="ifc-gruppen">
            <h3>{t('zeichendialoge.ifcImport.bauteile')}</h3>
            {sitzung.gruppen.map((g) => (
              <label key={g.gruppe} className="dialog-feld-checkbox ifc-gruppe">
                <input
                  type="checkbox"
                  checked={!ausgeblendet.has(g.gruppe)}
                  disabled={laeuft}
                  onChange={() => gruppeUmschalten(g.gruppe)}
                />
                <span>
                  {ifcGruppeInfo(g.gruppe).name} – {g.anzahl}
                  <span className="ifc-gruppe-klassen">
                    {' '}
                    (
                    {g.klassen
                      .map((k) => `${k.klasse.replace(/^Ifc/i, '')} ${k.anzahl}`)
                      .join(', ')}
                    )
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="ifc-freie-schnitte">
          <h3>{t('zeichendialoge.ifcImport.eigeneSchnitte')}</h3>
          <p className="dialog-hinweis">{t('zeichendialoge.ifcImport.eigeneSchnitteHinweis')}</p>
          {freieSchnitte.map((f) => (
            <div
              key={f.id}
              className={`ifc-freier-schnitt${vorschauZiel === `f:${f.id}` ? ' aktiv' : ''}`}
            >
              <input
                type="text"
                aria-label={t('zeichendialoge.ifcImport.schnittName')}
                value={f.name}
                disabled={laeuft}
                onChange={(e) => schnittAendern(f.id, { name: e.target.value })}
              />
              <input
                type="text"
                inputMode="decimal"
                aria-label={t('zeichendialoge.ifcImport.schnittHoehe')}
                className="ifc-freier-schnitt-hoehe"
                value={f.hoeheText}
                disabled={laeuft}
                onChange={(e) => schnittAendern(f.id, { hoeheText: e.target.value })}
              />
              <span>m</span>
              <button type="button" disabled={laeuft} onClick={() => setVorschauZiel(`f:${f.id}`)}>
                {t('zeichendialoge.ifcImport.vorschau')}
              </button>
              <button
                type="button"
                aria-label={t('zeichendialoge.ifcImport.schnittEntfernen')}
                title={t('zeichendialoge.ifcImport.schnittEntfernen')}
                disabled={laeuft}
                onClick={() => schnittEntfernen(f.id)}
              >
                ×
              </button>
            </div>
          ))}
          <div className="dialog-knopfreihe">
            <button type="button" disabled={laeuft} onClick={schnittHinzufuegen}>
              {t('zeichendialoge.ifcImport.schnittHinzufuegen')}
            </button>
          </div>
          {!freieGueltig && (
            <p className="dialog-hinweis">{t('zeichendialoge.ifcImport.schnittUnvollstaendig')}</p>
          )}
        </div>

        <label className="dialog-feld">
          {t('zeichendialoge.ifcImport.schnitthoehe')}
          <input
            type="text"
            inputMode="decimal"
            value={schnitthoeheText}
            disabled={laeuft}
            onChange={(e) => setSchnitthoeheText(e.target.value)}
          />
        </label>
        {!schnitthoeheGueltig && (
          <p className="dialog-hinweis">{t('zeichendialoge.ifcImport.hoeheUngueltig')}</p>
        )}

        <label className="dialog-feld-checkbox">
          <input
            type="checkbox"
            checked={lageVorgabe ? false : ausrichten}
            disabled={laeuft || lageVorgabe !== null}
            onChange={(e) => setAusrichten(e.target.checked)}
          />
          {t('zeichendialoge.ifcImport.ausrichten')}
        </label>
        {lageVorgabe && (
          <p className="dialog-hinweis">{t('zeichendialoge.ifcImport.lageVorgabe')}</p>
        )}

        {anzahl > 0 && <p className="dialog-hinweis">{ziel}</p>}

        {fortschritt && (
          <div className="ifc-fortschritt">
            <progress value={fortschritt.erledigt} max={fortschritt.gesamt} />
            <span>
              {fortschritt.erledigt < fortschritt.gesamt
                ? t('zeichendialoge.ifcImport.geschossWirdGeschnitten', {
                    nr: fortschritt.erledigt + 1,
                    gesamt: fortschritt.gesamt,
                  })
                : t('zeichendialoge.ifcImport.zusammenstellen')}
            </span>
          </div>
        )}
        {fehler && <p className="dialog-hinweis ifc-fehler">{fehler}</p>}

        <div className="dialog-aktionen">
          <button type="button" onClick={abbrechen}>
            {t('zeichendialoge.gemeinsam.abbrechen')}
          </button>
          <button
            type="button"
            className="primaer"
            onClick={() => void uebernehmen()}
            disabled={laeuft || anzahl === 0 || !schnitthoeheGueltig || !freieGueltig}
          >
            {t('zeichendialoge.gemeinsam.uebernehmen')}
          </button>
        </div>
      </div>
    </div>
  )
}
