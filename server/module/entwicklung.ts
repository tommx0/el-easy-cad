import { readdirSync, readFileSync, statSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import {
  istSichererModulPfad,
  ZUSATZMODUL_CODE,
  ZUSATZMODUL_MANIFEST,
  zusatzmodulManifestSchema,
  type ZusatzmodulManifest,
} from '../../src/document-model'
import { serverText, type ServerText } from '../sprache'

const DATEIEN_MAX = 2000

export type EntwicklungsFund =
  | { ok: true; ordner: string; manifest: ZusatzmodulManifest; stand: string }
  | { ok: false; fehler: ServerText }

export function loeseOrdnerAuf(ordner: string): string {
  const roh = ordner.trim()
  const ohneTilde = roh === '~' || roh.startsWith('~/') ? join(homedir(), roh.slice(1)) : roh
  return isAbsolute(ohneTilde) ? ohneTilde : resolve(ohneTilde)
}

function juengsteAenderung(ordner: string): number {
  let juengste = 0
  let anzahl = 0
  const offen = [ordner]
  while (offen.length > 0 && anzahl < DATEIEN_MAX) {
    const aktuell = offen.pop() as string
    for (const name of readdirSync(aktuell)) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      const pfad = join(aktuell, name)
      const info = statSync(pfad)
      if (info.isDirectory()) offen.push(pfad)
      else {
        anzahl++
        juengste = Math.max(juengste, info.mtimeMs)
      }
    }
  }
  return juengste
}

export function leseEntwicklungsordner(ordner: string): EntwicklungsFund {
  if (!ordner.trim()) return { ok: false, fehler: serverText('server.zusatzmodule.ordnerFehlt') }
  const pfad = loeseOrdnerAuf(ordner)
  let roh: unknown
  try {
    roh = JSON.parse(readFileSync(join(pfad, ZUSATZMODUL_MANIFEST), 'utf-8'))
  } catch {
    return {
      ok: false,
      fehler: serverText('server.zusatzmodule.ordnerOhneManifest', { ordner: pfad }),
    }
  }
  const manifest = zusatzmodulManifestSchema.safeParse(roh)
  if (!manifest.success) {
    const erstes = manifest.error.issues[0]
    return {
      ok: false,
      fehler: serverText('server.zusatzmodule.manifestUngueltig', {
        fehler: `${erstes?.path.join('.') || 'manifest'}: ${erstes?.message ?? ''}`,
      }),
    }
  }
  if (!statSync(join(pfad, ZUSATZMODUL_CODE), { throwIfNoEntry: false })?.isFile()) {
    return { ok: false, fehler: serverText('server.zusatzmodule.codeFehlt') }
  }
  return {
    ok: true,
    ordner: pfad,
    manifest: manifest.data,
    stand: Math.floor(juengsteAenderung(pfad)).toString(36),
  }
}

export function leseEntwicklungsDatei(ordner: string, pfad: string): Buffer | null {
  if (!istSichererModulPfad(pfad)) return null
  const datei = join(ordner, pfad)
  return statSync(datei, { throwIfNoEntry: false })?.isFile() ? readFileSync(datei) : null
}
