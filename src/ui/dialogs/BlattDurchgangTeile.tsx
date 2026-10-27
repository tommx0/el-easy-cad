import { aktuellesBlatt, istLetztesBlatt, type BlattDurchgang } from '../blatt-durchgang'
import { useAppContext } from '../use-app-context'
import { useT } from '../sprache-anbindung'

export function BlattDurchgangKopf<W>({ durchgang }: { durchgang: BlattDurchgang<W> }) {
  const { doc } = useAppContext()
  const t = useT()
  const id = aktuellesBlatt(durchgang)
  const name = doc.getBlatt(id)?.name ?? ''
  const n = durchgang.blattIds.length
  return (
    <>
      <p className="dialog-hinweis">
        {n > 1
          ? t('zeichendialoge.durchgang.schritt', { nr: durchgang.index + 1, n, name })
          : t('zeichendialoge.durchgang.einBlatt', { name })}
      </p>
      {durchgang.uebersprungen.has(id) && (
        <p className="erkennung-warnung">{t('zeichendialoge.durchgang.uebersprungen')}</p>
      )}
    </>
  )
}

export function BlattDurchgangKnoepfe<W>(props: {
  durchgang: BlattDurchgang<W>
  abbrechen: () => void
  zurueck: () => void
  ueberspringen: () => void
  weiter: () => void
  weiterGesperrt: boolean
  abschliessenText: string
}) {
  const t = useT()
  const letztes = istLetztesBlatt(props.durchgang)
  return (
    <div className="dialog-aktionen">
      <button type="button" onClick={props.abbrechen}>
        {t('zeichendialoge.gemeinsam.abbrechen')}
      </button>
      <button type="button" onClick={props.zurueck} disabled={props.durchgang.index === 0}>
        {t('zeichendialoge.durchgang.zurueck')}
      </button>
      <button type="button" onClick={props.ueberspringen} disabled={props.weiterGesperrt}>
        {t('zeichendialoge.durchgang.ueberspringen')}
      </button>
      <button
        type="button"
        className="primaer"
        onClick={props.weiter}
        disabled={props.weiterGesperrt}
      >
        {letztes ? props.abschliessenText : t('zeichendialoge.durchgang.weiter')}
      </button>
    </div>
  )
}
