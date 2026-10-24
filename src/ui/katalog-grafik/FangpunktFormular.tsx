import type { DockpunkteKonfiguration, Fangpunkt } from '../../document-model'
import { standardFangpunkt } from '../../document-model'
import { useT } from '../sprache-anbindung'
import { SymbolVorschau } from './SymbolVorschau'
import {
  dockpunktAnteile,
  rasteFangpunktEin,
  rundeAnteil,
  symbolVorschauHoehe,
  symbolVorschauBreite,
} from './vorschau-geometrie'

interface Props {
  fangpunkt: Fangpunkt | undefined
  dockpunkte: DockpunkteKonfiguration | undefined
  bildUrl: string | undefined
  breitenFaktor: number | undefined
  hoehenFaktor?: number
  onChange: (fangpunkt: Fangpunkt | undefined) => void
}

const KREUZ_ARM = 9

export function FangpunktFormular({
  fangpunkt,
  dockpunkte,
  bildUrl,
  breitenFaktor,
  hoehenFaktor,
  onChange,
}: Props) {
  const t = useT()
  const breite = symbolVorschauBreite(breitenFaktor)
  const hoehe = symbolVorschauHoehe(hoehenFaktor)
  const anteile = dockpunktAnteile(dockpunkte)
  const angezeigt = fangpunkt ?? standardFangpunkt(dockpunkte)
  const cx = angezeigt.xAnteil * breite
  const cy = hoehe - angezeigt.yAnteil * hoehe

  function setzeKoordinate(achse: 'xAnteil' | 'yAnteil', eingabe: string) {
    const wert = Number(eingabe.replace(',', '.'))
    if (eingabe.trim() === '' || !Number.isFinite(wert)) return
    onChange({ ...angezeigt, [achse]: Math.min(1, Math.max(0, wert)) })
  }

  return (
    <div className="abschnitt">
      <div className="abschnitt-kopf">
        <span className="feld-label">
          {fangpunkt
            ? t('katalogdialoge.fangpunkt.titelEigen')
            : t('katalogdialoge.fangpunkt.titelStandard')}
        </span>
        {fangpunkt && (
          <button
            type="button"
            className="knopf-icon"
            title={t('katalogdialoge.fangpunkt.zurueck')}
            onClick={() => onChange(undefined)}
          >
            ×
          </button>
        )}
      </div>
      <SymbolVorschau
        bildUrl={bildUrl}
        breitenFaktor={breitenFaktor}
        hoehenFaktor={hoehenFaktor}
        onKlick={(x, y) => onChange(rasteFangpunktEin(x, y, anteile, breitenFaktor, hoehenFaktor))}
      >
        {anteile.map((punkt, index) => (
          <circle
            key={index}
            cx={punkt.xAnteil * breite}
            cy={hoehe - punkt.yAnteil * hoehe}
            r={3}
            className="fangpunkt-dockpunkt"
          />
        ))}
        <g
          className={fangpunkt ? 'fangpunkt-marker' : 'fangpunkt-marker fangpunkt-marker-standard'}
        >
          <line x1={cx - KREUZ_ARM} y1={cy} x2={cx + KREUZ_ARM} y2={cy} />
          <line x1={cx} y1={cy - KREUZ_ARM} x2={cx} y2={cy + KREUZ_ARM} />
          <circle cx={cx} cy={cy} r={5} />
        </g>
      </SymbolVorschau>
      <p className="hinweistext">{t('katalogdialoge.fangpunkt.hinweis')}</p>
      <div className="kv-zeile">
        <label className="dockpunkt-koordinate">
          x{' '}
          <input
            className="feld-zahl"
            type="number"
            min={0}
            max={1}
            step={0.01}
            aria-label={t('katalogdialoge.fangpunkt.xAria')}
            value={rundeAnteil(angezeigt.xAnteil)}
            onChange={(e) => setzeKoordinate('xAnteil', e.target.value)}
          />
        </label>
        <label className="dockpunkt-koordinate">
          y{' '}
          <input
            className="feld-zahl"
            type="number"
            min={0}
            max={1}
            step={0.01}
            aria-label={t('katalogdialoge.fangpunkt.yAria')}
            value={rundeAnteil(angezeigt.yAnteil)}
            onChange={(e) => setzeKoordinate('yAnteil', e.target.value)}
          />
        </label>
      </div>
    </div>
  )
}
