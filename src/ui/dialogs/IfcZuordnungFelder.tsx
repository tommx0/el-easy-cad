import {
  IFC_KLASSEN,
  IFC_TYP_EIGENER,
  IFC_TYP_NICHT_FESTGELEGT,
  bestimmeIfcZuordnung,
  ifcKlassenBezeichnung,
  ifcKlassenDefinition,
  typDefinition,
} from '../../document-model'
import { useT } from '../sprache-anbindung'

export function IfcZuordnungFelder(props: {
  typ: string
  ifcKlasse: string
  ifcTyp: string
  ifcTypName: string
  onAendern(ifcKlasse: string, ifcTyp: string, ifcTypName: string): void
}) {
  const t = useT()
  const vorgabe = bestimmeIfcZuordnung(undefined, props.typ ? typDefinition(props.typ) : undefined)
  const definition = props.ifcKlasse ? ifcKlassenDefinition(props.ifcKlasse) : undefined
  const typen = definition?.typen ?? [IFC_TYP_NICHT_FESTGELEGT]
  return (
    <>
      <label className="dialog-feld">
        {t('eigenschaften.ifcZuordnung.klasse')}
        <select value={props.ifcKlasse} onChange={(e) => props.onAendern(e.target.value, '', '')}>
          <option value="">
            {t('eigenschaften.ifcZuordnung.wieGeraetetyp', {
              klasse: ifcKlassenBezeichnung(vorgabe.klasse),
            })}
            {vorgabe.typ !== IFC_TYP_NICHT_FESTGELEGT ? `, ${vorgabe.typName ?? vorgabe.typ}` : ''}
          </option>
          {IFC_KLASSEN.map((k) => (
            <option key={k.klasse} value={k.klasse}>
              {ifcKlassenBezeichnung(k.klasse)}
            </option>
          ))}
          {props.ifcKlasse && !definition && (
            <option value={props.ifcKlasse}>{ifcKlassenBezeichnung(props.ifcKlasse)}</option>
          )}
        </select>
        <span className="dialog-hinweis">{t('eigenschaften.ifcZuordnung.klasseHinweis')}</span>
      </label>
      {props.ifcKlasse && (
        <label className="dialog-feld">
          {t('eigenschaften.ifcZuordnung.typ')}
          <select
            value={props.ifcTyp || IFC_TYP_NICHT_FESTGELEGT}
            onChange={(e) =>
              props.onAendern(
                props.ifcKlasse,
                e.target.value === IFC_TYP_NICHT_FESTGELEGT ? '' : e.target.value,
                props.ifcTypName,
              )
            }
          >
            {typen.map((typ) => (
              <option key={typ} value={typ}>
                {typ === IFC_TYP_NICHT_FESTGELEGT
                  ? t('eigenschaften.ifcZuordnung.nichtFestgelegt')
                  : typ === IFC_TYP_EIGENER
                    ? t('eigenschaften.ifcZuordnung.eigenerTyp')
                    : typ}
              </option>
            ))}
          </select>
          <span className="dialog-hinweis">{t('eigenschaften.ifcZuordnung.typHinweis')}</span>
        </label>
      )}
      {props.ifcKlasse && props.ifcTyp === IFC_TYP_EIGENER && (
        <label className="dialog-feld">
          {t('eigenschaften.ifcZuordnung.eigenerIfcTyp')}
          <input
            value={props.ifcTypName}
            placeholder={t('eigenschaften.ifcZuordnung.beispiel')}
            onChange={(e) => props.onAendern(props.ifcKlasse, props.ifcTyp, e.target.value)}
          />
          <span className="dialog-hinweis">
            {t('eigenschaften.ifcZuordnung.eigenerTypHinweis')}
          </span>
        </label>
      )}
    </>
  )
}
