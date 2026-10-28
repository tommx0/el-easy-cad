import { z } from 'zod'
import { erzeugeUebersetzer, QUELLSPRACHE } from '../sprache'
import type { Sprache, Texte, Uebersetzer } from '../sprache'
import { RAUMART_IDS } from './raumart'
import { STROMKREIS_NUMMER_MAX } from './stromkreis-eigenschaft'

export const KI_LISTEN_ARTEN = [
  'stueckliste',
  'leitungsliste',
  'trunkliste',
  'raumliste',
  'switchports',
  'patchfelder',
  'steuerungslogik',
  'betriebsmittelliste',
  'potentialliste',
  'stromkreisverzeichnis',
  'aktorkanalliste',
] as const

export type KiListenArt = (typeof KI_LISTEN_ARTEN)[number]

export interface KiWerkzeugDefinition {
  name: string
  titel: string
  beschreibung: string
  eingabe: z.ZodType
  schreibt: boolean
  zeitlimitMs?: number
  eingabeJson?: Record<string, unknown>
}

export const KI_STANDARD_ZEITLIMIT_MS = 60_000

type KiWerkzeugTexte = Texte['ki']['werkzeuge']

type KiWerkzeugPfad = {
  [W in keyof KiWerkzeugTexte & string]: `${W}.${keyof KiWerkzeugTexte[W] & string}`
}[keyof KiWerkzeugTexte & string]

