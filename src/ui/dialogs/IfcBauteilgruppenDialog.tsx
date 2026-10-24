import { useState } from 'react'
import type { IfcBauteilGruppe } from '../../document-model'
import { IFC_BAUTEILGRUPPEN, zaehleIfcGruppen } from '../../document-model'
import { erzeugeBlattAendernCommand } from '../../tools'
import { useAktivesBlatt, useAppContext } from '../use-app-context'
import { useUiStore } from '../store/ui-store'
import { useT } from '../sprache-anbindung'
import { befehlName } from '../befehle/katalog'

export function IfcBauteilgruppenDialog() {
  const offen = useUiStore((s) => s.ifcBauteilgruppenDialogOffen)
  const { doc, commands } = useAppContext()
  const blatt = useAktivesBlatt()
  const t = useT()
  const h = blatt.hintergrund?.typ === 'ifc' ? blatt.hintergrund : null

  const [ausgeblendet, setAusgeblendet] = useState<Set<IfcBauteilGruppe>>(new Set())
  const [vorherOffen, setVorherOffen] = useState(offen)
  if (offen !== vorherOffen) {
    setVorherOffen(offen)
    if (offen) setAusgeblendet(new Set(h?.ausgeblendeteGruppen ?? []))
  }

  if (!offen) return null
  const schliessen = () => useUiStore.getState().setIfcBauteilgruppenDialogOffen(false)
  const anzahl = zaehleIfcGruppen(h?.bauteile ?? [])
  const gruppen = IFC_BAUTEILGRUPPEN.filter((g) => (anzahl.get(g.id) ?? 0) > 0)

  function umschalten(gruppe: IfcBauteilGruppe) {
    setAusgeblendet((bisher) => {
      const neu = new Set(bisher)
      if (neu.has(gruppe)) neu.delete(gruppe)
      else neu.add(gruppe)
      return neu
    })
  }

  function uebernehmen() {
    if (!h) return
    const liste = IFC_BAUTEILGRUPPEN.map((g) => g.id).filter((g) => ausgeblendet.has(g))
    const bisher = h.ausgeblendeteGruppen ?? []
    if (liste.length !== bisher.length || liste.some((g, i) => g !== bisher[i])) {
      const { ausgeblendeteGruppen: _, ...ohne } = h
      commands.execute(
        erzeugeBlattAendernCommand(doc, blatt.id, t('zeichendialoge.ifcBauteilgruppen.titel'), {
          hintergrund: liste.length > 0 ? { ...ohne, ausgeblendeteGruppen: liste } : ohne,
        }),
      )
    }
    schliessen()
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('zeichendialoge.ifcBauteilgruppen.titel')}</h2>
        {!h ? (
          <p className="dialog-hinweis">{t('zeichendialoge.ifcBauteilgruppen.keinIfc')}</p>
        ) : gruppen.length === 0 ? (
          <p className="dialog-hinweis">
            {t('zeichendialoge.ifcBauteilgruppen.ohneGruppen', {
              befehl: befehlName('ifc-nachladen', t),
            })}
          </p>
        ) : (
          <>
            <p className="dialog-hinweis">
              {t('zeichendialoge.ifcBauteilgruppen.gilt', { name: blatt.name })}
            </p>
            <div className="ifc-gruppen">
              {gruppen.map((g) => (
                <label key={g.id} className="dialog-feld-checkbox ifc-gruppe">
                  <input
                    type="checkbox"
                    checked={!ausgeblendet.has(g.id)}
                    onChange={() => umschalten(g.id)}
                  />
                  {g.name} – {anzahl.get(g.id)}
                </label>
              ))}
            </div>
          </>
        )}
        <div className="dialog-aktionen">
          <button type="button" onClick={schliessen}>
            {t('zeichendialoge.gemeinsam.abbrechen')}
          </button>
          <button type="button" className="primaer" onClick={uebernehmen} disabled={!h}>
            {t('zeichendialoge.gemeinsam.uebernehmen')}
          </button>
        </div>
      </div>
    </div>
  )
}
