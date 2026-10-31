import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { useAppContext, useProject } from './use-app-context'
import { useSettingsStore } from './store/settings-store'
import { useZusatzmodulStore } from './store/zusatzmodul-store'
import { useBefehle } from './befehle/use-befehle'
import type { Aktionskarte, Befehlsaktion } from './befehle/aktionen'
import { befehlNachId, befehlName } from './befehle/katalog'
import { BefehlIcon } from './befehle/BefehlIcon'
import { anzeige } from './befehle/kuerzel'
import { useT } from './sprache-anbindung'
import { HAUPTMENUE, type Hauptmenue, type MenueBefehl, type MenueSpalte } from './menue-gliederung'
import { werkzeugAngeboten } from './leitungsverlegung'
import { zeigtAlleSchalter, umzuschaltende } from './symbolleiste-umschalter'
import { useAlleUmschalten } from './use-alle-umschalten'
import { Befehlssuche } from './Befehlssuche'
import { zusatzmodulDateiUrl, type ZuletztBearbeitet } from '../persistence'
import { IconDokZeichnung, IconHaken, IconZusatzmodul } from './components/Icons'

const RAND_PX = 8

interface MenuProps {
  titel: string
  id: string
  offen: string | null
  setOffen: (id: string | null) => void
  children: ReactNode
}

function wandereMitPfeilen(e: ReactKeyboardEvent<HTMLDivElement>) {
  const vor = e.key === 'ArrowDown' || e.key === 'ArrowRight'
  const zurueck = e.key === 'ArrowUp' || e.key === 'ArrowLeft'
  if (!vor && !zurueck) return
  const knoepfe = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
  if (knoepfe.length === 0) return
  e.preventDefault()
  const jetzt = knoepfe.indexOf(document.activeElement as HTMLButtonElement)
  const naechster = jetzt === -1 ? 0 : (jetzt + (vor ? 1 : knoepfe.length - 1)) % knoepfe.length
  knoepfe[naechster].focus()
}

