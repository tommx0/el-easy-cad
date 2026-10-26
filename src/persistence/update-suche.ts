export const RELEASES_API = 'https://api.github.com/repos/tommx0/el-easy-cad/releases?per_page=30'

export type UpdateSuche = 'fragen' | 'immer' | 'nie'

export interface VerfuegbaresUpdate {
  version: string
  name: string
  url: string
}

type Versionsteile = [number, number, number, number]

export function versionsteile(version: string): Versionsteile | null {
  const treffer = /^v?(\d+)\.(\d+)\.(\d+)(?:-community\.(\d+))?$/.exec(version.trim())
  if (!treffer) return null
  return [
    Number(treffer[1]),
    Number(treffer[2]),
    Number(treffer[3]),
    treffer[4] === undefined ? 0 : Number(treffer[4]),
  ]
}

export function vergleicheVersionen(a: Versionsteile, b: Versionsteile): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

interface GithubRelease {
  tag_name?: unknown
  name?: unknown
  html_url?: unknown
  draft?: unknown
}

export function neuestesUpdate(
  releases: readonly GithubRelease[],
  aktuelleVersion: string,
): VerfuegbaresUpdate | null {
  const aktuell = versionsteile(aktuelleVersion)
  if (!aktuell) return null
  let bestes: { teile: Versionsteile; update: VerfuegbaresUpdate } | null = null
  for (const release of releases) {
    if (release.draft === true) continue
    if (typeof release.tag_name !== 'string' || typeof release.html_url !== 'string') continue
    if (!release.html_url.startsWith('https://github.com/tommx0/el-easy-cad/')) continue
    const teile = versionsteile(release.tag_name)
    if (!teile || vergleicheVersionen(teile, aktuell) <= 0) continue
    if (bestes && vergleicheVersionen(teile, bestes.teile) <= 0) continue
    const version = release.tag_name.replace(/^v/, '')
    bestes = {
      teile,
      update: {
        version,
        name: typeof release.name === 'string' && release.name ? release.name : version,
        url: release.html_url,
      },
    }
  }
  return bestes?.update ?? null
}

export async function sucheUpdate(aktuelleVersion: string): Promise<VerfuegbaresUpdate | null> {
  const antwort = await fetch(RELEASES_API, {
    headers: { Accept: 'application/vnd.github+json' },
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  })
  if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`)
  const daten: unknown = await antwort.json()
  if (!Array.isArray(daten)) throw new Error('Unerwartete Antwort von GitHub')
  return neuestesUpdate(daten as GithubRelease[], aktuelleVersion)
}
