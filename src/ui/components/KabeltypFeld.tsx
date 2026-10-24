import { useEffect, useMemo, useRef, useState } from 'react'
import type { Kabeltyp } from '../../document-model'
import { kabeltypFeldText, sortiereKabeltypen } from '../../document-model'
import { useKabeltypStore } from '../store/kabeltyp-store'
import { useUiStore } from '../store/ui-store'
import { useSprache, useT } from '../sprache-anbindung'
import {
  gruppiereKabeltypenAnzeige,
  kabeltypBemerkung,
  kabeltypPasstZuSuche,
} from '../kabeltyp-anzeige'

interface Props {
  titel?: string
  wertId?: string
  freierText?: string
  zusatzTypen?: readonly Kabeltyp[]
  aendern: (wahl: { kabeltypId?: string; typ?: string }) => void
  freierTextErlaubt?: boolean
  leerText?: string
}

export function KabeltypFeld({
  titel,
  wertId,
  freierText,
  zusatzTypen = [],
  aendern,
  freierTextErlaubt = true,
  leerText,
}: Props) {
  const t = useT()
  const sprache = useSprache()
  const globaleTypen = useKabeltypStore((s) => s.typen)
  const leer = leerText ?? t('eigenschaften.kabeltyp.keinTyp')
  const zuletztBenutzt = useKabeltypStore((s) => s.zuletztBenutzt)
  const merkeBenutzt = useKabeltypStore((s) => s.merkeBenutzt)
  const [offen, setOffen] = useState(false)
  const [suche, setSuche] = useState('')
  const [textEingabe, setTextEingabe] = useState<string | null>(null)
  const [markiert, setMarkiert] = useState(0)
  const huelleRef = useRef<HTMLDivElement | null>(null)
  const listeRef = useRef<HTMLDivElement | null>(null)

  const alle = useMemo(() => {
    const bekannt = new Set(globaleTypen.map((t) => t.id))
    return sortiereKabeltypen([...globaleTypen, ...zusatzTypen.filter((t) => !bekannt.has(t.id))])
  }, [globaleTypen, zusatzTypen])

  const aktueller = wertId ? alle.find((t) => t.id === wertId) : undefined
  const anzeige = aktueller?.bezeichnung ?? freierText?.trim() ?? ''

  const auswaehlbar = useMemo(
    () =>
      alle.filter((t) => t.aktiv || t.id === wertId).filter((t) => kabeltypPasstZuSuche(t, suche)),
    [alle, suche, wertId],
  )

  const zuletzt = useMemo(() => {
    if (suche.trim()) return []
    return zuletztBenutzt
      .map((id) => auswaehlbar.find((t) => t.id === id))
      .filter((t): t is Kabeltyp => !!t)
  }, [zuletztBenutzt, auswaehlbar, suche])

  const gruppen = useMemo(
    () => gruppiereKabeltypenAnzeige(auswaehlbar, sprache),
    [auswaehlbar, sprache],
  )

  const reihenfolge = useMemo<(Kabeltyp | null)[]>(
    () => [null, ...zuletzt, ...gruppen.flatMap((g) => g.typen)],
    [zuletzt, gruppen],
  )

  useEffect(() => {
    if (!offen) return
    function beiKlick(e: MouseEvent) {
      if (huelleRef.current && !huelleRef.current.contains(e.target as Node)) schliesse()
    }
    window.addEventListener('pointerdown', beiKlick)
    return () => window.removeEventListener('pointerdown', beiKlick)
  }, [offen])

  function schliesse() {
    setOffen(false)
    setSuche('')
    setTextEingabe(null)
    setMarkiert(0)
  }

  function waehle(typ: Kabeltyp | null) {
    if (typ) merkeBenutzt(typ.id)
    aendern(
      typ ? { kabeltypId: typ.id, typ: undefined } : { kabeltypId: undefined, typ: undefined },
    )
    schliesse()
  }

  function uebernehmeFreienText(text: string) {
    const sauber = text.trim()
    aendern({ kabeltypId: undefined, typ: sauber || undefined })
    schliesse()
  }

  function beiTaste(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      schliesse()
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const schritt = e.key === 'ArrowDown' ? 1 : -1
      setMarkiert((alt) => {
        const neu = Math.min(Math.max(alt + schritt, 0), reihenfolge.length - 1)
        listeRef.current
          ?.querySelectorAll('.kabeltyp-eintrag')
          [neu]?.scrollIntoView({ block: 'nearest' })
        return neu
      })
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      waehle(reihenfolge[markiert] ?? null)
    }
  }

  let laufindex = 0
  const naechsterIndex = () => laufindex++

  return (
    <div className="feld kabeltyp-feld" ref={huelleRef}>
      <span>{titel ?? t('eigenschaften.kabeltyp.titel')}</span>
      {textEingabe === null ? (
        <button
          type="button"
          className={`kabeltyp-knopf${anzeige ? '' : ' leer'}`}
          onClick={() => (offen ? schliesse() : setOffen(true))}
          title={aktueller && kabeltypBemerkung(aktueller, sprache)}
        >
          <span className="kabeltyp-knopf-text">{anzeige || leer}</span>
          {!aktueller && anzeige && (
            <span className="kabeltyp-marke">{t('eigenschaften.kabeltyp.frei')}</span>
          )}
          <span className="kabeltyp-pfeil" aria-hidden>
            ▾
          </span>
        </button>
      ) : (
        <input
          autoFocus
          value={textEingabe}
          placeholder={t('eigenschaften.kabeltyp.eigenerText')}
          onChange={(e) => setTextEingabe(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') uebernehmeFreienText(textEingabe)
            if (e.key === 'Escape') {
              e.stopPropagation()
              schliesse()
            }
          }}
          onBlur={() => uebernehmeFreienText(textEingabe)}
        />
      )}

      {offen && textEingabe === null && (
        <div className="kabeltyp-liste" onKeyDown={beiTaste}>
          <input
            autoFocus
            className="kabeltyp-suche"
            value={suche}
            placeholder={t('eigenschaften.kabeltyp.suchen')}
            onChange={(e) => {
              setSuche(e.target.value)
              setMarkiert(0)
            }}
          />
          <div className="kabeltyp-eintraege" ref={listeRef}>
            <Eintrag
              text={leer}
              markiert={markiert === naechsterIndex()}
              gewaehlt={!wertId && !freierText}
              onClick={() => waehle(null)}
            />
            {zuletzt.length > 0 && (
              <>
                <div className="kabeltyp-gruppe">{t('eigenschaften.kabeltyp.zuletzt')}</div>
                {zuletzt.map((typ) => (
                  <Eintrag
                    key={`zuletzt-${typ.id}`}
                    text={typ.bezeichnung}
                    nebentext={kabeltypFeldText(typ, 'gruppe', sprache)}
                    markiert={markiert === naechsterIndex()}
                    gewaehlt={typ.id === wertId}
                    onClick={() => waehle(typ)}
                  />
                ))}
              </>
            )}
            {gruppen.map((gruppe) => (
              <div key={gruppe.gruppe}>
                <div className="kabeltyp-gruppe">{gruppe.text}</div>
                {gruppe.typen.map((typ) => (
                  <Eintrag
                    key={typ.id}
                    text={typ.bezeichnung}
                    nebentext={typ.aktiv ? undefined : t('eigenschaften.kabeltyp.inaktiv')}
                    titel={kabeltypBemerkung(typ, sprache)}
                    markiert={markiert === naechsterIndex()}
                    gewaehlt={typ.id === wertId}
                    onClick={() => waehle(typ)}
                  />
                ))}
              </div>
            ))}
            {auswaehlbar.length === 0 && (
              <div className="kabeltyp-leer">
                {t('eigenschaften.kabeltyp.keinTreffer', { suche })}
              </div>
            )}
          </div>
          <div className="kabeltyp-fuss">
            {freierTextErlaubt && (
              <button type="button" onClick={() => setTextEingabe(freierText ?? '')}>
                {t('eigenschaften.kabeltyp.freierText')}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                schliesse()
                useUiStore.getState().setKabeltypenDialogOffen(true)
              }}
            >
              {t('eigenschaften.kabeltyp.verwalten')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Eintrag({
  text,
  nebentext,
  titel,
  markiert,
  gewaehlt,
  onClick,
}: {
  text: string
  nebentext?: string
  titel?: string
  markiert: boolean
  gewaehlt: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`kabeltyp-eintrag${markiert ? ' markiert' : ''}${gewaehlt ? ' gewaehlt' : ''}`}
      title={titel}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <span>{text}</span>
      {nebentext && <span className="kabeltyp-neben">{nebentext}</span>}
    </button>
  )
}
