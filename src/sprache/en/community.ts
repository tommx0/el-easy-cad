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
      'el.esy.CAD Community is free for non-commercial use – with all features and no time ' +
      'limit. Printouts, PDFs and exports carry the note “Non-commercial use”.',
    gewerblich: 'The licence does not permit business or professional use.',
    pruefen:
      'All results – plans, lists, cable lengths, distribution board diagrams – are ' +
      'suggestions. Before use, have them checked by a person who is professionally qualified ' +
      'and authorised to do so; for electrical installations, by a qualified electrician. ' +
      'Responsibility for the planning and for compliance with the recognised rules of ' +
      'technology, in particular DIN VDE, remains with the user.',
    haftung:
      'The program is provided free of charge and without any warranty. The licensor is liable ' +
      'only for intent and gross negligence. Liability for injury to life, body or health, for ' +
      'fraudulently concealed defects and under the German Product Liability Act ' +
      '(Produkthaftungsgesetz) remains unaffected.',
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
      'el.esy.CAD Community is licensed under the PolyForm Noncommercial License 1.0.0. The ' +
      'licence text below is binding.',
  },
  update: {
    frageTitel: 'Check for updates',
    frage: 'Should el.esy.CAD Community check on GitHub whether a newer version is available?',
    hinweisGithub:
      'To do so, the program sends a request to GitHub (api.github.com). GitHub learns your IP ' +
      'address and the time of the request; no projects or settings are transmitted.',
    merken: 'Remember my answer (can be changed in the settings under “Licence”)',
    suchen: 'Check',
    nichtSuchen: 'Do not check',
    sucht: 'Checking GitHub …',
    gefundenTitel: 'Update available',
    gefunden: '{name} is available on GitHub. You are using {aktuell}.',
    releaseOeffnen: 'Open release',
    aktuellTitel: 'No update available',
    aktuell: 'You are using the latest version ({aktuell}).',
    fehlerTitel: 'Check failed',
    fehler:
      'GitHub could not be reached or did not respond as expected ({grund}). You can also find ' +
      'new versions directly on the project page:',
    einstellungTitel: 'Updates',
    einstellung: 'At program start',
    einstellungFragen: 'ask whether to check for updates',
    einstellungImmer: 'always check, without asking',
    einstellungNie: 'never check',
    einstellungJetzt: 'Check now…',
  },
  ueber: {
    fassung: 'Community edition',
    lizenz: 'Source code under PolyForm Noncommercial 1.0.0: free for any non-commercial use.',
    keineDaten:
      'The program does not transmit any data: projects and settings stay on your computer, ' +
      'with no telemetry and no analytics. Only if you allow it does it ask GitHub for a newer ' +
      'version.',
  },
}
