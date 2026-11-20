import type {
  CatalogComponent,
  KomponentenObjekt,
  KnxAktorDaten,
  KnxKanalFunktion,
  SlotZiel,
  VerteilerBaum,
  VerteilerKnoten,
  Zeichnung,
} from '../../document-model'
import {
  alleVerteiler,
  aufgeloesteVariante,
  baueVerteilerBaum,
  ermittleAnsteuerung,
  ermittleKnxZiele,
  ermittleStromkreisZuordnungen,
  ermittleStromweg,
  ermittleTypUndSlots,
  istKnxGeraet,
  knxKanalIndexAusName,
  nameAusRaum,
  planUebersetzer,
  raumDerKomponente,
  spracheDesUebersetzers,
} from '../../document-model'
import type { KiErgebnis, KiKontext } from './kontext'
import { runde } from './kontext'

interface Mitglied {
  blattId: string
  objektId: string
  raumId?: string
  katalogId: string
  katalog: string
  kategorie?: string
  ifcKlasse?: string
  beschriftung?: string
}

interface Kanal {
  verteiler: string
  kanal: string
  funktion?: KnxKanalFunktion
}

interface Ziel {
  schluessel: string
  art: 'gruppe' | 'instanz'
  gruppeId?: string
  name?: string
  nameAusRaum?: string
  geraetetyp?: string
  ansteuerung?: string
  knx: boolean
  mitglieder: Mitglied[]
  ausloeser: { name: string; slot: string }[]
  kanaele: Kanal[]
}

const REGLER_MUSTER = /\bRTR\b|raumtemperatur|temperaturregler|thermostat/i

function zielSchluessel(blattId: string, objekt: KomponentenObjekt): string {
  return objekt.gruppeId ? `gruppe:${objekt.gruppeId}` : `instanz:${blattId}:${objekt.id}`
}

function schluesselVonSlotZiel(ziel: SlotZiel, zeichnung: Zeichnung): string | null {
  if (ziel.art === 'gruppe') return `gruppe:${ziel.gruppeId}`
  const objekt = zeichnung.blaetter
    .find((b) => b.id === ziel.blattId)
    ?.objekte.find((o) => o.id === ziel.objektId)
  if (objekt?.type !== 'komponente') return null
  return zielSchluessel(ziel.blattId, objekt)
}

function kanalFunktion(baum: VerteilerBaum, kanal: string): KnxKanalFunktion | undefined {
  const knoten = baum.knoten.find((k) => k.schluessel === kanal)
  return knoten ? funktionAm(knoten) : undefined
}

function funktionAm(knoten: VerteilerKnoten): KnxKanalFunktion | undefined {
  const daten: KnxAktorDaten | undefined = knoten.geraet.knxAktor
  const index = knoten.kanal ? knxKanalIndexAusName(knoten.kanal) : null
  return daten && index !== null ? daten.kanaele[index]?.funktion : undefined
}

