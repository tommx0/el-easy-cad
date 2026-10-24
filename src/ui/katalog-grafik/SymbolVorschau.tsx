import type { MouseEvent, ReactNode } from 'react'
import { symbolVorschauBreite, symbolVorschauHoehe } from './vorschau-geometrie'

interface Props {
  bildUrl: string | undefined
  breitenFaktor: number | undefined
  hoehenFaktor?: number
  onKlick?: (xAnteil: number, yAnteil: number) => void
  children?: ReactNode
}

export function SymbolVorschau({ bildUrl, breitenFaktor, hoehenFaktor, onKlick, children }: Props) {
  const breite = symbolVorschauBreite(breitenFaktor)
  const hoehe = symbolVorschauHoehe(hoehenFaktor)

  function klick(e: MouseEvent<SVGSVGElement>) {
    if (!onKlick) return
    const rect = e.currentTarget.getBoundingClientRect()
    const xAnteil = (e.clientX - rect.left) / rect.width
    const yAnteil = 1 - (e.clientY - rect.top) / rect.height
    onKlick(Math.min(1, Math.max(0, xAnteil)), Math.min(1, Math.max(0, yAnteil)))
  }

  return (
    <svg
      viewBox={`0 0 ${breite} ${hoehe}`}
      style={{ aspectRatio: `${breite} / ${hoehe}`, overflow: 'visible' }}
      className={onKlick ? 'symbol-vorschau symbol-vorschau-klickbar' : 'symbol-vorschau'}
      role="img"
      onClick={klick}
    >
      {bildUrl && (
        <image
          href={bildUrl}
          x={0}
          y={0}
          width={breite}
          height={hoehe}
          preserveAspectRatio="none"
        />
      )}
      <rect
        x={1}
        y={1}
        width={breite - 2}
        height={hoehe - 2}
        className="symbol-vorschau-gehaeuse"
      />
      {children}
    </svg>
  )
}
