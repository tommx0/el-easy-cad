import { useT } from '../sprache-anbindung'

export function BetaEtikett() {
  const t = useT()
  return (
    <span className="beta-etikett" title={t('kopfzeile.betaFunktionTitel')}>
      BETA
    </span>
  )
}
