import { useState } from 'react'
import {
  EINSTELLUNGS_BEREICHE,
  enthalteneBereiche,
  type EinstellungsBereich,
} from '../../persistence'
import {
  bereichHinweis,
  bereichName,
  sichereEinstellungen,
  spieleEinstellungenEin,
} from '../einstellungen-austausch'
import { useT } from '../sprache-anbindung'
import { useUiStore, type EinstellungenAustausch } from '../store/ui-store'
import { useAppContext } from '../use-app-context'

export function EinstellungenAustauschDialog() {
  const austausch = useUiStore((s) => s.einstellungenAustausch)
  if (!austausch) return null
  return (
    <EinstellungenAustauschInhalt
      key={austausch.art === 'einspielen' ? austausch.dateiname : 'sichern'}
      austausch={austausch}
    />
  )
}

function EinstellungenAustauschInhalt({ austausch }: { austausch: EinstellungenAustausch }) {
  const t = useT()
  const { settingsStore, kabeltypStore, installationszonenStore, doc } = useAppContext()
  const verfuegbar: readonly EinstellungsBereich[] =
    austausch.art === 'einspielen' ? enthalteneBereiche(austausch.sicherung) : EINSTELLUNGS_BEREICHE
  const [gewaehlt, setGewaehlt] = useState<EinstellungsBereich[]>([...verfuegbar])
  const [laeuft, setLaeuft] = useState(false)
  const schliessen = () => useUiStore.getState().setEinstellungenAustausch(null)
  const zeigeToast = useUiStore((s) => s.zeigeToast)
  const einspielen = austausch.art === 'einspielen'

  function umschalten(bereich: EinstellungsBereich) {
    setGewaehlt((bisher) =>
      bisher.includes(bereich) ? bisher.filter((b) => b !== bereich) : [...bisher, bereich],
    )
  }

  async function ausfuehren() {
    const bereiche = EINSTELLUNGS_BEREICHE.filter((b) => gewaehlt.includes(b))
    setLaeuft(true)
    try {
      if (austausch.art === 'einspielen') {
        const meldung = await spieleEinstellungenEin(austausch.sicherung, bereiche, {
          settingsStore,
          kabeltypStore,
          installationszonenStore,
          doc,
        })
        schliessen()
        zeigeToast(meldung)
      } else {
        const gespeichert = await sichereEinstellungen(
          bereiche,
          kabeltypStore,
          installationszonenStore,
        )
        if (gespeichert) {
          schliessen()
          zeigeToast(t('verwaltungsdialoge.einstellungenAustausch.gesichert'))
        }
      }
    } catch (fehler) {
      zeigeToast(
        fehler instanceof Error
          ? fehler.message
          : einspielen
            ? t('verwaltungsdialoge.einstellungenAustausch.einspielenFehlgeschlagen')
            : t('verwaltungsdialoge.einstellungenAustausch.sichernFehlgeschlagen'),
      )
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>
          {einspielen
            ? t('verwaltungsdialoge.einstellungenAustausch.titelEinspielen')
            : t('verwaltungsdialoge.einstellungenAustausch.titelSichern')}
        </h2>
        <p className="dialog-hinweis">
          {einspielen
            ? t('verwaltungsdialoge.einstellungenAustausch.hinweisEinspielen', {
                datei: austausch.dateiname,
                version: austausch.sicherung.programmVersion,
              })
            : t('verwaltungsdialoge.einstellungenAustausch.hinweisSichern')}
        </p>
        {EINSTELLUNGS_BEREICHE.map((bereich) => {
          const vorhanden = verfuegbar.includes(bereich)
          return (
            <label key={bereich} className="feld feld-checkbox">
              <input
                type="checkbox"
                checked={gewaehlt.includes(bereich)}
                disabled={!vorhanden || laeuft}
                onChange={() => umschalten(bereich)}
              />
              <span>
                <strong>{bereichName(bereich)}</strong>
                <br />
                <span className="dialog-hinweis">
                  {vorhanden
                    ? bereichHinweis(bereich)
                    : t('verwaltungsdialoge.einstellungenAustausch.nichtInDatei')}
                </span>
              </span>
            </label>
          )
        })}
        <div className="dialog-aktionen">
          <button type="button" onClick={schliessen} disabled={laeuft}>
            {t('verwaltungsdialoge.allgemein.abbrechen')}
          </button>
          <button
            type="button"
            className="primaer"
            disabled={gewaehlt.length === 0 || laeuft}
            onClick={() => void ausfuehren()}
          >
            {einspielen
              ? t('verwaltungsdialoge.einstellungenAustausch.uebernehmen')
              : t('verwaltungsdialoge.einstellungenAustausch.sichern')}
          </button>
        </div>
      </div>
    </div>
  )
}
