import { useEffect, useReducer, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Point } from '../../document-model/geometry'
import { distance } from '../../document-model/geometry'
import type {
  SymbolBild,
  SymbolEinstellungsAenderung,
  SymbolElement,
  SymbolPinsel,
  SymbolStrich,
  SymbolTextGroesse,
  SymbolZeichnung,
} from '../../document-model/symbol-zeichnung'
import {
  SYMBOL_TEXT_GROESSE,
  aendereVektorForm,
  eingepassteBildFlaeche,
  istSymbolZeichnungLeer,
  leereSymbolZeichnung,
  skaliereSymbolBild,
  symbolBildProzent,
  symbolZeichnungBreite,
} from '../../document-model/symbol-zeichnung'
import {
  bearbeitbareSymbolZeichnung,
  symbolZeichnungZuSvg,
} from '../../document-model/symbol-zeichnung-svg'
import { zeichneSymbolZeichnung } from '../../rendering/symbol-zeichnung-renderer'
import type {
  SymbolHilfsgrafik,
  SymbolWerkzeugId,
  SymbolWerkzeugKontext,
  SymbolZeichnerEinstellungen,
  SymbolZeigerEreignis,
} from '../../tools/symbol-zeichner'
import {
  SymbolZeichnerZustand,
  erzeugeSymbolWerkzeuge,
  neueSymbolElementId,
} from '../../tools/symbol-zeichner'
import { istEingabeFeldFokussiert } from '../tastatur-fokus'
import {
  SYMBOL_FARBEN,
  SYMBOL_FARBWERT,
  type SymbolFarbe,
} from '../../document-model/symbol-palette'
import type { Schluessel } from '../../sprache'
import { useT } from '../sprache-anbindung'
import type { SymbolVorlage } from './vorlage-einbetten'
import { ladeBild, vorlageAlsDatenUrl } from './vorlage-einbetten'
import './symbol-zeichner.css'

interface Props {
  titel?: string
  anfangsSvg: string | null
  breitenFaktor?: number
  hoehenFaktor?: number
  vorlagen: SymbolVorlage[]
  onUebernehmen: (svg: string) => void
  onAbbrechen: () => void
}

const WERKZEUG_KNOEPFE: { id: SymbolWerkzeugId; kuerzel: string }[] = [
  { id: 'auswahl', kuerzel: 'V' },
  { id: 'linie', kuerzel: 'L' },
  { id: 'polylinie', kuerzel: 'P' },
  { id: 'rechteck', kuerzel: 'R' },
  { id: 'kreis', kuerzel: 'C' },
  { id: 'bogen', kuerzel: 'A' },
  { id: 'text', kuerzel: 'T' },
  { id: 'freihand', kuerzel: 'F' },
  { id: 'radierer', kuerzel: 'E' },
]

const STRICHE: { wert: SymbolStrich; label: Schluessel }[] = [
  { wert: 'duenn', label: 'katalogdialoge.symbolZeichner.duenn' },
  { wert: 'mittel', label: 'katalogdialoge.symbolZeichner.mittel' },
  { wert: 'dick', label: 'katalogdialoge.symbolZeichner.dick' },
]

const GROESSEN: { wert: SymbolPinsel & SymbolTextGroesse; label: Schluessel }[] = [
  { wert: 'klein', label: 'katalogdialoge.symbolZeichner.klein' },
  { wert: 'mittel', label: 'katalogdialoge.symbolZeichner.mittel' },
  { wert: 'gross', label: 'katalogdialoge.symbolZeichner.gross' },
]

const RASTER = 5
const TOLERANZ_PX = 6
const DOPPELKLICK_MS = 400
const EINPASS_RAND_PX = 28
const AKZENT = '#2f7dd1'

interface TextEingabe {
  position: Point
  wert: string
  groesse: SymbolTextGroesse
  fertig: (text: string | null) => void
}

type BildEintrag = { bild: HTMLImageElement; bereit: boolean; fehler: boolean }

function anfangsZeichnung(
  svg: string | null,
  breitenFaktor: number | undefined,
  hoehenFaktor: number | undefined,
): SymbolZeichnung {
  const breite = symbolZeichnungBreite(breitenFaktor)
  const hoehe = symbolZeichnungBreite(hoehenFaktor)
  const gelesen = bearbeitbareSymbolZeichnung(svg, breitenFaktor, hoehenFaktor)
  return gelesen
    ? { ...gelesen, breite, hoehe }
    : leereSymbolZeichnung(breitenFaktor ?? 1, hoehenFaktor ?? 1)
}

