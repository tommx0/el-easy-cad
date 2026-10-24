import { useUiStore } from '../store/ui-store'
import { useT } from '../sprache-anbindung'

export function BestaettigungsDialog() {
  const zustand = useUiStore((s) => s.bestaetigung)
  const t = useT()

  if (!zustand) return null

  function bestaetigen() {
    if (!zustand) return
    useUiStore.getState().schliesseBestaetigung()
    zustand.callback(true)
  }

  function alternative() {
    if (!zustand?.alternative) return
    useUiStore.getState().schliesseBestaetigung()
    zustand.alternative.callback()
  }

  function abbrechen() {
    if (!zustand) return
    useUiStore.getState().schliesseBestaetigung()
    zustand.callback(false)
  }

  return (
    <div className="dialog-overlay" onMouseDown={abbrechen}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{zustand.titel}</h2>
        <p>{zustand.nachricht}</p>
        {zustand.liste && zustand.liste.length > 0 && (
          <ul className="dialog-liste">
            {zustand.liste.map((eintrag, i) => (
              <li key={i}>{eintrag}</li>
            ))}
          </ul>
        )}
        <div className="dialog-aktionen">
          {!zustand.ohneAbbrechen && (
            <button type="button" className="sekundaer" onClick={abbrechen}>
              {t('zeichendialoge.gemeinsam.abbrechen')}
            </button>
          )}
          {zustand.alternative && (
            <button type="button" onClick={alternative}>
              {zustand.alternative.text}
            </button>
          )}
          <button
            type="button"
            className={zustand.destruktiv === false ? '' : 'destruktiv'}
            onClick={bestaetigen}
          >
            {zustand.bestaetigenText ?? t('zeichendialoge.gemeinsam.loeschen')}
          </button>
        </div>
      </div>
    </div>
  )
}
