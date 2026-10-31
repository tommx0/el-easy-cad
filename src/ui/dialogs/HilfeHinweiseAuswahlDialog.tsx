import { ALLE_HILFE_HINWEIS_KENNUNGEN } from '../hilfe-hinweise'
import { useT } from '../sprache-anbindung'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'
import { useAppContext } from '../use-app-context'

const LEITUNGS_HINWEISE: ReadonlySet<string> = new Set(['trunk', 'leitung'])

export function HilfeHinweiseAuswahl() {
  const t = useT()
  const { settingsStore } = useAppContext()
  const zeigen = useSettingsStore((s) => s.hilfeHinweiseZeigen)
  const setZeigen = useSettingsStore((s) => s.setHilfeHinweiseZeigen)
  const abgewaehlt = useSettingsStore((s) => s.ausgeblendeteHilfeHinweise)
  const setEinzeln = useSettingsStore((s) => s.setHilfeHinweisZeigen)
  const alleEin = useSettingsStore((s) => s.schalteAlleHilfeHinweiseEin)
  const leitungsverlegung = useSettingsStore((s) => s.leitungsverlegung)

  return (
    <>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={zeigen}
          onChange={(e) => setZeigen(settingsStore, e.target.checked)}
        />
        {t('hinweise.auswahl.hauptschalter')}
      </label>
      <p className="dialog-hinweis">{t('hinweise.auswahl.hauptschalterHinweis')}</p>
      <ul className={zeigen ? 'hilfe-hinweise-liste' : 'hilfe-hinweise-liste gedaempft'}>
        {ALLE_HILFE_HINWEIS_KENNUNGEN.map((kennung) => (
          <li key={kennung}>
            <label className="feld feld-checkbox">
              <input
                type="checkbox"
                checked={!abgewaehlt.includes(kennung)}
                disabled={!leitungsverlegung && LEITUNGS_HINWEISE.has(kennung)}
                onChange={(e) => setEinzeln(settingsStore, kennung, e.target.checked)}
              />
              {t(`hinweise.themen.${kennung}.name`)}
            </label>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => alleEin(settingsStore)}>
        {t('hinweise.auswahl.alleEin')}
      </button>
    </>
  )
}

export function HilfeHinweiseAuswahlDialog() {
  const t = useT()
  const offen = useUiStore((s) => s.hilfeHinweiseDialogOffen)
  const schliesse = () => useUiStore.getState().setHilfeHinweiseDialogOffen(false)
  if (!offen) return null

  return (
    <div className="dialog-overlay" onMouseDown={schliesse}>
      <div
        className="dialog"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') schliesse()
        }}
        role="dialog"
        aria-label={t('hinweise.auswahl.titel')}
      >
        <h2>{t('hinweise.auswahl.titel')}</h2>
        <p className="dialog-hinweis">{t('hinweise.auswahl.erklaerung')}</p>
        <HilfeHinweiseAuswahl />
        <div className="dialog-aktionen">
          <button type="button" className="primaer" autoFocus onClick={schliesse}>
            {t('hinweise.auswahl.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}
