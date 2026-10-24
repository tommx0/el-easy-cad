import { useState } from 'react'
import type { SettingsStore } from '../../persistence'
import { useT } from '../sprache-anbindung'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'
import { werkzeugName } from '../werkzeug-namen'

export function WerkzeugleisteEinstellungen({ settingsStore }: { settingsStore: SettingsStore }) {
  const t = useT()
  const vollstaendig = useSettingsStore((s) => s.werkzeugleisteVollstaendig)
  const ausgeblendet = useSettingsStore((s) => s.werkzeugleisteAusgeblendet)
  const eigeneReihenfolge = useSettingsStore((s) => s.werkzeugleisteReihenfolge)
  const setReihenfolge = useSettingsStore((s) => s.setWerkzeugleisteReihenfolge)
  const toggleSichtbarkeit = useSettingsStore((s) => s.toggleWerkzeugSichtbarkeit)
  const zuruecksetzen = useSettingsStore((s) => s.werkzeugleisteZuruecksetzen)

  const [ziehtId, setZiehtId] = useState<string | null>(null)
  const [zielIndex, setZielIndex] = useState<number | null>(null)

  function beendeZiehen() {
    setZiehtId(null)
    setZielIndex(null)
  }

  function ablegen(index: number) {
    const gezogen = ziehtId
    beendeZiehen()
    if (!gezogen) return
    const vonIndex = vollstaendig.indexOf(gezogen)
    if (vonIndex === -1) return
    const ziel = Math.max(0, Math.min(vollstaendig.length - 1, index))
    if (ziel === vonIndex) return
    const neu = [...vollstaendig]
    const [element] = neu.splice(vonIndex, 1)
    neu.splice(ziel, 0, element)
    setReihenfolge(settingsStore, neu)
  }

  function alleZuruecksetzen() {
    useUiStore.getState().oeffneBestaetigung({
      titel: t('verwaltungsdialoge.werkzeugleiste.zuruecksetzenTitel'),
      nachricht: t('verwaltungsdialoge.werkzeugleiste.zuruecksetzenFrage'),
      bestaetigenText: t('verwaltungsdialoge.werkzeugleiste.zuruecksetzen'),
      callback: (bestaetigt) => {
        if (bestaetigt) zuruecksetzen(settingsStore)
      },
    })
  }

  const angepasst = eigeneReihenfolge.length > 0 || ausgeblendet.length > 0

  return (
    <div className="werkzeugliste-einstellungen">
      <h3>{t('verwaltungsdialoge.werkzeugleiste.titel')}</h3>
      <p className="dialog-hinweis">{t('verwaltungsdialoge.werkzeugleiste.hinweis')}</p>
      <div className="werkzeugliste-liste">
        {vollstaendig.map((id, index) => {
          const versteckt = ausgeblendet.includes(id)
          return (
            <div
              key={id}
              className={
                `werkzeugliste-zeile${versteckt ? ' ausgeblendet' : ''}` +
                (id === ziehtId ? ' zieht' : '') +
                (zielIndex === index && ziehtId !== null && id !== ziehtId ? ' ablegeziel' : '')
              }
              draggable
              onDragStart={(e) => {
                setZiehtId(id)
                e.dataTransfer.setData('text/plain', id)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                if (!ziehtId) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setZielIndex(index)
              }}
              onDrop={(e) => {
                e.preventDefault()
                ablegen(index)
              }}
              onDragEnd={beendeZiehen}
            >
              <span className="werkzeugliste-griff" aria-hidden="true">
                ☰
              </span>
              <label className="werkzeugliste-zeile-label">
                <input
                  type="checkbox"
                  checked={!versteckt}
                  onChange={() => toggleSichtbarkeit(settingsStore, id)}
                />
                {werkzeugName(id)}
              </label>
            </div>
          )
        })}
      </div>
      <button type="button" onClick={alleZuruecksetzen} disabled={!angepasst}>
        {t('verwaltungsdialoge.werkzeugleiste.aufStandard')}
      </button>
    </div>
  )
}
