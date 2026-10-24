import { useState, type ReactNode } from 'react'
import type { ProduktlizenzStatus } from '../../persistence'
import { t as tAktuell } from '../../sprache'
import { formatiereAblaufdatum } from '../ablaufdatum'
import { MODUL_NAME } from '../lizenz-module'
import { useT } from '../sprache-anbindung'
import { useUiStore } from '../store/ui-store'
import { useAppContext } from '../use-app-context'
import { lizenzStatusText } from '../community'
import { UnterstuetzenVerweise } from '../UnterstuetzenVerweise'
import { LizenztextKnopf } from './LizenztextDialog'

function restTageText(tage: number | null): string {
  if (tage === null) return ''
  if (tage < 0) return tAktuell('verwaltungsdialoge.meineLizenz.restAbgelaufen')
  if (tage === 0) return tAktuell('verwaltungsdialoge.meineLizenz.restHeute')
  return tAktuell('verwaltungsdialoge.meineLizenz.restTage', { n: tage })
}

function Zeile({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <>
      <dt>{titel}</dt>
      <dd>{children}</dd>
    </>
  )
}

function Angaben({ status }: { status: ProduktlizenzStatus }) {
  const d = status.details
  const t = useT()
  return (
    <dl className="lizenz-details">
      <Zeile titel={t('verwaltungsdialoge.meineLizenz.status')}>
        {lizenzStatusText(status, t)}
      </Zeile>
      {status.unterstuetzer && (
        <Zeile titel={t('community.lizenz.stufe')}>{status.unterstuetzer.stufe}</Zeile>
      )}
      {status.unterstuetzer && (
        <Zeile titel={t('community.lizenz.kommerzielleNutzung')}>
          {status.kommerziell ? t('community.lizenz.erlaubt') : t('community.lizenz.nichtErlaubt')}
        </Zeile>
      )}
      {d?.firma && (
        <Zeile titel={t('verwaltungsdialoge.meineLizenz.lizenziertFuer')}>{d.firma}</Zeile>
      )}
      {d?.gueltigAb && (
        <Zeile titel={t('verwaltungsdialoge.meineLizenz.gueltigAb')}>
          {formatiereAblaufdatum(d.gueltigAb)}
        </Zeile>
      )}
      {status.gueltigBis && (
        <Zeile titel={t('verwaltungsdialoge.meineLizenz.gueltigBis')}>
          {formatiereAblaufdatum(status.gueltigBis)}
          {restTageText(status.tageBisAblauf)}
        </Zeile>
      )}
      {status.betriebsmodus === 'lizenziert' && status.module && status.module.length > 0 && (
        <Zeile titel={t('verwaltungsdialoge.meineLizenz.zusatzmodule')}>
          {status.module.map((m) => MODUL_NAME[m]).join(', ')}
        </Zeile>
      )}
    </dl>
  )
}

function DateiAustausch() {
  const t = useT()
  const { importiereProduktlizenzDatei } = useAppContext()
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [erfolg, setErfolg] = useState(false)

  async function dateiAusgewaehlt(e: React.ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0]
    e.target.value = ''
    if (!datei) return
    setFehler(null)
    setErfolg(false)
    setLaeuft(true)
    try {
      await importiereProduktlizenzDatei(JSON.parse(await datei.text()) as unknown)
      setErfolg(true)
    } catch (fehlerObjekt) {
      setFehler(
        fehlerObjekt instanceof Error
          ? fehlerObjekt.message
          : t('verwaltungsdialoge.produktlizenzSperre.nichtEingespielt'),
      )
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <>
      <p className="dialog-hinweis">{t('verwaltungsdialoge.meineLizenz.hinweisAustausch')}</p>
      <label className="produktlizenz-sperre-upload">
        <span>
          {laeuft
            ? t('verwaltungsdialoge.meineLizenz.wirdGeprueft')
            : t('verwaltungsdialoge.meineLizenz.neueDatei')}
        </span>
        <input
          type="file"
          accept="application/json,.json"
          onChange={(e) => void dateiAusgewaehlt(e)}
          disabled={laeuft}
        />
      </label>
      {erfolg && <p className="dialog-hinweis">{t('verwaltungsdialoge.meineLizenz.neueAktiv')}</p>}
      {fehler && <p className="produktlizenz-sperre-fehler">{fehler}</p>}
    </>
  )
}

export function MeineLizenzDialog() {
  const t = useT()
  const offen = useUiStore((s) => s.meineLizenzDialogOffen)
  const status = useUiStore((s) => s.produktlizenzStatus)
  const schliessen = () => useUiStore.getState().setMeineLizenzDialogOffen(false)
  if (!offen) return null

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-datenschutz" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('verwaltungsdialoge.meineLizenz.titel')}</h2>
        {status ? (
          <Angaben status={status} />
        ) : (
          <p className="dialog-hinweis">{t('verwaltungsdialoge.meineLizenz.wirdGeprueft')}</p>
        )}

        <UnterstuetzenVerweise />

        <h3>{t('verwaltungsdialoge.meineLizenz.austauschen')}</h3>
        <DateiAustausch />

        <div className="dialog-aktionen">
          <LizenztextKnopf />
          <button type="button" onClick={schliessen}>
            {t('verwaltungsdialoge.allgemein.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}
