import type { Texte } from '../texte'

export const community: Texte['community'] = {
  hinweis: {
    ausgabe: 'Non-commercial use.',
    stempel: 'NON-COMMERCIAL',
    unterstuetzer: 'Official supporter of the project – {stufe} · {name}.',
    kopfzeileNichtKommerziell: 'Non-commercial use',
    kopfzeileUnterstuetzer: 'Official supporter – {stufe}',
    kopfzeileTitel: 'Show licence',
    herkunft: 'This drawing was started under non-commercial use.',
    ifc: 'non-commercial use',
  },
  start: {
    titel: 'Non-commercial use',
    kostenlos:
      'el.easy.CAD Community is free for non-commercial use – with all features and no time ' +
      'limit. Printouts, PDFs and exports carry the note “Non-commercial use”.',
    gewerblich: 'The licence does not permit business or professional use.',
    abgelaufen:
      'Your licence expired on {datum}. Until you have a new licence, non-commercial use ' +
      'applies again.',
    ungueltig:
      'The stored licence file is invalid. Until you have a valid licence, non-commercial use ' +
      'applies.',
    lizenzEinspielen: 'Install licence…',
    verstanden: 'Got it',
  },
  lizenz: {
    nichtKommerziell: 'Non-commercial use.',
    kommerziell: 'Licence – commercial use permitted.',
    unterstuetzerOhneKommerz: 'Licence – non-commercial use.',
    abgelaufen: 'Licence expired – non-commercial use.',
    ungueltig: 'Licence file invalid – non-commercial use.',
    stufe: 'Supporter tier',
    kommerzielleNutzung: 'Commercial use',
    erlaubt: 'permitted',
    nichtErlaubt: 'not permitted',
  },
  lizenztext: {
    knopf: 'Licence text…',
    titel: 'Licence of the Community edition',
    hinweis:
      'el.easy.CAD Community is licensed under the PolyForm Noncommercial License 1.0.0. The ' +
      'licence text below is binding.',
  },
  ueber: {
    fassung: 'Community edition',
    lizenz: 'Source code under PolyForm Noncommercial 1.0.0: free for any non-commercial use.',
    keineDaten:
      'The program does not transmit any data: projects and settings stay on your computer, ' +
      'with no telemetry and no analytics.',
  },
}
