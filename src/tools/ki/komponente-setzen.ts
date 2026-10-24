import type {
  Blatt,
  CatalogComponent,
  Zeichnung,
  KomponentenObjekt,
  Point,
  RaumObjekt,
  WandObjekt,
  WandflaechenTreffer,
} from '../../document-model'
import {
  erzeugeId,
  ermittleOeffnungsGeometrie,
  festerRasterSchritt,
  findeWandflaeche,
  getFangpunkt,
  istSchaltplan,
  knxAktorArtVonKatalogId,
  leseNetzfeld,
  netzfeldMitte,
  niedrigsteArtikelnummerVariante,
  nullpunktVon,
  ordneAnWandEin,
  pfadGesamtLaenge,
  pointInPolygon,
} from '../../document-model'
import { snapAufGrid } from '../../rendering'
import { t } from '../../sprache'
import type { Command } from '../command'
import { erzeugeObjektAendernCommand, erzeugeObjektHinzufuegenCommand } from '../commands'
import { auswahlAusKatalog, erzeugeKomponentenInstanz } from '../komponente-bauen'
import type { KiErgebnis, KiKontext } from './kontext'
import { findeObjekt, KiFehler, runde, waehleBlatt, zuBlatt } from './kontext'
import { blattText, fuehreAenderungAus, kiLabel } from './schreiben'

export interface Platzierung {
  katalogId: string
  varianteId?: string
  blattId?: string
  punkt?: { x: number; y: number }
  netzfeld?: string
  raumMitte?: string
  wand?: { wandId: string; abstandM: number; raumId?: string; seite?: 'links' | 'rechts' }
  hoeheM?: number
  drehungGrad?: number
  beschriftung?: string
}

const WAND_PROBE_ABSTAND_M = 0.05
const WAND_FANG_TOLERANZ_M = 0.15

interface Plan {
  index: number
  id: string
  blatt: Blatt
  eintrag: CatalogComponent
  variantId: string | null
  lage:
    | { art: 'punkt'; ziel: Point }
    | { art: 'netzfeld'; mitte: Point }
    | { art: 'raumMitte'; ziel: Point; raum: RaumObjekt }
    | { art: 'wand'; wand: WandObjekt; probe: Point }
}

function fehlerBei(index: number, text: string): KiFehler {
  return new KiFehler(t('kiMeldungen.komponenteSetzen.platzierung', { nr: index + 1, text }))
}

function wandProbe(p: Platzierung, i: number, wand: WandObjekt, blatt: Blatt): Point {
  const { abstandM, raumId, seite } = p.wand!
  const laenge = pfadGesamtLaenge(wand.punkte)
  if (abstandM > laenge + 1e-9) {
    throw fehlerBei(
      i,
      t('kiMeldungen.komponenteSetzen.wandZuKurz', { laenge: runde(laenge, 2), abstand: abstandM }),
    )
  }
  const geometrie = ermittleOeffnungsGeometrie(wand, { t: laenge > 0 ? abstandM / laenge : 0 })
  if (!geometrie) throw fehlerBei(i, t('kiMeldungen.gemeinsam.wandOhneLaenge'))
  const { position, richtung } = geometrie
  const links = { x: -Math.sin(richtung), y: Math.cos(richtung) }
  const versatz = wand.staerke / 2 + WAND_PROBE_ABSTAND_M
  const aufSeite = (s: 1 | -1) => ({
    x: position.x + links.x * versatz * s,
    y: position.y + links.y * versatz * s,
  })
  if (raumId) {
    const raum = blatt.objekte.find((o): o is RaumObjekt => o.type === 'raum' && o.id === raumId)
    if (!raum) {
      throw fehlerBei(
        i,
        t('kiMeldungen.gemeinsam.keinRaumAufBlatt', { id: raumId, blatt: blatt.name }),
      )
    }
    const s = ([1, -1] as const).find((x) => pointInPolygon(aufSeite(x), raum.umriss))
    if (!s) {
      throw fehlerBei(i, t('kiMeldungen.komponenteSetzen.raumNichtAnWand', { raum: raum.name }))
    }
    return aufSeite(s)
  }
  if (!seite) throw fehlerBei(i, t('kiMeldungen.komponenteSetzen.raumOderSeite'))
  return aufSeite(seite === 'links' ? 1 : -1)
}

