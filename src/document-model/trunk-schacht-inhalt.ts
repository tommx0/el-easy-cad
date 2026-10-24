import type { CatalogComponent } from './catalog'
import type { Kabeltyp } from './kabeltyp'
import { kabeltypText } from './kabeltyp-verwendung'
import {
  ermittleSchachtStraenge,
  findeSchacht,
  schachtEtagenVerweise,
  strangNamenImVerbund,
  strangTitel,
} from './kabelschacht'
import { beschreibeLeitungsEnde, ermittleLeitungsLaenge, kabelEnden } from './leitungslaenge'
import type { LeitungsObjekt, TrunkAusfuehrung, TrunkObjekt } from './objekte'
import { istBuendelEnde } from './objekte'
import type { TrunkKante } from './trunk-kette'
import {
  ermittleTeilstueckNamen,
  ermittleTrunkKette,
  findeTrunkWeg,
  trunkNachbarschaft,
} from './trunk-kette'
import type { Zeichnung } from './zeichnung'

export interface InhaltsKontext {
  katalog: readonly CatalogComponent[]
  kabeltypen: readonly Kabeltyp[]
}

export interface InhaltsLeitung {
  schluessel: string
  blattId: string
  leitung: LeitungsObjekt
  vonNach: string
  kabeltyp: string | null
  laengeMeter: number | null
  teilstuecke: string[]
  hier: boolean
  strang: string | null
  eigenerStrang: number | null
}

export interface InhaltsGruppe {
  schluessel: string
  art: 'trunk' | 'leitung'
  titel: string
  strangTitel: string | null
  strangNummer: number | null
  ausfuehrung: TrunkAusfuehrung
  leitungen: string[]
}

export interface KettenStrang {
  verbundId: string
  schachtName: string
  nummer: number
  name?: string
}

export interface TrunkInhalt {
  art: 'trunk'
  blattId: string
  trunkId: string
  kettenName: string
  teilstuecke: { blattId: string; blattName: string; trunkId: string; name: string }[]
  straenge: KettenStrang[]
  gruppen: InhaltsGruppe[]
  leitungen: InhaltsLeitung[]
}

export interface SchachtInhalt {
  art: 'schacht'
  blattId: string
  schachtId: string
  verbundId: string
  schachtName: string
  blattName: string
  nachOben: string[]
  nachUnten: string[]
  gruppen: InhaltsGruppe[]
  leitungen: InhaltsLeitung[]
}

function trunksNachId(zeichnung: Zeichnung): Map<string, { blattId: string; trunk: TrunkObjekt }> {
  const ergebnis = new Map<string, { blattId: string; trunk: TrunkObjekt }>()
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type === 'trunk') ergebnis.set(o.id, { blattId: blatt.id, trunk: o })
    }
  }
  return ergebnis
}

function wegZuEinemDer(
  zeichnung: Zeichnung,
  blattId: string,
  vonTrunkId: string,
  ziele: readonly string[],
  kanten: Map<string, TrunkKante[]>,
): string[] {
  let bester: string[] | null = null
  for (const ziel of ziele) {
    const weg = findeTrunkWeg(zeichnung, blattId, vonTrunkId, ziel, kanten)
    if (weg && (!bester || weg.length < bester.length)) bester = weg.map((g) => g.trunk.id)
  }
  return bester ?? []
}

export function trunksDerLeitung(
  zeichnung: Zeichnung,
  blattId: string,
  leitung: LeitungsObjekt,
  kanten: Map<string, TrunkKante[]> = trunkNachbarschaft(zeichnung),
  trunks: Map<string, { blattId: string; trunk: TrunkObjekt }> = trunksNachId(zeichnung),
): string[] {
  const durchgaenge = leitung.trunkDurchgaenge
  if (durchgaenge.length === 0) return []
  const ids: string[] = []
  const ergaenze = (liste: readonly string[]) => {
    for (const id of liste) if (!ids.includes(id)) ids.push(id)
  }
  const amSchacht = (schachtId: string) =>
    [...trunks.values()]
      .filter(
        (t) =>
          t.blattId === blattId && t.trunk.enden.some((e) => e.schachtRef?.objektId === schachtId),
      )
      .map((t) => t.trunk.id)

  if (leitung.start.art === 'schacht') {
    const weg = wegZuEinemDer(
      zeichnung,
      blattId,
      durchgaenge[0].trunkId,
      amSchacht(leitung.start.objektId),
      kanten,
    )
    ergaenze([...weg].reverse())
  }
  ergaenze(durchgaenge.map((d) => d.trunkId))
  const letzter = durchgaenge[durchgaenge.length - 1].trunkId
  const ziel = leitung.ziel
  if (istBuendelEnde(ziel)) {
    const amSwitch = [...trunks.values()]
      .filter((t) => t.trunk.enden.some((e) => e.dockRef?.objektId === ziel.objektId))
      .map((t) => t.trunk.id)
    ergaenze(wegZuEinemDer(zeichnung, blattId, letzter, amSwitch, kanten))
  } else if (ziel.art === 'schacht') {
    ergaenze(wegZuEinemDer(zeichnung, blattId, letzter, amSchacht(ziel.objektId), kanten))
  }
  return ids
}

