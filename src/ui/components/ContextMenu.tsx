import { useEffect, useRef } from 'react'
import { useAppContext } from '../use-app-context'
import { useUiStore } from '../store/ui-store'
import { ermittleKontextMenuEintraege } from '../kontextmenu-eintraege'
import { KontextMenuListe } from './KontextMenuListe'

export function ContextMenu() {
  const zustand = useUiStore((s) => s.kontextMenu)
  const schliessen = useUiStore((s) => s.schliesseKontextMenu)
  const umgebung = useAppContext()
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!zustand) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) schliessen()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') schliessen()
    }
    window.addEventListener('pointerdown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('pointerdown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [zustand, schliessen])

  if (!zustand) return null

  const eintraege = ermittleKontextMenuEintraege(
    zustand.art === 'mehrfachauswahl'
      ? { art: 'mehrfachauswahl', auswahlIds: useUiStore.getState().auswahlIds }
      : zustand,
    umgebung,
  )

  return (
    <div
      className="kontextmenu"
      ref={menuRef}
      style={{ left: zustand.x, top: zustand.y }}
      role="menu"
    >
      <KontextMenuListe eintraege={eintraege} schliessen={schliessen} />
    </div>
  )
}
