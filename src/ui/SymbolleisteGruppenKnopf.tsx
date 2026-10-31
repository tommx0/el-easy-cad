import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Aktionskarte } from './befehle/aktionen'
import { befehlNachId, befehlName } from './befehle/katalog'
import { anzeige } from './befehle/kuerzel'
import { BefehlIcon } from './befehle/BefehlIcon'
import { IconHaken, IconPfeilUnten } from './components/Icons'
import { useSettingsStore } from './store/settings-store'
import { gruppenAnzeigeName, type SymbolleistenGruppe } from './symbolleiste-reihenfolge'
import {
  istUmschalter,
  umzuschaltende,
  zeigtAlleSchalter,
  type GruppenUmschalter,
} from './symbolleiste-umschalter'
import { useT } from './sprache-anbindung'
import { useAlleUmschalten } from './use-alle-umschalten'

interface Props {
  gruppe: SymbolleistenGruppe
  befehle: Aktionskarte
}

export function SymbolleisteGruppenKnopf({ gruppe, befehle }: Props) {
  const t = useT()
  const belegung = useSettingsStore((s) => s.belegung)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const knopfRef = useRef<HTMLButtonElement | null>(null)
  const listeRef = useRef<HTMLDivElement | null>(null)
  const offen = position !== null

  useEffect(() => {
    if (!offen) return
    function beiKlick(e: MouseEvent) {
      const ziel = e.target as Node
      if (knopfRef.current?.contains(ziel)) return
      if (listeRef.current?.contains(ziel)) return
      setPosition(null)
    }
    function beiTaste(e: KeyboardEvent) {
      if (e.key === 'Escape') setPosition(null)
    }
    window.addEventListener('pointerdown', beiKlick)
    window.addEventListener('keydown', beiTaste)
    return () => {
      window.removeEventListener('pointerdown', beiKlick)
      window.removeEventListener('keydown', beiTaste)
    }
  }, [offen])

  function umschalten() {
    if (offen) {
      setPosition(null)
      return
    }
    const rechteck = knopfRef.current!.getBoundingClientRect()
    setPosition({ x: rechteck.left, y: rechteck.bottom + 4 })
  }

  const mitglieder = gruppe.befehle
    .map((id) => ({ id, eintrag: befehlNachId(id), aktion: befehle[id] }))
    .filter((eintrag) => eintrag.eintrag && eintrag.aktion && !eintrag.aktion.verborgen)
  const umschalter: GruppenUmschalter[] = mitglieder

  const schalteAlle = useAlleUmschalten(umschalter, (ziel) =>
    t(ziel ? 'symbolleiste.alleAnSchritt' : 'symbolleiste.alleAusSchritt', {
      gruppe: gruppenAnzeigeName(gruppe, t),
    }),
  )

  return (
    <div className="symbolleiste-gruppe">
      <button
        ref={knopfRef}
        type="button"
        className={`symbolleiste-knopf symbolleiste-gruppe-knopf${offen ? ' aktiv' : ''}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={umschalten}
        aria-expanded={offen}
        aria-haspopup="true"
      >
        <span className="symbolleiste-gruppe-name">{gruppenAnzeigeName(gruppe, t)}</span>
        <IconPfeilUnten offen={offen} />
      </button>
      {position &&
        createPortal(
          <div
            ref={listeRef}
            className="symbolleiste-gruppe-liste"
            role="menu"
            style={{ left: position.x, top: position.y }}
          >
            {zeigtAlleSchalter(umschalter) && (
              <div className="symbolleiste-gruppe-alle">
                {[true, false].map((ziel) => (
                  <button
                    key={String(ziel)}
                    type="button"
                    className="symbolleiste-gruppe-alle-knopf"
                    disabled={umzuschaltende(umschalter, ziel).length === 0}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => schalteAlle(ziel)}
                  >
                    {t(ziel ? 'symbolleiste.alleAn' : 'symbolleiste.alleAus')}
                  </button>
                ))}
              </div>
            )}
            {mitglieder.length === 0 ? (
              <p className="symbolleiste-gruppe-leer">{t('symbolleiste.leer')}</p>
            ) : (
              mitglieder.map(({ id, eintrag, aktion }) => {
                const kuerzel =
                  eintrag!.festeAnzeige ?? (belegung[id] ? anzeige(belegung[id]) : null)
                const schalter = istUmschalter(aktion)
                return (
                  <button
                    key={id}
                    type="button"
                    role={schalter ? 'menuitemcheckbox' : 'menuitem'}
                    aria-checked={aktion.haken}
                    className="symbolleiste-gruppe-eintrag"
                    disabled={aktion.deaktiviert}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      aktion.ausfuehren()
                      if (!schalter) setPosition(null)
                    }}
                  >
                    {schalter && (
                      <span
                        className={`symbolleiste-gruppe-checkbox${aktion.haken ? ' an' : ''}`}
                        aria-hidden="true"
                      >
                        {aktion.haken && <IconHaken />}
                      </span>
                    )}
                    <BefehlIcon id={id} />
                    <span>{befehlName(eintrag!.id)}</span>
                    {kuerzel && <span className="symbolleiste-gruppe-kuerzel">{kuerzel}</span>}
                  </button>
                )
              })
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
