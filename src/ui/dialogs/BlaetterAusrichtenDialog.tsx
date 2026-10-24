import { useState } from 'react'
import type { AusrichtungsStand, Blatt } from '../../document-model'
import {
  ausrichtungsStand,
  nurAnsichtGrund,
  richteBlattAus,
  zeichenflaecheBoundingBox,
} from '../../document-model'
import { weltBoundingBoxInhalt } from '../../druck'
import { CompositeCommand, erzeugeBlattAendernCommand } from '../../tools'
import { useFreigeschalteteModule } from '../lizenz-module'
import { useUiStore } from '../store/ui-store'
import { useAppContext, useProject } from '../use-app-context'
import type { Schluessel } from '../../sprache'
import { useT } from '../sprache-anbindung'

const HINWEIS: Record<Exclude<AusrichtungsStand, 'bereit'>, Schluessel> = {
  'ohne-nullpunkt': 'zeichendialoge.blaetterAusrichten.ohneNullpunkt',
  'ohne-richtung': 'zeichendialoge.blaetterAusrichten.ohneRichtung',
  ausgerichtet: 'zeichendialoge.blaetterAusrichten.schonAusgerichtet',
}

export function BlaetterAusrichtenDialog() {
  const offen = useUiStore((s) => s.blaetterAusrichtenOffen)
  if (!offen) return null
  return <Inhalt />
}

function Inhalt() {
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()
  const module = useFreigeschalteteModule()
  const t = useT()
  const schliessen = () => useUiStore.getState().setBlaetterAusrichtenOffen(false)

  const zeilen = zeichnung.blaetter.map((blatt) => {
    const sperre = nurAnsichtGrund(blatt, module)
    const stand = ausrichtungsStand(blatt)
    return {
      blatt,
      bereit: !sperre && stand === 'bereit',
      hinweis: sperre
        ? t('zeichendialoge.blaetterAusrichten.nurAnsehen')
        : stand === 'bereit'
          ? null
          : t(HINWEIS[stand]),
    }
  })
  const [gewaehlt, setGewaehlt] = useState(
    () => new Set(zeilen.filter((z) => z.bereit).map((z) => z.blatt.id)),
  )
  const auszurichten = zeilen.filter((z) => z.bereit && gewaehlt.has(z.blatt.id))

  function ausrichten() {
    if (auszurichten.length === 0) return
    const label = t('zeichendialoge.blaetterAusrichten.titel')
    const neu = auszurichten.map(({ blatt }) => richteBlattAus(blatt))
    commands.execute(
      new CompositeCommand(
        label,
        neu.map((b) =>
          erzeugeBlattAendernCommand(doc, b.id, label, {
            ursprung: b.ursprung,
            hintergrundDrehung: b.hintergrundDrehung,
            nullpunkt: b.nullpunkt,
            nullpunktRichtung: b.nullpunktRichtung,
            zeichenflaeche: b.zeichenflaeche,
            objekte: b.objekte,
          }),
        ),
      ),
    )
    schliessen()
    window.dispatchEvent(new CustomEvent('eleasycad:zoom-alles'))
    const ragen = neu
      .filter(ragtUeberZeichenflaeche)
      .map((b) => t('zeichendialoge.gemeinsam.inAnfuehrung', { text: b.name }))
    const meldung = t('zeichendialoge.blaetterAusrichten.ausgerichtet', { n: neu.length })
    useUiStore
      .getState()
      .zeigeToast(
        ragen.length > 0
          ? `${meldung} ${t('zeichendialoge.blaetterAusrichten.ragtUeber', { blaetter: ragen.join(', ') })}`
          : meldung,
      )
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div
        className="dialog"
        role="dialog"
        aria-label={t('zeichendialoge.blaetterAusrichten.titel')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2>{t('zeichendialoge.blaetterAusrichten.titel')}</h2>
        <p className="dialog-hinweis">{t('zeichendialoge.blaetterAusrichten.erklaerung')}</p>
        <ul className="dialog-liste blaetter-ausrichten-liste">
          {zeilen.map(({ blatt, bereit, hinweis }) => (
            <li key={blatt.id}>
              <label className={bereit ? undefined : 'deaktiviert'}>
                <input
                  type="checkbox"
                  disabled={!bereit}
                  checked={bereit && gewaehlt.has(blatt.id)}
                  onChange={(e) =>
                    setGewaehlt((bisher) => {
                      const neu = new Set(bisher)
                      if (e.target.checked) neu.add(blatt.id)
                      else neu.delete(blatt.id)
                      return neu
                    })
                  }
                />
                <span>{blatt.name}</span>
                {hinweis && <span className="feld-info"> – {hinweis}</span>}
              </label>
            </li>
          ))}
        </ul>
        <div className="dialog-aktionen">
          <button type="button" onClick={schliessen}>
            {t('zeichendialoge.gemeinsam.abbrechen')}
          </button>
          <button
            type="button"
            className="primaer"
            disabled={auszurichten.length === 0}
            onClick={ausrichten}
          >
            {t('zeichendialoge.blaetterAusrichten.ausrichten')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ragtUeberZeichenflaeche(blatt: Blatt): boolean {
  if (!blatt.zeichenflaeche) return false
  const inhalt = weltBoundingBoxInhalt(blatt)
  if (!inhalt) return false
  const flaeche = zeichenflaecheBoundingBox(blatt.zeichenflaeche)
  const toleranz = 1e-6
  return (
    inhalt.min.x < flaeche.min.x - toleranz ||
    inhalt.min.y < flaeche.min.y - toleranz ||
    inhalt.max.x > flaeche.max.x + toleranz ||
    inhalt.max.y > flaeche.max.y + toleranz
  )
}