export function netzfeldMitteAuf(
  blatt: Blatt,
  name: string,
  zeichnung: Pick<Zeichnung, 'zeichnungsart'>,
  index?: number,
): Point {
  const fehler = (text: string) =>
    index === undefined ? new KiFehler(text) : fehlerBei(index, text)
  if (!istSchaltplan(zeichnung))
    throw fehler(t('kiMeldungen.komponenteSetzen.netzfeldNurSchaltplan'))
  if (!blatt.zeichenflaeche) {
    throw fehler(t('kiMeldungen.komponenteSetzen.keineZeichenflaeche', { blatt: blatt.name }))
  }
  const feld = leseNetzfeld(name)
  if (!feld) throw fehler(t('kiMeldungen.komponenteSetzen.keinNetzfeld', { name }))
  return netzfeldMitte(blatt.zeichenflaeche, feld)
}

export function aufSchaltplanRaster(
  punkt: Point,
  blatt: Blatt,
  zeichnung: Pick<Zeichnung, 'zeichnungsart'>,
): Point {
  const schritt = festerRasterSchritt(zeichnung)
  return schritt ? snapAufGrid(punkt, schritt, nullpunktVon(blatt)) : punkt
}

function plane(p: Platzierung, i: number, kontext: KiKontext): Plan {
  const lagen = [p.punkt, p.netzfeld, p.raumMitte, p.wand].filter((x) => x !== undefined).length
  if (lagen !== 1) {
    throw fehlerBei(i, t('kiMeldungen.komponenteSetzen.eineLage'))
  }
  const eintrag = kontext.katalogKomponenten().find((k) => k.id === p.katalogId)
  if (!eintrag)
    throw fehlerBei(i, t('kiMeldungen.gemeinsam.keinKatalogeintrag', { id: p.katalogId }))
  if (eintrag.ausgemustert) {
    throw fehlerBei(i, t('kiMeldungen.gemeinsam.ausgemustert', { name: eintrag.name }))
  }
  if (knxAktorArtVonKatalogId(eintrag.id)) {
    throw fehlerBei(i, t('kiMeldungen.komponenteSetzen.knxAktorVonHand'))
  }
  let variantId: string | null = niedrigsteArtikelnummerVariante(eintrag)?.id ?? null
  if (p.varianteId !== undefined) {
    if (!eintrag.varianten.some((v) => v.id === p.varianteId)) {
      throw fehlerBei(
        i,
        t('kiMeldungen.komponenteSetzen.keineVariante', {
          name: eintrag.name,
          variante: p.varianteId,
        }),
      )
    }
    variantId = p.varianteId
  }
  const zeichnung = kontext.doc.getZeichnung()
  const id = erzeugeId('objekt')
  const mitBlatt = (blatt: Blatt) => {
    const grund = kontext.nurAnsicht(blatt)
    if (grund)
      throw fehlerBei(i, t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: blatt.name, grund }))
    return blatt
  }
  if (p.punkt) {
    const blatt = mitBlatt(waehleBlatt(kontext, p.blattId))
    const bezug = nullpunktVon(blatt)
    const ziel = { x: p.punkt.x + bezug.x, y: p.punkt.y + bezug.y }
    return { index: i, id, blatt, eintrag, variantId, lage: { art: 'punkt', ziel } }
  }
  if (p.netzfeld !== undefined) {
    const blatt = mitBlatt(waehleBlatt(kontext, p.blattId))
    return {
      index: i,
      id,
      blatt,
      eintrag,
      variantId,
      lage: { art: 'netzfeld', mitte: netzfeldMitteAuf(blatt, p.netzfeld, zeichnung, i) },
    }
  }
  if (p.raumMitte) {
    const fund = findeObjekt(zeichnung, p.raumMitte)
    if (fund?.objekt.type !== 'raum') {
      throw fehlerBei(i, t('kiMeldungen.komponenteSetzen.keinRaum', { id: p.raumMitte }))
    }
    const blatt = mitBlatt(fund.blatt)
    return {
      index: i,
      id,
      blatt,
      eintrag,
      variantId,
      lage: { art: 'raumMitte', ziel: fund.objekt.mittelpunkt, raum: fund.objekt },
    }
  }
  const fund = findeObjekt(zeichnung, p.wand!.wandId)
  if (fund?.objekt.type !== 'wand') {
    throw fehlerBei(i, t('kiMeldungen.gemeinsam.keineWand', { id: p.wand!.wandId }))
  }
  const blatt = mitBlatt(fund.blatt)
  if (istSchaltplan(zeichnung)) throw fehlerBei(i, t('kiMeldungen.gemeinsam.schaltplanOhneWaende'))
  const probe = wandProbe(p, i, fund.objekt, blatt)
  return {
    index: i,
    id,
    blatt,
    eintrag,
    variantId,
    lage: { art: 'wand', wand: fund.objekt, probe },
  }
}

