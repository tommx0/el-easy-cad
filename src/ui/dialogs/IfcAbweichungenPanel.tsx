import type { IfcAbweichung, IfcBauteilTyp } from '../../document-model'
import type { Schluessel } from '../../sprache'
import { useUiStore } from '../store/ui-store'
import { useT } from '../sprache-anbindung'
import { befehlName } from '../befehle/katalog'

const BAUTEIL_NAMEN: Record<IfcBauteilTyp, Schluessel> = {
  wand: 'zeichendialoge.ifcAbweichungen.bauteil.wand',
  tuer: 'zeichendialoge.ifcAbweichungen.bauteil.tuer',
  fenster: 'zeichendialoge.ifcAbweichungen.bauteil.fenster',
  wanddurchbruch: 'zeichendialoge.ifcAbweichungen.bauteil.wanddurchbruch',
  treppe: 'zeichendialoge.ifcAbweichungen.bauteil.treppe',
  raum: 'zeichendialoge.ifcAbweichungen.bauteil.raum',
}

const ART_TEXTE: Record<IfcAbweichung['art'], Schluessel> = {
  geaendert: 'zeichendialoge.ifcAbweichungen.art.geaendert',
  neu: 'zeichendialoge.ifcAbweichungen.art.neu',
  weggefallen: 'zeichendialoge.ifcAbweichungen.art.weggefallen',
}

export function IfcAbweichungenPanel() {
  const zustand = useUiStore((s) => s.ifcAbweichungen)
  const t = useT()
  if (!zustand) return null
  const schliessen = () => useUiStore.getState().setIfcAbweichungen(null)
  const zeigen = (blattId: string, eintrag: IfcAbweichung) => {
    if (!eintrag.bereich) return
    window.dispatchEvent(
      new CustomEvent('eleasycad:sprung-zu-blatt', {
        detail: { blattId, bereich: eintrag.bereich, objektIds: eintrag.objektIds },
      }),
    )
  }

  return (
    <div
      className="erkennung-assistent ifc-abweichungen"
      role="dialog"
      aria-label={t('zeichendialoge.ifcAbweichungen.titel')}
    >
      <h2>{t('zeichendialoge.ifcAbweichungen.titel')}</h2>
      <p className="dialog-hinweis">
        {t('zeichendialoge.ifcAbweichungen.hinweis', {
          datei: zustand.dateiname,
          befehl: befehlName('ifc-bauteile', t),
        })}
      </p>
      {zustand.blaetter.map((blatt) => (
        <div key={blatt.blattId} className="ifc-abweichungen-blatt">
          <h3>{blatt.blattName}</h3>
          <ul>
            {blatt.eintraege.map((eintrag) => (
              <li key={`${eintrag.art}-${eintrag.ifcGuid}`} className="ifc-abweichung">
                <span>
                  {eintrag.name
                    ? t('zeichendialoge.ifcAbweichungen.eintragMitName', {
                        bauteil: t(BAUTEIL_NAMEN[eintrag.bauteil]),
                        name: eintrag.name,
                        art: t(ART_TEXTE[eintrag.art]),
                      })
                    : t('zeichendialoge.ifcAbweichungen.eintrag', {
                        bauteil: t(BAUTEIL_NAMEN[eintrag.bauteil]),
                        art: t(ART_TEXTE[eintrag.art]),
                      })}
                </span>
                <button
                  type="button"
                  onClick={() => zeigen(blatt.blattId, eintrag)}
                  disabled={!eintrag.bereich}
                >
                  {t('zeichendialoge.ifcAbweichungen.zeigen')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="dialog-aktionen">
        <button type="button" className="primaer" onClick={schliessen}>
          {t('zeichendialoge.gemeinsam.schliessen')}
        </button>
      </div>
    </div>
  )
}
