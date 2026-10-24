import { useEffect, useRef, useState } from 'react'

type BasisProps = {
  value: number | null
  onCommit: (wert: number | null) => void
  min?: number
  max?: number
  step?: number
  erlaubtLeer: boolean
  className?: string
  id?: string
  disabled?: boolean
  placeholder?: string
  ariaLabel?: string
}

function formatiere(wert: number | null): string {
  return wert === null || wert === undefined ? '' : String(wert)
}

function geklemmt(wert: number, min?: number, max?: number): number {
  let ergebnis = wert
  if (min !== undefined) ergebnis = Math.max(min, ergebnis)
  if (max !== undefined) ergebnis = Math.min(max, ergebnis)
  return ergebnis
}

function ZahlenFeldBasis({
  value,
  onCommit,
  min,
  max,
  step,
  erlaubtLeer,
  className,
  id,
  disabled,
  placeholder,
  ariaLabel,
}: BasisProps) {
  const [entwurf, setEntwurf] = useState(() => formatiere(value))
  const bearbeitetRef = useRef(false)

  useEffect(() => {
    if (!bearbeitetRef.current) setEntwurf(formatiere(value))
  }, [value])

  function uebernehmen() {
    bearbeitetRef.current = false
    const text = entwurf.trim().replace(',', '.')
    if (text === '') {
      if (erlaubtLeer) {
        if (value !== null) onCommit(null)
      } else {
        setEntwurf(formatiere(value))
      }
      return
    }
    const geparst = Number(text)
    if (!Number.isFinite(geparst)) {
      setEntwurf(formatiere(value))
      return
    }
    const wert = geklemmt(geparst, min, max)
    setEntwurf(String(wert))
    if (wert !== value) onCommit(wert)
  }

  function schrittweise(richtung: 1 | -1) {
    const basis = value ?? min ?? 0
    const wert = geklemmt(basis + richtung * (step ?? 1), min, max)
    bearbeitetRef.current = false
    setEntwurf(String(wert))
    if (wert !== value) onCommit(wert)
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      id={id}
      className={className}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={entwurf}
      onChange={(e) => {
        bearbeitetRef.current = true
        setEntwurf(e.target.value)
      }}
      onBlur={uebernehmen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          uebernehmen()
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          bearbeitetRef.current = false
          setEntwurf(formatiere(value))
          e.currentTarget.blur()
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          schrittweise(1)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          schrittweise(-1)
        }
      }}
    />
  )
}

type ZahlenFeldProps = {
  value: number
  onCommit: (wert: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  id?: string
  disabled?: boolean
  placeholder?: string
  ariaLabel?: string
}

export function ZahlenFeld({ value, onCommit, ...rest }: ZahlenFeldProps) {
  return (
    <ZahlenFeldBasis
      {...rest}
      value={value}
      erlaubtLeer={false}
      onCommit={(wert) => {
        if (wert !== null) onCommit(wert)
      }}
    />
  )
}

type ZahlenFeldOptionalProps = {
  value: number | null | undefined
  onCommit: (wert: number | null) => void
  min?: number
  max?: number
  step?: number
  className?: string
  id?: string
  disabled?: boolean
  placeholder?: string
  ariaLabel?: string
}

export function ZahlenFeldOptional({ value, ...rest }: ZahlenFeldOptionalProps) {
  return <ZahlenFeldBasis {...rest} value={value ?? null} erlaubtLeer={true} />
}
