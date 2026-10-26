import type { DatabaseSync } from 'node:sqlite'

export interface Migration {
  version: number
  name: string
  sql: string
  ohneFremdschluessel?: boolean
}

const GRUNDSCHEMA = `
CREATE TABLE projekte (
  id            TEXT PRIMARY KEY,
  kunde         TEXT NOT NULL DEFAULT '',
  bezeichnung   TEXT NOT NULL,
  projektnummer TEXT,
  notiz         TEXT,
  status        TEXT NOT NULL DEFAULT 'in_arbeit'
                CHECK (status IN ('angebot', 'in_arbeit', 'abgeschlossen')),
  archiviert    INTEGER NOT NULL DEFAULT 0,
  geloescht_am  TEXT,
  erstellt_am   TEXT NOT NULL,
  geaendert_am  TEXT NOT NULL
);
CREATE INDEX projekte_kunde      ON projekte (kunde);
CREATE INDEX projekte_geaendert  ON projekte (geaendert_am DESC);
CREATE INDEX projekte_papierkorb ON projekte (geloescht_am);

CREATE TABLE assets (
  id          TEXT PRIMARY KEY,
  mime        TEXT NOT NULL,
  groesse     INTEGER NOT NULL,
  dateiname   TEXT,
  erstellt_am TEXT NOT NULL
);

CREATE TABLE dokumente (
  id           TEXT PRIMARY KEY,
  projekt_id   TEXT NOT NULL REFERENCES projekte (id) ON DELETE CASCADE,
  typ          TEXT NOT NULL CHECK (typ IN ('zeichnung', 'pdf', 'notiz')),
  name         TEXT NOT NULL,
  reihenfolge  INTEGER NOT NULL,
  erstellt_am  TEXT NOT NULL,
  geaendert_am TEXT NOT NULL
);
CREATE INDEX dokumente_projekt   ON dokumente (projekt_id, reihenfolge);
CREATE INDEX dokumente_geaendert ON dokumente (geaendert_am DESC);

CREATE TABLE dokument_inhalte (
  dokument_id    TEXT PRIMARY KEY REFERENCES dokumente (id) ON DELETE CASCADE,
  format_version INTEGER NOT NULL,
  version        INTEGER NOT NULL DEFAULT 1,
  inhalt         TEXT,
  asset_id       TEXT REFERENCES assets (id)
);

CREATE TABLE dokument_staende (
  id             TEXT PRIMARY KEY,
  dokument_id    TEXT NOT NULL REFERENCES dokumente (id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  bemerkung      TEXT,
  format_version INTEGER NOT NULL,
  inhalt         TEXT NOT NULL,
  erstellt_am    TEXT NOT NULL
);
CREATE INDEX dokument_staende_dokument ON dokument_staende (dokument_id, erstellt_am DESC);

CREATE TABLE asset_referenzen (
  asset_id   TEXT NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
  quelle_typ TEXT NOT NULL CHECK (quelle_typ IN ('dokument', 'stand', 'katalog')),
  quelle_id  TEXT NOT NULL,
  PRIMARY KEY (asset_id, quelle_typ, quelle_id)
);
CREATE INDEX asset_referenzen_quelle ON asset_referenzen (quelle_typ, quelle_id);

CREATE TABLE katalog_komponenten (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  hersteller        TEXT,
  artikelnummer     TEXT,
  kategorie         TEXT,
  hauptgruppe       TEXT,
  untergruppe       TEXT,
  wattzahl          REAL,
  poe_leistung_watt REAL,
  breiten_faktor    REAL,
  seed_version      INTEGER,
  herkunft          TEXT NOT NULL CHECK (herkunft IN ('standard', 'benutzer')),
  daten             TEXT NOT NULL
);
CREATE INDEX katalog_gruppe ON katalog_komponenten (hauptgruppe, untergruppe, name);

CREATE TABLE einstellungen (
  schluessel TEXT PRIMARY KEY,
  wert       TEXT NOT NULL
);
`

const KATALOGREGISTER = `
CREATE TABLE kataloge (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  beschreibung TEXT,
  hersteller   TEXT,
  herkunft     TEXT NOT NULL CHECK (herkunft IN ('standard', 'benutzer')),
  aktiv        INTEGER NOT NULL DEFAULT 1,
  sortierung   INTEGER,
  seed_version INTEGER,
  daten        TEXT NOT NULL
);

ALTER TABLE katalog_komponenten ADD COLUMN katalog_id TEXT NOT NULL DEFAULT 'eigene';
CREATE INDEX katalog_komponenten_katalog ON katalog_komponenten (katalog_id, name);
`

