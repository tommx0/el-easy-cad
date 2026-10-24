import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { EtagenRichtung } from '../document-model'
import { istSchaltplan } from '../document-model'
import {
  erzeugeBlattAendernCommand,
  erzeugeBlattLoeschenCommand,
  erzeugeBlattVerschiebenCommand,
} from '../tools'
import { useAppContext, useProject } from './use-app-context'
import { legeNeuesBlattAn } from './blatt-anlegen'
import { meldeNurAnsicht } from './nur-ansicht'
import { useUiStore } from './store/ui-store'
import { IconPfeilRechts, IconPlus, IconSchliessen, IconWinkelLinks } from './components/Icons'
import { useT } from './sprache-anbindung'

const RAND_EINBLENDEN = 8
const ROLLEN_BEIM_ZIEHEN = 12

export function SheetTabs() {
  const t = useT()
  const { doc, commands, toolContext } = useAppContext()
  const zeichnung = useProject()
  const [ziehtId, setZiehtId] = useState<string | null>(null)
  const [zielIndex, setZielIndex] = useState<number | null>(null)
  const listeRef = useRef<HTMLDivElement>(null)
  const [neuMenue, setNeuMenue] = useState<{ left: number; top?: number; bottom?: number } | null>(
    null,
  )
  const neuKnopfRef = useRef<HTMLButtonElement>(null)
  const neuMenueRef = useRef<HTMLDivElement>(null)
  const [rollbar, setRollbar] = useState({ links: false, rechts: false })
  const ueberlauf = rollbar.links || rollbar.rechts

  const tabSchluessel = zeichnung.blaetter.map((b) => b.name).join('\n')

  useEffect(() => {
    const liste = listeRef.current
    if (!liste) return
    function messen() {
      if (!liste) return
      const rest = liste.scrollWidth - liste.clientWidth - liste.scrollLeft
      const links = liste.scrollLeft > 1
      const rechts = rest > 1
      setRollbar((alt) => (alt.links === links && alt.rechts === rechts ? alt : { links, rechts }))
    }
    function rad(e: WheelEvent) {
      if (!liste || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      if (liste.scrollWidth <= liste.clientWidth) return
      e.preventDefault()
      liste.scrollLeft += e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 16 : e.deltaY
    }
    messen()
    const beobachter = new ResizeObserver(messen)
    beobachter.observe(liste)
    for (const tab of Array.from(liste.children)) beobachter.observe(tab)
    liste.addEventListener('scroll', messen, { passive: true })
    liste.addEventListener('wheel', rad, { passive: false })
    return () => {
      beobachter.disconnect()
      liste.removeEventListener('scroll', messen)
      liste.removeEventListener('wheel', rad)
    }
  }, [tabSchluessel])

  useEffect(() => {
    const liste = listeRef.current
    const tab = liste?.querySelector<HTMLElement>('.sheet-tab.aktiv')
    if (!liste || !tab) return
    const anfang = tab.offsetLeft - RAND_EINBLENDEN
    const ende = tab.offsetLeft + tab.offsetWidth + RAND_EINBLENDEN
    if (anfang < liste.scrollLeft) liste.scrollLeft = anfang
    else if (ende > liste.scrollLeft + liste.clientWidth) {
      liste.scrollLeft = ende - liste.clientWidth
    }
  }, [zeichnung.aktivesBlattId, tabSchluessel])

  useEffect(() => {
    if (!neuMenue) return
    function beiKlick(e: PointerEvent) {
      const ziel = e.target as Node
      if (neuKnopfRef.current?.contains(ziel) || neuMenueRef.current?.contains(ziel)) return
      setNeuMenue(null)
    }
    function beiTaste(e: KeyboardEvent) {
      if (e.key === 'Escape') setNeuMenue(null)
    }
    window.addEventListener('pointerdown', beiKlick)
    window.addEventListener('keydown', beiTaste)
    return () => {
      window.removeEventListener('pointerdown', beiKlick)
      window.removeEventListener('keydown', beiTaste)
    }
  }, [neuMenue])

  function neuKlick() {
    if (istSchaltplan(zeichnung)) {
      legeNeuesBlattAn(doc, commands)
      return
    }
    if (neuMenue) {
      setNeuMenue(null)
      return
    }
    const r = neuKnopfRef.current!.getBoundingClientRect()
    setNeuMenue(
      r.top > window.innerHeight / 2
        ? { left: r.left, bottom: window.innerHeight - r.top + 4 }
        : { left: r.left, top: r.bottom + 4 },
    )
  }

  function etageEinfuegen(richtung: EtagenRichtung) {
    setNeuMenue(null)
    const aktiv = zeichnung.blaetter.find((b) => b.id === zeichnung.aktivesBlattId)
    if (meldeNurAnsicht(aktiv)) return
    useUiStore.getState().setEtageEinfuegen(richtung)
  }

  function rollen(richtung: -1 | 1) {
    const liste = listeRef.current
    if (!liste) return
    liste.scrollBy({ left: richtung * liste.clientWidth * 0.8, behavior: 'smooth' })
  }

  function rollenBeimZiehen(richtung: -1 | 1) {
    if (!ziehtId) return
    listeRef.current?.scrollBy({ left: richtung * ROLLEN_BEIM_ZIEHEN })
  }

  function beendeZiehen() {
    setZiehtId(null)
    setZielIndex(null)
  }

  function ablegen(index: number) {
    const gezogen = ziehtId
    beendeZiehen()
    if (!gezogen) return
    const command = erzeugeBlattVerschiebenCommand(doc, gezogen, index)
    if (command) commands.execute(command)
  }

  function umbenennen(blattId: string, aktuellerName: string) {
    if (meldeNurAnsicht(zeichnung.blaetter.find((b) => b.id === blattId))) return
    toolContext.oeffneEingabeDialog(
      {
        titel: t('blattregister.umbenennen'),
        label: t('blattregister.nameDesBlatts'),
        anfangswert: aktuellerName,
      },
      (wert) => {
        if (wert && wert.trim().length > 0) {
          commands.execute(
            erzeugeBlattAendernCommand(doc, blattId, t('blattregister.umbenennen'), {
              name: wert.trim(),
            }),
          )
        }
      },
    )
  }

  function loeschen(blattId: string) {
    const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
    if (!blatt || meldeNurAnsicht(blatt)) return

    toolContext.oeffneBestaetigung({
      titel: t('blattregister.loeschen'),
      nachricht: t('blattregister.loeschenFrage', { name: blatt.name }),
      callback: (bestaetigt) => {
        if (bestaetigt) {
          const command = erzeugeBlattLoeschenCommand(doc, blattId)
          if (command) commands.execute(command)
        }
      },
    })
  }

  return (
    <div className="sheet-tabs">
      {ueberlauf && (
        <button
          type="button"
          className="sheet-tabs-rollen"
          aria-label={t('blattregister.linksRollen')}
          title={t('blattregister.weitereLinks')}
          disabled={!rollbar.links}
          onClick={() => rollen(-1)}
          onDragOver={() => rollenBeimZiehen(-1)}
        >
          <IconWinkelLinks />
        </button>
      )}
      <div
        className="sheet-tabs-liste"
        ref={listeRef}
        role="tablist"
        aria-label={t('blattregister.zeichenblaetter')}
      >
        {zeichnung.blaetter.map((blatt, index) => (
          <div
            key={blatt.id}
            role="tab"
            aria-selected={blatt.id === zeichnung.aktivesBlattId}
            className={
              `sheet-tab` +
              (blatt.id === zeichnung.aktivesBlattId ? ' aktiv' : '') +
              (blatt.id === ziehtId ? ' zieht' : '') +
              (zielIndex === index && ziehtId !== null && blatt.id !== ziehtId ? ' ablegeziel' : '')
            }
            draggable
            onClick={() => doc.setAktivesBlatt(blatt.id)}
            onDoubleClick={() => umbenennen(blatt.id, blatt.name)}
            onDragStart={(e) => {
              setZiehtId(blatt.id)
              e.dataTransfer.setData('text/plain', blatt.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragOver={(e) => {
              if (!ziehtId) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              setZielIndex(index)
            }}
            onDrop={(e) => {
              e.preventDefault()
              ablegen(index)
            }}
            onDragEnd={beendeZiehen}
          >
            <span className="sheet-tab-name">{blatt.name}</span>
            {zeichnung.blaetter.length > 1 && (
              <button
                type="button"
                className="sheet-tab-schliessen"
                aria-label={t('blattregister.loeschenAria', { name: blatt.name })}
                onClick={(e) => {
                  e.stopPropagation()
                  loeschen(blatt.id)
                }}
              >
                <IconSchliessen />
              </button>
            )}
          </div>
        ))}
      </div>
      {ueberlauf && (
        <button
          type="button"
          className="sheet-tabs-rollen"
          aria-label={t('blattregister.rechtsRollen')}
          title={t('blattregister.weitereRechts')}
          disabled={!rollbar.rechts}
          onClick={() => rollen(1)}
          onDragOver={() => rollenBeimZiehen(1)}
        >
          <IconPfeilRechts />
        </button>
      )}
      <button
        ref={neuKnopfRef}
        type="button"
        className="sheet-tab-neu"
        onClick={neuKlick}
        aria-label={t('blattregister.neuesBlatt')}
        aria-haspopup={istSchaltplan(zeichnung) ? undefined : 'menu'}
        aria-expanded={neuMenue ? true : undefined}
        title={t('blattregister.neuesBlatt')}
      >
        <IconPlus />
        <span>{t('blattregister.blatt')}</span>
      </button>
      {neuMenue &&
        createPortal(
          <div ref={neuMenueRef} className="kontextmenu" role="menu" style={neuMenue}>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setNeuMenue(null)
                legeNeuesBlattAn(doc, commands)
              }}
            >
              {t('blattregister.leeresBlatt')}
            </button>
            <button type="button" role="menuitem" onClick={() => etageEinfuegen('darueber')}>
              {t('blattregister.etageDarueber')}
            </button>
            <button type="button" role="menuitem" onClick={() => etageEinfuegen('darunter')}>
              {t('blattregister.etageDarunter')}
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