function bauWerkzeuge(t: Uebersetzer): KiWerkzeugDefinition[] {
  const text = (pfad: KiWerkzeugPfad) => t(`ki.werkzeuge.${pfad}` as const)
  const mitAendernHinweis = (pfad: KiWerkzeugPfad) =>
    `${text(pfad)} ${text('schema.aendernHinweis')}`

  const bereichSchema = z
    .object({
      xMin: z.number(),
      yMin: z.number(),
      xMax: z.number(),
      yMax: z.number(),
    })
    .describe(text('schema.bereich'))

  const blattIdSchema = z.string().optional().describe(text('schema.blattId'))

  const objektIdsSchema = z.array(z.string()).min(1).max(500).describe(text('schema.objektIds'))

  const punktSchema = z.object({ x: z.number(), y: z.number() }).describe(text('schema.punkt'))

  const leitungsEndeSchema = z
    .object({
      komponente: z
        .object({
          objektId: z.string(),
          dockpunkt: z.number().int().min(0).optional().describe(text('schema.dockpunkt')),
          anschluesse: z
            .array(
              z.object({
                kennzeichen: z.string().describe(text('schema.kennzeichen')),
                anschluss: z.string().optional().describe(text('schema.anschluss')),
                ader: z.string().optional(),
              }),
            )
            .optional()
            .describe(text('schema.anschluesse')),
        })
        .optional(),
      punkt: punktSchema.optional(),
      schacht: z
        .object({ objektId: z.string(), strang: z.number().int().min(1).optional() })
        .optional(),
      switchport: z
        .object({ objektId: z.string(), port: z.number().int().min(0).optional() })
        .optional(),
      verteiler: z
        .object({
          objektId: z.string(),
          anschluesse: z
            .array(
              z.object({
                kennzeichen: z.string(),
                anschluss: z.string().optional(),
                ader: z.string().optional(),
              }),
            )
            .optional(),
        })
        .optional(),
    })
    .describe(text('schema.genauEineArt'))

  const schaltEndeSchema = z
    .object({
      kontakt: z
        .object({
          objektId: z.string(),
          anschluss: z
            .union([z.string(), z.number().int().min(0)])
            .describe(text('schema.kontaktAnschluss')),
        })
        .optional(),
      potential: z.string().optional().describe(text('schema.potential')),
      knoten: z.string().optional().describe(text('schema.knoten')),
      verbindung: z
        .object({
          objektId: z.string(),
          punkt: punktSchema.optional().describe(text('schema.verbindungPunkt')),
        })
        .optional()
        .describe(text('schema.verbindung')),
      punkt: punktSchema.optional().describe(text('schema.freiesEnde')),
    })
    .describe(text('schema.genauEineArt'))

  const verteilerIdSchema = z.string().describe(text('schema.verteilerId'))

  const trunkEndeSchema = z
    .object({
      komponente: z.string().optional().describe(text('schema.trunkKomponente')),
      trunk: z.string().optional().describe(text('schema.trunkTrunk')),
      schacht: z
        .object({ objektId: z.string(), strang: z.number().int().min(1).optional() })
        .optional(),
    })
    .describe(text('schema.genauEineArt'))

  return [
    {
      name: 'dokument_uebersicht',
      titel: text('dokumentUebersicht.titel'),
      beschreibung: text('dokumentUebersicht.beschreibung'),
      eingabe: z.object({}),
      schreibt: false,
    },
    {
      name: 'blatt_lesen',
      titel: text('blattLesen.titel'),
      beschreibung: text('blattLesen.beschreibung'),
      eingabe: z.object({
        blattId: blattIdSchema,
        typen: z.array(z.string()).optional().describe(text('blattLesen.typen')),
        bereich: bereichSchema.optional(),
        maxAnzahl: z
          .number()
          .int()
          .min(1)
          .max(2000)
          .optional()
          .describe(text('blattLesen.maxAnzahl')),
      }),
      schreibt: false,
    },
    {
      name: 'objekt_lesen',
      titel: text('objektLesen.titel'),
      beschreibung: text('objektLesen.beschreibung'),
      eingabe: z.object({ objektId: z.string().describe(text('objektLesen.objektId')) }),
      schreibt: false,
    },
    {
      name: 'raeume_lesen',
      titel: text('raeumeLesen.titel'),
      beschreibung: text('raeumeLesen.beschreibung'),
      eingabe: z.object({
        blattId: blattIdSchema,
        alleBlaetter: z.boolean().optional().describe(text('raeumeLesen.alleBlaetter')),
        mitIds: z.boolean().optional().describe(text('raeumeLesen.mitIds')),
      }),
      schreibt: false,
    },
    {
      name: 'katalog_suchen',
      titel: text('katalogSuchen.titel'),
      beschreibung: text('katalogSuchen.beschreibung'),
      eingabe: z.object({
        text: z.string().optional().describe(text('katalogSuchen.text')),
        geraetetyp: z.string().optional().describe(text('katalogSuchen.geraetetyp')),
        katalogId: z.string().optional().describe(text('katalogSuchen.katalogId')),
        maxAnzahl: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe(text('katalogSuchen.maxAnzahl')),
      }),
      schreibt: false,
    },
    {
      name: 'liste_lesen',
      titel: text('listeLesen.titel'),
      beschreibung: text('listeLesen.beschreibung'),
      eingabe: z.object({
        art: z.enum(KI_LISTEN_ARTEN),
        umfang: z.enum(['projekt', 'blatt']).optional().describe(text('listeLesen.umfang')),
        blattId: blattIdSchema,
        verteiler: z.string().optional().describe(text('listeLesen.verteiler')),
      }),
      schreibt: false,
    },
    {
      name: 'verteilerbaum_lesen',
      titel: text('verteilerbaumLesen.titel'),
      beschreibung: text('verteilerbaumLesen.beschreibung'),
      eingabe: z.object({
        verteiler: z.string().optional().describe(text('verteilerbaumLesen.verteiler')),
      }),
      schreibt: false,
    },
    {
      name: 'pruefen',
      titel: text('pruefen.titel'),
      beschreibung: text('pruefen.beschreibung'),
      eingabe: z.object({
        blattId: z.string().optional().describe(text('pruefen.blattId')),
      }),
      schreibt: false,
    },
    {
      name: 'bildschirmfoto',
      titel: text('bildschirmfoto.titel'),
      beschreibung: text('bildschirmfoto.beschreibung'),
      eingabe: z.object({
        blattId: blattIdSchema,
        bereich: bereichSchema.optional(),
        maxKantePx: z
          .number()
          .int()
          .min(256)
          .max(2000)
          .optional()
          .describe(text('bildschirmfoto.maxKantePx')),
      }),
      schreibt: false,
      zeitlimitMs: 90_000,
    },
    {
      name: 'eigenschaften_setzen',
      titel: text('eigenschaftenSetzen.titel'),
      beschreibung: mitAendernHinweis('eigenschaftenSetzen.beschreibung'),
      eingabe: z.object({
        objektIds: objektIdsSchema,
        werte: z
          .object({
            beschriftung: z.string().optional().describe(text('eigenschaftenSetzen.beschriftung')),
            installationshoeheM: z
              .number()
              .min(0)
              .max(20)
              .nullable()
              .optional()
              .describe(text('eigenschaftenSetzen.installationshoeheM')),
            montageort: z.enum(['wand', 'decke', 'boden']).optional(),
            verlegung: z
              .enum(['AP', 'UP'])
              .optional()
              .describe(text('eigenschaftenSetzen.verlegung')),
            stromkreis: z
              .union([
                z.enum(['vorgabe', 'kein', 'raum', 'eigen']),
                z.number().int().min(1).max(STROMKREIS_NUMMER_MAX),
              ])
              .optional()
              .describe(text('eigenschaftenSetzen.stromkreis')),
            stromkreisPolzahl: z
              .union([z.literal(1), z.literal(3)])
              .nullable()
              .optional()
              .describe(text('eigenschaftenSetzen.stromkreisPolzahl')),
            knx: z.boolean().optional(),
            variableTexte: z
              .record(z.string(), z.string())
              .optional()
              .describe(text('eigenschaftenSetzen.variableTexte')),
            kennzeichen: z.string().optional().describe(text('eigenschaftenSetzen.kennzeichen')),
            kabeltyp: z.string().optional().describe(text('eigenschaftenSetzen.kabeltyp')),
            beschreibung: z.string().optional(),
            name: z.string().optional(),
            raumart: z.enum(RAUMART_IDS).optional().describe(text('eigenschaftenSetzen.raumart')),
          })
          .refine((w) => Object.values(w).some((v) => v !== undefined), {
            message: text('eigenschaftenSetzen.mindestensEinFeld'),
          }),
      }),
      schreibt: true,
    },
    {
      name: 'objekte_loeschen',
      titel: text('objekteLoeschen.titel'),
      beschreibung: mitAendernHinweis('objekteLoeschen.beschreibung'),
      eingabe: z.object({ objektIds: objektIdsSchema }),
      schreibt: true,
    },
    {
      name: 'objekte_verschieben',
      titel: text('objekteVerschieben.titel'),
      beschreibung: mitAendernHinweis('objekteVerschieben.beschreibung'),
      eingabe: z.object({
        objektIds: objektIdsSchema,
        dx: z.number().optional().describe(text('objekteVerschieben.dx')),
        dy: z.number().optional().describe(text('objekteVerschieben.dy')),
        nach: z
          .object({ x: z.number(), y: z.number() })
          .optional()
          .describe(text('objekteVerschieben.nach')),
      }),
      schreibt: true,
      zeitlimitMs: 90_000,
    },
    {
      name: 'objekte_drehen',
      titel: text('objekteDrehen.titel'),
      beschreibung: mitAendernHinweis('objekteDrehen.beschreibung'),
      eingabe: z.object({
        objektIds: objektIdsSchema,
        winkelGrad: z.number().min(-360).max(360),
      }),
      schreibt: true,
      zeitlimitMs: 90_000,
    },
    {
      name: 'komponente_austauschen',
      titel: text('komponenteAustauschen.titel'),
      beschreibung: mitAendernHinweis('komponenteAustauschen.beschreibung'),
      eingabe: z.object({
        objektIds: objektIdsSchema,
        katalogId: z.string().describe(text('komponenteAustauschen.katalogId')),
        varianteId: z.string().optional().describe(text('komponenteAustauschen.varianteId')),
      }),
      schreibt: true,
      zeitlimitMs: 90_000,
    },
    {
      name: 'blatt_anlegen',
      titel: text('blattAnlegen.titel'),
      beschreibung: mitAendernHinweis('blattAnlegen.beschreibung'),
      eingabe: z.object({
        name: z.string().min(1),
        nachBlattId: z.string().optional().describe(text('blattAnlegen.nachBlattId')),
      }),
      schreibt: true,
    },
    {
      name: 'komponente_setzen',
      titel: text('komponenteSetzen.titel'),
      beschreibung: mitAendernHinweis('komponenteSetzen.beschreibung'),
      eingabe: z.object({
        platzierungen: z
          .array(
            z.object({
              katalogId: z.string().describe(text('komponenteSetzen.katalogId')),
              varianteId: z.string().optional().describe(text('komponenteSetzen.varianteId')),
              blattId: z.string().optional().describe(text('komponenteSetzen.blattId')),
              punkt: punktSchema.optional(),
              netzfeld: z.string().optional().describe(text('komponenteSetzen.netzfeld')),
              raumMitte: z.string().optional().describe(text('komponenteSetzen.raumMitte')),
              wand: z
                .object({
                  wandId: z.string(),
                  abstandM: z.number().min(0).describe(text('komponenteSetzen.abstandM')),
                  raumId: z.string().optional().describe(text('komponenteSetzen.raumId')),
                  seite: z
                    .enum(['links', 'rechts'])
                    .optional()
                    .describe(text('komponenteSetzen.seite')),
                })
                .optional(),
              hoeheM: z
                .number()
                .min(0)
                .max(20)
                .optional()
                .describe(text('komponenteSetzen.hoeheM')),
              drehungGrad: z.number().optional().describe(text('komponenteSetzen.drehungGrad')),
              beschriftung: z.string().optional(),
            }),
          )
          .min(1)
          .max(200),
      }),
      schreibt: true,
      zeitlimitMs: 90_000,
    },
    {
      name: 'leitung_verlegen',
      titel: text('leitungVerlegen.titel'),
      beschreibung: mitAendernHinweis('leitungVerlegen.beschreibung'),
      eingabe: z.object({
        leitungen: z
          .array(
            z.object({
              blattId: z.string().optional().describe(text('leitungVerlegen.blattId')),
              von: leitungsEndeSchema,
              nach: leitungsEndeSchema,
              trunks: z
                .object({
                  eintrittTrunkId: z.string(),
                  austrittTrunkId: z
                    .string()
                    .optional()
                    .describe(text('leitungVerlegen.austrittTrunkId')),
                })
                .optional(),
              verknuepfen: z.boolean().optional().describe(text('leitungVerlegen.verknuepfen')),
            }),
          )
          .min(1)
          .max(100),
      }),
      schreibt: true,
      zeitlimitMs: 120_000,
    },
    {
      name: 'leitungen_neu_verlegen',
      titel: text('leitungenNeuVerlegen.titel'),
      beschreibung: mitAendernHinweis('leitungenNeuVerlegen.beschreibung'),
      eingabe: z.object({
        blattId: blattIdSchema,
        leitungIds: z
          .array(z.string())
          .optional()
          .describe(text('leitungenNeuVerlegen.leitungIds')),
      }),
      schreibt: true,
      zeitlimitMs: 120_000,
    },
    {
      name: 'trunk_anlegen',
      titel: text('trunkAnlegen.titel'),
      beschreibung: mitAendernHinweis('trunkAnlegen.beschreibung'),
      eingabe: z.object({
        blattId: blattIdSchema,
        wegpunkte: z.array(punktSchema).min(2),
        anfang: trunkEndeSchema.optional(),
        ende: trunkEndeSchema.optional(),
      }),
      schreibt: true,
      zeitlimitMs: 90_000,
    },
    {
      name: 'wand_zeichnen',
      titel: text('wandZeichnen.titel'),
      beschreibung: mitAendernHinweis('wandZeichnen.beschreibung'),
      eingabe: z.object({
        blattId: blattIdSchema,
        punkte: z.array(punktSchema).min(2).optional(),
        geschlossen: z.boolean().optional(),
        rechteck: z.object({ von: punktSchema, bis: punktSchema }).optional(),
        staerkeM: z.number().min(0.01).max(2).optional(),
      }),
      schreibt: true,
    },
    {
      name: 'raum_anlegen',
      titel: text('raumAnlegen.titel'),
      beschreibung: mitAendernHinweis('raumAnlegen.beschreibung'),
      eingabe: z.object({
        blattId: blattIdSchema,
        punkt: punktSchema.describe(text('raumAnlegen.punkt')),
        name: z.string().optional(),
        raumart: z.enum(RAUMART_IDS).optional().describe(text('raumAnlegen.raumart')),
      }),
      schreibt: true,
    },
    {
      name: 'oeffnung_setzen',
      titel: text('oeffnungSetzen.titel'),
      beschreibung: mitAendernHinweis('oeffnungSetzen.beschreibung'),
      eingabe: z.object({
        art: z.enum(['tuer', 'fenster']),
        wandId: z.string(),
        abstandM: z.number().min(0),
        breiteM: z.number().min(0.1).max(10).optional(),
        hoeheM: z.number().min(0.1).max(10).optional(),
        bruestungM: z.number().min(0).max(5).optional().describe(text('oeffnungSetzen.bruestungM')),
        gespiegelt: z.boolean().optional().describe(text('oeffnungSetzen.gespiegelt')),
        schwenkInnen: z.boolean().optional().describe(text('oeffnungSetzen.schwenkInnen')),
      }),
      schreibt: true,
    },
    {
      name: 'potential_setzen',
      titel: text('potentialSetzen.titel'),
      beschreibung: mitAendernHinweis('potentialSetzen.beschreibung'),
      eingabe: z.object({
        blattId: blattIdSchema,
        potentiale: z
          .array(
            z.object({
              name: z.string().min(1),
              punkt: punktSchema.optional(),
              netzfeld: z.string().optional().describe(text('potentialSetzen.netzfeld')),
              drehungGrad: z.number().optional(),
            }),
          )
          .min(1)
          .max(50),
      }),
      schreibt: true,
    },
    {
      name: 'schaltverbindung_ziehen',
      titel: text('schaltverbindungZiehen.titel'),
      beschreibung: mitAendernHinweis('schaltverbindungZiehen.beschreibung'),
      eingabe: z.object({
        blattId: blattIdSchema,
        verbindungen: z
          .array(
            z.object({
              von: schaltEndeSchema,
              nach: schaltEndeSchema,
              polzahl: z
                .number()
                .int()
                .min(1)
                .max(5)
                .optional()
                .describe(text('schaltverbindungZiehen.polzahl')),
              adern: z
                .number()
                .int()
                .min(2)
                .max(5)
                .optional()
                .describe(text('schaltverbindungZiehen.adern')),
              seiteUmgekehrt: z
                .boolean()
                .optional()
                .describe(text('schaltverbindungZiehen.seiteUmgekehrt')),
              bezeichnung: z
                .string()
                .optional()
                .describe(text('schaltverbindungZiehen.bezeichnung')),
              wegpunkte: z
                .array(punktSchema)
                .optional()
                .describe(text('schaltverbindungZiehen.wegpunkte')),
            }),
          )
          .min(1)
          .max(100),
      }),
      schreibt: true,
      zeitlimitMs: 120_000,
    },
    {
      name: 'automatisch_anordnen',
      titel: text('automatischAnordnen.titel'),
      beschreibung: mitAendernHinweis('automatischAnordnen.beschreibung'),
      eingabe: z.object({ objektIds: objektIdsSchema }),
      schreibt: true,
      zeitlimitMs: 120_000,
    },
    {
      name: 'bestueckung_vorschlagen',
      titel: text('bestueckungVorschlagen.titel'),
      beschreibung: mitAendernHinweis('bestueckungVorschlagen.beschreibung'),
      eingabe: z.object({
        verteilerId: verteilerIdSchema,
        raeume: z
          .array(
            z.object({
              blattId: z.string(),
              raumId: z.string().optional().describe(text('bestueckungVorschlagen.raumId')),
            }),
          )
          .optional()
          .describe(text('bestueckungVorschlagen.raeume')),
        knx: z.boolean().optional().describe(text('bestueckungVorschlagen.knx')),
        knxReserveProzent: z.number().min(0).max(200).optional(),
        verwaisteBehalten: z
          .boolean()
          .optional()
          .describe(text('bestueckungVorschlagen.verwaisteBehalten')),
      }),
      schreibt: true,
      zeitlimitMs: 90_000,
    },
    {
      name: 'bestueckung_aendern',
      titel: text('bestueckungAendern.titel'),
      beschreibung: mitAendernHinweis('bestueckungAendern.beschreibung'),
      eingabe: z.object({
        verteilerId: verteilerIdSchema,
        schritte: z
          .array(
            z.object({
              betriebsmittel: z
                .object({
                  katalogId: z.string(),
                  anzahl: z.number().int().min(1).max(96).optional(),
                  hinter: z.string().optional().describe(text('bestueckungAendern.hinter')),
                })
                .optional(),
              stromkreise: z
                .object({
                  anzahl: z.number().int().min(1).max(96),
                  schutzKatalogId: z
                    .string()
                    .optional()
                    .describe(text('bestueckungAendern.schutzKatalogId')),
                  klemmeKatalogId: z
                    .string()
                    .nullable()
                    .optional()
                    .describe(text('bestueckungAendern.klemmeKatalogId')),
                  hinter: z.string().optional(),
                })
                .optional(),
              umhaengen: z
                .object({
                  knoten: z.string(),
                  art: z.enum(['kind', 'davor', 'dahinter']),
                  ziel: z.string().nullable().describe(text('bestueckungAendern.ziel')),
                })
                .optional(),
              umbenennen: z
                .object({
                  knoten: z.string(),
                  neu: z.string().describe(text('bestueckungAendern.neu')),
                })
                .optional(),
              entfernen: z
                .object({ knoten: z.string(), mitAllemDahinter: z.boolean().optional() })
                .optional(),
              aendern: z
                .object({
                  knoten: z.string(),
                  phase: z.enum(['L1', 'L2', 'L3']).nullable().optional(),
                  typ: z.string().optional().describe(text('bestueckungAendern.typ')),
                  beschriftung: z.string().optional(),
                })
                .optional(),
            }),
          )
          .min(1)
          .max(50),
      }),
      schreibt: true,
    },
    {
      name: 'knx_aktoren_zuordnen',
      titel: text('knxAktorenZuordnen.titel'),
      beschreibung: mitAendernHinweis('knxAktorenZuordnen.beschreibung'),
      eingabe: z.object({
        verteilerId: verteilerIdSchema,
        reserveProzent: z
          .number()
          .min(0)
          .max(200)
          .optional()
          .describe(text('knxAktorenZuordnen.reserveProzent')),
        freigeben: z.boolean().optional().describe(text('knxAktorenZuordnen.freigeben')),
      }),
      schreibt: true,
    },
    {
      name: 'klemmenleiste_nummerieren',
      titel: text('klemmenleisteNummerieren.titel'),
      beschreibung: mitAendernHinweis('klemmenleisteNummerieren.beschreibung'),
      eingabe: z.object({
        leiste: z.string().optional().describe(text('klemmenleisteNummerieren.leiste')),
        verteilerId: z.string().optional().describe(text('klemmenleisteNummerieren.verteilerId')),
      }),
      schreibt: true,
    },
    {
      name: 'verteilerplan_erzeugen',
      titel: text('verteilerplanErzeugen.titel'),
      beschreibung: text('verteilerplanErzeugen.beschreibung'),
      eingabe: z.object({
        verteilerId: verteilerIdSchema,
        name: z.string().optional().describe(text('verteilerplanErzeugen.name')),
      }),
      schreibt: true,
      zeitlimitMs: 90_000,
    },
    {
      name: 'rueckgaengig',
      titel: text('rueckgaengig.titel'),
      beschreibung: text('rueckgaengig.beschreibung'),
      eingabe: z.object({
        anzahl: z.number().int().min(1).max(20).optional().describe(text('rueckgaengig.anzahl')),
      }),
      schreibt: true,
    },
  ]
}

