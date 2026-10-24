import { t } from '../../sprache'
import { erzeugeKomponentenDrehenCommand } from '../transformieren'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler } from './kontext'
import { blattText, fuehreAenderungAus, kiLabel, ordneObjekteNachBlatt } from './schreiben'

export function objekteDrehen(
  eingabe: { objektIds: string[]; winkelGrad: number },
  kontext: KiKontext,
): KiErgebnis {
  const { jeBlatt, gesperrt } = ordneObjekteNachBlatt(kontext, eingabe.objektIds)
  const uebersprungen = [...gesperrt]
  const jeBlattKomponenten = [...jeBlatt.values()].flatMap(({ blatt, objekte }) => {
    const ids = objekte.flatMap((o) => (o.type === 'komponente' ? [o.id] : []))
    uebersprungen.push(...objekte.filter((o) => o.type !== 'komponente').map((o) => o.id))
    return ids.length > 0 ? [{ blatt, ids }] : []
  })
  if (jeBlattKomponenten.length === 0) {
    throw new KiFehler(t('kiMeldungen.objekteDrehen.nurKomponenten'))
  }
  if (Math.abs(eingabe.winkelGrad % 360) < 1e-9) {
    throw new KiFehler(t('kiMeldungen.objekteDrehen.winkelNull'))
  }

  const anzahl = jeBlattKomponenten.reduce((s, e) => s + e.ids.length, 0)
  const text = t('kiMeldungen.objekteDrehen.gedreht', {
    n: anzahl,
    winkel: eingabe.winkelGrad,
    blaetter: blattText(jeBlattKomponenten.map((e) => e.blatt)),
  })
  const label = kiLabel(text)
  const winkel = (eingabe.winkelGrad * Math.PI) / 180
  const fehlgeschlagen = new Map<string, number>()

  fuehreAenderungAus(
    kontext,
    text,
    jeBlattKomponenten.map(({ blatt, ids }) => () => {
      const ergebnis = erzeugeKomponentenDrehenCommand(
        kontext.doc,
        blatt.id,
        ids,
        winkel,
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
      gedreht: anzahl,
      ...(nichtVerlegt > 0
        ? {
            hinweis: t('kiMeldungen.gemeinsam.nichtNeuVerlegt', { n: nichtVerlegt }),
          }
        : {}),
      ...(uebersprungen.length > 0 ? { uebersprungen } : {}),
      rueckgaengig: label,
    },
  }
}
