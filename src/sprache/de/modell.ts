export const modell = {
  schema: {
    unbekannterHintergrund: 'Unbekannter Hintergrund',
    ungueltigeZeichnung: 'Die Datei ist keine gültige el.easy.CAD-Zeichnung oder beschädigt.',
    keinJson: 'Die Datei enthält kein gültiges JSON.',
  },
  bibliothekPaket: {
    keinJson: '„{datei}“ enthält kein gültiges JSON.',
    neuereVersion: 'Die Bibliothek stammt aus einer neueren Version (Paketversion {version}).',
    falscheForm: '„{datei}“ hat nicht die erwartete Form.',
  },
  verwaltung: {
    projektbezeichnungLeer: 'Die Projektbezeichnung darf nicht leer sein.',
    dokumentnameLeer: 'Der Dokumentname darf nicht leer sein.',
    standNameLeer: 'Der Name des Stands darf nicht leer sein.',
  },
  katalog: {
    grafikFehlt: 'Katalogkomponente braucht ein Bild oder ein Schaltplansymbol.',
  },
  regelwerk: {
    unbekannterTyp: 'Unbekannter Typ ({kennung})',
    unbekannteAnsteuerung: 'Unbekannt ({kennung})',
  },
  symbolZeichnung: {
    nurDatenbild: 'Nur data:image/-Adressen',
  },
  blattSperre: {
    unbekannterHintergrund:
      'Der Hintergrund dieses Blattes stammt aus einer neueren Version von el.easy.CAD und ist nur dort sichtbar. Das Blatt lässt sich hier nur ansehen.',
    ifcOhneModul:
      'Dieses Blatt hat einen IFC-Grundriss. Bearbeiten und Ausgeben setzen das Zusatzmodul „BIM“ voraus – ohne es lässt sich das Blatt nur ansehen.',
  },
  ifcKlassen: {
    namen: {
      IfcOutlet: 'Anschlussdose',
      IfcSwitchingDevice: 'Schaltgerät',
      IfcSensor: 'Sensor',
      IfcActuator: 'Aktor',
      IfcController: 'Steuerung/Regler',
      IfcUnitaryControlElement: 'Bedien-/Anzeigetableau',
      IfcElectricTimeControl: 'Zeitschalter/Relais',
      IfcElectricAppliance: 'Elektrogerät',
      IfcLightFixture: 'Leuchte',
      IfcElectricDistributionBoard: 'Verteiler',
      IfcProtectiveDevice: 'Schutzgerät',
      IfcJunctionBox: 'Abzweigdose',
      IfcCommunicationsAppliance: 'Kommunikationsgerät',
      IfcAudioVisualAppliance: 'Audio-/Videogerät',
      IfcAlarm: 'Alarm-/Meldegerät',
      IfcElectricGenerator: 'Erzeuger',
      IfcSolarDevice: 'Solarmodul',
      IfcElectricFlowStorageDevice: 'Energiespeicher/USV',
      IfcTransformer: 'Transformator/Wechselrichter',
      IfcElectricMotor: 'Motor',
      IfcDiscreteAccessory: 'Zubehör – Teil des Geräts',
      IfcBuildingElementProxy: 'ohne Zuordnung',
    },
    mitKlasse: '{bezeichnung} ({klasse})',
    unbekannt: 'Unbekannt ({klasse})',
  },
  ifcBauteilgruppen: {
    namen: {
      waende: 'Wände',
      tueren: 'Türen',
      fenster: 'Fenster',
      tragwerk: 'Tragwerk',
      treppen: 'Treppen und Geländer',
      decken: 'Decken und Dach',
      sonstiges: 'Sonstiges',
    },
    ebene: '{name} (IFC)',
  },
  hintergrundImport: {
    nurPdfOderDxf: 'Nur PDF- oder DXF-Dateien können als Hintergrund geladen werden.',
    nichtLesbar: 'Datei konnte nicht gelesen werden.',
  },
  erkennung: {
    zuLange: 'Die Erkennung hat zu lange gebraucht und wurde abgebrochen.',
    zuVieleLinien: 'Der Plan enthält zu viele Linien für eine Erkennung.',
    vieleFunde:
      '{n} Fundstücke – das ist für einen Grundriss sehr viel und vermutlich überwiegend Rauschen. Eine Probe über einer typischen Wand grenzt die Suche ein; auch eine höhere Mindestlänge hilft.',
  },
}
