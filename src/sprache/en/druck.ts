import type { Texte } from '../texte'

export const druck: Texte['druck'] = {
  hinweis: {
    planTitel: 'Overview plan – not to scale',
    planText:
      'This plan is intended solely as an overview. It is not to scale and must not be used for ' +
      'construction design, for taking measurements or for structural calculations.',
    schaltplanTitel: 'Planning aid, not professional engineering design',
    pruefpflicht:
      'All content – in particular automatically generated cable routes, cable lengths, lists ' +
      'and switch and PoE data – is a non-binding working basis. It replaces neither ' +
      'professional engineering design nor verification by a competent person, and before any ' +
      'use (e.g. ordering, quotation, installation, disclosure to third parties) it must be ' +
      'checked by the user, on their own responsibility, for accuracy and completeness. ' +
      'Responsibility for the design and for compliance with the generally recognised rules of ' +
      'technology, in particular DIN VDE, remains with the user. Manufacturer data without ' +
      'warranty – the current data sheets are authoritative.',
    lizenziertFuer: 'Licensed to {name}.',
  },
  rechtliches: {
    blattName: 'Legal notices',
    uebersichtTitel: 'Overview plan – not to scale',
    uebersichtText:
      'The plans and lists created with el.esy.CAD are intended solely as an overview. They are ' +
      'not to scale and must not be used for construction design, for taking measurements or ' +
      'for structural calculations.',
    planungshilfeTitel: 'Planning aid, not professional engineering design',
    planungshilfeText:
      'Automatically generated results – in particular the bill of materials, cable lists and ' +
      'cable lengths, switch and patch panel assignments, PoE power budgets, room lists, control ' +
      'logic and cable routes from automatic routing – are a non-binding working basis. They ' +
      'replace neither professional engineering design nor verification by a competent person.',
    pruefungTitel: 'Verification on the user’s own responsibility',
    pruefungText:
      'Before it is used – for example for orders, quotations, installation or disclosure to ' +
      'third parties – all information must be checked by the user, on their own ' +
      'responsibility, for factual and technical accuracy and completeness. Responsibility for ' +
      'the design and for compliance with the generally recognised rules of technology, in ' +
      'particular DIN VDE, remains with the user. Any damage resulting from a failure to check ' +
      'or from insufficient checking shall be borne by the user.',
    herstellerTitel: 'Manufacturer data',
    herstellerText:
      'Technical data, dimensions, performance values, article numbers and illustrations in the ' +
      'product catalogue originate from manufacturers and are adopted without warranty as to ' +
      'accuracy, completeness or currency. Only the current data sheets of the respective ' +
      'manufacturer are authoritative. The user is responsible for catalogue entries they have ' +
      'created or modified themselves.',
  },
  excelFusszeile: {
    links:
      'Overview, not to scale – all information without warranty and to be checked on your own ' +
      'responsibility, see sheet “{blatt}”',
    linksMitLizenz:
      'Overview, not to scale – all information without warranty and to be checked on your own ' +
      'responsibility, see sheet “{blatt}”, licensed to {name}',
    seite: 'Page &P of &N',
  },
  wasserzeichen: 'Trial version – no commercial use permitted',
  zeichenflaeche: {
    hoch: '{format} portrait · 1:{nenner}',
    quer: '{format} landscape · 1:{nenner}',
  },
  plankopf: {
    felder: {
      rechtlicherEigentuemer: 'Legal owner',
      benennung: 'Title',
      ergaenzung: 'Supplementary title',
      dokumentart: 'Document type',
      erstelltVon: 'Created by',
      geprueftVon: 'Checked by',
      datum: 'Date',
      massstab: 'Scale',
      zeichnungsnummer: 'Drawing number',
      blatt: 'Sheet',
      aenderung: 'Revision',
    },
    blattVonAnzahl: '{nummer} of {anzahl}',
  },
  zeichnungsart: {
    bauplan: 'Floor plan',
    schaltplan: 'Schematic',
  },
  bildschirmfoto: {
    nurAnsicht: 'Without the BIM module, sheet “{name}” is view-only.',
  },
}
