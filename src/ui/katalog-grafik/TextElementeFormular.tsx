import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type {
  HorizontaleAusrichtung,
  KatalogTextElement,
  TextElementDrehung,
  VertikaleAusrichtung,
} from '../../document-model'
import {
  ermittleTextElementAnker,
  istFixierterText,
  istVariablerText,
  symbolFarbwert,
  TEXT_ZEILENABSTAND,
  textZeilen,
  zeilenVersatz,
} from '../../document-model'
import type { Schluessel } from '../../sprache'
import { useT } from '../sprache-anbindung'
import { SymbolFarbAuswahl } from './SymbolFarbAuswahl'
import { SymbolVorschau } from './SymbolVorschau'
import {
  rundeAnteil,
  SYMBOL_VORSCHAU_HOEHE,
  symbolVorschauBreite,
  symbolVorschauHoehe,
} from './vorschau-geometrie'

const HORIZONTALE_OPTIONEN: { wert: HorizontaleAusrichtung; label: Schluessel }[] = [
  { wert: 'links', label: 'katalogdialoge.textElemente.links' },
  { wert: 'mittig', label: 'katalogdialoge.textElemente.mittig' },
  { wert: 'rechts', label: 'katalogdialoge.textElemente.rechts' },
]
const VERTIKALE_OPTIONEN: { wert: VertikaleAusrichtung; label: Schluessel }[] = [
  { wert: 'oben', label: 'katalogdialoge.textElemente.oben' },
  { wert: 'mittig', label: 'katalogdialoge.textElemente.mittig' },
  { wert: 'unten', label: 'katalogdialoge.textElemente.unten' },
]
const TEXT_DREHUNGEN: (TextElementDrehung | undefined)[] = [undefined, 90, 180, 270]

const SVG_TEXT_ANCHOR: Record<HorizontaleAusrichtung, 'start' | 'middle' | 'end'> = {
  links: 'start',
  mittig: 'middle',
  rechts: 'end',
}
const SVG_BASELINE: Record<VertikaleAusrichtung, 'hanging' | 'central' | 'text-after-edge'> = {
  oben: 'hanging',
  mittig: 'central',
  unten: 'text-after-edge',
}

interface Props {
  textElemente: KatalogTextElement[]
  bildUrl: string | undefined
  breitenFaktor: number | undefined
  hoehenFaktor?: number
  onChange: (textElemente: KatalogTextElement[]) => void
}

