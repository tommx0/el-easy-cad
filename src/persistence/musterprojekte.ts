export const MUSTER_ARTEN = ['bauplan', 'elektro'] as const

export type MusterArt = (typeof MUSTER_ARTEN)[number]

export function istMusterArt(wert: unknown): wert is MusterArt {
  return typeof wert === 'string' && (MUSTER_ARTEN as readonly string[]).includes(wert)
}
