import { useMemo, useState } from 'react'
import { komponentenText } from '../../document-model'
import { oberflaechensprache } from '../../sprache'
import { useT } from '../sprache-anbindung'
import { useKatalogStore } from '../store/katalog-store'
import { useUiStore, type ModulFormularZustand } from '../store/ui-store'
import { ZahlenFeldOptional } from '../ZahlenFeld'
import type {
  ZusatzmodulFeld,
  ZusatzmodulFeldWert,
  ZusatzmodulListenZeile,
} from '../zusatzmodule/schnittstelle'

export function ZusatzmodulFormularDialog() {
  const zustand = useUiStore((s) => s.modulFormular)
  if (!zustand) return null
  return <FormularInhalt key={zustand.formular.titel + zustand.kennung} zustand={zustand} />
}

type Eingabefeld = Exclude<ZusatzmodulFeld, { art: 'liste' }>

function anfangswert(feld: Eingabefeld): ZusatzmodulFeldWert {
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
    Object.fromEntries(
      formular.felder
        .filter((f): f is Eingabefeld => f.art !== 'liste')
        .map((f) => [f.id, anfangswert(f)]),
    ),
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
        className={`dialog dialog-zusatzmodul-formular${
          formular.felder.some((f) => f.art === 'liste') ? ' mit-liste' : ''
        }`}
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
            if (feld.art === 'liste') {
              return (
                <ModulListe
                  key={feld.id}
                  titel={feld.titel}
                  zusammenfassung={feld.zusammenfassung}
                  zeilen={feld.zeilen}
                />
              )
            }
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

function ModulListe({
  titel,
  zusammenfassung,
  zeilen,
}: {
  titel?: string
  zusammenfassung?: string
  zeilen: readonly ZusatzmodulListenZeile[]
}) {
  const hatKinder = useMemo(
    () => zeilen.map((z, i) => (zeilen[i + 1]?.tiefe ?? 0) > (z.tiefe ?? 0)),
    [zeilen],
  )
  const [zu, setZu] = useState<ReadonlySet<number>>(
    () => new Set(zeilen.flatMap((z, i) => (z.zu && hatKinder[i] ? [i] : []))),
  )
  const sichtbar: number[] = []
  let verdecktAb: number | null = null
  zeilen.forEach((z, i) => {
    const tiefe = z.tiefe ?? 0
    if (verdecktAb !== null && tiefe > verdecktAb) return
    verdecktAb = null
    sichtbar.push(i)
    if (zu.has(i)) verdecktAb = tiefe
  })
  return (
    <div className="zusatzmodul-liste">
      {(titel || zusammenfassung) && (
        <div className="zusatzmodul-liste-kopf">
          <span>{titel}</span>
          {zusammenfassung && <span className="zusatzmodul-leise">{zusammenfassung}</span>}
        </div>
      )}
      <ul role="tree">
        {sichtbar.map((i) => {
          const z = zeilen[i]
          const klappbar = hatKinder[i]
          const offen = !zu.has(i)
          return (
            <li
              key={i}
              role="treeitem"
              aria-expanded={klappbar ? offen : undefined}
              className={`zusatzmodul-liste-zeile art-${z.art ?? 'normal'}`}
              style={{ paddingLeft: `${(z.tiefe ?? 0) * 16 + 4}px` }}
            >
              {klappbar ? (
                <button
                  type="button"
                  className="zusatzmodul-liste-klappe"
                  onClick={() =>
                    setZu((alt) => {
                      const neu = new Set(alt)
                      if (neu.has(i)) neu.delete(i)
                      else neu.add(i)
                      return neu
                    })
                  }
                >
                  {offen ? '▾' : '▸'}
                </button>
              ) : (
                <span className="zusatzmodul-liste-klappe" />
              )}
              <span className="zusatzmodul-liste-text">
                {z.art === 'warnung' ? `⚠ ${z.text}` : z.text}
              </span>
              {z.rechts && <span className="zusatzmodul-liste-rechts">{z.rechts}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
