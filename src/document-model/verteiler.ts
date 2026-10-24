import type { KomponentenObjekt, Objekt } from './objekte'
import type { Zeichnung } from './zeichnung'

export const VERTEILER_KENNZEICHEN_PRAEFIX = 'UV'

export function istVerteiler(
  objekt: Objekt,
): objekt is KomponentenObjekt & { verteiler: NonNullable<KomponentenObjekt['verteiler']> } {
  return objekt.type === 'komponente' && objekt.verteiler !== undefined
}

export function normiereVerteilerKennzeichen(eingabe: string): string {
  return eingabe
    .trim()
    .replace(/^\+\s*/, '')
    .trim()
}

export function verteilerKennzeichenText(kennzeichen: string): string {
  return `+${kennzeichen}`
}

export function alleVerteiler(
  zeichnung: Pick<Zeichnung, 'blaetter'>,
): { blattId: string; blattName: string; verteiler: KomponentenObjekt }[] {
  const ergebnis: { blattId: string; blattName: string; verteiler: KomponentenObjekt }[] = []
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (istVerteiler(objekt))
        ergebnis.push({ blattId: blatt.id, blattName: blatt.name, verteiler: objekt })
    }
  }
  return ergebnis
}

export function naechstesVerteilerKennzeichen(
  zeichnung: Pick<Zeichnung, 'blaetter'>,
  weitere: readonly string[] = [],
): string {
  const belegt = new Set([
    ...alleVerteiler(zeichnung).map((v) => v.verteiler.verteiler?.kennzeichen ?? ''),
    ...weitere,
  ])
  let n = 1
  while (belegt.has(`${VERTEILER_KENNZEICHEN_PRAEFIX}${n}`)) n++
  return `${VERTEILER_KENNZEICHEN_PRAEFIX}${n}`
}

export function kennzeichenZeile(objekt: KomponentenObjekt): string | null {
  const ort = objekt.verteiler?.kennzeichen.trim()
  if (ort) return verteilerKennzeichenText(ort)
  const kennzeichen = objekt.geraeteKennzeichen?.trim()
  return kennzeichen ? `-${kennzeichen}` : null
}
