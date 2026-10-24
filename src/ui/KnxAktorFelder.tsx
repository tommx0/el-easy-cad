import type { KnxAktorDaten, KomponentenObjekt } from '../document-model'
import {
  knxAktorTitel,
  knxAktorVerloreneAnschluesse,
  knxKanalPaare,
  normalisiereKnxAktor,
} from '../document-model'
import { erzeugeKnxAktorAendernCommand } from '../tools'
import { useUiStore } from './store/ui-store'
import { useAppContext } from './use-app-context'
import { useT } from './sprache-anbindung'

export function KnxAktorFelder({
  objekt,
  blattId,
}: {
  objekt: KomponentenObjekt & { knxAktor: KnxAktorDaten }
  blattId: string
}) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const daten = objekt.knxAktor
  const paare = knxKanalPaare(daten).length

  function anwenden(neu: KnxAktorDaten) {
    const blatt = doc.getBlatt(blattId)
    if (!blatt) return
    const ausfuehren = () =>
      commands.execute(erzeugeKnxAktorAendernCommand(doc, blattId, objekt.id, neu))
    const verloren = knxAktorVerloreneAnschluesse(blatt.objekte, objekt, neu)
    if (verloren.length === 0) {
      ausfuehren()
      return
    }
    useUiStore.getState().oeffneBestaetigung({
      titel: t('eigenschaften.knxAktor.entfallenTitel'),
      nachricht: t('eigenschaften.knxAktor.entfallenNachricht', { stellen: verloren.join(', ') }),
      bestaetigenText: t('eigenschaften.knxAktor.trotzdemAendern'),
      destruktiv: true,
      callback: (ja) => {
        if (ja) ausfuehren()
      },
    })
  }

  return (
    <>
      <p className="feld-info">
        {t('eigenschaften.knxAktor.titel', { titel: knxAktorTitel(daten) })}
        {paare > 0 ? ` · ${t('eigenschaften.knxAktor.paare', { n: paare })}` : ''}
      </p>
      <div className="feld-knoepfe">
        <button
          type="button"
          onClick={() =>
            useUiStore.getState().oeffneKnxAktorDialog({
              daten,
              titel: t('eigenschaften.knxAktor.kanaeleBearbeiten'),
              bestaetigenText: t('eigenschaften.knxAktor.uebernehmen'),
              callback: (ergebnis) => {
                if (ergebnis) anwenden(ergebnis.daten)
              },
            })
          }
        >
          {t('eigenschaften.knxAktor.kanaeleBearbeitenKnopf')}
        </button>
      </div>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={daten.versorgungSichtbar !== false}
          onChange={(e) =>
            anwenden(
              normalisiereKnxAktor({
                ...daten,
                versorgungSichtbar: e.target.checked ? undefined : false,
              }),
            )
          }
        />
        {t('eigenschaften.knxAktor.versorgung')}
      </label>
    </>
  )
}
