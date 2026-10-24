import { createPublicKey, type KeyObject } from 'node:crypto'

const OEFFENTLICHER_SCHLUESSEL_SPKI_DER_BASE64 =
  'MCowBQYDK2VwAyEA2QNb7RvmesmO+wFDAzhVLsbJmeyXezt92YqrizMzVlU='

export function leseOeffentlichenSchluessel(): KeyObject {
  return createPublicKey({
    key: Buffer.from(OEFFENTLICHER_SCHLUESSEL_SPKI_DER_BASE64, 'base64'),
    format: 'der',
    type: 'spki',
  })
}