function blattName(zeichnung: Zeichnung, blattId: string): string {
  return zeichnung.blaetter.find((b) => b.id === blattId)?.name ?? '?'
}

function inhaltsLeitung(
  zeichnung: Zeichnung,
  blattId: string,
  leitung: LeitungsObjekt,
  kontext: InhaltsKontext,
): InhaltsLeitung {
  const laenge = ermittleLeitungsLaenge(zeichnung, blattId, leitung.id)
  const enden = kabelEnden(laenge)
  const erstes = laenge.glieder[0]?.blattId ?? blattId
  const letztes = laenge.glieder[laenge.glieder.length - 1]?.blattId ?? blattId
  const von = beschreibeLeitungsEnde(
    zeichnung,
    erstes,
    enden?.start ?? leitung.start,
    kontext.katalog,
  )
  const nach = beschreibeLeitungsEnde(
    zeichnung,
    letztes,
    enden?.ziel ?? leitung.ziel,
    kontext.katalog,
  )
  return {
    schluessel: `${blattId}:${leitung.id}`,
    blattId,
    leitung,
    vonNach: `${von} → ${nach}`,
    kabeltyp: kabeltypText(leitung, kontext.kabeltypen),
    laengeMeter: laenge.status === 'gueltig' ? laenge.verlegeLaengeMeter : null,
    teilstuecke: [],
    hier: true,
    strang: null,
    eigenerStrang: null,
  }
}

const nachNummer = (a: InhaltsLeitung, b: InhaltsLeitung) =>
  a.leitung.nummer - b.leitung.nummer || a.schluessel.localeCompare(b.schluessel)

export function inhaltVonTrunkKette(
  zeichnung: Zeichnung,
  blattId: string,
  trunkId: string,
  kontext: InhaltsKontext,
): TrunkInhalt | null {
  const kanten = trunkNachbarschaft(zeichnung)
  const kette = ermittleTrunkKette(zeichnung, blattId, trunkId, kanten)
  if (kette.length === 0) return null
  const namen = ermittleTeilstueckNamen(zeichnung, kette)
  const inKette = new Set(kette.map((g) => g.trunk.id))
  const trunks = trunksNachId(zeichnung)

  const leitungen: InhaltsLeitung[] = []
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type !== 'leitung') continue
      const weg = trunksDerLeitung(zeichnung, blatt.id, o, kanten, trunks)
      const teilstuecke = weg.filter((id) => inKette.has(id))
      if (teilstuecke.length === 0) continue
      leitungen.push({
        ...inhaltsLeitung(zeichnung, blatt.id, o, kontext),
        teilstuecke: teilstuecke.map((id) => namen.get(id) ?? '?'),
        hier: weg.includes(trunkId),
      })
    }
  }
  leitungen.sort(nachNummer)

  const teilstuecke = zeichnung.blaetter.flatMap((blatt) =>
    blatt.objekte
      .filter((o) => o.type === 'trunk' && inKette.has(o.id))
      .map((o) => ({
        blattId: blatt.id,
        blattName: blatt.name,
        trunkId: o.id,
        name: namen.get(o.id) ?? '?',
      })),
  )

  const straenge: KettenStrang[] = []
  for (const glied of kette) {
    for (const ende of glied.trunk.enden) {
      const ref = ende.schachtRef
      if (!ref) continue
      const schacht = findeSchacht(zeichnung, glied.blattId, ref.objektId)
      if (!schacht) continue
      if (straenge.some((s) => s.verbundId === schacht.verbundId && s.nummer === ref.strang)) {
        continue
      }
      straenge.push({
        verbundId: schacht.verbundId,
        schachtName: schacht.name,
        nummer: ref.strang,
        name: strangNamenImVerbund(zeichnung, schacht.verbundId)[String(ref.strang)],
      })
    }
  }

  const angeklickt = kette.find((g) => g.trunk.id === trunkId)!.trunk
  return {
    art: 'trunk',
    blattId,
    trunkId,
    kettenName: angeklickt.name,
    teilstuecke,
    straenge,
    gruppen: [
      {
        schluessel: `trunk:${trunkId}`,
        art: 'trunk',
        titel: angeklickt.name,
        strangTitel: null,
        strangNummer: null,
        ausfuehrung: angeklickt.ausfuehrung ?? 'buendel',
        leitungen: leitungen.map((l) => l.schluessel),
      },
    ],
    leitungen,
  }
}

