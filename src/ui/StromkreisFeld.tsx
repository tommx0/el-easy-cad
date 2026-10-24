import { stromkreisLangtext } from '../document-model'
import { useSettingsStore } from './store/settings-store'
import { useStromkreisZuordnungen } from './use-stromkreis-zuordnungen'
import { useT } from './sprache-anbindung'

export function StromkreisInfo({
  objektId,
  art,
}: {
  objektId: string
  art: 'komponente' | 'leitung'
}) {
  const t = useT()
  const anzeigen = useSettingsStore((s) => s.stromkreisImPanel)
  const liste = useStromkreisZuordnungen(objektId, art)
  if (!anzeigen || liste.length === 0) return null
  return (
    <p className="feld-info">
      {t('eigenschaften.stromkreisInfo.text', {
        zuordnungen: liste.map((z) => stromkreisLangtext(z)).join('; '),
      })}
    </p>
  )
}