const DOKUMENTTYP_EXCEL = `
CREATE TABLE dokumente_neu (
  id                 TEXT PRIMARY KEY,
  projekt_id         TEXT NOT NULL REFERENCES projekte (id) ON DELETE CASCADE,
  typ                TEXT NOT NULL CHECK (typ IN ('zeichnung', 'pdf', 'notiz', 'excel')),
  name               TEXT NOT NULL,
  reihenfolge        INTEGER NOT NULL,
  quelle_dokument_id TEXT REFERENCES dokumente (id) ON DELETE SET NULL,
  erstellt_am        TEXT NOT NULL,
  geaendert_am       TEXT NOT NULL
);
INSERT INTO dokumente_neu (id, projekt_id, typ, name, reihenfolge, quelle_dokument_id, erstellt_am, geaendert_am)
  SELECT id, projekt_id, typ, name, reihenfolge, NULL, erstellt_am, geaendert_am FROM dokumente;
DROP TABLE dokumente;
ALTER TABLE dokumente_neu RENAME TO dokumente;
CREATE INDEX dokumente_projekt   ON dokumente (projekt_id, reihenfolge);
CREATE INDEX dokumente_geaendert ON dokumente (geaendert_am DESC);
`

const KABELTYPEN = `
CREATE TABLE kabeltypen (
  id                   TEXT PRIMARY KEY,
  bezeichnung          TEXT NOT NULL,
  gruppe               TEXT NOT NULL,
  bemerkung            TEXT,
  aussendurchmesser_mm REAL,
  herkunft             TEXT NOT NULL CHECK (herkunft IN ('standard', 'benutzer')),
  aktiv                INTEGER NOT NULL DEFAULT 1,
  sortierung           INTEGER,
  seed_version         INTEGER,
  daten                TEXT NOT NULL
);
CREATE INDEX kabeltypen_gruppe ON kabeltypen (gruppe COLLATE NOCASE, sortierung, bezeichnung COLLATE NOCASE);
`

const INSTALLATIONSZONEN = `
CREATE TABLE installationszonen (
  id           TEXT PRIMARY KEY,
  bezeichnung  TEXT NOT NULL,
  herkunft     TEXT NOT NULL CHECK (herkunft IN ('standard', 'benutzer')),
  aktiv        INTEGER NOT NULL DEFAULT 1,
  sortierung   INTEGER,
  seed_version INTEGER,
  daten        TEXT NOT NULL
);
`

const ZUSATZMODULE = `
CREATE TABLE zusatzmodule (
  kennung        TEXT PRIMARY KEY,
  version        TEXT NOT NULL,
  aktiv          INTEGER NOT NULL DEFAULT 1,
  installiert_am TEXT NOT NULL,
  fehler         TEXT,
  manifest       TEXT NOT NULL
);
`

const ZUSATZMODULE_KI = `
ALTER TABLE zusatzmodule ADD COLUMN ki INTEGER NOT NULL DEFAULT 1;
`

export const MIGRATIONEN: Migration[] = [
  { version: 1, name: 'grundschema', sql: GRUNDSCHEMA },
  { version: 2, name: 'katalogregister', sql: KATALOGREGISTER },
  { version: 3, name: 'dokumenttyp-excel', sql: DOKUMENTTYP_EXCEL, ohneFremdschluessel: true },
  { version: 4, name: 'kabeltypen', sql: KABELTYPEN },
  { version: 5, name: 'installationszonen', sql: INSTALLATIONSZONEN },
  { version: 6, name: 'zusatzmodule', sql: ZUSATZMODULE },
  { version: 7, name: 'zusatzmodule-ki', sql: ZUSATZMODULE_KI },
]

export function leseSchemaVersion(db: DatabaseSync): number {
  const zeile = db.prepare('PRAGMA user_version').get() as { user_version?: number } | undefined
  return zeile?.user_version ?? 0
}

export interface MigrationsErgebnis {
  vorher: number
  nachher: number
  angewendet: string[]
}

export function migriere(db: DatabaseSync): MigrationsErgebnis {
  const vorher = leseSchemaVersion(db)
  const angewendet: string[] = []

  for (const migration of MIGRATIONEN) {
    if (migration.version <= vorher) continue
    if (migration.ohneFremdschluessel) db.exec('PRAGMA foreign_keys = OFF')
    db.exec('BEGIN')
    try {
      db.exec(migration.sql)
      if (migration.ohneFremdschluessel) {
        const verstoesse = db.prepare('PRAGMA foreign_key_check').all()
        if (verstoesse.length > 0) {
          throw new Error(
            `Fremdschluessel-Pruefung nach dem Rebuild fehlgeschlagen: ${JSON.stringify(verstoesse)}`,
          )
        }
      }
      db.exec(`PRAGMA user_version = ${migration.version}`)
      db.exec('COMMIT')
    } catch (fehler) {
      db.exec('ROLLBACK')
      throw new Error(
        `Migration ${migration.version} ("${migration.name}") fehlgeschlagen: ${
          fehler instanceof Error ? fehler.message : String(fehler)
        }`,
        { cause: fehler },
      )
    } finally {
      if (migration.ohneFremdschluessel) db.exec('PRAGMA foreign_keys = ON')
    }
    angewendet.push(migration.name)
  }

  return { vorher, nachher: leseSchemaVersion(db), angewendet }
}

export function aktuelleSchemaVersion(): number {
  return MIGRATIONEN.reduce((hoechste, m) => Math.max(hoechste, m.version), 0)
}