function wandTreffer(objekte: Blatt['objekte'], plan: Plan): WandflaechenTreffer {
  if (plan.lage.art !== 'wand') throw new Error('keine Wandlage')
  const treffer = findeWandflaeche(objekte, plan.lage.probe, WAND_FANG_TOLERANZ_M)
  if (!treffer || treffer.wandId !== plan.lage.wand.id) {
    throw fehlerBei(plan.index, t('kiMeldungen.komponenteSetzen.keineFreieFlaeche'))
  }
  return treffer
}

export function komponenteSetzen(
  eingabe: { platzierungen: Platzierung[] },
  kontext: KiKontext,
): KiErgebnis {
  const plaene = eingabe.platzierungen.map((p, i) => plane(p, i, kontext))
  for (const plan of plaene) {
    if (plan.lage.art === 'wand') wandTreffer(plan.blatt.objekte, plan)
  }
  const doc = kontext.doc
  const vorgaben = kontext.vorgaben()
  const namen = [...new Set(plaene.map((p) => p.eintrag.name))]
  const text = t('kiMeldungen.komponenteSetzen.gesetzt', {
    n: plaene.length,
    namen: namen.slice(0, 3).join(', ') + (namen.length > 3 ? ' …' : ''),
    blaetter: blattText(plaene.map((p) => p.blatt)),
  })
  const label = kiLabel(text)

  const schritte = plaene.map((plan) => (): Command => {
    const p = eingabe.platzierungen[plan.index]
    const zeichnung = doc.getZeichnung()
    const blatt = doc.getBlatt(plan.blatt.id) ?? plan.blatt
    const instanz = (ziel: Point, drehung: number): KomponentenObjekt => ({
      ...erzeugeKomponentenInstanz(
        auswahlAusKatalog(plan.eintrag, plan.variantId),
        {
          zeichnung,
          blatt,
          ebeneId: blatt.aktiveEbeneId,
          drehung,
          hoeheCm: p.hoeheM !== undefined ? Math.round(p.hoeheM * 100) : null,
          klemmenLeiste: vorgaben.klemmenLeiste,
          bekannteVerteilerKennzeichen: vorgaben.bekannteVerteilerKennzeichen,
        },
        ziel,
      ),
      id: plan.id,
      ...(p.beschriftung ? { beschriftung: p.beschriftung } : {}),
    })
    const drehung = ((p.drehungGrad ?? 0) * Math.PI) / 180
    if (plan.lage.art === 'wand') {
      const k = instanz(plan.lage.probe, 0)
      return erzeugeObjektAendernCommand(doc, blatt.id, label, (objekte) => {
        const treffer = wandTreffer(objekte, plan)
        return ordneAnWandEin(objekte, k, treffer, zeichnung, 0).objekte
      })
    }
    if (plan.lage.art === 'netzfeld') {
      const probe = instanz(plan.lage.mitte, drehung)
      const fang = getFangpunkt(probe)
      const ziel = aufSchaltplanRaster(
        {
          x: plan.lage.mitte.x - (probe.position.x - fang.x),
          y: plan.lage.mitte.y - (probe.position.y - fang.y),
        },
        blatt,
        zeichnung,
      )
      return erzeugeObjektHinzufuegenCommand(doc, blatt.id, instanz(ziel, drehung), label)
    }
    let k = instanz(
      plan.lage.art === 'punkt'
        ? aufSchaltplanRaster(plan.lage.ziel, blatt, zeichnung)
        : plan.lage.ziel,
      drehung,
    )
    if (plan.lage.art === 'raumMitte') {
      k = { ...k, position: plan.lage.ziel }
    }
    return erzeugeObjektHinzufuegenCommand(doc, blatt.id, k, label)
  })

  fuehreAenderungAus(kontext, text, schritte)
  kontext.meldeAenderung(label)

  const zeichnung = doc.getZeichnung()
  const gesetzt = plaene.map((plan) => {
    const fund = findeObjekt(zeichnung, plan.id)
    const k = fund?.objekt.type === 'komponente' ? fund.objekt : null
    return {
      id: plan.id,
      katalog: plan.eintrag.name,
      blattId: plan.blatt.id,
      ...(k
        ? {
            position: zuBlatt(k.position, fund!.blatt),
            fangpunkt: zuBlatt(getFangpunkt(k), fund!.blatt),
            ...(k.geraeteKennzeichen ? { kennzeichen: k.geraeteKennzeichen } : {}),
            ...(k.kombination
              ? { kombination: k.kombination.nr, hoeheCm: k.kombination.hoeheCm }
              : {}),
          }
        : {}),
    }
  })
  return { daten: { gesetzt, rueckgaengig: label } }
}
