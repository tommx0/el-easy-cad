import {
  abgeglicheneInstallationszonen,
  unbekannteInstallationszonen,
  type DocumentStore,
  type ZonenDefinition,
} from '../document-model'
import { useInstallationszonenStore } from './store/installationszonen-store'

export function gleicheInstallationszonenAb(
  doc: DocumentStore,
  optionen: { aufraeumen?: boolean } = {},
): void {
  const zeichnung = doc.getZeichnung()
  const abgeglichen = abgeglicheneInstallationszonen(
    zeichnung,
    useInstallationszonenStore.getState().zonen,
    optionen,
  )
  if (abgeglichen === zeichnung.installationszonen) return
  doc.updateZeichnung({ installationszonen: abgeglichen })
}

export function zonenNichtImBestand(doc: DocumentStore): ZonenDefinition[] {
  const bestand = useInstallationszonenStore.getState()
  return bestand.geladen ? unbekannteInstallationszonen(doc.getZeichnung(), bestand.zonen) : []
}
