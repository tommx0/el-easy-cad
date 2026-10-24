import type {
  Blatt,
  CatalogComponent,
  Kabeltyp,
  LeitungsObjekt,
  TrunkObjekt,
} from '../document-model'
import {
  baueVerteilerBaum,
  effektiveSichtbarkeit,
  istVerteiler,
  kabeltypText,
  verteilerSchildTextAusBaum,
} from '../document-model'

export function ermittleLeitungsZusatzzeilen(
  leitung: LeitungsObjekt,
  blatt: Blatt,
  kabeltypen: readonly Kabeltyp[] = [],
  katalog: readonly CatalogComponent[] = [],
): string[] {
  const typZeile = effektiveSichtbarkeit(leitung.typSichtbar, blatt.leitungTypSichtbar)
    ? kabeltypText(leitung, kabeltypen)
    : null
  const beschreibungZeile = effektiveSichtbarkeit(
    leitung.beschreibungSichtbar,
    blatt.leitungBeschreibungSichtbar,
  )
    ? leitung.beschreibung?.trim() || null
    : null
  return [...verteilerZeilen(leitung, blatt, katalog), typZeile, beschreibungZeile].filter(
    (z): z is string => !!z,
  )
}

function verteilerZeilen(
  leitung: LeitungsObjekt,
  blatt: Blatt,
  katalog: readonly CatalogComponent[],
): string[] {
  if (!leitung.verteilerAnschluesse?.length) return []
  const zeilen: string[] = []
  for (const ende of ['start', 'ziel'] as const) {
    const e = leitung[ende]
    if (e.art !== 'dock') continue
    const verteiler = blatt.objekte.find((o) => o.id === e.objektId)
    if (!verteiler || !istVerteiler(verteiler)) continue
    const anschluesse = leitung.verteilerAnschluesse.filter((a) => a.ende === ende)
    if (anschluesse.length > 0)
      zeilen.push(
        `→ ${verteilerSchildTextAusBaum(
          verteiler.verteiler.kennzeichen,
          baueVerteilerBaum(verteiler, katalog),
          anschluesse,
          blatt.stromkreisSchildSichtbar,
        )}`,
      )
  }
  return zeilen
}

export function ermittleTrunkZusatzzeilen(trunk: TrunkObjekt, blatt: Blatt): string[] {
  const beschreibungZeile = effektiveSichtbarkeit(
    trunk.beschreibungSichtbar,
    blatt.trunkBeschreibungSichtbar,
  )
    ? trunk.beschreibung?.trim() || null
    : null
  return beschreibungZeile ? [beschreibungZeile] : []
}
