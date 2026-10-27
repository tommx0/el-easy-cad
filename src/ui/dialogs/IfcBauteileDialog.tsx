import { useEffect, useMemo, useState } from 'react'
import { erzeugeBauteilObjekte } from '../../document-model'
import { CompositeCommand, erzeugeObjektAendernCommand, type Command } from '../../tools'
import type { IfcBauteilArt, IfcBauteileJeBlatt } from '../ifc-bauteile'
import {
  IFC_BAUTEIL_ARTEN,
  IN_DER_WAND,
  ifcBauteilHinweisTexte,
  waehleIfcBauteile,
  zaehleIfcBauteile,
} from '../ifc-bauteile'
import {
  aktuellesBlatt,
  aktuelleWahl,
  istLetztesBlatt,
  setzeWahl,
  springeZu,
  starteDurchgang,
  ueberspringe,
  weiter,
  zuUebernehmen,
  zurueck,
  type BlattDurchgang,
} from '../blatt-durchgang'
import { useBlattFolgen } from '../blatt-durchgang-anbindung'
import { BlattDurchgangKnoepfe, BlattDurchgangKopf } from './BlattDurchgangTeile'
import { useUiStore, type BlattDurchgangDialog } from '../store/ui-store'
import { useAppContext } from '../use-app-context'
import { t as tOberflaeche } from '../../sprache'
import { useT } from '../sprache-anbindung'

type Stand = { art: 'laedt' } | { art: 'laeuft' } | { art: 'fehler'; meldung: string }

const fehlerText = (fehler: unknown) =>
  fehler instanceof Error ? fehler.message : tOberflaeche('zeichendialoge.ifcBauteile.nichtLesbar')

export function IfcBauteileDialog() {
  const dialog = useUiStore((s) => s.ifcBauteileDialog)
  if (!dialog) return null
  return <IfcBauteileInhalt key={dialog.blattIds.join('|')} dialog={dialog} />
}

