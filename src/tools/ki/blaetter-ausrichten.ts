import type { AusrichtungsStand, Blatt } from '../../document-model'
import { ausrichtungsStand, richteBlattAus, zeichenflaecheUeberstand } from '../../document-model'
import { t } from '../../sprache'
import { erzeugeBlattAendernCommand } from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler } from './kontext'
import { blattText, fuehreAenderungAus, kiLabel } from './schreiben'

const GRUND: Record<Exclude<AusrichtungsStand, 'bereit'>, Parameters<typeof t>[0]> = {
  ausgerichtet: 'kiMeldungen.blaetterAusrichten.ausgerichtetSchon',
  'ohne-nullpunkt': 'kiMeldungen.blaetterAusrichten.ohneNullpunkt',
  'ohne-richtung': 'kiMeldungen.blaetterAusrichten.ohneRichtung',
}

export function blaetterAusrichten(
  eingabe: { blattIds?: string[] },
  kontext: KiKontext,
): KiErgebnis {
  const zeichnung = kontext.doc.getZeichnung()
  let ziele: Blatt[] = zeichnung.blaetter
  if (eingabe.blattIds) {
    const unbekannt = eingabe.blattIds.filter((id) => !zeichnung.blaetter.some((b) => b.id === id))
    if (unbekannt.length > 0) {
      throw new KiFehler(t('kiMeldungen.gemeinsam.blattUnbekannt', { blattId: unbekannt[0] }))
    }
    const gewuenscht = new Set(eingabe.blattIds)
    ziele = zeichnung.blaetter.filter((b) => gewuenscht.has(b.id))
  }

  const bereit: Blatt[] = []
  const uebersprungen: { blattId: string; name: string; grund: string }[] = []
  for (const blatt of ziele) {
    const sperre = kontext.nurAnsicht(blatt)
    const stand = ausrichtungsStand(blatt)
    if (sperre) uebersprungen.push({ blattId: blatt.id, name: blatt.name, grund: sperre })
    else if (stand !== 'bereit') {
      uebersprungen.push({ blattId: blatt.id, name: blatt.name, grund: t(GRUND[stand]) })
    } else bereit.push(blatt)
  }
  if (bereit.length === 0) {
    const liste = uebersprungen.map((u) => `${u.name} (${u.grund})`).join(', ')
    throw new KiFehler(t('kiMeldungen.blaetterAusrichten.nichtsBereit', { liste }))
  }

  const text = t('kiMeldungen.blaetterAusrichten.ausgerichtet', { blaetter: blattText(bereit) })
  const label = kiLabel(text)
  fuehreAenderungAus(
    kontext,
    text,
    bereit.map((ziel) => () => {
      const blatt = kontext.doc.getBlatt(ziel.id)
      if (!blatt) return null
      const neu = richteBlattAus(blatt)
      return erzeugeBlattAendernCommand(kontext.doc, blatt.id, label, {
        ursprung: neu.ursprung,
        hintergrundDrehung: neu.hintergrundDrehung,
        nullpunkt: neu.nullpunkt,
        nullpunktRichtung: neu.nullpunktRichtung,
        zeichenflaeche: neu.zeichenflaeche,
        objekte: neu.objekte,
      })
    }),
  )
  kontext.meldeAenderung(label)

  const nachher = bereit
    .map((b) => kontext.doc.getBlatt(b.id))
    .filter((b): b is Blatt => b !== undefined && b !== null)
  const ragen = nachher.filter((b) => zeichenflaecheUeberstand(b) !== null)
  return {
    daten: {
      ausgerichtet: nachher.map((b) => ({ blattId: b.id, name: b.name })),
      ...(uebersprungen.length > 0 ? { uebersprungen } : {}),
      ...(ragen.length > 0
        ? {
            ragtUeberZeichenflaeche: ragen.map((b) => b.id),
            hinweis: t('kiMeldungen.blaetterAusrichten.ragtHinweis', {
              blaetter: ragen.map((b) => b.name).join(', '),
            }),
          }
        : {}),
      rueckgaengig: label,
    },
  }
}
