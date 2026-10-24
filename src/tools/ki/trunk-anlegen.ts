import type { Blatt, KomponentenObjekt, Point, TrunkObjekt } from '../../document-model'
import {
  distance,
  ebeneFuerNeuesObjekt,
  erzeugeId,
  getDockpoints,
  istTrunkDockpunkt,
  naechsteFreieStrangNummer,
  naechsterFreierTrunkName,
  naechsterPunktAufPfad,
  neueObjektBasis,
  nullpunktVon,
} from '../../document-model'
import { t } from '../../sprache'
import type { Command } from '../command'
import {
  erzeugeObjektHinzufuegenCommand,
  erzeugeSchachtTrunkAnschlussCommand,
  erzeugeTrunkAndockenCommand,
  erzeugeTrunkMergeCommand,
} from '../commands'
import { TRUNK_STANDARD_FARBE, TRUNK_STANDARD_STRICHSTAERKE } from '../tools/trunk-tool'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler, waehleBlatt, zuBlatt } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'

export interface TrunkEndeEingabe {
  komponente?: string
  trunk?: string
  schacht?: { objektId: string; strang?: number }
}

const AM_ENDE_M = 0.05

function endeAuf(
  blatt: Blatt,
  punkt: Point,
  bevorzugt: string,
): { trunk: TrunkObjekt; ende: 0 | 1 } | null {
  const reihenfolge = [...blatt.objekte].sort((a, b) =>
    a.id === bevorzugt ? -1 : b.id === bevorzugt ? 1 : 0,
  )
  for (const o of reihenfolge) {
    if (o.type !== 'trunk') continue
    if (distance(o.wegpunkte[0], punkt) < 1e-6) return { trunk: o, ende: 0 }
    if (distance(o.wegpunkte[o.wegpunkte.length - 1], punkt) < 1e-6) return { trunk: o, ende: 1 }
  }
  return null
}

