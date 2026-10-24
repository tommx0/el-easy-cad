import type { LizenzModul, Zeichnung } from '../document-model'
import type { KomponentenRahmenBasis } from './druck-canvas'
import { erzeugeDruckCanvas } from './druck-canvas'
import type { PapierWahl } from './layout'
import {
  PAPIER_WIE_ZEICHENFLAECHE,
  berechneAusgabeSeite,
  berechneDruckSeite,
  waehleAusgabePapier,
} from './layout'

const DRUCK_CONTAINER_ID = 'easycad-druck-container'

export async function druckeSeiten(
  projekt: Zeichnung,
  blattIds: string[],
  komponentenRahmenBasis: KomponentenRahmenBasis,
  wasserzeichenAktiv = false,
  lizenznehmer: string | null = null,
  module: readonly LizenzModul[] = [],
  papierWahl: PapierWahl = PAPIER_WIE_ZEICHENFLAECHE,
  ausloesen: (papier: { breiteMm: number; hoeheMm: number }) => Promise<void> = () => {
    window.print()
    return Promise.resolve()
  },
): Promise<void> {
  const blaetter = projekt.blaetter.filter((b) => blattIds.includes(b.id))
  if (blaetter.length === 0) return

  document.getElementById(DRUCK_CONTAINER_ID)?.remove()
  document.getElementById(`${DRUCK_CONTAINER_ID}-style`)?.remove()

  const container = document.createElement('div')
  container.id = DRUCK_CONTAINER_ID

  let papier: { breiteMm: number; hoeheMm: number } | null = null
  for (const blatt of blaetter) {
    const seite = berechneDruckSeite(blatt, module)
    if (!seite || !blatt.zeichenflaeche) continue
    papier ??= waehleAusgabePapier(blatt.zeichenflaeche, papierWahl)
    const canvas = await erzeugeDruckCanvas(
      seite,
      blatt,
      projekt,
      komponentenRahmenBasis,
      wasserzeichenAktiv,
      lizenznehmer,
      berechneAusgabeSeite(seite, papier),
    )
    canvas.style.width = `${papier.breiteMm}mm`
    canvas.style.height = `${papier.hoeheMm}mm`
    canvas.style.display = 'block'
    container.appendChild(canvas)
  }
  if (!papier) return

  starteDruck(
    container,
    `
      @page { size: ${papier.breiteMm}mm ${papier.hoeheMm}mm; margin: 0; }
      #${DRUCK_CONTAINER_ID} canvas { display: block; page-break-after: always; }
      #${DRUCK_CONTAINER_ID} canvas:last-child { page-break-after: auto; }
    `,
  )
  await ausloesen(papier)
}

export async function druckeHtml(html: string, css: string): Promise<void> {
  const container = document.createElement('div')
  container.id = DRUCK_CONTAINER_ID
  container.innerHTML = html
  const bilder = Array.from(container.querySelectorAll('img'))
  for (const bild of bilder) bild.loading = 'eager'
  document.getElementById(DRUCK_CONTAINER_ID)?.remove()
  starteDruck(container, css)
  await Promise.all(bilder.map(bildGeladen))
  window.print()
}

function bildGeladen(bild: HTMLImageElement): Promise<void> {
  if (bild.complete) return Promise.resolve()
  return new Promise((fertig) => {
    bild.addEventListener('load', () => fertig(), { once: true })
    bild.addEventListener('error', () => fertig(), { once: true })
  })
}

function starteDruck(container: HTMLElement, seitenCss: string): void {
  document.getElementById(`${DRUCK_CONTAINER_ID}-style`)?.remove()

  const styleEl = document.createElement('style')
  styleEl.id = `${DRUCK_CONTAINER_ID}-style`
  styleEl.textContent = `
    @media screen {
      #${DRUCK_CONTAINER_ID} { display: none; }
    }
    @media print {
      body > *:not(#${DRUCK_CONTAINER_ID}) { display: none !important; }
      #${DRUCK_CONTAINER_ID} { display: block !important; }
      ${seitenCss}
    }
  `

  document.head.appendChild(styleEl)
  document.body.appendChild(container)

  function aufraeumen() {
    container.remove()
    styleEl.remove()
    window.removeEventListener('afterprint', aufraeumen)
  }
  window.addEventListener('afterprint', aufraeumen)
  window.setTimeout(aufraeumen, 10 * 60 * 1000)
}
