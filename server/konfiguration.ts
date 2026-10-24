import { homedir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'

export interface Konfiguration {
  datenordner: string
  datenbankDatei: string
  assetOrdner: string
  fehlerprotokollDatei: string
  lizenzDatei: string
  port: number
  host: string
  statischesVerzeichnis: string | null
  demoStartUeberschreibung: string | null
}

export const STANDARD_PORT = 4747
export const STANDARD_HOST = '127.0.0.1'
export const STANDARD_DATENORDNER_NAME = 'el.easy.CAD Community'
export const LIZENZ_DATEI = 'lizenz.json'
export const ENTWICKLUNGS_LIZENZ_DATEI = 'lizenz-entwicklung.json'

export class KonfigurationsFehler extends Error {
  constructor(nachricht: string) {
    super(nachricht)
    this.name = 'KonfigurationsFehler'
  }
}

function lesePort(roh: string | undefined): number {
  if (roh === undefined || roh.trim() === '') return STANDARD_PORT
  const port = Number(roh)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new KonfigurationsFehler(
      `EL_EASY_CAD_PORT muss eine Portnummer zwischen 1 und 65535 sein, war "${roh}".`,
    )
  }
  return port
}

export function pfadeIm(
  datenordner: string,
): Pick<
  Konfiguration,
  'datenordner' | 'datenbankDatei' | 'assetOrdner' | 'fehlerprotokollDatei' | 'lizenzDatei'
> {
  return {
    datenordner,
    datenbankDatei: join(datenordner, 'el-easy-cad.db'),
    assetOrdner: join(datenordner, 'assets'),
    fehlerprotokollDatei: join(datenordner, 'fehlerprotokoll.log'),
    lizenzDatei: join(datenordner, LIZENZ_DATEI),
  }
}

function absolut(pfad: string): string {
  return isAbsolute(pfad) ? pfad : resolve(pfad)
}

export function leseKonfiguration(env: NodeJS.ProcessEnv = process.env): Konfiguration {
  const datenordner = env.EL_EASY_CAD_DATEN?.trim()
    ? absolut(env.EL_EASY_CAD_DATEN.trim())
    : join(homedir(), STANDARD_DATENORDNER_NAME)
  const statisch = env.EL_EASY_CAD_STATISCH?.trim()
  const demoStart = env.EL_EASY_CAD_DEMO_START?.trim()
  const entwicklung = env.EL_EASY_CAD_ENTWICKLUNGSLIZENZ === '1'
  return {
    ...pfadeIm(datenordner),
    ...(entwicklung ? { lizenzDatei: join(datenordner, ENTWICKLUNGS_LIZENZ_DATEI) } : {}),
    port: lesePort(env.EL_EASY_CAD_PORT),
    host: env.EL_EASY_CAD_HOST?.trim() ? env.EL_EASY_CAD_HOST.trim() : STANDARD_HOST,
    statischesVerzeichnis: statisch ? absolut(statisch) : null,
    demoStartUeberschreibung: demoStart && /^\d{4}-\d{2}-\d{2}$/.test(demoStart) ? demoStart : null,
  }
}
