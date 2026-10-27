import { useEffect, useRef } from 'react'
import { useAktivesBlatt, useAppContext } from './use-app-context'

export function useBlattFolgen(optionen: {
  blattIds: readonly string[]
  aktuellesBlattId: string
  springeZu: (index: number) => void
  schliessen: () => void
}) {
  const { doc } = useAppContext()
  const aktiv = useAktivesBlatt()
  const { blattIds, aktuellesBlattId } = optionen
  const soll = useRef(aktuellesBlattId)
  soll.current = aktuellesBlattId
  const rueckruf = useRef(optionen)
  rueckruf.current = optionen

  useEffect(() => {
    if (doc.getZeichnung().aktivesBlattId !== aktuellesBlattId)
      doc.setAktivesBlatt(aktuellesBlattId)
  }, [aktuellesBlattId, doc])

  const vorher = useRef(aktiv.id)
  useEffect(() => {
    if (vorher.current === aktiv.id) return
    vorher.current = aktiv.id
    if (aktiv.id === soll.current) return
    const index = blattIds.indexOf(aktiv.id)
    if (index >= 0) rueckruf.current.springeZu(index)
    else rueckruf.current.schliessen()
  }, [aktiv.id, blattIds])
}
