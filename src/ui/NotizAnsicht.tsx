import { useSyncExternalStore } from 'react'
import { useT } from './sprache-anbindung'
import { useAppContext } from './use-app-context'

export function NotizAnsicht() {
  const t = useT()
  const { sitzung } = useAppContext()
  const text = useSyncExternalStore(sitzung.subscribe, () => sitzung.getNotizText())

  return (
    <main className="notiz-ansicht" aria-label={t('verwaltungsdialoge.notizAnsicht.notiz')}>
      <textarea
        className="notiz-feld"
        value={text}
        placeholder={t('verwaltungsdialoge.notizAnsicht.platzhalter')}
        onChange={(e) => sitzung.setzeNotizText(e.target.value)}
      />
    </main>
  )
}
