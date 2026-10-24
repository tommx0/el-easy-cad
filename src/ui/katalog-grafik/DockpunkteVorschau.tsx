import {
  DOCKPUNKT_BESCHRIFTUNG_STANDARD,
  dockpunktBeschriftungAlsTextElement,
  type FreierDockpunkt,
  type SymbolFarbe,
  symbolFarbwert,
} from '../../document-model'
import { useT } from '../sprache-anbindung'
import { SymbolFarbAuswahl } from './SymbolFarbAuswahl'
import { SymbolVorschau } from './SymbolVorschau'
import {
  rundeAnteil,
  SYMBOL_VORSCHAU_HOEHE,
  symbolVorschauBreite,
  symbolVorschauHoehe,
} from './vorschau-geometrie'

const SVG_ANKER = { links: 'start', mittig: 'middle', rechts: 'end' } as const
const SVG_GRUNDLINIE = { oben: 'hanging', mittig: 'middle', unten: 'auto' } as const

interface Props {
  punkte: FreierDockpunkt[]
  bildUrl: string | undefined
  breitenFaktor: number | undefined
  hoehenFaktor?: number
  onChange: (punkte: FreierDockpunkt[]) => void
}

export function DockpunkteVorschau({
  punkte,
  bildUrl,
  breitenFaktor,
  hoehenFaktor,
  onChange,
}: Props) {
  const t = useT()
  const breite = symbolVorschauBreite(breitenFaktor)
  const hoehe = symbolVorschauHoehe(hoehenFaktor)

  function setzeNeuenPunkt(xAnteil: number, yAnteil: number) {
    onChange([...punkte, { xAnteil: rundeAnteil(xAnteil), yAnteil: rundeAnteil(yAnteil) }])
  }

  function entferne(index: number) {
    onChange(punkte.filter((_, i) => i !== index))
  }

  function toggleTrunk(index: number) {
    onChange(punkte.map((p, i) => (i === index ? { ...p, trunk: !p.trunk } : p)))
  }

  function setzeFarbe(index: number, farbe: SymbolFarbe | undefined) {
    onChange(
      punkte.map((p, i) => {
        if (i !== index) return p
        const lage = p.beschriftung ?? DOCKPUNKT_BESCHRIFTUNG_STANDARD
        const { farbe: _alt, ...ohne } = lage
        return { ...p, beschriftung: farbe ? { ...ohne, farbe } : ohne }
      }),
    )
  }

  function setzeBezeichnung(index: number, text: string) {
    onChange(
      punkte.map((p, i) => {
        if (i !== index) return p
        const { bezeichnung: _alt, ...rest } = p
        return text ? { ...rest, bezeichnung: text } : rest
      }),
    )
  }

  const beschriftungen = punkte.flatMap((punkt, index) => {
    const text = dockpunktBeschriftungAlsTextElement(punkt)
    return text ? [{ index, text }] : []
  })

  return (
    <div className="dockpunkte-vorschau">
      <SymbolVorschau
        bildUrl={bildUrl}
        breitenFaktor={breitenFaktor}
        hoehenFaktor={hoehenFaktor}
        onKlick={setzeNeuenPunkt}
      >
        {punkte.map((punkt, index) => (
          <circle
            key={index}
            cx={punkt.xAnteil * breite}
            cy={hoehe - punkt.yAnteil * hoehe}
            r={5}
            className={punkt.trunk ? 'dockpunkt-marker dockpunkt-marker-trunk' : 'dockpunkt-marker'}
            onClick={(e) => {
              e.stopPropagation()
              entferne(index)
            }}
          >
            <title>{t('katalogdialoge.dockpunkte.klickEntfernen')}</title>
          </circle>
        ))}
        {beschriftungen.map(({ index, text }) => (
          <text
            key={`b${index}`}
            className="dockpunkt-bezeichnung"
            x={text.xAnteil * breite + (text.bildschirmVersatz?.x ?? 0) * SYMBOL_VORSCHAU_HOEHE}
            y={
              hoehe -
              text.yAnteil * hoehe +
              (text.bildschirmVersatz?.y ?? 0) * SYMBOL_VORSCHAU_HOEHE
            }
            fontSize={text.groesseAnteil * SYMBOL_VORSCHAU_HOEHE}
            textAnchor={SVG_ANKER[text.ausrichtungHorizontal]}
            dominantBaseline={SVG_GRUNDLINIE[text.ausrichtungVertikal]}
            pointerEvents="none"
            style={text.farbe ? { fill: symbolFarbwert(text.farbe) } : undefined}
          >
            {text.text}
          </text>
        ))}
      </SymbolVorschau>
      <p className="hinweistext">{t('katalogdialoge.dockpunkte.vorschauHinweis')}</p>
      {punkte.length > 0 && (
        <div className="kv-liste">
          {punkte.map((punkt, index) => (
            <div className="kv-zeile" key={index}>
              <span className="dockpunkt-koordinate">
                x {punkt.xAnteil.toFixed(2)} / y {punkt.yAnteil.toFixed(2)}
              </span>
              <input
                className="dockpunkt-bezeichnung-feld"
                placeholder={t('katalogdialoge.dockpunkte.bezeichnung')}
                aria-label={t('katalogdialoge.dockpunkte.bezeichnungAria', { nummer: index + 1 })}
                title={t('katalogdialoge.dockpunkte.bezeichnungTitel')}
                value={punkt.bezeichnung ?? ''}
                onChange={(e) => setzeBezeichnung(index, e.target.value)}
              />
              {punkt.bezeichnung && (
                <SymbolFarbAuswahl
                  wert={punkt.beschriftung?.farbe}
                  ariaLabel={`${t('symbolfarben.schriftfarbe')} ${index + 1}`}
                  onAendern={(farbe) => setzeFarbe(index, farbe)}
                />
              )}
              <label className="dockpunkt-trunk-label">
                <input
                  type="checkbox"
                  checked={punkt.trunk ?? false}
                  onChange={() => toggleTrunk(index)}
                />
                {t('katalogdialoge.dockpunkte.nurTrunk')}
              </label>
              <button
                type="button"
                className="knopf-icon"
                title={t('katalogdialoge.dockpunkte.dockpunktEntfernen')}
                onClick={() => entferne(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
