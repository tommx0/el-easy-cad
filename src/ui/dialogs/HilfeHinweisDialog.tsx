import { useEffect } from 'react'
import { rendereMarkdown } from '../handbuch/markdown'
import { hilfeHinweisAnker, istHilfeHinweis, type HilfeHinweisKennung } from '../hilfe-hinweise'
import { useT } from '../sprache-anbindung'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'
import { useAppContext } from '../use-app-context'

export function HilfeHinweisDialog() {
  const kennung = useUiStore((s) => s.hinweisWarteschlange[0])
  const schliesse = useUiStore((s) => s.schliesseHilfeHinweis)
  const bekannt = kennung !== undefined && istHilfeHinweis(kennung)

  useEffect(() => {
    if (kennung !== undefined && !bekannt) schliesse()
  }, [kennung, bekannt, schliesse])

  if (kennung === undefined || !istHilfeHinweis(kennung)) return null
  return <Hinweis kennung={kennung} schliesse={schliesse} />
}

function Hinweis({ kennung, schliesse }: { kennung: HilfeHinweisKennung; schliesse: () => void }) {
  const t = useT()
  const { settingsStore } = useAppContext()
  const belegung = useSettingsStore((s) => s.belegung)
  const abgewaehlt = useSettingsStore((s) => s.ausgeblendeteHilfeHinweise.includes(kennung))
  const setZeigen = useSettingsStore((s) => s.setHilfeHinweisZeigen)
  const anker = hilfeHinweisAnker(kennung)

  const zumHandbuch = (ziel: string) => {
    schliesse()
    useUiStore.getState().setHandbuchDialog({ anker: ziel })
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliesse}>
      <div
        className="dialog dialog-hilfe-hinweis"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') schliesse()
        }}
        role="dialog"
        aria-label={t(`hinweise.themen.${kennung}.titel`)}
      >
        <h2>{t(`hinweise.themen.${kennung}.titel`)}</h2>
        <div className="hilfe-hinweis-text">
          {rendereMarkdown(t(`hinweise.themen.${kennung}.text`), {
            belegung,
            aufAnker: zumHandbuch,
          })}
        </div>
        <div className="dialog-hinweis hilfe-hinweis-fuss">
          {rendereMarkdown(t('hinweise.dialog.wiederEinschalten'), { belegung })}
        </div>
        <div className="dialog-aktionen hilfe-hinweis-aktionen">
          <label className="feld feld-checkbox">
            <input
              type="checkbox"
              checked={abgewaehlt}
              onChange={(e) => setZeigen(settingsStore, kennung, !e.target.checked)}
            />
            {t('hinweise.dialog.nichtMehrZeigen')}
          </label>
          <span className="hilfe-hinweis-abstand" />
          {anker && (
            <button type="button" onClick={() => zumHandbuch(anker)}>
              {t('hinweise.dialog.handbuch')}
            </button>
          )}
          <button type="button" className="primaer" autoFocus onClick={schliesse}>
            {t('hinweise.dialog.verstanden')}
          </button>
        </div>
      </div>
    </div>
  )
}
