import type { Texte } from '../texte'

export const server: Texte['server'] = {
  fehler: {
    feld: 'Field “{stelle}”: {meldung}',
    ungueltigeDaten: 'Invalid data.',
    intern: 'Unexpected error in the server.',
    keinEndpunkt: 'No endpoint for {methode} {url}.',
  },
  anfrage: {
    kennungAbweichend: 'The ID in the path does not match the ID in the record.',
    paketdateiFehlt: 'The request body must contain the package file.',
    dateiinhaltFehlt: 'The request body must contain the file content.',
    konfliktUngueltig: 'konflikt must be “ersetzen” or “kopie”.',
    grenzeUngueltig: 'grenze must be a whole number between 1 and 100.',
    katalogIdFehlt: 'The target catalogue ID is missing (katalogId).',
  },
  lizenz: {
    erforderlich:
      'el.easy.CAD requires a valid licence. Please load a licence file on the lock screen.',
    fehlt: 'No licence file has been stored.',
    ungueltig: 'This licence file is not valid (signature or format do not match).',
    abgelaufen: 'This licence is not valid for today.',
    gueltig: 'Licence valid.',
  },
  projekte: {
    nichtGefunden: 'Project not found.',
    nichtGefundenOderPapierkorb: 'Project not found or already in the recycle bin.',
    nichtImPapierkorb: 'Project is not in the recycle bin.',
  },
  dokumente: {
    nichtGefunden: 'Document not found.',
    standNichtGefunden: 'Saved version not found.',
    versionsKonflikt:
      'The document has been changed in the meantime (expected: version {erwartet}, found: {vorhanden}).',
    unbekanntesAsset: 'The specified asset does not exist: {assetId}.',
    nichtsZuSichern: 'No content has been saved for this document yet.',
  },
  assets: {
    kennungUngueltig: 'Invalid asset ID.',
    nichtGefunden: 'Asset not found.',
  },
  kataloge: {
    nichtGefunden: 'Catalogue not found.',
    zielNichtGefunden: 'Target catalogue not found.',
    standardAnlegen: 'A built-in catalogue cannot be created manually.',
    loeschschutz: 'The built-in catalogue “{name}” cannot be deleted - it can only be deactivated.',
  },
  katalog: {
    komponenteNichtGefunden: 'Catalogue component not found.',
    standardAendern:
      'The built-in component “{name}” cannot be changed - please edit it as a custom component.',
    loeschschutz:
      'Built-in component “{name}” cannot be deleted - only duplicated user copies can be deleted.',
    verschiebeschutz:
      'The built-in component “{name}” cannot be moved - please duplicate it first; the copy can be moved freely.',
  },
  kabeltypen: {
    nichtGefunden: 'Cable type not found.',
    loeschschutz:
      'The built-in cable type “{bezeichnung}” cannot be deleted - it can only be deactivated.',
  },
  installationszonen: {
    nichtGefunden: 'Installation zone not found.',
    loeschschutz: 'The standard zone “{bezeichnung}” cannot be deleted - it can only be hidden.',
  },
  regelwerk: {
    ungueltig: 'The device rule set is invalid.',
  },
  ki: {
    zustimmungFehlt:
      'Please first confirm that drawing content is sent to the provider of the language model.',
    aufrufUnbekannt: 'The call is unknown or has already expired.',
    verbindungUnbekannt: 'Unknown connection.',
  },
  zusatzmodule: {
    keinPaket: 'The file is not a readable el.easy.CAD add-on module (.eecmod).',
    manifestFehlt: 'The module is missing “manifest.json”.',
    manifestUngueltig: '“manifest.json” in the module is invalid: {fehler}',
    codeFehlt: 'The module is missing “modul.js”.',
    pfadUngueltig: 'The module contains a disallowed file path: “{pfad}”.',
    zuGross: 'The unpacked module is larger than {hoechstens} MB.',
    appZuAlt: 'The module “{name}” requires el.easy.CAD {mindestens} or later (installed: {app}).',
    nichtGefunden: 'Module not installed.',
    dateiNichtGefunden: 'File not found in the module.',
  },
  austausch: {
    projektZuGross:
      'At around {groesse} MB, the project is too large for exchange (at most {hoechstens} MB). Remove backgrounds or documents that are no longer needed and export again.',
    keinProjektpaket: 'The file is not a readable el.easy.CAD project package.',
    keinKatalogpaket: 'The file is not a readable el.easy.CAD catalogue package.',
    dateiFehlt: '“{datei}” is missing from the package.',
    keinJson: '“{datei}” in the package does not contain valid JSON.',
    falscheForm: '“{datei}” in the package does not have the expected structure.',
    neuereVersion: 'The package comes from a newer version (package version {version}).',
    unbekannteKomponente: 'The package contains a component in an unknown format.',
    projektVorhanden: 'A project with this ID already exists: “{bezeichnung}”.',
    katalogVorhanden: 'A catalogue with this ID already exists: “{name}”.',
    katalogNurKopie:
      'The built-in catalogue “{name}” cannot be replaced - it can only be imported as a copy.',
  },
}
