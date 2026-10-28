import { meldeFehlerAnProtokoll } from '../persistence'

const WIEDERHOLSPERRE_MS = 60_000

const MAX_MELDUNGEN_JE_SITZUNG = 50

export interface MeldeDrossel {
  darfMelden(signatur: string): boolean
}

export function erzeugeMeldeDrossel(jetzt: () => number = Date.now): MeldeDrossel {
  const zuletztGesendet = new Map<string, number>()
  let gesendet = 0

  return {
    darfMelden(signatur) {
      if (gesendet >= MAX_MELDUNGEN_JE_SITZUNG) return false
      const zeit = jetzt()
      const letzte = zuletztGesendet.get(signatur)
      if (letzte !== undefined && zeit - letzte < WIEDERHOLSPERRE_MS) return false
      zuletztGesendet.set(signatur, zeit)
      gesendet += 1
      return true
    },
  }
}

const drossel = erzeugeMeldeDrossel()

function meldeUnbehandeltenFehler(nachricht: string, stack: string | undefined): void {
  if (!drossel.darfMelden(`${nachricht}|${stack ?? ''}`)) return

  meldeFehlerAnProtokoll({
    nachricht,
    stack,
    kontext: `${navigator.userAgent} · el.esy.CAD v${__APP_VERSION__}`,
  }).catch(() => {})
}

export function registriereGlobaleFehlererfassung(): void {
  window.addEventListener('error', (ereignis) => {
    meldeUnbehandeltenFehler(
      ereignis.message,
      ereignis.error instanceof Error ? ereignis.error.stack : undefined,
    )
  })

  window.addEventListener('unhandledrejection', (ereignis) => {
    const grund: unknown = ereignis.reason
    meldeUnbehandeltenFehler(
      grund instanceof Error ? grund.message : String(grund),
      grund instanceof Error ? grund.stack : undefined,
    )
  })
}
