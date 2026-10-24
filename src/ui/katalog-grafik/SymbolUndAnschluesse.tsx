import { useMemo } from 'react'
import type {
  DockpunkteKonfiguration,
  Fangpunkt,
  KatalogBild,
  KatalogTextElement,
} from '../../document-model'
import type { CatalogStore } from '../../persistence'
import { useKatalogBildUrl } from '../use-katalog-bild-url'
import { DockpunkteFormular } from './DockpunkteFormular'
import { FangpunktFormular } from './FangpunktFormular'
import { TextElementeFormular } from './TextElementeFormular'
import { useT } from '../sprache-anbindung'

interface Props {
  vorschauAssetId: string | null
  catalogStore: CatalogStore
  breitenFaktor: number | undefined
  hoehenFaktor?: number
  dockpunkte: DockpunkteKonfiguration | undefined
  fangpunkt: Fangpunkt | undefined
  textElemente: KatalogTextElement[]
  onDockpunkte: (dockpunkte: DockpunkteKonfiguration | undefined) => void
  onFangpunkt: (fangpunkt: Fangpunkt | undefined) => void
  onTextElemente: (textElemente: KatalogTextElement[]) => void
}

export function SymbolUndAnschluesse({
  vorschauAssetId,
  catalogStore,
  breitenFaktor,
  hoehenFaktor,
  dockpunkte,
  fangpunkt,
  textElemente,
  onDockpunkte,
  onFangpunkt,
  onTextElemente,
}: Props) {
  const t = useT()
  const bild = useMemo<KatalogBild | undefined>(
    () => (vorschauAssetId ? { typ: 'asset', assetId: vorschauAssetId } : undefined),
    [vorschauAssetId],
  )
  const bildUrl = useKatalogBildUrl(bild, catalogStore) ?? undefined

  if (!vorschauAssetId) {
    return <p className="dialog-hinweis">{t('katalogdialoge.symbolUndAnschluesse.ohneGrafik')}</p>
  }

  return (
    <div className="katalog-grafik">
      <DockpunkteFormular
        dockpunkte={dockpunkte}
        bildUrl={bildUrl}
        breitenFaktor={breitenFaktor}
        hoehenFaktor={hoehenFaktor}
        onChange={onDockpunkte}
      />
      <FangpunktFormular
        fangpunkt={fangpunkt}
        dockpunkte={dockpunkte}
        bildUrl={bildUrl}
        breitenFaktor={breitenFaktor}
        hoehenFaktor={hoehenFaktor}
        onChange={onFangpunkt}
      />
      <TextElementeFormular
        textElemente={textElemente}
        bildUrl={bildUrl}
        breitenFaktor={breitenFaktor}
        hoehenFaktor={hoehenFaktor}
        onChange={onTextElemente}
      />
    </div>
  )
}
