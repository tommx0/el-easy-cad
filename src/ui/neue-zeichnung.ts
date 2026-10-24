import type { Zeichnungsart } from '../document-model'
import { STANDARD_ZEICHNUNGSART } from '../document-model'
import {
  istSprache,
  oberflaechensprache,
  SPRACH_EIGENNAMEN,
  SPRACHEN,
  SPRACHWAHL_FREIGEGEBEN,
  t,
} from '../sprache'
import type { Sprache } from '../sprache'
import type { EingabeDialogOptionen } from '../tools'

export function neueZeichnungDialogOptionen(
  anfangsname: string,
  verteilerOhnePlan: readonly string[] = [],
): EingabeDialogOptionen {
  const arten: Zeichnungsart[] = ['bauplan', 'schaltplan']
  return {
    titel: t('verwaltungsdialoge.neueZeichnung.titel'),
    label: t('verwaltungsdialoge.neueZeichnung.name'),
    anfangswert: anfangsname,
    auswahl: {
      label: t('verwaltungsdialoge.neueZeichnung.art'),
      optionen: [
        ...arten.map((art) => ({
          wert: art,
          text: t(
            art === 'schaltplan'
              ? 'verwaltungsdialoge.neueZeichnung.schaltplan'
              : 'verwaltungsdialoge.neueZeichnung.bauplan',
          ),
        })),
        ...verteilerOhnePlan.map((kennzeichen) => ({
          wert: `${VERTEILERPLAN_PRAEFIX}${kennzeichen}`,
          text: t('verwaltungsdialoge.neueZeichnung.verteilerplanFuer', { kennzeichen }),
        })),
      ],
      anfangswert: STANDARD_ZEICHNUNGSART,
    },
    ...(SPRACHWAHL_FREIGEGEBEN
      ? {
          zweiteAuswahl: {
            label: t('verwaltungsdialoge.neueZeichnung.plansprache'),
            optionen: SPRACHEN.map((sprache) => ({
              wert: sprache,
              text: SPRACH_EIGENNAMEN[sprache],
            })),
            anfangswert: oberflaechensprache(),
          },
        }
      : {}),
    hinweis: t('verwaltungsdialoge.neueZeichnung.hinweis'),
  }
}

export function alsPlansprache(wert: string | undefined): Sprache {
  return istSprache(wert) ? wert : oberflaechensprache()
}

const VERTEILERPLAN_PRAEFIX = 'verteilerplan:'

export function alsZeichnungsart(wert: string | undefined): Zeichnungsart {
  return wert === 'schaltplan' || alsVerteilerplan(wert) ? 'schaltplan' : STANDARD_ZEICHNUNGSART
}

export function alsVerteilerplan(wert: string | undefined): string | null {
  return wert?.startsWith(VERTEILERPLAN_PRAEFIX) ? wert.slice(VERTEILERPLAN_PRAEFIX.length) : null
}
