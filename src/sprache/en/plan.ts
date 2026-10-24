import type { Texte } from '../texte'

export const plan: Texte['plan'] = {
  vorgabe: {
    zeichnung: 'New drawing',
    blatt: 'Sheet {nr}',
    trunk: 'Trunk{nr}',
    ebene: {
      hintergrund: 'Background',
      bauelemente: 'Building elements',
      raeume: 'Rooms',
      komponenten: 'Components',
      leitungen: 'Cables',
      bemassung: 'Dimensions',
      grundriss: 'Floor plan (converted)',
    },
  },
}
