import type { Ausrichtung, Blatt, Papierformat, Point, Zeichenflaeche } from '../../document-model'
import {
  istSchaltplan,
  nullpunktVon,
  schlageMassstabNennerVor,
  vorschlagZeichenflaecheUrsprung,
  weltBoundingBoxInhalt,
} from '../../document-model'
import { t } from '../../sprache'
import { erzeugeBlattAendernCommand } from '../commands'
import { zeichenflaecheFuerKi } from './dokument-uebersicht'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler, waehleBlatt } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'

interface Eingabe {
  blattId?: string
  versatz?: { dx: number; dy: number }
  ursprung?: { x: number; y: number }
  mittig?: boolean
  papierformat?: Papierformat
  ausrichtung?: Ausrichtung
  massstab?: number
  einpassen?: boolean
}

function vorlageFuer(kontext: KiKontext, blatt: Blatt): Zeichenflaeche | null {
  if (blatt.zeichenflaeche) return blatt.zeichenflaeche
  const zeichnung = kontext.doc.getZeichnung()
  return (
    kontext.doc.getAktivesBlatt().zeichenflaeche ??
    zeichnung.blaetter.find((b) => b.zeichenflaeche)?.zeichenflaeche ??
    null
  )
}

function ausrichtungNachInhalt(blatt: Blatt): Ausrichtung | null {
  const inhalt = weltBoundingBoxInhalt(blatt)
  if (!inhalt) return null
  return inhalt.max.x - inhalt.min.x >= inhalt.max.y - inhalt.min.y ? 'quer' : 'hoch'
}

export function zeichenflaecheSetzen(eingabe: Eingabe, kontext: KiKontext): KiErgebnis {
  if (istSchaltplan(kontext.doc.getZeichnung())) {
    throw new KiFehler(t('kiMeldungen.zeichenflaecheSetzen.schaltplan'))
  }
  const blatt = waehleBlatt(kontext, eingabe.blattId)
  const sperre = kontext.nurAnsicht(blatt)
  if (sperre) {
    throw new KiFehler(
      t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: blatt.name, grund: sperre }),
    )
  }
  const lagen = [eingabe.versatz, eingabe.ursprung, eingabe.mittig ? true : undefined].filter(
    (l) => l !== undefined,
  ).length
  if (lagen > 1) throw new KiFehler(t('kiMeldungen.zeichenflaecheSetzen.mehrereLagen'))
  if (eingabe.massstab !== undefined && eingabe.einpassen) {
    throw new KiFehler(t('kiMeldungen.zeichenflaecheSetzen.massstabUndEinpassen'))
  }
  const alt = blatt.zeichenflaeche
  const formatGenannt =
    eingabe.papierformat !== undefined ||
    eingabe.ausrichtung !== undefined ||
    eingabe.massstab !== undefined ||
    eingabe.einpassen === true
  if (alt && lagen === 0 && !formatGenannt) {
    throw new KiFehler(t('kiMeldungen.zeichenflaecheSetzen.nichts'))
  }

  const vorlage = vorlageFuer(kontext, blatt)
  const papierformat = eingabe.papierformat ?? vorlage?.papierformat ?? 'A3'
  const ausrichtung =
    eingabe.ausrichtung ??
    alt?.ausrichtung ??
    ausrichtungNachInhalt(blatt) ??
    vorlage?.ausrichtung ??
    'quer'

  let massstabNenner: number
  if (eingabe.massstab !== undefined) massstabNenner = eingabe.massstab
  else if (eingabe.einpassen || !alt) {
    const vorschlag = schlageMassstabNennerVor(blatt, papierformat, ausrichtung)
    if (vorschlag === null && eingabe.einpassen) {
      throw new KiFehler(t('kiMeldungen.zeichenflaecheSetzen.keinInhalt'))
    }
    massstabNenner = vorschlag ?? vorlage?.massstabNenner ?? 100
  } else massstabNenner = alt.massstabNenner
  const entwurf = { papierformat, ausrichtung, massstabNenner }

  let ursprung: Point
  if (eingabe.ursprung) {
    const bezug = nullpunktVon(blatt)
    ursprung = { x: bezug.x + eingabe.ursprung.x, y: bezug.y + eingabe.ursprung.y }
  } else if (eingabe.mittig || !alt) {
    ursprung = vorschlagZeichenflaecheUrsprung(blatt, entwurf)
  } else ursprung = alt.ursprung
  if (eingabe.versatz) {
    ursprung = { x: ursprung.x + eingabe.versatz.dx, y: ursprung.y + eingabe.versatz.dy }
  }
  const zeichenflaeche: Zeichenflaeche = { ...entwurf, ursprung }
  const nullpunktMit = !alt && !blatt.nullpunkt

  const text = t(
    alt ? 'kiMeldungen.zeichenflaecheSetzen.gesetzt' : 'kiMeldungen.zeichenflaecheSetzen.angelegt',
    { blatt: blatt.name },
  )
  const label = kiLabel(text)
  fuehreAenderungAus(kontext, text, [
    () =>
      nullpunktMit
        ? erzeugeBlattAendernCommand(kontext.doc, blatt.id, label, {
            zeichenflaeche,
            nullpunkt: zeichenflaeche.ursprung,
          })
        : erzeugeBlattAendernCommand(kontext.doc, blatt.id, label, { zeichenflaeche }),
  ])
  kontext.meldeAenderung(label)

  const nachher = kontext.doc.getBlatt(blatt.id) ?? blatt
  return {
    daten: {
      blattId: blatt.id,
      zeichenflaeche: {
        papier: `${papierformat} ${ausrichtung}`,
        massstab: `1:${massstabNenner}`,
        ...zeichenflaecheFuerKi(nachher),
      },
      ...(nullpunktMit ? { hinweis: t('kiMeldungen.zeichenflaecheSetzen.nullpunktGesetzt') } : {}),
      rueckgaengig: label,
    },
  }
}
