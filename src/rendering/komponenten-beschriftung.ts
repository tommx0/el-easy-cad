import type { CatalogComponent, Objekt } from '../document-model'
import {
  aufgeloesteVariante,
  BODEN_REIHE_CM,
  DECKE_REIHE_CM,
  istKlemme,
  kennzeichenZeile,
  klemmenKennzeichenZeile,
  stehtAllein,
  verlegungsKuerzel,
  verlegungVon,
} from '../document-model'
import type { ZonenVerlegung } from '../document-model'
import { oberflaechensprache, t } from '../sprache'
import type { Sprache, Uebersetzer } from '../sprache'

export function ermittleBeschriftungszeilen(
  objekt: Extract<Objekt, { type: 'komponente' }>,
  katalogKomponenten: CatalogComponent[],
  poeSummeWatt?: number,
  katalogZeileUnterdruecken?: boolean,
  bezeichnungSichtbar = true,
  beschriftungSichtbar = true,
  installationshoeheSichtbar = true,
  querverweisText?: string,
  kennzeichenSichtbar = true,
  stromkreisText?: string,
  klemmeInReihe = false,
  tp: Uebersetzer = t,
  sprache: Sprache = oberflaechensprache(),
): string[] {
  const komponente = katalogKomponenten.find((k) => k.id === objekt.catalogComponentId)
  let katalogZeile: string | null = null
  if (komponente && !katalogZeileUnterdruecken && bezeichnungSichtbar && !objekt.knxAktor) {
    const aufgeloest = aufgeloesteVariante(komponente, objekt.variantId, sprache)
    const teile = [aufgeloest.artikelnummer, aufgeloest.name].filter((t): t is string => !!t)
    katalogZeile = teile.length > 0 ? teile.join(' · ') : null
  }
  const freieZeile = beschriftungSichtbar ? objekt.beschriftung?.trim() || null : null
  const hoeheZeile = installationshoeheSichtbar ? hoehenZeile(objekt, tp) : null
  const poeZeile =
    poeSummeWatt && poeSummeWatt > 0
      ? tp('beschriftung.komponente.poe', { watt: String(poeSummeWatt) })
      : null
  const querverweisZeile = querverweisText?.trim() || null
  const kennzeichen = !kennzeichenSichtbar
    ? null
    : istKlemme(objekt)
      ? klemmenKennzeichenZeile(objekt, klemmeInReihe)
      : kennzeichenZeile(objekt)
  const stromkreisZeile = stromkreisText?.trim() || null
  return [
    kennzeichen,
    katalogZeile,
    freieZeile,
    stromkreisZeile,
    hoeheZeile,
    poeZeile,
    querverweisZeile,
  ].filter((z): z is string => !!z)
}

export function reihenHoehenText(hoeheCm: number, tp: Uebersetzer = t): string {
  if (hoeheCm === DECKE_REIHE_CM) return tp('beschriftung.komponente.decke')
  if (hoeheCm === BODEN_REIHE_CM) return tp('beschriftung.komponente.boden')
  return tp('beschriftung.komponente.hoehe', { cm: String(hoeheCm) })
}

export function verlegungsText(verlegung: ZonenVerlegung, tp: Uebersetzer = t): string {
  return verlegungsKuerzel(verlegung) === 'UP'
    ? tp('beschriftung.komponente.unterputz')
    : tp('beschriftung.komponente.aufputz')
}

function hoehenZeile(
  objekt: Extract<Objekt, { type: 'komponente' }>,
  tp: Uebersetzer,
): string | null {
  const verlegung = verlegungsText(verlegungVon(objekt), tp)
  if (objekt.kombination) {
    return stehtAllein(objekt)
      ? `${reihenHoehenText(objekt.kombination.hoeheCm, tp)} ${verlegung}`
      : null
  }
  if (objekt.montageort === 'decke' || objekt.montageort === 'boden') return verlegung
  return objekt.installationshoehe != null
    ? `${tp('beschriftung.komponente.hoehe', { cm: String(Math.round(objekt.installationshoehe * 100)) })} ${verlegung}`
    : verlegung
}
