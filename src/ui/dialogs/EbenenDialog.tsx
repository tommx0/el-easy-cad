import { useState } from 'react'
import type { Ebene } from '../../document-model'
import { ersatzEbeneFuer, erzeugeEbene } from '../../document-model'
import {
  erzeugeBlattAendernCommand,
  erzeugeEbeneLoeschenCommand,
  erzeugeEbenenAendernCommand,
  objekteAufEbene,
} from '../../tools'
import { useAppContext, useAktivesBlatt } from '../use-app-context'
import { useUiStore } from '../store/ui-store'
import { IconSchlossOffen, IconSchlossZu } from '../components/Icons'
import { useT } from '../sprache-anbindung'

export function EbenenDialog() {
  const offen = useUiStore((s) => s.ebenenDialogOffen)
  const schliessen = () => useUiStore.getState().setEbenenDialogOffen(false)
  const { doc, commands } = useAppContext()
  const blatt = useAktivesBlatt()
  const [neuerName, setNeuerName] = useState('')
  const t = useT()

  if (!offen) return null

  function aendereEbenen(ebenen: Ebene[], label: string) {
    commands.execute(erzeugeEbenenAendernCommand(doc, label, ebenen))
  }

  function toggleSichtbar(ebene: Ebene) {
    if (ebene.istHintergrundLayer) {
      commands.execute(
        erzeugeBlattAendernCommand(
          doc,
          blatt.id,
          t('zeichendialoge.ebenen.hintergrundSichtbarkeit'),
          {
            hintergrundSichtbar: !blatt.hintergrundSichtbar,
          },
        ),
      )
      return
    }
    aendereEbenen(
      blatt.ebenen.map((e) => (e.id === ebene.id ? { ...e, sichtbar: !e.sichtbar } : e)),
      ebene.sichtbar
        ? t('zeichendialoge.ebenen.ausblenden')
        : t('zeichendialoge.ebenen.einblenden'),
    )
  }

  function toggleGesperrt(ebene: Ebene) {
    aendereEbenen(
      blatt.ebenen.map((e) => (e.id === ebene.id ? { ...e, gesperrt: !e.gesperrt } : e)),
      ebene.gesperrt ? t('zeichendialoge.ebenen.entsperren') : t('zeichendialoge.ebenen.sperren'),
    )
  }

  function loeschen(ebene: Ebene) {
    const ersatz = ersatzEbeneFuer(blatt.ebenen, ebene.id)
    const command = erzeugeEbeneLoeschenCommand(doc, ebene.id)
    if (!ersatz || !command) return
    const betroffeneObjekte = objekteAufEbene(doc, ebene.id)
    commands.execute(command)
    if (betroffeneObjekte > 0) {
      useUiStore.getState().setStatusText(
        t('zeichendialoge.ebenen.objekteVerschoben', {
          n: betroffeneObjekte,
          ebene: ersatz.name,
        }),
      )
    }
  }

  function neueEbeneAnlegen() {
    const name = neuerName.trim()
    if (!name) return
    aendereEbenen([...blatt.ebenen, erzeugeEbene(name)], t('zeichendialoge.ebenen.anlegen'))
    setNeuerName('')
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('zeichendialoge.ebenen.titel')}</h2>
        <p className="dialog-hinweis">{t('zeichendialoge.ebenen.hinweis')}</p>

        <div className="ebenen-tabelle">
          {blatt.ebenen.map((ebene) => {
            const sichtbar = ebene.istHintergrundLayer ? blatt.hintergrundSichtbar : ebene.sichtbar
            const loeschbar = !ebene.istHintergrundLayer
            return (
              <div key={ebene.id} className="ebenen-zeile">
                <span className="ebenen-farbe" style={{ background: ebene.farbe }} />
                <input
                  className="ebenen-name"
                  value={ebene.name}
                  onChange={(e) =>
                    aendereEbenen(
                      blatt.ebenen.map((x) =>
                        x.id === ebene.id ? { ...x, name: e.target.value } : x,
                      ),
                      t('zeichendialoge.ebenen.umbenennen'),
                    )
                  }
                />
                <button
                  type="button"
                  className="ebenen-schalter"
                  onClick={() => toggleSichtbar(ebene)}
                  title={
                    sichtbar
                      ? t('zeichendialoge.ebenen.ausblenden')
                      : t('zeichendialoge.ebenen.einblenden')
                  }
                  aria-pressed={sichtbar}
                >
                  {sichtbar ? '👁' : '🚫'}
                </button>
                <button
                  type="button"
                  className={
                    'ebenen-schalter ebenen-schalter-schloss' +
                    (ebene.gesperrt ? ' ebenen-schalter-gesperrt' : ' ebenen-schalter-entsperrt')
                  }
                  onClick={() => toggleGesperrt(ebene)}
                  title={
                    ebene.gesperrt
                      ? t('zeichendialoge.ebenen.entsperren')
                      : t('zeichendialoge.ebenen.sperren')
                  }
                  aria-pressed={ebene.gesperrt}
                >
                  {ebene.gesperrt ? <IconSchlossZu /> : <IconSchlossOffen />}
                </button>
                <button
                  type="button"
                  onClick={() => loeschen(ebene)}
                  disabled={!loeschbar || !ersatzEbeneFuer(blatt.ebenen, ebene.id)}
                  title={
                    !loeschbar
                      ? t('zeichendialoge.ebenen.hintergrundNichtLoeschbar')
                      : !ersatzEbeneFuer(blatt.ebenen, ebene.id)
                        ? t('zeichendialoge.ebenen.mindestensEine')
                        : undefined
                  }
                >
                  {t('zeichendialoge.gemeinsam.loeschen')}
                </button>
              </div>
            )
          })}
        </div>

        <div className="ebenen-neu">
          <input
            value={neuerName}
            placeholder={t('zeichendialoge.ebenen.neuerNamePlatzhalter')}
            onChange={(e) => setNeuerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') neueEbeneAnlegen()
            }}
          />
          <button type="button" onClick={neueEbeneAnlegen} disabled={!neuerName.trim()}>
            {t('zeichendialoge.ebenen.neueEbene')}
          </button>
        </div>

        <div className="dialog-aktionen">
          <button type="button" className="primaer" onClick={schliessen}>
            {t('zeichendialoge.gemeinsam.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}
