import { z } from 'zod'

export const ZUSATZMODUL_ENDUNG = '.eecmod'
export const ZUSATZMODUL_MANIFEST = 'manifest.json'
export const ZUSATZMODUL_CODE = 'modul.js'

const kennungSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/)
  .max(120)

const versionSchema = z.string().regex(/^\d+\.\d+\.\d+$/)

const appVersionSchema = z.string().regex(/^\d+\.\d+(?:\.\d+)?$/)

export const zusatzmodulBefehlSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  titel: z.string().min(1),
  icon: z.string().optional(),
  nurZeichnungsart: z.enum(['bauplan', 'schaltplan']).optional(),
  ki: z
    .object({
      beschreibung: z.string().min(1).max(4000),
      eingabe: z.record(z.string(), z.unknown()).optional(),
      schreibt: z.boolean().optional(),
      zeitlimitS: z.number().int().min(5).max(600).optional(),
    })
    .optional(),
})

export const zusatzmodulManifestSchema = z.object({
  kennung: kennungSchema,
  name: z.string().min(1).max(80),
  version: versionSchema,
  hersteller: z.string().min(1).max(80),
  beschreibung: z.string().max(500).optional(),
  app: z.object({
    mindestens: versionSchema,
    getestetBis: appVersionSchema.optional(),
  }),
  befehle: z.array(zusatzmodulBefehlSchema).min(1).max(50),
  icon: z.string().optional(),
  beimStart: z.boolean().optional(),
  lizenz: z.string().nullable().optional(),
})

export type ZusatzmodulBefehl = z.infer<typeof zusatzmodulBefehlSchema>
export type ZusatzmodulManifest = z.infer<typeof zusatzmodulManifestSchema>

export interface ZusatzmodulEintrag {
  manifest: ZusatzmodulManifest
  aktiv: boolean
  installiertAm: string
  fehler: string | null
  kiFreigabe: boolean
  entwicklung?: { stand: string }
}

export function zusatzmodulLadeVersion(eintrag: ZusatzmodulEintrag): string {
  return eintrag.entwicklung
    ? `${ZUSATZMODUL_ENTWICKLUNG_VORSATZ}${eintrag.entwicklung.stand}`
    : eintrag.manifest.version
}

export const ZUSATZMODUL_ENTWICKLUNG_VORSATZ = 'entwicklung-'

export interface ZusatzmodulEntwicklung {
  aktiv: boolean
  ordner: string
  modul?: ZusatzmodulManifest | null
  stand?: string | null
  fehler?: string | null
}

export function istGueltigerEinstellungsSchluessel(schluessel: string): boolean {
  return /^[\w.:-]{1,80}$/.test(schluessel)
}

export interface ZusatzmodulVorschau {
  manifest: ZusatzmodulManifest
  installiert: string | null
  vergleich: 'neu' | 'neuer' | 'gleich' | 'aelter'
}

function zahlen(version: string): number[] {
  return version.split('.').map((teil) => Number.parseInt(teil, 10) || 0)
}

export function vergleicheVersionen(a: string, b: string): number {
  const x = zahlen(a.split('-')[0] ?? a)
  const y = zahlen(b.split('-')[0] ?? b)
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

export function ungetesteteAppVersion(manifest: ZusatzmodulManifest, appVersion: string): boolean {
  const bis = manifest.app.getestetBis
  if (!bis) return false
  const stellen = bis.split('.').length
  const app = zahlen(appVersion.split('-')[0] ?? appVersion)
    .slice(0, stellen)
    .join('.')
  return vergleicheVersionen(app, bis) > 0
}

export function istSichererModulPfad(pfad: string): boolean {
  if (pfad.length === 0 || pfad.length > 200) return false
  if (pfad.startsWith('/') || pfad.includes('\\')) return false
  return pfad
    .split('/')
    .every((teil) => teil.length > 0 && teil !== '.' && teil !== '..' && /^[\w.-]+$/.test(teil))
}

export function istGueltigeModulKennung(kennung: string): boolean {
  return kennungSchema.safeParse(kennung).success
}

export function istGueltigeModulVersion(version: string): boolean {
  return versionSchema.safeParse(version).success
}

export const ZUSATZMODUL_KI_VORSATZ = 'modul_'

export function zusatzmodulKiWerkzeugName(kennung: string, befehlId: string): string {
  const kurz = (kennung.split('.').pop() ?? kennung).replace(/-/g, '_')
  return `${ZUSATZMODUL_KI_VORSATZ}${kurz}_${befehlId.replace(/-/g, '_')}`.slice(0, 64)
}

export function zusatzmodulBefehlId(kennung: string, befehlId: string): string {
  return `modul.${kennung}.${befehlId}`
}
