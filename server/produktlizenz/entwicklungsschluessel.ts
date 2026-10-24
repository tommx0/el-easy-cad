import { createPrivateKey, createPublicKey, type KeyObject } from 'node:crypto'

const ENTWICKLUNG_OEFFENTLICH_SPKI_DER_BASE64 =
  'MCowBQYDK2VwAyEANlXxjLjjDcB/cFuoaSbwMW5tWMSHM14MlhpVgFZ/lKM='
const ENTWICKLUNG_PRIVAT_PKCS8_DER_BASE64 =
  'MC4CAQAwBQYDK2VwBCIEICOi4IbtsrQXCf9tgJPHFui3gAby2/Ts+0hvwEhCgL7b'

export function leseEntwicklungsOeffentlichenSchluessel(): KeyObject {
  return createPublicKey({
    key: Buffer.from(ENTWICKLUNG_OEFFENTLICH_SPKI_DER_BASE64, 'base64'),
    format: 'der',
    type: 'spki',
  })
}

export function leseEntwicklungsPrivatenSchluessel(): KeyObject {
  return createPrivateKey({
    key: Buffer.from(ENTWICKLUNG_PRIVAT_PKCS8_DER_BASE64, 'base64'),
    format: 'der',
    type: 'pkcs8',
  })
}
