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
  muster: {
    zeichnung: 'Detached house',
    blatt: { kg: 'B1', eg: 'GF', og: '1F' },
    geschoss: { kg: 'Basement', eg: 'Ground floor', og: 'First floor' },
    raum: {
      technik: 'Plant room',
      waschen: 'Laundry',
      vorrat: 'Store room',
      diele: 'Entrance hall',
      speisekammer: 'Pantry',
      wohnenEssen: 'Living / dining',
      gast: 'Guest room',
      eltern: 'Main bedroom',
      kind1: 'Child 1',
      kind2: 'Child 2',
    },
    schacht: 'Riser shaft',
    trunk: { steig: 'Riser', keller: 'B1' },
    trunkBeschreibung: { steig: 'UV1 – GF/1F', keller: 'UV1 – basement' },
    leitung: { licht: 'Lighting {raum}', steckdosen: 'Socket outlets {raum}' },
    projekt: {
      kunde: 'Sample',
      bauplan: 'Detached house – floor plan',
      elektro: 'Detached house – electrical',
      dokumentBauplan: 'Floor plan',
      dokumentElektro: 'Electrical design',
      notizBauplan:
        'Sample project: detached house with basement, ground floor and first floor, outer dimensions 12.00 × 9.00 m. Walls, doors, windows, rooms, stairs and riser shaft are drawn, the electrical design is still open.',
      notizElektro:
        'Sample project: the same detached house with components placed – distribution board UV1 in the basement, a ceiling luminaire and a switch at the door in every room, socket outlets, data and TV outlets. Cables and trunks have not been routed yet.',
    },
  },
}
