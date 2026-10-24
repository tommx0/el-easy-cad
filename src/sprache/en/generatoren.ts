import type { Texte } from '../texte'

export const generatoren: Texte['generatoren'] = {
  ersatz: {
    komponente: 'Component',
    komponenteGeloescht: 'Component (deleted)',
    geraetegruppe: 'Device group',
    geraetegruppeGeloescht: 'Device group (deleted)',
    raum: 'Room',
    slot: 'Slot {nr}',
  },
  verteilerplan: {
    passtNichtZumNetz: '-{kennzeichen} ({name}) is not suitable for a single-phase supply.',
    katalogeintragFehlt: '{kennzeichen}: catalogue entry missing, not included.',
    klemmenOhneSchutz: {
      one: '{n} terminal without protective device – column at the end.',
      other: '{n} terminals without protective device – columns at the end.',
    },
    kontaktblock1sFehlt:
      'Contact symbol “Kontaktblock 1S” missing from the catalogue – channels only on the device.',
    kontaktblock2sFehlt:
      'Contact symbol “Kontaktblock 2S” missing from the catalogue – blind pairs only with Up.',
    triacFehlt:
      'Symbol “Triac (Dimmkanal)” missing from the catalogue – dimming channels as contacts.',
    breiterAlsBlatt: '{name} is wider than a sheet.',
    eineSpalte: 'A column',
    unterRand: '{blatt}: extends beyond the bottom edge of the print area.',
    einspeiseklemmeFehlt:
      'Supply terminal (outgoing terminal) missing from the catalogue – supply without terminal.',
    einspeiseklemmeErgaenzt: 'Supply terminal {kennzeichen} added – it is not in the board layout.',
    einspeisungFehlt: 'Supply: not in the catalogue, therefore omitted – {liste}.',
    einspeisungErgaenzt: 'Supply {liste} added – it is not in the board layout.',
    einspeisekette: '{blatt}: supply chain reaches up to the busbar.',
    nichtAngeschlossen: '-{kennzeichen}: {liste} not connected – no wire at this height.',
  },
  assistent: {
    art: {
      HV: 'Main distribution board',
      UV: 'Sub-distribution board',
    },
    verteilung: 'Distribution board',
    verwendung: {
      allgemein: 'General',
      kueche: 'Kitchen',
      garage: 'Garage/wallbox',
      photovoltaik: 'Photovoltaics',
      heizung: 'Heating/heat pump',
      werkstatt: 'Workshop',
      aussenanlage: 'Outdoor area',
      aufzug: 'Lift',
    },
  },
  vorschlag: {
    ohneRaum: 'without room',
    blattOhneRaum: '{blatt} without room',
    knxGruppeMehrereKreise:
      'KNX group “{gruppe}” is in several circuits – channel behind “{kreis}”',
    dreiphasigImWechselstrom: '{kreis}: 3~ on a single-phase supply – created as 1~',
  },
  knxAktor: {
    titelDimm: 'Dimming actuator {n}-fold',
    titelSchaltJalousie: 'Switching/blind actuator {n}-fold',
    titelSchalt: 'Switching actuator {n}-fold',
    stueckliste: 'KNX {titel}',
    funktion: {
      schalten: 'Switching',
      treppenlicht: 'Staircase light',
      zeitschalten: 'Timed switching',
      heizen: 'Heating',
      jalousie: 'Blind',
      rollladen: 'Roller shutter',
      dimmen: 'Dimming',
      frei: 'spare',
    },
    auf: 'Up',
    ab: 'Down',
  },
  knxZuordnung: {
    verschiedeneAnsteuerungen: 'different controls ({liste}) – {vorschlag} assumed',
    nichtUeberAktor: '{name}: {ansteuerung} – not via a switching or dimming actuator',
    verbraucherOhneKnx: 'also supplies loads without a KNX target ({liste})',
    keinSchutzorgan: 'no protective device – put a circuit breaker in front first',
    klemmeGetauscht: '1P+N+PE is replaced by 3P+N+PE (L1 Up, L2 Down)',
    keineZweiAussenleiter: 'Terminal does not have two line conductors',
    kanalFehlt: {
      one: 'No free channel for {n} terminal – add actuators in the distribution board diagram.',
      other: 'No free channel for {n} terminals – add actuators in the distribution board diagram.',
    },
  },
  gruppe: {
    licht: '{raum} light',
    rollo: '{raum} blind',
  },
  leitungsVerknuepfung: {
    verschiedeneGruppen:
      '{a} and {b} are already in different groups (“{gruppeA}”, “{gruppeB}”) – no group created.',
  },
  bestueckung: {
    keineKlemme: '“{eingabe}” is not a terminal – e.g. “X2” or “X1:7”.',
    keineKlemmenleiste: '{leiste} is not a terminal strip (X…).',
    nummerAbEins: 'Terminal numbers start at 1.',
    vergeben: '{klemme} is already taken.',
  },
  etage: {
    eg: 'GF',
    og: '{nr}F',
    ug: 'B1',
    ugNummer: 'B{nr}',
    darueber: '{name} above',
    darunter: '{name} below',
    neu: '{name} (new)',
    neuNummer: '{name} (new {nr})',
  },
  installationszonen: {
    neu: 'New zone',
    kopie: '{name} (copy)',
  },
}