export function steuerungLesen(_eingabe: unknown, kontext: KiKontext): KiErgebnis {
  const zeichnung = kontext.doc.getZeichnung()
  const katalog: readonly CatalogComponent[] = kontext.katalogKomponenten()
  const katalogVon = new Map(katalog.map((k) => [k.id, k]))
  const { verteilerplaene } = kontext.verknuepfteZeichnungen()
  const tp = planUebersetzer(zeichnung)
  const sprache = spracheDesUebersetzers(tp)

  const knxZiele = ermittleKnxZiele(zeichnung, katalog, tp)
  const ziele = new Map<string, Ziel>()
  const kanaeleJe = new Map<string, Kanal[]>()
  const fuegeKanalHinzu = (schluessel: string, kanal: Kanal) => {
    const liste = kanaeleJe.get(schluessel) ?? []
    if (!liste.some((k) => k.verteiler === kanal.verteiler && k.kanal === kanal.kanal))
      liste.push(kanal)
    kanaeleJe.set(schluessel, liste)
  }

  const baeume = new Map<string, { kennzeichen: string; baum: VerteilerBaum }>()
  const verteiler = alleVerteiler(zeichnung).map(({ blattId, verteiler: v }) => {
    const kennzeichen = v.verteiler?.kennzeichen ?? ''
    const plan = verteilerplaene.find((p) => p.verteilerKennzeichen === kennzeichen) ?? null
    const baum = baueVerteilerBaum(v, katalog, plan)
    baeume.set(v.id, { kennzeichen, baum })
    for (const knoten of baum.knoten) {
      const quelle = knoten.eintrag.quelle
      if (quelle?.art !== 'knx') continue
      const kanalKnoten = ermittleStromweg(knoten).kontakte.find((k) => k.kanal)
      const schluessel = schluesselVonSlotZiel(quelle.ziel, zeichnung)
      if (!kanalKnoten || !schluessel) continue
      fuegeKanalHinzu(schluessel, {
        verteiler: kennzeichen,
        kanal: kanalKnoten.schluessel,
        ...(funktionAm(kanalKnoten) ? { funktion: funktionAm(kanalKnoten) } : {}),
      })
    }
    return {
      objektId: v.id,
      blattId,
      kennzeichen,
      knxKanaele: baum.kanalGeraete.reduce(
        (n, g) => n + (g.geraet.knxAktor?.kanaele.length ?? 0),
        0,
      ),
    }
  })
  const zuordnungen = ermittleStromkreisZuordnungen(zeichnung, katalog, verteilerplaene)

  const reglerJeRaum = new Map<string, { objektId: string; katalog: string }[]>()

  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type !== 'komponente' || o.verteiler || o.knxAktor) continue
      const eintrag = katalogVon.get(o.catalogComponentId)
      const katalogName = eintrag
        ? aufgeloesteVariante(eintrag, o.variantId, sprache).name
        : o.catalogComponentId
      const raum = raumDerKomponente(blatt.objekte, o)
      const typ = ermittleTypUndSlots(o, zeichnung)?.typ

      if (
        raum &&
        typ === 'bediengeraet' &&
        istKnxGeraet(o, katalog) &&
        REGLER_MUSTER.test(`${eintrag?.name ?? ''} ${eintrag?.kategorie ?? ''}`)
      ) {
        reglerJeRaum.set(raum.id, [
          ...(reglerJeRaum.get(raum.id) ?? []),
          { objektId: o.id, katalog: katalogName },
        ])
      }

      if (typ !== 'verbraucher' && typ !== 'anschlussdose') continue
      const schluessel = zielSchluessel(blatt.id, o)
      for (const z of zuordnungen.komponentenUnverdichtet.get(o.id) ?? []) {
        if (!z.kanal) continue
        const baum = baeume.get(z.verteilerId)
        const funktion = baum ? kanalFunktion(baum.baum, z.kanal) : undefined
        fuegeKanalHinzu(schluessel, {
          verteiler: z.verteilerKennzeichen,
          kanal: z.kanal,
          ...(funktion ? { funktion } : {}),
        })
      }
      const ansteuerung = ermittleAnsteuerung(o, zeichnung)
      const knx = knxZiele.get(`${blatt.id}#${o.id}`)
      if (!ansteuerung && !knx && !kanaeleJe.has(schluessel)) continue

      const gruppe = o.gruppeId
        ? zeichnung.geraeteGruppen.find((g) => g.id === o.gruppeId)
        : undefined
      let ziel = ziele.get(schluessel)
      if (!ziel) {
        const name = gruppe ? gruppe.name?.trim() : o.beschriftung?.trim()
        const ausRaum = nameAusRaum(zeichnung, blatt.id, o)
        ziel = {
          schluessel,
          art: gruppe ? 'gruppe' : 'instanz',
          ...(gruppe ? { gruppeId: gruppe.id } : {}),
          ...(name ? { name } : {}),
          ...(ausRaum ? { nameAusRaum: ausRaum } : {}),
          ...(typ ? { geraetetyp: typ } : {}),
          ...(ansteuerung ? { ansteuerung } : {}),
          knx: false,
          mitglieder: [],
          ausloeser: [],
          kanaele: [],
        }
        ziele.set(schluessel, ziel)
      }
      if (knx) {
        ziel.knx = true
        for (const a of knx.ausloeser)
          if (!ziel.ausloeser.some((b) => b.name === a.name && b.slot === a.slot))
            ziel.ausloeser.push({ name: a.name, slot: a.slot })
      }
      ziel.mitglieder.push({
        blattId: blatt.id,
        objektId: o.id,
        ...(raum ? { raumId: raum.id } : {}),
        katalogId: o.catalogComponentId,
        katalog: katalogName,
        ...(eintrag?.kategorie ? { kategorie: eintrag.kategorie } : {}),
        ...(eintrag?.ifcKlasse ? { ifcKlasse: eintrag.ifcKlasse } : {}),
        ...(o.beschriftung?.trim() ? { beschriftung: o.beschriftung.trim() } : {}),
      })
    }
  }
  for (const [schluessel, kanaele] of kanaeleJe) {
    const ziel = ziele.get(schluessel)
    if (ziel) ziel.kanaele = kanaele
  }

  return {
    daten: {
      etagen: zeichnung.blaetter.map((b) => ({
        blattId: b.id,
        name: b.name,
        ...(b.geschoss?.kote !== undefined ? { koteM: runde(b.geschoss.kote, 3) } : {}),
      })),
      raeume: zeichnung.blaetter.flatMap((b) =>
        b.objekte.flatMap((o) =>
          o.type === 'raum'
            ? [
                {
                  id: o.id,
                  blattId: b.id,
                  name: o.name,
                  ...(o.raumart ? { raumart: o.raumart } : {}),
                  ...(o.einzelraumregelung ? { einzelraumregelung: o.einzelraumregelung } : {}),
                  ...(reglerJeRaum.has(o.id) ? { knxRegler: reglerJeRaum.get(o.id) } : {}),
                },
              ]
            : [],
        ),
      ),
      ziele: [...ziele.values()].map((z) => ({
        ...z,
        ...(z.ausloeser.length === 0 ? { ausloeser: undefined } : {}),
        ...(z.kanaele.length === 0 ? { kanaele: undefined } : {}),
      })),
      verteiler,
    },
  }
}
