import { useEffect, useState } from 'react'
import {
  objekteAusHintergrund,
  planUebersetzer,
  umwandelbarerHintergrund,
  type Blatt,
  type HintergrundHerkunft,
  type Objekt,
  type PlanLinie,
} from '../../document-model'
import {
  erzeugeHintergrundUmwandelnCommand,
  erzeugeHintergruendeUmwandelnCommand,
} from '../../tools'
import {
  aktuellesBlatt,
  istLetztesBlatt,
  springeZu,
  starteDurchgang,
  ueberspringe,
  weiter,
  zuUebernehmen,
  zurueck,
  type BlattDurchgang,
} from '../blatt-durchgang'
import { useBlattFolgen } from '../blatt-durchgang-anbindung'
import { ladePdfLinienGemerkt } from '../hintergrund-fang-quelle'
import { umwandelnBlattText } from '../hintergrund-umwandeln-text'
import { BlattDurchgangKnoepfe, BlattDurchgangKopf } from './BlattDurchgangTeile'
import { useUiStore, type BlattDurchgangDialog } from '../store/ui-store'
import { useAppContext } from '../use-app-context'
import { t as tOberflaeche } from '../../sprache'
import { useT } from '../sprache-anbindung'

type BlattStand =
  | { art: 'laedt' }
  | {
      art: 'fertig'
      typ: HintergrundHerkunft
      pdfLinien?: readonly PlanLinie[]
      vorschau: Objekt[]
    }
  | { art: 'nichts'; grund: string }

const LAEDT: BlattStand = { art: 'laedt' }

async function werteAus(blatt: Blatt): Promise<BlattStand> {
  const h = umwandelbarerHintergrund(blatt)
  if (!h) return { art: 'nichts', grund: tOberflaeche('aktionen.befehle.grundKeineLinien') }
  let pdfLinien: PlanLinie[] | undefined
  if (h.typ === 'pdf') {
    try {
      pdfLinien = await ladePdfLinienGemerkt(h)
    } catch {
      return { art: 'nichts', grund: tOberflaeche('aktionen.befehle.grundPdf') }
    }
    if (pdfLinien.length === 0)
      return { art: 'nichts', grund: tOberflaeche('aktionen.befehle.grundOhneVektoren') }
  }
  const vorschau = objekteAusHintergrund(blatt, '', pdfLinien)
  if (vorschau.length === 0)
    return { art: 'nichts', grund: tOberflaeche('aktionen.befehle.grundKeineLinien') }
  return { art: 'fertig', typ: h.typ, pdfLinien, vorschau }
}

export function HintergrundUmwandelnDialog() {
  const dialog = useUiStore((s) => s.umwandelnDialog)
  if (!dialog) return null
  return <UmwandelnInhalt key={dialog.blattIds.join('|')} dialog={dialog} />
}

