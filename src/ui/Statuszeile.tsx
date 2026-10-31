import { useEffect, useRef, useState, type KeyboardEvent, type FormEvent } from 'react'
import {
  istLeitungsverlegungsObjekt,
  istSchaltplan,
  planMassstabNenner,
  planMassstabText,
} from '../document-model'
import { useLeitungsverlegungAus } from './leitungsverlegung'
import { useAktivesBlatt, useAppContext, useProject } from './use-app-context'
import { formatiereZahl } from '../sprache/format'
import { useUiStore } from './store/ui-store'
import { useZusatzmodulStore } from './store/zusatzmodul-store'
import { WerkzeugIcon } from './components/Icons'
import { werkzeugName } from './werkzeug-namen'
import {
  abonniereMassEingabeAnforderung,
  abonniereZeigerStand,
  letzterZeigerStand,
  meldeMassEingabe,
  type ZeigerStand,
} from './statusleiste-signal'
import { istMassEingabeLeer, type KonstruktionsMass, type MassEingabe } from '../tools'
import { hatTaste } from './befehle/kuerzel'
import { useT } from './sprache-anbindung'

function koordinatenText(stand: ZeigerStand): string {
  if (!stand.welt) return '–'
  return `X ${stand.welt.x.toFixed(2)} · Y ${stand.welt.y.toFixed(2)} m`
}

function netzfeldText(stand: ZeigerStand): string {
  return stand.netzfeld ?? '–'
}

function zoomText(stand: ZeigerStand): string {
  const wert = stand.zoomProzent
  return `${wert < 10 ? wert.toFixed(1) : Math.round(wert)} %`
}

type MassFeld = keyof MassEingabe
const MASS_FELDER: readonly MassFeld[] = ['laenge', 'winkelAbsolut', 'winkelRelativ']

function anzeigeWert(mass: KonstruktionsMass, feld: MassFeld): string {
  switch (feld) {
    case 'laenge':
      return mass.laenge.toFixed(2)
    case 'winkelAbsolut':
      return mass.winkelAbsolut.toFixed(1)
    case 'winkelRelativ':
      if (mass.winkelRelativ === null) return '–'
      return (Number(mass.winkelRelativ.toFixed(1)) + 0).toFixed(1)
  }
}

function liesZahl(text: string): number | null {
  const bereinigt = text.trim().replace(',', '.')
  if (bereinigt === '') return null
  const wert = Number(bereinigt)
  return Number.isFinite(wert) ? wert : null
}

const KI_VERBUNDEN_MS = 10 * 60_000

function KiKennzeichen() {
  const t = useT()
  const status = useUiStore((s) => s.kiStatus)
  const verbunden = useUiStore((s) => s.kiBrueckeVerbunden)
  const [jetzt, setJetzt] = useState(() => Date.now())
  useEffect(() => {
    const takt = setInterval(() => setJetzt(Date.now()), 60_000)
    return () => clearInterval(takt)
  }, [])
  if (!status?.aktiv || !verbunden) return null
  const zuletzt = status.client ? Date.parse(status.client.zuletzt) : Number.NaN
  const aktiv = Number.isFinite(zuletzt) && jetzt - zuletzt < KI_VERBUNDEN_MS
  return (
    <button
      type="button"
      className={`statuszeile-ki${aktiv ? ' statuszeile-ki-aktiv' : ''}`}
      title={
        aktiv
          ? t(status.nurLesen ? 'statuszeile.kiZugriffNurLesen' : 'statuszeile.kiZugriff', {
              name: status.client?.name ?? t('statuszeile.kiAssistent'),
            })
          : t('statuszeile.kiBereitTitel')
      }
      onClick={() => useUiStore.getState().setEinstellungenOffen(true, 'ki')}
    >
      {aktiv ? t('statuszeile.kiVerbunden') : t('statuszeile.kiBereit')}
    </button>
  )
}

function LeitungsverlegungKennzeichen() {
  const t = useT()
  const aus = useLeitungsverlegungAus()
  const blatt = useAktivesBlatt()
  if (!aus) return null
  const anzahl = { leitung: 0, trunk: 0, kabelschacht: 0, liste: 0 }
  for (const o of blatt.objekte) {
    if (!istLeitungsverlegungsObjekt(o)) continue
    if (o.type === 'leitung' || o.type === 'trunk' || o.type === 'kabelschacht') anzahl[o.type]++
    else anzahl.liste++
  }
  const teile = [
    anzahl.leitung > 0 && t('statuszeile.ausgeblendetLeitungen', { n: anzahl.leitung }),
    anzahl.trunk > 0 && t('statuszeile.ausgeblendetTrunks', { n: anzahl.trunk }),
    anzahl.kabelschacht > 0 && t('statuszeile.ausgeblendetSchaechte', { n: anzahl.kabelschacht }),
    anzahl.liste > 0 && t('statuszeile.ausgeblendetListen', { n: anzahl.liste }),
  ].filter((teil): teil is string => typeof teil === 'string')
  if (teile.length === 0) return null
  return (
    <button
      type="button"
      className="statuszeile-ki"
      title={t('statuszeile.ausgeblendetTitel')}
      onClick={() => useUiStore.getState().setEinstellungenOffen(true, 'leitungen')}
    >
      {t('statuszeile.ausgeblendet', { liste: teile.join(', ') })}
    </button>
  )
}

