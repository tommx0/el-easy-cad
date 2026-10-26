import type { Texte } from '../texte'

export const statuszeile: Texte['statuszeile'] = {
  aria: 'Status bar',
  kiVerbunden: 'AI connected',
  modulAbbrechen: 'Cancel',
  modulAbbrechenTitel: 'Esc or ✕ cancels; all changes are undone.',
  kiBereit: 'AI ready',
  kiBereitTitel: 'AI interface switched on – no request in the last few minutes.',
  laengeTitel:
    'Length of the segment being drawn (straight line from the last point to the pointer). Typing fixes it, Enter sets the point.',
  laenge: 'Length',
  laengeAria: 'Length in metres',
  winkelTitel:
    'Angle of the segment: abs = compass angle (0 = straight up, 90 = right, clockwise), rel = bend relative to the previous segment (+ = right, – = left). Typing fixes the direction, Tab switches the field, Enter sets the point.',
  winkel: 'Angle',
  winkelAbsAria: 'Absolute angle in degrees',
  winkelRelAria: 'Relative angle in degrees',
  einheitTitel: 'Unit of the sheet',
  einheit: 'Unit',
  massstabTitel: 'Scale of the background plan',
  massstab: 'Scale',
  zoomTitel: 'Zoom level (100 % = 1 m equals 100 pixels)',
  zoom: 'Zoom',
  positionTitel: 'Pointer position in model coordinates',
  position: 'Position',
  feldTitel: 'Reference grid square under the pointer',
  feld: 'Square',
  kiZugriff: '{name} is accessing this document.',
  kiZugriffNurLesen: '{name} is accessing this document (read only).',
  kiAssistent: 'AI assistant',
}
