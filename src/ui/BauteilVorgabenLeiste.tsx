import type { TreppenForm } from '../document-model'
import { OEFFNUNG_HOEHE_MIN, TREPPEN_FORM_LABELS } from '../document-model'
import { TREPPEN_MASS_MIN } from '../tools'
import { useT } from './sprache-anbindung'
import { useUiStore } from './store/ui-store'
import { ZahlenFeld } from './ZahlenFeld'

const TREPPEN_FORMEN: TreppenForm[] = ['gerade', 'u-podest', 'u-kehre', 'l-kehre']

export function BauteilVorgabenLeiste({ werkzeug }: { werkzeug: 'tuer' | 'fenster' | 'treppe' }) {
  const vorgaben = useUiStore((s) => s.bauteilVorgaben)
  const setze = useUiStore((s) => s.setBauteilVorgaben)
  const t = useT()

  if (werkzeug === 'tuer')
    return (
      <div className="canvas-wandstaerke-leiste canvas-bauteil-leiste">
        <label className="feld">
          {t('aktionen.bauteilVorgaben.breite')}
          <ZahlenFeld
            min={0.2}
            step={0.05}
            value={vorgaben.tuerBreite}
            onCommit={(wert) => setze({ tuerBreite: wert })}
          />
        </label>
        <label className="feld">
          {t('aktionen.bauteilVorgaben.hoehe')}
          <ZahlenFeld
            min={OEFFNUNG_HOEHE_MIN}
            step={0.01}
            value={vorgaben.tuerHoehe}
            onCommit={(wert) => setze({ tuerHoehe: wert })}
          />
        </label>
      </div>
    )

  if (werkzeug === 'fenster')
    return (
      <div className="canvas-wandstaerke-leiste canvas-bauteil-leiste">
        <label className="feld">
          {t('aktionen.bauteilVorgaben.breite')}
          <ZahlenFeld
            min={0.2}
            step={0.05}
            value={vorgaben.fensterBreite}
            onCommit={(wert) => setze({ fensterBreite: wert })}
          />
        </label>
        <label className="feld">
          {t('aktionen.bauteilVorgaben.hoehe')}
          <ZahlenFeld
            min={OEFFNUNG_HOEHE_MIN}
            step={0.01}
            value={vorgaben.fensterHoehe}
            onCommit={(wert) => setze({ fensterHoehe: wert })}
          />
        </label>
        <label className="feld">
          {t('aktionen.bauteilVorgaben.bruestung')}
          <ZahlenFeld
            min={0}
            step={0.01}
            value={vorgaben.fensterBruestung}
            onCommit={(wert) => setze({ fensterBruestung: wert })}
          />
        </label>
      </div>
    )

  const form = vorgaben.treppenForm
  const masse = vorgaben.treppenMasse[form]
  function setzeMass(patch: Partial<typeof masse>) {
    setze({ treppenMasse: { ...vorgaben.treppenMasse, [form]: { ...masse, ...patch } } })
  }
  return (
    <div className="canvas-wandstaerke-leiste canvas-bauteil-leiste">
      <label className="feld">
        {t('aktionen.bauteilVorgaben.form')}
        <select
          value={form}
          onChange={(e) => setze({ treppenForm: e.target.value as TreppenForm })}
        >
          {TREPPEN_FORMEN.map((f) => (
            <option key={f} value={f}>
              {TREPPEN_FORM_LABELS[f]}
            </option>
          ))}
        </select>
      </label>
      <label className="feld">
        {t('aktionen.bauteilVorgaben.laenge')}
        <ZahlenFeld
          min={TREPPEN_MASS_MIN}
          step={0.05}
          value={masse.laenge}
          onCommit={(wert) => setzeMass({ laenge: wert })}
        />
      </label>
      <label className="feld">
        {t('aktionen.bauteilVorgaben.breite')}
        <ZahlenFeld
          min={TREPPEN_MASS_MIN}
          step={0.05}
          value={masse.breite}
          onCommit={(wert) => setzeMass({ breite: wert })}
        />
      </label>
    </div>
  )
}
