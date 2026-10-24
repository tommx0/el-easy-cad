import { useEffect, useRef, useState } from 'react'

export function EntwurfsTextfeld({
  wert,
  platzhalter,
  liste,
  onUebernehmen,
}: {
  wert: string
  platzhalter?: string
  liste?: string
  onUebernehmen: (wert: string) => void
}) {
  const [entwurf, setEntwurf] = useState<string | null>(null)
  const offen = useRef({ entwurf, wert, onUebernehmen })
  offen.current = { entwurf, wert, onUebernehmen }
  useEffect(
    () => () => {
      const { entwurf, wert, onUebernehmen } = offen.current
      if (entwurf !== null && entwurf !== wert) onUebernehmen(entwurf)
    },
    [],
  )
  function uebernehmen() {
    if (entwurf !== null && entwurf !== wert) onUebernehmen(entwurf)
    offen.current.entwurf = null
    setEntwurf(null)
  }
  return (
    <input
      value={entwurf ?? wert}
      placeholder={platzhalter}
      list={liste}
      onChange={(e) => setEntwurf(e.target.value)}
      onBlur={uebernehmen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          offen.current.entwurf = null
          setEntwurf(null)
        }
      }}
    />
  )
}
