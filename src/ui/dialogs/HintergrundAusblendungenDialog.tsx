import { istBekannterHintergrund } from '../../document-model'
import { hintergrundMassstab } from '../../document-model'
import { erzeugeBlattAendernCommand } from '../../tools'
import { useAppContext, useAktivesBlatt } from '../use-app-context'
import { useUiStore } from '../store/ui-store'
import { useT } from '../sprache-anbindung'
import { befehlName, gruppenName } from '../befehle/katalog'

export function HintergrundAusblendungenDialog() {
  const offen = useUiStore((s) => s.hintergrundAusblendungenDialogOffen)
  const schliessen = () => useUiStore.getState().setHintergrundAusblendungenDialogOffen(false)
  const { doc, commands } = useAppContext()
  const blatt = useAktivesBlatt()
  const t = useT()

  if (!offen) return null

  const hintergrund = blatt.hintergrund
  const ausblendungen = hintergrund?.ausblendungen ?? []
  const massstab = hintergrundMassstab(blatt)

  function loesche(id: string) {
    if (!istBekannterHintergrund(hintergrund)) return
    commands.execute(
      erzeugeBlattAendernCommand(doc, blatt.id, t('zeichendialoge.ausblendungen.entfernen'), {
        hintergrund: {
          ...hintergrund,
          ausblendungen: hintergrund.ausblendungen.filter((a) => a.id !== id),
        },
      }),
    )
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('zeichendialoge.ausblendungen.titel')}</h2>
        <p className="dialog-hinweis">
          {t('zeichendialoge.ausblendungen.gilt', {
            name: blatt.name,
            werkzeug: befehlName('hintergrund-ausblenden', t),
            menue: gruppenName('blatt', t),
          })}
        </p>

        {ausblendungen.length === 0 ? (
          <p className="dialog-hinweis">{t('zeichendialoge.ausblendungen.keine')}</p>
        ) : (
          <div className="ausblendung-tabelle">
            {ausblendungen.map((ausblendung, index) => {
              const breiteCm = Math.round(
                Math.abs(ausblendung.eckeB.x - ausblendung.eckeA.x) * massstab * 100,
              )
              const hoeheCm = Math.round(
                Math.abs(ausblendung.eckeB.y - ausblendung.eckeA.y) * massstab * 100,
              )
              return (
                <div key={ausblendung.id} className="ausblendung-zeile">
                  <span>{t('zeichendialoge.ausblendungen.eintrag', { nr: index + 1 })}</span>
                  <span>
                    {breiteCm} cm × {hoeheCm} cm
                  </span>
                  <button type="button" onClick={() => loesche(ausblendung.id)}>
                    {t('zeichendialoge.gemeinsam.loeschen')}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="dialog-aktionen">
          <button type="button" className="primaer" onClick={schliessen}>
            {t('zeichendialoge.gemeinsam.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}