function ZusatzmodulKennzeichen() {
  const t = useT()
  const { zusatzmodule } = useAppContext()
  const laufend = useZusatzmodulStore((s) => s.laufend)
  const name = useZusatzmodulStore(
    (s) => s.eintraege.find((e) => e.manifest.kennung === laufend?.kennung)?.manifest.name,
  )
  if (!laufend) return null
  const fortschritt = laufend.fortschritt
  const text = `${name ?? laufend.kennung}: ${fortschritt?.text ?? laufend.titel} …`
  const anteil =
    fortschritt?.anteil === null || fortschritt?.anteil === undefined
      ? null
      : formatiereZahl(fortschritt.anteil * 100, { maximumFractionDigits: 0 })
  return (
    <span className="statuszeile-modul" title={t('statuszeile.modulAbbrechenTitel')}>
      {anteil === null ? text : `${text} ${anteil} %`}
      <button
        type="button"
        className="statuszeile-modul-abbrechen"
        aria-label={t('statuszeile.modulAbbrechen')}
        onClick={() => zusatzmodule.abbrechen()}
      >
        ✕
      </button>
    </span>
  )
}

export function Statuszeile() {
  const t = useT()
  const aktivesToolId = useUiStore((s) => s.aktivesToolId)
  const blatt = useAktivesBlatt()
  const schaltplan = istSchaltplan(useProject())
  const koordinatenRef = useRef<HTMLSpanElement | null>(null)
  const netzfeldRef = useRef<HTMLSpanElement | null>(null)
  const zoomRef = useRef<HTMLSpanElement | null>(null)
  const massBereichRef = useRef<HTMLSpanElement | null>(null)
  const laengeRef = useRef<HTMLInputElement | null>(null)
  const winkelAbsolutRef = useRef<HTMLInputElement | null>(null)
  const winkelRelativRef = useRef<HTMLInputElement | null>(null)
  const bearbeitetRef = useRef(new Set<MassFeld>())
  const start = letzterZeigerStand()

  const feldRefs = {
    laenge: laengeRef,
    winkelAbsolut: winkelAbsolutRef,
    winkelRelativ: winkelRelativRef,
  }

  function aktuelleEingabe(): MassEingabe | null {
    const lies = (feld: MassFeld) =>
      bearbeitetRef.current.has(feld) ? liesZahl(feldRefs[feld].current?.value ?? '') : null
    const laenge = lies('laenge')
    const eingabe: MassEingabe = {
      laenge: laenge !== null && laenge > 0 ? laenge : null,
      winkelAbsolut: lies('winkelAbsolut'),
      winkelRelativ: lies('winkelRelativ'),
    }
    return istMassEingabeLeer(eingabe) ? null : eingabe
  }

  useEffect(() => {
    return abonniereZeigerStand((stand) => {
      if (koordinatenRef.current) koordinatenRef.current.textContent = koordinatenText(stand)
      if (netzfeldRef.current) netzfeldRef.current.textContent = netzfeldText(stand)
      if (zoomRef.current) zoomRef.current.textContent = zoomText(stand)
      if (massBereichRef.current) massBereichRef.current.hidden = stand.mass === null
      if (!stand.mass) {
        bearbeitetRef.current.clear()
        return
      }
      for (const feld of MASS_FELDER) {
        const input = feldRefs[feld].current
        if (!input) continue
        input.readOnly = !stand.mass.eingebbar
        if (!bearbeitetRef.current.has(feld)) input.value = anzeigeWert(stand.mass, feld)
      }
    })
  }, [])

  useEffect(() => {
    return abonniereMassEingabeAnforderung((zeichen) => {
      const input = laengeRef.current
      if (!input || input.readOnly) return
      bearbeitetRef.current.add('laenge')
      input.value = zeichen
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
      meldeMassEingabe({ art: 'aenderung', eingabe: aktuelleEingabe() })
    })
  }, [])

  function handleMassKeyDown(feld: MassFeld, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      meldeMassEingabe({ art: 'bestaetigen', eingabe: aktuelleEingabe() })
      bearbeitetRef.current.clear()
      laengeRef.current?.focus()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      bearbeitetRef.current.clear()
      meldeMassEingabe({ art: 'aenderung', eingabe: null })
      e.currentTarget.blur()
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const index = MASS_FELDER.indexOf(feld)
      const naechstes = MASS_FELDER[(index + (e.shiftKey ? MASS_FELDER.length - 1 : 1)) % 3]
      feldRefs[naechstes].current?.focus()
      return
    }
    if (
      !bearbeitetRef.current.has(feld) &&
      hatTaste(e) &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.currentTarget.value = ''
      bearbeitetRef.current.add(feld)
    }
  }

  function handleMassInput(feld: MassFeld, e: FormEvent<HTMLInputElement>) {
    const leer = e.currentTarget.value === ''
    if (leer) bearbeitetRef.current.delete(feld)
    else bearbeitetRef.current.add(feld)
    if (!leer && feld === 'winkelAbsolut') bearbeitetRef.current.delete('winkelRelativ')
    if (!leer && feld === 'winkelRelativ') bearbeitetRef.current.delete('winkelAbsolut')
    meldeMassEingabe({ art: 'aenderung', eingabe: aktuelleEingabe() })
  }

  function massFeld(feld: MassFeld, klasse: string, label: string, startwert: string) {
    return (
      <input
        className={`statuszeile-eingabe ${klasse}`}
        ref={feldRefs[feld]}
        type="text"
        inputMode="decimal"
        aria-label={label}
        defaultValue={startwert}
        readOnly={start.mass ? !start.mass.eingebbar : false}
        onKeyDown={(e) => handleMassKeyDown(feld, e)}
        onInput={(e) => handleMassInput(feld, e)}
      />
    )
  }

  const planNenner = planMassstabNenner(blatt)
  const massstab =
    planNenner !== null
      ? planMassstabText(planNenner)
      : blatt.massstab && blatt.hintergrund
        ? `1 : ${(1 / blatt.massstab).toFixed(1)}`
        : '–'

  return (
    <footer className="statuszeile" aria-label={t('statuszeile.aria')}>
      <span className="statuszeile-werkzeug">
        <WerkzeugIcon id={aktivesToolId} />
        {werkzeugName(aktivesToolId)}
      </span>
      <KiKennzeichen />
      <ZusatzmodulKennzeichen />
      <LeitungsverlegungKennzeichen />
      <span className="statuszeile-fueller" />
      <span className="statuszeile-mass" ref={massBereichRef} hidden={start.mass === null}>
        <span className="statuszeile-feld" title={t('statuszeile.laengeTitel')}>
          <span className="statuszeile-marke">{t('statuszeile.laenge')}</span>
          {massFeld(
            'laenge',
            'statuszeile-wert-laenge',
            t('statuszeile.laengeAria'),
            start.mass ? anzeigeWert(start.mass, 'laenge') : '',
          )}
          m
        </span>
        <span className="statuszeile-feld" title={t('statuszeile.winkelTitel')}>
          <span className="statuszeile-marke">{t('statuszeile.winkel')}</span>
          <span className="statuszeile-marke">abs</span>
          {massFeld(
            'winkelAbsolut',
            'statuszeile-wert-winkel',
            t('statuszeile.winkelAbsAria'),
            start.mass ? anzeigeWert(start.mass, 'winkelAbsolut') : '',
          )}
          °<span className="statuszeile-marke">rel</span>
          {massFeld(
            'winkelRelativ',
            'statuszeile-wert-winkel',
            t('statuszeile.winkelRelAria'),
            start.mass ? anzeigeWert(start.mass, 'winkelRelativ') : '',
          )}
          °
        </span>
      </span>
      <span className="statuszeile-feld" title={t('statuszeile.einheitTitel')}>
        <span className="statuszeile-marke">{t('statuszeile.einheit')}</span>
        {blatt.einheit}
      </span>
      <span className="statuszeile-feld" title={t('statuszeile.massstabTitel')}>
        <span className="statuszeile-marke">{t('statuszeile.massstab')}</span>
        {massstab}
      </span>
      <span className="statuszeile-feld" title={t('statuszeile.zoomTitel')}>
        <span className="statuszeile-marke">{t('statuszeile.zoom')}</span>
        <span className="statuszeile-wert-zoom" ref={zoomRef}>
          {zoomText(start)}
        </span>
      </span>
      <span className="statuszeile-feld" title={t('statuszeile.positionTitel')}>
        <span className="statuszeile-marke">{t('statuszeile.position')}</span>
        <span className="statuszeile-wert-position" ref={koordinatenRef}>
          {koordinatenText(start)}
        </span>
      </span>
      {schaltplan && (
        <span className="statuszeile-feld" title={t('statuszeile.feldTitel')}>
          <span className="statuszeile-marke">{t('statuszeile.feld')}</span>
          <span className="statuszeile-wert-netzfeld" ref={netzfeldRef}>
            {netzfeldText(start)}
          </span>
        </span>
      )}
    </footer>
  )
}
