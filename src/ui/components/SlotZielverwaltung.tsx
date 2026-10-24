import type {
  CatalogComponent,
  Geraetegruppe,
  KomponenteInZeichnung,
  KomponentenTyp,
  Slot,
  SlotZiel,
  Zeichnung,
} from '../../document-model'
import {
  ermittleZielTyp,
  istUeblicheTypKombination,
  typBezeichnung,
  zielBezeichnung,
} from '../../document-model'
import { ZielAuswahl } from './ZielAuswahl'
import { useT } from '../sprache-anbindung'

export function SlotZielverwaltung({
  slot,
  quelleTyp,
  onZielHinzufuegen,
  onZielEntfernen,
  zeichnung,
  katalogKomponenten,
  alleKomponenten,
  alleGruppen,
}: {
  slot: Slot
  quelleTyp: KomponentenTyp
  onZielHinzufuegen: (ziel: SlotZiel) => void
  onZielEntfernen: (index: number) => void
  zeichnung: Zeichnung
  katalogKomponenten: readonly CatalogComponent[]
  alleKomponenten: KomponenteInZeichnung[]
  alleGruppen: Geraetegruppe[]
}) {
  const t = useT()
  return (
    <>
      {slot.ziele.length > 0 && (
        <ul className="slot-ziele">
          {slot.ziele.map((ziel, index) => {
            const zielTyp = ermittleZielTyp(ziel, zeichnung)
            const unueblich = zielTyp !== null && !istUeblicheTypKombination(quelleTyp, zielTyp)
            return (
              <li key={index} className="slot-ziel">
                <span>
                  {unueblich && (
                    <span
                      className="slot-ziel-warnung"
                      title={t('eigenschaften.slotZiele.unueblich', {
                        quelle: typBezeichnung(quelleTyp),
                        ziel: typBezeichnung(zielTyp),
                      })}
                    >
                      ⚠️{' '}
                    </span>
                  )}
                  {zielBezeichnung(ziel, zeichnung, katalogKomponenten)}
                </span>
                <button
                  type="button"
                  className="slot-ziel-entfernen"
                  onClick={() => onZielEntfernen(index)}
                  title={t('eigenschaften.slotZiele.entfernen')}
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {slot.ziele.length > 1 && (
        <p className="slot-hinweis">{t('eigenschaften.slotZiele.mehrereZiele')}</p>
      )}
      <ZielAuswahl komponenten={alleKomponenten} gruppen={alleGruppen} onWahl={onZielHinzufuegen} />
    </>
  )
}
