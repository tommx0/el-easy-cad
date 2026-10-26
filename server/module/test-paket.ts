import { strToU8, zipSync } from 'fflate'
import type { ZusatzmodulManifest } from '../../src/document-model'

export function testManifest(werte: Partial<ZusatzmodulManifest> = {}): ZusatzmodulManifest {
  return {
    kennung: 'de.test.pruefmodul',
    name: 'Prüfmodul',
    version: '1.0.0',
    hersteller: 'Test',
    app: { mindestens: '0.0.1' },
    befehle: [{ id: 'los', titel: 'Los' }],
    ...werte,
  }
}

export function baueTestPaket(
  manifest: unknown = testManifest(),
  dateien: Record<string, string | null> = {},
): Uint8Array {
  const inhalt: Record<string, Uint8Array> = {}
  const alle: Record<string, string | null> = {
    'manifest.json': JSON.stringify(manifest),
    'modul.js': 'export function aktivieren() { return {} }',
    ...dateien,
  }
  for (const [pfad, text] of Object.entries(alle)) if (text !== null) inhalt[pfad] = strToU8(text)
  return zipSync(inhalt)
}
