import { useState } from 'react'
import type { Ausrichtung, Papierformat } from '../../document-model'
import {
  MASSSTAB_LISTE,
  PAPIERFORMATE,
  SCHALTPLAN_MASSSTAB_NENNER,
  berechneHintergrundEinpassung,
  hintergrundDrehungVon,
  istBekannterHintergrund,
  istSchaltplan,
} from '../../document-model'
import { schlageMassstabNennerVor, vorschlagZeichenflaecheUrsprung } from '../../druck'
import { erzeugeBlattAendernCommand } from '../../tools'
import { useAppContext, useAktivesBlatt, useProject } from '../use-app-context'
import { useUiStore } from '../store/ui-store'
import { ZahlenFeld } from '../ZahlenFeld'
import { useT } from '../sprache-anbindung'

export function ZeichenflaecheEinrichtenDialog() {
  const offen = useUiStore((s) => s.zeichenflaecheEinrichtenOffen)
  const hintergrundEinpassen = useUiStore((s) => s.zeichenflaecheEinrichtenHintergrundEinpassen)
  const schliessen = () => useUiStore.getState().setZeichenflaecheEinrichtenOffen(false)
  const zeigeToast = useUiStore((s) => s.zeigeToast)
  const { doc, commands } = useAppContext()
  const blatt = useAktivesBlatt()
  const schaltplan = istSchaltplan(useProject())
  const t = useT()

  const [papierformat, setPapierformat] = useState<Papierformat>('A4')
  const [ausrichtung, setAusrichtung] = useState<Ausrichtung>('hoch')
  const [massstabModus, setMassstabModus] = useState<'liste' | 'frei'>('liste')
  const [massstabListeWert, setMassstabListeWert] = useState<number>(100)
  const [massstabFreiWert, setMassstabFreiWert] = useState<number>(100)

  const [warOffen, setWarOffen] = useState(false)
  if (offen !== warOffen) {
    setWarOffen(offen)
    if (offen && blatt) {
      const z = blatt.zeichenflaeche
      setPapierformat(z?.papierformat ?? 'A4')
      setAusrichtung(z?.ausrichtung ?? 'hoch')
      const nenner = z?.massstabNenner ?? 100
      setMassstabModus((MASSSTAB_LISTE as readonly number[]).includes(nenner) ? 'liste' : 'frei')
      setMassstabListeWert((MASSSTAB_LISTE as readonly number[]).includes(nenner) ? nenner : 100)
      setMassstabFreiWert(nenner)
    }
  }

  if (!offen || !blatt) return null

  if (schaltplan) {
    return (
      <div className="dialog-overlay" onMouseDown={schliessen}>
        <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
          <h2>{t('zeichendialoge.zeichenflaeche.schaltplanTitel')}</h2>
          <p className="dialog-hinweis">
            {t('zeichendialoge.zeichenflaeche.schaltplanHinweis', {
              nenner: String(SCHALTPLAN_MASSSTAB_NENNER),
            })}
          </p>
          <div className="dialog-aktionen">
            <button type="button" className="primaer" onClick={schliessen}>
              {t('zeichendialoge.gemeinsam.schliessen')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const massstabNenner = massstabModus === 'liste' ? massstabListeWert : massstabFreiWert

  function vorschlagUebernehmen() {
    const vorschlag = schlageMassstabNennerVor(blatt!, papierformat, ausrichtung)
    if (vorschlag === null) {
      zeigeToast(t('zeichendialoge.zeichenflaeche.keinInhalt'))
      return
    }
    setMassstabModus('frei')
    setMassstabFreiWert(vorschlag)
  }

  function uebernehmen() {
    const entwurf = { papierformat, ausrichtung, massstabNenner }
    const ursprung = hintergrundEinpassen
      ? { x: 0, y: 0 }
      : (blatt!.zeichenflaeche?.ursprung ?? vorschlagZeichenflaecheUrsprung(blatt!, entwurf))
    const zeichenflaeche = { ...entwurf, ursprung }
    const hintergrund = blatt!.hintergrund
    if (hintergrundEinpassen && istBekannterHintergrund(hintergrund)) {
      const platzierung = berechneHintergrundEinpassung(
        hintergrund,
        zeichenflaeche,
        hintergrundDrehungVon(blatt!),
      )
      commands.execute(
        erzeugeBlattAendernCommand(doc, blatt!.id, t('zeichendialoge.zeichenflaeche.titel'), {
          zeichenflaeche,
          massstab: platzierung.massstab,
          ursprung: platzierung.ursprung,
          nullpunkt: zeichenflaeche.ursprung,
        }),
      )
    } else {
      commands.execute(
        erzeugeBlattAendernCommand(doc, blatt!.id, t('zeichendialoge.zeichenflaeche.titel'), {
          zeichenflaeche,
          nullpunkt: zeichenflaeche.ursprung,
        }),
      )
    }
    schliessen()
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('zeichendialoge.zeichenflaeche.titel')}</h2>
        <p className="dialog-hinweis">
          {t('zeichendialoge.zeichenflaeche.hinweis', { name: blatt.name })}
        </p>
        {hintergrundEinpassen && (
          <p className="dialog-hinweis">{t('zeichendialoge.zeichenflaeche.einpassenHinweis')}</p>
        )}

        <h3>{t('zeichendialoge.zeichenflaeche.papierformat')}</h3>
        <div className="druck-radiogruppe">
          <select
            value={papierformat}
            onChange={(e) => setPapierformat(e.target.value as Papierformat)}
          >
            {PAPIERFORMATE.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <label>
            <input
              type="radio"
              name="zeichenflaeche-ausrichtung"
              checked={ausrichtung === 'hoch'}
              onChange={() => setAusrichtung('hoch')}
            />
            {t('zeichendialoge.zeichenflaeche.hochformat')}
          </label>
          <label>
            <input
              type="radio"
              name="zeichenflaeche-ausrichtung"
              checked={ausrichtung === 'quer'}
              onChange={() => setAusrichtung('quer')}
            />
            {t('zeichendialoge.zeichenflaeche.querformat')}
          </label>
        </div>

        <h3>{t('zeichendialoge.zeichenflaeche.massstab')}</h3>
        <div className="druck-radiogruppe druck-radiogruppe-massstab">
          <label>
            <input
              type="radio"
              name="zeichenflaeche-massstab-modus"
              checked={massstabModus === 'liste'}
              onChange={() => setMassstabModus('liste')}
            />
            <select
              value={massstabListeWert}
              disabled={massstabModus !== 'liste'}
              onChange={(e) => {
                setMassstabModus('liste')
                setMassstabListeWert(Number(e.target.value))
              }}
            >
              {MASSSTAB_LISTE.map((n) => (
                <option key={n} value={n}>
                  1:{n}
                </option>
              ))}
            </select>
          </label>
          <label>
            <input
              type="radio"
              name="zeichenflaeche-massstab-modus"
              checked={massstabModus === 'frei'}
              onChange={() => setMassstabModus('frei')}
            />
            1:
            <ZahlenFeld
              min={1}
              step={1}
              className="druck-massstab-frei-eingabe"
              disabled={massstabModus !== 'frei'}
              value={massstabFreiWert}
              onCommit={(wert) => {
                setMassstabModus('frei')
                setMassstabFreiWert(wert)
              }}
            />
          </label>
        </div>
        <button type="button" onClick={vorschlagUebernehmen}>
          {t('zeichendialoge.zeichenflaeche.einpassen')}
        </button>

        <div className="dialog-aktionen">
          <button type="button" onClick={schliessen}>
            {t('zeichendialoge.gemeinsam.abbrechen')}
          </button>
          <button type="button" className="primaer" onClick={uebernehmen}>
            {t('zeichendialoge.gemeinsam.uebernehmen')}
          </button>
        </div>
      </div>
    </div>
  )
}
