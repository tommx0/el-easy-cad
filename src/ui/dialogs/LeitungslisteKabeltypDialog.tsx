import {
  beschreibeLeitungsEnde,
  ermittleAlleLeitungsLaengen,
  kabelEnden,
} from '../../document-model'
import { erzeugeKabeltypAendernCommand } from '../../tools'
import { useAppContext, useProject } from '../use-app-context'
import { useKatalogStore } from '../store/katalog-store'
import { useUiStore } from '../store/ui-store'
import { KabeltypFeld } from '../components/KabeltypFeld'
import { gleicheKabeltypenAb } from '../kabeltyp-abgleich'
import { useT } from '../sprache-anbindung'

export function LeitungslisteKabeltypDialog() {
  const zustand = useUiStore((s) => s.leitungslisteKabeltypDialog)
  if (!zustand) return null
  return <LeitungslisteKabeltypDialogInhalt kabelNummer={zustand.kabelNummer} />
}

function LeitungslisteKabeltypDialogInhalt({ kabelNummer }: { kabelNummer: number }) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()
  const katalog = useKatalogStore((s) => s.komponenten)
  const schliessen = () => useUiStore.getState().schliesseLeitungslisteKabeltypDialog()

  const kabel = ermittleAlleLeitungsLaengen(zeichnung).find((k) => k.nummer === kabelNummer)
  if (!kabel) return null

  const leitungIds = kabel.glieder.map((g) => g.leitung.id)
  const erstesGlied = kabel.glieder[0].leitung
  const enden = kabelEnden(kabel)
  const beschreibungVon = enden
    ? beschreibeLeitungsEnde(zeichnung, kabel.glieder[0].blattId, enden.start, katalog)
    : null
  const beschreibungNach = enden
    ? beschreibeLeitungsEnde(
        zeichnung,
        kabel.glieder[kabel.glieder.length - 1].blattId,
        enden.ziel,
        katalog,
      )
    : null

  function wende(
    patch: { kabeltypId?: string; typ?: string },
    ids: readonly string[],
    label: string,
  ) {
    commands.execute(erzeugeKabeltypAendernCommand(doc, ids, patch, label))
    gleicheKabeltypenAb(doc)
  }

  function fuerAlleUebernehmen(patch: { kabeltypId?: string; typ?: string }) {
    const alleLeitungIds = zeichnung.blaetter.flatMap((b) =>
      b.objekte.filter((o) => o.type === 'leitung').map((o) => o.id),
    )
    useUiStore.getState().oeffneBestaetigung({
      titel: t('verteilerdialoge.kabeltyp.fuerAlleTitel'),
      nachricht: t('verteilerdialoge.kabeltyp.fuerAlleNachricht'),
      bestaetigenText: t('verteilerdialoge.kabeltyp.fuerAlleBestaetigen'),
      callback: (ja) => {
        if (ja) wende(patch, alleLeitungIds, t('verteilerdialoge.kabeltyp.fuerAlleTitel'))
      },
    })
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-gross" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('verteilerdialoge.kabeltyp.titel')}</h2>
        <p className="dialog-hinweis">
          {t('verteilerdialoge.kabeltyp.kabelNummer', { nummer: String(kabel.nummer) })}
          {beschreibungVon && beschreibungNach && (
            <>
              {' '}
              · {beschreibungVon} → {beschreibungNach}
            </>
          )}
        </p>

        <KabeltypFeld
          titel={t('verteilerdialoge.kabeltyp.feld')}
          wertId={erstesGlied.kabeltypId}
          freierText={erstesGlied.typ}
          zusatzTypen={zeichnung.kabeltypen}
          aendern={(wahl) => wende(wahl, leitungIds, t('verteilerdialoge.kabeltyp.titel'))}
        />

        <div className="dialog-aktionen">
          <button
            type="button"
            onClick={() =>
              fuerAlleUebernehmen({ kabeltypId: erstesGlied.kabeltypId, typ: erstesGlied.typ })
            }
          >
            {t('verteilerdialoge.kabeltyp.fuerAlleKnopf')}
          </button>
          <button type="button" className="primaer" onClick={schliessen}>
            {t('verteilerdialoge.allgemein.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}