export function inhaltVonSchacht(
  zeichnung: Zeichnung,
  blattId: string,
  schachtId: string,
  kontext: InhaltsKontext,
): SchachtInhalt | null {
  const schacht = findeSchacht(zeichnung, blattId, schachtId)
  if (!schacht) return null
  const kanten = trunkNachbarschaft(zeichnung)
  const trunks = trunksNachId(zeichnung)
  const namen = strangNamenImVerbund(zeichnung, schacht.verbundId)
  const titel = (nummer: number) => strangTitel(nummer, namen[String(nummer)])
  const straenge = ermittleSchachtStraenge(zeichnung, schacht.verbundId)
  const hier = straenge.filter((s) => s.anschluesse.some((a) => a.schachtId === schachtId))

  const alle: { blattId: string; leitung: LeitungsObjekt; weg: string[] }[] = []
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type === 'leitung') {
        alle.push({
          blattId: blatt.id,
          leitung: o,
          weg: trunksDerLeitung(zeichnung, blatt.id, o, kanten, trunks),
        })
      }
    }
  }

  const gruppen: InhaltsGruppe[] = []
  const leitungen = new Map<string, InhaltsLeitung>()
  const nimmAuf = (
    gruppe: InhaltsGruppe,
    eintrag: { blattId: string; leitung: LeitungsObjekt },
    angaben: Pick<InhaltsLeitung, 'strang' | 'eigenerStrang'>,
  ) => {
    const zeile = inhaltsLeitung(zeichnung, eintrag.blattId, eintrag.leitung, kontext)
    if (leitungen.has(zeile.schluessel)) return
    leitungen.set(zeile.schluessel, { ...zeile, ...angaben })
    gruppe.leitungen.push(zeile.schluessel)
  }

  const trunkGruppen = new Map<string, InhaltsGruppe>()
  for (const strang of hier.filter((s) => s.art === 'trunk')) {
    const andere = new Set(
      strang.anschluesse.filter((a) => a.schachtId !== schachtId).map((a) => a.objektId),
    )
    for (const anschluss of strang.anschluesse.filter((a) => a.schachtId === schachtId)) {
      const trunk = trunks.get(anschluss.objektId)?.trunk
      if (!trunk) continue
      const gruppe: InhaltsGruppe = {
        schluessel: `trunk:${trunk.id}`,
        art: 'trunk',
        titel: trunk.name,
        strangTitel: titel(strang.nummer),
        strangNummer: strang.nummer,
        ausfuehrung: trunk.ausfuehrung ?? 'buendel',
        leitungen: [],
      }
      gruppen.push(gruppe)
      trunkGruppen.set(trunk.id, gruppe)
      for (const eintrag of alle) {
        if (eintrag.weg.includes(trunk.id) && eintrag.weg.some((id) => andere.has(id))) {
          nimmAuf(gruppe, eintrag, {
            strang: `${titel(strang.nummer)} (Trunk)`,
            eigenerStrang: null,
          })
        }
      }
    }
  }

  for (const strang of hier.filter((s) => s.art === 'leitung')) {
    for (const anschluss of strang.anschluesse.filter((a) => a.schachtId === schachtId)) {
      const eintrag = alle.find(
        (e) => e.blattId === anschluss.blattId && e.leitung.id === anschluss.objektId,
      )
      if (!eintrag) continue
      const rahmen = eintrag.weg.map((id) => trunkGruppen.get(id)).find((g) => g !== undefined)
      if (rahmen) {
        nimmAuf(rahmen, eintrag, { strang: titel(strang.nummer), eigenerStrang: strang.nummer })
        continue
      }
      const gruppe: InhaltsGruppe = {
        schluessel: `strang:${strang.nummer}`,
        art: 'leitung',
        titel: '',
        strangTitel: titel(strang.nummer),
        strangNummer: strang.nummer,
        ausfuehrung: 'buendel',
        leitungen: [],
      }
      gruppen.push(gruppe)
      nimmAuf(gruppe, eintrag, { strang: titel(strang.nummer), eigenerStrang: null })
    }
  }

  for (const gruppe of gruppen) {
    gruppe.leitungen.sort((a, b) => nachNummer(leitungen.get(a)!, leitungen.get(b)!))
  }
  const verweise = schachtEtagenVerweise(zeichnung, blattId, schacht.verbundId)
  return {
    art: 'schacht',
    blattId,
    schachtId,
    verbundId: schacht.verbundId,
    schachtName: schacht.name,
    blattName: blattName(zeichnung, blattId),
    nachOben: verweise.nachOben.map((b) => b.name),
    nachUnten: verweise.nachUnten.map((b) => b.name),
    gruppen,
    leitungen: [...leitungen.values()].sort(nachNummer),
  }
}
