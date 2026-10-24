import { useState, type InputHTMLAttributes } from 'react'

export function TextFeldBeimVerlassen({
  wert,
  onUebernehmen,
  ...rest
}: {
  wert: string
  onUebernehmen: (wert: string) => void
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur' | 'onKeyDown'>) {
  const [entwurf, setEntwurf] = useState<string | null>(null)

  function uebernehmen() {
    if (entwurf !== null && entwurf !== wert) onUebernehmen(entwurf)
    setEntwurf(null)
  }

  return (
    <input
      {...rest}
      value={entwurf ?? wert}
      onChange={(e) => setEntwurf(e.target.value)}
      onBlur={uebernehmen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        else if (e.key === 'Escape') {
          e.stopPropagation()
          setEntwurf(null)
        }
      }}
    />
  )
}
