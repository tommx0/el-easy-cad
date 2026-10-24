import type { KatalogWoerterbuch } from '../../katalogwoerterbuch'

export const allgemein: Partial<KatalogWoerterbuch> = {
  kabeltypen: {
    'NYM-J': 'NYM-J',
    'NYY-J': 'NYY-J',
    'NHXMH-J': 'NHXMH-J',
    'H07RN-F': 'H07RN-F',
    'Mantelleitung 300/500 V, trockene und feuchte Innenräume':
      'Sheathed cable 300/500 V, dry and damp indoor areas',
    'Erdkabel 0,6/1 kV, direkt erdverlegbar': 'Underground cable 0.6/1 kV, for direct burial',
    'Halogenfreie Mantelleitung 300/500 V, Flucht- und Rettungswege':
      'Halogen-free sheathed cable 300/500 V, escape routes',
    'Gummischlauchleitung, mechanisch beansprucht, Baustelle und Außenbereich':
      'Rubber-sheathed flexible cable, for mechanical stress, construction sites and outdoor use',
    Fernmeldeleitungen: 'Telecommunication cables',
    'Fernmelde-/Telefonleitung, statisch geschirmt':
      'Telecommunication/telephone cable, with static screen',
    'Halogenfreie Fernmeldeleitung, Industrie- und Meldetechnik':
      'Halogen-free telecommunication cable, industrial and alarm systems',
    Steuerleitungen: 'Control cables',
    'Steuerleitung mit nummerierten Adern (Bauform ÖLFLEX CLASSIC 110)':
      'Control cable with numbered cores (ÖLFLEX CLASSIC 110 type)',
    'Steuerleitung ohne Schutzleiter': 'Control cable without protective conductor',
    'Brandmelde & Funktionserhalt': 'Fire alarm & circuit integrity',
    'Brandmeldekabel halogenfrei, Funktionserhalt E30 nach DIN 4102-12':
      'Fire alarm cable, halogen-free, circuit integrity E30 to DIN 4102-12',
    'Funktionserhalt E30 für Sicherheitsstromversorgung':
      'Circuit integrity E30 for safety power supply',
    Netzwerk: 'Network',
    'Netzwerk-Verlegekabel (Datenleitung), Simplex und Duplex':
      'Network cable for fixed routing (data cable), simplex and duplex',
    Koaxial: 'Coaxial',
    'Antennen-, SAT- und BK-Leitung, 75 Ω': 'Antenna, satellite and cable TV cable, 75 Ω',
  },
  zonen: {
    'Unter der Decke (AP)': 'Below the ceiling (SM)',
    'In der Decke (Mitte der Rohdecke)': 'In the ceiling (centre of the structural slab)',
    'Obere Zone auf der Wand (AP)': 'Upper zone on the wall (SM)',
    'Obere Zone in der Wand (3 cm)': 'Upper zone in the wall (3 cm)',
    'Mittlere Zone auf der Wand (AP)': 'Middle zone on the wall (SM)',
    'Mittlere Zone in der Wand (3 cm)': 'Middle zone in the wall (3 cm)',
    'Untere Zone auf der Wand (AP)': 'Lower zone on the wall (SM)',
    'Untere Zone in der Wand (3 cm)': 'Lower zone in the wall (3 cm)',
    'Auf dem Boden (AP)': 'On the floor (SM)',
    'Im Boden (5 cm)': 'In the floor (5 cm)',
  },
}
