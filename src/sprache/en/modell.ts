import type { Texte } from '../texte'

export const modell: Texte['modell'] = {
  schema: {
    unbekannterHintergrund: 'Unknown background',
    ungueltigeZeichnung: 'The file is not a valid el.easy.CAD drawing or is damaged.',
    keinJson: 'The file does not contain valid JSON.',
  },
  bibliothekPaket: {
    keinJson: '“{datei}” does not contain valid JSON.',
    neuereVersion: 'The library comes from a newer version (package version {version}).',
    falscheForm: '“{datei}” does not have the expected structure.',
  },
  verwaltung: {
    projektbezeichnungLeer: 'The project name must not be empty.',
    dokumentnameLeer: 'The document name must not be empty.',
    standNameLeer: 'The name of the saved version must not be empty.',
  },
  katalog: {
    grafikFehlt: 'A catalogue component needs an image or a schematic symbol.',
  },
  regelwerk: {
    unbekannterTyp: 'Unknown type ({kennung})',
    unbekannteAnsteuerung: 'Unknown ({kennung})',
  },
  symbolZeichnung: {
    nurDatenbild: 'Only data:image/ addresses',
  },
  blattSperre: {
    unbekannterHintergrund:
      'The background of this sheet comes from a newer version of el.easy.CAD and is only visible there. The sheet can only be viewed here.',
    ifcOhneModul:
      'This sheet has an IFC floor plan. Editing and output require the “BIM” add-on module – without it, the sheet can only be viewed.',
  },
  ifcKlassen: {
    namen: {
      IfcOutlet: 'Outlet',
      IfcSwitchingDevice: 'Switching device',
      IfcSensor: 'Sensor',
      IfcActuator: 'Actuator',
      IfcController: 'Controller',
      IfcUnitaryControlElement: 'Control/display panel',
      IfcElectricTimeControl: 'Time switch/relay',
      IfcElectricAppliance: 'Electric appliance',
      IfcLightFixture: 'Luminaire',
      IfcElectricDistributionBoard: 'Distribution board',
      IfcProtectiveDevice: 'Protective device',
      IfcJunctionBox: 'Junction box',
      IfcCommunicationsAppliance: 'Communications appliance',
      IfcAudioVisualAppliance: 'Audio-visual appliance',
      IfcAlarm: 'Alarm/signalling device',
      IfcElectricGenerator: 'Generator',
      IfcSolarDevice: 'Solar module',
      IfcElectricFlowStorageDevice: 'Energy storage/UPS',
      IfcTransformer: 'Transformer/inverter',
      IfcElectricMotor: 'Motor',
      IfcDiscreteAccessory: 'Accessory – part of the device',
      IfcBuildingElementProxy: 'not assigned',
    },
    mitKlasse: '{bezeichnung} ({klasse})',
    unbekannt: 'Unknown ({klasse})',
  },
  ifcBauteilgruppen: {
    namen: {
      waende: 'Walls',
      tueren: 'Doors',
      fenster: 'Windows',
      tragwerk: 'Structure',
      treppen: 'Stairs and railings',
      decken: 'Slabs and roof',
      sonstiges: 'Other',
    },
    ebene: '{name} (IFC)',
  },
  hintergrundImport: {
    nurPdfOderDxf: 'Only PDF or DXF files can be loaded as a background.',
    nichtLesbar: 'The file could not be read.',
  },
  erkennung: {
    zuLange: 'Detection took too long and was cancelled.',
    zuVieleLinien: 'The plan contains too many lines for detection.',
    vieleFunde:
      '{n} findings – that is a great deal for a floor plan and probably mostly noise. A sample over a typical wall narrows the search; a larger minimum length also helps.',
  },
}
