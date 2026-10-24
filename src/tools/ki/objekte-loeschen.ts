import type { Objekt } from '../../document-model'
import { t } from '../../sprache'
import { erzeugeObjekteEntfernenCommand } from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { blattText, fuehreAenderungAus, kiLabel, ordneObjekteNachBlatt } from './schreiben'

function alleObjekte(kontext: KiKontext): Map<string, Objekt> {
  return new Map(
    kontext.doc
      .getZeichnung()
      .blaetter.flatMap((b) => b.objekte)
      .map((o) => [o.id, o]),
  )
}

export function objekteLoeschen(eingabe: { objektIds: string[] }, kontext: KiKontext): KiErgebnis {
  const { jeBlatt, gesperrt } = ordneObjekteNachBlatt(kontext, eingabe.objektIds)
  const genannt = new Set([...jeBlatt.values()].flatMap((e) => e.objekte.map((o) => o.id)))
  const text = t('kiMeldungen.objekteLoeschen.geloescht', {
    n: genannt.size,
    blaetter: blattText([...jeBlatt.values()].map((e) => e.blatt)),
  })
  const label = kiLabel(text)
  const vorher = alleObjekte(kontext)

  fuehreAenderungAus(
    kontext,
    text,
    [...jeBlatt.values()].map(
      ({ blatt, objekte }) =>
        () =>
          erzeugeObjekteEntfernenCommand(
            kontext.doc,
            blatt.id,
            objekte.map((o) => o.id),
            label,
          ),
    ),
  )

  const nachher = alleObjekte(kontext)
  const mit = [...vorher.values()].filter((o) => !nachher.has(o.id) && !genannt.has(o.id))
  const jeTyp: Record<string, number> = {}
  for (const o of mit) jeTyp[o.type] = (jeTyp[o.type] ?? 0) + 1
  const leitungen = mit.flatMap((o) => (o.type === 'leitung' ? [o.nummer] : []))
  kontext.meldeAenderung(
    mit.length > 0
      ? kiLabel(t('kiMeldungen.objekteLoeschen.mitgeloescht', { text, n: mit.length }))
      : label,
  )
  return {
    daten: {
      geloescht: genannt.size,
      ...(mit.length > 0
        ? {
            mitgeloescht: {
              anzahl: mit.length,
              jeTyp,
              ...(leitungen.length > 0 ? { leitungsnummern: [...new Set(leitungen)] } : {}),
            },
          }
        : {}),
      ...(gesperrt.length > 0 ? { uebersprungenGesperrt: gesperrt } : {}),
      rueckgaengig: label,
    },
  }
}
