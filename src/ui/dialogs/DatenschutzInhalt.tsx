import { useSprache } from '../sprache-anbindung'
import { DatenschutzInhaltEn } from './DatenschutzInhaltEn'
import { DATENSCHUTZ_STAND } from './datenschutz-stand'

export { DATENSCHUTZ_STAND }

export function DatenschutzInhalt() {
  const sprache = useSprache()
  if (sprache === 'en') return <DatenschutzInhaltEn />
  return (
    <div className="datenschutz-content">
      <p>
        <small>Stand: {DATENSCHUTZ_STAND}</small>
      </p>

      <h3>1. Verantwortlicher</h3>
      <p>
        Die Entwickler von el.easy.CAD Community. Fragen stellen Sie bitte über die Projektseite.
      </p>

      <h3>2. Grundprinzip: keine aktive Datenerhebung</h3>
      <p>
        el.easy.CAD ist als reines Desktop-/Lokal-Werkzeug konzipiert. Es gibt keinen zentralen
        Server, kein Hosting und kein Nutzerkonto. Der Verantwortliche erhebt, sammelt oder empfängt
        keinerlei Daten aus der Nutzung der Anwendung – weder Projektinhalte noch Nutzungs-,
        Diagnose- oder Telemetriedaten. Es gibt keine Analyse-, Tracking- oder
        Crash-Reporting-Dienste in der Anwendung, keine automatische Update-Suche, keine
        Feedback-Funktion und keine Online-Lizenzprüfung. Die Produktlizenz wird vollständig offline
        anhand einer signierten Lizenzdatei geprüft; auch der Endnutzer-Lizenzvertrag verlangt keine
        Verbindung zu einem Server mehr (frühere Fassungen dieser Erklärung beschrieben hier eine
        Übermittlung an den Server des Betreibers – diese Verbindung gibt es seit dieser Fassung
        nicht mehr).
      </p>
      <p>
        Alle Projektdaten (Grundrisse, platzierte Komponenten, Leitungen, Notizen, angehängte
        Dokumente) werden ausschließlich lokal auf Ihrem Rechner verarbeitet und gespeichert:
      </p>
      <ul>
        <li>
          Ein lokaler Begleitserver (ein Hintergrundprozess der Anwendung) verwaltet eine
          SQLite-Datenbank sowie eine Ablage für angehängte Dateien in einem Ordner in Ihrem
          Benutzerverzeichnis (Standard: <code>~/el.easy.CAD Community</code>, enthält{' '}
          <code>el-easy-cad.db</code> und den Unterordner <code>assets</code>). Dieser Server ist
          ausschließlich unter <code>127.0.0.1</code> (dem eigenen Rechner) erreichbar – er ist von
          außen nicht ansprechbar und benötigt deshalb keine Anmeldung.
        </li>
        <li>
          Bereits bestehende, noch nicht umgestellte Projekte bzw. der Produktkatalog können
          zusätzlich im lokalen Browserspeicher (IndexedDB) auf Ihrem Rechner liegen.
        </li>
        <li>
          Eine erworbene Produktlizenz wird als signierte Datei vollständig offline geprüft – ohne
          jede Verbindung zu einem Server.
        </li>
      </ul>
      <p>
        Diese Daten verlassen Ihren Rechner zu keinem Zeitpunkt automatisch. Ob und welche
        personenbezogenen Daten Dritter (z. B. Namen oder Adressen aus einem Bauprojekt) Sie selbst
        in Ihre Projektdateien eintragen, liegt vollständig in Ihrer eigenen Verantwortung als
        Nutzer – der Verantwortliche erhält hiervon keine Kenntnis und ist insoweit nicht
        Verantwortlicher im Sinne der DSGVO, da diese Daten die Anwendung nicht verlassen.
      </p>
      <p>
        Der Produktkatalog wird nicht von einem externen (z. B. Hersteller-)Server geladen, sondern
        liegt vollständig lokal in der Anwendung bzw. lokalen Datenbank vor.
      </p>

      <h3>3. Verschlüsselung</h3>
      <ul>
        <li>
          Der lokale Begleitserver kommuniziert unverschlüsselt über <code>http://127.0.0.1</code> –
          da diese Verbindung Ihren Rechner nie verlässt, ist eine Transportverschlüsselung hier
          ohne Schutzwirkung und entfällt bewusst.
        </li>
        <li>
          <strong>Speicherung:</strong> Die lokale SQLite-Datenbank mit Ihren Projektdaten ist nicht
          verschlüsselt abgelegt. Der Schutz Ihrer Daten entspricht damit dem allgemeinen Schutz
          Ihres Benutzerkontos bzw. Ihrer Festplatte (Betriebssystem-Zugriffsrechte, ggf. von Ihnen
          aktivierte Festplattenverschlüsselung wie FileVault/BitLocker). Wer Zugriff auf Ihren
          Rechner bzw. Ihr Benutzerkonto hat, hat auch Zugriff auf die Projektdaten.
        </li>
        <li>Eine Ende-zu-Ende-Verschlüsselung Ihrer Projektdateien ist derzeit nicht umgesetzt.</li>
      </ul>

      <h3>4. Löschmöglichkeiten</h3>
      <p>
        Da alle Daten ausschließlich lokal liegen, haben Sie jederzeit vollständige Kontrolle über
        deren Löschung:
      </p>
      <ul>
        <li>
          <strong>Einzelnes Projekt löschen:</strong> über die Projektverwaltung der Anwendung
          (Projekt löschen). Damit werden der zugehörige Datensatz und die angehängten Dateien aus
          der lokalen Datenbank entfernt.
        </li>
        <li>
          <strong>Alle Anwendungsdaten löschen:</strong> Löschen Sie den Datenordner in Ihrem
          Benutzerverzeichnis (Standard: <code>~/el.easy.CAD Community</code>, enthält die Datei{' '}
          <code>el-easy-cad.db</code> sowie den Ordner <code>assets</code>). Damit sind sämtliche
          Projekte, Dokumente und der lokale Katalogbestand entfernt. Dieser Ordner bleibt bei einer
          Deinstallation der Anwendung bewusst erhalten, damit ein Update oder eine Neuinstallation
          Ihre Projekte nicht verliert – zur endgültigen Löschung muss er manuell entfernt werden.
        </li>
        <li>
          <strong>Browserdaten (ältere/Web-Nutzung):</strong> Für noch nicht umgestellte Projekte
          bzw. den Katalog im Browserspeicher (IndexedDB) löschen Sie die Website-Daten für die
          Anwendung über die Einstellungen Ihres Browsers.
        </li>
      </ul>
      <p>
        Da keine Daten an den Verantwortlichen übermittelt werden, entsteht bei ihm kein
        Datenbestand, der gelöscht werden müsste.
      </p>

      <h3>5. Ihre Rechte</h3>
      <p>
        Soweit im Einzelfall personenbezogene Daten betroffen sind, haben Sie nach der DSGVO das
        Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der
        Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21) sowie das
        Recht auf Beschwerde bei einer Datenschutzaufsichtsbehörde (Art. 77). Da der Verantwortliche
        im Rahmen der Nutzung der Anwendung keine personenbezogenen Daten erhält, haben diese Rechte
        derzeit keinen praktischen Anwendungsfall; für Fragen wenden Sie sich an die Projektseite.
      </p>
      <p>
        Es findet keine automatisierte Entscheidungsfindung und kein Profiling (Art. 22 DSGVO)
        statt.
      </p>

      <h3>6. Bestätigungspflicht und Änderungen dieser Erklärung</h3>
      <p>
        Sie müssen dieser Erklärung aktiv zustimmen, bevor Sie die Anwendung nutzen können: beim
        allerersten Programmstart und erneut nach jeder inhaltlichen Änderung dieser Erklärung
        (erkennbar am „Stand:“-Datum oben). Ohne diese Bestätigung lässt sich die Anwendung nicht
        nutzen.
      </p>
      <p>
        Wird künftig eine weitere Funktion ergänzt, die Daten über den eigenen Rechner hinaus
        verarbeitet (z. B. eine optionale Synchronisierung oder Zusammenarbeit mehrerer Nutzer),
        wird diese Erklärung vor Auslieferung dieser Funktion entsprechend erweitert, das Datum oben
        angepasst und dadurch automatisch eine erneute Bestätigung fällig.
      </p>

      <p>
        Die vollständige Fassung liegt der Anwendung als <code>DATENSCHUTZERKLAERUNG.md</code> bei.
      </p>
    </div>
  )
}
