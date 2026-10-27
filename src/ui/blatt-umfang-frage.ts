import type { Blatt } from '../document-model'
import { t } from '../sprache'
import { useUiStore } from './store/ui-store'

export function frageBlattUmfang(optionen: {
  titel: string
  nachricht: (n: number) => string
  kandidaten: readonly Pick<Blatt, 'id' | 'name'>[]
  aktuellesBlattId: string
  starte: (blattIds: string[]) => void
}) {
  const { kandidaten, aktuellesBlattId, starte } = optionen
  if (kandidaten.length < 2) {
    starte([aktuellesBlattId])
    return
  }
  useUiStore.getState().oeffneBestaetigung({
    titel: optionen.titel,
    nachricht: optionen.nachricht(kandidaten.length),
    liste: kandidaten.map((b) =>
      b.id === aktuellesBlattId
        ? t('aktionen.befehle.umfangDiesesBlatt', { name: b.name })
        : b.name,
    ),
    bestaetigenText: t('aktionen.befehle.alleBlaetter', { n: kandidaten.length }),
    destruktiv: false,
    alternative: {
      text: t('aktionen.befehle.nurDiesesBlatt'),
      callback: () => starte([aktuellesBlattId]),
    },
    callback: (bestaetigt) => {
      if (bestaetigt) starte(kandidaten.map((b) => b.id))
    },
  })
}
