import { z } from 'zod'
import { t } from '../sprache'
import { KATALOG_EIGENE_ID } from './catalog'
import { kennungSchema } from './geraete-regelwerk'
import { ifcKlasseSchema, ifcTypSchema } from './ifc-klassen'
import { symbolFarbeSchema } from './symbol-palette'
import {
  katalogUebersetzungenSchema,
  komponentenUebersetzungenSchema,
} from './katalog-uebersetzung'

const katalogBildSchema = z.union([
  z.object({ typ: z.literal('asset'), assetId: z.string() }),
  z
    .object({ typ: z.literal('blob'), blobId: z.string() })
    .transform((alt) => ({ typ: 'asset' as const, assetId: alt.blobId })),
])

const technischeDatenSchema = z.record(z.string(), z.string())

const portGruppeSchema = z.object({
  typ: z.string(),
  anzahl: z.number().int().positive(),
  reihen: z.number().int().positive().optional(),
})

const trunkDockpunktSchema = z.object({
  xAnteil: z.number().min(0).max(1),
})

const ausrichtungH = z.enum(['links', 'mittig', 'rechts'])
const ausrichtungV = z.enum(['oben', 'mittig', 'unten'])

const dockpunktBeschriftungSchema = z.object({
  xAnteil: z.number().min(0).max(1).optional(),
  yAnteil: z.number().min(0).max(1).optional(),
  groesseAnteil: z.number().positive(),
  ausrichtungHorizontal: ausrichtungH,
  ausrichtungVertikal: ausrichtungV,
  bildschirmVersatz: z.object({ x: z.number(), y: z.number() }).optional(),
  beiDrehung: z
    .object({
      bezugXAnteil: z.number().min(0).max(1),
      bezugYAnteil: z.number().min(0).max(1),
      versatzX: z.number(),
      versatzY: z.number(),
      ausrichtungHorizontal: ausrichtungH,
      ausrichtungVertikal: ausrichtungV,
    })
    .optional(),
  ausblenden: z.boolean().optional(),
  farbe: symbolFarbeSchema.optional(),
})

const freierDockpunktSchema = z.object({
  xAnteil: z.number().min(0).max(1),
  yAnteil: z.number().min(0).max(1),
  trunk: z.boolean().optional(),
  bezeichnung: z.string().optional(),
  beschriftung: dockpunktBeschriftungSchema.optional(),
})

const dockpunkteKonfigurationSchema = z.discriminatedUnion('modus', [
  z.object({
    modus: z.literal('ports'),
    gruppen: z.array(portGruppeSchema).min(1),
    trunkPunkte: z.array(trunkDockpunktSchema).optional(),
  }),
  z.object({
    modus: z.literal('frei'),
    punkte: z.array(freierDockpunktSchema).min(1),
  }),
])

export const fangpunktSchema = z.object({
  xAnteil: z.number().min(0).max(1),
  yAnteil: z.number().min(0).max(1),
})

const katalogTextElementSchema = z.object({
  xAnteil: z.number().min(0).max(1),
  yAnteil: z.number().min(0).max(1),
  text: z.string(),
  groesseAnteil: z.number().positive(),
  ausrichtungHorizontal: z.enum(['links', 'mittig', 'rechts']),
  ausrichtungVertikal: z.enum(['oben', 'mittig', 'unten']),
  beiDrehung: z
    .object({
      bezugXAnteil: z.number().min(0).max(1),
      bezugYAnteil: z.number().min(0).max(1),
      versatzX: z.number(),
      versatzY: z.number(),
      ausrichtungHorizontal: z.enum(['links', 'mittig', 'rechts']),
      ausrichtungVertikal: z.enum(['oben', 'mittig', 'unten']),
    })
    .optional(),
  bildschirmVersatz: z.object({ x: z.number(), y: z.number() }).optional(),
  variable: z.string().optional(),
  inStueckliste: z.boolean().optional(),
  drehung: z.union([z.literal(90), z.literal(180), z.literal(270)]).optional(),
  fixiert: z.boolean().optional(),
  farbe: symbolFarbeSchema.optional(),
})

