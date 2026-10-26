import { useState } from 'react'
import { komponentenText } from '../../document-model'
import { oberflaechensprache } from '../../sprache'
import { useT } from '../sprache-anbindung'
import { useKatalogStore } from '../store/katalog-store'
import { useUiStore, type ModulFormularZustand } from '../store/ui-store'
import { ZahlenFeldOptional } from '../ZahlenFeld'
import type { ZusatzmodulFeld, ZusatzmodulFeldWert } from '../zusatzmodule/schnittstelle'

export function ZusatzmodulFormularDialog() {
  const zustand = useUiStore((s) => s.modulFormular)
  if (!zustand) return null
  return <FormularInhalt key={zustand.formular.titel + zustand.kennung} zustand={zustand} />
}

function anfangswert(feld: ZusatzmodulFeld): ZusatzmodulFeldWert {
  switch (feld.art) {
    case 'zahl':
      return feld.wert ?? null
    case 'text':
      return feld.wert ?? ''
    case 'haken':
      return feld.wert ?? false
    case 'auswahl':
      return feld.wert ?? feld.optionen[0]?.wert ?? ''
    case 'katalog':
      return feld.wert ?? null
  }
}

function FormularInhalt({ zustand }: { zustand: ModulFormularZustand }) {
  const t = useT()
  const { formular } = zustand
  const katalog = useKatalogStore((s) => s.komponenten)
  const [werte, setWerte] = useState<Record<string, ZusatzmodulFeldWert>>(() =>
    Object.fromEntries(formular.felder.map((f) => [f.id, anfangswert(f)])),
  )

  function setze(id: string, wert: ZusatzmodulFeldWert) {
    setWerte((alt) => ({ ...alt, [id]: wert }))
  }

  function schliesse(ergebnis: Record<string, ZusatzmodulFeldWert> | null) {
    useUiStore.getState().setModulFormular(null)
    zustand.fertig(ergebnis)
  }

  const unvollstaendig = formular.felder.some(
    (f) =>
      (f.art === 'zahl' && !f.leerErlaubt && werte[f.id] === null) ||
      (f.art === 'katalog' && !f.leerErlaubt && !werte[f.id]),
  )

  return (
    <div className="dialog-overlay" onMouseDown={() => schliesse(null)}>
      <form
        className="dialog dialog-zusatzmodul-formular"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            schliesse(null)
          }
        }}
        onSubmit={(e) => {
          e.preventDefault()
          if (!unvollstaendig) schliesse(werte)
        }}
      >
        <h2>{formular.titel}</h2>
        {formular.text && <p className="zusatzmodul-leise">{formular.text}</p>}
        <div className="zusatzmodul-formular-felder">
          {formular.felder.map((feld) => {
            const kennung = `modulfeld-${feld.id}`
            const wert = werte[feld.id]
            if (feld.art === 'haken') {
              return (
                <label key={feld.id} className="zusatzmodul-formular-haken">
                  <input
                    type="checkbox"
                    checked={wert === true}
                    onChange={(e) => setze(feld.id, e.target.checked)}
                  />
                  {feld.titel}
                </label>
              )
            }
            return (
              <label key={feld.id} className="zusatzmodul-formular-zeile" htmlFor={kennung}>
                <span>{feld.titel}</span>
                {feld.art === 'zahl' && (
                  <span className="zusatzmodul-formular-zahl">
                    <ZahlenFeldOptional
                      id={kennung}
                      value={typeof wert === 'number' ? wert : null}
                      min={feld.min}
                      max={feld.max}
                      step={feld.schritt}
                      onCommit={(neu) => setze(feld.id, neu)}
                    />
                    {feld.einheit && <span>{feld.einheit}</span>}
                  </span>
                )}
                {feld.art === 'text' && (
                  <input
                    id={kennung}
                    type="text"
                    value={typeof wert === 'string' ? wert : ''}
                    onChange={(e) => setze(feld.id, e.target.value)}
                  />
                )}
                {feld.art === 'auswahl' && (
                  <select
                    id={kennung}
                    value={typeof wert === 'string' ? wert : ''}
                    onChange={(e) => setze(feld.id, e.target.value)}
                  >
                    {feld.optionen.map((o) => (
                      <option key={o.wert} value={o.wert}>
                        {o.titel}
                      </option>
                    ))}
                  </select>
                )}
                {feld.art === 'katalog' && (
                  <span className="zusatzmodul-formular-katalog">
                    <span>
                      {(() => {
                        const eintrag = katalog.find((k) => k.id === wert)
                        return eintrag
                          ? komponentenText(eintrag, 'name', oberflaechensprache())
                          : t('verwaltungsdialoge.zusatzmodule.keinEintrag')
                      })()}
                    </span>
                    <button
                      id={kennung}
                      type="button"
                      onClick={() =>
                        useUiStore.getState().oeffneKomponentenPicker((gewaehlt) => {
                          if (gewaehlt) setze(feld.id, gewaehlt.catalogComponentId)
                        })
                      }
                    >
                      {t('verwaltungsdialoge.zusatzmodule.waehlen')}
                    </button>
                  </span>
                )}
              </label>
            )
          })}
        </div>
        <div className="dialog-aktionen">
          <button type="button" onClick={() => schliesse(null)}>
            {t('verwaltungsdialoge.allgemein.abbrechen')}
          </button>
          <button type="submit" className="primaer" disabled={unvollstaendig}>
            {formular.bestaetigen ?? t('aktionen.zusatzmodule.ja')}
          </button>
        </div>
      </form>
    </div>
  )
}
