import type { Blatt, CatalogComponent, Objekt, Point } from '../../document-model'
import { findeRaumZuPunkt, getBoundingBox } from '../../document-model'
import { t } from '../../sprache'
import { runde, zuBlatt } from './kontext'

export type Kurzform = Record<string, unknown>

function laenge(punkte: readonly Point[]): number {
  let summe = 0
  for (let i = 1; i < punkte.length; i++) {
    summe += Math.hypot(punkte[i].x - punkte[i - 1].x, punkte[i].y - punkte[i - 1].y)
  }
  return summe
}

function ohneLeere(werte: Kurzform): Kurzform {
  const ergebnis: Kurzform = {}
  for (const [schluessel, wert] of Object.entries(werte)) {
    if (wert === undefined || wert === null || wert === '') continue
    ergebnis[schluessel] = wert
  }
  return ergebnis
}

export function rahmenAufBlatt(objekt: Objekt, blatt: Blatt) {
  const rahmen = getBoundingBox(objekt)
  return { min: zuBlatt(rahmen.min, blatt), max: zuBlatt(rahmen.max, blatt) }
}

export function objektKurzform(
  objekt: Objekt,
  blatt: Blatt,
  katalog: ReadonlyMap<string, CatalogComponent>,
): Kurzform {
  const basis = { id: objekt.id, typ: objekt.type }
  switch (objekt.type) {
    case 'komponente': {
      const eintrag = katalog.get(objekt.catalogComponentId)
      const variante = eintrag?.varianten.find((v) => v.id === objekt.variantId)
      const raum = findeRaumZuPunkt(blatt.objekte, objekt.position)
      return ohneLeere({
        ...basis,
        position: zuBlatt(objekt.position, blatt),
        drehungGrad: objekt.drehung ? runde((objekt.drehung * 180) / Math.PI, 1) : undefined,
        katalog:
          eintrag?.name ??
          t('kiMeldungen.objektKurzform.unbekannterKatalog', { id: objekt.catalogComponentId }),
        katalogId: objekt.catalogComponentId,
        variante: variante?.name ?? variante?.farbe,
        beschriftung: objekt.beschriftung,
        kennzeichen: objekt.geraeteKennzeichen,
        verteiler: objekt.verteiler?.kennzeichen,
        geraetetyp: objekt.typ ?? eintrag?.typ,
        raum: raum?.name,
        installationshoeheM: objekt.installationshoehe,
        montageort: objekt.montageort ?? eintrag?.montageort,
        verlegung: objekt.verlegung === 'in' ? 'UP' : undefined,
        stromkreis: objekt.stromkreis,
        knx: objekt.knx || undefined,
        gruppeId: objekt.gruppeId,
      })
    }
    case 'leitung': {
      const punkte = objekt.pfadSegmente.flat()
      return ohneLeere({
        ...basis,
        nummer: objekt.nummer,
        kabeltyp: objekt.typ,
        beschreibung: objekt.beschreibung,
        start: objekt.start,
        ziel: objekt.ziel,
        von: punkte[0] ? zuBlatt(punkte[0], blatt) : undefined,
        nach: punkte.length > 0 ? zuBlatt(punkte[punkte.length - 1], blatt) : undefined,
        laengeAufBlattM: runde(
          objekt.pfadSegmente.reduce((s, seg) => s + laenge(seg), 0),
          2,
        ),
        trunks: objekt.trunkDurchgaenge.length > 0 ? objekt.trunkDurchgaenge.length : undefined,
      })
    }
    case 'schaltverbindung':
      return ohneLeere({
        ...basis,
        bezeichnung: objekt.bezeichnung,
        beschreibung: objekt.beschreibung,
        polzahl: objekt.polzahl,
        start: objekt.start,
        ziel: objekt.ziel,
        wegpunkte: objekt.wegpunkte.map((p) => zuBlatt(p, blatt)),
      })
    case 'trunk':
      return ohneLeere({
        ...basis,
        name: objekt.name,
        beschreibung: objekt.beschreibung,
        wegpunkte: objekt.wegpunkte.map((p) => zuBlatt(p, blatt)),
        laengeM: runde(laenge(objekt.wegpunkte), 2),
      })
    case 'raum':
      return ohneLeere({
        ...basis,
        name: objekt.name,
        flaecheM2: runde(objekt.flaeche, 2),
        mittelpunkt: zuBlatt(objekt.mittelpunkt, blatt),
        gueltig: objekt.gueltig ? undefined : false,
      })
    case 'wand':
      return ohneLeere({
        ...basis,
        punkte: objekt.punkte.map((p) => zuBlatt(p, blatt)),
        staerkeM: objekt.staerke,
      })
    case 'tuer':
    case 'fenster':
    case 'wanddurchbruch':
      return ohneLeere({
        ...basis,
        position: zuBlatt(objekt.position, blatt),
        breiteM: objekt.breite,
        wandId: objekt.wandId,
      })
    case 'text':
      return { ...basis, position: zuBlatt(objekt.position, blatt), inhalt: objekt.inhalt }
    case 'potential':
      return { ...basis, position: zuBlatt(objekt.position, blatt), name: objekt.name }
    case 'kabelschacht':
      return ohneLeere({
        ...basis,
        name: objekt.name,
        position: zuBlatt(objekt.ursprung, blatt),
        verbundId: objekt.verbundId,
      })
    default:
      return { ...basis, rahmen: rahmenAufBlatt(objekt, blatt) }
  }
}
