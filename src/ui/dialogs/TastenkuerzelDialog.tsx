import type { Schluessel } from '../../sprache'
import { useFreigeschalteteModule } from '../lizenz-module'
import { useT } from '../sprache-anbindung'
import { befehleMitModulen, befehlName, gruppenName, type BefehlGruppe } from '../befehle/katalog'
import { anzeige } from '../befehle/kuerzel'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'

const MAUS_UND_SONDERTASTEN: [Schluessel, Schluessel][] = [
  ['verwaltungsdialoge.tastenkuerzelDialog.tasteEsc', 'verwaltungsdialoge.tastenkuerzelDialog.esc'],
  [
    'verwaltungsdialoge.tastenkuerzelDialog.tasteEscEsc',
    'verwaltungsdialoge.tastenkuerzelDialog.escEsc',
  ],
  [
    'verwaltungsdialoge.tastenkuerzelDialog.tasteEnter',
    'verwaltungsdialoge.tastenkuerzelDialog.enter',
  ],
  [
    'verwaltungsdialoge.tastenkuerzelDialog.tastePlusMinus',
    'verwaltungsdialoge.tastenkuerzelDialog.plusMinus',
  ],
  [
    'verwaltungsdialoge.tastenkuerzelDialog.tasteD',
    'verwaltungsdialoge.tastenkuerzelDialog.dHalten',
  ],
  [
    'verwaltungsdialoge.tastenkuerzelDialog.tasteMausrad',
    'verwaltungsdialoge.tastenkuerzelDialog.mausrad',
  ],
  [
    'verwaltungsdialoge.tastenkuerzelDialog.tasteRechtsZiehen',
    'verwaltungsdialoge.tastenkuerzelDialog.pannen',
  ],
  [
    'verwaltungsdialoge.tastenkuerzelDialog.tasteRechtsklick',
    'verwaltungsdialoge.tastenkuerzelDialog.kontextmenue',
  ],
]

const GRUPPEN: BefehlGruppe[] = [
  'werkzeuge',
  'datei',
  'bearbeiten',
  'blatt',
  'ansicht',
  'katalog',
  'extras',
  'module',
  'hilfe',
]

export function TastenkuerzelDialog() {
  const t = useT()
  const module = useFreigeschalteteModule()
  const offen = useUiStore((s) => s.tastenkuerzelDialogOffen)
  const belegung = useSettingsStore((s) => s.belegung)
  const schliessen = () => useUiStore.getState().setTastenkuerzelDialogOffen(false)
  if (!offen) return null

  function zumEinstellen() {
    useUiStore.getState().setTastenkuerzelDialogOffen(false)
    useUiStore.getState().setEinstellungenOffen(true)
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-gross" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('verwaltungsdialoge.tastenkuerzelDialog.titel')}</h2>
        {GRUPPEN.map((gruppe) => {
          const zeilen = befehleMitModulen(module).filter(
            (befehl) => befehl.gruppe === gruppe && (belegung[befehl.id] || befehl.festeAnzeige),
          )
          if (zeilen.length === 0) return null
          return (
            <div key={gruppe}>
              <h3>{gruppenName(gruppe)}</h3>
              <table className="kuerzel-tabelle">
                <tbody>
                  {zeilen.map((befehl) => {
                    const kuerzel = belegung[befehl.id]
                    return (
                      <tr key={befehl.id}>
                        <td>{befehl.festeAnzeige ?? (kuerzel ? anzeige(kuerzel) : '')}</td>
                        <td>{befehlName(befehl.id)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}
        <h3>{t('verwaltungsdialoge.tastenkuerzelDialog.mausUndSondertasten')}</h3>
        <table className="kuerzel-tabelle">
          <tbody>
            {MAUS_UND_SONDERTASTEN.map(([taste, label]) => (
              <tr key={taste}>
                <td>{t(taste)}</td>
                <td>{t(label)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="dialog-aktionen">
          <button type="button" onClick={zumEinstellen}>
            {t('verwaltungsdialoge.tastenkuerzelDialog.kuerzelAendern')}
          </button>
          <button type="button" className="primaer" onClick={schliessen}>
            {t('verwaltungsdialoge.allgemein.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}
