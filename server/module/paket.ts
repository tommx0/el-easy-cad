import { unzipSync } from 'fflate'
import {
  istSichererModulPfad,
  vergleicheVersionen,
  ZUSATZMODUL_CODE,
  ZUSATZMODUL_MANIFEST,
  zusatzmodulManifestSchema,
  type ZusatzmodulManifest,
} from '../../src/document-model'
import { alsText, deutsch, serverText, type ServerText } from '../sprache'

export const MODUL_GROESSE_MAX = 50 * 1024 * 1024

export class ModulPaketFehler extends Error {
  readonly text: string | ServerText

  constructor(nachricht: string | ServerText) {
    super(alsText(nachricht, deutsch))
    this.name = 'ModulPaketFehler'
    this.text = nachricht
  }
}

export interface GeprueftesModul {
  manifest: ZusatzmodulManifest
  dateien: Map<string, Uint8Array>
}

function istBeiwerk(name: string): boolean {
  return name.startsWith('__MACOSX/') || name.endsWith('/.DS_Store') || name === '.DS_Store'
}

export function pruefeModulPaket(bytes: Uint8Array, appVersion: string): GeprueftesModul {
  let summe = 0
  let unsicher: string | null = null
  let dateien: Record<string, Uint8Array>
  try {
    dateien = unzipSync(bytes, {
      filter: (datei) => {
        if (datei.name.endsWith('/') || istBeiwerk(datei.name)) return false
        if (!istSichererModulPfad(datei.name)) {
          unsicher ??= datei.name
          return false
        }
        summe += datei.originalSize
        return summe <= MODUL_GROESSE_MAX
      },
    })
  } catch {
    throw new ModulPaketFehler(serverText('server.zusatzmodule.keinPaket'))
  }
  if (unsicher !== null) {
    throw new ModulPaketFehler(serverText('server.zusatzmodule.pfadUngueltig', { pfad: unsicher }))
  }
  if (summe > MODUL_GROESSE_MAX) {
    throw new ModulPaketFehler(
      serverText('server.zusatzmodule.zuGross', {
        hoechstens: String(MODUL_GROESSE_MAX / 1024 / 1024),
      }),
    )
  }

  const manifestDatei = dateien[ZUSATZMODUL_MANIFEST]
  if (!manifestDatei) throw new ModulPaketFehler(serverText('server.zusatzmodule.manifestFehlt'))
  let roh: unknown
  try {
    roh = JSON.parse(new TextDecoder().decode(manifestDatei))
  } catch {
    throw new ModulPaketFehler(
      serverText('server.zusatzmodule.manifestUngueltig', { fehler: 'JSON' }),
    )
  }
  const geprueft = zusatzmodulManifestSchema.safeParse(roh)
  if (!geprueft.success) {
    const erstes = geprueft.error.issues[0]
    const stelle = erstes?.path.join('.') || 'manifest'
    throw new ModulPaketFehler(
      serverText('server.zusatzmodule.manifestUngueltig', {
        fehler: `${stelle}: ${erstes?.message ?? ''}`,
      }),
    )
  }
  const manifest = geprueft.data
  if (!dateien[ZUSATZMODUL_CODE]) {
    throw new ModulPaketFehler(serverText('server.zusatzmodule.codeFehlt'))
  }
  if (vergleicheVersionen(appVersion, manifest.app.mindestens) < 0) {
    throw new ModulPaketFehler(
      serverText('server.zusatzmodule.appZuAlt', {
        name: manifest.name,
        mindestens: manifest.app.mindestens,
        app: appVersion,
      }),
    )
  }
  return { manifest, dateien: new Map(Object.entries(dateien)) }
}
