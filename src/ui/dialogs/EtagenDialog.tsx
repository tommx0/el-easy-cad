import { useState } from 'react'
import type { EtagenZeile, Zeichnung } from '../../document-model'
import {
  aendereGeschoss,
  deckenstaerkeMitQuelle,
  fuehreKotenMit,
  hoeheUeberDarunter,
  setzeHoeheUeberDarunter,
} from '../../document-model'
import { CompositeCommand, erzeugeBlattAendernCommand } from '../../tools'
import { useUiStore } from '../store/ui-store'
import { useAppContext, useProject } from '../use-app-context'
import { ZahlenFeldOptional } from '../ZahlenFeld'
import { useT } from '../sprache-anbindung'

export function EtagenDialog() {
  const offen = useUiStore((s) => s.etagenDialogOffen)
  if (!offen) return null
  return <Inhalt />
}

function Inhalt() {
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()
  const t = useT()
  const schliessen = () => useUiStore.getState().setEtagenDialogOffen(false)
  const [zeilen, setZeilen] = useState<EtagenZeile[]>(() =>
    zeichnung.blaetter.map((b) => ({
      blattId: b.id,
      kote: b.geschoss?.kote,
      raumhoehe: b.geschoss?.raumhoehe,
      deckenstaerke: b.geschoss?.deckenstaerke,
    })),
  )
  const [mitfuehren, setMitfuehren] = useState(true)

  function mitZeilen(liste: readonly EtagenZeile[]): Zeichnung {
    return {
      ...zeichnung,
      blaetter: zeichnung.blaetter.map((b, i) => ({
        ...b,
        geschoss: aendereGeschoss(b.geschoss, {
          kote: liste[i].kote,
          raumhoehe: liste[i].raumhoehe,
          deckenstaerke: liste[i].deckenstaerke,
        }),
      })),
    }
  }
  const vorschau = mitZeilen(zeilen)
  function deckeOhneFeld(index: number) {
    const ohne = zeilen.map((z, i) => (i === index ? { ...z, deckenstaerke: undefined } : z))
    const z = mitZeilen(ohne)
    return deckenstaerkeMitQuelle(z, z.blaetter[index])
  }

  function aendere(index: number, patch: Partial<EtagenZeile>) {
    const alt = zeilen[index]
    const vorher = deckenstaerkeMitQuelle(vorschau, vorschau.blaetter[index]).meter
    let delta = 0
    if ('raumhoehe' in patch && alt.raumhoehe !== undefined && patch.raumhoehe !== undefined)
      delta = patch.raumhoehe - alt.raumhoehe
    if ('deckenstaerke' in patch && patch.deckenstaerke !== undefined)
      delta = patch.deckenstaerke - vorher
    const neu = zeilen.map((z, i) => (i === index ? { ...z, ...patch } : z))
    setZeilen(mitfuehren && alt.kote !== undefined ? fuehreKotenMit(neu, index, delta) : neu)
  }

  function aendereRelativ(index: number, meter: number | null) {
    if (meter === null) return
    setZeilen(setzeHoeheUeberDarunter(zeilen, index, meter, mitfuehren))
  }

  const geaendert = zeichnung.blaetter.filter((b, i) => {
    const g = b.geschoss
    const z = zeilen[i]
    return (
      g?.kote !== z.kote || g?.raumhoehe !== z.raumhoehe || g?.deckenstaerke !== z.deckenstaerke
    )
  })

  function uebernehmen() {
    if (geaendert.length === 0) return schliessen()
    const label = t('zeichendialoge.etagen.aendern')
    commands.execute(
      new CompositeCommand(
        label,
        geaendert.map((b) => {
          const z = zeilen[zeichnung.blaetter.indexOf(b)]
          return erzeugeBlattAendernCommand(doc, b.id, label, {
            geschoss: aendereGeschoss(b.geschoss, {
              kote: z.kote,
              raumhoehe: z.raumhoehe,
              deckenstaerke: z.deckenstaerke,
            }),
          })
        }),
      ),
    )
    schliessen()
  }

  const relativ = (index: number) => hoeheUeberDarunter(zeilen, index)
  const reihenfolge = zeichnung.blaetter.map((_, i) => i).reverse()
  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div
        className="dialog dialog-breit"
        role="dialog"
        aria-label={t('zeichendialoge.etagen.titel')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2>{t('zeichendialoge.etagen.titel')}</h2>
        <p className="dialog-hinweis">{t('zeichendialoge.etagen.hinweis')}</p>
        <table className="etagen-tabelle">
          <thead>
            <tr>
              <th>{t('zeichendialoge.etagen.spalteBlatt')}</th>
              <th>{t('zeichendialoge.etagen.spalteKote')}</th>
              <th>{t('zeichendialoge.etagen.spalteLichteHoehe')}</th>
              <th>{t('zeichendialoge.etagen.spalteDecke')}</th>
              <th>{t('zeichendialoge.etagen.spalteUeberDarunter')}</th>
            </tr>
          </thead>
          <tbody>
            {reihenfolge.map((i) => {
              const blatt = zeichnung.blaetter[i]
              const z = zeilen[i]
              const ohneFeld = deckeOhneFeld(i)
              const ohneFeldCm = Math.round(ohneFeld.meter * 100)
              return (
                <tr key={blatt.id} className={blatt.id === zeichnung.aktivesBlattId ? 'aktiv' : ''}>
                  <td>{blatt.name}</td>
                  <td>
                    <ZahlenFeldOptional
                      step={0.05}
                      value={z.kote}
                      placeholder="–"
                      ariaLabel={t('zeichendialoge.etagen.ariaKote', { name: blatt.name })}
                      onCommit={(wert) => aendere(i, { kote: wert ?? undefined })}
                    />
                  </td>
                  <td>
                    <ZahlenFeldOptional
                      min={0.5}
                      step={0.05}
                      value={z.raumhoehe}
                      placeholder="–"
                      ariaLabel={t('zeichendialoge.etagen.ariaLichteHoehe', { name: blatt.name })}
                      onCommit={(wert) => aendere(i, { raumhoehe: wert ?? undefined })}
                    />
                  </td>
                  <td>
                    <ZahlenFeldOptional
                      min={1}
                      step={1}
                      value={
                        z.deckenstaerke !== undefined
                          ? Math.round(z.deckenstaerke * 100)
                          : undefined
                      }
                      placeholder={
                        ohneFeld.quelle === 'koten'
                          ? t('zeichendialoge.etagen.ausKoten', { cm: ohneFeldCm })
                          : t('zeichendialoge.etagen.annahme', { cm: ohneFeldCm })
                      }
                      ariaLabel={t('zeichendialoge.etagen.ariaDecke', { name: blatt.name })}
                      onCommit={(cm) =>
                        aendere(i, {
                          deckenstaerke: cm !== null && cm > 0 ? cm / 100 : undefined,
                        })
                      }
                    />
                  </td>
                  <td>
                    {relativ(i) ? (
                      <ZahlenFeldOptional
                        min={0.5}
                        step={0.05}
                        value={relativ(i)!.meter}
                        ariaLabel={t('zeichendialoge.etagen.ariaUeberDarunter', {
                          name: blatt.name,
                        })}
                        onCommit={(wert) => aendereRelativ(i, wert)}
                      />
                    ) : (
                      '–'
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <label className="feld-checkbox">
          <input
            type="checkbox"
            checked={mitfuehren}
            onChange={(e) => setMitfuehren(e.target.checked)}
          />
          {t('zeichendialoge.etagen.mitfuehren')}
        </label>
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
