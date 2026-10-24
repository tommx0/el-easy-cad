import type { BoundingBox, Point } from './geometry'
import { baueLeitungsbaumModell } from './leitungsbaum'
import { bauePlankopfModell } from './plankopf'
import type { Objekt } from './objekte'
import { getBoundingBox } from './objekte'
import type { TabellenKontext } from './tabellen'
import { baueTabellenModell } from './tabellen'

export function ermittleObjektBoundingBox(objekt: Objekt, kontext?: TabellenKontext): BoundingBox {
  if (!kontext) return getBoundingBox(objekt)

  const groesse = plangroesse(objekt, kontext)
  if (!groesse) return getBoundingBox(objekt)
  return {
    min: { x: groesse.position.x, y: groesse.position.y - groesse.hoehe },
    max: { x: groesse.position.x + groesse.breite, y: groesse.position.y },
  }
}

function plangroesse(
  objekt: Objekt,
  kontext: TabellenKontext,
): { position: Point; breite: number; hoehe: number } | null {
  switch (objekt.type) {
    case 'stueckliste':
    case 'leitungsliste':
    case 'switchplan':
    case 'trunkliste':
    case 'raumliste':
    case 'betriebsmittelliste':
    case 'stromkreisverzeichnis':
    case 'aktorkanalliste':
    case 'potentialliste':
    case 'steuerungslogik': {
      const modell = baueTabellenModell(objekt, kontext)
      return {
        position: objekt.position,
        breite: modell.gesamtBreite,
        hoehe: modell.gesamtHoehe,
      }
    }
    case 'leitungsbaum': {
      const modell = baueLeitungsbaumModell(objekt, kontext)
      return {
        position: objekt.position,
        breite: modell.gesamtBreite,
        hoehe: modell.gesamtHoehe,
      }
    }
    case 'plankopf': {
      const modell = bauePlankopfModell(objekt, kontext)
      return {
        position: objekt.position,
        breite: modell.gesamtBreite,
        hoehe: modell.gesamtHoehe,
      }
    }
    default:
      return null
  }
}
