export function erzeugeId(praefix?: string): string {
  const uuid = crypto.randomUUID()
  return praefix ? `${praefix}-${uuid}` : uuid
}
