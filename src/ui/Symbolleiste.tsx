import { Fragment } from 'react'
import { useBefehle } from './befehle/use-befehle'
import { BEFEHL_NACH_ID, befehlName } from './befehle/katalog'
import { anzeige } from './befehle/kuerzel'
import { BefehlIcon } from './befehle/BefehlIcon'
import { IconAnpassen } from './components/Icons'
import { useSettingsStore } from './store/settings-store'
import { useUiStore } from './store/ui-store'
import { gruppiereSymbolleiste } from './symbolleiste-reihenfolge'
import { SymbolleisteGruppenKnopf } from './SymbolleisteGruppenKnopf'
import { useT } from './sprache-anbindung'

export function Symbolleiste() {
  const t = useT()
  const ids = useSettingsStore((s) => s.symbolleiste)
  const belegung = useSettingsStore((s) => s.belegung)
  const gruppen = useSettingsStore((s) => s.symbolleisteGruppen)
  const befehle = useBefehle()
  const gruppeNachId = new Map(gruppen.map((gruppe) => [gruppe.id, gruppe]))

  return (
    <div className="symbolleiste" role="toolbar" aria-label={t('symbolleiste.aria')}>
      {gruppiereSymbolleiste(ids).map((bereichsgruppe, index) => (
        <Fragment key={bereichsgruppe[0]}>
          {index > 0 && <span className="symbolleiste-trenner" aria-hidden="true" />}
          {bereichsgruppe.map((id) => {
            const eigeneGruppe = gruppeNachId.get(id)
            if (eigeneGruppe) {
              return <SymbolleisteGruppenKnopf key={id} gruppe={eigeneGruppe} befehle={befehle} />
            }
            const eintrag = BEFEHL_NACH_ID[id]
            const aktion = befehle[id]
            if (!eintrag || !aktion) return null
            const kuerzel = eintrag.festeAnzeige ?? (belegung[id] ? anzeige(belegung[id]) : null)
            const titel = befehlName(eintrag.id) + (kuerzel ? ` (${kuerzel})` : '')
            return (
              <button
                key={id}
                type="button"
                className={`symbolleiste-knopf${aktion.haken ? ' aktiv' : ''}`}
                title={titel}
                data-befehl={id}
                aria-pressed={aktion.haken}
                disabled={aktion.deaktiviert}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => aktion.ausfuehren()}
              >
                <BefehlIcon id={id} />
              </button>
            )
          })}
        </Fragment>
      ))}
      <button
        type="button"
        className="symbolleiste-knopf symbolleiste-anpassen"
        title={t('symbolleiste.anpassen')}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => useUiStore.getState().setEinstellungenOffen(true, 'symbolleiste')}
      >
        <IconAnpassen />
      </button>
    </div>
  )
}
