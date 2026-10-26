import { useFreigeschalteteModule } from '../lizenz-module'
import { useEffect, useState } from 'react'
import type { SettingsStore } from '../../persistence'
import {
  befehleMitModulen,
  BEFEHL_NACH_ID,
  befehlName,
  gruppenName,
  werkzeugTastenHinweis,
  type BefehlGruppe,
} from '../befehle/katalog'
import { anzeige, normalform, sperrgrund, taste } from '../befehle/kuerzel'
import { useT } from '../sprache-anbindung'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'

const GRUPPEN: BefehlGruppe[] = [
  'werkzeuge',
  'datei',
  'bearbeiten',
  'blatt',
  'ansicht',
  'katalog',
  'extras',
  'module',
  'hilfe',
]

interface Konflikt {
  befehlId: string
  kuerzel: string
  bisherigerId: string
}

export function TastenkuerzelEinstellungen({ settingsStore }: { settingsStore: SettingsStore }) {
  const t = useT()
  const module = useFreigeschalteteModule()
  const belegung = useSettingsStore((s) => s.belegung)
  const abweichungen = useSettingsStore((s) => s.tastenkuerzel)
  const setKuerzel = useSettingsStore((s) => s.setKuerzel)
  const zuruecksetzen = useSettingsStore((s) => s.kuerzelZuruecksetzen)
  const [aufnahmeFuer, setAufnahmeFuer] = useState<string | null>(null)
  const [konflikt, setKonflikt] = useState<Konflikt | null>(null)
  const [meldung, setMeldung] = useState<string | null>(null)
  const [suche, setSuche] = useState('')

  useEffect(() => {
    if (!konflikt) return
    document.querySelector('.kuerzel-konflikt')?.scrollIntoView({ block: 'nearest' })
  }, [konflikt])

  useEffect(() => {
    if (!aufnahmeFuer) return
    document.querySelector<HTMLButtonElement>('.kuerzel-feld.aufnahme')?.focus()
  }, [aufnahmeFuer])

  function beende() {
    setAufnahmeFuer(null)
  }

  function weiseZu(befehlId: string, kuerzel: string) {
    setKuerzel(settingsStore, befehlId, kuerzel)
    const hinweis = werkzeugTastenHinweis(taste(kuerzel))
    setMeldung(hinweis)
    setKonflikt(null)
    beende()
  }

  function aufTaste(befehlId: string, e: React.KeyboardEvent) {
    const kuerzel = normalform(e)
    if (!kuerzel) return // reiner Modifikator - weiter warten
    e.preventDefault()
    e.stopPropagation()
    setMeldung(null)
    const grund = sperrgrund(kuerzel)
    if (grund) {
      setMeldung(
        t('verwaltungsdialoge.tastenkuerzel.nichtVergebbar', { kuerzel: anzeige(kuerzel), grund }),
      )
      beende()
      return
    }
    if (belegung[befehlId] === kuerzel) {
      beende()
      return
    }
    const bisherigerId = Object.keys(belegung).find(
      (id) => id !== befehlId && !BEFEHL_NACH_ID[id]?.kuerzelWie && belegung[id] === kuerzel,
    )
    if (bisherigerId) {
      setKonflikt({ befehlId, kuerzel, bisherigerId })
      beende()
      return
    }
    weiseZu(befehlId, kuerzel)
  }

  function alleZuruecksetzen() {
    useUiStore.getState().oeffneBestaetigung({
      titel: t('verwaltungsdialoge.tastenkuerzel.zuruecksetzenTitel'),
      nachricht: t('verwaltungsdialoge.tastenkuerzel.zuruecksetzenFrage'),
      bestaetigenText: t('verwaltungsdialoge.werkzeugleiste.zuruecksetzen'),
      callback: (bestaetigt) => {
        if (!bestaetigt) return
        zuruecksetzen(settingsStore)
        setKonflikt(null)
        setMeldung(null)
      },
    })
  }

  const gefiltert = befehleMitModulen(module).filter((befehl) => {
    if (suche.trim() === '') return true
    const kuerzel = belegung[befehl.id]
    const text = `${befehlName(befehl.id)} ${kuerzel ? anzeige(kuerzel) : ''}`.toLowerCase()
    return text.includes(suche.trim().toLowerCase())
  })

  return (
    <div className="kuerzel-einstellungen">
      <h3>{t('verwaltungsdialoge.tastenkuerzel.titel')}</h3>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.tastenkuerzel.suchen')}
        <input
          type="search"
          value={suche}
          placeholder={t('verwaltungsdialoge.tastenkuerzel.suchePlatzhalter')}
          onChange={(e) => setSuche(e.target.value)}
        />
      </label>
      {meldung && <p className="dialog-hinweis kuerzel-meldung">{meldung}</p>}

      <div className="kuerzel-liste">
        {GRUPPEN.map((gruppe) => {
          const zeilen = gefiltert.filter((befehl) => befehl.gruppe === gruppe)
          if (zeilen.length === 0) return null
          return (
            <div key={gruppe} className="kuerzel-gruppe">
              <h4>{gruppenName(gruppe)}</h4>
              {zeilen.map((befehl) => {
                const kuerzel = belegung[befehl.id]
                const geaendert = befehl.id in abweichungen
                const nimmtAuf = aufnahmeFuer === befehl.id
                return (
                  <div key={befehl.id} className={`kuerzel-zeile${geaendert ? ' geaendert' : ''}`}>
                    <span className="kuerzel-zeile-label">{befehlName(befehl.id)}</span>
                    {befehl.festeAnzeige ? (
                      <span
                        className="kuerzel-fest"
                        title={t('verwaltungsdialoge.tastenkuerzel.fest')}
                      >
                        {befehl.festeAnzeige}
                      </span>
                    ) : befehl.kuerzelWie ? (
                      <span
                        className="kuerzel-fest"
                        title={t('verwaltungsdialoge.tastenkuerzel.wieTitel', {
                          befehl: befehlName(befehl.kuerzelWie),
                        })}
                      >
                        {t('verwaltungsdialoge.tastenkuerzel.wie', {
                          kuerzel: kuerzel ? anzeige(kuerzel) : '—',
                          befehl: befehlName(befehl.kuerzelWie),
                        })}
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`kuerzel-feld${nimmtAuf ? ' aufnahme' : ''}`}
                          onClick={() => {
                            setKonflikt(null)
                            setMeldung(null)
                            setAufnahmeFuer(nimmtAuf ? null : befehl.id)
                          }}
                          onBlur={() => nimmtAuf && beende()}
                          onKeyDown={(e) => nimmtAuf && aufTaste(befehl.id, e)}
                        >
                          {nimmtAuf
                            ? t('verwaltungsdialoge.tastenkuerzel.tasteDruecken')
                            : kuerzel
                              ? anzeige(kuerzel)
                              : '—'}
                        </button>
                        <button
                          type="button"
                          className="kuerzel-knopf"
                          title={t('verwaltungsdialoge.tastenkuerzel.entfernen')}
                          aria-label={t('verwaltungsdialoge.tastenkuerzel.entfernenVon', {
                            befehl: befehlName(befehl.id),
                          })}
                          disabled={!kuerzel}
                          onClick={() => setKuerzel(settingsStore, befehl.id, null)}
                        >
                          ✕
                        </button>
                        <button
                          type="button"
                          className="kuerzel-knopf"
                          title={t('verwaltungsdialoge.werkzeugleiste.aufStandard')}
                          aria-label={t('verwaltungsdialoge.tastenkuerzel.standardVon', {
                            befehl: befehlName(befehl.id),
                          })}
                          disabled={!geaendert}
                          onClick={() => zuruecksetzen(settingsStore, befehl.id)}
                        >
                          ↺
                        </button>
                      </>
                    )}
                    {konflikt?.befehlId === befehl.id && (
                      <div className="kuerzel-konflikt" role="alert">
                        <span>
                          {t('verwaltungsdialoge.tastenkuerzel.konflikt', {
                            kuerzel: anzeige(konflikt.kuerzel),
                            befehl: befehlName(konflikt.bisherigerId),
                          })}
                        </span>
                        <button
                          type="button"
                          className="primaer"
                          onClick={() => weiseZu(konflikt.befehlId, konflikt.kuerzel)}
                        >
                          {t('verwaltungsdialoge.tastenkuerzel.zuweisen')}
                        </button>
                        <button type="button" onClick={() => setKonflikt(null)}>
                          {t('verwaltungsdialoge.allgemein.abbrechen')}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <p className="dialog-hinweis">{t('verwaltungsdialoge.tastenkuerzel.hinweis')}</p>
      <button
        type="button"
        onClick={alleZuruecksetzen}
        disabled={Object.keys(abweichungen).length === 0}
      >
        {t('verwaltungsdialoge.tastenkuerzel.alleZuruecksetzen')}
      </button>
    </div>
  )
}
