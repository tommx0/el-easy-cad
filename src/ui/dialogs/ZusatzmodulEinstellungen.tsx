import { useEffect, useState } from 'react'
import type { ZusatzmodulEntwicklung } from '../../document-model'
import { leseZusatzmodulEntwicklung, setzeZusatzmodulEntwicklung } from '../../persistence'
import { useT } from '../sprache-anbindung'
import { useAppContext } from '../use-app-context'

export function ZusatzmodulEinstellungen() {
  const t = useT()
  const { zusatzmodule } = useAppContext()
  const [stand, setStand] = useState<ZusatzmodulEntwicklung | null>(null)
  const [ordner, setOrdner] = useState('')
  const [fehler, setFehler] = useState<string | null>(null)

  useEffect(() => {
    let aktiv = true
    leseZusatzmodulEntwicklung()
      .then((wert) => {
        if (!aktiv) return
        setStand(wert)
        setOrdner(wert.ordner)
      })
      .catch((f: unknown) => aktiv && setFehler(f instanceof Error ? f.message : String(f)))
    return () => {
      aktiv = false
    }
  }, [])

  async function speichere(neu: Pick<ZusatzmodulEntwicklung, 'aktiv' | 'ordner'>) {
    setFehler(null)
    try {
      setStand(await setzeZusatzmodulEntwicklung(neu))
      await zusatzmodule.ladeNeu()
    } catch (f) {
      setFehler(f instanceof Error ? f.message : String(f))
    }
  }

  if (!stand) {
    return fehler ? <p className="produktlizenz-sperre-fehler">{fehler}</p> : null
  }

  return (
    <div className="zusatzmodul-einstellungen">
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.zusatzmodulEinstellungen.einleitung')}
      </p>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={stand.aktiv}
          onChange={(e) => void speichere({ aktiv: e.target.checked, ordner })}
        />
        {t('verwaltungsdialoge.zusatzmodulEinstellungen.entwicklermodus')}
      </label>
      <label className="feld">
        {t('verwaltungsdialoge.zusatzmodulEinstellungen.ordner')}
        <input
          type="text"
          value={ordner}
          spellCheck={false}
          placeholder="~/…/mein-modul"
          onChange={(e) => setOrdner(e.target.value)}
          onBlur={() => {
            if (ordner !== stand.ordner) void speichere({ aktiv: stand.aktiv, ordner })
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void speichere({ aktiv: stand.aktiv, ordner })
          }}
        />
      </label>
      <p className="dialog-hinweis">
        {stand.modul
          ? t('verwaltungsdialoge.zusatzmodulEinstellungen.gefunden', {
              name: stand.modul.name,
              version: stand.modul.version,
            })
          : (stand.fehler ?? t('verwaltungsdialoge.zusatzmodulEinstellungen.keinOrdner'))}
      </p>
      {stand.aktiv && stand.modul && (
        <div className="dialog-knopfreihe">
          <button type="button" onClick={() => void speichere({ aktiv: true, ordner })}>
            {t('verwaltungsdialoge.zusatzmodulEinstellungen.neuLaden')}
          </button>
        </div>
      )}
      {fehler && <p className="produktlizenz-sperre-fehler">{fehler}</p>}
      <p className="dialog-hinweis">{t('verwaltungsdialoge.zusatzmodulEinstellungen.hinweis')}</p>
    </div>
  )
}
