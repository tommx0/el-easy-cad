import type { Point } from '../../document-model'
import { nullpunktVon } from '../../document-model'
import { t } from '../../sprache'
import { erzeugeVerschiebungMitRerouteCommand } from '../gruppenverschiebung'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler, runde } from './kontext'
import { blattText, fuehreAenderungAus, kiLabel, ordneObjekteNachBlatt } from './schreiben'

export interface VerschiebenEingabe {
  objektIds: string[]
  dx?: number
  dy?: number
  nach?: { x: number; y: number }
}

export function objekteVerschieben(eingabe: VerschiebenEingabe, kontext: KiKontext): KiErgebnis {
  const mitVersatz = eingabe.dx !== undefined || eingabe.dy !== undefined
  if (mitVersatz === (eingabe.nach !== undefined)) {
    throw new KiFehler(t('kiMeldungen.objekteVerschieben.versatzOderZiel'))
  }
  const { jeBlatt, gesperrt } = ordneObjekteNachBlatt(kontext, eingabe.objektIds)

  let versatz: Point = { x: eingabe.dx ?? 0, y: eingabe.dy ?? 0 }
  if (eingabe.nach) {
    const [eintrag] = [...jeBlatt.values()]
    const [objekt] = eintrag?.objekte ?? []
    if (jeBlatt.size !== 1 || eintrag.objekte.length !== 1 || objekt.type !== 'komponente') {
      throw new KiFehler(t('kiMeldungen.objekteVerschieben.nachNurEine'))
    }
    const bezug = nullpunktVon(eintrag.blatt)
    versatz = {
      x: eingabe.nach.x + bezug.x - objekt.position.x,
      y: eingabe.nach.y + bezug.y - objekt.position.y,
    }
  }
  if (Math.hypot(versatz.x, versatz.y) < 1e-9) {
    throw new KiFehler(t('kiMeldungen.objekteVerschieben.versatzNull'))
  }

  const anzahl = [...jeBlatt.values()].reduce((s, e) => s + e.objekte.length, 0)
  const text = t('kiMeldungen.objekteVerschieben.verschoben', {
    n: anzahl,
    dx: runde(versatz.x, 2),
    dy: runde(versatz.y, 2),
    blaetter: blattText([...jeBlatt.values()].map((e) => e.blatt)),
  })
  const label = kiLabel(text)
  const fehlgeschlagen = new Map<string, number>()

  fuehreAenderungAus(
    kontext,
    text,
    [...jeBlatt.values()].map(({ blatt, objekte }) => () => {
      const ids = new Set(objekte.map((o) => o.id))
      const aktuell = kontext.doc.getBlatt(blatt.id)?.objekte ?? []
      const komponenten = new Map<string, Point>()
      const sonstige = new Map<string, Point>()
      for (const o of aktuell) {
        if (!ids.has(o.id)) continue
        if (o.type === 'komponente') {
          komponenten.set(o.id, { x: o.position.x + versatz.x, y: o.position.y + versatz.y })
        } else {
          sonstige.set(o.id, versatz)
        }
      }
      const ergebnis = erzeugeVerschiebungMitRerouteCommand(
        kontext.doc,
        blatt.id,
        komponenten,
        sonstige,
        kontext.routingSettings(),
        label,
      )
      fehlgeschlagen.set(blatt.id, ergebnis.fehlgeschlageneLeitungenAnzahl)
      return ergebnis.command
    }),
  )

  const nichtVerlegt = [...fehlgeschlagen.values()].reduce((s, n) => s + n, 0)
  kontext.meldeAenderung(label)
  return {
    daten: {
      verschoben: anzahl,
      versatzM: { x: runde(versatz.x), y: runde(versatz.y) },
      ...(nichtVerlegt > 0
        ? {
            hinweis: t('kiMeldungen.gemeinsam.nichtNeuVerlegt', { n: nichtVerlegt }),
          }
        : {}),
      ...(gesperrt.length > 0 ? { uebersprungenGesperrt: gesperrt } : {}),
      rueckgaengig: label,
    },
  }
}
