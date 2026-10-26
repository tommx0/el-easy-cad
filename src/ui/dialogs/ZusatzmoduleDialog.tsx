import { ungetesteteAppVersion, type ZusatzmodulEintrag } from '../../document-model'
import { zusatzmodulDateiUrl } from '../../persistence'
import { formatiereDatum } from '../../sprache/format'
import { useT } from '../sprache-anbindung'
import { useUiStore } from '../store/ui-store'
import { useZusatzmodulStore } from '../store/zusatzmodul-store'
import { useAppContext } from '../use-app-context'
import { waehleZusatzmodulZumHinzufuegen } from '../zusatzmodule/hinzufuegen'

export function ZusatzmoduleDialog() {
  const t = useT()
  const modus = useUiStore((s) => s.moduleDialog)
  const eintraege = useZusatzmodulStore((s) => s.eintraege)
  const { zusatzmodule } = useAppContext()
  if (!modus) return null

  function schliessen() {
    useUiStore.getState().setModuleDialog(null)
  }

  async function mitMeldung(aufgabe: () => Promise<void>) {
    try {
      await aufgabe()
    } catch (fehler) {
      useUiStore.getState().zeigeToast(fehler instanceof Error ? fehler.message : String(fehler))
    }
  }

  function entfernen(eintrag: ZusatzmodulEintrag) {
    const { name, kennung } = eintrag.manifest
    useUiStore.getState().oeffneBestaetigung({
      titel: t('verwaltungsdialoge.zusatzmodule.entfernenTitel'),
      nachricht: t('verwaltungsdialoge.zusatzmodule.entfernenFrage', { name }),
      bestaetigenText: t('verwaltungsdialoge.zusatzmodule.entfernen'),
      callback: (bestaetigt) => {
        if (!bestaetigt) return
        void mitMeldung(async () => {
          await zusatzmodule.entferne(kennung)
          useUiStore.getState().zeigeToast(t('aktionen.zusatzmodule.entfernt', { name }))
        })
      },
    })
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-zusatzmodule" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('verwaltungsdialoge.zusatzmodule.titel')}</h2>
        <button
          type="button"
          className="zusatzmodule-hinzufuegen"
          onClick={() => void waehleZusatzmodulZumHinzufuegen()}
        >
          {t('verwaltungsdialoge.zusatzmodule.hinzufuegen')}
        </button>
        {modus === 'entfernen' && eintraege.length > 0 && (
          <p className="zusatzmodule-hinweis">
            {t('verwaltungsdialoge.zusatzmodule.entfernenHinweis')}
          </p>
        )}
        {eintraege.length === 0 ? (
          <p className="zusatzmodule-leer">{t('verwaltungsdialoge.zusatzmodule.leer')}</p>
        ) : (
          <ul className="zusatzmodule-liste">
            {eintraege.map((eintrag) => {
              const { manifest } = eintrag
              const ungetestet = ungetesteteAppVersion(manifest, __APP_VERSION__)
              return (
                <li key={manifest.kennung} className="zusatzmodul-zeile">
                  <label
                    className="zusatzmodul-aktiv"
                    title={t('verwaltungsdialoge.zusatzmodule.aktiv')}
                  >
                    <input
                      type="checkbox"
                      checked={eintrag.aktiv}
                      aria-label={t('verwaltungsdialoge.zusatzmodule.aktiv')}
                      onChange={(e) => {
                        const aktiv = e.target.checked
                        void mitMeldung(() => zusatzmodule.setzeAktiv(manifest.kennung, aktiv))
                      }}
                    />
                  </label>
                  <span className="zusatzmodul-icon">
                    {manifest.icon && (
                      <img
                        src={zusatzmodulDateiUrl(manifest.kennung, manifest.version, manifest.icon)}
                        alt=""
                      />
                    )}
                  </span>
                  <div className="zusatzmodul-angaben">
                    <div className="zusatzmodul-kopf">
                      <strong>{manifest.name}</strong>
                      <span>{manifest.version}</span>
                      <span>{manifest.hersteller}</span>
                    </div>
                    {manifest.beschreibung && <div>{manifest.beschreibung}</div>}
                    <div className="zusatzmodul-leise">
                      {t('verwaltungsdialoge.zusatzmodule.installiertAm', {
                        datum: formatiereDatum(eintrag.installiertAm),
                      })}
                    </div>
                    {ungetestet && (
                      <div className="zusatzmodul-warnung">
                        ⚠{' '}
                        {t('verwaltungsdialoge.zusatzmodule.ungetestet', { app: __APP_VERSION__ })}
                      </div>
                    )}
                    {eintrag.fehler && (
                      <div className="zusatzmodul-warnung">
                        {t('verwaltungsdialoge.zusatzmodule.abgeschaltet', {
                          fehler: eintrag.fehler,
                        })}{' '}
                        <button
                          type="button"
                          className="link-knopf"
                          onClick={() => useUiStore.getState().setFehlerprotokollDialogOffen(true)}
                        >
                          {t('verwaltungsdialoge.zusatzmodule.fehlerprotokoll')}
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className={modus === 'entfernen' ? 'gefahr' : undefined}
                    onClick={() => entfernen(eintrag)}
                  >
                    {t('verwaltungsdialoge.zusatzmodule.entfernen')}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <div className="dialog-aktionen">
          <span className="zusatzmodul-leise">
            {t('verwaltungsdialoge.zusatzmodule.aktivHinweis')}
          </span>
          <button type="button" className="primaer" onClick={schliessen}>
            {t('verwaltungsdialoge.allgemein.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}
