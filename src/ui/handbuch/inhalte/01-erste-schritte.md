# Erste Schritte

el.easy.CAD ist ein Zeichenprogramm für die Elektro- und Netzwerkplanung in Gebäuden. Sie legen
einen vorhandenen Grundriss als Hintergrund unter die Zeichnung, bringen ihn mit einer bekannten
Strecke auf Maß, setzen Komponenten aus einem Produktkatalog hinein, verbinden sie mit Leitungen
und führen diese in Kabelbündeln (Trunks) zusammen. Am Ende drucken Sie jedes Blatt in einem
festen Maßstab aus und exportieren Stücklisten, Leitungs- und Switchlisten nach Excel.

Alles rechnet und speichert auf Ihrem eigenen Rechner. Es gibt kein Nutzerkonto und keine
Zeichnung, die irgendwohin hochgeladen wird.

:::nur-cloud
In der Cloud-Fassung melden Sie sich an, und Ihre Projekte liegen auf dem Server Ihres
Unternehmens. Alles Übrige in diesem Handbuch gilt unverändert.
:::

## Die Oberfläche im Überblick {#oberflaeche}

![Die Oberfläche: Kopfzeile, Symbolleiste, Werkzeuge, Zeichenfläche, Eigenschaften, Blatt-Tabs, Statuszeile](oberflaeche.png)

1. **Kopfzeile** mit Programmnamen, Version und dem Namen des geöffneten Dokuments. Rechts
   sehen Sie, ob alles gespeichert ist.
2. **Menüleiste** – Datei, Bearbeiten, Zeichnen, Blatt, Ansicht, Katalog, Extras, Hilfe.
3. **Symbolleiste** mit den Befehlen, die Sie am häufigsten brauchen. Sie lässt sich frei
   zusammenstellen, siehe [Symbolleiste anpassen](#symbolleiste-anpassen).
4. **Werkzeug-Seitenleiste** links: alle Zeichenwerkzeuge, ab Werk als Liste mit Symbol,
   Tastenkürzel und Namen. Ziehen Sie die rechte Kante nach links, bleiben nur die Symbole
   stehen, siehe [Seitenleiste](#seitenleiste).
5. **Zeichenfläche** – der blau gestrichelte Rahmen ist der spätere Druckbereich; links darüber
   stehen Papierformat und Maßstab. Was außerhalb liegt, kommt nicht auf das Papier.
6. **Eigenschaften** rechts: alles, was am ausgewählten Objekt einstellbar ist.
7. **Blatt-Register** über der Zeichnung: ein Register je Blatt (z. B. Geschoss).
8. **Statuszeile** unten: aktives Werkzeug, was es gerade erwartet, Koordinaten, Zoom sowie –
   beim Zeichnen – Länge und Winkel zum Mittippen.

:::nur-desktop
## Beim Programmstart {#programmstart}

Bevor Sie arbeiten können, fragt das Programm eines ab:

- **Datenschutzerklärung** – beim allerersten Start und wieder, wenn sich die Erklärung inhaltlich
  geändert hat. „Gelesen und akzeptiert“ merkt sich die Zustimmung, „Programm beenden“ schließt
  das Programm.

Danach folgt die Projektübersicht. Ohne kommerzielle Lizenz erscheint beim ersten Start und
nach jedem Update außerdem der Hinweis auf die nicht kommerzielle Nutzung, siehe [Programmfassung und Lizenz](#lizenz).
:::

## Das erste Projekt in zehn Minuten {#erstes-projekt}

1. Das Programm startet mit der Projektübersicht ({{befehl:datei.projekte}}). Legen Sie dort
   einen Kunden, darunter ein Projekt und darunter ein Dokument der Art „Zeichnung“ an.
2. Laden Sie den Grundriss: {{befehl:datei.import-hintergrund}}. PDF, DXF, PNG und JPG werden
   gelesen; bei einer mehrseitigen PDF wählen Sie Seite und Ausschnitt aus.
3. Bringen Sie den Plan auf Maß: {{befehl:werkzeug.kalibrieren}}, eine bekannte Strecke im Plan
   abklicken, das wahre Maß eintippen. Ohne diesen Schritt stimmen weder Längen noch Maßstab.
4. Richten Sie die Zeichenfläche ein: {{befehl:blatt.zeichenflaeche-einrichten}} – Papierformat,
   Ausrichtung und Maßstab. Was darin liegt, kommt später aufs Papier.
5. Setzen Sie die erste Komponente: {{befehl:werkzeug.komponente}}, im Katalog ein Produkt
   wählen, auf den Plan klicken.
6. Verbinden Sie zwei Komponenten: {{befehl:werkzeug.leitung}}, auf den Dockpunkt der ersten
   Komponente klicken, dann auf den der zweiten – die Leitung sucht sich ihren Weg selbst.
7. Drucken Sie das Ergebnis: {{befehl:datei.drucken}} oder {{befehl:datei.export-plan}}.

> Gespeichert wird laufend von selbst. {{befehl:datei.speichern}} erzwingt das Speichern
> sofort – nötig ist es im Normalfall nicht.

## Maus und Tastatur {#maus-und-tastatur}

| Bedienung | Wirkung |
|---|---|
| Linke Maustaste | Zeichnen, auswählen, ziehen |
| Rechte Maustaste gehalten + ziehen | Ausschnitt verschieben |
| Rechtsklick ohne Ziehen | Kontextmenü zum Objekt unter dem Zeiger |
| Mausrad | Zoomen zum Mauszeiger |
| Esc | Laufende Aktion abbrechen, Auswahl aufheben |
| Esc, Esc (zweimal kurz) | Zurück zum Auswahl-Werkzeug |
| Enter | Polylinie, Trunk und Schraffur abschließen |
| Entf | Ausgewählte Objekte löschen |
| D gehalten | Alle Dockpunkte aller Komponenten anzeigen |

Jedes Werkzeug hat zusätzlich ein Tastenkürzel – siehe [Tastenkürzel](#kuerzel-uebersicht).
Die Statuszeile sagt immer, was das aktive Werkzeug als Nächstes erwartet.

## Wenn etwas schiefgeht {#wenn-etwas-schiefgeht}

- **Rückgängig** ({{befehl:bearbeiten.rueckgaengig}}) nimmt jeden Schritt zurück, beliebig weit;
  {{befehl:bearbeiten.wiederholen}} stellt ihn wieder her.
- Ist die Anwendung „nicht verbunden“, läuft der Begleitserver nicht – schließen Sie das
  Programm ganz und starten Sie es neu.
- Meldet das Programm einen Fehler, steht er im Fehlerprotokoll
  ({{befehl:hilfe.fehlerprotokoll}}), siehe [Fehlerprotokoll](#fehlerprotokoll).
:::nur-cloud
  Von dort lässt er sich als Rückmeldung senden.
:::