function UmwandelnInhalt({ dialog }: { dialog: BlattDurchgangDialog }) {
  const { doc, commands, overlaySignal, aktiviereTool } = useAppContext()
  const t = useT()
  const { blattIds, startBlattId } = dialog
  const mehrere = blattIds.length > 1
  const [staende, setStaende] = useState<Readonly<Record<string, BlattStand>>>({})
  const [durchgang, setDurchgang] = useState<BlattDurchgang<null>>(() =>
    starteDurchgang(blattIds, null),
  )
  const blattId = aktuellesBlatt(durchgang)
  const stand: BlattStand = staende[blattId] ?? LAEDT

  const schliessen = (zurueckZumStart = true) => {
    useUiStore.getState().setUmwandelnDialog(null)
    aktiviereTool('auswahl')
    if (zurueckZumStart) doc.setAktivesBlatt(startBlattId)
    overlaySignal.request()
  }

  useBlattFolgen({
    blattIds,
    aktuellesBlattId: blattId,
    springeZu: (index) => setDurchgang((d) => springeZu(d, index)),
    schliessen: () => schliessen(false),
  })

  useEffect(() => {
    let verworfen = false
    void (async () => {
      for (const id of blattIds) {
        const blatt = doc.getBlatt(id)
        const ergebnis: BlattStand = blatt
          ? await werteAus(blatt)
          : { art: 'nichts', grund: tOberflaeche('aktionen.befehle.grundKeineLinien') }
        if (verworfen) return
        setStaende((bisher) => ({ ...bisher, [id]: ergebnis }))
      }
    })()
    aktiviereTool('umwandeln-vorschau')
    return () => {
      verworfen = true
    }
  }, [blattIds, doc, aktiviereTool])

  useEffect(() => {
    useUiStore.getState().setUmwandelnVorschau(stand.art === 'fertig' ? stand.vorschau : [])
    overlaySignal.request()
  }, [stand, overlaySignal])

  const umwandeln = (d: BlattDurchgang<null>) => {
    const auftraege = zuUebernehmen(d).flatMap(({ blattId: id }) => {
      const s = staende[id]
      return s?.art === 'fertig' ? [{ blattId: id, pdfLinien: s.pdfLinien }] : []
    })
    schliessen()
    if (auftraege.length === 1) {
      const ergebnis = erzeugeHintergrundUmwandelnCommand(doc, auftraege[0].blattId, {
        pdfLinien: auftraege[0].pdfLinien,
      })
      if (!ergebnis) return
      commands.execute(ergebnis.command)
      useUiStore.getState().zeigeToast(t('hintergrund.umgewandelt', { n: ergebnis.anzahl }))
    } else if (auftraege.length > 1) {
      const ergebnis = erzeugeHintergruendeUmwandelnCommand(doc, auftraege)
      if (!ergebnis) return
      commands.execute(ergebnis.command)
      useUiStore.getState().zeigeToast(
        t('hintergrund.umgewandeltAufBlaettern', {
          n: ergebnis.anzahl,
          blaetter: ergebnis.jeBlatt.length,
        }),
      )
    }
  }

  const letztes = istLetztesBlatt(durchgang)
  const bereit = stand.art !== 'laedt'
  const tp = planUebersetzer(doc.getZeichnung())

  return (
    <div
      className="erkennung-assistent umwandeln-dialog"
      role="dialog"
      aria-label={t('zeichendialoge.umwandeln.titel')}
    >
      <h2>{t('zeichendialoge.umwandeln.titel')}</h2>
      <BlattDurchgangKopf durchgang={durchgang} />
      {stand.art === 'laedt' && (
        <p className="erkennung-ergebnis">{t('zeichendialoge.umwandeln.laedt')}</p>
      )}
      {stand.art === 'nichts' && (
        <p className="erkennung-warnung">
          {t('zeichendialoge.umwandeln.nichts', { grund: stand.grund })}
        </p>
      )}
      {stand.art === 'fertig' && (
        <>
          <p className="erkennung-ergebnis">
            {umwandelnBlattText(stand.typ, stand.vorschau.length, tp)}
          </p>
          <p className="dialog-hinweis">{t('zeichendialoge.umwandeln.hinweis')}</p>
        </>
      )}

      {mehrere ? (
        <BlattDurchgangKnoepfe
          durchgang={durchgang}
          abbrechen={() => schliessen()}
          zurueck={() => setDurchgang(zurueck)}
          ueberspringen={() =>
            letztes ? umwandeln(ueberspringe(durchgang)) : setDurchgang(ueberspringe)
          }
          weiter={() => (letztes ? umwandeln(weiter(durchgang)) : setDurchgang(weiter))}
          weiterGesperrt={letztes && !bereit}
          abschliessenText={t('aktionen.befehle.umwandeln')}
        />
      ) : (
        <div className="dialog-aktionen">
          <button type="button" onClick={() => schliessen()}>
            {t('zeichendialoge.gemeinsam.abbrechen')}
          </button>
          <button
            type="button"
            className="primaer"
            onClick={() => umwandeln(durchgang)}
            disabled={stand.art !== 'fertig'}
          >
            {t('aktionen.befehle.umwandeln')}
          </button>
        </div>
      )}
    </div>
  )
}
