import { useState, type ReactNode } from 'react'
import type { KontextMenuEintrag } from '../kontextmenu-eintraege'

export function KontextMenuListe({
  eintraege,
  schliessen,
}: {
  eintraege: readonly KontextMenuEintrag[]
  schliessen: () => void
}) {
  return eintraege.map((eintrag) =>
    eintrag.untermenue && !eintrag.deaktiviert ? (
      <Untermenue key={eintrag.id} titel={eintrag.label}>
        <KontextMenuListe eintraege={eintrag.untermenue} schliessen={schliessen} />
      </Untermenue>
    ) : (
      <button
        key={eintrag.id}
        type="button"
        role={eintrag.gewaehlt === undefined ? 'menuitem' : 'menuitemradio'}
        aria-checked={eintrag.gewaehlt}
        className={eintrag.gewaehlt ? 'kontextmenu-gewaehlt' : undefined}
        disabled={eintrag.deaktiviert}
        title={eintrag.hinweis}
        onClick={() => {
          schliessen()
          eintrag.ausfuehren?.()
        }}
      >
        {eintrag.label}
      </button>
    ),
  )
}

const UNTERMENUE_BREITE_PX = 210

function Untermenue({ titel, children }: { titel: string; children: ReactNode }) {
  const [richtung, setRichtung] = useState({ nachOben: false, nachLinks: false })

  return (
    <div
      className="kontextmenu-untermenue-container"
      onMouseEnter={(e) => {
        const rechteck = e.currentTarget.getBoundingClientRect()
        setRichtung({
          nachOben: rechteck.top > window.innerHeight / 2,
          nachLinks: rechteck.right + UNTERMENUE_BREITE_PX > window.innerWidth,
        })
      }}
    >
      <button type="button" role="menuitem">
        {titel}
      </button>
      <div
        className={`kontextmenu-untermenue${richtung.nachOben ? ' nach-oben' : ''}${
          richtung.nachLinks ? ' nach-links' : ''
        }`}
        role="menu"
      >
        {children}
      </div>
    </div>
  )
}
