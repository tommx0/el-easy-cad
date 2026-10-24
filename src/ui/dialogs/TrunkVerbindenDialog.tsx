import { useMemo, useState } from 'react'
import type { TrunkObjekt } from '../../document-model'
import { trunkAnzeigeName } from '../../document-model'
import { useAppContext } from '../use-app-context'
import { useUiStore } from '../store/ui-store'
import { useT } from '../sprache-anbindung'

export function TrunkVerbindenDialog() {
  const t = useT()
  const dialog = useUiStore((s) => s.trunkVerbindenDialog)
  const { doc } = useAppContext()
  const [blattId, setBlattId] = useState('')
  const [trunkId, setTrunkId] = useState('')
  const [endeIndex, setEndeIndex] = useState<0 | 1 | null>(null)

  const blaetter = doc.getZeichnung().blaetter

  const trunksAufBlatt = useMemo<TrunkObjekt[]>(() => {
    if (!dialog) return []
    const blatt = blaetter.find((b) => b.id === blattId)
    if (!blatt) return []
    return blatt.objekte.filter(
      (o): o is TrunkObjekt =>
        o.type === 'trunk' && !(blattId === dialog.von.blattId && o.id === dialog.von.trunkId),
    )
  }, [dialog, blaetter, blattId])

  const ausgewaehlterTrunk = trunksAufBlatt.find((tr) => tr.id === trunkId) ?? null
  const anzeigeName = (trunk: TrunkObjekt) =>
    trunkAnzeigeName(doc.getZeichnung(), blattId, trunk.id)

  if (!dialog) return null

  function reset() {
    setBlattId('')
    setTrunkId('')
    setEndeIndex(null)
  }

  function schliessenMit(ziel: { blattId: string; trunkId: string; endeIndex: 0 | 1 } | null) {
    const callback = dialog!.callback
    reset()
    useUiStore.getState().schliesseTrunkVerbindenDialog()
    callback(ziel)
  }

  return (
    <div className="dialog-overlay" onMouseDown={() => schliessenMit(null)}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('verteilerdialoge.trunkVerbinden.titel')}</h2>
        <label className="dialog-feld">
          {t('verteilerdialoge.trunkVerbinden.zielBlatt')}
          <select
            value={blattId}
            onChange={(e) => {
              setBlattId(e.target.value)
              setTrunkId('')
              setEndeIndex(null)
            }}
          >
            <option value="">{t('verteilerdialoge.allgemein.bitteWaehlen')}</option>
            {blaetter.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        {blattId && (
          <label className="dialog-feld">
            {t('verteilerdialoge.trunkVerbinden.zielTrunk')}
            <select
              value={trunkId}
              onChange={(e) => {
                setTrunkId(e.target.value)
                setEndeIndex(null)
              }}
            >
              <option value="">{t('verteilerdialoge.allgemein.bitteWaehlen')}</option>
              {trunksAufBlatt.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {anzeigeName(tr)}
                </option>
              ))}
            </select>
            {trunksAufBlatt.length === 0 && (
              <span className="dialog-hinweis">
                {t('verteilerdialoge.trunkVerbinden.keineTrunks')}
              </span>
            )}
          </label>
        )}
        {ausgewaehlterTrunk && (
          <fieldset className="dialog-feld">
            <legend>{t('verteilerdialoge.trunkVerbinden.zielEnde')}</legend>
            {([0, 1] as const).map((idx) => {
              const belegt = !!ausgewaehlterTrunk.enden[idx].verbundenesEnde
              return (
                <label key={idx} className="dialog-radio-zeile">
                  <input
                    type="radio"
                    name="trunk-ende"
                    checked={endeIndex === idx}
                    disabled={belegt}
                    onChange={() => setEndeIndex(idx)}
                  />
                  {t(
                    belegt
                      ? 'verteilerdialoge.trunkVerbinden.endeBelegt'
                      : 'verteilerdialoge.trunkVerbinden.ende',
                    { name: anzeigeName(ausgewaehlterTrunk), ende: idx === 0 ? 'A' : 'B' },
                  )}
                </label>
              )
            })}
          </fieldset>
        )}
        <div className="dialog-aktionen">
          <button type="button" onClick={() => schliessenMit(null)}>
            {t('verteilerdialoge.allgemein.abbrechen')}
          </button>
          <button
            type="button"
            className="primaer"
            disabled={!blattId || !trunkId || endeIndex === null}
            onClick={() =>
              blattId &&
              trunkId &&
              endeIndex !== null &&
              schliessenMit({ blattId, trunkId, endeIndex })
            }
          >
            {t('verteilerdialoge.trunkVerbinden.verbinden')}
          </button>
        </div>
      </div>
    </div>
  )
}
