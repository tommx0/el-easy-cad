import { useSyncExternalStore } from 'react'
import { assetUrl } from '../persistence'
import { useT } from './sprache-anbindung'
import { useAppContext } from './use-app-context'

export function PdfAnsicht() {
  const t = useT()
  const { sitzung } = useAppContext()
  const assetId = useSyncExternalStore(sitzung.subscribe, () => sitzung.getPdfAssetId())
  const name =
    useSyncExternalStore(sitzung.subscribe, () => sitzung.getOffenesDokument()?.name) ??
    t('verwaltungsdialoge.pdfAnsicht.pdfAnlage')

  if (!assetId) {
    return (
      <main
        className="pdf-ansicht pdf-ansicht-leer"
        aria-label={t('verwaltungsdialoge.pdfAnsicht.pdfAnlage')}
      >
        <p>{t('verwaltungsdialoge.pdfAnsicht.keineDatei')}</p>
      </main>
    )
  }

  return (
    <main className="pdf-ansicht" aria-label={t('verwaltungsdialoge.pdfAnsicht.pdfAnlage')}>
      <iframe className="pdf-rahmen" src={assetUrl(assetId)} title={name} />
    </main>
  )
}
