import { useEffect, useMemo, useRef, useState } from 'react'
import type { Aktionskarte } from './befehle/aktionen'
import { alleBefehle, befehlName } from './befehle/katalog'
import { BefehlIcon } from './befehle/BefehlIcon'
import { anzeige } from './befehle/kuerzel'
import { menueOrt, sucheBefehle, type SuchKandidat } from './befehlssuche-treffer'
import { IconSuche } from './components/Icons'
import { werkzeugAngeboten } from './leitungsverlegung'
import { useSettingsStore } from './store/settings-store'
import { useZusatzmodulStore } from './store/zusatzmodul-store'
import { useT } from './sprache-anbindung'
import { useProject } from './use-app-context'

const EIGENE_ID = 'hilfe.befehlssuche'

export function Befehlssuche({
  befehle,
  beimOeffnen,
}: {
  befehle: Aktionskarte
  beimOeffnen: () => void
}) {
  const t = useT()
  const art = useProject().zeichnungsart
  const leitungsverlegung = useSettingsStore((s) => s.leitungsverlegung)
  const belegung = useSettingsStore((s) => s.belegung)
  const moduleintraege = useZusatzmodulStore((s) => s.eintraege)
  const modultexte = useZusatzmodulStore((s) => s.texte)
  const [suche, setSuche] = useState('')
  const [gewaehlt, setGewaehlt] = useState(0)
  const [fokus, setFokus] = useState(false)
  const feldRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    function oeffnen() {
      feldRef.current?.focus()
      feldRef.current?.select()
    }
    window.addEventListener('eleasycad:befehlssuche', oeffnen)
    return () => window.removeEventListener('eleasycad:befehlssuche', oeffnen)
  }, [])

  const kandidaten = useMemo<SuchKandidat[]>(
    () =>
      alleBefehle().flatMap((befehl) => {
        const aktion = befehle[befehl.id]
        if (befehl.id === EIGENE_ID || !aktion || aktion.verborgen) return []
        if (befehl.werkzeugId && !werkzeugAngeboten(befehl.werkzeugId, art, leitungsverlegung)) {
          return []
        }
        const taste = belegung[befehl.id]
        const kuerzel = befehl.festeAnzeige ?? (taste ? anzeige(taste) : null)
        return [{ id: befehl.id, name: befehlName(befehl.id), ort: menueOrt(befehl.id), kuerzel }]
      }),
    [befehle, art, leitungsverlegung, belegung, moduleintraege, modultexte, t],
  )
  const treffer = sucheBefehle(suche, kandidaten)
  const offen = fokus && suche.trim() !== ''
  const auswahl = Math.min(gewaehlt, Math.max(treffer.length - 1, 0))

  function verlassen() {
    setSuche('')
    setGewaehlt(0)
    feldRef.current?.blur()
  }

  function fuehreAus(id: string) {
    const aktion = befehle[id]
    if (!aktion || aktion.deaktiviert) return
    verlassen()
    aktion.ausfuehren()
  }

  const eigeneTaste = belegung[EIGENE_ID]
  const eigenesKuerzel = eigeneTaste ? anzeige(eigeneTaste) : null

  return (
    <div className="befehlssuche">
      <span className="befehlssuche-lupe" aria-hidden="true">
        <IconSuche />
      </span>
      <input
        ref={feldRef}
        type="search"
        className="befehlssuche-feld"
        value={suche}
        placeholder={t('menue.suche.platzhalter')}
        aria-label={t('menue.suche.aria')}
        aria-expanded={offen}
        aria-controls="befehlssuche-treffer"
        role="combobox"
        aria-autocomplete="list"
        onFocus={() => {
          setFokus(true)
          beimOeffnen()
        }}
        onBlur={() => setFokus(false)}
        onChange={(e) => {
          setSuche(e.target.value)
          setGewaehlt(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            if (treffer.length === 0) return
            const schritt = e.key === 'ArrowDown' ? 1 : treffer.length - 1
            setGewaehlt((auswahl + schritt) % treffer.length)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            const ziel = treffer[auswahl]
            if (ziel) fuehreAus(ziel.id)
          } else if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            verlassen()
          }
        }}
      />
      {!fokus && eigenesKuerzel && (
        <kbd className="befehlssuche-kuerzel" aria-hidden="true">
          {eigenesKuerzel}
        </kbd>
      )}
      {offen && (
        <div className="befehlssuche-treffer" id="befehlssuche-treffer" role="listbox">
          {treffer.length === 0 ? (
            <p className="befehlssuche-leer">{t('menue.suche.keineTreffer')}</p>
          ) : (
            treffer.map((eintrag, i) => {
              const aktion = befehle[eintrag.id]
              return (
                <button
                  key={eintrag.id}
                  type="button"
                  role="option"
                  aria-selected={i === auswahl}
                  className={`befehlssuche-eintrag${i === auswahl ? ' gewaehlt' : ''}`}
                  disabled={aktion?.deaktiviert}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setGewaehlt(i)}
                  onClick={() => fuehreAus(eintrag.id)}
                >
                  <span className="befehlssuche-icon">
                    <BefehlIcon id={eintrag.id} />
                  </span>
                  <span className="befehlssuche-name">{eintrag.name}</span>
                  <span className="befehlssuche-ort">{eintrag.ort}</span>
                  {eintrag.kuerzel && <kbd>{eintrag.kuerzel}</kbd>}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
