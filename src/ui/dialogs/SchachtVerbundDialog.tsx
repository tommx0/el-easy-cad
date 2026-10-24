import { useMemo, useState } from 'react'
import {
  STANDARD_GESCHOSSHOEHE,
  naechsterFreierSchachtName,
  verbundeInZeichnung,
} from '../../document-model'
import { useAppContext } from '../use-app-context'
import type { SchachtVerbundAuswahl, SchachtVerbundDialogZustand } from '../store/ui-store'
import { useUiStore } from '../store/ui-store'
import { useT } from '../sprache-anbindung'

export function SchachtVerbundDialog() {
  const dialog = useUiStore((s) => s.schachtVerbundDialog)
  if (!dialog) return null
  return <SchachtVerbundDialogInhalt dialog={dialog} />
}

function SchachtVerbundDialogInhalt({ dialog }: { dialog: SchachtVerbundDialogZustand }) {
  const t = useT()
  const { doc } = useAppContext()
  const zeichnung = doc.getZeichnung()
  const verbunde = useMemo(() => verbundeInZeichnung(zeichnung), [zeichnung])
  const [auswahlId, setAuswahlId] = useState<string>(
    dialog.aktuellerVerbundId ?? (verbunde.length > 0 ? verbunde[0].verbundId : 'neu'),
  )
  const [name, setName] = useState(() => naechsterFreierSchachtName(zeichnung))
  const [hoeheText, setHoeheText] = useState(String(dialog.geschosshoehe ?? STANDARD_GESCHOSSHOEHE))

  const blattName = (id: string) => zeichnung.blaetter.find((b) => b.id === id)?.name ?? '?'

  const hoehe = Number(hoeheText.replace(',', '.'))
  const hoeheGueltig = Number.isFinite(hoehe) && hoehe >= 0
  const nameGueltig = auswahlId !== 'neu' || name.trim().length > 0

  function schliessenMit(auswahl: SchachtVerbundAuswahl | null) {
    useUiStore.getState().schliesseSchachtVerbundDialog()
    dialog.callback(auswahl)
  }

  function uebernehmen() {
    if (!hoeheGueltig || !nameGueltig) return
    if (auswahlId === 'neu') {
      schliessenMit({ art: 'neu', name: name.trim(), geschosshoehe: hoehe })
      return
    }
    const verbund = verbunde.find((v) => v.verbundId === auswahlId)
    if (!verbund) return
    schliessenMit({
      art: 'vorhanden',
      verbundId: verbund.verbundId,
      name: verbund.name,
      geschosshoehe: hoehe,
    })
  }

  return (
    <div className="dialog-overlay" onMouseDown={() => schliessenMit(null)}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{dialog.titel}</h2>
        <fieldset className="dialog-feld">
          <legend>{t('verteilerdialoge.schachtVerbund.steigschacht')}</legend>
          {verbunde.map((v) => (
            <label key={v.verbundId} className="dialog-radio-zeile">
              <input
                type="radio"
                name="schacht-verbund"
                checked={auswahlId === v.verbundId}
                onChange={() => setAuswahlId(v.verbundId)}
              />
              {v.name}
              <span className="dialog-hinweis"> ({v.blattIds.map(blattName).join(', ')})</span>
            </label>
          ))}
          <label className="dialog-radio-zeile">
            <input
              type="radio"
              name="schacht-verbund"
              checked={auswahlId === 'neu'}
              onChange={() => setAuswahlId('neu')}
            />
            {t('verteilerdialoge.schachtVerbund.neu')}
          </label>
        </fieldset>
        {auswahlId === 'neu' && (
          <label className="dialog-feld">
            {t('verteilerdialoge.schachtVerbund.name')}
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </label>
        )}
        <label className="dialog-feld">
          {t('verteilerdialoge.schachtVerbund.geschosshoehe')}
          <input
            value={hoeheText}
            onChange={(e) => setHoeheText(e.target.value)}
            inputMode="decimal"
          />
          <span className="dialog-hinweis">
            {t('verteilerdialoge.schachtVerbund.geschosshoeheHinweis')}
          </span>
        </label>
        <div className="dialog-aktionen">
          <button type="button" onClick={() => schliessenMit(null)}>
            {t('verteilerdialoge.allgemein.abbrechen')}
          </button>
          <button
            type="button"
            className="primaer"
            disabled={!hoeheGueltig || !nameGueltig}
            onClick={uebernehmen}
          >
            {t('verteilerdialoge.allgemein.uebernehmen')}
          </button>
        </div>
      </div>
    </div>
  )
}
