import type { Texte } from '../texte'

export const dreid: Texte['dreid'] = {
  info: {
    meter: '{wert} m',
    geschoss: 'Storey {name}',
    hoehe: 'Height {hoehe}',
  },
  szene: {
    farbschema: {
      plan: 'As in the plan',
      zone: 'By installation zone',
      geraetetyp: 'By device type',
    },
    senkrechteStuecke: 'Vertical sections',
    andereZone: 'Other zone',
    ohneGeraetetyp: 'No device type',
    kennzeichen: 'Reference designation {kennzeichen}',
    montagehoehe: 'Mounting height {hoehe}',
    verlegeart: 'Installation method {art}',
    verlegelaenge: 'Routed length {laenge}',
    querschnitt: 'Cross-section {breite} × {hoehe} cm',
    buendel: 'Bundle',
    kabelschacht: 'Cable riser',
  },
  gebaeude: {
    wand: 'Wall',
    staerke: 'Thickness {cm} cm',
    breite: 'Width {breite}',
    fenster: 'Window',
    bruestungUndHoehe: 'Sill {bruestung}, height {hoehe}',
    tuer: 'Door',
    wanddurchbruch: 'Wall opening',
    treppe: 'Stairs – {form}',
    steigungen: { one: '{n} riser of {cm} cm', other: '{n} risers of {cm} cm' },
    bodenplatte: 'Floor slab',
    oberkante: 'Top edge {wert} above floor level',
  },
}
