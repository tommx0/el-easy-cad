import { useState } from 'react'
import type { KnxAktorArt, KnxAktorDaten, KnxKanalFunktion } from '../../document-model'
import {
  aendereKnxBaugroesse,
  istPaarFunktion,
  KNX_BAUGROESSEN,
  KNX_FUNKTION_TEXT,
  KNX_KANAL_FUNKTIONEN,
  knxAktorTitel,
  knxKanalName,
  knxPaarBeginn,
  normalisiereKnxAktor,
  setzeKnxKanalBeschriftung,
  setzeKnxKanalFunktion,
  wechsleKnxArt,
} from '../../document-model'
import type { Schluessel } from '../../sprache'
import type { KnxAktorDialogZustand } from '../store/ui-store'
import { useUiStore } from '../store/ui-store'
import { useT } from '../sprache-anbindung'

export function KnxAktorDialog() {
  const zustand = useUiStore((s) => s.knxAktorDialog)
  if (!zustand) return null
  return <Inhalt key={zustandsSchluessel(zustand)} zustand={zustand} />
}

let zaehler = 0
const schluessel = new WeakMap<KnxAktorDialogZustand, number>()
function zustandsSchluessel(z: KnxAktorDialogZustand): number {
  if (!schluessel.has(z)) schluessel.set(z, ++zaehler)
  return schluessel.get(z)!
}

const ART_TEXT: Record<KnxAktorArt, Schluessel> = {
  'schalt-jalousie': 'verteilerdialoge.knxAktor.artSchaltJalousie',
  dimm: 'verteilerdialoge.knxAktor.artDimm',
}

function Inhalt({ zustand }: { zustand: KnxAktorDialogZustand }) {
  const t = useT()
  const [daten, setDaten] = useState<KnxAktorDaten>(() => normalisiereKnxAktor(zustand.daten))
  const [kennzeichen, setKennzeichen] = useState(zustand.kennzeichen ?? '')
  const mitKennzeichen = zustand.kennzeichen !== undefined
  const mitBeschriftung = zustand.mitBeschriftung !== false
  const kennzeichenSauber = kennzeichen.trim().replace(/^-+/, '')

  function schliessen(ergebnis: Parameters<KnxAktorDialogZustand['callback']>[0]) {
    useUiStore.getState().schliesseKnxAktorDialog()
    zustand.callback(ergebnis)
  }

  function bestaetigen() {
    if (mitKennzeichen && !kennzeichenSauber) return
    schliessen({
      daten: normalisiereKnxAktor(daten),
      ...(mitKennzeichen ? { kennzeichen: kennzeichenSauber } : {}),
    })
  }

  function funktionen(index: number): readonly KnxKanalFunktion[] {
    const paarMoeglich = index % 2 === 0 && index + 1 < daten.kanaele.length
    return KNX_KANAL_FUNKTIONEN[daten.art].filter((f) => paarMoeglich || !istPaarFunktion(f))
  }

  return (
    <div className="dialog-overlay" onMouseDown={() => schliessen(null)}>
      <div
        className="dialog dialog-knx-aktor"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') schliessen(null)
        }}
      >
        <h2>{zustand.titel ?? t('verteilerdialoge.knxAktor.titel')}</h2>
        <fieldset className="knx-aktor-art">
          {(Object.keys(ART_TEXT) as KnxAktorArt[]).map((art) => (
            <label key={art}>
              <input
                type="radio"
                name="knx-aktor-art"
                checked={daten.art === art}
                onChange={() => setDaten((d) => wechsleKnxArt(d, art))}
              />
              {t(ART_TEXT[art])}
            </label>
          ))}
        </fieldset>
        <div className="knx-aktor-kopf">
          <label className="dialog-feld">
            {t('verteilerdialoge.knxAktor.baugroesse')}
            <select
              value={daten.baugroesse}
              onChange={(e) => setDaten((d) => aendereKnxBaugroesse(d, Number(e.target.value)))}
            >
              {KNX_BAUGROESSEN[daten.art].map((g) => (
                <option key={g} value={g}>
                  {t('verteilerdialoge.knxAktor.fach', { n: g })}
                </option>
              ))}
            </select>
          </label>
          {mitKennzeichen && (
            <label className="dialog-feld">
              {t('verteilerdialoge.knxAktor.kennzeichen')}
              <input
                value={kennzeichen ? `-${kennzeichen.replace(/^-+/, '')}` : ''}
                onChange={(e) => setKennzeichen(e.target.value.replace(/^-+/, ''))}
                placeholder="-K1"
              />
            </label>
          )}
          <label className="dialog-feld-checkbox">
            <input
              type="checkbox"
              checked={daten.versorgungSichtbar !== false}
              onChange={(e) =>
                setDaten((d) => {
                  const { versorgungSichtbar: _alt, ...ohne } = d
                  void _alt
                  return e.target.checked ? ohne : { ...ohne, versorgungSichtbar: false }
                })
              }
            />
            {t('verteilerdialoge.knxAktor.versorgung')}
          </label>
        </div>
        <p className="dialog-hinweis">{knxAktorTitel(daten)}</p>
        <table className="knx-aktor-kanaele">
          <thead>
            <tr>
              <th>{t('verteilerdialoge.knxAktor.kanal')}</th>
              <th>{t('verteilerdialoge.knxAktor.funktion')}</th>
              {mitBeschriftung && <th>{t('verteilerdialoge.knxAktor.beschriftung')}</th>}
            </tr>
          </thead>
          <tbody>
            {daten.kanaele.map((kanal, i) => {
              const beginn = knxPaarBeginn(daten, i)
              const partner = beginn !== null && beginn !== i
              return (
                <tr key={i} className={partner ? 'knx-aktor-partner' : undefined}>
                  <td>{knxKanalName(i)}</td>
                  <td>
                    {partner ? (
                      <span>
                        └{' '}
                        {t('verteilerdialoge.knxAktor.ab', {
                          funktion: KNX_FUNKTION_TEXT[kanal.funktion],
                        })}
                      </span>
                    ) : (
                      <span className="knx-aktor-funktion">
                        <select
                          aria-label={t('verteilerdialoge.knxAktor.funktionVon', {
                            name: knxKanalName(i),
                          })}
                          value={kanal.funktion}
                          onChange={(e) =>
                            setDaten((d) =>
                              setzeKnxKanalFunktion(d, i, e.target.value as KnxKanalFunktion),
                            )
                          }
                        >
                          {funktionen(i).map((f) => (
                            <option key={f} value={f}>
                              {KNX_FUNKTION_TEXT[f]}
                            </option>
                          ))}
                        </select>
                        {beginn === i && <span>┐ {t('verteilerdialoge.knxAktor.auf')}</span>}
                      </span>
                    )}
                  </td>
                  {mitBeschriftung && (
                    <td>
                      {!partner && (
                        <input
                          aria-label={t('verteilerdialoge.knxAktor.beschriftungVon', {
                            name: knxKanalName(i),
                          })}
                          value={kanal.beschriftung ?? ''}
                          onChange={(e) =>
                            setDaten((d) => setzeKnxKanalBeschriftung(d, i, e.target.value))
                          }
                        />
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="dialog-aktionen">
          <button type="button" onClick={() => schliessen(null)}>
            {t('verteilerdialoge.allgemein.abbrechen')}
          </button>
          <button
            type="button"
            className="primaer"
            disabled={mitKennzeichen && !kennzeichenSauber}
            onClick={bestaetigen}
          >
            {zustand.bestaetigenText ?? t('verteilerdialoge.knxAktor.einfuegen')}
          </button>
        </div>
      </div>
    </div>
  )
}
