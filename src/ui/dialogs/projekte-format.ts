import {
  formatiereDatum,
  formatiereDatumUhrzeit as formatiereDatumUhrzeitSprache,
  formatiereZahl,
  t,
} from '../../sprache'

export function formatiereZeitpunkt(iso: string, jetzt: Date = new Date()): string {
  const zeitpunkt = new Date(iso)
  if (Number.isNaN(zeitpunkt.getTime())) return ''

  const tage = tageDazwischen(zeitpunkt, jetzt)
  if (tage <= 0) return t('verwaltungsdialoge.projekteFormat.heute')
  if (tage === 1) return t('verwaltungsdialoge.projekteFormat.gestern')
  if (tage < 7) return t('verwaltungsdialoge.projekteFormat.vorTagen', { n: tage })
  return formatiereDatum(zeitpunkt)
}

export function formatiereDatumUhrzeit(iso: string): string {
  return formatiereDatumUhrzeitSprache(iso)
}

function tageDazwischen(frueher: Date, spaeter: Date): number {
  const a = new Date(frueher.getFullYear(), frueher.getMonth(), frueher.getDate()).getTime()
  const b = new Date(spaeter.getFullYear(), spaeter.getMonth(), spaeter.getDate()).getTime()
  return Math.round((b - a) / 86_400_000)
}

export function formatiereBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${formatiereZahl(Math.round(bytes / 1024))} kB`
  const mb = formatiereZahl(bytes / (1024 * 1024), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return `${mb} MB`
}

export function formatiereDokumentzahl(anzahl: number): string {
  return t('verwaltungsdialoge.projekteFormat.dokumente', { n: anzahl })
}