export function TextElementeFormular({
  textElemente,
  bildUrl,
  breitenFaktor,
  hoehenFaktor,
  onChange,
}: Props) {
  const t = useT()
  const [ausgewaehlt, setAusgewaehlt] = useState<number | null>(null)
  const gezogen = useRef<number | null>(null)
  const breite = symbolVorschauBreite(breitenFaktor)
  const hoehe = symbolVorschauHoehe(hoehenFaktor)

  function neuesElement(xAnteil: number, yAnteil: number) {
    const neu: KatalogTextElement = {
      xAnteil: rundeAnteil(xAnteil),
      yAnteil: rundeAnteil(yAnteil),
      text: t('katalogdialoge.textElemente.neuerText'),
      groesseAnteil: 0.15,
      ausrichtungHorizontal: 'mittig',
      ausrichtungVertikal: 'mittig',
    }
    onChange([...textElemente, neu])
    setAusgewaehlt(textElemente.length)
  }

  function aendere(index: number, patch: Partial<KatalogTextElement>) {
    onChange(textElemente.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  function entferne(index: number) {
    onChange(textElemente.filter((_, i) => i !== index))
    setAusgewaehlt(null)
  }

  function ziehStart(ev: PointerEvent<SVGGElement>, index: number) {
    ev.stopPropagation()
    setAusgewaehlt(index)
    gezogen.current = index
    ev.currentTarget.setPointerCapture(ev.pointerId)
  }

  function ziehen(ev: PointerEvent<SVGGElement>) {
    const index = gezogen.current
    const svg = ev.currentTarget.ownerSVGElement
    if (index === null || !svg) return
    const rect = svg.getBoundingClientRect()
    const xAnteil = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width))
    const yAnteil = Math.min(1, Math.max(0, 1 - (ev.clientY - rect.top) / rect.height))
    aendere(index, { xAnteil: rundeAnteil(xAnteil), yAnteil: rundeAnteil(yAnteil) })
  }

  function ziehEnde(ev: PointerEvent<SVGGElement>) {
    gezogen.current = null
    if (ev.currentTarget.hasPointerCapture(ev.pointerId)) {
      ev.currentTarget.releasePointerCapture(ev.pointerId)
    }
  }

  function setzeVariabel(index: number, variabel: boolean) {
    if (variabel) {
      const nummer = textElemente.filter(istVariablerText).length + 1
      aendere(index, { variable: t('katalogdialoge.textElemente.neuesFeld', { nummer }) })
    } else {
      aendere(index, { variable: undefined, inStueckliste: undefined, fixiert: undefined })
    }
  }

  const element = ausgewaehlt !== null ? textElemente[ausgewaehlt] : undefined
  const variabel = element ? istVariablerText(element) : false
  const fixiert = element ? istFixierterText(element) : false
  const feldnameDoppelt =
    element &&
    variabel &&
    textElemente.some((e, i) => i !== ausgewaehlt && e.variable === element.variable)

  return (
    <div className="abschnitt">
      <div className="abschnitt-kopf">
        <span className="feld-label">{t('katalogdialoge.textElemente.titel')}</span>
      </div>
      <SymbolVorschau
        bildUrl={bildUrl}
        breitenFaktor={breitenFaktor}
        hoehenFaktor={hoehenFaktor}
        onKlick={neuesElement}
      >
        {textElemente.map((e, index) => {
          const anker = ermittleTextElementAnker(e, 0, breite / 2, hoehe / 2, SYMBOL_VORSCHAU_HOEHE)
          const x = breite / 2 + anker.x
          const y = hoehe / 2 + anker.y
          const schrift = e.groesseAnteil * SYMBOL_VORSCHAU_HOEHE
          const zeilen = textZeilen(e)
          const platzhalter = zeilen.length === 0
          const angezeigt = platzhalter
            ? [`[${e.variable || t('katalogdialoge.textElemente.neuerText')}]`]
            : zeilen
          const aktiv = index === ausgewaehlt
          return (
            <g
              key={index}
              className="textelement-griff"
              onPointerDown={(ev) => ziehStart(ev, index)}
              onPointerMove={ziehen}
              onPointerUp={ziehEnde}
              onPointerCancel={ziehEnde}
              onClick={(ev) => ev.stopPropagation()}
            >
              <text
                x={x}
                transform={
                  anker.zeichenDrehung !== 0
                    ? `rotate(${(-anker.zeichenDrehung * 180) / Math.PI} ${x} ${y})`
                    : undefined
                }
                fontSize={schrift}
                style={
                  e.farbe && !aktiv && !platzhalter ? { fill: symbolFarbwert(e.farbe) } : undefined
                }
                textAnchor={SVG_TEXT_ANCHOR[anker.ausrichtungHorizontal]}
                dominantBaseline={SVG_BASELINE[anker.ausrichtungVertikal]}
                className={
                  platzhalter
                    ? 'textelement-text textelement-text-platzhalter'
                    : aktiv
                      ? 'textelement-text textelement-text-aktiv'
                      : 'textelement-text'
                }
              >
                {angezeigt.map((zeile, i) => (
                  <tspan
                    key={i}
                    x={x}
                    y={
                      y +
                      zeilenVersatz(i, angezeigt.length, anker.ausrichtungVertikal) *
                        schrift *
                        TEXT_ZEILENABSTAND
                    }
                  >
                    {zeile}
                  </tspan>
                ))}
              </text>
              <circle
                cx={e.xAnteil * breite}
                cy={hoehe - e.yAnteil * hoehe}
                r={4}
                className={
                  aktiv ? 'textelement-marker textelement-marker-aktiv' : 'textelement-marker'
                }
              >
                <title>{e.variable ?? e.text}</title>
              </circle>
            </g>
          )
        })}
      </SymbolVorschau>
      <p className="hinweistext">{t('katalogdialoge.textElemente.hinweis')}</p>
      {element && ausgewaehlt !== null && (
        <div className="kv-gruppe">
          <div className="feld-zeile">
            <label className="feld-mini">
              {t('katalogdialoge.textElemente.art')}
              <select
                value={variabel ? 'variabel' : 'fest'}
                onChange={(e) => setzeVariabel(ausgewaehlt, e.target.value === 'variabel')}
              >
                <option value="fest">{t('katalogdialoge.textElemente.fest')}</option>
                <option value="variabel">{t('katalogdialoge.textElemente.variabel')}</option>
              </select>
            </label>
            {variabel && (
              <label className="feld-mini">
                {t('katalogdialoge.textElemente.feldname')}
                <input
                  value={element.variable ?? ''}
                  placeholder={t('katalogdialoge.textElemente.feldnamePlatzhalter')}
                  onChange={(e) => aendere(ausgewaehlt, { variable: e.target.value })}
                />
              </label>
            )}
          </div>
          {feldnameDoppelt && (
            <p className="hinweistext">{t('katalogdialoge.textElemente.feldnameDoppelt')}</p>
          )}
          <label className="feld">
            {variabel
              ? t('katalogdialoge.textElemente.vorgabewert')
              : t('katalogdialoge.textElemente.text')}
            <textarea
              rows={Math.max(1, element.text.split('\n').length)}
              value={element.text}
              onChange={(e) => aendere(ausgewaehlt, { text: e.target.value })}
            />
          </label>
          <div className="feld-zeile">
            <label className="feld-mini">
              {t('katalogdialoge.textElemente.schriftgroesse')}
              <input
                type="number"
                min={1}
                step={1}
                value={Math.round(element.groesseAnteil * 1000) / 10}
                onChange={(e) => {
                  const prozent = Number(e.target.value)
                  if (prozent > 0) aendere(ausgewaehlt, { groesseAnteil: prozent / 100 })
                }}
              />
            </label>
            <label className="feld-mini">
              {t('symbolfarben.schriftfarbe')}
              <SymbolFarbAuswahl
                wert={element.farbe}
                onAendern={(farbe) => aendere(ausgewaehlt, { farbe })}
              />
            </label>
            <label className="feld-mini">
              {t('katalogdialoge.textElemente.waagerecht')}
              <select
                value={element.ausrichtungHorizontal}
                onChange={(e) =>
                  aendere(ausgewaehlt, {
                    ausrichtungHorizontal: e.target.value as HorizontaleAusrichtung,
                  })
                }
              >
                {HORIZONTALE_OPTIONEN.map((o) => (
                  <option key={o.wert} value={o.wert}>
                    {t(o.label)}
                  </option>
                ))}
              </select>
            </label>
            <label className="feld-mini">
              {t('katalogdialoge.textElemente.senkrecht')}
              <select
                value={element.ausrichtungVertikal}
                onChange={(e) =>
                  aendere(ausgewaehlt, {
                    ausrichtungVertikal: e.target.value as VertikaleAusrichtung,
                  })
                }
              >
                {VERTIKALE_OPTIONEN.map((o) => (
                  <option key={o.wert} value={o.wert}>
                    {t(o.label)}
                  </option>
                ))}
              </select>
            </label>
            <label className="feld-mini">
              {t('katalogdialoge.textElemente.drehung')}
              <select
                value={element.drehung ?? ''}
                onChange={(e) =>
                  aendere(ausgewaehlt, {
                    drehung: e.target.value
                      ? (Number(e.target.value) as TextElementDrehung)
                      : undefined,
                  })
                }
              >
                {TEXT_DREHUNGEN.map((wert) => (
                  <option key={wert ?? 0} value={wert ?? ''}>
                    {fixiert
                      ? `${wert ?? 0}°`
                      : wert === undefined
                        ? t('katalogdialoge.textElemente.drehungWaagerecht')
                        : t('katalogdialoge.textElemente.drehungMit', { grad: wert })}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {fixiert ? (
            <p className="hinweistext">{t('katalogdialoge.textElemente.fixiertHinweis')}</p>
          ) : (
            element.drehung !== undefined && (
              <p className="hinweistext">{t('katalogdialoge.textElemente.gedrehtHinweis')}</p>
            )
          )}
          {variabel && (
            <label className="dockpunkt-trunk-label">
              <input
                type="checkbox"
                checked={fixiert}
                onChange={(e) => aendere(ausgewaehlt, { fixiert: e.target.checked || undefined })}
              />
              {t('katalogdialoge.textElemente.fixieren')}
            </label>
          )}
          {variabel && (
            <label className="dockpunkt-trunk-label">
              <input
                type="checkbox"
                checked={element.inStueckliste ?? false}
                onChange={(e) =>
                  aendere(ausgewaehlt, { inStueckliste: e.target.checked || undefined })
                }
              />
              {t('katalogdialoge.textElemente.inStueckliste')}
            </label>
          )}
          <div className="neu-form-knoepfe">
            <button type="button" className="knopf-klein" onClick={() => setAusgewaehlt(null)}>
              {t('katalogdialoge.textElemente.fertig')}
            </button>
            <button
              type="button"
              className="knopf-klein knopf-gefahr"
              onClick={() => entferne(ausgewaehlt)}
            >
              {t('katalogdialoge.gemeinsam.loeschen')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