const slotVorlageSchema = z.object({
  id: z.string(),
  bezeichnung: z.string(),
})

const slotMatrixSchema = z.object({
  spalten: z.union([z.literal(1), z.literal(2)]),
  zeilen: z.number().int().positive(),
  zeilenSpalten: z.array(z.union([z.literal(1), z.literal(2)])).optional(),
})

const bemessungSchema = z.object({
  nennstrom: z.number().positive().optional(),
  nennspannung: z.number().positive().optional(),
  polzahl: z.number().int().positive().optional(),
  ipSchutzart: z.string().optional(),
})

const variantSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  farbe: z.string().optional(),
  artikelnummer: z.string().optional(),
  bild: katalogBildSchema.optional(),
  symbol: katalogBildSchema.optional(),
  symbolFarbig: z.boolean().optional(),
  technischeDaten: technischeDatenSchema.optional(),
  bemessung: bemessungSchema.optional(),
})

export const katalogSchema = z.object({
  id: z.string(),
  name: z.string(),
  beschreibung: z.string().optional(),
  uebersetzungen: katalogUebersetzungenSchema,
  hersteller: z.string().optional(),
  herkunft: z.enum(['standard', 'benutzer']),
  aktiv: z.boolean().default(true),
  sortierung: z.number().int().optional(),
  seedVersion: z.number().int().positive().optional(),
  ausgemustert: z.boolean().optional(),
})

export const catalogComponentSchema = z
  .object({
    id: z.string(),
    katalogId: z.string().default(KATALOG_EIGENE_ID),
    name: z.string(),
    uebersetzungen: komponentenUebersetzungenSchema,
    bild: katalogBildSchema.optional(),
    symbol: katalogBildSchema.optional(),
    symbolFarbig: z.boolean().optional(),
    hersteller: z.string().optional(),
    artikelnummer: z.string().optional(),
    wattzahl: z.number().optional(),
    poeLeistungWatt: z.number().nonnegative().optional(),
    bemessung: bemessungSchema.optional(),
    kategorie: z.string().optional(),
    typ: kennungSchema.optional(),
    slotVorlagen: z.array(slotVorlageSchema).optional(),
    slotMatrixVorlage: slotMatrixSchema.optional(),
    slotAnzahlAus: z.string().optional(),
    ansteuerung: kennungSchema.optional(),
    stromkreisVorgabe: z.enum(['kein', 'raum', 'eigen']).optional(),
    stromkreisPolzahl: z.union([z.literal(1), z.literal(3)]).optional(),
    ifcKlasse: ifcKlasseSchema.optional(),
    ifcTyp: ifcTypSchema.optional(),
    ifcTypName: z.string().optional(),
    hauptgruppe: z.string().optional(),
    untergruppe: z.string().optional(),
    dockpunkte: dockpunkteKonfigurationSchema.optional(),
    fangpunkt: fangpunktSchema.optional(),
    textElemente: z.array(katalogTextElementSchema).optional(),
    breitenFaktor: z.number().positive().optional(),
    hoehenFaktor: z.number().positive().optional(),
    kombinierbar: z.boolean().optional(),
    montageort: z.enum(['decke', 'wand', 'boden']).optional(),
    bauart: z.enum(['patchpanel', 'verteiler']).optional(),
    modulTraeger: z
      .object({
        modulSystem: z.string(),
        spalten: z.number().int().positive(),
        zeilen: z.number().int().positive(),
      })
      .optional(),
    modulSystem: z.string().optional(),
    kennzeichenBuchstabe: z.string().optional(),
    betriebsmittelRolle: z.enum(['spule', 'kontaktblock']).optional(),
    seedVersion: z.number().int().positive().optional(),
    ausgemustert: z.boolean().optional(),
    abgeleitetVon: z
      .object({ id: z.string(), seedVersion: z.number().int().positive().optional() })
      .optional(),
    technischeDaten: technischeDatenSchema,
    herkunft: z.enum(['standard', 'benutzer']),
    varianten: z.array(variantSchema),
  })
  .refine((k) => k.bild !== undefined || k.symbol !== undefined, {
    error: () => t('modell.katalog.grafikFehlt'),
    path: ['bild'],
  })
