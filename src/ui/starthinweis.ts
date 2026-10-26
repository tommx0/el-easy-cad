import { useSettingsStore } from './store/settings-store'
import { useUiStore } from './store/ui-store'

export function useStarthinweisSichtbar(): boolean {
  const erledigt = useUiStore((s) => s.starthinweisErledigt)
  const status = useUiStore((s) => s.produktlizenzStatus)
  const geladen = useSettingsStore((s) => s.geladen)
  const gesehen = useSettingsStore((s) => s.communityHinweisVersion)

  if (erledigt || !geladen || status?.betriebsmodus !== 'demo') return false
  const lizenzProblem = status.status === 'abgelaufen' || status.status === 'ungueltig'
  return lizenzProblem || gesehen !== __APP_VERSION__
}
