import {
  aktivesRegelwerk,
  ansteuerungBezeichnung,
  regelwerkText,
  typBezeichnung,
  typDefinition,
} from '../document-model'
import type { Sprache } from '../sprache'

export function typAnzeige(kennung: string, sprache: Sprache): string {
  const definition = typDefinition(kennung)
  return definition ? regelwerkText(definition, sprache) : typBezeichnung(kennung)
}

export function ansteuerungAnzeige(kennung: string, sprache: Sprache): string {
  const art = aktivesRegelwerk().ansteuerungen.find((a) => a.kennung === kennung)
  return art ? regelwerkText(art, sprache) : ansteuerungBezeichnung(kennung)
}