export function SymbolZeichnerDialog({
  titel: titelVorgabe,
  anfangsSvg,
  breitenFaktor,
  hoehenFaktor,
  vorlagen,
  onUebernehmen,
  onAbbrechen,
}: Props) {
  const [, neuRendern] = useReducer((n: number) => n + 1, 0)
  const [zustand] = useState(
    () => new SymbolZeichnerZustand(anfangsZeichnung(anfangsSvg, breitenFaktor, hoehenFaktor)),
  )
  const [werkzeuge] = useState(erzeugeSymbolWerkzeuge)
  const [werkzeugId, setWerkzeugId] = useState<SymbolWerkzeugId>(() =>
    istSymbolZeichnungLeer(zustand.zeichnung) ? 'linie' : 'auswahl',
  )
  const t = useT()
  const titel = titelVorgabe ?? t('katalogdialoge.symbolZeichner.titel')
  const [einstellungen, setEinstellungen] = useState<SymbolZeichnerEinstellungen>({
    strich: 'mittel',
    gefuellt: false,
    pinsel: 'mittel',
    textGroesse: 'mittel',
    farbe: 'schwarz',
    fuellFarbe: 'schwarz',
  })
  const [raster, setRaster] = useState(true)
  const anfangsVorlage = Math.max(
    vorlagen.findIndex((v) => v.vorausgewaehlt),
    vorlagen.length > 0 ? 0 : -1,
  )
  const [vorlageIndex, setVorlageIndex] = useState(anfangsVorlage)
  const [vorlageSichtbar, setVorlageSichtbar] = useState(vorlagen.some((v) => v.vorausgewaehlt))
  const [vorlageLaedt, setVorlageLaedt] = useState(false)
  const [status, setStatus] = useState('')
  const [textEingabe, setTextEingabe] = useState<TextEingabe | null>(null)
  const [verwerfenFragen, setVerwerfenFragen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const vorschauRef = useRef<HTMLCanvasElement>(null)
  const textFeldRef = useRef<HTMLTextAreaElement>(null)
  const ansicht = useRef({ massstab: 4, versatz: { x: 0, y: 0 }, eingepasst: false }).current
  const zeiger = useRef({
    gedrueckt: false,
    verschieben: null as { x: number; y: number } | null,
    leertaste: false,
    letzterDruck: null as { zeit: number; x: number; y: number } | null,
  }).current
  const bilder = useRef(new Map<string, BildEintrag>()).current
  const rahmenAnforderung = useRef(0)

  const aktuell = useRef({ einstellungen, raster, vorlageIndex, vorlageSichtbar, textEingabe })
  aktuell.current = { einstellungen, raster, vorlageIndex, vorlageSichtbar, textEingabe }

  const [kontext] = useState<SymbolWerkzeugKontext>(() => ({
    zustand,
    einstellungen: () => aktuell.current.einstellungen,
    toleranz: () => TOLERANZ_PX / ansicht.massstab,
    setStatus: (text) => setStatus(text),
    frageText: (position, anfangswert, fertig) =>
      setTextEingabe({
        position,
        wert: anfangswert,
        groesse: aktuell.current.einstellungen.textGroesse,
        fertig,
      }),
  }))

  const werkzeug = werkzeuge[werkzeugId]
  const werkzeugIdRef = useRef(werkzeugId)
  werkzeugIdRef.current = werkzeugId

  function bildQuelle(url: string): HTMLImageElement | null {
    let eintrag = bilder.get(url)
    if (!eintrag) {
      const bild = new Image()
      const neu: BildEintrag = { bild, bereit: false, fehler: false }
      bild.onload = () => {
        neu.bereit = true
        anfordern()
      }
      bild.onerror = () => {
        neu.fehler = true
      }
      bild.src = url
      bilder.set(url, neu)
      eintrag = neu
    }
    return eintrag.bereit && !eintrag.fehler ? eintrag.bild : null
  }

  function einpassen() {
    const container = containerRef.current
    if (!container || container.clientWidth === 0) return
    const z = zustand.zeichnung
    const breite = container.clientWidth
    const hoehe = container.clientHeight
    const massstab = Math.max(
      0.5,
      Math.min((breite - 2 * EINPASS_RAND_PX) / z.breite, (hoehe - 2 * EINPASS_RAND_PX) / z.hoehe),
    )
    ansicht.massstab = massstab
    ansicht.versatz = {
      x: (breite - z.breite * massstab) / 2,
      y: (hoehe - z.hoehe * massstab) / 2,
    }
    ansicht.eingepasst = true
    anfordern()
  }

  function anfordern() {
    if (rahmenAnforderung.current) return
    rahmenAnforderung.current = requestAnimationFrame(() => {
      rahmenAnforderung.current = 0
      zeichne()
    })
  }

  function zeichneHilfsgrafik(ctx: CanvasRenderingContext2D, hilfe: SymbolHilfsgrafik) {
    const m = ansicht.massstab
    ctx.save()
    ctx.strokeStyle = AKZENT
    ctx.lineWidth = 1.5 / m
    ctx.setLineDash([5 / m, 4 / m])
    ctx.beginPath()
    switch (hilfe.art) {
      case 'linienzug':
        hilfe.punkte.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
        if (hilfe.geschlossen) ctx.closePath()
        break
      case 'kreis':
        ctx.arc(hilfe.mitte.x, hilfe.mitte.y, hilfe.radius, 0, Math.PI * 2)
        break
      case 'rahmen':
        if (hilfe.auswahl) ctx.setLineDash([])
        ctx.rect(
          hilfe.box.min.x,
          hilfe.box.min.y,
          hilfe.box.max.x - hilfe.box.min.x,
          hilfe.box.max.y - hilfe.box.min.y,
        )
        break
      case 'pinsel':
        ctx.setLineDash([])
        ctx.strokeStyle = '#7a8391'
        ctx.lineWidth = 1 / m
        ctx.arc(hilfe.mitte.x, hilfe.mitte.y, hilfe.radius, 0, Math.PI * 2)
        break
      case 'markierung': {
        const halb = 5 / m
        ctx.setLineDash([])
        ctx.rect(hilfe.punkt.x - halb, hilfe.punkt.y - halb, halb * 2, halb * 2)
        break
      }
    }
    ctx.stroke()
    ctx.restore()
  }

  function zeichne() {
    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !container || !ctx) return
    const dpr = window.devicePixelRatio || 1
    const breitePx = Math.round(container.clientWidth * dpr)
    const hoehePx = Math.round(container.clientHeight * dpr)
    if (canvas.width !== breitePx) canvas.width = breitePx
    if (canvas.height !== hoehePx) canvas.height = hoehePx

    const { massstab: m, versatz } = ansicht
    const z = zustand.zeichnung
    const { raster: rasterAn, vorlageIndex: vIndex, vorlageSichtbar: vSichtbar } = aktuell.current

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#e4e7ec'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(dpr * m, 0, 0, dpr * m, dpr * versatz.x, dpr * versatz.y)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, z.breite, z.hoehe)

    if (rasterAn) {
      ctx.save()
      ctx.lineWidth = 1 / m
      for (let x = 0; x <= z.breite + 1e-6; x += RASTER) {
        ctx.strokeStyle = Math.round(x) % 25 === 0 ? '#d3d8e0' : '#eceef2'
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, z.hoehe)
        ctx.stroke()
      }
      for (let y = 0; y <= z.hoehe + 1e-6; y += RASTER) {
        ctx.strokeStyle = Math.round(y) % 25 === 0 ? '#d3d8e0' : '#eceef2'
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(z.breite, y)
        ctx.stroke()
      }
      ctx.restore()
    }

    const vorlage = vSichtbar ? vorlagen[vIndex] : undefined
    const vorlagenBild = vorlage ? bildQuelle(vorlage.url) : null
    if (vorlagenBild) {
      const flaeche = eingepassteBildFlaeche(
        vorlagenBild.naturalWidth || 100,
        vorlagenBild.naturalHeight || 100,
        z.breite,
        z.hoehe,
      )
      ctx.save()
      ctx.globalAlpha = 0.3
      ctx.drawImage(vorlagenBild, flaeche.ecke.x, flaeche.ecke.y, flaeche.breite, flaeche.hoehe)
      ctx.restore()
    }

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, z.breite, z.hoehe)
    ctx.clip()
    zeichneSymbolZeichnung(ctx, werkzeuge[werkzeugIdRef.current].vorschau(z, kontext), {
      bildQuelle,
    })
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = '#8a94a3'
    ctx.lineWidth = 1 / m
    ctx.strokeRect(0, 0, z.breite, z.hoehe)
    ctx.restore()

    for (const hilfe of werkzeuge[werkzeugIdRef.current].hilfsgrafik(kontext)) {
      zeichneHilfsgrafik(ctx, hilfe)
    }

    zeichneVorschau(z)
  }

  function zeichneVorschau(z: SymbolZeichnung) {
    const canvas = vorschauRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    const hoehe = 72
    const breite = Math.round((hoehe * z.breite) / z.hoehe)
    canvas.style.width = `${breite}px`
    canvas.style.height = `${hoehe}px`
    if (canvas.width !== breite * dpr) canvas.width = breite * dpr
    if (canvas.height !== hoehe * dpr) canvas.height = hoehe * dpr
    const m = (hoehe * dpr) / z.hoehe
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(m, 0, 0, m, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, z.breite, z.hoehe)
    ctx.beginPath()
    ctx.rect(0, 0, z.breite, z.hoehe)
    ctx.clip()
    zeichneSymbolZeichnung(ctx, z, { bildQuelle })
  }

  const aktiviert = useRef(false)
  useEffect(() => {
    if (aktiviert.current) return
    aktiviert.current = true
    werkzeuge[werkzeugIdRef.current].aktiviere(kontext)
  }, [werkzeuge, kontext])

  useEffect(() =>
    zustand.subscribe(() => {
      neuRendern()
      anfordern()
    }),
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const beobachter = new ResizeObserver(() => {
      if (!ansicht.eingepasst) einpassen()
      anfordern()
    })
    beobachter.observe(container)
    return () => beobachter.disconnect()
  }, [])

  useEffect(() => {
    anfordern()
  })

  useEffect(
    () => () => {
      if (rahmenAnforderung.current) cancelAnimationFrame(rahmenAnforderung.current)
      rahmenAnforderung.current = 0
    },
    [],
  )

  const textEingabeOffen = textEingabe !== null
  useEffect(() => {
    if (!textEingabeOffen) return
    const id = requestAnimationFrame(() => textFeldRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [textEingabeOffen])

  function symbolPunkt(clientX: number, clientY: number): Point {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (clientX - rect.left - ansicht.versatz.x) / ansicht.massstab,
      y: (clientY - rect.top - ansicht.versatz.y) / ansicht.massstab,
    }
  }

  function ereignis(e: React.PointerEvent, doppelklick = false): SymbolZeigerEreignis {
    const roh = symbolPunkt(e.clientX, e.clientY)
    const fangen = werkzeug.fangen && aktuell.current.raster
    const punkt = fangen
      ? { x: Math.round(roh.x / RASTER) * RASTER, y: Math.round(roh.y / RASTER) * RASTER }
      : roh
    return { punkt, roh, umschalt: e.shiftKey, doppelklick, gedrueckt: zeiger.gedrueckt }
  }

  function beiZeigerRunter(e: React.PointerEvent<HTMLCanvasElement>) {
    if (textEingabe) return
    e.currentTarget.setPointerCapture(e.pointerId)
    if (e.button === 1 || (e.button === 0 && zeiger.leertaste)) {
      e.preventDefault()
      zeiger.verschieben = { x: e.clientX, y: e.clientY }
      return
    }
    if (e.button !== 0) return
    const jetzt = performance.now()
    const vorher = zeiger.letzterDruck
    const doppelklick =
      !!vorher &&
      jetzt - vorher.zeit < DOPPELKLICK_MS &&
      distance(vorher, { x: e.clientX, y: e.clientY }) < TOLERANZ_PX
    zeiger.letzterDruck = doppelklick ? null : { zeit: jetzt, x: e.clientX, y: e.clientY }
    zeiger.gedrueckt = true
    werkzeug.runter(ereignis(e, doppelklick), kontext)
    anfordern()
  }

  function beiZeigerBewegt(e: React.PointerEvent<HTMLCanvasElement>) {
    if (zeiger.verschieben) {
      ansicht.versatz = {
        x: ansicht.versatz.x + e.clientX - zeiger.verschieben.x,
        y: ansicht.versatz.y + e.clientY - zeiger.verschieben.y,
      }
      zeiger.verschieben = { x: e.clientX, y: e.clientY }
      anfordern()
      return
    }
    werkzeug.bewegt(ereignis(e), kontext)
    anfordern()
  }

  function beiZeigerHoch(e: React.PointerEvent<HTMLCanvasElement>) {
    if (zeiger.verschieben) {
      zeiger.verschieben = null
      return
    }
    if (!zeiger.gedrueckt) return
    zeiger.gedrueckt = false
    werkzeug.hoch(ereignis(e), kontext)
    anfordern()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    function beiRad(e: WheelEvent) {
      e.preventDefault()
      const rect = canvas!.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const faktor = Math.exp(-e.deltaY * 0.0015)
      const neu = Math.min(80, Math.max(0.5, ansicht.massstab * faktor))
      const wirklich = neu / ansicht.massstab
      ansicht.versatz = {
        x: sx - (sx - ansicht.versatz.x) * wirklich,
        y: sy - (sy - ansicht.versatz.y) * wirklich,
      }
      ansicht.massstab = neu
      anfordern()
    }
    canvas.addEventListener('wheel', beiRad, { passive: false })
    return () => canvas.removeEventListener('wheel', beiRad)
  })

  function wechsleWerkzeug(id: SymbolWerkzeugId) {
    werkzeug.abbrechen(kontext)
    setWerkzeugId(id)
    werkzeugIdRef.current = id
    werkzeuge[id].aktiviere(kontext)
    anfordern()
  }

  function rueckgaengig() {
    werkzeug.abbrechen(kontext)
    zustand.stack.undo()
  }

  function wiederholen() {
    werkzeug.abbrechen(kontext)
    zustand.stack.redo()
  }

  useEffect(() => {
    function beiTaste(e: KeyboardEvent) {
      if (aktuell.current.textEingabe || istEingabeFeldFokussiert()) return
      const mod = e.metaKey || e.ctrlKey
      const verbrauchen = () => {
        e.preventDefault()
        e.stopPropagation()
        anfordern()
      }
      const taste = e.key.toLowerCase()
      if (mod && taste === 'z') {
        if (e.shiftKey) wiederholen()
        else rueckgaengig()
        return verbrauchen()
      }
      if (mod && taste === 'y') {
        wiederholen()
        return verbrauchen()
      }
      if (mod || e.altKey) return
      if (e.key === 'Escape') {
        werkzeug.abbrechen(kontext)
        return verbrauchen()
      }
      if (e.key === ' ') {
        zeiger.leertaste = true
        return verbrauchen()
      }
      if (werkzeug.taste(e.key, kontext)) return verbrauchen()
      const knopf = WERKZEUG_KNOEPFE.find((w) => w.kuerzel.toLowerCase() === taste)
      if (knopf) {
        wechsleWerkzeug(knopf.id)
        return verbrauchen()
      }
    }
    function beiTasteHoch(e: KeyboardEvent) {
      if (e.key === ' ') zeiger.leertaste = false
    }
    window.addEventListener('keydown', beiTaste, true)
    window.addEventListener('keyup', beiTasteHoch, true)
    return () => {
      window.removeEventListener('keydown', beiTaste, true)
      window.removeEventListener('keyup', beiTasteHoch, true)
    }
  })

  function einstellungAendern<K extends keyof SymbolZeichnerEinstellungen>(
    schluessel: K,
    wert: SymbolZeichnerEinstellungen[K],
  ) {
    setEinstellungen((s) => ({ ...s, [schluessel]: wert }))
    if (werkzeugId !== 'auswahl' || zustand.auswahl.length === 0) return
    const abbildung = (el: SymbolElement): SymbolElement => {
      if (el.art === 'vektor') {
        if (schluessel === 'pinsel') return el
        const aenderung = (
          schluessel === 'gefuellt'
            ? { schluessel, wert, fuellFarbe: einstellungen.fuellFarbe }
            : { schluessel, wert }
        ) as SymbolEinstellungsAenderung
        const form = aendereVektorForm(el.form, aenderung)
        return form === el.form ? el : { ...el, form }
      }
      if (schluessel === 'strich' && 'strich' in el && el.strich !== wert) {
        return { ...el, strich: wert as SymbolStrich }
      }
      if (
        schluessel === 'gefuellt' &&
        (el.art === 'rechteck' ||
          el.art === 'kreis' ||
          (el.art === 'polylinie' && el.geschlossen)) &&
        el.gefuellt !== wert
      ) {
        return { ...el, gefuellt: wert as boolean }
      }
      if (schluessel === 'textGroesse' && el.art === 'text' && el.groesse !== wert) {
        return { ...el, groesse: wert as SymbolTextGroesse }
      }
      if (schluessel === 'farbe' && el.art !== 'bild' && (el.farbe ?? 'schwarz') !== wert) {
        return mitFarbe(el, 'farbe', wert as SymbolFarbe)
      }
      if (
        schluessel === 'fuellFarbe' &&
        (el.art === 'rechteck' || el.art === 'kreis' || el.art === 'polylinie') &&
        (el.fuellFarbe ?? 'schwarz') !== wert
      ) {
        return mitFarbe(el, 'fuellFarbe', wert as SymbolFarbe)
      }
      return el
    }
    const label =
      schluessel === 'strich'
        ? t('katalogdialoge.symbolZeichner.strichstaerke')
        : schluessel === 'gefuellt'
          ? t('katalogdialoge.symbolZeichner.fuellung')
          : schluessel === 'farbe'
            ? t('symbolfarben.aenderungFarbe')
            : schluessel === 'fuellFarbe'
              ? t('symbolfarben.aenderungFuellfarbe')
              : t('katalogdialoge.symbolZeichner.textgroesse')
    zustand.aendereAuswahl(label, abbildung)
  }

  async function vorlageUebernehmen() {
    const vorlage = vorlagen[vorlageIndex]
    if (!vorlage) return
    setVorlageLaedt(true)
    try {
      const { datenUrl, breite, hoehe } = await vorlageAlsDatenUrl(vorlage.url)
      await ladeBild(datenUrl).catch(() => null)
      zustand.aendere(t('katalogdialoge.symbolZeichner.vorlageUebernehmen'), (z) => {
        const bild: SymbolBild = {
          art: 'bild',
          id: neueSymbolElementId(),
          datenUrl,
          ...eingepassteBildFlaeche(breite, hoehe, z.breite, z.hoehe),
          radierungen: [],
        }
        return { ...z, elemente: [bild, ...z.elemente] }
      })
      setVorlageSichtbar(false)
    } catch {
      setStatus(t('katalogdialoge.symbolZeichner.vorlageFehler'))
    } finally {
      setVorlageLaedt(false)
    }
  }

  function bildGroesseSetzen(element: SymbolBild, prozent: number) {
    if (!Number.isFinite(prozent) || prozent <= 0) return
    const faktor = prozent / symbolBildProzent(element, zustand.zeichnung)
    if (Math.abs(faktor - 1) < 1e-6) return
    zustand.aendereAuswahl(t('katalogdialoge.symbolZeichner.bildgroesse'), (el) =>
      el.id === element.id && el.art === 'bild' ? skaliereSymbolBild(el, faktor) : el,
    )
  }

  function textEingabeBeenden(text: string | null) {
    const eingabe = aktuell.current.textEingabe
    if (!eingabe) return
    aktuell.current.textEingabe = null
    setTextEingabe(null)
    eingabe.fertig(text)
    anfordern()
  }

  function abbrechen() {
    if (zustand.geaendert && !verwerfenFragen) {
      setVerwerfenFragen(true)
      return
    }
    onAbbrechen()
  }

  const leer = istSymbolZeichnungLeer(zustand.zeichnung)
  const ausgewaehlt = zustand.ausgewaehlteElemente()
  const einzelnesBild =
    werkzeugId === 'auswahl' && ausgewaehlt.length === 1 && ausgewaehlt[0].art === 'bild'
      ? ausgewaehlt[0]
      : null
  const zeigeStrich = werkzeugId !== 'radierer' && werkzeugId !== 'text'
  const zeigeFuellung = ['auswahl', 'rechteck', 'kreis', 'polylinie'].includes(werkzeugId)
  const zeigeTextGroesse = werkzeugId === 'text' || werkzeugId === 'auswahl'
  const zeigeFarbe = werkzeugId !== 'radierer'
  const textPosition = textEingabe
    ? {
        left: ansicht.versatz.x + textEingabe.position.x * ansicht.massstab,
        top: ansicht.versatz.y + textEingabe.position.y * ansicht.massstab,
        fontSize: SYMBOL_TEXT_GROESSE[textEingabe.groesse] * ansicht.massstab,
      }
    : null

  return createPortal(
    <div className="symbolzeichner-overlay">
      <div className="symbolzeichner" role="dialog" aria-label={titel}>
        <div className="symbolzeichner-kopf">
          <h2>{titel}</h2>
          <div
            className="symbolzeichner-werkzeuge"
            role="toolbar"
            aria-label={t('katalogdialoge.symbolZeichner.zeichenwerkzeuge')}
          >
            {WERKZEUG_KNOEPFE.map((w) => (
              <button
                key={w.id}
                type="button"
                className={w.id === werkzeugId ? 'aktiv' : undefined}
                aria-pressed={w.id === werkzeugId}
                title={`${t(`katalogdialoge.symbolZeichner.werkzeuge.${w.id}`)} (${w.kuerzel})`}
                onClick={() => wechsleWerkzeug(w.id)}
              >
                {t(`katalogdialoge.symbolZeichner.werkzeuge.${w.id}`)}
              </button>
            ))}
            <span className="symbolzeichner-trenner" />
            <button
              type="button"
              disabled={!zustand.stack.canUndo()}
              title={t('katalogdialoge.symbolZeichner.rueckgaengigTitel')}
              onClick={() => {
                rueckgaengig()
                anfordern()
              }}
            >
              {t('katalogdialoge.symbolZeichner.rueckgaengig')}
            </button>
            <button
              type="button"
              disabled={!zustand.stack.canRedo()}
              title={t('katalogdialoge.symbolZeichner.wiederholenTitel')}
              onClick={() => {
                wiederholen()
                anfordern()
              }}
            >
              {t('katalogdialoge.symbolZeichner.wiederholen')}
            </button>
          </div>
        </div>

        <div className="symbolzeichner-haupt">
          <div className="symbolzeichner-flaeche" ref={containerRef}>
            <canvas
              ref={canvasRef}
              className={`symbolzeichner-canvas werkzeug-${werkzeugId}`}
              onPointerDown={beiZeigerRunter}
              onPointerMove={beiZeigerBewegt}
              onPointerUp={beiZeigerHoch}
              onPointerCancel={beiZeigerHoch}
              onContextMenu={(e) => e.preventDefault()}
            />
            {textEingabe && textPosition && (
              <textarea
                className="symbolzeichner-texteingabe"
                aria-label={t('katalogdialoge.symbolZeichner.text')}
                ref={textFeldRef}
                rows={Math.max(1, textEingabe.wert.split('\n').length)}
                style={textPosition}
                value={textEingabe.wert}
                onChange={(e) => setTextEingabe({ ...textEingabe, wert: e.target.value })}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    textEingabeBeenden(textEingabe.wert)
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    textEingabeBeenden(null)
                  }
                }}
                onBlur={() => textEingabeBeenden(textEingabe.wert)}
              />
            )}
          </div>

          <aside className="symbolzeichner-seite">
            <div className="symbolzeichner-gruppe">
              <span className="symbolzeichner-gruppentitel">
                {t('katalogdialoge.symbolZeichner.vorschau')}
              </span>
              <canvas ref={vorschauRef} className="symbolzeichner-vorschau" />
            </div>

            {zeigeStrich && (
              <div
                className="symbolzeichner-gruppe"
                role="radiogroup"
                aria-label={t('katalogdialoge.symbolZeichner.strichstaerke')}
              >
                <span className="symbolzeichner-gruppentitel">
                  {t('katalogdialoge.symbolZeichner.strich')}
                </span>
                <div className="symbolzeichner-segmente">
                  {STRICHE.map((s) => (
                    <button
                      key={s.wert}
                      type="button"
                      role="radio"
                      aria-checked={einstellungen.strich === s.wert}
                      className={einstellungen.strich === s.wert ? 'aktiv' : undefined}
                      onClick={() => einstellungAendern('strich', s.wert)}
                    >
                      {t(s.label)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {zeigeFarbe && (
              <FarbTupfer
                titel={t('symbolfarben.strichfarbe')}
                wert={einstellungen.farbe}
                name={(f) => t(`symbolfarben.farben.${f}`)}
                onAendern={(f) => einstellungAendern('farbe', f)}
              />
            )}

            {zeigeFuellung && (
              <label className="symbolzeichner-schalter">
                <input
                  type="checkbox"
                  checked={einstellungen.gefuellt}
                  onChange={(e) => einstellungAendern('gefuellt', e.target.checked)}
                />
                {t('symbolfarben.fuellung')}
              </label>
            )}

            {zeigeFuellung && einstellungen.gefuellt && (
              <FarbTupfer
                titel={t('symbolfarben.fuellfarbe')}
                wert={einstellungen.fuellFarbe}
                name={(f) => t(`symbolfarben.farben.${f}`)}
                onAendern={(f) => einstellungAendern('fuellFarbe', f)}
              />
            )}

            {zeigeFarbe && (
              <p className="symbolzeichner-hinweis">{t('symbolfarben.hinweisStandardfarbe')}</p>
            )}

            {werkzeugId === 'radierer' && (
              <div
                className="symbolzeichner-gruppe"
                role="radiogroup"
                aria-label={t('katalogdialoge.symbolZeichner.radiererGroesse')}
              >
                <span className="symbolzeichner-gruppentitel">
                  {t('katalogdialoge.symbolZeichner.werkzeuge.radierer')}
                </span>
                <div className="symbolzeichner-segmente">
                  {GROESSEN.map((g) => (
                    <button
                      key={g.wert}
                      type="button"
                      role="radio"
                      aria-checked={einstellungen.pinsel === g.wert}
                      className={einstellungen.pinsel === g.wert ? 'aktiv' : undefined}
                      onClick={() => einstellungAendern('pinsel', g.wert)}
                    >
                      {t(g.label)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {zeigeTextGroesse && (
              <div
                className="symbolzeichner-gruppe"
                role="radiogroup"
                aria-label={t('katalogdialoge.symbolZeichner.textgroesse')}
              >
                <span className="symbolzeichner-gruppentitel">
                  {t('katalogdialoge.symbolZeichner.textgroesse')}
                </span>
                <div className="symbolzeichner-segmente">
                  {GROESSEN.map((g) => (
                    <button
                      key={g.wert}
                      type="button"
                      role="radio"
                      aria-checked={einstellungen.textGroesse === g.wert}
                      className={einstellungen.textGroesse === g.wert ? 'aktiv' : undefined}
                      onClick={() => einstellungAendern('textGroesse', g.wert)}
                    >
                      {t(g.label)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {einzelnesBild && einzelnesBild.art === 'bild' && (
              <ProzentFeld
                key={`${einzelnesBild.id}-${einzelnesBild.breite}`}
                wert={symbolBildProzent(einzelnesBild, zustand.zeichnung)}
                onSetzen={(prozent) => bildGroesseSetzen(einzelnesBild, prozent)}
              />
            )}

            {werkzeugId === 'auswahl' && ausgewaehlt.length > 0 && (
              <button type="button" onClick={() => zustand.loescheAuswahl()}>
                {t('katalogdialoge.symbolZeichner.auswahlLoeschen')}
              </button>
            )}

            <label className="symbolzeichner-schalter">
              <input
                type="checkbox"
                checked={raster}
                onChange={(e) => setRaster(e.target.checked)}
              />
              {t('katalogdialoge.symbolZeichner.rasterUndFang')}
            </label>

            {vorlagen.length > 0 && (
              <div className="symbolzeichner-gruppe">
                <span className="symbolzeichner-gruppentitel">
                  {t('katalogdialoge.symbolZeichner.vorlage')}
                </span>
                <select
                  aria-label={t('katalogdialoge.symbolZeichner.vorlage')}
                  value={vorlageIndex}
                  onChange={(e) => setVorlageIndex(Number(e.target.value))}
                >
                  {vorlagen.map((v, i) => (
                    <option key={`${i}-${v.url}`} value={i}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <label className="symbolzeichner-schalter">
                  <input
                    type="checkbox"
                    checked={vorlageSichtbar}
                    onChange={(e) => setVorlageSichtbar(e.target.checked)}
                  />
                  {t('katalogdialoge.symbolZeichner.blassEinblenden')}
                </label>
                <button
                  type="button"
                  disabled={vorlageLaedt}
                  onClick={() => void vorlageUebernehmen()}
                  title={t('katalogdialoge.symbolZeichner.alsTeilTitel')}
                >
                  {t('katalogdialoge.symbolZeichner.alsTeil')}
                </button>
              </div>
            )}

            <button type="button" onClick={einpassen}>
              {t('katalogdialoge.symbolZeichner.einpassen')}
            </button>
            {zustand.zeichnung.elemente.some((e) => e.art === 'vektor') && (
              <p className="symbolzeichner-hinweis">
                {t('katalogdialoge.symbolZeichner.vektorHinweis')}
              </p>
            )}
            <p className="symbolzeichner-hinweis">
              {t('katalogdialoge.symbolZeichner.navigationHinweis')}
            </p>
          </aside>
        </div>

        <div className="symbolzeichner-fuss">
          <span className="symbolzeichner-status" aria-live="polite">
            {status}
          </span>
          <button
            type="button"
            disabled={leer}
            onClick={() =>
              zustand.aendere(t('katalogdialoge.symbolZeichner.allesLoeschen'), (z) => ({
                ...z,
                elemente: [],
              }))
            }
          >
            {t('katalogdialoge.symbolZeichner.allesLoeschen')}
          </button>
          <button type="button" onClick={abbrechen}>
            {verwerfenFragen
              ? t('katalogdialoge.symbolZeichner.verwerfenFrage')
              : t('katalogdialoge.gemeinsam.abbrechen')}
          </button>
          <button
            type="button"
            className="primaer"
            disabled={leer}
            title={leer ? t('katalogdialoge.symbolZeichner.leerTitel') : undefined}
            onClick={() => onUebernehmen(symbolZeichnungZuSvg(zustand.zeichnung))}
          >
            {t('katalogdialoge.gemeinsam.uebernehmen')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ProzentFeld({ wert, onSetzen }: { wert: number; onSetzen: (prozent: number) => void }) {
  const [text, setText] = useState(String(Math.round(wert)))
  const t = useT()
  return (
    <label className="symbolzeichner-gruppe">
      <span className="symbolzeichner-gruppentitel">
        {t('katalogdialoge.symbolZeichner.bildgroesseProzent')}
      </span>
      <input
        type="number"
        min={1}
        max={1000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onSetzen(Number(text))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSetzen(Number(text))
        }}
      />
    </label>
  )
}

function mitFarbe<E extends SymbolElement>(
  element: E,
  feld: 'farbe' | 'fuellFarbe',
  farbe: SymbolFarbe,
): E {
  const neu = { ...element } as E & Partial<Record<typeof feld, SymbolFarbe>>
  if (farbe === 'schwarz') delete neu[feld]
  else neu[feld] = farbe
  return neu
}

function FarbTupfer(props: {
  titel: string
  wert: SymbolFarbe
  name: (farbe: SymbolFarbe) => string
  onAendern: (farbe: SymbolFarbe) => void
}) {
  return (
    <div className="symbolzeichner-gruppe" role="radiogroup" aria-label={props.titel}>
      <span className="symbolzeichner-gruppentitel">{props.titel}</span>
      <div className="symbolzeichner-farben">
        {SYMBOL_FARBEN.map((farbe) => (
          <button
            key={farbe}
            type="button"
            role="radio"
            aria-checked={props.wert === farbe}
            aria-label={props.name(farbe)}
            title={props.name(farbe)}
            className={props.wert === farbe ? 'aktiv' : undefined}
            style={{ background: SYMBOL_FARBWERT[farbe] }}
            onClick={() => props.onAendern(farbe)}
          />
        ))}
      </div>
    </div>
  )
}
