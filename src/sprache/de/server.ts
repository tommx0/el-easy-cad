export const server = {
  fehler: {
    feld: 'Feld "{stelle}": {meldung}',
    ungueltigeDaten: 'Ungültige Daten.',
    intern: 'Unerwarteter Fehler im Server.',
    keinEndpunkt: 'Kein Endpunkt für {methode} {url}.',
  },
  anfrage: {
    kennungAbweichend: 'Die Kennung im Pfad und im Datensatz stimmen nicht überein.',
    paketdateiFehlt: 'Der Anfragekörper muss die Paketdatei enthalten.',
    dateiinhaltFehlt: 'Der Anfragekörper muss den Dateiinhalt enthalten.',
    konfliktUngueltig: 'konflikt muss "ersetzen" oder "kopie" sein.',
    grenzeUngueltig: 'grenze muss eine ganze Zahl zwischen 1 und 100 sein.',
    katalogIdFehlt: 'Die Kennung des Zielkatalogs fehlt (katalogId).',
  },
  lizenz: {
    erforderlich:
      'el.easy.CAD benötigt eine gültige Lizenz. Bitte im Sperrbildschirm eine Lizenzdatei einspielen.',
    fehlt: 'Keine Lizenzdatei hinterlegt.',
    ungueltig: 'Diese Lizenzdatei ist nicht gültig (Signatur oder Format stimmen nicht).',
    abgelaufen: 'Diese Lizenz gilt nicht für den heutigen Tag.',
    gueltig: 'Lizenz gültig.',
  },
  projekte: {
    nichtGefunden: 'Projekt nicht gefunden.',
    nichtGefundenOderPapierkorb: 'Projekt nicht gefunden oder bereits im Papierkorb.',
    nichtImPapierkorb: 'Projekt liegt nicht im Papierkorb.',
  },
  dokumente: {
    nichtGefunden: 'Dokument nicht gefunden.',
    standNichtGefunden: 'Stand nicht gefunden.',
    versionsKonflikt:
      'Das Dokument wurde zwischenzeitlich geändert (erwartet: Version {erwartet}, vorhanden: {vorhanden}).',
    unbekanntesAsset: 'Das angegebene Asset ist nicht vorhanden: {assetId}.',
    nichtsZuSichern: 'Für dieses Dokument wurde noch kein Inhalt gespeichert.',
  },
  assets: {
    kennungUngueltig: 'Ungültige Asset-Kennung.',
    nichtGefunden: 'Asset nicht gefunden.',
  },
  kataloge: {
    nichtGefunden: 'Katalog nicht gefunden.',
    zielNichtGefunden: 'Zielkatalog nicht gefunden.',
    standardAnlegen: 'Ein mitgelieferter Katalog lässt sich nicht von Hand anlegen.',
    loeschschutz:
      'Der mitgelieferte Katalog "{name}" kann nicht gelöscht werden - er lässt sich nur deaktivieren.',
  },
  katalog: {
    komponenteNichtGefunden: 'Katalogkomponente nicht gefunden.',
    standardAendern:
      'Die mitgelieferte Komponente "{name}" kann nicht geändert werden - bitte als eigene Komponente bearbeiten.',
    loeschschutz:
      'Standardkomponente "{name}" kann nicht gelöscht werden - nur duplizierte Benutzer-Kopien sind löschbar.',
    verschiebeschutz:
      'Die mitgelieferte Komponente "{name}" kann nicht verschoben werden - bitte zuerst duplizieren, die Kopie ist frei verschiebbar.',
  },
  kabeltypen: {
    nichtGefunden: 'Kabeltyp nicht gefunden.',
    loeschschutz:
      'Der mitgelieferte Kabeltyp "{bezeichnung}" kann nicht gelöscht werden - er lässt sich nur deaktivieren.',
  },
  installationszonen: {
    nichtGefunden: 'Installationszone nicht gefunden.',
    loeschschutz:
      'Die Standardzone "{bezeichnung}" kann nicht gelöscht werden - sie lässt sich nur ausblenden.',
  },
  regelwerk: {
    ungueltig: 'Das Geräte-Regelwerk ist ungültig.',
  },
  ki: {
    zustimmungFehlt:
      'Bitte zuerst bestätigen, dass Zeichnungsinhalte an den Anbieter des Sprachmodells gehen.',
    aufrufUnbekannt: 'Der Aufruf ist unbekannt oder schon abgelaufen.',
    verbindungUnbekannt: 'Unbekannte Verbindung.',
  },
  zusatzmodule: {
    keinPaket: 'Die Datei ist kein lesbares el.easy.CAD-Modul (.eecmod).',
    manifestFehlt: 'Im Modul fehlt "manifest.json".',
    manifestUngueltig: '"manifest.json" im Modul ist ungültig: {fehler}',
    codeFehlt: 'Im Modul fehlt "modul.js".',
    pfadUngueltig: 'Das Modul enthält einen unzulässigen Dateipfad: "{pfad}".',
    zuGross: 'Das Modul ist entpackt größer als {hoechstens} MB.',
    appZuAlt:
      'Das Modul "{name}" benötigt el.easy.CAD {mindestens} oder neuer (installiert: {app}).',
    nichtGefunden: 'Modul nicht installiert.',
    dateiNichtGefunden: 'Datei im Modul nicht gefunden.',
    ordnerFehlt: 'Für den Entwicklermodus ist kein Ordner angegeben.',
    ordnerOhneManifest: 'Im Ordner „{ordner}“ liegt keine lesbare „manifest.json“.',
    schluesselUngueltig: 'Ungültiger Schlüssel für eine Modul-Einstellung.',
    einstellungZuGross: 'Die Modul-Einstellung ist größer als {hoechstens} KB.',
  },
  austausch: {
    projektZuGross:
      'Das Projekt ist mit rund {groesse} MB zu groß für den Austausch (höchstens {hoechstens} MB). Nicht mehr benötigte Hintergründe oder Dokumente entfernen und erneut exportieren.',
    keinProjektpaket: 'Die Datei ist kein lesbares el.easy.CAD-Projektpaket.',
    keinKatalogpaket: 'Die Datei ist kein lesbares el.easy.CAD-Katalogpaket.',
    dateiFehlt: 'Im Paket fehlt "{datei}".',
    keinJson: '"{datei}" im Paket enthält kein gültiges JSON.',
    falscheForm: '"{datei}" im Paket hat nicht die erwartete Form.',
    neuereVersion: 'Das Paket stammt aus einer neueren Version (Paketversion {version}).',
    unbekannteKomponente: 'Das Paket enthält eine Komponente in unbekanntem Format.',
    projektVorhanden: 'Ein Projekt mit dieser Kennung ist bereits vorhanden: "{bezeichnung}".',
    katalogVorhanden: 'Ein Katalog mit dieser Kennung ist bereits vorhanden: "{name}".',
    katalogNurKopie:
      'Der mitgelieferte Katalog "{name}" kann nicht ersetzt werden - er lässt sich nur als Kopie einspielen.',
  },
}
