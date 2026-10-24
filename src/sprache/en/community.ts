import type { Texte } from '../texte'

export const community: Texte['community'] = {
  hinweis: {
    ausgabe: 'Non-commercial use – commercial use only with a supporter licence.',
    stempel: 'NON-COMMERCIAL',
    unterstuetzer: 'Official supporter of the project – {stufe} · {name}.',
    kopfzeileNichtKommerziell: 'Non-commercial use',
    kopfzeileUnterstuetzer: 'Official supporter – {stufe}',
    kopfzeileTitel: 'Show licence and support',
    herkunft: 'This drawing was started under non-commercial use.',
    ifc: 'non-commercial use',
  },
  start: {
    titel: 'Non-commercial use',
    kostenlos:
      'el.easy.CAD Community is free for non-commercial use – with all features and no time ' +
      'limit. Printouts, PDFs and exports carry the note “Non-commercial use”.',
    gewerblich:
      'For business or professional use you need a supporter licence. You receive it when you ' +
      'support the project.',
    abgelaufen:
      'Your supporter licence expired on {datum}. Until you have a new licence, non-commercial ' +
      'use applies again.',
    ungueltig:
      'The stored licence file is invalid. Until you have a valid licence, non-commercial use ' +
      'applies.',
    lizenzEinspielen: 'Install licence…',
    verstanden: 'Got it',
  },
  lizenz: {
    nichtKommerziell: 'Non-commercial use.',
    kommerziell: 'Supporter licence – commercial use permitted.',
    unterstuetzerOhneKommerz: 'Supporter licence – non-commercial use.',
    abgelaufen: 'Supporter licence expired – non-commercial use.',
    ungueltig: 'Licence file invalid – non-commercial use.',
    stufe: 'Supporter tier',
    kommerzielleNutzung: 'Commercial use',
    erlaubt: 'permitted',
    nichtErlaubt: 'not permitted',
  },
  unterstuetzen: {
    titel: 'Support the project',
    githubSponsors: 'Via GitHub Sponsors',
    patreon: 'Via Patreon',
  },
  ueber: {
    fassung: 'Community edition',
    lizenz:
      'Source code under PolyForm Noncommercial 1.0.0: free for any non-commercial use. For ' +
      'commercial use there is a supporter licence.',
    keineDaten:
      'The program does not transmit any data: projects and settings stay on your computer, ' +
      'with no telemetry and no analytics.',
  },
}
