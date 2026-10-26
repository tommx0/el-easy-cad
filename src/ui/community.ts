import type { ProduktlizenzStatus } from '../persistence'
import type { Uebersetzer } from '../sprache'

export const PROJEKT_URL = 'https://github.com/tommx0/el-easy-cad'

export const COMMUNITY_AUSGABE = 4

export const COMMUNITY_VERSION = `${__APP_VERSION__}-community.${COMMUNITY_AUSGABE}`

export function hinweisAktiv(status: ProduktlizenzStatus | null | undefined): boolean {
  return status?.kommerziell !== true
}

export function gueltigeStufe(status: ProduktlizenzStatus | null | undefined): string | null {
  return status?.betriebsmodus === 'lizenziert' ? (status.unterstuetzer?.stufe ?? null) : null
}

export function ausgabeZeile(
  status: ProduktlizenzStatus | null | undefined,
  t: Uebersetzer,
): string {
  const stufe = gueltigeStufe(status)
  const unterstuetzer = stufe
    ? t('community.hinweis.unterstuetzer', { stufe, name: status?.lizenznehmer ?? '' })
    : ''
  if (!hinweisAktiv(status)) return unterstuetzer
  return [unterstuetzer, t('community.hinweis.ausgabe')].filter(Boolean).join(' ')
}

export function lizenzStatusText(
  status: ProduktlizenzStatus | null | undefined,
  t: Uebersetzer,
): string {
  if (status?.betriebsmodus === 'lizenziert') {
    return status.kommerziell
      ? t('community.lizenz.kommerziell')
      : t('community.lizenz.unterstuetzerOhneKommerz')
  }
  if (status?.status === 'abgelaufen') return t('community.lizenz.abgelaufen')
  if (status?.status === 'ungueltig') return t('community.lizenz.ungueltig')
  return t('community.lizenz.nichtKommerziell')
}
