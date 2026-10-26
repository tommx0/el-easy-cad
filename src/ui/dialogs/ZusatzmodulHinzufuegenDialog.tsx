import { useState } from 'react'
import { ungetesteteAppVersion } from '../../document-model'
import { useT } from '../sprache-anbindung'
import { useUiStore } from '../store/ui-store'
import { useAppContext } from '../use-app-context'
import { zusatzmodulText } from '../store/zusatzmodul-store'

export function ZusatzmodulHinzufuegenDialog() {
  const t = useT()
  const zustand = useUiStore((s) => s.modulHinzufuegen)
  const { zusatzmodule } = useAppContext()
  const [laeuft, setLaeuft] = useState(false)
  if (!zustand) return null
  const { manifest, installiert, vergleich } = zustand.vorschau

  function schliessen() {
    useUiStore.getState().setModulHinzufuegen(null)
  }

  async function installieren() {
    if (!zustand) return
    setLaeuft(true)
    try {
      await zusatzmodule.installiere(zustand.datei)
      const { name, version } = manifest
      useUiStore.getState().zeigeToast(t('aktionen.zusatzmodule.installiert', { name, version }))
      schliessen()
    } catch (fehler) {
      useUiStore.getState().zeigeToast(fehler instanceof Error ? fehler.message : String(fehler))
    } finally {
      setLaeuft(false)
    }
  }

  const versionsHinweis =
    vergleich === 'neuer'
      ? t('verwaltungsdialoge.zusatzmodule.ersetztAeltere', { version: installiert ?? '' })
      : vergleich === 'gleich'
        ? t('verwaltungsdialoge.zusatzmodule.gleicheVersion')
        : vergleich === 'aelter'
          ? t('verwaltungsdialoge.zusatzmodule.ersetztNeuere', { version: installiert ?? '' })
          : null
  const ungetestet = ungetesteteAppVersion(manifest, __APP_VERSION__)
  const befehle = manifest.befehle.map((b) => zusatzmodulText(undefined, b.titel)).join(', ')

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div
        className="dialog dialog-zusatzmodul-hinzufuegen"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2>{t('verwaltungsdialoge.zusatzmodule.hinzufuegenTitel')}</h2>
        <p className="zusatzmodul-kopf">
          <strong>{manifest.name}</strong>
          <span>{manifest.version}</span>
        </p>
        <p className="zusatzmodul-leise">
          {t('verwaltungsdialoge.zusatzmodule.hersteller', { hersteller: manifest.hersteller })}
        </p>
        {manifest.beschreibung && <p>{manifest.beschreibung}</p>}
        <p className="zusatzmodul-leise">
          {t('verwaltungsdialoge.zusatzmodule.befehle', { liste: befehle })}
        </p>
        {versionsHinweis && (
          <p className={vergleich === 'aelter' ? 'zusatzmodul-warnung' : undefined}>
            {versionsHinweis}
          </p>
        )}
        {ungetestet && (
          <p className="zusatzmodul-warnung">
            {t('verwaltungsdialoge.zusatzmodule.nichtGetestet', {
              bis: manifest.app.getestetBis ?? '',
              app: __APP_VERSION__,
            })}
          </p>
        )}
        <p className="zusatzmodul-zugriff">
          ⚠ {t('verwaltungsdialoge.zusatzmodule.warnungZugriff')}
        </p>
        <div className="dialog-aktionen">
          <button type="button" onClick={schliessen} disabled={laeuft}>
            {t('verwaltungsdialoge.allgemein.abbrechen')}
          </button>
          <button
            type="button"
            className="primaer"
            onClick={() => void installieren()}
            disabled={laeuft}
          >
            {vergleich === 'aelter'
              ? t('verwaltungsdialoge.zusatzmodule.aelterInstallieren')
              : t('verwaltungsdialoge.zusatzmodule.installieren')}
          </button>
        </div>
      </div>
    </div>
  )
}
