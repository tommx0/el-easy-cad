import { useState } from 'react'
import { formatiereAblaufdatum } from './ablaufdatum'
import { useT } from './sprache-anbindung'
import { useAppContext } from './use-app-context'
import { useUiStore } from './store/ui-store'

export function ProduktlizenzSperre() {
  const t = useT()
  const status = useUiStore((s) => s.produktlizenzStatus)
  const { importiereProduktlizenzDatei } = useAppContext()
  const [wirdEingespielt, setWirdEingespielt] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  async function dateiAusgewaehlt(e: React.ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0]
    e.target.value = ''
    if (!datei) return

    setFehler(null)
    setWirdEingespielt(true)
    try {
      const text = await datei.text()
      let rohdaten: unknown
      try {
        rohdaten = JSON.parse(text)
      } catch {
        throw new Error(t('verwaltungsdialoge.produktlizenzSperre.keinJson'))
      }
      await importiereProduktlizenzDatei(rohdaten)
    } catch (fehlerObjekt) {
      setFehler(
        fehlerObjekt instanceof Error
          ? fehlerObjekt.message
          : t('verwaltungsdialoge.produktlizenzSperre.nichtEingespielt'),
      )
    } finally {
      setWirdEingespielt(false)
    }
  }

  const titel =
    status?.betriebsmodus === 'demo-abgelaufen'
      ? t('verwaltungsdialoge.produktlizenzSperre.titelTestAbgelaufen')
      : status?.status === 'abgelaufen'
        ? t('verwaltungsdialoge.produktlizenzSperre.titelAbgelaufen')
        : status?.status === 'ungueltig'
          ? t('verwaltungsdialoge.produktlizenzSperre.titelUngueltig')
          : t('verwaltungsdialoge.produktlizenzSperre.titelOhne')

  return (
    <div className="server-hinweis">
      <div className="server-hinweis-karte">
        <h1>{titel}</h1>
        {status?.lizenznehmer && (
          <p>
            {t('verwaltungsdialoge.produktlizenzSperre.zuletztFuer')}{' '}
            <strong>{status.lizenznehmer}</strong>
            {status.gueltigBis
              ? t('verwaltungsdialoge.produktlizenzSperre.gueltigBis', {
                  datum: formatiereAblaufdatum(status.gueltigBis),
                })
              : '.'}
          </p>
        )}
        <p>
          {status?.betriebsmodus === 'demo-abgelaufen'
            ? t('verwaltungsdialoge.produktlizenzSperre.testAbgelaufen')
            : null}{' '}
          {t('verwaltungsdialoge.produktlizenzSperre.gesperrt')}
        </p>
        <label className="produktlizenz-sperre-upload">
          <span>
            {wirdEingespielt
              ? t('verwaltungsdialoge.produktlizenzSperre.wirdGeprueft')
              : t('verwaltungsdialoge.produktlizenzSperre.dateiAuswaehlen')}
          </span>
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => void dateiAusgewaehlt(e)}
            disabled={wirdEingespielt}
          />
        </label>
        {fehler && <p className="produktlizenz-sperre-fehler">{fehler}</p>}
      </div>
    </div>
  )
}