function IfcBauteileInhalt({ dialog }: { dialog: BlattDurchgangDialog }) {
  const { doc, commands, overlaySignal, aktiviereTool, leseIfcBauteile } = useAppContext()
  const t = useT()
  const { blattIds, startBlattId } = dialog
  const mehrere = blattIds.length > 1
  const [stand, setStand] = useState<Stand>({ art: 'laedt' })
  const [gelesen, setGelesen] = useState<Readonly<Record<string, IfcBauteileJeBlatt>>>({})
  const [durchgang, setDurchgang] = useState<BlattDurchgang<ReadonlySet<IfcBauteilArt>>>(() =>
    starteDurchgang(blattIds, new Set(IFC_BAUTEIL_ARTEN.map((a) => a.art))),
  )
  const blattId = aktuellesBlatt(durchgang)
  const gewaehlt = aktuelleWahl(durchgang)
  const eintrag = gelesen[blattId]
  const ergebnis = eintrag && 'ergebnis' in eintrag ? eintrag.ergebnis : null

  const schliessen = (zurueckZumStart = true) => {
    useUiStore.getState().setIfcBauteileDialog(null)
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
    const auftrag = leseIfcBauteile(blattIds, undefined, (e) => {
      setGelesen((bisher) => ({ ...bisher, [e.blattId]: e }))
      setStand({ art: 'laeuft' })
    })
    let verworfen = false
    auftrag.ergebnis.catch((fehler: unknown) => {
      if (!verworfen) setStand({ art: 'fehler', meldung: fehlerText(fehler) })
    })
    aktiviereTool('ifc-bauteile-vorschau')
    return () => {
      verworfen = true
      auftrag.abbrechen()
    }
  }, [blattIds, leseIfcBauteile, aktiviereTool])

  const vorlagen = useMemo(
    () => (ergebnis ? waehleIfcBauteile(ergebnis.vorlagen, gewaehlt) : null),
    [ergebnis, gewaehlt],
  )
  useEffect(() => {
    useUiStore
      .getState()
      .setIfcBauteileVorschau(vorlagen ?? { waende: [], oeffnungen: [], treppen: [], raeume: [] })
    overlaySignal.request()
  }, [vorlagen, overlaySignal])

  const uebernehmen = (d: BlattDurchgang<ReadonlySet<IfcBauteilArt>>) => {
    const teile: Command[] = []
    let angelegt = 0
    let raeumeOffen = 0
    let raeumeDoppelt = 0
    const ziele = zuUebernehmen(d)
    for (const { blattId: id, wahl } of ziele) {
      const e = gelesen[id]
      const b = doc.getBlatt(id)
      if (!e || !('ergebnis' in e) || !b) continue
      const r = erzeugeBauteilObjekte(
        waehleIfcBauteile(e.ergebnis.vorlagen, wahl),
        b.aktiveEbeneId,
        b.objekte,
      )
      raeumeOffen += r.raeumeOffen
      raeumeDoppelt += r.raeumeDoppelt
      if (r.objekte.length === 0) continue
      angelegt += r.objekte.length
      teile.push(
        erzeugeObjektAendernCommand(doc, id, t('zeichendialoge.ifcBauteile.titel'), (objekte) => [
          ...objekte,
          ...r.objekte,
        ]),
      )
    }
    schliessen()
    if (teile.length === 1) commands.execute(teile[0])
    else if (teile.length > 1)
      commands.execute(
        new CompositeCommand(
          t('zeichendialoge.ifcBauteile.titelMehrereBlaetter', { n: teile.length }),
          teile,
        ),
      )
    const ausgefallen: string[] = []
    if (raeumeOffen > 0)
      ausgefallen.push(t('zeichendialoge.ifcBauteile.raeumeOffen', { n: raeumeOffen }))
    if (raeumeDoppelt > 0)
      ausgefallen.push(t('zeichendialoge.ifcBauteile.raeumeDoppelt', { n: raeumeDoppelt }))
    const kopf = mehrere
      ? t('zeichendialoge.ifcBauteile.uebernommenAufBlaettern', {
          n: teile.length,
          anzahl: angelegt,
        })
      : t('zeichendialoge.ifcBauteile.uebernommen')
    const meldung =
      ausgefallen.length > 0
        ? t('zeichendialoge.ifcBauteile.mitAusfall', {
            kopf,
            gruende: ausgefallen.join(', '),
            n: raeumeOffen + raeumeDoppelt,
          })
        : t('zeichendialoge.ifcBauteile.ohneAusfall', { kopf })
    const genommen = new Set(ziele.map((z) => z.blattId))
    const ohne = blattIds.filter(
      (id) => !genommen.has(id) || !(gelesen[id] && 'ergebnis' in gelesen[id]),
    )
    const nachsatz =
      mehrere && ohne.length > 0
        ? ` ${t('zeichendialoge.ifcBauteile.uebersprungen', {
            blaetter: ohne.map((id) => doc.getBlatt(id)?.name ?? '?').join(', '),
          })}`
        : ''
    useUiStore.getState().zeigeToast(meldung + nachsatz)
  }

  const anzahl = ergebnis ? zaehleIfcBauteile(ergebnis.vorlagen) : null
  const gewaehltHier = ergebnis ? zaehleGesamt(waehleIfcBauteile(ergebnis.vorlagen, gewaehlt)) : 0
  const letztes = istLetztesBlatt(durchgang)
  const bereit = eintrag !== undefined && stand.art !== 'fehler'

  return (
    <div
      className="erkennung-assistent ifc-bauteile-dialog"
      role="dialog"
      aria-label={t('zeichendialoge.ifcBauteile.titel')}
    >
      <h2>{t('zeichendialoge.ifcBauteile.titel')}</h2>
      <BlattDurchgangKopf durchgang={durchgang} />

      {stand.art === 'laedt' && (
        <p className="erkennung-ergebnis">{t('zeichendialoge.ifcBauteile.liest')}</p>
      )}
      {stand.art === 'laeuft' && !eintrag && (
        <p className="erkennung-ergebnis">{t('zeichendialoge.ifcBauteile.liestBlatt')}</p>
      )}
      {stand.art === 'fehler' && <p className="erkennung-warnung">{stand.meldung}</p>}
      {eintrag && 'fehler' in eintrag && (
        <p className="erkennung-warnung">
          {t('zeichendialoge.ifcBauteile.blattFehler', { fehler: eintrag.fehler })}
        </p>
      )}
      {ergebnis && anzahl && (
        <>
          <p className="dialog-hinweis">{t('zeichendialoge.ifcBauteile.hinweis')}</p>
          <div className="erkennung-schalter-gruppe">
            {IFC_BAUTEIL_ARTEN.map(({ art, name }) => {
              const ohneWand = IN_DER_WAND.has(art) && !gewaehlt.has('waende')
              return (
                <label
                  key={art}
                  className="erkennung-schalter"
                  title={ohneWand ? t('zeichendialoge.ifcBauteile.brauchenWand') : undefined}
                >
                  <input
                    type="checkbox"
                    checked={gewaehlt.has(art) && !ohneWand}
                    disabled={ohneWand || anzahl[art] === 0}
                    onChange={(e) => {
                      const neu = new Set(gewaehlt)
                      if (e.target.checked) neu.add(art)
                      else neu.delete(art)
                      setDurchgang((d) => setzeWahl(d, neu))
                    }}
                  />
                  <span>
                    {name} ({anzahl[art]})
                  </span>
                </label>
              )
            })}
          </div>
          {ifcBauteilHinweisTexte(ergebnis).map((text) => (
            <p key={text} className="erkennung-warnung">
              {text}
            </p>
          ))}
          {zaehleGesamt(ergebnis.vorlagen) === 0 && (
            <p className="erkennung-ergebnis">{t('zeichendialoge.ifcBauteile.keineBauteile')}</p>
          )}
        </>
      )}

      {mehrere ? (
        <BlattDurchgangKnoepfe
          durchgang={durchgang}
          abbrechen={() => schliessen()}
          zurueck={() => setDurchgang(zurueck)}
          ueberspringen={() =>
            letztes ? uebernehmen(ueberspringe(durchgang)) : setDurchgang(ueberspringe)
          }
          weiter={() => (letztes ? uebernehmen(weiter(durchgang)) : setDurchgang(weiter))}
          weiterGesperrt={letztes && !bereit}
          abschliessenText={t('zeichendialoge.gemeinsam.uebernehmen')}
        />
      ) : (
        <div className="dialog-aktionen">
          <button type="button" onClick={() => schliessen()}>
            {stand.art === 'laedt'
              ? t('zeichendialoge.gemeinsam.abbrechen')
              : t('zeichendialoge.gemeinsam.schliessen')}
          </button>
          <button
            type="button"
            className="primaer"
            onClick={() => uebernehmen(durchgang)}
            disabled={!ergebnis || gewaehltHier === 0}
          >
            {t('zeichendialoge.gemeinsam.uebernehmen')}
          </button>
        </div>
      )}
    </div>
  )
}

function zaehleGesamt(vorlagen: {
  waende: readonly unknown[]
  oeffnungen: readonly unknown[]
  treppen: readonly unknown[]
  raeume?: readonly unknown[]
}): number {
  return (
    vorlagen.waende.length +
    vorlagen.oeffnungen.length +
    vorlagen.treppen.length +
    (vorlagen.raeume?.length ?? 0)
  )
}
