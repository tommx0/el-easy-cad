export interface RichtungsIndex {
  kandidatenFuer(winkel: number): readonly number[]
}

export function erzeugeRichtungsIndex(
  winkelJeSegment: readonly number[],
  winkelToleranz: number,
): RichtungsIndex {
  const faecher = Math.max(1, Math.ceil(Math.PI / Math.max(winkelToleranz, 1e-6)))
  const fachBreite = Math.PI / faecher
  const inhalt: number[][] = Array.from({ length: faecher }, () => [])

  const fachVon = (winkel: number) => {
    const normiert = ((winkel % Math.PI) + Math.PI) % Math.PI
    return Math.min(faecher - 1, Math.floor(normiert / fachBreite))
  }

  winkelJeSegment.forEach((winkel, index) => {
    inhalt[fachVon(winkel)].push(index)
  })

  return {
    kandidatenFuer(winkel) {
      const fach = fachVon(winkel)
      if (faecher <= 3) return inhalt.flat()
      return [
        ...inhalt[(fach - 1 + faecher) % faecher],
        ...inhalt[fach],
        ...inhalt[(fach + 1) % faecher],
      ]
    },
  }
}
