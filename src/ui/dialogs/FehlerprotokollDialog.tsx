import { useState } from 'react'
import { leseFehlerprotokoll, speichereDatei } from '../../persistence'
import { formatiereZahl } from '../../sprache/format'
import { useT } from '../sprache-anbindung'
import { useUiStore } from '../store/ui-store'

export function FehlerprotokollDialog() {
  const t = useT()
  const offen = useUiStore((s) => s.fehlerprotokollDialogOffen)
  const [warOffen, setWarOffen] = useState(false)
  const [laedt, setLaedt] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [groesseBytes, setGroesseBytes] = useState(0)

  async function laden() {
    setLaedt(true)
    setFehler(null)
    try {
      const inhalt = await leseFehlerprotokoll()
      setText(inhalt.text)
      setGroesseBytes(inhalt.groesseBytes)
    } catch {
      setFehler(t('verwaltungsdialoge.fehlerprotokoll.nichtGeladen'))
    } finally {
      setLaedt(false)
    }
  }

  if (offen && !warOffen) {
    setWarOffen(true)
    void laden()
  } else if (!offen && warOffen) {
    setWarOffen(false)
  }

  if (!offen) return null

  function schliessen() {
    useUiStore.getState().setFehlerprotokollDialogOffen(false)
  }

  async function herunterladen() {
    const blob = new Blob([text], { type: 'text/plain' })
    await speichereDatei(blob, 'fehlerprotokoll.txt', {
      beschreibung: t('verwaltungsdialoge.fehlerprotokoll.textdatei'),
      erweiterungen: ['txt'],
    })
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-fehlerprotokoll" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('verwaltungsdialoge.fehlerprotokoll.titel')}</h2>
        <p className="fehlerprotokoll-hinweis">{t('verwaltungsdialoge.fehlerprotokoll.hinweis')}</p>

        {fehler && <p className="produktlizenz-sperre-fehler">{fehler}</p>}
        {!fehler && (
          <>
            <p className="fehlerprotokoll-groesse">
              {laedt
                ? t('verwaltungsdialoge.fehlerprotokoll.wirdGeladen')
                : text
                  ? `${formatiereZahl(groesseBytes / 1024, { maximumFractionDigits: 0 })} KB`
                  : t('verwaltungsdialoge.fehlerprotokoll.keineEintraege')}
            </p>
            <pre className="fehlerprotokoll-inhalt">
              {text || t('verwaltungsdialoge.fehlerprotokoll.leer')}
            </pre>
          </>
        )}

        <div className="dialog-aktionen">
          <button type="button" onClick={() => void laden()} disabled={laedt}>
            {t('verwaltungsdialoge.fehlerprotokoll.aktualisieren')}
          </button>
          <button type="button" onClick={() => void herunterladen()} disabled={laedt || !text}>
            {t('verwaltungsdialoge.fehlerprotokoll.herunterladen')}
          </button>
          <button type="button" className="primaer" onClick={schliessen}>
            {t('verwaltungsdialoge.allgemein.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}
