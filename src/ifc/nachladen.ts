export interface NachladeBlatt {
  blattId: string
  ifcGuid?: string
  geschossName?: string
  freieHoehe?: number
}

export interface NachladeGeschoss {
  expressId: number
  guid: string
  name: string
}

export function schlageZuordnungVor(
  blaetter: readonly NachladeBlatt[],
  geschosse: readonly NachladeGeschoss[],
): Map<string, number | null> {
  const zuordnung = new Map<string, number | null>()
  const vergeben = new Set<number>()

  for (const blatt of blaetter) {
    if (blatt.freieHoehe !== undefined || !blatt.ifcGuid) continue
    const treffer = geschosse.find((g) => g.guid === blatt.ifcGuid && !vergeben.has(g.expressId))
    if (treffer) {
      zuordnung.set(blatt.blattId, treffer.expressId)
      vergeben.add(treffer.expressId)
    }
  }

  const name = (text: string) => text.trim().toLowerCase()
  for (const blatt of blaetter) {
    if (zuordnung.has(blatt.blattId) || blatt.freieHoehe !== undefined) continue
    const gesucht = blatt.geschossName ? name(blatt.geschossName) : null
    const kandidaten = gesucht
      ? geschosse.filter((g) => name(g.name) === gesucht && !vergeben.has(g.expressId))
      : []
    if (kandidaten.length === 1) {
      zuordnung.set(blatt.blattId, kandidaten[0].expressId)
      vergeben.add(kandidaten[0].expressId)
    } else {
      zuordnung.set(blatt.blattId, null)
    }
  }
  return zuordnung
}
