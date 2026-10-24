import { erzeugeBlattAendernCommand, erzeugeBlattLoeschenCommand } from '../../tools'
import { useAppContext, useProject } from '../use-app-context'
import { useUiStore } from '../store/ui-store'
import { legeNeuesBlattAn } from '../blatt-anlegen'
import { meldeNurAnsicht } from '../nur-ansicht'
import { useT } from '../sprache-anbindung'

export function BlattVerwaltungDialog() {
  const offen = useUiStore((s) => s.blattVerwaltungOffen)
  const schliessen = () => useUiStore.getState().setBlattVerwaltungOffen(false)
  const { doc, commands, toolContext } = useAppContext()
  const zeichnung = useProject()
  const t = useT()

  if (!offen) return null

  function umbenennen(blattId: string, name: string) {
    if (meldeNurAnsicht(zeichnung.blaetter.find((b) => b.id === blattId))) return
    toolContext.oeffneEingabeDialog(
      {
        titel: t('zeichendialoge.blattVerwaltung.umbenennenTitel'),
        label: t('zeichendialoge.blattVerwaltung.nameLabel'),
        anfangswert: name,
      },
      (wert) => {
        if (wert && wert.trim())
          commands.execute(
            erzeugeBlattAendernCommand(
              doc,
              blattId,
              t('zeichendialoge.blattVerwaltung.umbenennenTitel'),
              { name: wert.trim() },
            ),
          )
      },
    )
  }

  function loeschen(blattId: string) {
    const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
    if (!blatt || meldeNurAnsicht(blatt)) return

    toolContext.oeffneBestaetigung({
      titel: t('zeichendialoge.blattVerwaltung.loeschenTitel'),
      nachricht: t('zeichendialoge.blattVerwaltung.loeschenFrage', { name: blatt.name }),
      callback: (bestaetigt) => {
        if (bestaetigt) {
          const command = erzeugeBlattLoeschenCommand(doc, blattId)
          if (command) commands.execute(command)
        }
      },
    })
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('zeichendialoge.blattVerwaltung.titel')}</h2>
        <ul className="blatt-liste">
          {zeichnung.blaetter.map((blatt) => (
            <li key={blatt.id} className={blatt.id === zeichnung.aktivesBlattId ? 'aktiv' : ''}>
              <button
                type="button"
                className="blatt-liste-name"
                onClick={() => doc.setAktivesBlatt(blatt.id)}
              >
                {blatt.name}
              </button>
              <span className="blatt-liste-info">
                {t('zeichendialoge.blattVerwaltung.objekte', { n: blatt.objekte.length })}
              </span>
              <button type="button" onClick={() => umbenennen(blatt.id, blatt.name)}>
                {t('zeichendialoge.blattVerwaltung.umbenennen')}
              </button>
              <button
                type="button"
                disabled={zeichnung.blaetter.length <= 1}
                onClick={() => loeschen(blatt.id)}
              >
                {t('zeichendialoge.gemeinsam.loeschen')}
              </button>
            </li>
          ))}
        </ul>
        <div className="dialog-aktionen">
          <button
            type="button"
            onClick={() => {
              schliessen()
              legeNeuesBlattAn(doc, commands)
            }}
          >
            {t('zeichendialoge.blattVerwaltung.neuesBlatt')}
          </button>
          <button type="button" className="primaer" onClick={schliessen}>
            {t('zeichendialoge.gemeinsam.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}
