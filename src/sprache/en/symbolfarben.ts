import type { Texte } from '../texte'

export const symbolfarben: Texte['symbolfarben'] = {
  farben: {
    schwarz: 'Black',
    weiss: 'White',
    grau: 'Grey',
    rot: 'Red',
    orange: 'Orange',
    gelb: 'Yellow',
    gruen: 'Green',
    blau: 'Blue',
  },
  strichfarbe: 'Colour',
  fuellung: 'Fill',
  fuellfarbe: 'Fill colour',
  schriftfarbe: 'Text colour',
  wieKomponente: 'same as the component',
  hinweisStandardfarbe:
    'Coloured symbols and texts appear in their own colours on the plan as long as the ' +
    'component has the default colour. With a chosen component colour they are tinted.',
  aenderungFarbe: 'Colour',
  aenderungFuellfarbe: 'Fill colour',
}
