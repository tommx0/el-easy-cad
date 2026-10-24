import { SYMBOL_FARBEN, type SymbolFarbe } from '../../document-model/symbol-palette'
import { useT } from '../sprache-anbindung'

export function SymbolFarbAuswahl(props: {
  wert: SymbolFarbe | undefined
  onAendern: (farbe: SymbolFarbe | undefined) => void
  ariaLabel?: string
}) {
  const t = useT()
  return (
    <select
      value={props.wert ?? ''}
      aria-label={props.ariaLabel ?? t('symbolfarben.schriftfarbe')}
      title={t('symbolfarben.hinweisStandardfarbe')}
      onChange={(e) =>
        props.onAendern(e.target.value ? (e.target.value as SymbolFarbe) : undefined)
      }
    >
      <option value="">{t('symbolfarben.wieKomponente')}</option>
      {SYMBOL_FARBEN.map((farbe) => (
        <option key={farbe} value={farbe}>
          {t(`symbolfarben.farben.${farbe}`)}
        </option>
      ))}
    </select>
  )
}
