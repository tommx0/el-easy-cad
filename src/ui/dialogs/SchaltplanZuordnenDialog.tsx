import { useEffect, useState } from 'react'
import type { DokumentMeta } from '../../document-model'
import { istVerteiler, verteilerKennzeichenText } from '../../document-model'
import { useUiStore } from '../store/ui-store'
import { useAppContext, useProject } from '../use-app-context'
import { useT } from '../sprache-anbindung'

export function SchaltplanZuordnenDialog() {
  const ziel = useUiStore((s) => s.schaltplanZuordnen)
  if (!ziel) return null
  return <Inhalt blattId={ziel.blattId} objektId={ziel.objektId} />
}

function Inhalt({ blattId, objektId }: { blattId: string; objektId: string }) {
  const t = useT()
  const { sitzung, oeffneDokument, verknuepfung } = useAppContext()
  const zeichnung = useProject()
  const verteiler = zeichnung.blaetter
    .find((b) => b.id === blattId)
    ?.objekte.find((o) => o.id === objektId)
  const kennzeichen = verteiler && istVerteiler(verteiler) ? verteiler.verteiler.kennzeichen : ''
  const [plaene, setPlaene] = useState<DokumentMeta[] | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [gewaehlt, setGewaehlt] = useState<string | null>(null)
  const [laeuft, setLaeuft] = useState(false)

  useEffect(() => {
    const offen = sitzung.getOffenesDokument()
    if (!offen) return
    let aktiv = true
    sitzung.schaltplaene(offen.projektId).then(
      (liste) => {
        if (aktiv) setPlaene(liste)
      },
      () => {
        if (aktiv) setFehler(t('verteilerdialoge.schaltplanZuordnen.lesefehler'))
      },
    )
    return () => {
      aktiv = false
    }
  }, [sitzung, t])

  const auswahl = plaene?.find((p) => p.id === gewaehlt) ?? null
  const bisher =
    auswahl?.verteilerKennzeichen && auswahl.verteilerKennzeichen !== kennzeichen
      ? auswahl.verteilerKennzeichen
      : null

  function schliessen() {
    useUiStore.getState().setSchaltplanZuordnen(null)
  }

  async function zuordnen() {
    const offen = sitzung.getOffenesDokument()
    if (!auswahl || !offen || !kennzeichen) return
    setLaeuft(true)
    try {
      await sitzung.ordneVerteilerplanZu(auswahl.id, kennzeichen)
      schliessen()
      void verknuepfung.aktualisiere({
        projektId: offen.projektId,
        dokumentId: offen.dokumentId,
        zeichnungsart: zeichnung.zeichnungsart,
      })
      useUiStore.getState().oeffneBestaetigung({
        titel: t('verteilerdialoge.schaltplanZuordnen.zugeordnetTitel'),
        nachricht: t('verteilerdialoge.schaltplanZuordnen.zugeordnetNachricht', {
          name: auswahl.name,
          kennzeichen: verteilerKennzeichenText(kennzeichen),
        }),
        bestaetigenText: t('verteilerdialoge.schaltplanZuordnen.oeffnen'),
        destruktiv: false,
        callback: (bestaetigt) => {
          if (bestaetigt) void oeffneDokument(auswahl.id)
        },
      })
    } catch (f) {
      useUiStore
        .getState()
        .zeigeToast(
          f instanceof Error ? f.message : t('verteilerdialoge.schaltplanZuordnen.fehlgeschlagen'),
        )
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('verteilerdialoge.schaltplanZuordnen.titel')}</h2>
        {!kennzeichen ? (
          <p className="dialog-hinweis">
            {t('verteilerdialoge.schaltplanZuordnen.keinKennzeichen')}
          </p>
        ) : (
          <>
            <p className="dialog-hinweis">
              {t('verteilerdialoge.schaltplanZuordnen.erklaerung', {
                kennzeichen: verteilerKennzeichenText(kennzeichen),
              })}
            </p>
            {fehler ? (
              <p className="dialog-hinweis verteiler-warnung">{fehler}</p>
            ) : !plaene ? (
              <p className="dialog-hinweis">
                {t('verteilerdialoge.schaltplanZuordnen.liestPlaene')}
              </p>
            ) : plaene.length === 0 ? (
              <p className="dialog-hinweis">
                {t('verteilerdialoge.schaltplanZuordnen.keinePlaene')}
              </p>
            ) : (
              <div
                role="radiogroup"
                aria-label={t('verteilerdialoge.schaltplanZuordnen.schaltplan')}
              >
                {plaene.map((p) => (
                  <label key={p.id} className="dialog-radio-zeile">
                    <input
                      type="radio"
                      name="schaltplan-zuordnen"
                      checked={gewaehlt === p.id}
                      onChange={() => setGewaehlt(p.id)}
                    />
                    {p.name}
                    {p.verteilerKennzeichen && (
                      <span className="verteiler-plan">
                        {' '}
                        (
                        {t('verteilerdialoge.schaltplanZuordnen.verteilerplanFuer', {
                          kennzeichen: verteilerKennzeichenText(p.verteilerKennzeichen),
                        })}
                        )
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
            {bisher && (
              <p className="dialog-hinweis verteiler-warnung">
                {t('verteilerdialoge.schaltplanZuordnen.umhaengenWarnung', {
                  name: auswahl!.name,
                  kennzeichen: verteilerKennzeichenText(bisher),
                })}
              </p>
            )}
          </>
        )}
        <div className="dialog-aktionen">
          <button onClick={schliessen}>{t('verteilerdialoge.allgemein.abbrechen')}</button>
          <button
            className="primaer"
            disabled={!auswahl || !kennzeichen || laeuft}
            onClick={() => void zuordnen()}
          >
            {laeuft
              ? t('verteilerdialoge.schaltplanZuordnen.laeuft')
              : bisher
                ? t('verteilerdialoge.schaltplanZuordnen.umhaengen')
                : t('verteilerdialoge.schaltplanZuordnen.zuordnen')}
          </button>
        </div>
      </div>
    </div>
  )
}
