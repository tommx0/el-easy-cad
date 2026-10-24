import type { Texte } from '../texte'

export const ifc: Texte['ifc'] = {
  datei: {
    grundstueck: 'Site',
    komponente: 'Component',
    zubehoer: 'Accessory',
    leitung: 'Cable {nummer}',
    portAnfang: '{name} start',
    portEnde: '{name} end',
    switchPort: '{name} port {port}',
    kabelschacht: 'Cable riser',
    trunk: 'Trunk',
    traeger: '{trunk} – {ausfuehrung}',
    ausfuehrung: { kanal: 'Cable duct', trasse: 'Cable tray', rohr: 'Conduit' },
    montageort: { decke: 'Ceiling', boden: 'Floor' },
    verlegeart: { auf: 'Surface-mounted', in: 'Flush-mounted' },
    verlegeartKuerzel: { auf: 'SM', in: 'FM' },
    wand: 'Wall',
    tuer: 'Door',
    fenster: 'Window',
    wanddurchbruch: 'Wall opening',
    bodenplatte: 'Floor slab',
    raum: 'Room',
    treppe: 'Stairs – {form}',
  },
  bericht: {
    meter: '{wert} m',
    nurAnsicht: '“{blatt}” can only be viewed here – not exported.',
    keineKote: '“{blatt}”: no level – {kote} assumed.',
    unvollstaendigesGeschoss:
      '“{blatt}”: incomplete storey data – cables in the zone “{zone}” assumed at a room height of {raumhoehe}.',
    zubehoerOhneGeraet:
      '“{blatt}”: accessory “{zubehoer}” does not lie on a device – not exported.',
    ohneAbmessung: '{trunk} ({ausfuehrung}): no dimensions – default cross-section assumed.',
    bauteile: 'Building elements: {liste}.',
    anzahl: {
      waende: { one: '{n} wall', other: '{n} walls' },
      tueren: { one: '{n} door', other: '{n} doors' },
      fenster: { one: '{n} window', other: '{n} windows' },
      durchbrueche: { one: '{n} wall opening', other: '{n} wall openings' },
      treppen: { one: '{n} stairs', other: '{n} stairs' },
      platten: { one: '{n} floor slab', other: '{n} floor slabs' },
      raeume: { one: '{n} room', other: '{n} rooms' },
    },
    doppelteKennung: {
      one: '{n} building element taken over from the IFC shares its ID with another one and gets a new ID.',
      other:
        '{n} building elements taken over from the IFC share their ID with another one and get a new ID.',
    },
  },
  export: {
    schaltplan: 'A schematic cannot be exported as IFC.',
    fehlgeschlagen: 'IFC export failed.',
  },
  import: {
    zuGross: 'The IFC file is {mb} MB – at most {max} MB is possible.',
    abgebrochen: 'The IFC import was cancelled.',
    fehlgeschlagen: 'IFC import failed.',
    keineDatei: 'No IFC file open.',
    nichtLesbar: 'The IFC file could not be read.',
    geschossFehlt: 'Storey not found.',
    geschossNichtImModell: 'Storey not in the model.',
  },
}