const JE_SPRACHE = new Map<Sprache, readonly KiWerkzeugDefinition[]>()

export function kiWerkzeuge(sprache: Sprache): readonly KiWerkzeugDefinition[] {
  let werkzeuge = JE_SPRACHE.get(sprache)
  if (!werkzeuge) {
    werkzeuge = bauWerkzeuge(erzeugeUebersetzer(sprache))
    JE_SPRACHE.set(sprache, werkzeuge)
  }
  return werkzeuge
}

export const KI_WERKZEUGE: readonly KiWerkzeugDefinition[] = kiWerkzeuge(QUELLSPRACHE)

export const KI_WERKZEUG_NACH_NAME: ReadonlyMap<string, KiWerkzeugDefinition> = new Map(
  KI_WERKZEUGE.map((w) => [w.name, w]),
)

export type KiInhalt =
  { art: 'text'; text: string } | { art: 'bild'; daten: string; mime: 'image/png' }

export type KiAntwort = { ok: true; inhalt: KiInhalt[] } | { ok: false; fehler: string }

export const kiAntwortSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    inhalt: z.array(
      z.discriminatedUnion('art', [
        z.object({ art: z.literal('text'), text: z.string() }),
        z.object({ art: z.literal('bild'), daten: z.string(), mime: z.literal('image/png') }),
      ]),
    ),
  }),
  z.object({ ok: z.literal(false), fehler: z.string() }),
])

export interface KiAufruf {
  aufrufId: string
  werkzeug: string
  eingabe: unknown
}

export interface KiClient {
  name: string
  version?: string
  zuletzt: string
}

export interface KiStatus {
  aktiv: boolean
  nurLesen: boolean
  zustimmungAm: string | null
  token: string | null
  mcpAdresse: string
  stdio: { befehl: string; argumente: string[] }
  client: KiClient | null
}

export interface KiEinstellungenPatch {
  aktiv?: boolean
  nurLesen?: boolean
  zustimmung?: boolean
}
