import type { LeitungsObjekt } from '../document-model'
import {
  verteilerAmEnde,
  verteilerAnschlussText,
  verteilerKennzeichenText,
  zuweisungsText,
} from '../document-model'
import { erzeugeVerteilerZuweisenCommand } from '../tools'
import { useAppContext, useProject } from './use-app-context'
import { useT } from './sprache-anbindung'

export function VerteilerAnschlussFeld({
  leitung,
  blattId,
}: {
  leitung: LeitungsObjekt
  blattId: string
}) {
  const t = useT()
  const { doc, commands, toolContext } = useAppContext()
  const zeichnung = useProject()
  const zeilen = (['start', 'ziel'] as const).flatMap((ende) => {
    const am = verteilerAmEnde(zeichnung, blattId, leitung, ende)
    const eigene = (leitung.verteilerAnschluesse ?? []).filter((a) => a.ende === ende)
    if (!am?.verteiler.verteiler) {
      return eigene.length > 0
        ? [
            <p key={ende} className="feld-info">
              {t(
                ende === 'start'
                  ? 'eigenschaften.verteilerAnschluss.ungueltigStart'
                  : 'eigenschaften.verteilerAnschluss.ungueltigZiel',
                { zuweisungen: eigene.map((a) => zuweisungsText(a, t)).join(', ') },
              )}
            </p>,
          ]
        : []
    }
    const text = verteilerAnschlussText(zeichnung, blattId, leitung, ende)
    const verteiler = am.verteiler
    return [
      <div key={ende} className="feld">
        <p className="feld-info">
          {text
            ? t('eigenschaften.verteilerAnschluss.angeschlossen', { anschluss: text })
            : t('eigenschaften.verteilerAnschluss.nichtAngeschlossen', {
                kennzeichen: verteilerKennzeichenText(verteiler.verteiler!.kennzeichen),
              })}
        </p>
        <div className="feld-knoepfe">
          <button
            type="button"
            onClick={() =>
              toolContext.oeffneVerteilerDialog(
                {
                  blattId: am.blattId,
                  objektId: verteiler.id,
                  fuer: t('eigenschaften.verteilerAnschluss.fuer', {
                    nummer: String(leitung.nummer),
                  }),
                  vorauswahl: eigene.map(({ ende: _ende, ...rest }) => rest),
                },
                (auswahl) => {
                  if (!auswahl) return
                  commands.execute(
                    erzeugeVerteilerZuweisenCommand(
                      doc,
                      blattId,
                      leitung.id,
                      ende,
                      auswahl,
                      t('eigenschaften.verteilerAnschluss.anschliessenUndo'),
                    ),
                  )
                },
              )
            }
          >
            {text
              ? t('eigenschaften.verteilerAnschluss.aendern')
              : t('eigenschaften.verteilerAnschluss.anschliessen')}
          </button>
          {text && (
            <button
              type="button"
              onClick={() =>
                commands.execute(
                  erzeugeVerteilerZuweisenCommand(
                    doc,
                    blattId,
                    leitung.id,
                    ende,
                    [],
                    t('eigenschaften.verteilerAnschluss.loesenUndo'),
                  ),
                )
              }
            >
              {t('eigenschaften.verteilerAnschluss.loesen')}
            </button>
          )}
        </div>
      </div>,
    ]
  })
  return zeilen.length > 0 ? <>{zeilen}</> : null
}
