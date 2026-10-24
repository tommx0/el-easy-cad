import { t } from '../sprache'
import type { Schluessel, Uebersetzer } from '../sprache'
import type { CatalogComponent } from './catalog'
import { neueBestueckungsEintraege, neueStromkreise } from './bestueckung'
import type { BestueckungsEintrag, KomponentenObjekt } from './objekte'
import { neueObjektBasis } from './objekte'
import type { VerteilerArt } from './verteiler-art'
import type { VerteilerNetz } from './verteiler-netz'

export const VERTEILER_ARTEN: readonly { art: VerteilerArt; readonly name: string }[] = [
  {
    art: 'HV',
    get name() {
      return verteilerArtName('HV')
    },
  },
  {
    art: 'UV',
    get name() {
      return verteilerArtName('UV')
    },
  },
]

export function verteilerArtName(art: VerteilerArt, uebersetze: Uebersetzer = t): string {
  if (art === 'HV') return uebersetze('generatoren.assistent.art.HV')
  if (art === 'UV') return uebersetze('generatoren.assistent.art.UV')
  return uebersetze('generatoren.assistent.verteilung')
}

export interface VerteilerAngaben {
  art: VerteilerArt
  etage?: string
  wohnung?: string
  verwendung?: string
}

export const ETAGEN_VORSCHLAEGE = ['KG', 'EG', 'OG1', 'OG2', 'OG3', 'DG', 'SB'] as const

const VERWENDUNG_SCHLUESSEL: readonly Schluessel[] = [
  'generatoren.assistent.verwendung.allgemein',
  'generatoren.assistent.verwendung.kueche',
  'generatoren.assistent.verwendung.garage',
  'generatoren.assistent.verwendung.photovoltaik',
  'generatoren.assistent.verwendung.heizung',
  'generatoren.assistent.verwendung.werkstatt',
  'generatoren.assistent.verwendung.aussenanlage',
  'generatoren.assistent.verwendung.aufzug',
]

export function verwendungVorschlaege(uebersetze: Uebersetzer = t): string[] {
  return VERWENDUNG_SCHLUESSEL.map((s) => uebersetze(s))
}

function kennzeichenTeil(text: string | undefined): string {
  return (text ?? '').replace(/[\s.+]/g, '')
}

export function verteilerKennzeichenVorschlag(
  angaben: VerteilerAngaben,
  vergeben: readonly string[],
): string {
  const rest = [kennzeichenTeil(angaben.etage), kennzeichenTeil(angaben.wohnung)].filter(Boolean)
  const mit = (art: string) => [art, ...rest].join('.')
  const belegt = new Set(vergeben)
  if (!belegt.has(mit(angaben.art))) return mit(angaben.art)
  let n = 2
  while (belegt.has(mit(`${angaben.art}${n}`))) n++
  return mit(`${angaben.art}${n}`)
}

export function verteilerplanNameVorschlag(
  angaben: VerteilerAngaben,
  kennzeichen: string,
  uebersetze: Uebersetzer = t,
): string {
  const art = verteilerArtName(angaben.art, uebersetze)
  const kopf = [art, angaben.etage?.trim(), angaben.wohnung?.trim()].filter(Boolean).join(' ')
  const verwendung = angaben.verwendung?.trim()
  return `${kopf}${verwendung ? ` – ${verwendung}` : ''}${kennzeichen ? ` (+${kennzeichen})` : ''}`
}

export interface Schnellvorgabe {
  art: VerteilerArt
  drehstrom: boolean
  sls: boolean
  blitzschutz: boolean
  zaehler: boolean
  sicherungNachZaehler: boolean
  rcd: number
  rcdTyp: string
  lsJeRcd: number
  lsTyp: string
  klemmeJeLs: boolean
  einspeiseklemme: boolean
}

export function netzDerVorgabe(vorgabe: Pick<Schnellvorgabe, 'drehstrom'>): VerteilerNetz {
  return vorgabe.drehstrom ? 'drehstrom' : 'wechselstrom'
}

export const STANDARD_SCHNELLVORGABE: Schnellvorgabe = {
  art: 'HV',
  drehstrom: true,
  sls: true,
  blitzschutz: true,
  zaehler: true,
  sicherungNachZaehler: true,
  rcd: 2,
  rcdTyp: '',
  lsJeRcd: 6,
  lsTyp: '',
  klemmeJeLs: true,
  einspeiseklemme: true,
}

export const SCHNELLVORGABE_KATALOG_ID = {
  sls: { drehstrom: 'sls-schalter-4-polig', wechselstrom: 'sls-schalter-2-polig' },
  blitzschutz: {
    drehstrom: 'blitzschutzableiter-4-polig',
    wechselstrom: 'blitzschutzableiter-2-polig',
  },
  sicherungNachZaehler: {
    drehstrom: 'schmelzsicherung-3-polig',
    wechselstrom: 'schmelzsicherung-2-polig',
  },
  zaehler: { drehstrom: 'zaehler-3-polig', wechselstrom: 'zaehler-2-polig' },
  rcd: { drehstrom: 'rcd-4-polig', wechselstrom: 'rcd-2-polig' },
  ls: 'leitungsschutzschalter-1-polig',
  klemme: 'abgangsklemme-1p-n-pe',
  einspeiseklemme: { drehstrom: 'abgangsklemme-3p-n-pe', wechselstrom: 'abgangsklemme-1p-n-pe' },
} as const

