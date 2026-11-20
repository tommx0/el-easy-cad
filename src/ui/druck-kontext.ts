import type { CatalogComponent, LizenzModul, Zeichnung } from '../document-model'
import type { KomponentenRahmenBasis } from '../druck'
import { assetUrl } from '../persistence'
import type { CatalogStore } from '../persistence'
import { holeAbgangsTexte, holeKnxBeschriftungen } from '../rendering'
import { leitungsverlegungAusFuer } from './leitungsverlegung'
import { moduleAus } from './lizenz-module'
import { useUiStore } from './store/ui-store'
import { bauplanZeichnungen, verteilerplanZeichnungen, type Verknuepfung } from './verknuepfung'

export function druckKontextFuer(
  zeichnung: Zeichnung,
  teile: {
    katalogKomponenten: CatalogComponent[]
    catalogStore: CatalogStore
    verknuepfung: Verknuepfung
  },
): KomponentenRahmenBasis {
  const verknuepfteBauplaene = bauplanZeichnungen(teile.verknuepfung.getStand())
  return {
    katalogKomponenten: teile.katalogKomponenten,
    catalogStore: teile.catalogStore,
    assetQuelle: assetUrl,
    abgangsTexte: holeAbgangsTexte(zeichnung, verknuepfteBauplaene, teile.katalogKomponenten),
    knxBeschriftungen: holeKnxBeschriftungen(zeichnung, verknuepfteBauplaene),
    verknuepfteBauplaene,
    verknuepfteVerteilerplaene: verteilerplanZeichnungen(teile.verknuepfung.getStand()),
    leitungsverlegungAus: leitungsverlegungAusFuer(zeichnung),
  }
}

export function druckLizenz(): {
  demoAktiv: boolean
  lizenznehmer: string | null
  module: readonly LizenzModul[]
} {
  const status = useUiStore.getState().produktlizenzStatus
  return {
    demoAktiv: status?.betriebsmodus === 'demo',
    lizenznehmer: status?.status === 'gueltig' ? (status.lizenznehmer ?? null) : null,
    module: moduleAus(status),
  }
}
