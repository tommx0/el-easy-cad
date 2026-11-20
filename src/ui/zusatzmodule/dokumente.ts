import type { Blatt, Objekt, Zeichenflaeche, Zeichnung } from '../../document-model'
import {
  erzeugeBlatt,
  erzeugeZeichnung,
  nullpunktVon,
  planUebersetzer,
  uebernimmEbenen,
  vorschlagZeichenflaecheUrsprung,
  zeichnungsEbenen,
} from '../../document-model'
import {
  grundformZuObjekt,
  loeseEbenenAuf,
  objektZuGrundform,
} from '../../document-model/grundform'
import type { Sprache } from '../../sprache'
import type { ZusatzmodulBlatt, ZusatzmodulZeichnung } from './schnittstelle'

export function baueZeichnung(
  aufbau: ZusatzmodulZeichnung,
  kennung: string,
  alt: Zeichnung | null,
  optionen: { behalteFremdes?: boolean; plansprache?: Sprache } = {},
): Zeichnung {
  const basis = alt ?? erzeugeZeichnung(aufbau.name, 'bauplan', optionen.plansprache)
  const tp = planUebersetzer(basis)

  const vorlageEbenen =
    alt && alt.blaetter.length > 0 ? zeichnungsEbenen(alt.blaetter) : basis.blaetter[0].ebenen
  const namen = new Set<string>()
  for (const b of aufbau.blaetter) for (const g of b.objekte) if (g.ebene) namen.add(g.ebene)
  const { ebenen, idFuer } = loeseEbenenAuf(namen, vorlageEbenen)

  const blaetter: Blatt[] = aufbau.blaetter.map((b) => {
    const vorher = alt?.blaetter.find((x) => x.name === b.name)
    const leer = vorher ?? erzeugeBlatt(b.name, 'bauplan', tp)
    const grund = uebernimmEbenen(leer, ebenen)
    const bezug = nullpunktVon(grund)
    const neu = b.objekte.map((g) =>
      grundformZuObjekt(g, g.ebene ? idFuer(g.ebene) : grund.aktiveEbeneId, bezug),
    )
    const behalten: Objekt[] =
      vorher && optionen.behalteFremdes
        ? vorher.objekte.filter((o) => !o.modulDaten?.[kennung])
        : []
    const mitObjekten: Blatt = { ...grund, objekte: [...behalten, ...neu] }
    return { ...mitObjekten, zeichenflaeche: zeichenflaecheFuer(b, mitObjekten) }
  })

  const modulDaten: Record<string, unknown> = { ...basis.modulDaten }
  if (aufbau.modulDaten === undefined) delete modulDaten[kennung]
  else modulDaten[kennung] = aufbau.modulDaten

  return {
    ...basis,
    name: aufbau.name,
    blaetter,
    aktivesBlattId: blaetter[0]?.id ?? basis.aktivesBlattId,
    modulDaten: Object.keys(modulDaten).length > 0 ? modulDaten : undefined,
    zuletztGeaendertAm: new Date().toISOString(),
  }
}

function zeichenflaecheFuer(b: ZusatzmodulBlatt, blatt: Blatt): Zeichenflaeche | null {
  if (!b.zeichenflaeche) return blatt.zeichenflaeche
  const entwurf = {
    papierformat: b.zeichenflaeche.papierformat,
    ausrichtung: b.zeichenflaeche.ausrichtung,
    massstabNenner: b.zeichenflaeche.massstab,
  }
  const bezug = nullpunktVon(blatt)
  const ursprung = b.zeichenflaeche.ursprung
    ? { x: b.zeichenflaeche.ursprung.x + bezug.x, y: b.zeichenflaeche.ursprung.y + bezug.y }
    : vorschlagZeichenflaecheUrsprung(blatt, entwurf)
  return { ...entwurf, ursprung }
}

export function leseZeichnung(zeichnung: Zeichnung, kennung: string): ZusatzmodulZeichnung {
  return {
    name: zeichnung.name,
    modulDaten: zeichnung.modulDaten?.[kennung],
    blaetter: zeichnung.blaetter.map((b) => {
      const bezug = nullpunktVon(b)
      return {
        id: b.id,
        name: b.name,
        zeichenflaeche: b.zeichenflaeche
          ? {
              papierformat: b.zeichenflaeche.papierformat,
              ausrichtung: b.zeichenflaeche.ausrichtung,
              massstab: b.zeichenflaeche.massstabNenner,
              ursprung: {
                x: b.zeichenflaeche.ursprung.x - bezug.x,
                y: b.zeichenflaeche.ursprung.y - bezug.y,
              },
            }
          : undefined,
        objekte: b.objekte
          .map((o) => objektZuGrundform(o, bezug, b.ebenen))
          .filter((g): g is NonNullable<typeof g> => g !== null),
      }
    }),
  }
}
