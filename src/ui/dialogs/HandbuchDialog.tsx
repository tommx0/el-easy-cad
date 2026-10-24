import { useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { druckeHtml } from '../../druck'
import { kapitelFuerSprache, kapitelZuAnker, type Kapitel } from '../handbuch/kapitel'
import { rendereMarkdown } from '../handbuch/markdown'
import { suche, type Treffer } from '../handbuch/suche'
import { useSprache, useT } from '../sprache-anbindung'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'

export function HandbuchDialog() {
  const zustand = useUiStore((s) => s.handbuchDialog)
  if (!zustand) return null
  return <HandbuchAnsicht anker={zustand.anker} />
}

function HandbuchAnsicht({ anker }: { anker: string | null }) {
  const t = useT()
  const KAPITEL = kapitelFuerSprache(useSprache())
  const belegung = useSettingsStore((s) => s.belegung)
  const [kapitelId, setKapitelId] = useState(
    () =>
      (anker && kapitelZuAnker(anker)?.id) ||
      useUiStore.getState().handbuchKapitel ||
      KAPITEL[0]?.id ||
      '',
  )
  const [begriff, setBegriff] = useState('')
  const [offeneKapitel, setOffeneKapitel] = useState<string[]>(() => {
    const kapitel = anker ? kapitelZuAnker(anker) : null
    return kapitel ? [kapitel.id] : []
  })
  const inhaltRef = useRef<HTMLDivElement>(null)
  const druckRef = useRef<HTMLDivElement>(null)
  const [drucken, setDrucken] = useState(false)

  const schliessen = () => useUiStore.getState().setHandbuchDialog(null)

  function scrolleZu(ziel: string | null) {
    requestAnimationFrame(() => {
      const knoten = ziel ? inhaltRef.current?.querySelector(`#${CSS.escape(ziel)}`) : null
      if (knoten) knoten.scrollIntoView({ block: 'start' })
      else inhaltRef.current?.scrollTo({ top: 0 })
    })
  }

  function zeige(id: string, ziel: string | null) {
    setKapitelId(id)
    useUiStore.getState().setHandbuchKapitel(id)
    scrolleZu(ziel)
  }

  function springe(ziel: string) {
    const kapitel = kapitelZuAnker(ziel)
    if (!kapitel) return
    setBegriff('')
    setOffeneKapitel((offen) => (offen.includes(kapitel.id) ? offen : [...offen, kapitel.id]))
    zeige(kapitel.id, ziel)
  }

  const treffer = useMemo(
    () => (begriff.trim().length >= 2 ? suche(begriff, KAPITEL) : []),
    [begriff, KAPITEL],
  )
  const kapitel = KAPITEL.find((k) => k.id === kapitelId) ?? KAPITEL[0]

  if (anker) scrolleZu(anker)

  function druckeAlles() {
    flushSync(() => setDrucken(true))
    const inhalt = druckRef.current?.innerHTML ?? ''
    flushSync(() => setDrucken(false))
    const k = '.handbuch-druck'
    void druckeHtml(
      `<div class="handbuch-druck"><h1>${t('verwaltungsdialoge.handbuch.druckTitel')}</h1>` +
        `<p>${t('verwaltungsdialoge.handbuch.version', { version: __APP_VERSION__ })}</p>${inhalt}</div>`,
      `@page{margin:2cm}` +
        `${k}{font:11pt/1.5 system-ui,sans-serif;color:#111;background:#fff}` +
        `${k} h2{page-break-before:always;border-bottom:1px solid #999;padding-bottom:.2em}` +
        `${k} h2:first-of-type{page-break-before:avoid}` +
        `${k} img{max-width:100%;border:1px solid #ccc}${k} figure{margin:1em 0}` +
        `${k} figcaption{font-size:9pt;color:#555}` +
        `${k} kbd{border:1px solid #999;border-radius:3px;padding:0 .3em;font-size:.9em}` +
        `${k} table{border-collapse:collapse;width:100%}` +
        `${k} td,${k} th{border:1px solid #bbb;padding:.3em;text-align:left;vertical-align:top}` +
        `${k} aside{border-left:3px solid #888;padding-left:.8em;background:#f4f4f4}`,
    )
  }

  function oeffneTreffer(eintrag: Treffer) {
    setBegriff('')
    zeige(eintrag.kapitelId, eintrag.abschnittId)
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div
        className="dialog dialog-handbuch"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') schliessen()
        }}
      >
        <div className="handbuch-kopf">
          <h2>{t('verwaltungsdialoge.handbuch.titel')}</h2>
          <span className="handbuch-version">
            {t('verwaltungsdialoge.handbuch.version', { version: __APP_VERSION__ })}
          </span>
        </div>

        <input
          className="handbuch-suche"
          type="search"
          placeholder={t('verwaltungsdialoge.handbuch.suchen')}
          value={begriff}
          autoFocus
          onChange={(e) => setBegriff(e.target.value)}
        />

        <div className="handbuch-korpus">
          <nav className="handbuch-baum" aria-label={t('verwaltungsdialoge.handbuch.themen')}>
            {begriff.trim().length >= 2 ? (
              <TrefferListe treffer={treffer} aufTreffer={oeffneTreffer} />
            ) : (
              KAPITEL.map((k) => (
                <KapitelKnoten
                  key={k.id}
                  kapitel={k}
                  aktiv={k.id === kapitelId}
                  offen={offeneKapitel.includes(k.id)}
                  aufKapitel={() => {
                    setOffeneKapitel((o) =>
                      o.includes(k.id) ? o.filter((x) => x !== k.id) : [...o, k.id],
                    )
                    zeige(k.id, null)
                  }}
                  aufAbschnitt={(id) => zeige(k.id, id)}
                />
              ))
            )}
          </nav>

          <div className="handbuch-inhalt" ref={inhaltRef}>
            {kapitel
              ? rendereMarkdown(kapitel.text, {
                  belegung,
                  aufAnker: springe,
                  aufVideo: (videoId) => {
                    useUiStore.getState().setHandbuchDialog(null)
                    useUiStore.getState().setEinfuehrungDialog({ clipId: videoId })
                  },
                })
              : null}
          </div>
        </div>

        <div className="dialog-aktionen">
          <button type="button" onClick={druckeAlles}>
            {t('verwaltungsdialoge.handbuch.drucken')}
          </button>
          <button type="button" className="primaer" onClick={schliessen}>
            {t('verwaltungsdialoge.allgemein.schliessen')}
          </button>
        </div>

        {drucken ? (
          <div ref={druckRef} hidden>
            {KAPITEL.map((k) => (
              <section key={k.id}>{rendereMarkdown(k.text, { belegung })}</section>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function KapitelKnoten({
  kapitel,
  aktiv,
  offen,
  aufKapitel,
  aufAbschnitt,
}: {
  kapitel: Kapitel
  aktiv: boolean
  offen: boolean
  aufKapitel: () => void
  aufAbschnitt: (id: string) => void
}) {
  return (
    <div className="handbuch-knoten">
      <button
        type="button"
        className={aktiv ? 'handbuch-kapitel aktiv' : 'handbuch-kapitel'}
        onClick={aufKapitel}
      >
        <span className="handbuch-nummer">{kapitel.nummer}</span> {kapitel.titel}
      </button>
      {offen ? (
        <ul className="handbuch-abschnitte">
          {kapitel.abschnitte.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => aufAbschnitt(a.id)}>
                {a.nummer} {a.titel}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function TrefferListe({
  treffer,
  aufTreffer,
}: {
  treffer: Treffer[]
  aufTreffer: (eintrag: Treffer) => void
}) {
  const t = useT()
  if (treffer.length === 0)
    return <p className="handbuch-leer">{t('verwaltungsdialoge.handbuch.nichtsGefunden')}</p>
  return (
    <ul className="handbuch-treffer">
      {treffer.map((eintrag, n) => (
        <li key={n}>
          <button type="button" onClick={() => aufTreffer(eintrag)}>
            <span className="handbuch-treffer-ort">
              {eintrag.kapitelNummer} {eintrag.kapitelTitel} › {eintrag.abschnittTitel}
            </span>
            <span className="handbuch-treffer-text">
              {eintrag.vor}
              <mark>{eintrag.fund}</mark>
              {eintrag.nach}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
