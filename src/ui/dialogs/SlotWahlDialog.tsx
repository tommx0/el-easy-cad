import type { KomponentenObjekt, Zeichnung } from '../../document-model'
import { ermittleTypUndSlots, spanneJeSlot, typHatSlotMatrix } from '../../document-model'
import { useProject } from '../use-app-context'
import { useUiStore } from '../store/ui-store'
import { useT } from '../sprache-anbindung'
import { slotNameText, spracheDesUebersetzers } from '../../document-model'

export function SlotWahlDialog() {
  const dialog = useUiStore((s) => s.slotWahlDialog)
  if (!dialog) return null
  return (
    <SlotWahlDialogInhalt
      blattId={dialog.blattId}
      objektId={dialog.objektId}
      callback={dialog.callback}
    />
  )
}

function findeKomponente(
  zeichnung: Zeichnung,
  blattId: string,
  objektId: string,
): KomponentenObjekt | undefined {
  return zeichnung.blaetter
    .find((b) => b.id === blattId)
    ?.objekte.find((o): o is KomponentenObjekt => o.type === 'komponente' && o.id === objektId)
}

function SlotWahlDialogInhalt({
  blattId,
  objektId,
  callback,
}: {
  blattId: string
  objektId: string
  callback: (slotId: string | null) => void
}) {
  const t = useT()
  const zeichnung = useProject()
  const schliessen = (slotId: string | null) => {
    useUiStore.getState().schliesseSlotWahlDialog()
    callback(slotId)
  }

  const objekt = findeKomponente(zeichnung, blattId, objektId)
  const aufgeloest = objekt ? ermittleTypUndSlots(objekt, zeichnung) : null
  if (!objekt || !aufgeloest || aufgeloest.slots.length === 0) return null

  const { typ, slots } = aufgeloest
  const spannen = typHatSlotMatrix(typ) ? spanneJeSlot(aufgeloest.slotMatrix) : []
  const zeilen = aufgeloest.slotMatrix.zeilen
  const seite = Math.max(220, zeilen * 40 + (zeilen - 1) * 6)

  return (
    <div className="dialog-overlay" onMouseDown={() => schliessen(null)}>
      <div className="dialog dialog-slotwahl" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('verteilerdialoge.slotWahl.titel')}</h2>
        {typHatSlotMatrix(typ) ? (
          <div
            className="slotmatrix-raster slotmatrix-quadrat"
            style={{
              gridTemplateColumns: 'repeat(2, 1fr)',
              gridTemplateRows: `repeat(${zeilen}, 1fr)`,
              width: seite,
              height: seite,
            }}
          >
            {slots.map((slot, index) => (
              <button
                key={slot.id}
                type="button"
                className={
                  'slotmatrix-zelle' + (slot.ziele.length > 0 ? ' slotmatrix-zelle-belegt' : '')
                }
                style={{ gridColumn: `span ${spannen[index]}` }}
                onClick={() => schliessen(slot.id)}
                title={
                  slotNameText(slot.bezeichnung, spracheDesUebersetzers(t)) ||
                  t('verteilerdialoge.allgemein.slotNummer', { nummer: index + 1 })
                }
              >
                <span>
                  {slotNameText(slot.bezeichnung, spracheDesUebersetzers(t)) ||
                    t('verteilerdialoge.allgemein.slotNummer', { nummer: index + 1 })}
                </span>
                {slot.ziele.length > 0 && (
                  <span className="slotmatrix-zelle-badge">{slot.ziele.length}</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="slotwahl-liste">
            {slots.map((slot, index) => (
              <button
                key={slot.id}
                type="button"
                className="slotwahl-eintrag"
                onClick={() => schliessen(slot.id)}
              >
                <span>
                  {slotNameText(slot.bezeichnung, spracheDesUebersetzers(t)) ||
                    t('verteilerdialoge.allgemein.slotNummer', { nummer: index + 1 })}
                </span>
                {slot.ziele.length > 0 && (
                  <span className="slotwahl-eintrag-badge">{slot.ziele.length}</span>
                )}
              </button>
            ))}
          </div>
        )}
        <div className="dialog-aktionen">
          <button type="button" className="sekundaer" onClick={() => schliessen(null)}>
            {t('verteilerdialoge.allgemein.abbrechen')}
          </button>
        </div>
      </div>
    </div>
  )
}
