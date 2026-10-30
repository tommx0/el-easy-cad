import { useT } from '../sprache-anbindung'

export function PruefHinweis() {
  const t = useT()
  return (
    <p className="pruef-hinweis" role="note">
      {t('generatoren.pruefhinweis')}
    </p>
  )
}