export const EINSPEISE_KLEMMENLEISTE = 'X0'

export function wirksameVorgabe(vorgabe: Schnellvorgabe): Schnellvorgabe {
  return vorgabe.art === 'UV'
    ? { ...vorgabe, sls: false, blitzschutz: false, zaehler: false, sicherungNachZaehler: false }
    : vorgabe
}

function mitTyp(eintraege: BestueckungsEintrag[], typ: string): BestueckungsEintrag[] {
  const wert = typ.trim()
  if (!wert) return eintraege
  return eintraege.map((e) => ({ ...e, variablen: { ...e.variablen, Typ: wert } }))
}

export function startBestueckung(
  schnellvorgabe: Schnellvorgabe,
  katalog: readonly CatalogComponent[],
): { liste: BestueckungsEintrag[]; fehlend: string[] } {
  const vorgabe = wirksameVorgabe(schnellvorgabe)
  const netz = vorgabe.drehstrom ? 'drehstrom' : 'wechselstrom'
  const fehlend: string[] = []
  const eintrag = (id: string) => {
    const k = katalog.find((c) => c.id === id)
    if (!k && !fehlend.includes(id)) fehlend.push(id)
    return k
  }
  const liste: BestueckungsEintrag[] = []
  let eltern: string | undefined
  const glied = (id: string, an: string | undefined) => {
    const k = eintrag(id)
    if (!k) return undefined
    const [neu] = neueBestueckungsEintraege(liste, k, 1, an, {
      leiste: EINSPEISE_KLEMMENLEISTE,
      katalog,
    })
    if (!neu) return undefined
    delete neu.phase
    liste.push(neu)
    return neu
  }
  if (vorgabe.einspeiseklemme)
    eltern = glied(SCHNELLVORGABE_KATALOG_ID.einspeiseklemme[netz], eltern)?.id ?? eltern
  const vorBlitzschutz = eltern
  if (vorgabe.sls) eltern = glied(SCHNELLVORGABE_KATALOG_ID.sls[netz], eltern)?.id ?? eltern
  if (vorgabe.blitzschutz) glied(SCHNELLVORGABE_KATALOG_ID.blitzschutz[netz], vorBlitzschutz)
  if (vorgabe.zaehler) eltern = glied(SCHNELLVORGABE_KATALOG_ID.zaehler[netz], eltern)?.id ?? eltern
  if (vorgabe.sicherungNachZaehler)
    eltern = glied(SCHNELLVORGABE_KATALOG_ID.sicherungNachZaehler[netz], eltern)?.id ?? eltern
  const ls = eintrag(SCHNELLVORGABE_KATALOG_ID.ls)
  const klemme = vorgabe.klemmeJeLs ? (eintrag(SCHNELLVORGABE_KATALOG_ID.klemme) ?? null) : null
  const stromkreise = (hinter: string | undefined) => {
    if (!ls || vorgabe.lsJeRcd < 1) return
    const neu = neueStromkreise(liste, ls, klemme, vorgabe.lsJeRcd, hinter, { katalog })
    liste.push(
      ...neu.map((e) => (e.catalogComponentId === ls.id ? mitTyp([e], vorgabe.lsTyp)[0] : e)),
    )
  }
  const rcd = vorgabe.rcd > 0 ? eintrag(SCHNELLVORGABE_KATALOG_ID.rcd[netz]) : undefined
  if (!rcd) stromkreise(eltern)
  else
    for (let i = 0; i < vorgabe.rcd; i++) {
      const [r] = mitTyp(neueBestueckungsEintraege(liste, rcd, 1, eltern), vorgabe.rcdTyp)
      if (!r) break
      liste.push(r)
      stromkreise(r.id)
    }
  return {
    liste: vorgabe.drehstrom ? liste : liste.map((e) => (e.phase ? { ...e, phase: 'L1' } : e)),
    fehlend,
  }
}

export function assistentVerteiler(
  kennzeichen: string,
  bestueckung: BestueckungsEintrag[],
  netz: VerteilerNetz = 'drehstrom',
  art?: VerteilerArt,
): KomponentenObjekt & { verteiler: NonNullable<KomponentenObjekt['verteiler']> } {
  return {
    ...neueObjektBasis('assistent'),
    id: 'verteilerplan-assistent',
    type: 'komponente',
    position: { x: 0, y: 0 },
    drehung: 0,
    groesseWelt: 0.4,
    catalogComponentId: 'verteiler',
    variantId: null,
    verteiler: {
      kennzeichen,
      bestueckung,
      ...(netz === 'wechselstrom' ? { netz } : {}),
      ...(art ? { art } : {}),
    },
  }
}