export function trunkAnlegen(
  eingabe: {
    blattId?: string
    wegpunkte: { x: number; y: number }[]
    anfang?: TrunkEndeEingabe
    ende?: TrunkEndeEingabe
  },
  kontext: KiKontext,
): KiErgebnis {
  const doc = kontext.doc
  const blatt = waehleBlatt(kontext, eingabe.blattId)
  const grund = kontext.nurAnsicht(blatt)
  if (grund) {
    throw new KiFehler(t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: blatt.name, grund }))
  }
  const bezug = nullpunktVon(blatt)
  const wegpunkte = eingabe.wegpunkte.map((p) => ({ x: p.x + bezug.x, y: p.y + bezug.y }))
  const enden: TrunkObjekt['enden'] = [{}, {}]
  const anschluesse = [eingabe.anfang, eingabe.ende]

  anschluesse.forEach((a, index) => {
    if (!a) return
    const arten = [a.komponente, a.trunk, a.schacht].filter((x) => x !== undefined).length
    if (arten !== 1) throw new KiFehler(t('kiMeldungen.trunkAnlegen.eineArt'))
    if (!a.komponente) return
    const k = blatt.objekte.find(
      (o): o is KomponentenObjekt => o.type === 'komponente' && o.id === a.komponente,
    )
    if (!k) {
      throw new KiFehler(
        t('kiMeldungen.gemeinsam.keineKomponenteAuf', { id: a.komponente, blatt: blatt.name }),
      )
    }
    const punkte = getDockpoints(k)
    const pos = index === 0 ? 0 : wegpunkte.length - 1
    const kandidaten = punkte.map((p, i) => ({ p, i })).filter(({ i }) => istTrunkDockpunkt(k, i))
    if (kandidaten.length === 0) {
      throw new KiFehler(t('kiMeldungen.trunkAnlegen.keinTrunkDockpunkt'))
    }
    const bester = kandidaten.reduce((x, y) =>
      distance(y.p, wegpunkte[pos]) < distance(x.p, wegpunkte[pos]) ? y : x,
    )
    wegpunkte[pos] = bester.p
    enden[index] = { dockRef: { objektId: k.id, dockpunktIndex: bester.i } }
  })
  for (const a of anschluesse) {
    if (a?.trunk && !blatt.objekte.some((o) => o.type === 'trunk' && o.id === a.trunk)) {
      throw new KiFehler(
        t('kiMeldungen.gemeinsam.keinTrunkAuf', { id: a.trunk, blatt: blatt.name }),
      )
    }
    if (
      a?.schacht &&
      !blatt.objekte.some((o) => o.type === 'kabelschacht' && o.id === a.schacht!.objektId)
    ) {
      throw new KiFehler(
        t('kiMeldungen.gemeinsam.keinKabelschachtAuf', {
          id: a.schacht.objektId,
          blatt: blatt.name,
        }),
      )
    }
  }

  const vorgaben = kontext.vorgaben().verlegeVorgaben
  const zeichnung = doc.getZeichnung()
  const trunk: TrunkObjekt = {
    ...neueObjektBasis(ebeneFuerNeuesObjekt('trunk', blatt.ebenen, blatt.aktiveEbeneId), {
      farbe: TRUNK_STANDARD_FARBE,
      strichstaerke: TRUNK_STANDARD_STRICHSTAERKE,
    }),
    id: erzeugeId('objekt'),
    type: 'trunk',
    name: naechsterFreierTrunkName(zeichnung),
    wegpunkte,
    enden,
    ...(vorgaben.trunkAusfuehrung && vorgaben.trunkAusfuehrung !== 'buendel'
      ? { ausfuehrung: vorgaben.trunkAusfuehrung }
      : {}),
    ...(vorgaben.trunkAusfuehrung && vorgaben.trunkAbmessung
      ? { abmessung: vorgaben.trunkAbmessung }
      : {}),
    ...(vorgaben.trunkZone ? { installationszone: vorgaben.trunkZone } : {}),
  }
  const text = t('kiMeldungen.trunkAnlegen.angelegt', { name: trunk.name, blatt: blatt.name })
  const label = kiLabel(text)
  const settings = kontext.routingSettings()
  const endpunkte = [wegpunkte[0], wegpunkte[wegpunkte.length - 1]]

  const verbinde = (index: 0 | 1) => (): Command | null => {
    const a = anschluesse[index]
    if (!a || a.komponente) return null
    const aktuell = doc.getBlatt(blatt.id)!
    const eigen = endeAuf(aktuell, endpunkte[index], trunk.id)
    if (!eigen) throw new KiFehler(t('kiMeldungen.trunkAnlegen.endeVerloren'))
    if (a.schacht) {
      const schacht = aktuell.objekte.find((o) => o.id === a.schacht!.objektId)
      if (schacht?.type !== 'kabelschacht') return null
      const strang =
        a.schacht.strang ?? naechsteFreieStrangNummer(doc.getZeichnung(), schacht.verbundId)
      return erzeugeSchachtTrunkAnschlussCommand(
        doc,
        blatt.id,
        eigen.trunk.id,
        eigen.ende,
        schacht.id,
        strang,
        label,
        settings,
      )
    }
    const ziel = aktuell.objekte.find(
      (o): o is TrunkObjekt => o.type === 'trunk' && o.id === a.trunk,
    )
    if (!ziel) {
      throw new KiFehler(
        t('kiMeldungen.trunkAnlegen.trunkWeg', { id: a.trunk!, blatt: blatt.name }),
      )
    }
    const punkt = endpunkte[index]
    const zielEnde: 0 | 1 | null =
      distance(ziel.wegpunkte[0], punkt) <= AM_ENDE_M
        ? 0
        : distance(ziel.wegpunkte[ziel.wegpunkte.length - 1], punkt) <= AM_ENDE_M
          ? 1
          : null
    if (zielEnde !== null) {
      return erzeugeTrunkMergeCommand(
        doc,
        blatt.id,
        ziel.id,
        zielEnde,
        eigen.trunk.id,
        eigen.ende,
        settings,
        label,
      ).command
    }
    const treffer = naechsterPunktAufPfad(ziel.wegpunkte, punkt)
    if (!treffer) return null
    const neu = [...eigen.trunk.wegpunkte]
    neu[eigen.ende === 0 ? 0 : neu.length - 1] = treffer.punkt
    endpunkte[index] = treffer.punkt
    return erzeugeTrunkAndockenCommand(
      doc,
      blatt.id,
      eigen.trunk.id,
      eigen.ende,
      ziel.id,
      treffer.t,
      neu,
      settings,
      label,
    ).command
  }

  fuehreAenderungAus(kontext, text, [
    () => erzeugeObjektHinzufuegenCommand(doc, blatt.id, trunk, label),
    verbinde(0),
    verbinde(1),
  ])
  if (vorgaben.trunkZone) kontext.nachZonenZuweisung()
  kontext.meldeAenderung(label)
  const aktuell = doc.getBlatt(blatt.id)!
  const ergebnis =
    aktuell.objekte.find((o): o is TrunkObjekt => o.type === 'trunk' && o.id === trunk.id) ??
    endeAuf(aktuell, endpunkte[1], trunk.id)?.trunk ??
    null
  return {
    daten: {
      trunkId: ergebnis?.id ?? trunk.id,
      name: ergebnis?.name ?? trunk.name,
      ...(ergebnis && ergebnis.id !== trunk.id
        ? { hinweis: t('kiMeldungen.trunkAnlegen.verschmolzen', { name: ergebnis.name }) }
        : {}),
      ...(ergebnis ? { wegpunkte: ergebnis.wegpunkte.map((p) => zuBlatt(p, aktuell)) } : {}),
      rueckgaengig: label,
    },
  }
}
