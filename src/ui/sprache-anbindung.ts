import { useSyncExternalStore } from 'react'
import {
  beobachteOberflaechensprache,
  erzeugeUebersetzer,
  oberflaechensprache,
  setzeOberflaechensprache,
  wirksameOberflaechensprache,
} from '../sprache'
import type { Sprache, Uebersetzer } from '../sprache'
import { useSettingsStore } from './store/settings-store'

export function systemKennung(): string | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.language
}

export function verbindeSpracheMitEinstellungen(): () => void {
  const abgleichen = () =>
    setzeOberflaechensprache(
      wirksameOberflaechensprache(useSettingsStore.getState().sprache, systemKennung()),
    )
  abgleichen()
  return useSettingsStore.subscribe(abgleichen)
}

export function useSprache(): Sprache {
  return useSyncExternalStore(beobachteOberflaechensprache, oberflaechensprache)
}

export function useT(): Uebersetzer {
  return erzeugeUebersetzer(useSprache())
}
