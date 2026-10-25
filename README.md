# el.easy.CAD Community

I'm still working on this page and also the app – it’ll be improved bit by bit. I’ll be adding more information soon. Feel free to test this app. Please read the manual in the program. There are still some issues with workflows and usability. The development is still in progress. The development is still in progress.

Ich arbeite and dieser Seite und werde sie sowie das Programm stetig verbessern. Weitere Informationen werden bald nachgepflegt. Bitte lest Euch die Online Bedienungsanleitung durch. Noch gibt es einige Verbesserungen in der Bendienbarkeit und den workflows. Die Entwicklung ist noch im Gange. Es handelt sich um eine Entwicklungsversion.
*Deutsche Fassung weiter unten.*

el.easy.CAD is a desktop Planning tool for electrical, KNX channel and network installation planning. Load a floor
plan (PDF, DXF, IFC or image) as background, calibrate it, place components from a product
catalogue, route cables automatically, bundle them in trunks and cable risers across storeys, and
print or export every sheet as PDF, Excel or IFC. It also draws schematics and distribution board
diagrams.

The application runs entirely on your computer (PC and MacOS): a small local server stores projects in a SQLite
file, nothing is sent anywhere.

> The user interface and the built-in manual are available in German and English.

## Licence

el.easy.CAD Community is licensed under the
[PolyForm Noncommercial License 1.0.0](LICENSE):

- **Free for any non-commercial use** – private persons, non-profit organisations, schools and
  public institutions as defined by the licence. All features, no time limit. Printouts and
  exports carry the note “Non-commercial use”.
- **Commercial or professional use is not permitted** under this licence.

The licence text in [LICENSE](LICENSE) is binding. Third-party libraries and their licences are
listed in [LICENSES.md](LICENSES.md) and in the app under *Hilfe › Lizenzen der
Fremdbibliotheken*.

## Download

Ready-made apps for macOS (Apple Silicon) and Windows are published under *Releases*. They are
**not signed** with a commercial certificate:

- **macOS:** right-click the app › *Open*, then confirm. Alternatively *System Settings › Privacy &
  Security › Open Anyway*.
- **Windows:** in the SmartScreen dialog click *More info › Run anyway*.

## Building from source

The desktop app is built on the platform it is meant for: the Windows app on Windows (x64), the
macOS app on a Mac with Apple Silicon. Cross-building is not supported.

### Requirements

| | Windows 10/11 (x64) | macOS 13.5 or later (Apple Silicon) |
|---|---|---|
| Node.js | 24 – [nodejs.org](https://nodejs.org) | 24 – [nodejs.org](https://nodejs.org) or `brew install node@24` |
| pnpm | `corepack enable` (version from `package.json`) | `corepack enable` |
| Rust | [rustup](https://rustup.rs), default toolchain `stable-x86_64-pc-windows-msvc` | [rustup](https://rustup.rs) |
| Platform tools | [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the workload “Desktop development with C++”; WebView2 (already part of Windows 10/11) | Xcode Command Line Tools: `xcode-select --install` |
| Git | [git-scm.com](https://git-scm.com) | included in the Command Line Tools |

The build needs an internet connection: it downloads the npm and Rust packages and the official
Node.js runtime from nodejs.org that the app ships with (checked against its SHA-256 checksum).

### Build the desktop app

Run in the repository folder (Windows: PowerShell, macOS: Terminal):

```
pnpm install
node skripte/tauri-sidecar-vorbereiten.mjs
node skripte/tauri-bauen.mjs build
```

The first command installs the dependencies. The second builds the user interface and the local
server and puts both, together with the Node.js runtime, into `src-tauri/`. The third compiles the
desktop app; the first run takes several minutes.

The result is in `src-tauri/target/release/bundle/`:

- **Windows:** `nsis/el.easy.CAD Community_<version>_x64-setup.exe` – an installer.
- **macOS:** `macos/el.easy.CAD Community.app` and `dmg/el.easy.CAD Community_<version>_aarch64.dmg`.
  The app is signed ad hoc only. Copy it to *Applications* and open it the first time with
  right-click › *Open*.

### Run without building the app

For working on the code, the browser version is enough – it needs Node.js and pnpm only, no Rust:

```
pnpm install
pnpm dev
```

`pnpm dev` starts the user interface on http://localhost:5173 and the local server on port 4747.
`pnpm typecheck` checks the TypeScript code, `pnpm build` builds the browser version into `dist/`.

## Feedback

Bug reports and suggestions are welcome as issues. Pull requests are not accepted.

---

## Deutsch

el.easy.CAD ist ein Desktop-CAD für die Elektro-, KNX Sensorkanalzuordnung und Netzwerkplanung: Grundriss als Hintergrund
laden (PDF, DXF, IFC, Bild), kalibrieren, Komponenten aus dem Produktkatalog platzieren, Leitungen
automatisch verlegen, in Trunks und Kabelschächten über Etagen führen und jedes Blatt als PDF,
Excel oder IFC ausgeben – dazu Schaltpläne und Verteilerpläne. KNX Tastsensor oder Schalterkanäle zu Leuchten oder Geräten hinzufüge... kein Problem. Alles läuft auf Ihrem Rechner, es werden keine Daten übertragen.

**Lizenz:** PolyForm Noncommercial 1.0.0 – kostenlos für jede nicht kommerzielle Nutzung, mit
vollem Funktionsumfang und ohne Zeitbegrenzung. Eine gewerbliche oder berufliche Nutzung erlaubt
die Lizenz nicht. Verbindlich ist der englische Lizenztext in [LICENSE](LICENSE).

**Herunterladen:** fertige Apps für macOS und Windows unter *Releases*, ohne kommerzielle
Signatur (macOS: Rechtsklick › Öffnen; Windows: „Weitere Informationen › Trotzdem ausführen“).

**Selbst bauen:** Gebaut wird auf der Zielplattform – Windows (x64) bzw. ein Mac mit Apple
Silicon. Nötig sind Node.js 24, pnpm (`corepack enable`), Rust über rustup und die Werkzeuge der
Plattform: unter Windows die Microsoft C++ Build Tools („Desktopentwicklung mit C++“), unter macOS
die Xcode Command Line Tools (`xcode-select --install`). Dann im Projektordner:

```
pnpm install
node skripte/tauri-sidecar-vorbereiten.mjs
node skripte/tauri-bauen.mjs build
```

Das Ergebnis liegt in `src-tauri/target/release/bundle/` – unter Windows ein Installationsprogramm
(`nsis/…-setup.exe`), unter macOS die App (`macos/`) und ein Disk-Image (`dmg/`). Ohne Rust
startet `pnpm dev` die Browser-Fassung auf http://localhost:5173. Einzelheiten stehen oben im
Abschnitt „Building from source“.

**Rückmeldungen** gern als Issue; Pull Requests werden nicht angenommen.

© 2026 Thomas Marx