function Menu({ titel, id, offen, setOffen, children }: MenuProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [versatz, setVersatz] = useState(0)
  const istOffen = offen === id

  useLayoutEffect(() => {
    if (!istOffen || !panelRef.current) {
      setVersatz(0)
      return
    }
    const rechteck = panelRef.current.getBoundingClientRect()
    const ueberstand = rechteck.right - (window.innerWidth - RAND_PX)
    setVersatz(ueberstand > 0 ? -Math.min(ueberstand, rechteck.left - RAND_PX) : 0)
  }, [istOffen])

  return (
    <div className="menu">
      <button
        type="button"
        className={`menu-titel${istOffen ? ' offen' : ''}`}
        aria-haspopup="true"
        aria-expanded={istOffen}
        onClick={() => setOffen(istOffen ? null : id)}
        onMouseEnter={() => {
          if (offen !== null) setOffen(id)
        }}
      >
        {titel}
      </button>
      {istOffen && (
        <div
          className="menu-dropdown menu-panel"
          ref={panelRef}
          style={versatz ? { left: versatz } : undefined}
          onKeyDown={wandereMitPfeilen}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function ohneAuslassung(name: string): string {
  return name.replace(/\s*…$/, '')
}

interface EintragProps {
  eintrag: MenueBefehl
  aktion: Befehlsaktion
  schliesse: () => void
}

function useBefehlText(id: string, aktion: Befehlsaktion) {
  const belegung = useSettingsStore((s) => s.belegung)
  const befehl = befehlNachId(id)
  const taste = belegung[id]
  const kuerzel = befehl?.festeAnzeige ?? (taste ? anzeige(taste) : undefined)
  const name = befehlName(id) + (aktion.labelZusatz ?? '')
  return { name, kuerzel, titel: kuerzel ? `${name} (${kuerzel})` : name }
}

function Kachel({ eintrag, aktion, schliesse }: EintragProps) {
  const t = useT()
  const { name, kuerzel, titel } = useBefehlText(eintrag.id, aktion)
  return (
    <button
      type="button"
      className="menu-kachel"
      aria-label={name}
      title={titel}
      disabled={aktion.deaktiviert}
      onClick={() => {
        schliesse()
        aktion.ausfuehren()
      }}
    >
      <span className="menu-kachel-icon">
        <BefehlIcon id={eintrag.id} />
      </span>
      <span className="menu-kachel-text">
        {eintrag.kurz ? t(eintrag.kurz) : ohneAuslassung(befehlName(eintrag.id))}
      </span>
      {kuerzel && (
        <span className="menu-kachel-kuerzel" aria-hidden="true">
          {kuerzel}
        </span>
      )}
    </button>
  )
}

function Schalter({ eintrag, aktion }: Omit<EintragProps, 'schliesse'>) {
  const t = useT()
  const { name, titel } = useBefehlText(eintrag.id, aktion)
  return (
    <button
      type="button"
      className="menu-schalter"
      role="menuitemcheckbox"
      aria-checked={aktion.haken ?? false}
      aria-label={name}
      title={titel}
      disabled={aktion.deaktiviert}
      onClick={() => aktion.ausfuehren()}
    >
      <span className={`menu-schalter-kaestchen${aktion.haken ? ' an' : ''}`} aria-hidden="true">
        {aktion.haken && <IconHaken />}
      </span>
      <span className="menu-schalter-icon">
        <BefehlIcon id={eintrag.id} />
      </span>
      <span className="menu-schalter-text">
        {eintrag.kurz ? t(eintrag.kurz) : ohneAuslassung(befehlName(eintrag.id))}
      </span>
    </button>
  )
}

interface SichtbarerEintrag {
  eintrag: MenueBefehl
  aktion: Befehlsaktion
}

function kachelnJeZeile(anzahl: number): number {
  return anzahl <= 2 ? anzahl : anzahl <= 4 ? 2 : 3
}

function SchalterSpalte({
  spalte,
  eintraege,
}: {
  spalte: MenueSpalte
  eintraege: SichtbarerEintrag[]
}) {
  const t = useT()
  const umschalter = eintraege.map(({ eintrag, aktion }) => ({ id: eintrag.id, aktion }))
  const schalteAlle = useAlleUmschalten(umschalter, (ziel) =>
    t(ziel ? 'symbolleiste.alleAnSchritt' : 'symbolleiste.alleAusSchritt', {
      gruppe: t(spalte.titel),
    }),
  )
  return (
    <>
      {zeigtAlleSchalter(umschalter) && (
        <div className="menu-panel-alle">
          {[true, false].map((ziel) => (
            <button
              key={String(ziel)}
              type="button"
              disabled={umzuschaltende(umschalter, ziel).length === 0}
              onClick={() => schalteAlle(ziel)}
            >
              {t(ziel ? 'symbolleiste.alleAn' : 'symbolleiste.alleAus')}
            </button>
          ))}
        </div>
      )}
      <div className="menu-panel-schalter">
        {eintraege.map(({ eintrag, aktion }) => (
          <Schalter key={eintrag.id} eintrag={eintrag} aktion={aktion} />
        ))}
      </div>
    </>
  )
}

function Kachelraster({
  eintraege,
  schliesse,
}: {
  eintraege: SichtbarerEintrag[]
  schliesse: () => void
}) {
  return (
    <div
      className="menu-panel-kacheln"
      style={{
        gridTemplateColumns: `repeat(${kachelnJeZeile(eintraege.length)}, var(--kachel-breite))`,
      }}
    >
      {eintraege.map(({ eintrag, aktion }) => (
        <Kachel key={eintrag.id} eintrag={eintrag} aktion={aktion} schliesse={schliesse} />
      ))}
    </div>
  )
}

function ZuletztListe({
  dokumente,
  schliesse,
}: {
  dokumente: ZuletztBearbeitet[]
  schliesse: () => void
}) {
  const t = useT()
  const { oeffneDokument } = useAppContext()
  if (dokumente.length === 0) {
    return <p className="menu-panel-leer">{t('menue.nochKeineDokumente')}</p>
  }
  return (
    <div className="menu-panel-zeilen">
      {dokumente.map((eintrag) => (
        <button
          key={eintrag.id}
          type="button"
          className="menu-zuletzt"
          onClick={() => {
            schliesse()
            void oeffneDokument(eintrag.id)
          }}
        >
          <IconDokZeichnung />
          <span className="menu-zuletzt-text">
            <span>{eintrag.name}</span>
            <span className="menu-zuletzt-ort">
              {[eintrag.kunde, eintrag.projektBezeichnung].filter(Boolean).join(' · ')}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}

function ZusatzmodulKacheln({ schliesse }: { schliesse: () => void }) {
  const t = useT()
  const { zusatzmodule, doc } = useAppContext()
  const eintraege = useZusatzmodulStore((s) => s.eintraege)
  useZusatzmodulStore((s) => s.texte)
  const laufend = useZusatzmodulStore((s) => s.laufend)
  const aktive = eintraege.filter((e) => e.aktiv)
  if (aktive.length === 0) return <p className="menu-panel-leer">{t('menue.keineModule')}</p>
  const zeichnungsart = doc.getZeichnung().zeichnungsart
  return (
    <>
      {aktive.map(({ manifest }) => {
        const bild = (datei: string | undefined) =>
          datei ? (
            <img
              className="menu-modul-icon"
              src={zusatzmodulDateiUrl(manifest.kennung, manifest.version, datei)}
              alt=""
            />
          ) : (
            <IconZusatzmodul />
          )
        const einziger = manifest.befehle.length === 1
        const kacheln = manifest.befehle.map((befehl) => {
          const titel = einziger ? manifest.name : zusatzmodule.befehlTitel(manifest, befehl.id)
          return (
            <button
              key={befehl.id}
              type="button"
              className="menu-kachel"
              title={titel}
              disabled={
                laufend !== null ||
                (befehl.nurZeichnungsart !== undefined && befehl.nurZeichnungsart !== zeichnungsart)
              }
              onClick={() => {
                schliesse()
                void zusatzmodule.fuehreAus(manifest.kennung, befehl.id)
              }}
            >
              <span className="menu-kachel-icon">{bild(befehl.icon ?? manifest.icon)}</span>
              <span className="menu-kachel-text">{titel}</span>
            </button>
          )
        })
        return (
          <div key={manifest.kennung} className="menu-panel-modul">
            {!einziger && <p className="menu-panel-unterkopf">{manifest.name}</p>}
            <div
              className="menu-panel-kacheln"
              style={{
                gridTemplateColumns: `repeat(${kachelnJeZeile(kacheln.length)}, var(--kachel-breite))`,
              }}
            >
              {kacheln}
            </div>
          </div>
        )
      })}
    </>
  )
}

function MenuPanel({
  menue,
  befehle,
  zuletzt,
  schliesse,
}: {
  menue: Hauptmenue
  befehle: Aktionskarte
  zuletzt: ZuletztBearbeitet[]
  schliesse: () => void
}) {
  const t = useT()
  const art = useProject().zeichnungsart
  const leitungsverlegung = useSettingsStore((s) => s.leitungsverlegung)

  function sichtbar(spalte: MenueSpalte): SichtbarerEintrag[] {
    return spalte.befehle.flatMap((eintrag) => {
      const befehl = befehlNachId(eintrag.id)
      const aktion = befehle[eintrag.id]
      if (!befehl || !aktion || aktion.verborgen) return []
      if (befehl.werkzeugId && !werkzeugAngeboten(befehl.werkzeugId, art, leitungsverlegung)) {
        return []
      }
      return [{ eintrag, aktion }]
    })
  }

  return (
    <>
      {menue.spalten.map((spalte) => {
        const eintraege = sichtbar(spalte)
        const dynamisch = spalte.art === 'zuletzt' || spalte.art === 'module'
        if (eintraege.length === 0 && !dynamisch) return null
        return (
          <section key={spalte.titel} className={`menu-panel-spalte menu-panel-${spalte.art}`}>
            <h3 className="menu-panel-kopf">{t(spalte.titel)}</h3>
            {spalte.art === 'schalter' ? (
              <SchalterSpalte spalte={spalte} eintraege={eintraege} />
            ) : (
              eintraege.length > 0 && <Kachelraster eintraege={eintraege} schliesse={schliesse} />
            )}
            {spalte.art === 'zuletzt' && <ZuletztListe dokumente={zuletzt} schliesse={schliesse} />}
            {spalte.art === 'module' && <ZusatzmodulKacheln schliesse={schliesse} />}
          </section>
        )
      })}
    </>
  )
}

export function MenuBar() {
  const t = useT()
  const [offen, setOffen] = useState<string | null>(null)
  const menuBarRef = useRef<HTMLElement | null>(null)
  const { zuletztBearbeitet } = useAppContext()
  const befehle = useBefehle()
  const schliessen = () => setOffen(null)
  const [zuletzteDokumente, setZuletzteDokumente] = useState<ZuletztBearbeitet[]>([])

  useEffect(() => {
    function schliesseBeiAuszen(e: MouseEvent) {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) setOffen(null)
    }
    window.addEventListener('pointerdown', schliesseBeiAuszen)
    return () => window.removeEventListener('pointerdown', schliesseBeiAuszen)
  }, [])

  useEffect(() => {
    if (offen === null) return
    function aufTaste(e: KeyboardEvent) {
      if (e.key === 'Escape') setOffen(null)
    }
    window.addEventListener('keydown', aufTaste)
    return () => window.removeEventListener('keydown', aufTaste)
  }, [offen])

  useEffect(() => {
    if (offen === 'datei') {
      zuletztBearbeitet()
        .then(setZuletzteDokumente)
        .catch(() => setZuletzteDokumente([]))
    }
  }, [offen, zuletztBearbeitet])

  return (
    <nav className="menu-bar" aria-label={t('menue.hauptmenue')} ref={menuBarRef}>
      {HAUPTMENUE.map((menue) => (
        <Menu key={menue.id} titel={t(menue.titel)} id={menue.id} offen={offen} setOffen={setOffen}>
          <MenuPanel
            menue={menue}
            befehle={befehle}
            zuletzt={zuletzteDokumente}
            schliesse={schliessen}
          />
        </Menu>
      ))}
      <Befehlssuche befehle={befehle} beimOeffnen={schliessen} />
    </nav>
  )
}
