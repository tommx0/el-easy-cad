import type { BemessungEntwurf } from './katalog-entwurf'
import type { Schluessel } from '../../sprache'
import { useT } from '../sprache-anbindung'

const FELDER: { feld: keyof BemessungEntwurf; titel: Schluessel; einheit: string }[] = [
  { feld: 'nennstrom', titel: 'eigenschaften.bemessung.nennstrom', einheit: 'A' },
  { feld: 'nennspannung', titel: 'eigenschaften.bemessung.nennspannung', einheit: 'V' },
  { feld: 'polzahl', titel: 'eigenschaften.bemessung.polzahl', einheit: '' },
  { feld: 'ipSchutzart', titel: 'eigenschaften.bemessung.ipSchutzart', einheit: '' },
]

export function BemessungFelder(props: {
  wert: BemessungEntwurf
  geerbt?: BemessungEntwurf
  onAendern(wert: BemessungEntwurf): void
}) {
  const t = useT()
  return (
    <div className="katalog-bemessung">
      {FELDER.map(({ feld, titel: titelSchluessel, einheit }) => {
        const titel = t(titelSchluessel)
        const geerbt = props.geerbt?.[feld]
        return (
          <label
            key={feld}
            title={props.geerbt ? t('eigenschaften.bemessung.titelGeerbt', { titel }) : titel}
          >
            <span>
              {titel}
              {einheit && ` (${einheit})`}
            </span>
            <input
              inputMode={feld === 'ipSchutzart' ? 'text' : 'decimal'}
              placeholder={
                props.geerbt
                  ? geerbt
                    ? t('eigenschaften.bemessung.wertGeerbt', { wert: geerbt })
                    : t('eigenschaften.bemessung.geerbt')
                  : feld === 'ipSchutzart'
                    ? t('eigenschaften.bemessung.beispielIp')
                    : ''
              }
              value={props.wert[feld]}
              onChange={(e) => props.onAendern({ ...props.wert, [feld]: e.target.value })}
            />
          </label>
        )
      })}
    </div>
  )
}
