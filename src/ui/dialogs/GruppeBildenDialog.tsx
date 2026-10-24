import { useState } from 'react'
import type { GruppenAngaben, GruppenVorgabe } from '../../document-model'
import { angabenAusVorgabe, waehlbareAnsteuerungen } from '../../document-model'
import type { GruppeBildenDialogZustand } from '../store/ui-store'
import { useUiStore } from '../store/ui-store'
import { useSprache, useT } from '../sprache-anbindung'
import { ansteuerungAnzeige } from '../regelwerk-anzeige'

export function GruppeBildenDialog() {
  const dialog = useUiStore((s) => s.gruppeBildenDialog)
  if (!dialog) return null
  return <DialogInhalt key={dialog.titel + dialog.vorgabe.name} dialog={dialog} />
}

function DialogInhalt({ dialog }: { dialog: GruppeBildenDialogZustand }) {
  const t = useT()
  const [angaben, setAngaben] = useState<GruppenAngaben>(() => angabenAusVorgabe(dialog.vorgabe))
  const schliessen = (ergebnis: GruppenAngaben | null) => {
    useUiStore.getState().schliesseGruppeBildenDialog()
    dialog.callback(ergebnis)
  }
  return (
    <div className="dialog-overlay" onMouseDown={() => schliessen(null)}>
      <form
        className="dialog"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          schliessen(angaben)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') schliessen(null)
        }}
      >
        <h2>{dialog.titel}</h2>
        {dialog.text && <p className="dialog-hinweis">{dialog.text}</p>}
        <GruppenFelder vorgabe={dialog.vorgabe} angaben={angaben} onAngaben={setAngaben} />
        {dialog.hinweise?.map((h) => (
          <p key={h} className="dialog-hinweis">
            {h}
          </p>
        ))}
        <div className="dialog-aktionen">
          <button type="button" onClick={() => schliessen(null)}>
            {t('verteilerdialoge.allgemein.abbrechen')}
          </button>
          <button type="submit" className="primaer">
            {dialog.bestaetigenText ?? t('verteilerdialoge.gruppeBilden.bilden')}
          </button>
        </div>
      </form>
    </div>
  )
}

export function GruppenFelder({
  vorgabe,
  angaben,
  onAngaben,
}: {
  vorgabe: GruppenVorgabe
  angaben: GruppenAngaben
  onAngaben: (a: GruppenAngaben) => void
}) {
  const t = useT()
  const sprache = useSprache()
  return (
    <>
      <label className="dialog-feld">
        {t('verteilerdialoge.gruppeBilden.name')}
        <input
          value={angaben.name ?? ''}
          placeholder={t('verteilerdialoge.gruppeBilden.nameBeispiel')}
          onChange={(e) => onAngaben({ ...angaben, name: e.target.value })}
          autoFocus
        />
      </label>
      {vorgabe.mitAnsteuerung && (
        <label className="dialog-feld">
          {t('verteilerdialoge.gruppeBilden.ansteuerung')}
          <select
            value={angaben.ansteuerung ?? ''}
            onChange={(e) => onAngaben({ ...angaben, ansteuerung: e.target.value || undefined })}
          >
            <option value="">{t('verteilerdialoge.allgemein.keineAngabe')}</option>
            {waehlbareAnsteuerungen(angaben.ansteuerung).map((a) => (
              <option key={a.kennung} value={a.kennung}>
                {ansteuerungAnzeige(a.kennung, sprache)}
              </option>
            ))}
          </select>
        </label>
      )}
      {vorgabe.mitKnx && (
        <label className="feld-checkbox">
          <input
            type="checkbox"
            checked={angaben.knx ?? false}
            onChange={(e) => onAngaben({ ...angaben, knx: e.target.checked })}
          />
          {t('verteilerdialoge.gruppeBilden.knxGanzeGruppe')}
        </label>
      )}
    </>
  )
}
