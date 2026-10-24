# Lizenzen und Nutzungsbedingungen

## el.easy.CAD

© 2026 Thomas Marx

## Abhängigkeiten (Third-Party-Lizenzen)

Diese Datei hat drei Teile:

1. **npm-Pakete** – am 2026-09-15 automatisiert aus dem tatsächlich installierten Abhängigkeitsbaum erzeugt (`pnpm licenses list --prod --long`, 175 Pakete – nur Production-Abhängigkeiten, die in der ausgelieferten Anwendung enthalten sind, keine reinen Build-/Testwerkzeuge). Bei jeder Aktualisierung der Abhängigkeiten (`pnpm update`, neue Pakete) sollte dieser Teil neu erzeugt werden, damit er nicht wie die Vorversion veraltet.
2. **Node.js-Laufzeit und Rust-Crates der Tauri-Apps** – seit 2026-10-25 erzeugt von `node skripte/drittlizenzen-erzeugen.mjs` (braucht `cargo` und Netz) aus `src-tauri/Cargo.lock` und der Node-Version des Sidecars. Nach jedem `cargo update` oder Wechsel der Node-Version neu ausführen; `--pruefen` meldet, ob der Teil noch stimmt. Der Skriptlauf bricht bei einer noch nicht eingeordneten Lizenz ab.
3. **Anhang** mit den Volltexten der Lizenzen der Crates und der vollständigen `LICENSE`-Datei von Node.js (ebenfalls vom Skript erzeugt).

**Alle aufgeführten Lizenzen erlauben kommerzielle Nutzung, Modifikation und Weitergabe.** Keine verlangt die Offenlegung des eigenen Quellcodes (kein GPL/AGPL/SSPL in dem, was ausgeliefert wird; wo GPL/LGPL als eine von mehreren Optionen angeboten wird, wählen wir die permissive). Schwaches, dateibezogenes Copyleft hat nur die MPL-2.0 von **web-ifc** (seit 2026-10-06, IFC-Import) und von fünf unverändert genutzten Rust-Crates (siehe unten).
---

## npm-Pakete (Oberfläche und Begleitserver)

### MIT  (140 Pakete)

Erlaubt kommerzielle Nutzung, Modifikation, Verbreitung und private Nutzung. Bedingung: Copyright-Hinweis und Lizenztext müssen erhalten bleiben.

- **@babel/runtime** 7.29.7 — https://babel.dev/docs/en/next/babel-runtime
- **@fast-csv/format** 4.3.5 — http://c2fo.github.com/fast-csv/packages/format
- **@fast-csv/parse** 4.3.6 — http://c2fo.github.com/fast-csv/packages/parse
- **@fastify/accept-negotiator** 2.1.0 — https://github.com/fastify/accept-negotiator#readme
- **@fastify/ajv-compiler** 4.0.6 — https://github.com/fastify/ajv-compiler#readme
- **@fastify/error** 4.2.0 — https://github.com/fastify/fastify-error#readme
- **@fastify/fast-json-stringify-compiler** 5.1.0 — https://github.com/fastify/fast-json-stringify-compiler#readme
- **@fastify/forwarded** 3.0.2 — https://github.com/fastify/forwarded#readme
- **@fastify/merge-json-schemas** 0.2.1 — https://github.com/fastify/merge-json-schemas#readme
- **@fastify/proxy-addr** 5.1.0 — https://github.com/fastify/proxy-addr#readme
- **@fastify/send** 4.1.1 — https://github.com/fastify/send#readme
- **@fastify/static** 10.1.3 — https://github.com/fastify/fastify-static
- **@lukeed/ms** 2.0.2 — https://github.com/lukeed/ms#readme
- **@napi-rs/canvas** 1.0.8 — https://github.com/Brooooooklyn/canvas#readme
- **@napi-rs/canvas-linux-arm64-gnu** 1.0.8 — https://github.com/Brooooooklyn/canvas#readme
- **@pinojs/redact** 0.4.0 — https://github.com/pinojs/redact#readme
- **@types/node** 14.18.63 — https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node
- **@types/pako** 2.0.4 — https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/pako
- **@types/raf** 3.4.3 — https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/raf
- **@types/react** 19.2.18 — https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react
- **@types/trusted-types** 2.0.7 — https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/trusted-types
- **abstract-logging** 2.0.1 — https://github.com/jsumners/abstract-logging#readme
- **ajv** 8.20.0 — https://ajv.js.org
- **ajv-formats** 3.0.1 — https://github.com/ajv-validator/ajv-formats#readme
- **archiver** 5.3.2 — https://github.com/archiverjs/node-archiver
- **archiver-utils** 2.1.0, 3.0.4 — https://github.com/archiverjs/archiver-utils#readme
- **async** 3.2.6 — https://caolan.github.io/async/
- **atomic-sleep** 1.0.0 — https://github.com/davidmarkclements/atomic-sleep#readme
- **avvio** 9.3.0 — https://github.com/fastify/avvio#readme
- **balanced-match** 1.0.2, 4.0.4 — https://github.com/juliangruber/balanced-match#readme
- **base64-arraybuffer** 1.0.2 — https://github.com/niklasvh/base64-arraybuffer
- **base64-js** 1.5.1 — https://github.com/beatgammit/base64-js
- **bl** 4.1.0 — https://github.com/rvagg/bl
- **bluebird** 3.4.7 — https://github.com/petkaantonov/bluebird
- **brace-expansion** 1.1.18, 2.1.4, 5.0.9 — https://github.com/juliangruber/brace-expansion#readme
- **buffer** 5.7.1 — https://github.com/feross/buffer
- **buffer-crc32** 0.2.13 — https://github.com/brianloveswords/buffer-crc32
- **canvg** 3.0.11 — https://github.com/canvg/canvg#readme
- **compress-commons** 4.1.2 — https://github.com/archiverjs/node-compress-commons
- **concat-map** 0.0.1 — https://github.com/substack/node-concat-map#readme
- **content-disposition** 2.0.1 — https://github.com/jshttp/content-disposition#readme
- **cookie** 1.1.1 — https://github.com/jshttp/cookie#readme
- **core-js** 3.50.0 — https://core-js.io
- **core-util-is** 1.0.3 — https://github.com/isaacs/core-util-is#readme
- **crc32-stream** 4.0.3 — https://github.com/archiverjs/node-crc32-stream
- **css-line-break** 2.1.0 — https://github.com/niklasvh/css-line-break#readme
- **csstype** 3.2.3 — https://github.com/frenic/csstype#readme
- **dayjs** 1.11.23 — https://day.js.org
- **depd** 2.0.0 — https://github.com/dougwilson/nodejs-depd#readme
- **dequal** 2.0.3 — https://github.com/lukeed/dequal#readme
- **dxf-parser** 1.1.2 — https://github.com/gdsestimating/dxf-parser
- **end-of-stream** 1.4.5 — https://github.com/mafintosh/end-of-stream
- **escape-html** 1.0.3 — https://github.com/component/escape-html#readme
- **exceljs** 4.4.0 — https://github.com/exceljs/exceljs#readme
- **fast-csv** 4.3.6 — http://c2fo.github.com/fast-csv
- **fast-decode-uri-component** 1.0.1 — https://github.com/delvedor/fast-decode-uri-component#readme
- **fast-deep-equal** 3.1.3 — https://github.com/epoberezkin/fast-deep-equal#readme
- **fast-json-stringify** 7.0.1 — https://github.com/fastify/fast-json-stringify#readme
- **fast-png** 6.4.0 — https://github.com/image-js/fast-png#readme
- **fast-querystring** 1.1.2 — https://github.com/anonrig/fast-querystring#readme
- **fastify** 5.12.1 — https://fastify.dev/
- **fastify-plugin** 6.0.0 — https://github.com/fastify/fastify-plugin#readme
- **fflate** 0.8.3 — https://101arrowz.github.io/fflate
- **find-my-way** 9.9.0 — https://github.com/delvedor/find-my-way#readme
- **fs-constants** 1.0.0 — https://github.com/mafintosh/fs-constants
- **html2canvas** 1.4.1 — https://html2canvas.hertzen.com
- **http-errors** 2.0.1 — https://github.com/jshttp/http-errors#readme
- **immediate** 3.0.6 — https://github.com/calvinmetcalf/immediate#readme
- **iobuffer** 5.4.0 — https://github.com/image-js/iobuffer#readme
- **ipaddr.js** 2.5.0 — https://github.com/whitequark/ipaddr.js#readme
- **isarray** 1.0.0 — https://github.com/juliangruber/isarray
- **json-schema-ref-resolver** 3.0.0 — https://github.com/fastify/json-schema-ref-resolver#readme
- **json-schema-traverse** 1.0.0 — https://github.com/epoberezkin/json-schema-traverse#readme
- **jspdf** 4.2.1 — https://github.com/parallax/jsPDF
- **lazystream** 1.0.1 — https://github.com/jpommerening/node-lazystream
- **lie** 3.3.0 — https://github.com/calvinmetcalf/lie#readme
- **lodash.defaults** 4.2.0 — https://lodash.com/
- **lodash.difference** 4.5.0 — https://lodash.com/
- **lodash.escaperegexp** 4.1.2 — https://lodash.com/
- **lodash.flatten** 4.4.0 — https://lodash.com/
- **lodash.groupby** 4.6.0 — https://lodash.com/
- **lodash.isboolean** 3.0.3 — https://lodash.com/
- **lodash.isequal** 4.5.0 — https://lodash.com/
- **lodash.isfunction** 3.0.9 — https://lodash.com/
- **lodash.isnil** 4.0.0 — https://lodash.com/
- **lodash.isplainobject** 4.0.6 — https://lodash.com/
- **lodash.isundefined** 3.0.1 — https://lodash.com/
- **lodash.union** 4.6.0 — https://lodash.com/
- **lodash.uniq** 4.5.0 — https://lodash.com/
- **loglevel** 1.9.2 — https://github.com/pimterry/loglevel
- **mime** 3.0.0 — https://github.com/broofa/mime#readme
- **minimist** 1.2.8 — https://github.com/minimistjs/minimist
- **mkdirp** 0.5.6 — https://github.com/substack/node-mkdirp#readme
- **normalize-path** 3.0.0 — https://github.com/jonschlinkert/normalize-path
- **on-exit-leak-free** 2.1.2 — https://github.com/mcollina/on-exit-or-gc#readme
- **path-is-absolute** 1.0.1 — https://github.com/sindresorhus/path-is-absolute#readme
- **performance-now** 2.1.0 — https://github.com/braveg1rl/performance-now
- **pino** 10.3.1 — https://getpino.io
- **pino-abstract-transport** 3.0.0 — https://github.com/pinojs/pino-abstract-transport#readme
- **pino-std-serializers** 7.1.0 — https://github.com/pinojs/pino-std-serializers#readme
- **process-nextick-args** 2.0.1 — https://github.com/calvinmetcalf/process-nextick-args
- **process-warning** 4.0.1, 5.1.0 — https://github.com/fastify/fastify-warning#readme
- **quick-format-unescaped** 4.0.4 — https://github.com/davidmarkclements/quick-format#readme
- **raf** 3.4.1 — https://github.com/chrisdickinson/raf#readme
- **react** 19.2.8 — https://react.dev/
- **react-dom** 19.2.8 — https://react.dev/
- **readable-stream** 2.3.8, 3.6.2 — https://github.com/nodejs/readable-stream#readme
- **real-require** 0.2.0, 1.0.0 — https://github.com/pinojs/real-require
- **regenerator-runtime** 0.13.11 — https://github.com/facebook/regenerator/tree/main#readme
- **require-from-string** 2.0.2 — https://github.com/floatdrop/require-from-string#readme
- **ret** 0.5.0 — https://github.com/fent/ret.js#readme
- **reusify** 1.1.0 — https://github.com/mcollina/reusify#readme
- **rfdc** 1.4.1 — https://github.com/davidmarkclements/rfdc#readme
- **rgbcolor** 1.0.1 — https://github.com/yetzt/node-rgbcolor#readme
- **safe-buffer** 5.1.2, 5.2.1 — https://github.com/feross/safe-buffer
- **safe-regex2** 5.1.1 — https://github.com/fastify/safe-regex2
- **safe-stable-stringify** 2.5.0 — https://github.com/BridgeAR/safe-stable-stringify#readme
- **scheduler** 0.27.0 — https://react.dev/
- **set-cookie-parser** 2.7.2 — https://github.com/nfriedly/set-cookie-parser
- **setimmediate** 1.0.5 — https://github.com/YuzuJS/setImmediate#readme
- **sonic-boom** 4.2.1 — https://github.com/pinojs/sonic-boom#readme
- **stackblur-canvas** 2.7.0 — http://www.quasimondo.com/StackBlurForCanvas/StackBlurDemo.html
- **statuses** 2.0.2 — https://github.com/jshttp/statuses#readme
- **string_decoder** 1.1.1, 1.3.0 — https://github.com/nodejs/string_decoder
- **svg-pathdata** 6.0.3 — https://github.com/nfroidure/svg-pathdata#readme
- **tar-stream** 2.2.0 — https://github.com/mafintosh/tar-stream
- **text-segmentation** 1.0.3 — https://github.com/niklasvh/text-segmentation
- **thread-stream** 4.2.0 — https://github.com/mcollina/thread-stream#readme
- **three** 0.186.1 — https://threejs.org/ (nur nachgeladen)
- **tmp** 0.2.7 — http://github.com/raszi/node-tmp
- **toad-cache** 3.7.4 — https://github.com/kibertoad/toad-cache
- **toidentifier** 1.0.1 — https://github.com/component/toidentifier#readme
- **unzipper** 0.11.6 — https://github.com/ZJONSSON/node-unzipper#readme
- **util-deprecate** 1.0.2 — https://github.com/TooTallNate/util-deprecate
- **utrie** 1.0.2 — https://github.com/niklasvh/utrie
- **uuid** 8.3.2 — https://github.com/uuidjs/uuid#readme
- **xmlchars** 2.2.0 — https://github.com/lddubeau/xmlchars#readme
- **zip-stream** 4.1.1 — https://github.com/archiverjs/node-zip-stream
- **zod** 4.5.4 — https://zod.dev
- **zustand** 5.0.15 — https://github.com/pmndrs/zustand

### ISC  (16 Pakete)

Funktional gleichwertig zu MIT, ebenfalls ohne Copyleft-Pflichten.

- **fastq** 1.20.3 — https://github.com/mcollina/fastq#readme
- **fs.realpath** 1.0.0 — https://github.com/isaacs/fs.realpath#readme
- **fstream** 1.0.12 — https://github.com/npm/fstream#readme
- **glob** 7.2.3 — https://github.com/isaacs/node-glob#readme
- **graceful-fs** 4.2.11 — https://github.com/isaacs/node-graceful-fs#readme
- **idb** 8.0.3 — https://github.com/jakearchibald/idb#readme
- **inflight** 1.0.6 — https://github.com/isaacs/inflight
- **inherits** 2.0.4 — https://github.com/isaacs/inherits#readme
- **minimatch** 3.1.5, 5.1.9 — https://github.com/isaacs/minimatch#readme
- **once** 1.4.0 — https://github.com/isaacs/once#readme
- **rimraf** 2.7.1 — https://github.com/isaacs/rimraf#readme
- **saxes** 5.0.1 — https://github.com/lddubeau/saxes#readme
- **semver** 7.8.5 — https://github.com/npm/node-semver#readme
- **setprototypeof** 1.2.0 — https://github.com/wesleytodd/setprototypeof
- **split2** 4.2.0 — https://github.com/mcollina/split2#readme
- **wrappy** 1.0.2 — https://github.com/npm/wrappy

### Apache-2.0  (3 Pakete)

Erlaubt kommerzielle Nutzung, Modifikation und Verbreitung; verlangt Erhalt von Copyright-/Änderungshinweisen und gewährt zusätzlich eine explizite Patentlizenz. Siehe https://www.apache.org/licenses/LICENSE-2.0

- **crc-32** 1.2.2 — https://sheetjs.com/
- **pdfjs-dist** 6.3.289 — https://mozilla.github.io/pdf.js/
- **readdir-glob** 1.1.3 — https://github.com/Yqnn/node-readdir-glob

### Apache-2.0 OR MIT  (1 Paket)

Doppellizenziert – wir nutzen die Software unter einer der beiden (praktisch: MIT-Bedingungen).

- **@tauri-apps/api** 2.11.1 — https://github.com/tauri-apps/tauri#readme

### MIT OR Apache-2.0  (2 Pakete)

Doppellizenziert – wir nutzen die Software unter einer der beiden (praktisch: MIT-Bedingungen).

- **@tauri-apps/plugin-dialog** 2.7.3 — https://github.com/tauri-apps/plugins-workspace#readme
- **@tauri-apps/plugin-fs** 2.5.2 — https://github.com/tauri-apps/plugins-workspace#readme

### BSD-3-Clause  (5 Pakete)

Permissiv wie MIT, zusätzlich ein Verbot, den Namen der Urheber ohne Erlaubnis zu Werbezwecken zu nutzen.

- **duplexer2** 0.1.4 — https://github.com/deoxxa/duplexer2#readme
- **fast-uri** 3.1.6, 4.1.3 — https://github.com/fastify/fast-uri
- **ieee754** 1.2.1 — https://github.com/feross/ieee754#readme
- **light-my-request** 6.6.0 — https://github.com/fastify/light-my-request#readme
- **secure-json-parse** 4.1.0 — https://github.com/fastify/secure-json-parse#readme

### Unlicense  (1 Paket)

Gemeinfrei (Public Domain) – keine Einschränkungen, keine Namensnennungspflicht.

- **big-integer** 1.6.52 — https://github.com/peterolson/BigInteger.js#readme

### BlueOak-1.0.0  (5 Pakete)

Moderne, bewusst einfach gehaltene permissive Lizenz (Nachfolgeprojekt von Isaac Z. Schlueter/npm-Ökosystem), inhaltlich mit MIT/ISC vergleichbar.

- **glob** 13.0.6 — https://github.com/isaacs/node-glob#readme
- **lru-cache** 11.5.2 — https://github.com/isaacs/node-lru-cache#readme
- **minimatch** 10.2.6 — https://github.com/isaacs/minimatch#readme
- **minipass** 7.1.3 — https://github.com/isaacs/minipass#readme
- **path-scurry** 2.0.2 — https://github.com/isaacs/path-scurry#readme

### MPL-2.0  (1 Paket)

Copyleft nur auf Dateiebene: Wer die Dateien der Bibliothek selbst ändert, muss diese Änderungen offenlegen; die eigene Anwendung bleibt unberührt. el.easy.CAD setzt web-ifc unverändert ein (JS und WASM aus dem npm-Paket), es entstehen also keine Offenlegungspflichten – nur Lizenzhinweis und Quellverweis.

- **web-ifc** 0.0.78 — https://github.com/ThatOpen/engine_web-ifc

### (MPL-2.0 OR Apache-2.0)  (1 Paket)

Doppellizenziert (dompurify) – wir nutzen die Software unter Apache-2.0, damit keine MPL-Dateiweitergabepflichten greifen.

- **dompurify** 3.4.14 — https://github.com/cure53/DOMPurify

### (MIT AND Zlib)  (1 Paket)

Kombination zweier permissiver Lizenzen (pako) – beide ohne Copyleft-Pflichten.

- **pako** 1.0.11, 2.2.0 — https://github.com/nodeca/pako#readme

### (MIT OR GPL-3.0-or-later)  (1 Paket)

Doppellizenziert (jszip) – **wir wählen ausdrücklich die MIT-Option**, damit keine GPL-Pflichten (Quellcode-Offenlegung) entstehen.

- **jszip** 3.10.2 — https://github.com/Stuk/jszip#readme

---

<!-- drittlizenzen-erzeugen:laufzeit-und-crates:anfang -->
## Node.js-Laufzeit (Sidecar der Tauri-Apps)

Die Tauri-Apps bringen für den Begleitserver die offizielle Node.js-Binärdatei **v24.20.0** von nodejs.org mit (`skripte/tauri-sidecar-vorbereiten.mjs`, unverändert). Node.js selbst steht unter **MIT**; die darin einkompilierten Bibliotheken nennt die `LICENSE`-Datei von Node.js, die im Anhang vollständig wiedergegeben ist (Stand Tag v24.20.0). Sie umfasst 44 Bestandteile:

Acorn (`deps/acorn`), c-ares (`deps/cares`), merve (`deps/merve`), ittapi (`deps/v8/third_party/ittapi`), amaro (`deps/amaro`), swc (`deps/amaro/dist`), ICU (`deps/icu-small`), libuv (`deps/uv`), LIEF (`deps/LIEF`), llhttp (`deps/llhttp`), corepack (`deps/corepack`), undici (`deps/undici`), postject (`test/fixtures/postject-copy`), OpenSSL (`deps/openssl`), Punycode.js (`lib/punycode.js`), V8 (`deps/v8`), SipHash (`deps/v8/src/third_party/siphash`), zlib (`deps/zlib`), simdjson (`deps/simdjson`), simdutf (`deps/v8/third_party/simdutf`), ada (`deps/ada`), minimatch (`deps/minimatch`), npm (`deps/npm`), GYP (`tools/gyp`), inspector_protocol (`deps/inspector_protocol`), jinja2 (`tools/inspector_protocol/jinja2`), markupsafe (`tools/inspector_protocol/markupsafe`), cpplint.py (`tools/cpplint.py`), gypi_to_gn.py (`tools/gypi_to_gn.py`), gtest (`deps/googletest`), nghttp2 (`deps/nghttp2`), large_pages (`src/large_pages`), caja (`lib/internal/freeze_intrinsics.js`), brotli (`deps/brotli`), zstd (`deps/zstd`), HdrHistogram (`deps/histogram`), node-heapdump (`src/heap_utils.cc`), rimraf (`lib/internal/fs/rimraf.js`), uvwasi (`deps/uvwasi`), ngtcp2 (`deps/ngtcp2/ngtcp2/`), nghttp3 (`deps/ngtcp2/nghttp3/`), node-fs-extra (`lib/internal/fs/cp`), on-exit-leak-free (`lib/internal/process/finalization`), sonic-boom (`lib/internal/streams/fast-utf8-stream.js`).

Darunter Apache-2.0 (OpenSSL, LIEF, simdjson), Unicode-3.0 (ICU), BSD-3-Clause (V8, ittapi u. a.), Zlib (zlib), sonst überwiegend MIT/ISC – alles permissiv, die Bedingungen erfüllt die mitgegebene Datei.Mitgeliefert wird nur `bin/node`; npm, corepack und die Build-Werkzeuge (GYP, cpplint u. a.) stehen zwar in der Datei, sind aber nicht Teil der App. Die einzigen GPL-Texte darin betreffen Autoconf-Hilfsdateien von ICU (`aclocal.m4`, `config.guess`), die nur beim Bauen von Node.js laufen und ausdrücklich unter der Autoconf-Ausnahme stehen – im ausgelieferten Programm steckt davon nichts.

## Rust-Crates der Tauri-Apps

Erzeugt mit `node skripte/drittlizenzen-erzeugen.mjs` aus `src-tauri/Cargo.lock` (521 Crate-Versionen). Bewusst alle Einträge, auch die nur für eine Plattform (Linux, Windows, macOS) oder nur beim Bauen übersetzten – so deckt die Liste jede Fassung ab, ohne je Ziel getrennt geführt zu werden. Die Urheber stammen aus den Lizenzdateien der Crates, ersatzweise aus deren `Cargo.toml`; die Volltexte stehen einmal je Lizenz im Anhang.

### MIT OR Apache-2.0  (320 Crates)

Doppellizenziert, im Rust-Ökosystem üblich – wir nutzen die Crates unter MIT. Bedingung: Copyright-Hinweis und Lizenztext bleiben erhalten (siehe Anhang).

- **android_log-sys** 0.3.2 — https://github.com/rust-mobile/android_log-sys-rs — Copyright 2016 The android_log_sys Developers; Copyright (c) 2016 The android_log_sys Developers
- **android_logger** 0.15.1 — https://github.com/rust-mobile/android_logger-rs — Copyright 2016 The android_logger Developers; Copyright (c) 2016 The android_logger Developers
- **android_system_properties** 0.1.6 — https://github.com/nical/android_system_properties — Copyright 2016 Nicolas Silva; Copyright (c) 2013 Nicolas Silva
- **anyhow** 1.0.104 — https://github.com/dtolnay/anyhow — Urheber laut Cargo.toml: David Tolnay
- **async-broadcast** 0.7.2 — https://github.com/smol-rs/async-broadcast — Copyright 2020 Yoshua Wuyts; Copyright (c) 2020 Yoshua Wuyts
- **async-channel** 2.5.0 — https://github.com/smol-rs/async-channel — Urheber laut Cargo.toml: Stjepan Glavina
- **async-executor** 1.14.0 — https://github.com/smol-rs/async-executor — Urheber laut Cargo.toml: Stjepan Glavina, John Nunley
- **async-io** 2.6.0 — https://github.com/smol-rs/async-io — Urheber laut Cargo.toml: Stjepan Glavina
- **async-lock** 3.4.2 — https://github.com/smol-rs/async-lock — Urheber laut Cargo.toml: Stjepan Glavina
- **async-process** 2.5.0 — https://github.com/smol-rs/async-process — Urheber laut Cargo.toml: Stjepan Glavina
- **async-recursion** 1.1.1 — https://github.com/dcchut/async-recursion — Urheber laut Cargo.toml: Robert Usher
- **async-signal** 0.2.14 — https://github.com/smol-rs/async-signal — Urheber laut Cargo.toml: John Nunley
- **async-task** 4.7.1 — https://github.com/smol-rs/async-task — Urheber laut Cargo.toml: Stjepan Glavina
- **async-trait** 0.1.92 — https://github.com/dtolnay/async-trait — Urheber laut Cargo.toml: David Tolnay
- **atomic-waker** 1.1.2 — https://github.com/smol-rs/atomic-waker — Copyright (c) 2016 Alex Crichton; Copyright (c) 2017 The Tokio Authors
- **autocfg** 1.5.1 — https://github.com/cuviper/autocfg — Copyright (c) 2018 Josh Stone
- **base64** 0.21.7, 0.22.1, 0.23.1 — https://github.com/marshallpierce/rust-base64 — Copyright (c) 2015 Alice Maz; Copyright (c) 2025 Alice Maz, Marshall Pierce
- **base64ct** 1.8.3 — https://github.com/RustCrypto/formats — Copyright (c) 2014 Steve "Sc00bz" Thomas (steve at tobtu dot com); Copyright (c) 2021-2025 The RustCrypto Project Developers
- **bit-set** 0.8.0 — https://github.com/contain-rs/bit-set — Copyright (c) 2023 The Rust Project Developers
- **bit-vec** 0.8.0 — https://github.com/contain-rs/bit-vec — Copyright (c) 2023 The Rust Project Developers
- **bitflags** 1.3.2, 2.13.1 — https://github.com/bitflags/bitflags — Copyright (c) 2014 The Rust Project Developers
- **block-buffer** 0.10.4 — https://github.com/RustCrypto/utils — Copyright (c) 2018-2019 The RustCrypto Project Developers
- **blocking** 1.7.0 — https://github.com/smol-rs/blocking — die Autoren von blocking
- **bs58** 0.5.1 — https://github.com/Nullus157/bs58-rs — Copyright (c) 2016 The roaring-rs developers.
- **bumpalo** 3.20.3 — https://github.com/fitzgen/bumpalo — Copyright (c) 2019 Nick Fitzgerald
- **camino** 1.2.5 — https://github.com/camino-rs/camino — Urheber laut Cargo.toml: Without Boats, Ashley Williams, Steve Klabnik, Rain
- **cargo_toml** 0.22.3 — https://gitlab.com/lib.rs/cargo_toml — © Kornel Lesiński
- **cargo-platform** 0.1.9 — https://github.com/rust-lang/cargo — die Autoren von cargo-platform
- **cc** 1.4.4 — https://github.com/rust-lang/cc-rs — Copyright (c) 2014 Alex Crichton
- **cesu8** 1.1.0 — https://github.com/emk/cesu8-rs — Copyright (C) 2000-2010 Julian Seward. All rights reserved.; Copyright (c) 2003-2013 University of Illinois at Urbana-Champaign. All rights reserved.; Copyright (c) 2009-2014 by the contributors listed in CREDITS.TXT; Copyright (C) 2008-2010 Tachyon Technologies.; Copyright (c) 2008, Natacha Porté; Copyright (c) 2011, Vicent Martí; Copyright (c) 2013, Devin Torres and the Hoedown authors; Copyright (C) 2012-2014 Free Software Foundation, Inc.; Copyright (C) 2002-2014 Jason Evans; Copyright (C) 2007-2012 Mozilla Foundation.; Copyright (C) 2009-2014 Facebook, Inc.; copyright itself, held by the contributor.
- **cfg-expr** 0.15.8 — https://github.com/EmbarkStudios/cfg-expr — Copyright (c) 2019 Embark Studios
- **cfg-if** 1.0.4 — https://github.com/rust-lang/cfg-if — Copyright (c) 2014 Alex Crichton
- **chrono** 0.4.45 — https://github.com/chronotope/chrono — Copyright (c) 2014, Kang Seonghoon.
- **concurrent-queue** 2.5.0 — https://github.com/smol-rs/concurrent-queue — Urheber laut Cargo.toml: Stjepan Glavina, Taiki Endo, John Nunley
- **const-oid** 0.9.6 — https://github.com/RustCrypto/formats/tree/master/const-oid — Copyright (c) 2020-2022 The RustCrypto Project Developers
- **cookie** 0.18.2 — https://github.com/SergioBenitez/cookie-rs — Copyright 2017 Sergio Benitez; Copyright 2014 Alex Chricton; Copyright (c) 2017 Sergio Benitez; Copyright (c) 2014 Alex Crichton
- **core-foundation** 0.9.4, 0.10.1 — https://github.com/servo/core-foundation-rs — Copyright (c) 2012-2013 Mozilla Foundation
- **core-foundation-sys** 0.8.7 — https://github.com/servo/core-foundation-rs — Copyright (c) 2012-2013 Mozilla Foundation
- **core-graphics** 0.25.0 — https://github.com/servo/core-foundation-rs — Copyright (c) 2012-2013 Mozilla Foundation
- **core-graphics-types** 0.2.0 — https://github.com/servo/core-foundation-rs — Copyright (c) 2012-2013 Mozilla Foundation
- **cpufeatures** 0.2.17 — https://github.com/RustCrypto/utils — Copyright (c) 2020-2025 The RustCrypto Project Developers
- **crc32fast** 1.5.1 — https://github.com/srijs/rust-crc32fast — Copyright (c) 2018 Sam Rijs, Alex Crichton and contributors
- **crossbeam-channel** 0.5.16 — https://github.com/crossbeam-rs/crossbeam — Copyright (c) 2019 The Crossbeam Project Developers; COPYRIGHT AND/OR OTHER APPLICABLE LAW. ANY USE OF THE WORK OTHER THAN AS; copyright protection under copyright law or other applicable laws.; Copyright (c) 2009 The Go Authors. All rights reserved.
- **crossbeam-utils** 0.8.22 — https://github.com/crossbeam-rs/crossbeam — Copyright (c) 2019 The Crossbeam Project Developers
- **crypto-common** 0.1.7 — https://github.com/RustCrypto/traits — Copyright (c) 2021 RustCrypto Developers
- **ctor** 0.8.0 — https://github.com/mmastrac/rust-ctor — Urheber laut Cargo.toml: Matt Mastracci
- **ctor-proc-macro** 0.0.7 — https://github.com/mmastrac/rust-ctor — Urheber laut Cargo.toml: Matt Mastracci
- **curve25519-dalek-derive** 0.1.1 — https://github.com/dalek-cryptography/curve25519-dalek — die Autoren von curve25519-dalek-derive
- **dbus** 0.9.12 — https://github.com/diwic/dbus-rs — Copyright 2014-2018 David Henningsson <diwic@ubuntu.com> and other contributors; Copyright (c) 2014-2018 David Henningsson <diwic@ubuntu.com> and other contributors
- **defmt** 1.1.1 — https://github.com/knurling-rs/defmt — Copyright (c) Ferrous Systems
- **defmt-macros** 1.1.1 — https://github.com/knurling-rs/defmt — Copyright (c) Ferrous Systems
- **defmt-parser** 1.0.0 — https://github.com/knurling-rs/defmt — Urheber laut Cargo.toml: The Knurling-rs developers
- **der** 0.7.10 — https://github.com/RustCrypto/formats/tree/master/der — Copyright (c) 2020-2023 The RustCrypto Project Developers
- **deranged** 0.5.8 — https://github.com/jhpratt/deranged — Copyright 2024 Jacob Pratt et al.; Copyright (c) 2024 Jacob Pratt et al.
- **digest** 0.10.7 — https://github.com/RustCrypto/traits — Copyright (c) 2017 Artyom Pavlov
- **dirs** 6.0.0 — https://github.com/soc/dirs-rs — Copyright (c) 2018-2019 dirs-rs contributors
- **dirs-sys** 0.5.0 — https://github.com/dirs-dev/dirs-sys-rs — Copyright (c) 2018-2019 dirs-rs contributors
- **displaydoc** 0.2.7 — https://github.com/yaahc/displaydoc — Urheber laut Cargo.toml: Jane Lusby
- **dtoa** 1.0.11 — https://github.com/dtolnay/dtoa — Urheber laut Cargo.toml: David Tolnay
- **dtor** 0.3.0 — https://github.com/mmastrac/rust-ctor — Urheber laut Cargo.toml: Matt Mastracci
- **dtor-proc-macro** 0.0.6 — https://github.com/mmastrac/rust-ctor — Urheber laut Cargo.toml: Matt Mastracci
- **dyn-clone** 1.0.20 — https://github.com/dtolnay/dyn-clone — Urheber laut Cargo.toml: David Tolnay
- **ed25519** 2.2.3 — https://github.com/RustCrypto/signatures/tree/master/ed25519 — Copyright 2018-2022 RustCrypto Developers; Copyright (c) 2018-2023 RustCrypto Developers
- **embed_plist** 1.2.2 — https://github.com/nvzqz/embed-plist-rs — Copyright (c) 2020 Nikolai Vazquez
- **enumflags2** 0.7.12 — https://github.com/meithecatte/enumflags2 — Copyright 2017-2023 Maik Klein, Maja Kądziołka; Copyright (c) 2017-2023 Maik Klein, Maja Kądziołka
- **enumflags2_derive** 0.7.12 — https://github.com/meithecatte/enumflags2 — Copyright [2017] [Maik Klein]; Copyright (c) 2017 Maik Klein
- **env_filter** 0.1.4 — https://github.com/rust-cli/env_logger — Copyright (c) Individual contributors
- **equivalent** 1.0.2 — https://github.com/indexmap-rs/equivalent — Copyright (c) 2016--2023
- **erased-serde** 0.4.10 — https://github.com/dtolnay/erased-serde — Urheber laut Cargo.toml: David Tolnay
- **errno** 0.3.14 — https://github.com/lambda-fairy/rust-errno — Copyright (c) 2014 Chris Wong
- **event-listener** 5.4.2 — https://github.com/smol-rs/event-listener — Urheber laut Cargo.toml: Stjepan Glavina, John Nunley
- **event-listener-strategy** 0.5.4 — https://github.com/smol-rs/event-listener-strategy — Urheber laut Cargo.toml: John Nunley
- **fastrand** 2.5.0 — https://github.com/smol-rs/fastrand — Urheber laut Cargo.toml: Stjepan Glavina
- **fdeflate** 0.3.7 — https://github.com/image-rs/fdeflate — Urheber laut Cargo.toml: The image-rs Developers
- **field-offset** 0.3.6 — https://github.com/Diggsey/rust-field-offset — Copyright (c) 2016-2021 Diggory Blake, and other contributors.
- **find-msvc-tools** 0.1.11 — https://github.com/rust-lang/cc-rs — Copyright (c) 2014 Alex Crichton
- **flate2** 1.1.10 — https://github.com/rust-lang/flate2-rs — Copyright (c) 2014-2026 Alex Crichton
- **fnv** 1.0.7 — https://github.com/servo/rust-fnv — Copyright (c) 2017 Contributors
- **foreign-types** 0.5.0 — https://github.com/sfackler/foreign-types — Copyright (c) 2017 The foreign-types Developers
- **foreign-types-macros** 0.2.4 — https://github.com/sfackler/foreign-types — Copyright (c) 2017 The foreign-types Developers
- **foreign-types-shared** 0.3.1 — https://github.com/sfackler/foreign-types — Copyright (c) 2017 The foreign-types Developers
- **form_urlencoded** 1.2.2 — https://github.com/servo/rust-url — Copyright (c) 2013-2016 The rust-url developers
- **futures-channel** 0.3.34 — https://github.com/rust-lang/futures-rs — Copyright (c) 2016 Alex Crichton; Copyright (c) 2017 The Tokio Authors
- **futures-core** 0.3.34 — https://github.com/rust-lang/futures-rs — Copyright (c) 2016 Alex Crichton; Copyright (c) 2017 The Tokio Authors
- **futures-executor** 0.3.34 — https://github.com/rust-lang/futures-rs — Copyright (c) 2016 Alex Crichton; Copyright (c) 2017 The Tokio Authors
- **futures-io** 0.3.34 — https://github.com/rust-lang/futures-rs — Copyright (c) 2016 Alex Crichton; Copyright (c) 2017 The Tokio Authors
- **futures-lite** 2.6.1 — https://github.com/smol-rs/futures-lite — Copyright (c) 2016 Alex Crichton; Copyright (c) 2017 The Tokio Authors
- **futures-macro** 0.3.34 — https://github.com/rust-lang/futures-rs — Copyright (c) 2016 Alex Crichton; Copyright (c) 2017 The Tokio Authors
- **futures-sink** 0.3.34 — https://github.com/rust-lang/futures-rs — Copyright (c) 2016 Alex Crichton; Copyright (c) 2017 The Tokio Authors
- **futures-task** 0.3.34 — https://github.com/rust-lang/futures-rs — Copyright (c) 2016 Alex Crichton; Copyright (c) 2017 The Tokio Authors
- **futures-util** 0.3.34 — https://github.com/rust-lang/futures-rs — Copyright (c) 2016 Alex Crichton; Copyright (c) 2017 The Tokio Authors
- **getrandom** 0.2.17, 0.3.4, 0.4.3 — https://github.com/rust-random/getrandom — Copyright (c) 2018-2024 The rust-random Project Developers; Copyright (c) 2014 The Rust Project Developers; Copyright (c) 2018-2025 The rust-random Project Developers; Copyright (c) 2018-2026 The rust-random Project Developers
- **glob** 0.3.4 — https://github.com/rust-lang/glob — Copyright (c) 2014 The Rust Project Developers
- **hashbrown** 0.12.3, 0.17.1 — https://github.com/rust-lang/hashbrown — Copyright (c) 2016 Amanieu d'Antras
- **heck** 0.4.1, 0.5.0 — https://github.com/withoutboats/heck — Copyright (c) 2015 The Rust Project Developers
- **hermit-abi** 0.5.3 — https://github.com/hermit-os/hermit-rs — die Autoren von hermit-abi
- **hex** 0.4.3 — https://github.com/KokaKiwi/rust-hex — Copyright (c) 2013-2014 The Rust Project Developers.; Copyright (c) 2015-2020 The rust-hex Developers
- **html5ever** 0.38.0 — https://github.com/servo/html5ever — Copyright (c) 2014 The html5ever Project Developers
- **http** 1.5.0 — https://github.com/hyperium/http — Copyright 2017 http-rs authors; Copyright (c) 2017 http-rs authors
- **httparse** 1.10.1 — https://github.com/seanmonstar/httparse — Copyright (c) 2015-2025 Sean McArthur
- **iana-time-zone** 0.1.65 — https://github.com/strawlab/iana-time-zone — Copyright 2020 Andrew Straw; Copyright (c) 2020 Andrew D. Straw
- **iana-time-zone-haiku** 0.1.2 — https://github.com/strawlab/iana-time-zone — Copyright 2020 Andrew Straw; Copyright (c) 2020 Andrew D. Straw
- **ident_case** 1.0.1 — https://github.com/TedDriggs/ident_case — Urheber laut Cargo.toml: Ted Driggs
- **idna** 1.1.0 — https://github.com/servo/rust-url/ — Copyright (c) 2013-2025 The rust-url developers
- **idna_adapter** 1.2.2 — https://github.com/hsivonen/idna_adapter — Copyright (c) The rust-url developers
- **indexmap** 1.9.3, 2.14.1 — https://github.com/bluss/indexmap — Copyright (c) 2016--2017
- **ipnet** 2.12.1 — https://github.com/krisprice/ipnet — Copyright 2017 Juniper Networks, Inc.
- **itoa** 1.0.18 — https://github.com/dtolnay/itoa — Urheber laut Cargo.toml: David Tolnay
- **jni** 0.21.1 — https://github.com/jni-rs/jni-rs — Copyright (c) 2016 Prevoty, Inc. and jni-rs contributors
- **jni-sys** 0.3.1, 0.4.1 — https://github.com/jni-rs/jni-sys — Copyright (c) 2015 The rust-jni-sys Developers
- **jni-sys-macros** 0.4.1 — https://github.com/jni-rs/jni-sys — Urheber laut Cargo.toml: Robert Bragg
- **js-sys** 0.3.104 — https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/js-sys — Copyright (c) 2014 Alex Crichton
- **json-patch** 3.0.1 — https://github.com/idubrov/json-patch — Copyright (c) 2017 Ivan Dubrov
- **jsonptr** 0.6.3 — https://github.com/chanced/jsonptr — Copyright 2024 Chance Dinkins; Copyright (c) 2022 Chance Dinkins
- **keyboard-types** 0.7.0 — https://github.com/pyfisch/keyboard-types — Copyright (c) 2017 Pyfisch
- **keyring** 3.6.3 — https://github.com/hwchen/keyring-rs.git — Copyright [2017] [keyring developers]; Copyright (c) 2016 keyring Developers
- **libappindicator** 0.9.0 — https://crates.io/crates/libappindicator — Copyright (c) 2017-2021 qDot; Copyright (c) 2021 Tauri Apps Contributors
- **libappindicator-sys** 0.9.0 — https://crates.io/crates/libappindicator-sys — die Autoren von libappindicator-sys
- **libc** 0.2.189 — https://github.com/rust-lang/libc — Copyright (c) The Rust Project Developers
- **libdbus-sys** 0.2.7 — https://github.com/diwic/dbus-rs — Copyright 2014-2018 David Henningsson <diwic@ubuntu.com> and other contributors; Copyright (c) 2014-2018 David Henningsson <diwic@ubuntu.com> and other contributors
- **lock_api** 0.4.14 — https://github.com/Amanieu/parking_lot — Copyright (c) 2016 The Rust Project Developers
- **log** 0.4.34 — https://github.com/rust-lang/log — Copyright (c) 2014 The Rust Project Developers
- **markup5ever** 0.38.0 — https://github.com/servo/html5ever — Copyright (c) 2014 The html5ever Project Developers
- **mime** 0.3.17 — https://github.com/hyperium/mime — Copyright (c) 2014 Sean McArthur
- **muda** 0.19.3 — https://github.com/tauri-apps/muda — Copyright (c) 2022-2022 Tauri Programme within The Commons Conservancy
- **ndk** 0.9.0 — https://github.com/rust-mobile/ndk — Urheber laut Cargo.toml: The Rust Mobile contributors
- **ndk-sys** 0.6.0+11769913 — https://github.com/rust-mobile/ndk — Urheber laut Cargo.toml: The Rust Windowing contributors
- **num_threads** 0.1.7 — https://github.com/jhpratt/num_threads — Copyright 2021 Jacob Pratt; Copyright (c) 2021 Jacob Pratt
- **num-conv** 0.2.2 — https://github.com/jhpratt/num-conv — Copyright (c) Jacob Pratt
- **num-traits** 0.2.19 — https://github.com/rust-num/num-traits — Copyright (c) 2014 The Rust Project Developers
- **once_cell** 1.21.4 — https://github.com/matklad/once_cell — Urheber laut Cargo.toml: Aleksey Kladov
- **ordered-stream** 0.2.0 — https://github.com/danieldg/ordered-stream — Urheber laut Cargo.toml: Daniel De Graaf, Zeeshan Ali Khan
- **parking** 2.2.1 — https://github.com/smol-rs/parking — Copyright 2014-2020 The Rust Project Developers
- **parking_lot** 0.12.5 — https://github.com/Amanieu/parking_lot — Copyright (c) 2016 The Rust Project Developers
- **parking_lot_core** 0.9.12 — https://github.com/Amanieu/parking_lot — Copyright (c) 2016 The Rust Project Developers
- **percent-encoding** 2.3.2 — https://github.com/servo/rust-url/ — Copyright (c) 2013-2025 The rust-url developers
- **pin-project-lite** 0.2.17 — https://github.com/taiki-e/pin-project-lite — die Autoren von pin-project-lite
- **piper** 0.2.5 — https://github.com/smol-rs/piper — Urheber laut Cargo.toml: Stjepan Glavina, John Nunley
- **pkcs8** 0.10.2 — https://github.com/RustCrypto/formats/tree/master/pkcs8 — Copyright (c) 2020-2023 The RustCrypto Project Developers
- **pkg-config** 0.3.34 — https://github.com/rust-lang/pkg-config-rs — Copyright (c) 2014 Alex Crichton
- **png** 0.17.16, 0.18.1 — https://github.com/image-rs/image-png — Copyright (c) 2015 nwin
- **polling** 3.11.0 — https://github.com/smol-rs/polling — Urheber laut Cargo.toml: Stjepan Glavina, John Nunley
- **portable-atomic** 1.15.0 — https://github.com/taiki-e/portable-atomic — die Autoren von portable-atomic
- **portable-atomic-util** 0.2.7 — https://github.com/taiki-e/portable-atomic-util — die Autoren von portable-atomic-util
- **powerfmt** 0.2.0 — https://github.com/jhpratt/powerfmt — Copyright 2023 Jacob Pratt et al.; Copyright (c) 2023 Jacob Pratt et al.
- **proc-macro-crate** 1.3.1, 2.0.2, 3.5.0 — https://github.com/bkchr/proc-macro-crate — Urheber laut Cargo.toml: Bastian Köcher
- **proc-macro-error** 1.0.4 — https://gitlab.com/CreepySkeleton/proc-macro-error — Copyright 2019-2020 CreepySkeleton <creepy-skeleton@yandex.ru>; Copyright (c) 2019-2020 CreepySkeleton
- **proc-macro-error-attr** 1.0.4 — https://gitlab.com/CreepySkeleton/proc-macro-error — Copyright 2019-2020 CreepySkeleton <creepy-skeleton@yandex.ru>; Copyright (c) 2019-2020 CreepySkeleton
- **proc-macro2** 1.0.107 — https://github.com/dtolnay/proc-macro2 — Urheber laut Cargo.toml: David Tolnay, Alex Crichton
- **quote** 1.0.47 — https://github.com/dtolnay/quote — Urheber laut Cargo.toml: David Tolnay
- **rand_core** 0.6.4 — https://github.com/rust-random/rand — Copyrights in the Rand project are retained by their contributors. No; copyright assignment is required to contribute to the Rand project.; Copyright 2018 Developers of the Rand project; Copyright (c) 2014 The Rust Project Developers
- **ref-cast** 1.0.27 — https://github.com/dtolnay/ref-cast — Urheber laut Cargo.toml: David Tolnay
- **ref-cast-impl** 1.0.27 — https://github.com/dtolnay/ref-cast — Urheber laut Cargo.toml: David Tolnay
- **regex** 1.13.1 — https://github.com/rust-lang/regex — Copyright (c) 2014 The Rust Project Developers
- **regex-automata** 0.4.18 — https://github.com/rust-lang/regex — Copyright (c) 2014 The Rust Project Developers
- **regex-syntax** 0.8.11 — https://github.com/rust-lang/regex — Copyright (c) 2014 The Rust Project Developers
- **reqwest** 0.12.28, 0.13.4 — https://github.com/seanmonstar/reqwest — Copyright 2016 Sean McArthur; Copyright (c) 2016-2025 Sean McArthur; Copyright (c) 2016-2026 Sean McArthur
- **rustc_version** 0.4.1 — https://github.com/djc/rustc-version-rs — Copyright (c) 2016 The Rust Project Developers
- **rustc-hash** 2.1.3 — https://github.com/rust-lang/rustc-hash — Urheber laut Cargo.toml: The Rust Project Developers
- **rustversion** 1.0.23 — https://github.com/dtolnay/rustversion — Urheber laut Cargo.toml: David Tolnay
- **scopeguard** 1.2.0 — https://github.com/bluss/scopeguard — Copyright (c) 2016-2019 Ulrik Sverdrup "bluss" and scopeguard developers
- **security-framework** 2.11.1, 3.7.0 — https://github.com/kornelski/rust-security-framework — Copyright (c) 2015 Steven Fackler
- **security-framework-sys** 2.17.0 — https://github.com/kornelski/rust-security-framework — Copyright (c) 2015 Steven Fackler
- **semver** 1.0.28 — https://github.com/dtolnay/semver — Urheber laut Cargo.toml: David Tolnay
- **serde** 1.0.229 — https://github.com/serde-rs/serde — Urheber laut Cargo.toml: Erick Tryzelaar, David Tolnay
- **serde_core** 1.0.229 — https://github.com/serde-rs/serde — Urheber laut Cargo.toml: Erick Tryzelaar, David Tolnay
- **serde_derive** 1.0.229 — https://github.com/serde-rs/serde — Urheber laut Cargo.toml: Erick Tryzelaar, David Tolnay
- **serde_derive_internals** 0.29.1 — https://github.com/serde-rs/serde — Urheber laut Cargo.toml: Erick Tryzelaar, David Tolnay
- **serde_json** 1.0.151 — https://github.com/serde-rs/json — Urheber laut Cargo.toml: Erick Tryzelaar, David Tolnay
- **serde_repr** 0.1.21 — https://github.com/dtolnay/serde-repr — Urheber laut Cargo.toml: David Tolnay
- **serde_spanned** 0.6.9, 1.1.1 — https://github.com/toml-rs/toml — Copyright (c) Individual contributors
- **serde_urlencoded** 0.7.1 — https://github.com/nox/serde_urlencoded — Copyright (c) 2016 Anthony Ramine
- **serde_with** 3.22.0 — https://github.com/jonasbb/serde_with/ — Copyright (c) 2015
- **serde_with_macros** 3.22.0 — https://github.com/jonasbb/serde_with/ — Copyright (c) 2015
- **serde-untagged** 0.1.9 — https://github.com/dtolnay/serde-untagged — Urheber laut Cargo.toml: David Tolnay
- **serialize-to-javascript** 0.1.2 — https://github.com/chippers/serialize-to-javascript — Copyright (c) 2021 Chip Reed
- **serialize-to-javascript-impl** 0.1.2 — https://github.com/chippers/serialize-to-javascript — Copyright (c) 2021 Chip Reed
- **servo_arc** 0.4.3 — https://github.com/servo/stylo — Urheber laut Cargo.toml: The Servo Project Developers
- **sha2** 0.10.9 — https://github.com/RustCrypto/hashes — Copyright (c) 2006-2009 Graydon Hoare; Copyright (c) 2009-2013 Mozilla Foundation; Copyright (c) 2016 Artyom Pavlov
- **shlex** 2.0.1 — https://github.com/comex/rust-shlex — Copyright 2015 Nicholas Allegra (comex).; Copyright (c) 2015 Nicholas Allegra (comex).
- **signal-hook** 0.4.4 — https://github.com/vorner/signal-hook — Copyright (c) 2017 tokio-jsonrpc developers
- **signal-hook-registry** 1.4.8 — https://github.com/vorner/signal-hook — Copyright (c) 2017 tokio-jsonrpc developers
- **signature** 2.2.0 — https://github.com/RustCrypto/traits/tree/master/signature — Copyright (c) 2018-2023 RustCrypto Developers
- **siphasher** 1.0.3 — https://github.com/jedisct1/rust-siphash — Copyright 2012-2016 The Rust Project Developers.; Copyright 2016-2026 Frank Denis.
- **smallvec** 1.16.0 — https://github.com/servo/rust-smallvec — Copyright (c) 2018 The Servo Project Developers
- **socket2** 0.6.5 — https://github.com/rust-lang/socket2 — Copyright (c) 2014 Alex Crichton
- **softbuffer** 0.4.8 — https://github.com/rust-windowing/softbuffer — Copyright 2022 Kirill Chibisov
- **spki** 0.7.3 — https://github.com/RustCrypto/formats/tree/master/spki — Copyright (c) 2021-2023 The RustCrypto Project Developers
- **stable_deref_trait** 1.2.1 — https://github.com/storyyeller/stable_deref_trait — Copyright (c) 2017 Robert Grosse
- **string_cache** 0.9.0 — https://github.com/servo/string-cache — Copyright (c) 2012-2013 Mozilla Foundation
- **string_cache_codegen** 0.6.1 — https://github.com/servo/string-cache — Copyright (c) 2012-2013 Mozilla Foundation
- **swift-rs** 1.0.8 — https://github.com/Brendonovich/swift-rs — Copyright 2023 The swift-rs developers; Copyright (c) 2023 The swift-rs Developers
- **syn** 1.0.109, 2.0.119, 3.0.4 — https://github.com/dtolnay/syn — Urheber laut Cargo.toml: David Tolnay
- **system-deps** 6.2.2 — https://github.com/gdesmott/system-deps — Urheber laut Cargo.toml: Guillaume Desmottes, Josh Triplett
- **tao-macros** 0.1.4 — https://github.com/tauri-apps/tao — Copyright (c) 2022 - Present Tauri Apps Contributors
- **tauri** 2.11.5 — https://github.com/tauri-apps/tauri — Copyright (c) 2017 - Present Tauri Apps Contributors
- **tauri-build** 2.6.3 — https://github.com/tauri-apps/tauri — Copyright (c) 2017 - Present Tauri Apps Contributors
- **tauri-codegen** 2.6.3 — https://github.com/tauri-apps/tauri — Copyright (c) 2017 - Present Tauri Apps Contributors
- **tauri-macros** 2.6.3 — https://github.com/tauri-apps/tauri — Copyright (c) 2017 - Present Tauri Apps Contributors
- **tauri-plugin** 2.6.3 — https://github.com/tauri-apps/tauri — Urheber laut Cargo.toml: Tauri Programme within The Commons Conservancy
- **tauri-plugin-dialog** 2.7.3 — https://github.com/tauri-apps/plugins-workspace — Copyright (c) 2017 - Present Tauri Apps Contributors
- **tauri-plugin-fs** 2.5.2 — https://github.com/tauri-apps/plugins-workspace — Copyright (c) 2017 - Present Tauri Apps Contributors
- **tauri-plugin-log** 2.9.1 — https://github.com/tauri-apps/plugins-workspace — Copyright (c) 2017 - Present Tauri Apps Contributors
- **tauri-plugin-opener** 2.5.5 — https://github.com/tauri-apps/plugins-workspace — Copyright (c) 2017 - Present Tauri Apps Contributors
- **tauri-plugin-shell** 2.3.6 — https://github.com/tauri-apps/plugins-workspace — Copyright (c) 2017 - Present Tauri Apps Contributors
- **tauri-plugin-single-instance** 2.4.4 — https://github.com/tauri-apps/plugins-workspace — Copyright (c) 2017 - Present The Tauri Programme in the Commons Conservancy
- **tauri-runtime** 2.11.3 — https://github.com/tauri-apps/tauri — Copyright (c) 2017 - Present Tauri Apps Contributors
- **tauri-runtime-wry** 2.11.4 — https://github.com/tauri-apps/tauri — Copyright (c) 2017 - Present Tauri Apps Contributors
- **tauri-utils** 2.9.3 — https://github.com/tauri-apps/tauri — Copyright (c) 2017 - Present Tauri Apps Contributors
- **tempfile** 3.27.0 — https://github.com/Stebalien/tempfile — Copyright (c) 2015 Steven Allen
- **tendril** 0.5.1 — https://github.com/servo/html5ever — Copyright (c) 2015 Keegan McAllister
- **thiserror** 1.0.69, 2.0.20 — https://github.com/dtolnay/thiserror — Urheber laut Cargo.toml: David Tolnay
- **thiserror-impl** 1.0.69, 2.0.20 — https://github.com/dtolnay/thiserror — Urheber laut Cargo.toml: David Tolnay
- **time** 0.3.55 — https://github.com/time-rs/time — Copyright (c) Jacob Pratt et al.
- **time-core** 0.1.9 — https://github.com/time-rs/time — Copyright (c) Jacob Pratt et al.
- **time-macros** 0.2.32 — https://github.com/time-rs/time — Copyright (c) Jacob Pratt et al.
- **toml** 0.8.2, 0.9.12+spec-1.1.0, 1.1.5+spec-1.1.0 — https://github.com/toml-rs/toml — Copyright (c) Individual contributors
- **toml_datetime** 0.6.3, 0.7.5+spec-1.1.0, 1.1.1+spec-1.1.0 — https://github.com/toml-rs/toml — Copyright (c) 2014 Alex Crichton; Copyright (c) Individual contributors
- **toml_edit** 0.19.15, 0.20.2, 0.25.13+spec-1.1.0 — https://github.com/toml-rs/toml — Copyright (c) Individual contributors
- **toml_parser** 1.1.3+spec-1.1.0 — https://github.com/toml-rs/toml — Copyright (c) Individual contributors
- **toml_writer** 1.1.2+spec-1.1.0 — https://github.com/toml-rs/toml — Copyright (c) Individual contributors
- **tray-icon** 0.24.2 — https://github.com/tauri-apps/tray-icon — Copyright (c) 2022-2022 Tauri Programme within The Commons Conservancy
- **typeid** 1.0.3 — https://github.com/dtolnay/typeid — Urheber laut Cargo.toml: David Tolnay
- **typenum** 1.20.1 — https://github.com/paholg/typenum — Copyright 2014 Paho Lurie-Gregg; Copyright (c) 2014 Paho Lurie-Gregg
- **unic-char-property** 0.9.0 — https://github.com/open-i18n/rust-unic/ — Urheber laut Cargo.toml: The UNIC Project Developers
- **unic-char-range** 0.9.0 — https://github.com/open-i18n/rust-unic/ — Urheber laut Cargo.toml: The UNIC Project Developers
- **unic-common** 0.9.0 — https://github.com/open-i18n/rust-unic/ — Urheber laut Cargo.toml: The UNIC Project Developers
- **unic-ucd-ident** 0.9.0 — https://github.com/open-i18n/rust-unic/ — Urheber laut Cargo.toml: The UNIC Project Developers
- **unic-ucd-version** 0.9.0 — https://github.com/open-i18n/rust-unic/ — Urheber laut Cargo.toml: The UNIC Project Developers
- **unicode-segmentation** 1.13.3 — https://github.com/unicode-rs/unicode-segmentation — Copyright (c) 2015 The Rust Project Developers
- **url** 2.5.8 — https://github.com/servo/rust-url — Copyright (c) 2013-2025 The rust-url developers
- **utf8_iter** 1.0.4 — https://github.com/hsivonen/utf8_iter — Copyright Mozilla Foundation
- **uuid** 1.26.0 — https://github.com/uuid-rs/uuid — Copyright (c) 2014 The Rust Project Developers; Copyright (c) 2018 Ashley Mannix, Christopher Armstrong, Dylan DPC, Hunar Roop Kahlon
- **version_check** 0.9.5 — https://github.com/SergioBenitez/version_check — Copyright (c) 2017-2018 Sergio Benitez
- **wasm-bindgen** 0.2.127 — https://github.com/wasm-bindgen/wasm-bindgen — Copyright (c) 2014 Alex Crichton
- **wasm-bindgen-futures** 0.4.77 — https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/futures — Copyright (c) 2014 Alex Crichton
- **wasm-bindgen-macro** 0.2.127 — https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/macro — Copyright (c) 2014 Alex Crichton
- **wasm-bindgen-macro-support** 0.2.127 — https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/macro-support — Copyright (c) 2014 Alex Crichton
- **wasm-bindgen-shared** 0.2.127 — https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/shared — Copyright (c) 2014 Alex Crichton
- **wasm-streams** 0.5.0 — https://github.com/MattiasBuelens/wasm-streams/ — Urheber laut Cargo.toml: Mattias Buelens
- **web_atoms** 0.2.6 — https://github.com/servo/html5ever — Copyright (c) 2014 The html5ever Project Developers
- **web-sys** 0.3.104 — https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/web-sys — Copyright (c) 2014 Alex Crichton
- **winapi** 0.3.9 — https://github.com/retep998/winapi-rs — Copyright (c) 2015-2018 The winapi-rs Developers
- **winapi-i686-pc-windows-gnu** 0.4.0 — https://github.com/retep998/winapi-rs — Urheber laut Cargo.toml: Peter Atashian
- **winapi-x86_64-pc-windows-gnu** 0.4.0 — https://github.com/retep998/winapi-rs — Urheber laut Cargo.toml: Peter Atashian
- **window-vibrancy** 0.6.0 — https://github.com/tauri-apps/tauri-plugin-vibrancy — Copyright (c) 2020-2022 Tauri Programme within The Commons Conservancy
- **windows** 0.61.3 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows_aarch64_gnullvm** 0.42.2, 0.52.6, 0.53.1 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows_aarch64_msvc** 0.42.2, 0.52.6, 0.53.1 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows_i686_gnu** 0.42.2, 0.52.6, 0.53.1 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows_i686_gnullvm** 0.52.6, 0.53.1 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows_i686_msvc** 0.42.2, 0.52.6, 0.53.1 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows_x86_64_gnu** 0.42.2, 0.52.6, 0.53.1 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows_x86_64_gnullvm** 0.42.2, 0.52.6, 0.53.1 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows_x86_64_msvc** 0.42.2, 0.52.6, 0.53.1 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows-collections** 0.2.0 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows-core** 0.61.2, 0.62.2 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows-future** 0.2.1 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows-implement** 0.60.2 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows-interface** 0.59.3 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows-link** 0.1.3, 0.2.1 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows-numerics** 0.2.0 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows-result** 0.3.4, 0.4.1 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows-strings** 0.4.2, 0.5.1 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows-sys** 0.45.0, 0.59.0, 0.60.2, 0.61.2 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows-targets** 0.42.2, 0.52.6, 0.53.5 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows-threading** 0.1.0 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **windows-version** 0.1.7 — https://github.com/microsoft/windows-rs — Copyright (c) Microsoft Corporation.
- **wry** 0.55.1 — https://github.com/tauri-apps/wry — Copyright (c) 2020-2023 Ngo Iok Ui & Tauri Programme within The Commons Conservancy
- **zeroize** 1.9.0 — https://github.com/RustCrypto/utils — Copyright (c) 2018-2026 The RustCrypto Project Developers

### MIT  (117 Crates)

Erlaubt kommerzielle Nutzung, Modifikation und Weitergabe. Bedingung: Copyright-Hinweis und Lizenztext bleiben erhalten (siehe Anhang).

- **atk** 0.18.2 — https://github.com/gtk-rs/gtk3-rs — Copyrights in the gtk-rs Project project are retained by their contributors.
- **atk-sys** 0.18.2 — https://github.com/gtk-rs/gtk3-rs — Urheber laut Cargo.toml: The gtk-rs Project Developers
- **block2** 0.6.2 — https://github.com/madsmtm/objc2 — Urheber laut Cargo.toml: Mads Marquart
- **bytes** 1.12.1 — https://github.com/tokio-rs/bytes — Copyright (c) 2018 Carl Lerche
- **cairo-rs** 0.18.5 — https://github.com/gtk-rs/gtk-rs-core — Copyrights in the gtk-rs Project project are retained by their contributors.
- **cairo-sys-rs** 0.18.2 — https://github.com/gtk-rs/gtk-rs-core — Urheber laut Cargo.toml: The gtk-rs Project Developers
- **cargo_metadata** 0.19.2 — https://github.com/oli-obk/cargo_metadata — Urheber laut Cargo.toml: Oliver Schneider
- **cfb** 0.7.3 — https://github.com/mdsteele/rust-cfb — Copyright (c) 2017 Matthew D. Steele
- **combine** 4.6.8 — https://github.com/Marwes/combine — Copyright (c) 2015 Markus Westerlind
- **darling** 0.23.0 — https://github.com/TedDriggs/darling — Copyright (c) 2017 Ted Driggs
- **darling_core** 0.23.0 — https://github.com/TedDriggs/darling — Copyright (c) 2017 Ted Driggs
- **darling_macro** 0.23.0 — https://github.com/TedDriggs/darling — Copyright (c) 2017 Ted Driggs
- **derive_more** 2.1.1 — https://github.com/JelteF/derive_more — Copyright (c) 2016 Jelte Fennema
- **derive_more-impl** 2.1.1 — https://github.com/JelteF/derive_more — Copyright (c) 2016 Jelte Fennema
- **dlopen2** 0.8.2 — https://github.com/OpenByteDev/dlopen2 — Urheber laut Cargo.toml: Szymon Wieloch, Ahmed Masud, OpenByte
- **dlopen2_derive** 0.4.3 — https://github.com/OpenByteDev/dlopen2 — Urheber laut Cargo.toml: Szymon Wieloch, OpenByte
- **dom_query** 0.27.0 — https://github.com/niklak/dom_query — Copyright (c) 2023 Mykola Humanov
- **embed-resource** 3.0.11 — https://github.com/nabijaczleweli/rust-embed-resource — Copyright (c) 2017 nabijaczleweli
- **endi** 1.1.1 — https://github.com/zeenix/endi — Urheber laut Cargo.toml: Zeeshan Ali Khan
- **fern** 0.7.1 — https://github.com/daboross/fern — Copyright (c) 2014-2017 David Ross
- **gdk** 0.18.2 — https://github.com/gtk-rs/gtk3-rs — Copyrights in the gtk-rs Project project are retained by their contributors.
- **gdk-pixbuf** 0.18.5 — https://github.com/gtk-rs/gtk-rs-core — Copyrights in the gtk-rs Project project are retained by their contributors.
- **gdk-pixbuf-sys** 0.18.0 — https://github.com/gtk-rs/gtk-rs-core — Urheber laut Cargo.toml: The gtk-rs Project Developers
- **gdk-sys** 0.18.2 — https://github.com/gtk-rs/gtk3-rs — Urheber laut Cargo.toml: The gtk-rs Project Developers
- **gdkwayland-sys** 0.18.2 — https://github.com/gtk-rs/gtk3-rs — Urheber laut Cargo.toml: The gtk-rs Project Developers
- **gdkx11** 0.18.2 — https://github.com/gtk-rs/gtk3-rs — Copyrights in the gtk-rs Project project are retained by their contributors.
- **gdkx11-sys** 0.18.2 — https://github.com/gtk-rs/gtk3-rs — Urheber laut Cargo.toml: The gtk-rs Project Developers
- **generic-array** 0.14.7 — https://github.com/fizyk20/generic-array.git — Copyright (c) 2015 Bartłomiej Kamiński
- **gio** 0.18.4 — https://github.com/gtk-rs/gtk-rs-core — Copyrights in the gtk-rs Project project are retained by their contributors.
- **gio-sys** 0.18.1 — https://github.com/gtk-rs/gtk-rs-core — Urheber laut Cargo.toml: The gtk-rs Project Developers
- **glib** 0.18.5 — https://github.com/gtk-rs/gtk-rs-core — Copyrights in the gtk-rs Project project are retained by their contributors.
- **glib-macros** 0.18.5 — https://github.com/gtk-rs/gtk-rs-core — Copyrights in the gtk-rs Project project are retained by their contributors.
- **glib-sys** 0.18.1 — https://github.com/gtk-rs/gtk-rs-core — Urheber laut Cargo.toml: The gtk-rs Project Developers
- **gobject-sys** 0.18.0 — https://github.com/gtk-rs/gtk-rs-core — Urheber laut Cargo.toml: The gtk-rs Project Developers
- **gtk** 0.18.2 — https://github.com/gtk-rs/gtk3-rs — Copyrights in the gtk-rs Project project are retained by their contributors.
- **gtk-sys** 0.18.2 — https://github.com/gtk-rs/gtk3-rs — Urheber laut Cargo.toml: The gtk-rs Project Developers
- **gtk3-macros** 0.18.2 — https://github.com/gtk-rs/gtk3-rs — Copyrights in the gtk-rs Project project are retained by their contributors.
- **http-body** 1.1.0 — https://github.com/hyperium/http-body — Copyright (c) 2019-2026 Sean McArthur & Hyper Contributors
- **http-body-util** 0.1.5 — https://github.com/hyperium/http-body — Copyright (c) 2019-2026 Sean McArthur & Hyper Contributors
- **hyper** 1.11.1 — https://github.com/hyperium/hyper — Copyright (c) 2014-2026 Sean McArthur
- **hyper-util** 0.1.20 — https://github.com/hyperium/hyper-util — Copyright (c) 2023-2025 Sean McArthur
- **ico** 0.5.0 — https://github.com/mdsteele/rust-ico — Copyright (c) 2018 Matthew D. Steele
- **infer** 0.19.0 — https://github.com/bojand/infer — Copyright (c) 2019 Bojan
- **is-docker** 0.2.0 — https://github.com/TheLarkInn/is-docker — Copyright (c) 2023 Sean Larkin
- **is-wsl** 0.4.0 — https://github.com/TheLarkInn/is-wsl — Copyright (c) 2023 Sean Larkin
- **javascriptcore-rs** 1.1.2 — https://github.com/tauri-apps/javascriptcore-rs — Copyright (c) 2013-2021, The Gtk-rs Project Developers.; Copyright (c) 2021, Tauri Programme within The Commons Conservancy.
- **javascriptcore-rs-sys** 1.1.1 — https://github.com/tauri-apps/javascriptcore-rs — Copyright (c) 2013-2017, The Gtk-rs Project Developers.
- **libredox** 0.1.23 — https://gitlab.redox-os.org/redox-os/libredox.git — Copyright (c) 2023 4lDO2
- **memoffset** 0.9.1 — https://github.com/Gilnaa/memoffset — Copyright (c) 2017 Gilad Naaman
- **mio** 1.2.3 — https://github.com/tokio-rs/mio — Copyright (c) 2014 Carl Lerche and other MIO contributors
- **new_debug_unreachable** 1.0.6 — https://github.com/mbrubeck/rust-debug-unreachable — Copyright (c) 2015 Jonathan Reem
- **objc2** 0.6.4 — https://github.com/madsmtm/objc2 — Urheber laut Cargo.toml: Mads Marquart
- **objc2-encode** 4.1.0 — https://github.com/madsmtm/objc2 — Urheber laut Cargo.toml: Mads Marquart
- **objc2-foundation** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-foundation
- **open** 5.4.3 — https://github.com/Byron/open-rs — Copyright © `2015` `Sebastian Thiel`
- **os_pipe** 1.2.3 — https://github.com/oconnor663/os_pipe.rs — Urheber laut Cargo.toml: Jack O'Connor
- **pango** 0.18.3 — https://github.com/gtk-rs/gtk-rs-core — Copyrights in the gtk-rs Project project are retained by their contributors.
- **pango-sys** 0.18.0 — https://github.com/gtk-rs/gtk-rs-core — Urheber laut Cargo.toml: The gtk-rs Project Developers
- **phf** 0.13.1 — https://github.com/rust-phf/rust-phf — Copyright (c) 2014-2022 Steven Fackler, Yuki Okushi
- **phf_codegen** 0.13.1 — https://github.com/rust-phf/rust-phf — Copyright (c) 2014-2022 Steven Fackler, Yuki Okushi
- **phf_generator** 0.13.1 — https://github.com/rust-phf/rust-phf — Copyright (c) 2014-2022 Steven Fackler, Yuki Okushi
- **phf_macros** 0.13.1 — https://github.com/rust-phf/rust-phf — Copyright (c) 2014-2022 Steven Fackler, Yuki Okushi
- **phf_shared** 0.13.1 — https://github.com/rust-phf/rust-phf — Copyright (c) 2014-2022 Steven Fackler, Yuki Okushi
- **plist** 1.10.0 — https://github.com/ebarnard/rust-plist/ — Copyright (c) 2015 Edward Barnard
- **precomputed-hash** 0.1.1 — https://github.com/emilio/precomputed-hash — Copyright (c) 2017 Emilio Cobos Álvarez
- **quick-xml** 0.41.0 — https://github.com/tafia/quick-xml — Copyright (c) 2016 Johann Tuffe
- **redox_syscall** 0.5.18 — https://gitlab.redox-os.org/redox-os/syscall — Copyright (c) 2017 Redox OS Developers
- **redox_users** 0.5.2 — https://gitlab.redox-os.org/redox-os/users — Copyright (c) 2017 Jose Narvaez
- **rfd** 0.16.0 — https://github.com/PolyMeilex/rfd — Copyright (c) 2022 Bartłomiej Maryńczak
- **schemars** 0.8.22, 0.9.0, 1.2.2 — https://github.com/GREsau/schemars — Copyright (c) 2019 Graham Esau
- **schemars_derive** 0.8.22 — https://github.com/GREsau/schemars — Copyright (c) 2019 Graham Esau
- **shared_child** 1.1.1 — https://github.com/oconnor663/shared_child.rs — Urheber laut Cargo.toml: jacko
- **sigchld** 0.2.5 — https://github.com/oconnor663/sigchld.rs — Urheber laut Cargo.toml: Jack O'Connor
- **simd-adler32** 0.3.10 — https://github.com/mcountryman/simd-adler32 — Copyright (c) [2021] [Marvin Countryman]
- **slab** 0.4.12 — https://github.com/tokio-rs/slab — Copyright (c) 2019 Carl Lerche
- **soup3** 0.5.0 — https://gitlab.gnome.org/World/Rust/soup3-rs — Copyright (c) 2013-2017, The Gtk-rs Project Developers.
- **soup3-sys** 0.5.0 — https://gitlab.gnome.org/World/Rust/soup3-rs — Copyright (c) 2013-2017, The Gtk-rs Project Developers.
- **strsim** 0.11.1 — https://github.com/rapidfuzz/strsim-rs — Copyright (c) 2015 Danny Guo; Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com>; Copyright (c) 2018 Akash Kurdekar
- **synstructure** 0.13.2 — https://github.com/mystor/synstructure — Copyright 2016 Nika Layzell
- **tauri-winres** 0.3.6 — https://github.com/tauri-apps/winres — Copyright (c) 2023 - Present Tauri Apps Contributors; Copyright (c) 2016 Max Resch
- **tokio** 1.53.1 — https://github.com/tokio-rs/tokio — Copyright (c) Tokio Contributors
- **tokio-util** 0.7.19 — https://github.com/tokio-rs/tokio — Copyright (c) Tokio Contributors
- **tower** 0.5.3 — https://github.com/tower-rs/tower — Copyright (c) 2019 Tower Contributors
- **tower-http** 0.6.11 — https://github.com/tower-rs/tower-http — Copyright (c) 2019-2021 Tower Contributors
- **tower-layer** 0.3.3 — https://github.com/tower-rs/tower — Copyright (c) 2019 Tower Contributors
- **tower-service** 0.3.3 — https://github.com/tower-rs/tower — Copyright (c) 2019 Tower Contributors
- **tracing** 0.1.44 — https://github.com/tokio-rs/tracing — Copyright (c) 2019 Tokio Contributors
- **tracing-attributes** 0.1.31 — https://github.com/tokio-rs/tracing — Copyright (c) 2019 Tokio Contributors
- **tracing-core** 0.1.36 — https://github.com/tokio-rs/tracing — Copyright (c) 2019 Tokio Contributors
- **try-lock** 0.2.5 — https://github.com/seanmonstar/try-lock — Copyright (c) 2018-2023 Sean McArthur; Copyright (c) 2016 Alex Crichton
- **uds_windows** 1.2.1 — https://github.com/haraldh/rust_uds_windows — Copyright (c) Microsoft Corporation. All rights reserved.
- **urlpattern** 0.3.0 — https://github.com/denoland/rust-urlpattern — Copyright (c) 2021 the Deno authors
- **version-compare** 0.2.1 — https://gitlab.com/timvisee/version-compare — Copyright (c) 2017 Tim Visée
- **vswhom** 0.1.0 — https://github.com/nabijaczleweli/vswhom.rs — Copyright (c) 2019 nabijaczleweli
- **vswhom-sys** 0.1.3 — https://github.com/nabijaczleweli/vswhom-sys.rs — Copyright (c) 2019 nabijaczleweli
- **want** 0.3.1 — https://github.com/seanmonstar/want — Copyright (c) 2018-2019 Sean McArthur
- **webkit2gtk** 2.0.2 — https://github.com/tauri-apps/webkit2gtk-rs — Copyright (c) 2016 Boucher, Antoni <bouanto@zoho.com>; Copyright (c) 2017-2021, The Gtk-rs Project Developers.; Copyright (c) 2021, Tauri Programme within The Commons Conservancy
- **webkit2gtk-sys** 2.0.2 — https://github.com/tauri-apps/webkit2gtk-rs — Copyright (c) 2016 Boucher, Antoni <bouanto@zoho.com>
- **webview2-com** 0.38.2 — https://github.com/wravery/webview2-rs — die Autoren von webview2-com
- **webview2-com-macros** 0.8.1 — https://github.com/wravery/webview2-rs — die Autoren von webview2-com-macros
- **webview2-com-sys** 0.38.2 — https://github.com/wravery/webview2-rs — die Autoren von webview2-com-sys
- **winnow** 0.5.40, 0.7.15, 1.0.4 — https://github.com/winnow-rs/winnow — die Autoren von winnow
- **winreg** 0.55.0 — https://github.com/gentoo90/winreg-rs — Copyright (c) 2015 Igor Shaula
- **x11** 2.21.0 — https://github.com/AltF02/x11-rs.git — Urheber laut Cargo.toml: daggerbot, Erle Pereira, AltF02
- **x11-dl** 2.21.0 — https://github.com/AltF02/x11-rs.git — Urheber laut Cargo.toml: daggerbot, Erle Pereira, AltF02
- **zbus** 5.19.0 — https://github.com/z-galaxy/zbus/ — Copyright (c) 2024 Zeeshan Ali Khan & zbus contributors
- **zbus_macros** 5.19.0 — https://github.com/z-galaxy/zbus/ — Copyright (c) 2024 Zeeshan Ali Khan & zbus contributors
- **zbus_names** 4.3.4 — https://github.com/z-galaxy/zbus/ — Copyright (c) 2024 Zeeshan Ali Khan & zbus contributors
- **zcheapstr** 1.1.0 — https://github.com/z-galaxy/zcheapstr/ — Copyright (c) 2026 Zeeshan Ali Khan & zcheapstr contributors
- **zmij** 1.0.23 — https://github.com/dtolnay/zmij — Urheber laut Cargo.toml: David Tolnay
- **zvariant** 5.15.0 — https://github.com/z-galaxy/zbus/ — Copyright (c) 2024 Zeeshan Ali Khan & zbus contributors
- **zvariant_derive** 5.15.0 — https://github.com/z-galaxy/zbus/ — Copyright (c) 2024 Zeeshan Ali Khan & zbus contributors
- **zvariant_utils** 4.2.0 — https://github.com/z-galaxy/zbus/ — Urheber laut Cargo.toml: Zeeshan Ali Khan, turbocooler

### MIT OR Apache-2.0 OR Zlib  (21 Crates)

Dreifach lizenziert, alle drei permissiv – wir nutzen die Crates unter MIT.

- **bytemuck** 1.25.2 — https://github.com/Lokathor/bytemuck — Copyright (c) 2019 Daniel "Lokathor" Gee.
- **dispatch2** 0.3.1 — https://github.com/madsmtm/objc2 — Urheber laut Cargo.toml: Mads Marquart, Mary
- **miniz_oxide** 0.8.9, 0.9.1 — https://github.com/Frommi/miniz_oxide/tree/master/miniz_oxide — Copyright 2013-2014 RAD Game Tools and Valve Software; Copyright 2010-2014 Rich Geldreich and Tenacious Software LLC; Copyright (c) 2017 Frommi; Copyright (c) 2017-2024 oyvindln; Copyright (c) 2020 Frommi
- **objc2-app-kit** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-app-kit
- **objc2-cloud-kit** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-cloud-kit
- **objc2-core-data** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-core-data
- **objc2-core-foundation** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-core-foundation
- **objc2-core-graphics** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-core-graphics
- **objc2-core-image** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-core-image
- **objc2-core-location** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-core-location
- **objc2-core-text** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-core-text
- **objc2-exception-helper** 0.1.1 — https://github.com/madsmtm/objc2 — Urheber laut Cargo.toml: Mads Marquart
- **objc2-io-surface** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-io-surface
- **objc2-quartz-core** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-quartz-core
- **objc2-ui-kit** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-ui-kit
- **objc2-user-notifications** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-user-notifications
- **objc2-web-kit** 0.3.2 — https://github.com/madsmtm/objc2 — die Autoren von objc2-web-kit
- **raw-window-handle** 0.6.2 — https://github.com/rust-windowing/raw-window-handle — Copyright (c) 2019 Osspial; Copyright (c) 2020 Osspial
- **tinyvec** 1.12.0 — https://github.com/Lokathor/tinyvec — Copyright (c) 2019 Daniel "Lokathor" Gee.
- **tinyvec_macros** 0.1.1 — https://github.com/Soveu/tinyvec_macros — Copyright 2020 Tomasz "Soveu" Marx; Copyright (c) 2020 Soveu; (C) 2020 Tomasz "Soveu" Marx

### Unicode-3.0  (18 Crates)

Lizenz der Unicode-Daten (ICU4X-Crates), permissiv wie MIT. Bedingung: Copyright-Hinweis und Lizenztext bleiben erhalten (siehe Anhang). Löst die frühere Unicode-DFS-2016 ab, inhaltlich gleich.

- **icu_collections** 2.3.0 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **icu_locale_core** 2.3.0 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **icu_normalizer** 2.3.0 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **icu_normalizer_data** 2.3.0 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **icu_properties** 2.3.0 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **icu_properties_data** 2.3.0 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **icu_provider** 2.3.1 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **litemap** 0.8.3 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **potential_utf** 0.1.6 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **tinystr** 0.8.4 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **writeable** 0.6.4 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **yoke** 0.8.3 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **yoke-derive** 0.8.2 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **zerofrom** 0.1.8 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **zerofrom-derive** 0.1.7 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **zerotrie** 0.2.5 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **zerovec** 0.11.8 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.
- **zerovec-derive** 0.11.6 — https://github.com/unicode-org/icu4x — COPYRIGHT AND PERMISSION NOTICE; Copyright © 2020-2024 Unicode, Inc.

### MIT OR Unlicense  (11 Crates)

Doppellizenziert (MIT oder gemeinfrei per Unlicense) – wir nutzen die Crates unter MIT.

- **aho-corasick** 1.1.5 — https://github.com/BurntSushi/aho-corasick — Copyright (c) 2015 Andrew Gallant
- **byteorder** 1.5.0 — https://github.com/BurntSushi/byteorder — Copyright (c) 2015 Andrew Gallant
- **jiff** 0.2.35 — https://github.com/BurntSushi/jiff — Copyright (c) 2015 Andrew Gallant
- **jiff-core** 0.1.0 — https://github.com/BurntSushi/jiff — Copyright (c) 2015 Andrew Gallant
- **jiff-static** 0.2.35 — https://github.com/BurntSushi/jiff — Copyright (c) 2015 Andrew Gallant
- **jiff-tzdb** 0.1.8 — https://github.com/BurntSushi/jiff — Copyright (c) 2015 Andrew Gallant
- **jiff-tzdb-platform** 0.1.3 — https://github.com/BurntSushi/jiff — Copyright (c) 2015 Andrew Gallant
- **memchr** 2.8.3 — https://github.com/BurntSushi/memchr — Copyright (c) 2015 Andrew Gallant
- **same-file** 1.0.6 — https://github.com/BurntSushi/same-file — Copyright (c) 2017 Andrew Gallant
- **walkdir** 2.5.0 — https://github.com/BurntSushi/walkdir — Copyright (c) 2015 Andrew Gallant
- **winapi-util** 0.1.11 — https://github.com/BurntSushi/winapi-util — Copyright (c) 2017 Andrew Gallant

### BSD-3-Clause  (5 Crates)

Permissiv wie MIT, zusätzlich ein Verbot, den Namen der Urheber ohne Erlaubnis zu Werbezwecken zu nutzen. Bei Weitergabe als Binärdatei gehören Copyright-Hinweis und Lizenztext in die Begleitunterlagen (siehe Anhang).

- **alloc-no-stdlib** 2.0.4 — https://github.com/dropbox/rust-alloc-no-stdlib — Copyright (c) 2016 Dropbox, Inc.
- **alloc-stdlib** 0.2.4 — https://github.com/dropbox/rust-alloc-no-stdlib — Urheber laut Cargo.toml: Daniel Reiter Horn
- **curve25519-dalek** 4.1.3 — https://github.com/dalek-cryptography/curve25519-dalek/tree/main/curve25519-dalek — Copyright (c) 2016-2021 isis agora lovecruft. All rights reserved.; Copyright (c) 2016-2021 Henry de Valence. All rights reserved.; Copyright (c) 2012 The Go Authors. All rights reserved.
- **ed25519-dalek** 2.2.0 — https://github.com/dalek-cryptography/curve25519-dalek/tree/main/ed25519-dalek — Copyright (c) 2017-2019 isis agora lovecruft. All rights reserved.
- **subtle** 2.6.1 — https://github.com/dalek-cryptography/subtle — Copyright (c) 2016-2017 Isis Agora Lovecruft, Henry de Valence. All rights reserved.; Copyright (c) 2016-2024 Isis Agora Lovecruft. All rights reserved.

### MIT OR Apache-2.0 OR Apache-2.0 WITH LLVM-exception  (5 Crates)

Dreifach lizenziert (Bytecode Alliance/rustix) – wir nutzen die Crates unter MIT.

- **linux-raw-sys** 0.12.1 — https://github.com/sunfishcode/linux-raw-sys — Copyrights in the `linux-raw-sys` project are retained by their contributors.
- **rustix** 1.1.4 — https://github.com/bytecodealliance/rustix — Copyrights in the `rustix` project are retained by their contributors.
- **wasi** 0.11.1+wasi-snapshot-preview1 — https://github.com/bytecodealliance/wasi — Urheber laut Cargo.toml: The Cranelift Project Developers
- **wasip2** 1.0.4+wasi-0.2.12 — https://github.com/bytecodealliance/wasi-rs — die Autoren von wasip2
- **wit-bindgen** 0.57.1 — https://github.com/bytecodealliance/wit-bindgen — Urheber laut Cargo.toml: Alex Crichton

### MPL-2.0  (5 Crates)

Schwaches Copyleft auf Dateiebene wie bei web-ifc: Nur wer die Dateien dieser Crates selbst ändert, muss die Änderungen offenlegen. el.easy.CAD nutzt sie unverändert (CSS-Selektoren aus dem Servo-Projekt über Tauris HTML-Verarbeitung, `option-ext` über `dirs`). Bei Weitergabe als Binärdatei verlangt MPL-2.0 Abschnitt 3.2 nur den Hinweis, wo der Quellcode zu bekommen ist – das sind die unten verlinkten, unveränderten Quellen auf crates.io bzw. im Repository.

- **cssparser** 0.36.0 — https://github.com/servo/rust-cssparser — Urheber laut Cargo.toml: Simon Sapin
- **cssparser-macros** 0.6.1 — https://github.com/servo/rust-cssparser — Urheber laut Cargo.toml: Simon Sapin
- **dtoa-short** 0.3.5 — https://github.com/upsuper/dtoa-short — Urheber laut Cargo.toml: Xidorn Quan
- **option-ext** 0.2.0 — https://github.com/soc/option-ext.git — Urheber laut Cargo.toml: Simon Ochsenreither
- **selectors** 0.36.1 — https://github.com/servo/stylo — Urheber laut Cargo.toml: The Servo Project Developers

### Apache-2.0  (2 Crates)

Erlaubt kommerzielle Nutzung, Modifikation und Weitergabe; verlangt Lizenztext, Erhalt von Copyright-/Änderungshinweisen und die Weitergabe einer NOTICE-Datei, falls das Crate eine hat (keines dieser Crates hat eine). Gewährt zusätzlich eine Patentlizenz.

- **sync_wrapper** 1.0.2 — https://github.com/Actyx/sync_wrapper — Urheber laut Cargo.toml: Actyx AG
- **tao** 0.35.3 — https://github.com/tauri-apps/tao — Urheber laut Cargo.toml: Tauri Programme within The Commons Conservancy, The winit contributors

### MIT OR Apache-2.0 OR BSD-3-Clause  (2 Crates)

Dreifach lizenziert, alle drei permissiv – wir nutzen die Crates unter MIT.

- **num_enum** 0.7.6 — https://github.com/illicitonion/num_enum — Copyright (c) 2018, Daniel Wagner-Hall
- **num_enum_derive** 0.7.6 — https://github.com/illicitonion/num_enum — Copyright (c) 2018, Daniel Wagner-Hall

### MIT OR Apache-2.0 OR LGPL-2.1-or-later  (2 Crates)

Dreifach lizenziert (UEFI-Bindungen, nur für UEFI-Ziele übersetzt) – **wir wählen ausdrücklich MIT**, damit keine LGPL-Pflichten entstehen.

- **r-efi** 5.3.0, 6.0.0 — https://github.com/r-efi/r-efi — die Autoren von r-efi

### Zlib  (2 Crates)

Permissiv, ohne Copyleft. Verlangt nur, dass der Ursprung nicht falsch dargestellt und der Hinweis in Quelltextweitergaben erhalten bleibt.

- **foldhash** 0.2.0 — https://github.com/orlp/foldhash — Copyright (c) 2024 Orson Peters
- **zlib-rs** 0.6.7 — https://github.com/trifectatechfoundation/zlib-rs — (C) 2024 Trifecta Tech Foundation

### (Apache-2.0 OR MIT) AND BSD-3-Clause  (1 Crate)

Code unter Apache-2.0 oder MIT (wir nutzen MIT), eingebettete Daten aus dem WHATWG-Standard unter BSD-3-Clause.

- **encoding_rs** 0.8.35 — https://github.com/hsivonen/encoding_rs — Copyright Mozilla Foundation; Copyright © WHATWG (Apple, Google, Mozilla, Microsoft).

### (MIT OR Apache-2.0) AND Unicode-3.0  (1 Crate)

Code unter MIT oder Apache-2.0 (wir nutzen MIT), die eingebetteten Unicode-Tabellen unter Unicode-3.0.

- **unicode-ident** 1.0.24 — https://github.com/dtolnay/unicode-ident — COPYRIGHT AND PERMISSION NOTICE; Copyright © 1991-2023 Unicode, Inc.

### Apache-2.0 AND MIT  (1 Crate)

Teile unter Apache-2.0, Teile unter MIT – beide gelten, beide permissiv.

- **dpi** 0.1.2 — https://github.com/rust-windowing/winit — Copyright (c) 2018 Jorge Aparicio; copyright:; Copyright © 2005-2020 Rich Felker, et al.; Copyright © 1993,2004 Sun Microsystems or; Copyright © 2003-2011 David Schultz or; Copyright © 2003-2009 Steven G. Kargl or; Copyright © 2003-2009 Bruce D. Evans or; Copyright © 2008 Stephen L. Moshier or; Copyright © 2017-2018 Arm Limited

### Apache-2.0 OR BSL-1.0  (1 Crate)

Doppellizenziert – wir nutzen das Crate unter der Boost Software License, die bei Weitergabe als Binärdatei keinen Hinweis verlangt.

- **ryu** 1.0.23 — https://github.com/dtolnay/ryu — Urheber laut Cargo.toml: David Tolnay

### Apache-2.0 OR CC0-1.0 OR MIT-0  (1 Crate)

Dreifach lizenziert – wir nutzen das Crate unter MIT-0 (MIT ohne Pflicht zur Namensnennung).

- **dunce** 1.0.5 — https://gitlab.com/kornelski/dunce — Urheber laut Cargo.toml: Kornel

### Apache-2.0 WITH LLVM-exception  (1 Crate)

Apache-2.0 mit der LLVM-Ausnahme, die die Hinweispflicht für mitkompilierten Code lockert. Kein Copyleft.

- **target-lexicon** 0.12.16 — https://github.com/bytecodealliance/target-lexicon — Urheber laut Cargo.toml: Dan Gohman

### BSD-3-Clause AND MIT  (1 Crate)

Teile unter BSD-3-Clause, Teile unter MIT – beide gelten, beide permissiv.

- **brotli** 8.0.4 — https://github.com/dropbox/rust-brotli — Copyright (c) 2016 Dropbox, Inc.; Copyright (c) 2009, 2010, 2013-2016 by the Brotli Authors.

### ISC  (1 Crate)

Funktional gleichwertig zu MIT, ohne Copyleft-Pflichten.

- **libloading** 0.7.4 — https://github.com/nagisa/rust_libloading/ — Copyright © 2015, Simonas Kazlauskas

### MIT OR Apache-2.0 OR 0BSD  (1 Crate)

Dreifach lizenziert, alle drei permissiv – wir nutzen das Crate unter MIT.

- **adler2** 2.0.1 — https://github.com/oyvindln/adler2 — Copyright (C) Jonas Schievink <jonasschievink@gmail.com>

### MIT OR Apache-2.0 OR BSD-1-Clause  (1 Crate)

Dreifach lizenziert, alle drei permissiv – wir nutzen das Crate unter MIT.

- **fiat-crypto** 0.2.9 — https://github.com/mit-plv/fiat-crypto — Copyright 2015-2020 the fiat-crypto authors (see the AUTHORS file); Copyright (c) 2015-2020 the fiat-crypto authors (see the AUTHORS file); Copyright (c) 2015-2020 the fiat-crypto authors (see the AUTHORS file).

### MIT OR BSD-3-Clause  (1 Crate)

Doppellizenziert, beide permissiv – wir nutzen das Crate unter MIT.

- **brotli-decompressor** 5.0.3 — https://github.com/dropbox/rust-brotli-decompressor — Copyright (c) 2016 Dropbox, Inc.
<!-- drittlizenzen-erzeugen:laufzeit-und-crates:ende -->

---

## Besonderheiten / Anmerkungen

- **jszip** (transitiv über ExcelJS) ist doppelt lizenziert (MIT oder GPL-3.0-or-later). Wir nutzen es unter MIT – dafür ist keine weitere Handlung nötig, es sollte aber nicht behauptet werden, das Produkt stünde unter GPL.
- Entwicklungswerkzeuge (TypeScript, Vite, ESLint, Prettier, Vitest, Playwright, javascript-obfuscator u. a.) sind bewusst **nicht** in dieser Liste, da sie nur beim Bauen verwendet werden und nicht Teil der ausgelieferten Anwendung sind. Dasselbe gilt für die Rust-Werkzeugkette (rustc, cargo) und die Tauri-CLI; die Rust-Standardbibliothek, die rustc einkompiliert, steht unter MIT OR Apache-2.0 wie die meisten Crates.
- **Rust-Crates (2026-10-25 geprüft):** Kein Crate steht allein unter GPL/LGPL/AGPL. `r-efi` bietet LGPL-2.1-or-later nur als eine von drei Optionen an – wir wählen MIT. Die MPL-2.0-Crates (`cssparser`, `cssparser-macros`, `dtoa-short`, `selectors`, `option-ext`) werden unverändert aus crates.io übersetzt; es gilt dieselbe Einordnung wie bei web-ifc (nur Lizenzhinweis und Quellverweis). Unicode-3.0 (ICU4X-Daten), BSD-3-Clause, Zlib, ISC, BSL-1.0 und die LLVM-Ausnahme sind permissiv. Kein Crate bringt eine NOTICE-Datei mit. OpenSSL steckt in keinem Crate (`Cargo.lock` enthält weder `openssl` noch `native-tls`), wohl aber in Node.js (Apache-2.0, siehe Node-Lizenz im Anhang).
- **Node.js (2026-10-25 geprüft):** Die `LICENSE`-Datei nennt GPL-Texte nur für Autoconf-Hilfsdateien von ICU, die ausdrücklich unter der Autoconf-Ausnahme stehen und nicht in der Binärdatei landen. Alle einkompilierten Bibliotheken sind permissiv.

## Lizenz-Compliance

Wenn Sie el.easy.CAD kommerziell weitergeben oder einsetzen:

- Bewahren Sie diese Datei auf.
- Geben Sie die Copyright-Notizen der Abhängigkeiten mit an (z. B. über den Lizenzen-Dialog der Anwendung).
- Informieren Sie Nutzer über die Abhängigkeiten.

---

<!-- drittlizenzen-erzeugen:lizenztexte:anfang -->
## Anhang: Lizenztexte

Volltexte der Lizenzen, unter denen wir die Rust-Crates nutzen (aus der SPDX-Lizenzliste v3.29.0), gefolgt von der `LICENSE`-Datei von Node.js v24.20.0. Bei MIT, BSD und ISC gehört zum Text der jeweilige Copyright-Vermerk – er steht beim Crate in der Liste oben.

### Apache-2.0

~~~~text
Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

"License" shall mean the terms and conditions for use, reproduction, and distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity authorized by the copyright owner that is granting the License.

"Legal Entity" shall mean the union of the acting entity and all other entities that control, are controlled by, or are under common control with that entity. For the purposes of this definition, "control" means (i) the power, direct or indirect, to cause the direction or management of such entity, whether by contract or otherwise, or (ii) ownership of fifty percent (50%) or more of the outstanding shares, or (iii) beneficial ownership of such entity.

"You" (or "Your") shall mean an individual or Legal Entity exercising permissions granted by this License.

"Source" form shall mean the preferred form for making modifications, including but not limited to software source code, documentation source, and configuration files.

"Object" form shall mean any form resulting from mechanical transformation or translation of a Source form, including but not limited to compiled object code, generated documentation, and conversions to other media types.

"Work" shall mean the work of authorship, whether in Source or Object form, made available under the License, as indicated by a copyright notice that is included in or attached to the work (an example is provided in the Appendix below).

"Derivative Works" shall mean any work, whether in Source or Object form, that is based on (or derived from) the Work and for which the editorial revisions, annotations, elaborations, or other modifications represent, as a whole, an original work of authorship. For the purposes of this License, Derivative Works shall not include works that remain separable from, or merely link (or bind by name) to the interfaces of, the Work and Derivative Works thereof.

"Contribution" shall mean any work of authorship, including the original version of the Work and any modifications or additions to that Work or Derivative Works thereof, that is intentionally submitted to Licensor for inclusion in the Work by the copyright owner or by an individual or Legal Entity authorized to submit on behalf of the copyright owner. For the purposes of this definition, "submitted" means any form of electronic, verbal, or written communication sent to the Licensor or its representatives, including but not limited to communication on electronic mailing lists, source code control systems, and issue tracking systems that are managed by, or on behalf of, the Licensor for the purpose of discussing and improving the Work, but excluding communication that is conspicuously marked or otherwise designated in writing by the copyright owner as "Not a Contribution."

"Contributor" shall mean Licensor and any individual or Legal Entity on behalf of whom a Contribution has been received by Licensor and subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare Derivative Works of, publicly display, publicly perform, sublicense, and distribute the Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable (except as stated in this section) patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer the Work, where such license applies only to those patent claims licensable by such Contributor that are necessarily infringed by their Contribution(s) alone or by combination of their Contribution(s) with the Work to which such Contribution(s) was submitted. If You institute patent litigation against any entity (including a cross-claim or counterclaim in a lawsuit) alleging that the Work or a Contribution incorporated within the Work constitutes direct or contributory patent infringement, then any patent licenses granted to You under this License for that Work shall terminate as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the Work or Derivative Works thereof in any medium, with or without modifications, and in Source or Object form, provided that You meet the following conditions:

     (a) You must give any other recipients of the Work or Derivative Works a copy of this License; and

     (b) You must cause any modified files to carry prominent notices stating that You changed the files; and

     (c) You must retain, in the Source form of any Derivative Works that You distribute, all copyright, patent, trademark, and attribution notices from the Source form of the Work, excluding those notices that do not pertain to any part of the Derivative Works; and

     (d) If the Work includes a "NOTICE" text file as part of its distribution, then any Derivative Works that You distribute must include a readable copy of the attribution notices contained within such NOTICE file, excluding those notices that do not pertain to any part of the Derivative Works, in at least one of the following places: within a NOTICE text file distributed as part of the Derivative Works; within the Source form or documentation, if provided along with the Derivative Works; or, within a display generated by the Derivative Works, if and wherever such third-party notices normally appear. The contents of the NOTICE file are for informational purposes only and do not modify the License. You may add Your own attribution notices within Derivative Works that You distribute, alongside or as an addendum to the NOTICE text from the Work, provided that such additional attribution notices cannot be construed as modifying the License.

     You may add Your own copyright statement to Your modifications and may provide additional or different license terms and conditions for use, reproduction, or distribution of Your modifications, or for any such Derivative Works as a whole, provided Your use, reproduction, and distribution of the Work otherwise complies with the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise, any Contribution intentionally submitted for inclusion in the Work by You to the Licensor shall be under the terms and conditions of this License, without any additional terms or conditions. Notwithstanding the above, nothing herein shall supersede or modify the terms of any separate license agreement you may have executed with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade names, trademarks, service marks, or product names of the Licensor, except as required for reasonable and customary use in describing the origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or agreed to in writing, Licensor provides the Work (and each Contributor provides its Contributions) on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied, including, without limitation, any warranties or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A PARTICULAR PURPOSE. You are solely responsible for determining the appropriateness of using or redistributing the Work and assume any risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory, whether in tort (including negligence), contract, or otherwise, unless required by applicable law (such as deliberate and grossly negligent acts) or agreed to in writing, shall any Contributor be liable to You for damages, including any direct, indirect, special, incidental, or consequential damages of any character arising as a result of this License or out of the use or inability to use the Work (including but not limited to damages for loss of goodwill, work stoppage, computer failure or malfunction, or any and all other commercial damages or losses), even if such Contributor has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing the Work or Derivative Works thereof, You may choose to offer, and charge a fee for, acceptance of support, warranty, indemnity, or other liability obligations and/or rights consistent with this License. However, in accepting such obligations, You may act only on Your own behalf and on Your sole responsibility, not on behalf of any other Contributor, and only if You agree to indemnify, defend, and hold each Contributor harmless for any liability incurred by, or claims asserted against, such Contributor by reason of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work.

To apply the Apache License to your work, attach the following boilerplate notice, with the fields enclosed by brackets "[]" replaced with your own identifying information. (Don't include the brackets!)  The text should be enclosed in the appropriate comment syntax for the file format. We also recommend that a file or class name and description of purpose be included on the same "printed page" as the copyright notice for easier identification within third-party archives.

Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
~~~~

### BSD-3-Clause

~~~~text
Copyright (c) <year> <owner>. 

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
~~~~

### BSL-1.0

~~~~text
Boost Software License - Version 1.0 - August 17th, 2003

Permission is hereby granted, free of charge, to any person or organization obtaining a copy of the software and accompanying documentation covered by this license (the "Software") to use, reproduce, display, distribute, execute, and transmit the Software, and to prepare derivative works of the Software, and to permit third-parties to whom the Software is furnished to do so, all subject to the following:

The copyright notices in the Software and this entire statement, including the above license grant, this restriction and the following disclaimer, must be included in all copies of the Software, in whole or in part, and all derivative works of the Software, unless such copies or derivative works are solely in the form of machine-executable object code generated by a source language processor.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE COPYRIGHT HOLDERS OR ANYONE DISTRIBUTING THE SOFTWARE BE LIABLE FOR ANY DAMAGES OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
~~~~

### ISC

~~~~text
ISC License

Copyright <year> <owner> 

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
~~~~

### LLVM-exception

~~~~text
---- LLVM Exceptions to the Apache 2.0 License ----

   As an exception, if, as a result of your compiling your source code, portions
   of this Software are embedded into an Object form of such source code, you
   may redistribute such embedded portions in such Object form without complying
   with the conditions of Sections 4(a), 4(b) and 4(d) of the License.

   In addition, if you combine or link compiled forms of this Software with
   software that is licensed under the GPLv2 ("Combined Software") and if a
   court of competent jurisdiction determines that the patent provision (Section
   3), the indemnity provision (Section 9) or other Section of the License
   conflicts with the conditions of the GPLv2, you may retroactively and
   prospectively choose to deem waived or otherwise exclude such Section(s) of
   the License, but only in their entirety and only with respect to the Combined
   Software.
~~~~

### MIT

~~~~text
MIT License

Copyright (c) <year> <copyright holders>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
USE OR OTHER DEALINGS IN THE SOFTWARE.
~~~~

### MIT-0

~~~~text
MIT No Attribution

Copyright <YEAR> <COPYRIGHT HOLDER>

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
~~~~

### MPL-2.0

~~~~text
Mozilla Public License Version 2.0
==================================

1. Definitions
--------------

1.1. "Contributor"
    means each individual or legal entity that creates, contributes to
    the creation of, or owns Covered Software.

1.2. "Contributor Version"
    means the combination of the Contributions of others (if any) used
    by a Contributor and that particular Contributor's Contribution.

1.3. "Contribution"
    means Covered Software of a particular Contributor.

1.4. "Covered Software"
    means Source Code Form to which the initial Contributor has attached
    the notice in Exhibit A, the Executable Form of such Source Code
    Form, and Modifications of such Source Code Form, in each case
    including portions thereof.

1.5. "Incompatible With Secondary Licenses"
    means

    (a) that the initial Contributor has attached the notice described
        in Exhibit B to the Covered Software; or

    (b) that the Covered Software was made available under the terms of
        version 1.1 or earlier of the License, but not also under the
        terms of a Secondary License.

1.6. "Executable Form"
    means any form of the work other than Source Code Form.

1.7. "Larger Work"
    means a work that combines Covered Software with other material, in 
    a separate file or files, that is not Covered Software.

1.8. "License"
    means this document.

1.9. "Licensable"
    means having the right to grant, to the maximum extent possible,
    whether at the time of the initial grant or subsequently, any and
    all of the rights conveyed by this License.

1.10. "Modifications"
    means any of the following:

    (a) any file in Source Code Form that results from an addition to,
        deletion from, or modification of the contents of Covered
        Software; or

    (b) any new file in Source Code Form that contains any Covered
        Software.

1.11. "Patent Claims" of a Contributor
    means any patent claim(s), including without limitation, method,
    process, and apparatus claims, in any patent Licensable by such
    Contributor that would be infringed, but for the grant of the
    License, by the making, using, selling, offering for sale, having
    made, import, or transfer of either its Contributions or its
    Contributor Version.

1.12. "Secondary License"
    means either the GNU General Public License, Version 2.0, the GNU
    Lesser General Public License, Version 2.1, the GNU Affero General
    Public License, Version 3.0, or any later versions of those
    licenses.

1.13. "Source Code Form"
    means the form of the work preferred for making modifications.

1.14. "You" (or "Your")
    means an individual or a legal entity exercising rights under this
    License. For legal entities, "You" includes any entity that
    controls, is controlled by, or is under common control with You. For
    purposes of this definition, "control" means (a) the power, direct
    or indirect, to cause the direction or management of such entity,
    whether by contract or otherwise, or (b) ownership of more than
    fifty percent (50%) of the outstanding shares or beneficial
    ownership of such entity.

2. License Grants and Conditions
--------------------------------

2.1. Grants

Each Contributor hereby grants You a world-wide, royalty-free,
non-exclusive license:

(a) under intellectual property rights (other than patent or trademark)
    Licensable by such Contributor to use, reproduce, make available,
    modify, display, perform, distribute, and otherwise exploit its
    Contributions, either on an unmodified basis, with Modifications, or
    as part of a Larger Work; and

(b) under Patent Claims of such Contributor to make, use, sell, offer
    for sale, have made, import, and otherwise transfer either its
    Contributions or its Contributor Version.

2.2. Effective Date

The licenses granted in Section 2.1 with respect to any Contribution
become effective for each Contribution on the date the Contributor first
distributes such Contribution.

2.3. Limitations on Grant Scope

The licenses granted in this Section 2 are the only rights granted under
this License. No additional rights or licenses will be implied from the
distribution or licensing of Covered Software under this License.
Notwithstanding Section 2.1(b) above, no patent license is granted by a
Contributor:

(a) for any code that a Contributor has removed from Covered Software;
    or

(b) for infringements caused by: (i) Your and any other third party's
    modifications of Covered Software, or (ii) the combination of its
    Contributions with other software (except as part of its Contributor
    Version); or

(c) under Patent Claims infringed by Covered Software in the absence of
    its Contributions.

This License does not grant any rights in the trademarks, service marks,
or logos of any Contributor (except as may be necessary to comply with
the notice requirements in Section 3.4).

2.4. Subsequent Licenses

No Contributor makes additional grants as a result of Your choice to
distribute the Covered Software under a subsequent version of this
License (see Section 10.2) or under the terms of a Secondary License (if
permitted under the terms of Section 3.3).

2.5. Representation

Each Contributor represents that the Contributor believes its
Contributions are its original creation(s) or it has sufficient rights
to grant the rights to its Contributions conveyed by this License.

2.6. Fair Use

This License is not intended to limit any rights You have under
applicable copyright doctrines of fair use, fair dealing, or other
equivalents.

2.7. Conditions

Sections 3.1, 3.2, 3.3, and 3.4 are conditions of the licenses granted
in Section 2.1.

3. Responsibilities
-------------------

3.1. Distribution of Source Form

All distribution of Covered Software in Source Code Form, including any
Modifications that You create or to which You contribute, must be under
the terms of this License. You must inform recipients that the Source
Code Form of the Covered Software is governed by the terms of this
License, and how they can obtain a copy of this License. You may not
attempt to alter or restrict the recipients' rights in the Source Code
Form.

3.2. Distribution of Executable Form

If You distribute Covered Software in Executable Form then:

(a) such Covered Software must also be made available in Source Code
    Form, as described in Section 3.1, and You must inform recipients of
    the Executable Form how they can obtain a copy of such Source Code
    Form by reasonable means in a timely manner, at a charge no more
    than the cost of distribution to the recipient; and

(b) You may distribute such Executable Form under the terms of this
    License, or sublicense it under different terms, provided that the
    license for the Executable Form does not attempt to limit or alter
    the recipients' rights in the Source Code Form under this License.

3.3. Distribution of a Larger Work

You may create and distribute a Larger Work under terms of Your choice,
provided that You also comply with the requirements of this License for
the Covered Software. If the Larger Work is a combination of Covered
Software with a work governed by one or more Secondary Licenses, and the
Covered Software is not Incompatible With Secondary Licenses, this
License permits You to additionally distribute such Covered Software
under the terms of such Secondary License(s), so that the recipient of
the Larger Work may, at their option, further distribute the Covered
Software under the terms of either this License or such Secondary
License(s).

3.4. Notices

You may not remove or alter the substance of any license notices
(including copyright notices, patent notices, disclaimers of warranty,
or limitations of liability) contained within the Source Code Form of
the Covered Software, except that You may alter any license notices to
the extent required to remedy known factual inaccuracies.

3.5. Application of Additional Terms

You may choose to offer, and to charge a fee for, warranty, support,
indemnity or liability obligations to one or more recipients of Covered
Software. However, You may do so only on Your own behalf, and not on
behalf of any Contributor. You must make it absolutely clear that any
such warranty, support, indemnity, or liability obligation is offered by
You alone, and You hereby agree to indemnify every Contributor for any
liability incurred by such Contributor as a result of warranty, support,
indemnity or liability terms You offer. You may include additional
disclaimers of warranty and limitations of liability specific to any
jurisdiction.

4. Inability to Comply Due to Statute or Regulation
---------------------------------------------------

If it is impossible for You to comply with any of the terms of this
License with respect to some or all of the Covered Software due to
statute, judicial order, or regulation then You must: (a) comply with
the terms of this License to the maximum extent possible; and (b)
describe the limitations and the code they affect. Such description must
be placed in a text file included with all distributions of the Covered
Software under this License. Except to the extent prohibited by statute
or regulation, such description must be sufficiently detailed for a
recipient of ordinary skill to be able to understand it.

5. Termination
--------------

5.1. The rights granted under this License will terminate automatically
if You fail to comply with any of its terms. However, if You become
compliant, then the rights granted under this License from a particular
Contributor are reinstated (a) provisionally, unless and until such
Contributor explicitly and finally terminates Your grants, and (b) on an
ongoing basis, if such Contributor fails to notify You of the
non-compliance by some reasonable means prior to 60 days after You have
come back into compliance. Moreover, Your grants from a particular
Contributor are reinstated on an ongoing basis if such Contributor
notifies You of the non-compliance by some reasonable means, this is the
first time You have received notice of non-compliance with this License
from such Contributor, and You become compliant prior to 30 days after
Your receipt of the notice.

5.2. If You initiate litigation against any entity by asserting a patent
infringement claim (excluding declaratory judgment actions,
counter-claims, and cross-claims) alleging that a Contributor Version
directly or indirectly infringes any patent, then the rights granted to
You by any and all Contributors for the Covered Software under Section
2.1 of this License shall terminate.

5.3. In the event of termination under Sections 5.1 or 5.2 above, all
end user license agreements (excluding distributors and resellers) which
have been validly granted by You or Your distributors under this License
prior to termination shall survive termination.

************************************************************************
*                                                                      *
*  6. Disclaimer of Warranty                                           *
*  -------------------------                                           *
*                                                                      *
*  Covered Software is provided under this License on an "as is"       *
*  basis, without warranty of any kind, either expressed, implied, or  *
*  statutory, including, without limitation, warranties that the       *
*  Covered Software is free of defects, merchantable, fit for a        *
*  particular purpose or non-infringing. The entire risk as to the     *
*  quality and performance of the Covered Software is with You.        *
*  Should any Covered Software prove defective in any respect, You     *
*  (not any Contributor) assume the cost of any necessary servicing,   *
*  repair, or correction. This disclaimer of warranty constitutes an   *
*  essential part of this License. No use of any Covered Software is   *
*  authorized under this License except under this disclaimer.         *
*                                                                      *
************************************************************************

************************************************************************
*                                                                      *
*  7. Limitation of Liability                                          *
*  --------------------------                                          *
*                                                                      *
*  Under no circumstances and under no legal theory, whether tort      *
*  (including negligence), contract, or otherwise, shall any           *
*  Contributor, or anyone who distributes Covered Software as          *
*  permitted above, be liable to You for any direct, indirect,         *
*  special, incidental, or consequential damages of any character      *
*  including, without limitation, damages for lost profits, loss of    *
*  goodwill, work stoppage, computer failure or malfunction, or any    *
*  and all other commercial damages or losses, even if such party      *
*  shall have been informed of the possibility of such damages. This   *
*  limitation of liability shall not apply to liability for death or   *
*  personal injury resulting from such party's negligence to the       *
*  extent applicable law prohibits such limitation. Some               *
*  jurisdictions do not allow the exclusion or limitation of           *
*  incidental or consequential damages, so this exclusion and          *
*  limitation may not apply to You.                                    *
*                                                                      *
************************************************************************

8. Litigation
-------------

Any litigation relating to this License may be brought only in the
courts of a jurisdiction where the defendant maintains its principal
place of business and such litigation shall be governed by laws of that
jurisdiction, without reference to its conflict-of-law provisions.
Nothing in this Section shall prevent a party's ability to bring
cross-claims or counter-claims.

9. Miscellaneous
----------------

This License represents the complete agreement concerning the subject
matter hereof. If any provision of this License is held to be
unenforceable, such provision shall be reformed only to the extent
necessary to make it enforceable. Any law or regulation which provides
that the language of a contract shall be construed against the drafter
shall not be used to construe this License against a Contributor.

10. Versions of the License
---------------------------

10.1. New Versions

Mozilla Foundation is the license steward. Except as provided in Section
10.3, no one other than the license steward has the right to modify or
publish new versions of this License. Each version will be given a
distinguishing version number.

10.2. Effect of New Versions

You may distribute the Covered Software under the terms of the version
of the License under which You originally received the Covered Software,
or under the terms of any subsequent version published by the license
steward.

10.3. Modified Versions

If you create software not governed by this License, and you want to
create a new license for such software, you may create and use a
modified version of this License if you rename the license and remove
any references to the name of the license steward (except to note that
such modified license differs from this License).

10.4. Distributing Source Code Form that is Incompatible With Secondary
Licenses

If You choose to distribute Source Code Form that is Incompatible With
Secondary Licenses under the terms of this version of the License, the
notice described in Exhibit B of this License must be attached.

Exhibit A - Source Code Form License Notice
-------------------------------------------

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at https://mozilla.org/MPL/2.0/.

If it is not possible or desirable to put the notice in a particular
file, then You may include the notice in a location (such as a LICENSE
file in a relevant directory) where a recipient would be likely to look
for such a notice.

You may add additional accurate notices of copyright ownership.

Exhibit B - "Incompatible With Secondary Licenses" Notice
---------------------------------------------------------

  This Source Code Form is "Incompatible With Secondary Licenses", as
  defined by the Mozilla Public License, v. 2.0.
~~~~

### Unicode-3.0

~~~~text
UNICODE LICENSE V3

COPYRIGHT AND PERMISSION NOTICE

Copyright © 1991-2023 Unicode, Inc.

NOTICE TO USER: Carefully read the following legal agreement. BY
DOWNLOADING, INSTALLING, COPYING OR OTHERWISE USING DATA FILES, AND/OR
SOFTWARE, YOU UNEQUIVOCALLY ACCEPT, AND AGREE TO BE BOUND BY, ALL OF THE
TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU DO NOT AGREE, DO NOT
DOWNLOAD, INSTALL, COPY, DISTRIBUTE OR USE THE DATA FILES OR SOFTWARE.

Permission is hereby granted, free of charge, to any person obtaining a
copy of data files and any associated documentation (the "Data Files") or
software and any associated documentation (the "Software") to deal in the
Data Files or Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, and/or sell
copies of the Data Files or Software, and to permit persons to whom the
Data Files or Software are furnished to do so, provided that either (a)
this copyright and permission notice appear with all copies of the Data
Files or Software, or (b) this copyright and permission notice appear in
associated Documentation.

THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF
THIRD PARTY RIGHTS.

IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE
BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES,
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE DATA
FILES OR SOFTWARE.

Except as contained in this notice, the name of a copyright holder shall
not be used in advertising or otherwise to promote the sale, use or other
dealings in these Data Files or Software without prior written
authorization of the copyright holder.
~~~~

### Zlib

~~~~text
zlib License

This software is provided 'as-is', without any express or implied warranty.  In no event will the authors be held liable for any damages arising from the use of this software.

Permission is granted to anyone to use this software for any purpose, including commercial applications, and to alter it and redistribute it freely, subject to the following restrictions:

     1. The origin of this software must not be misrepresented; you must not claim that you wrote the original software. If you use this software in a product, an acknowledgment in the product documentation would be appreciated but is not required.

     2. Altered source versions must be plainly marked as such, and must not be misrepresented as being the original software.

     3. This notice may not be removed or altered from any source distribution.
~~~~

### Node.js v24.20.0 (LICENSE)

~~~~text
Node.js is licensed for use as follows:

"""
Copyright Node.js contributors. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
"""

This license applies to parts of Node.js originating from the
https://github.com/joyent/node repository:

"""
Copyright Joyent, Inc. and other Node contributors. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
"""

The Node.js license applies to all parts of Node.js that are not externally
maintained libraries.

The externally maintained libraries used by Node.js are:

- Acorn, located at deps/acorn, is licensed as follows:
  """
    MIT License

    Copyright (C) 2012-2022 by various contributors (see AUTHORS)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
  """

- c-ares, located at deps/cares, is licensed as follows:
  """
    MIT License

    Copyright (c) 1998 Massachusetts Institute of Technology
    Copyright (c) 2007 - 2023 Daniel Stenberg with many contributors, see AUTHORS
    file.

    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    the Software, and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:

    The above copyright notice and this permission notice (including the next
    paragraph) shall be included in all copies or substantial portions of the
    Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  """

- merve, located at deps/merve, is licensed as follows:
  """
    Copyright 2026 Yagiz Nizipli

    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    the Software, and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
    FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
    COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
    IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  """

- ittapi, located at deps/v8/third_party/ittapi, is licensed as follows:
  """
    Copyright (c) 2019 Intel Corporation. All rights reserved.

    Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

    1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  """

- amaro, located at deps/amaro, is licensed as follows:
  """
    MIT License

    Copyright (c) Marco Ippolito and Amaro contributors

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  """

- swc, located at deps/amaro/dist, is licensed as follows:
  """
                                  Apache License
                            Version 2.0, January 2004
                         http://www.apache.org/licenses/

    TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

    1. Definitions.

       "License" shall mean the terms and conditions for use, reproduction,
       and distribution as defined by Sections 1 through 9 of this document.

       "Licensor" shall mean the copyright owner or entity authorized by
       the copyright owner that is granting the License.

       "Legal Entity" shall mean the union of the acting entity and all
       other entities that control, are controlled by, or are under common
       control with that entity. For the purposes of this definition,
       "control" means (i) the power, direct or indirect, to cause the
       direction or management of such entity, whether by contract or
       otherwise, or (ii) ownership of fifty percent (50%) or more of the
       outstanding shares, or (iii) beneficial ownership of such entity.

       "You" (or "Your") shall mean an individual or Legal Entity
       exercising permissions granted by this License.

       "Source" form shall mean the preferred form for making modifications,
       including but not limited to software source code, documentation
       source, and configuration files.

       "Object" form shall mean any form resulting from mechanical
       transformation or translation of a Source form, including but
       not limited to compiled object code, generated documentation,
       and conversions to other media types.

       "Work" shall mean the work of authorship, whether in Source or
       Object form, made available under the License, as indicated by a
       copyright notice that is included in or attached to the work
       (an example is provided in the Appendix below).

       "Derivative Works" shall mean any work, whether in Source or Object
       form, that is based on (or derived from) the Work and for which the
       editorial revisions, annotations, elaborations, or other modifications
       represent, as a whole, an original work of authorship. For the purposes
       of this License, Derivative Works shall not include works that remain
       separable from, or merely link (or bind by name) to the interfaces of,
       the Work and Derivative Works thereof.

       "Contribution" shall mean any work of authorship, including
       the original version of the Work and any modifications or additions
       to that Work or Derivative Works thereof, that is intentionally
       submitted to Licensor for inclusion in the Work by the copyright owner
       or by an individual or Legal Entity authorized to submit on behalf of
       the copyright owner. For the purposes of this definition, "submitted"
       means any form of electronic, verbal, or written communication sent
       to the Licensor or its representatives, including but not limited to
       communication on electronic mailing lists, source code control systems,
       and issue tracking systems that are managed by, or on behalf of, the
       Licensor for the purpose of discussing and improving the Work, but
       excluding communication that is conspicuously marked or otherwise
       designated in writing by the copyright owner as "Not a Contribution."

       "Contributor" shall mean Licensor and any individual or Legal Entity
       on behalf of whom a Contribution has been received by Licensor and
       subsequently incorporated within the Work.

    2. Grant of Copyright License. Subject to the terms and conditions of
       this License, each Contributor hereby grants to You a perpetual,
       worldwide, non-exclusive, no-charge, royalty-free, irrevocable
       copyright license to reproduce, prepare Derivative Works of,
       publicly display, publicly perform, sublicense, and distribute the
       Work and such Derivative Works in Source or Object form.

    3. Grant of Patent License. Subject to the terms and conditions of
       this License, each Contributor hereby grants to You a perpetual,
       worldwide, non-exclusive, no-charge, royalty-free, irrevocable
       (except as stated in this section) patent license to make, have made,
       use, offer to sell, sell, import, and otherwise transfer the Work,
       where such license applies only to those patent claims licensable
       by such Contributor that are necessarily infringed by their
       Contribution(s) alone or by combination of their Contribution(s)
       with the Work to which such Contribution(s) was submitted. If You
       institute patent litigation against any entity (including a
       cross-claim or counterclaim in a lawsuit) alleging that the Work
       or a Contribution incorporated within the Work constitutes direct
       or contributory patent infringement, then any patent licenses
       granted to You under this License for that Work shall terminate
       as of the date such litigation is filed.

    4. Redistribution. You may reproduce and distribute copies of the
       Work or Derivative Works thereof in any medium, with or without
       modifications, and in Source or Object form, provided that You
       meet the following conditions:

       (a) You must give any other recipients of the Work or
           Derivative Works a copy of this License; and

       (b) You must cause any modified files to carry prominent notices
           stating that You changed the files; and

       (c) You must retain, in the Source form of any Derivative Works
           that You distribute, all copyright, patent, trademark, and
           attribution notices from the Source form of the Work,
           excluding those notices that do not pertain to any part of
           the Derivative Works; and

       (d) If the Work includes a "NOTICE" text file as part of its
           distribution, then any Derivative Works that You distribute must
           include a readable copy of the attribution notices contained
           within such NOTICE file, excluding those notices that do not
           pertain to any part of the Derivative Works, in at least one
           of the following places: within a NOTICE text file distributed
           as part of the Derivative Works; within the Source form or
           documentation, if provided along with the Derivative Works; or,
           within a display generated by the Derivative Works, if and
           wherever such third-party notices normally appear. The contents
           of the NOTICE file are for informational purposes only and
           do not modify the License. You may add Your own attribution
           notices within Derivative Works that You distribute, alongside
           or as an addendum to the NOTICE text from the Work, provided
           that such additional attribution notices cannot be construed
           as modifying the License.

       You may add Your own copyright statement to Your modifications and
       may provide additional or different license terms and conditions
       for use, reproduction, or distribution of Your modifications, or
       for any such Derivative Works as a whole, provided Your use,
       reproduction, and distribution of the Work otherwise complies with
       the conditions stated in this License.

    5. Submission of Contributions. Unless You explicitly state otherwise,
       any Contribution intentionally submitted for inclusion in the Work
       by You to the Licensor shall be under the terms and conditions of
       this License, without any additional terms or conditions.
       Notwithstanding the above, nothing herein shall supersede or modify
       the terms of any separate license agreement you may have executed
       with Licensor regarding such Contributions.

    6. Trademarks. This License does not grant permission to use the trade
       names, trademarks, service marks, or product names of the Licensor,
       except as required for reasonable and customary use in describing the
       origin of the Work and reproducing the content of the NOTICE file.

    7. Disclaimer of Warranty. Unless required by applicable law or
       agreed to in writing, Licensor provides the Work (and each
       Contributor provides its Contributions) on an "AS IS" BASIS,
       WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
       implied, including, without limitation, any warranties or conditions
       of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
       PARTICULAR PURPOSE. You are solely responsible for determining the
       appropriateness of using or redistributing the Work and assume any
       risks associated with Your exercise of permissions under this License.

    8. Limitation of Liability. In no event and under no legal theory,
       whether in tort (including negligence), contract, or otherwise,
       unless required by applicable law (such as deliberate and grossly
       negligent acts) or agreed to in writing, shall any Contributor be
       liable to You for damages, including any direct, indirect, special,
       incidental, or consequential damages of any character arising as a
       result of this License or out of the use or inability to use the
       Work (including but not limited to damages for loss of goodwill,
       work stoppage, computer failure or malfunction, or any and all
       other commercial damages or losses), even if such Contributor
       has been advised of the possibility of such damages.

    9. Accepting Warranty or Additional Liability. While redistributing
       the Work or Derivative Works thereof, You may choose to offer,
       and charge a fee for, acceptance of support, warranty, indemnity,
       or other liability obligations and/or rights consistent with this
       License. However, in accepting such obligations, You may act only
       on Your own behalf and on Your sole responsibility, not on behalf
       of any other Contributor, and only if You agree to indemnify,
       defend, and hold each Contributor harmless for any liability
       incurred by, or claims asserted against, such Contributor by reason
       of your accepting any such warranty or additional liability.

    END OF TERMS AND CONDITIONS

    APPENDIX: How to apply the Apache License to your work.

       To apply the Apache License to your work, attach the following
       boilerplate notice, with the fields enclosed by brackets "[]"
       replaced with your own identifying information. (Don't include
       the brackets!)  The text should be enclosed in the appropriate
       comment syntax for the file format. We also recommend that a
       file or class name and description of purpose be included on the
       same "printed page" as the copyright notice for easier
       identification within third-party archives.

    Copyright 2024 SWC contributors.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    	http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
  """

- ICU, located at deps/icu-small, is licensed as follows:
  """
    UNICODE LICENSE V3

    COPYRIGHT AND PERMISSION NOTICE

    Copyright © 2016-2025 Unicode, Inc.

    NOTICE TO USER: Carefully read the following legal agreement. BY
    DOWNLOADING, INSTALLING, COPYING OR OTHERWISE USING DATA FILES, AND/OR
    SOFTWARE, YOU UNEQUIVOCALLY ACCEPT, AND AGREE TO BE BOUND BY, ALL OF THE
    TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU DO NOT AGREE, DO NOT
    DOWNLOAD, INSTALL, COPY, DISTRIBUTE OR USE THE DATA FILES OR SOFTWARE.

    Permission is hereby granted, free of charge, to any person obtaining a
    copy of data files and any associated documentation (the "Data Files") or
    software and any associated documentation (the "Software") to deal in the
    Data Files or Software without restriction, including without limitation
    the rights to use, copy, modify, merge, publish, distribute, and/or sell
    copies of the Data Files or Software, and to permit persons to whom the
    Data Files or Software are furnished to do so, provided that either (a)
    this copyright and permission notice appear with all copies of the Data
    Files or Software, or (b) this copyright and permission notice appear in
    associated Documentation.

    THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
    KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF
    THIRD PARTY RIGHTS.

    IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE
    BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES,
    OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
    WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
    ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE DATA
    FILES OR SOFTWARE.

    Except as contained in this notice, the name of a copyright holder shall
    not be used in advertising or otherwise to promote the sale, use or other
    dealings in these Data Files or Software without prior written
    authorization of the copyright holder.

    SPDX-License-Identifier: Unicode-3.0

    ----------------------------------------------------------------------

    Third-Party Software Licenses

    This section contains third-party software notices and/or additional
    terms for licensed third-party software components included within ICU
    libraries.

    ----------------------------------------------------------------------

    ICU License - ICU 1.8.1 to ICU 57.1

    COPYRIGHT AND PERMISSION NOTICE

    Copyright (c) 1995-2016 International Business Machines Corporation and others
    All rights reserved.

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, and/or sell copies of the Software, and to permit persons
    to whom the Software is furnished to do so, provided that the above
    copyright notice(s) and this permission notice appear in all copies of
    the Software and that both the above copyright notice(s) and this
    permission notice appear in supporting documentation.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
    OF THIRD PARTY RIGHTS. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
    HOLDERS INCLUDED IN THIS NOTICE BE LIABLE FOR ANY CLAIM, OR ANY
    SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES, OR ANY DAMAGES WHATSOEVER
    RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF
    CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
    CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

    Except as contained in this notice, the name of a copyright holder
    shall not be used in advertising or otherwise to promote the sale, use
    or other dealings in this Software without prior written authorization
    of the copyright holder.

    All trademarks and registered trademarks mentioned herein are the
    property of their respective owners.

    ----------------------------------------------------------------------

    Chinese/Japanese Word Break Dictionary Data (cjdict.txt)

     #     The Google Chrome software developed by Google is licensed under
     # the BSD license. Other software included in this distribution is
     # provided under other licenses, as set forth below.
     #
     #  The BSD License
     #  http://opensource.org/licenses/bsd-license.php
     #  Copyright (C) 2006-2008, Google Inc.
     #
     #  All rights reserved.
     #
     #  Redistribution and use in source and binary forms, with or without
     # modification, are permitted provided that the following conditions are met:
     #
     #  Redistributions of source code must retain the above copyright notice,
     # this list of conditions and the following disclaimer.
     #  Redistributions in binary form must reproduce the above
     # copyright notice, this list of conditions and the following
     # disclaimer in the documentation and/or other materials provided with
     # the distribution.
     #  Neither the name of  Google Inc. nor the names of its
     # contributors may be used to endorse or promote products derived from
     # this software without specific prior written permission.
     #
     #
     #  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND
     # CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
     # INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
     # MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     # DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
     # LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
     # CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
     # SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
     # BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
     # LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
     # NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
     # SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     #
     #
     #  The word list in cjdict.txt are generated by combining three word lists
     # listed below with further processing for compound word breaking. The
     # frequency is generated with an iterative training against Google web
     # corpora.
     #
     #  * Libtabe (Chinese)
     #    - https://sourceforge.net/project/?group_id=1519
     #    - Its license terms and conditions are shown below.
     #
     #  * IPADIC (Japanese)
     #    - http://chasen.aist-nara.ac.jp/chasen/distribution.html
     #    - Its license terms and conditions are shown below.
     #
     #  ---------COPYING.libtabe ---- BEGIN--------------------
     #
     #  /*
     #   * Copyright (c) 1999 TaBE Project.
     #   * Copyright (c) 1999 Pai-Hsiang Hsiao.
     #   * All rights reserved.
     #   *
     #   * Redistribution and use in source and binary forms, with or without
     #   * modification, are permitted provided that the following conditions
     #   * are met:
     #   *
     #   * . Redistributions of source code must retain the above copyright
     #   *   notice, this list of conditions and the following disclaimer.
     #   * . Redistributions in binary form must reproduce the above copyright
     #   *   notice, this list of conditions and the following disclaimer in
     #   *   the documentation and/or other materials provided with the
     #   *   distribution.
     #   * . Neither the name of the TaBE Project nor the names of its
     #   *   contributors may be used to endorse or promote products derived
     #   *   from this software without specific prior written permission.
     #   *
     #   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
     #   * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
     #   * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
     #   * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
     #   * REGENTS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
     #   * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
     #   * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     #   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
     #   * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
     #   * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
     #   * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
     #   * OF THE POSSIBILITY OF SUCH DAMAGE.
     #   */
     #
     #  /*
     #   * Copyright (c) 1999 Computer Systems and Communication Lab,
     #   *                    Institute of Information Science, Academia
     #       *                    Sinica. All rights reserved.
     #   *
     #   * Redistribution and use in source and binary forms, with or without
     #   * modification, are permitted provided that the following conditions
     #   * are met:
     #   *
     #   * . Redistributions of source code must retain the above copyright
     #   *   notice, this list of conditions and the following disclaimer.
     #   * . Redistributions in binary form must reproduce the above copyright
     #   *   notice, this list of conditions and the following disclaimer in
     #   *   the documentation and/or other materials provided with the
     #   *   distribution.
     #   * . Neither the name of the Computer Systems and Communication Lab
     #   *   nor the names of its contributors may be used to endorse or
     #   *   promote products derived from this software without specific
     #   *   prior written permission.
     #   *
     #   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
     #   * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
     #   * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
     #   * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
     #   * REGENTS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
     #   * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
     #   * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     #   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
     #   * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
     #   * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
     #   * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
     #   * OF THE POSSIBILITY OF SUCH DAMAGE.
     #   */
     #
     #  Copyright 1996 Chih-Hao Tsai @ Beckman Institute,
     #      University of Illinois
     #  c-tsai4@uiuc.edu  http://casper.beckman.uiuc.edu/~c-tsai4
     #
     #  ---------------COPYING.libtabe-----END--------------------------------
     #
     #
     #  ---------------COPYING.ipadic-----BEGIN-------------------------------
     #
     #  Copyright 2000, 2001, 2002, 2003 Nara Institute of Science
     #  and Technology.  All Rights Reserved.
     #
     #  Use, reproduction, and distribution of this software is permitted.
     #  Any copy of this software, whether in its original form or modified,
     #  must include both the above copyright notice and the following
     #  paragraphs.
     #
     #  Nara Institute of Science and Technology (NAIST),
     #  the copyright holders, disclaims all warranties with regard to this
     #  software, including all implied warranties of merchantability and
     #  fitness, in no event shall NAIST be liable for
     #  any special, indirect or consequential damages or any damages
     #  whatsoever resulting from loss of use, data or profits, whether in an
     #  action of contract, negligence or other tortuous action, arising out
     #  of or in connection with the use or performance of this software.
     #
     #  A large portion of the dictionary entries
     #  originate from ICOT Free Software.  The following conditions for ICOT
     #  Free Software applies to the current dictionary as well.
     #
     #  Each User may also freely distribute the Program, whether in its
     #  original form or modified, to any third party or parties, PROVIDED
     #  that the provisions of Section 3 ("NO WARRANTY") will ALWAYS appear
     #  on, or be attached to, the Program, which is distributed substantially
     #  in the same form as set out herein and that such intended
     #  distribution, if actually made, will neither violate or otherwise
     #  contravene any of the laws and regulations of the countries having
     #  jurisdiction over the User or the intended distribution itself.
     #
     #  NO WARRANTY
     #
     #  The program was produced on an experimental basis in the course of the
     #  research and development conducted during the project and is provided
     #  to users as so produced on an experimental basis.  Accordingly, the
     #  program is provided without any warranty whatsoever, whether express,
     #  implied, statutory or otherwise.  The term "warranty" used herein
     #  includes, but is not limited to, any warranty of the quality,
     #  performance, merchantability and fitness for a particular purpose of
     #  the program and the nonexistence of any infringement or violation of
     #  any right of any third party.
     #
     #  Each user of the program will agree and understand, and be deemed to
     #  have agreed and understood, that there is no warranty whatsoever for
     #  the program and, accordingly, the entire risk arising from or
     #  otherwise connected with the program is assumed by the user.
     #
     #  Therefore, neither ICOT, the copyright holder, or any other
     #  organization that participated in or was otherwise related to the
     #  development of the program and their respective officials, directors,
     #  officers and other employees shall be held liable for any and all
     #  damages, including, without limitation, general, special, incidental
     #  and consequential damages, arising out of or otherwise in connection
     #  with the use or inability to use the program or any product, material
     #  or result produced or otherwise obtained by using the program,
     #  regardless of whether they have been advised of, or otherwise had
     #  knowledge of, the possibility of such damages at any time during the
     #  project or thereafter.  Each user will be deemed to have agreed to the
     #  foregoing by his or her commencement of use of the program.  The term
     #  "use" as used herein includes, but is not limited to, the use,
     #  modification, copying and distribution of the program and the
     #  production of secondary products from the program.
     #
     #  In the case where the program, whether in its original form or
     #  modified, was distributed or delivered to or received by a user from
     #  any person, organization or entity other than ICOT, unless it makes or
     #  grants independently of ICOT any specific warranty to the user in
     #  writing, such person, organization or entity, will also be exempted
     #  from and not be held liable to the user for any such damages as noted
     #  above as far as the program is concerned.
     #
     #  ---------------COPYING.ipadic-----END----------------------------------

    ----------------------------------------------------------------------

    Lao Word Break Dictionary Data (laodict.txt)

     # Copyright (C) 2016 and later: Unicode, Inc. and others.
     # License & terms of use: http://www.unicode.org/copyright.html
     # Copyright (c) 2015 International Business Machines Corporation
     # and others. All Rights Reserved.
     #
     # Project: https://github.com/rober42539/lao-dictionary
     # Dictionary: https://github.com/rober42539/lao-dictionary/laodict.txt
     # License: https://github.com/rober42539/lao-dictionary/LICENSE.txt
     #          (copied below)
     #
     # This file is derived from the above dictionary version of Nov 22, 2020
     #  ----------------------------------------------------------------------
     #  Copyright (C) 2013 Brian Eugene Wilson, Robert Martin Campbell.
     #  All rights reserved.
     #
     #  Redistribution and use in source and binary forms, with or without
     #  modification, are permitted provided that the following conditions are met:
     #
     #  Redistributions of source code must retain the above copyright notice, this
     #  list of conditions and the following disclaimer. Redistributions in binary
     #  form must reproduce the above copyright notice, this list of conditions and
     #  the following disclaimer in the documentation and/or other materials
     #  provided with the distribution.
     #
     # THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
     # "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
     # LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
     # FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
     # COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
     # INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
     # (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     # SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
     # HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
     # STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
     # ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
     # OF THE POSSIBILITY OF SUCH DAMAGE.
     #  --------------------------------------------------------------------------

    ----------------------------------------------------------------------

    Burmese Word Break Dictionary Data (burmesedict.txt)

     #  Copyright (c) 2014 International Business Machines Corporation
     #  and others. All Rights Reserved.
     #
     #  This list is part of a project hosted at:
     #    github.com/kanyawtech/myanmar-karen-word-lists
     #
     #  --------------------------------------------------------------------------
     #  Copyright (c) 2013, LeRoy Benjamin Sharon
     #  All rights reserved.
     #
     #  Redistribution and use in source and binary forms, with or without
     #  modification, are permitted provided that the following conditions
     #  are met: Redistributions of source code must retain the above
     #  copyright notice, this list of conditions and the following
     #  disclaimer.  Redistributions in binary form must reproduce the
     #  above copyright notice, this list of conditions and the following
     #  disclaimer in the documentation and/or other materials provided
     #  with the distribution.
     #
     #    Neither the name Myanmar Karen Word Lists, nor the names of its
     #    contributors may be used to endorse or promote products derived
     #    from this software without specific prior written permission.
     #
     #  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND
     #  CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
     #  INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
     #  MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     #  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS
     #  BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
     #  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
     #  TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
     #  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
     #  ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
     #  TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
     #  THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
     #  SUCH DAMAGE.
     #  --------------------------------------------------------------------------

    ----------------------------------------------------------------------

    Time Zone Database

      ICU uses the public domain data and code derived from Time Zone
    Database for its time zone support. The ownership of the TZ database
    is explained in BCP 175: Procedure for Maintaining the Time Zone
    Database section 7.

     # 7.  Database Ownership
     #
     #    The TZ database itself is not an IETF Contribution or an IETF
     #    document.  Rather it is a pre-existing and regularly updated work
     #    that is in the public domain, and is intended to remain in the
     #    public domain.  Therefore, BCPs 78 [RFC5378] and 79 [RFC3979] do
     #    not apply to the TZ Database or contributions that individuals make
     #    to it.  Should any claims be made and substantiated against the TZ
     #    Database, the organization that is providing the IANA
     #    Considerations defined in this RFC, under the memorandum of
     #    understanding with the IETF, currently ICANN, may act in accordance
     #    with all competent court orders.  No ownership claims will be made
     #    by ICANN or the IETF Trust on the database or the code.  Any person
     #    making a contribution to the database or code waives all rights to
     #    future claims in that contribution or in the TZ Database.

    ----------------------------------------------------------------------

    Google double-conversion

    Copyright 2006-2011, the V8 project authors. All rights reserved.
    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are
    met:

        * Redistributions of source code must retain the above copyright
          notice, this list of conditions and the following disclaimer.
        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials provided
          with the distribution.
        * Neither the name of Google Inc. nor the names of its
          contributors may be used to endorse or promote products derived
          from this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
    "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
    LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
    A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
    LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

    ----------------------------------------------------------------------

    JSON parsing library (nlohmann/json)

    File: vendor/json/upstream/single_include/nlohmann/json.hpp (only for ICU4C)

    MIT License

    Copyright (c) 2013-2022 Niels Lohmann

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

    ----------------------------------------------------------------------

    File: aclocal.m4 (only for ICU4C)
    Section: pkg.m4 - Macros to locate and utilise pkg-config.

    Copyright © 2004 Scott James Remnant .
    Copyright © 2012-2015 Dan Nicholson

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful, but
    WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
    General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA
    02111-1307, USA.

    As a special exception to the GNU General Public License, if you
    distribute this file as part of a program that contains a
    configuration script generated by Autoconf, you may include it under
    the same distribution terms that you use for the rest of that
    program.

    (The condition for the exception is fulfilled because
    ICU4C includes a configuration script generated by Autoconf,
    namely the `configure` script.)

    ----------------------------------------------------------------------

    File: config.guess (only for ICU4C)

    This file is free software; you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful, but
    WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, see .

    As a special exception to the GNU General Public License, if you
    distribute this file as part of a program that contains a
    configuration script generated by Autoconf, you may include it under
    the same distribution terms that you use for the rest of that
    program.  This Exception is an additional permission under section 7
    of the GNU General Public License, version 3 ("GPLv3").

    (The condition for the exception is fulfilled because
    ICU4C includes a configuration script generated by Autoconf,
    namely the `configure` script.)

    ----------------------------------------------------------------------

    File: install-sh (only for ICU4C)

    Copyright 1991 by the Massachusetts Institute of Technology

    Permission to use, copy, modify, distribute, and sell this software and its
    documentation for any purpose is hereby granted without fee, provided that
    the above copyright notice appear in all copies and that both that
    copyright notice and this permission notice appear in supporting
    documentation, and that the name of M.I.T. not be used in advertising or
    publicity pertaining to distribution of the software without specific,
    written prior permission.  M.I.T. makes no representations about the
    suitability of this software for any purpose.  It is provided "as is"
    without express or implied warranty.

    ----------------------------------------------------------------------

    File: sorttable.js (only for ICU4J)

    The MIT Licence, for code from kryogenix.org

    Code downloaded from the Browser Experiments section of kryogenix.org is
    licenced under the so-called MIT licence. The licence is below.

    Copyright (c) 1997-date Stuart Langridge

    Permission is hereby granted, free of charge, to any person obtaining a
    copy of this software and associated documentation files (the "Software"),
    to deal in the Software without restriction, including without limitation
    the rights to use, copy, modify, merge, publish, distribute, sublicense,
    and/or sell copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following conditions:

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  """

- libuv, located at deps/uv, is licensed as follows:
  """
    Copyright (c) 2015-present libuv project contributors.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to
    deal in the Software without restriction, including without limitation the
    rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
    sell copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
    IN THE SOFTWARE.
    This license applies to parts of libuv originating from the
    https://github.com/joyent/libuv repository:

    ====

    Copyright Joyent, Inc. and other Node contributors. All rights reserved.
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to
    deal in the Software without restriction, including without limitation the
    rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
    sell copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
    IN THE SOFTWARE.

    ====

    This license applies to all parts of libuv that are not externally
    maintained libraries.

    The externally maintained libraries used by libuv are:

      - tree.h (from FreeBSD), copyright Niels Provos. Two clause BSD license.

      - inet_pton and inet_ntop implementations, contained in src/inet.c, are
        copyright the Internet Systems Consortium, Inc., and licensed under the ISC
        license.
  """

- LIEF, located at deps/LIEF, is licensed as follows:
  """
                                     Apache License
                               Version 2.0, January 2004
                            http://www.apache.org/licenses/

       TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

       1. Definitions.

          "License" shall mean the terms and conditions for use, reproduction,
          and distribution as defined by Sections 1 through 9 of this document.

          "Licensor" shall mean the copyright owner or entity authorized by
          the copyright owner that is granting the License.

          "Legal Entity" shall mean the union of the acting entity and all
          other entities that control, are controlled by, or are under common
          control with that entity. For the purposes of this definition,
          "control" means (i) the power, direct or indirect, to cause the
          direction or management of such entity, whether by contract or
          otherwise, or (ii) ownership of fifty percent (50%) or more of the
          outstanding shares, or (iii) beneficial ownership of such entity.

          "You" (or "Your") shall mean an individual or Legal Entity
          exercising permissions granted by this License.

          "Source" form shall mean the preferred form for making modifications,
          including but not limited to software source code, documentation
          source, and configuration files.

          "Object" form shall mean any form resulting from mechanical
          transformation or translation of a Source form, including but
          not limited to compiled object code, generated documentation,
          and conversions to other media types.

          "Work" shall mean the work of authorship, whether in Source or
          Object form, made available under the License, as indicated by a
          copyright notice that is included in or attached to the work
          (an example is provided in the Appendix below).

          "Derivative Works" shall mean any work, whether in Source or Object
          form, that is based on (or derived from) the Work and for which the
          editorial revisions, annotations, elaborations, or other modifications
          represent, as a whole, an original work of authorship. For the purposes
          of this License, Derivative Works shall not include works that remain
          separable from, or merely link (or bind by name) to the interfaces of,
          the Work and Derivative Works thereof.

          "Contribution" shall mean any work of authorship, including
          the original version of the Work and any modifications or additions
          to that Work or Derivative Works thereof, that is intentionally
          submitted to Licensor for inclusion in the Work by the copyright owner
          or by an individual or Legal Entity authorized to submit on behalf of
          the copyright owner. For the purposes of this definition, "submitted"
          means any form of electronic, verbal, or written communication sent
          to the Licensor or its representatives, including but not limited to
          communication on electronic mailing lists, source code control systems,
          and issue tracking systems that are managed by, or on behalf of, the
          Licensor for the purpose of discussing and improving the Work, but
          excluding communication that is conspicuously marked or otherwise
          designated in writing by the copyright owner as "Not a Contribution."

          "Contributor" shall mean Licensor and any individual or Legal Entity
          on behalf of whom a Contribution has been received by Licensor and
          subsequently incorporated within the Work.

       2. Grant of Copyright License. Subject to the terms and conditions of
          this License, each Contributor hereby grants to You a perpetual,
          worldwide, non-exclusive, no-charge, royalty-free, irrevocable
          copyright license to reproduce, prepare Derivative Works of,
          publicly display, publicly perform, sublicense, and distribute the
          Work and such Derivative Works in Source or Object form.

       3. Grant of Patent License. Subject to the terms and conditions of
          this License, each Contributor hereby grants to You a perpetual,
          worldwide, non-exclusive, no-charge, royalty-free, irrevocable
          (except as stated in this section) patent license to make, have made,
          use, offer to sell, sell, import, and otherwise transfer the Work,
          where such license applies only to those patent claims licensable
          by such Contributor that are necessarily infringed by their
          Contribution(s) alone or by combination of their Contribution(s)
          with the Work to which such Contribution(s) was submitted. If You
          institute patent litigation against any entity (including a
          cross-claim or counterclaim in a lawsuit) alleging that the Work
          or a Contribution incorporated within the Work constitutes direct
          or contributory patent infringement, then any patent licenses
          granted to You under this License for that Work shall terminate
          as of the date such litigation is filed.

       4. Redistribution. You may reproduce and distribute copies of the
          Work or Derivative Works thereof in any medium, with or without
          modifications, and in Source or Object form, provided that You
          meet the following conditions:

          (a) You must give any other recipients of the Work or
              Derivative Works a copy of this License; and

          (b) You must cause any modified files to carry prominent notices
              stating that You changed the files; and

          (c) You must retain, in the Source form of any Derivative Works
              that You distribute, all copyright, patent, trademark, and
              attribution notices from the Source form of the Work,
              excluding those notices that do not pertain to any part of
              the Derivative Works; and

          (d) If the Work includes a "NOTICE" text file as part of its
              distribution, then any Derivative Works that You distribute must
              include a readable copy of the attribution notices contained
              within such NOTICE file, excluding those notices that do not
              pertain to any part of the Derivative Works, in at least one
              of the following places: within a NOTICE text file distributed
              as part of the Derivative Works; within the Source form or
              documentation, if provided along with the Derivative Works; or,
              within a display generated by the Derivative Works, if and
              wherever such third-party notices normally appear. The contents
              of the NOTICE file are for informational purposes only and
              do not modify the License. You may add Your own attribution
              notices within Derivative Works that You distribute, alongside
              or as an addendum to the NOTICE text from the Work, provided
              that such additional attribution notices cannot be construed
              as modifying the License.

          You may add Your own copyright statement to Your modifications and
          may provide additional or different license terms and conditions
          for use, reproduction, or distribution of Your modifications, or
          for any such Derivative Works as a whole, provided Your use,
          reproduction, and distribution of the Work otherwise complies with
          the conditions stated in this License.

       5. Submission of Contributions. Unless You explicitly state otherwise,
          any Contribution intentionally submitted for inclusion in the Work
          by You to the Licensor shall be under the terms and conditions of
          this License, without any additional terms or conditions.
          Notwithstanding the above, nothing herein shall supersede or modify
          the terms of any separate license agreement you may have executed
          with Licensor regarding such Contributions.

       6. Trademarks. This License does not grant permission to use the trade
          names, trademarks, service marks, or product names of the Licensor,
          except as required for reasonable and customary use in describing the
          origin of the Work and reproducing the content of the NOTICE file.

       7. Disclaimer of Warranty. Unless required by applicable law or
          agreed to in writing, Licensor provides the Work (and each
          Contributor provides its Contributions) on an "AS IS" BASIS,
          WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
          implied, including, without limitation, any warranties or conditions
          of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
          PARTICULAR PURPOSE. You are solely responsible for determining the
          appropriateness of using or redistributing the Work and assume any
          risks associated with Your exercise of permissions under this License.

       8. Limitation of Liability. In no event and under no legal theory,
          whether in tort (including negligence), contract, or otherwise,
          unless required by applicable law (such as deliberate and grossly
          negligent acts) or agreed to in writing, shall any Contributor be
          liable to You for damages, including any direct, indirect, special,
          incidental, or consequential damages of any character arising as a
          result of this License or out of the use or inability to use the
          Work (including but not limited to damages for loss of goodwill,
          work stoppage, computer failure or malfunction, or any and all
          other commercial damages or losses), even if such Contributor
          has been advised of the possibility of such damages.

       9. Accepting Warranty or Additional Liability. While redistributing
          the Work or Derivative Works thereof, You may choose to offer,
          and charge a fee for, acceptance of support, warranty, indemnity,
          or other liability obligations and/or rights consistent with this
          License. However, in accepting such obligations, You may act only
          on Your own behalf and on Your sole responsibility, not on behalf
          of any other Contributor, and only if You agree to indemnify,
          defend, and hold each Contributor harmless for any liability
          incurred by, or claims asserted against, such Contributor by reason
          of your accepting any such warranty or additional liability.

       END OF TERMS AND CONDITIONS

       APPENDIX: How to apply the Apache License to your work.

          To apply the Apache License to your work, attach the following
          boilerplate notice, with the fields enclosed by brackets "{}"
          replaced with your own identifying information. (Don't include
          the brackets!)  The text should be enclosed in the appropriate
          comment syntax for the file format. We also recommend that a
          file or class name and description of purpose be included on the
          same "printed page" as the copyright notice for easier
          identification within third-party archives.

       Copyright 2017 - 2025 R. Thomas
       Copyright 2017 - 2025 Quarkslab

       Licensed under the Apache License, Version 2.0 (the "License");
       you may not use this file except in compliance with the License.
       You may obtain a copy of the License at

           http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing, software
       distributed under the License is distributed on an "AS IS" BASIS,
       WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
       See the License for the specific language governing permissions and
       limitations under the License.
  """

- llhttp, located at deps/llhttp, is licensed as follows:
  """
    This software is licensed under the MIT License.

    Copyright Fedor Indutny, 2018.

    Permission is hereby granted, free of charge, to any person obtaining a
    copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to permit
    persons to whom the Software is furnished to do so, subject to the
    following conditions:

    The above copyright notice and this permission notice shall be included
    in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    USE OR OTHER DEALINGS IN THE SOFTWARE.
  """

- corepack, located at deps/corepack, is licensed as follows:
  """
    **Copyright © Corepack contributors**

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  """

- undici, located at deps/undici, is licensed as follows:
  """
    MIT License

    Copyright (c) Matteo Collina and Undici contributors

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  """

- postject, located at test/fixtures/postject-copy, is licensed as follows:
  """
    Postject is licensed for use as follows:

    """
    MIT License

    Copyright (c) 2022 Postman, Inc

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
    """

    The Postject license applies to all parts of Postject that are not externally
    maintained libraries.

    The externally maintained libraries used by Postject are:

    - LIEF, located at vendor/LIEF, is licensed as follows:
      """
                                         Apache License
                                   Version 2.0, January 2004
                                http://www.apache.org/licenses/

           TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

           1. Definitions.

              "License" shall mean the terms and conditions for use, reproduction,
              and distribution as defined by Sections 1 through 9 of this document.

              "Licensor" shall mean the copyright owner or entity authorized by
              the copyright owner that is granting the License.

              "Legal Entity" shall mean the union of the acting entity and all
              other entities that control, are controlled by, or are under common
              control with that entity. For the purposes of this definition,
              "control" means (i) the power, direct or indirect, to cause the
              direction or management of such entity, whether by contract or
              otherwise, or (ii) ownership of fifty percent (50%) or more of the
              outstanding shares, or (iii) beneficial ownership of such entity.

              "You" (or "Your") shall mean an individual or Legal Entity
              exercising permissions granted by this License.

              "Source" form shall mean the preferred form for making modifications,
              including but not limited to software source code, documentation
              source, and configuration files.

              "Object" form shall mean any form resulting from mechanical
              transformation or translation of a Source form, including but
              not limited to compiled object code, generated documentation,
              and conversions to other media types.

              "Work" shall mean the work of authorship, whether in Source or
              Object form, made available under the License, as indicated by a
              copyright notice that is included in or attached to the work
              (an example is provided in the Appendix below).

              "Derivative Works" shall mean any work, whether in Source or Object
              form, that is based on (or derived from) the Work and for which the
              editorial revisions, annotations, elaborations, or other modifications
              represent, as a whole, an original work of authorship. For the purposes
              of this License, Derivative Works shall not include works that remain
              separable from, or merely link (or bind by name) to the interfaces of,
              the Work and Derivative Works thereof.

              "Contribution" shall mean any work of authorship, including
              the original version of the Work and any modifications or additions
              to that Work or Derivative Works thereof, that is intentionally
              submitted to Licensor for inclusion in the Work by the copyright owner
              or by an individual or Legal Entity authorized to submit on behalf of
              the copyright owner. For the purposes of this definition, "submitted"
              means any form of electronic, verbal, or written communication sent
              to the Licensor or its representatives, including but not limited to
              communication on electronic mailing lists, source code control systems,
              and issue tracking systems that are managed by, or on behalf of, the
              Licensor for the purpose of discussing and improving the Work, but
              excluding communication that is conspicuously marked or otherwise
              designated in writing by the copyright owner as "Not a Contribution."

              "Contributor" shall mean Licensor and any individual or Legal Entity
              on behalf of whom a Contribution has been received by Licensor and
              subsequently incorporated within the Work.

           2. Grant of Copyright License. Subject to the terms and conditions of
              this License, each Contributor hereby grants to You a perpetual,
              worldwide, non-exclusive, no-charge, royalty-free, irrevocable
              copyright license to reproduce, prepare Derivative Works of,
              publicly display, publicly perform, sublicense, and distribute the
              Work and such Derivative Works in Source or Object form.

           3. Grant of Patent License. Subject to the terms and conditions of
              this License, each Contributor hereby grants to You a perpetual,
              worldwide, non-exclusive, no-charge, royalty-free, irrevocable
              (except as stated in this section) patent license to make, have made,
              use, offer to sell, sell, import, and otherwise transfer the Work,
              where such license applies only to those patent claims licensable
              by such Contributor that are necessarily infringed by their
              Contribution(s) alone or by combination of their Contribution(s)
              with the Work to which such Contribution(s) was submitted. If You
              institute patent litigation against any entity (including a
              cross-claim or counterclaim in a lawsuit) alleging that the Work
              or a Contribution incorporated within the Work constitutes direct
              or contributory patent infringement, then any patent licenses
              granted to You under this License for that Work shall terminate
              as of the date such litigation is filed.

           4. Redistribution. You may reproduce and distribute copies of the
              Work or Derivative Works thereof in any medium, with or without
              modifications, and in Source or Object form, provided that You
              meet the following conditions:

              (a) You must give any other recipients of the Work or
                  Derivative Works a copy of this License; and

              (b) You must cause any modified files to carry prominent notices
                  stating that You changed the files; and

              (c) You must retain, in the Source form of any Derivative Works
                  that You distribute, all copyright, patent, trademark, and
                  attribution notices from the Source form of the Work,
                  excluding those notices that do not pertain to any part of
                  the Derivative Works; and

              (d) If the Work includes a "NOTICE" text file as part of its
                  distribution, then any Derivative Works that You distribute must
                  include a readable copy of the attribution notices contained
                  within such NOTICE file, excluding those notices that do not
                  pertain to any part of the Derivative Works, in at least one
                  of the following places: within a NOTICE text file distributed
                  as part of the Derivative Works; within the Source form or
                  documentation, if provided along with the Derivative Works; or,
                  within a display generated by the Derivative Works, if and
                  wherever such third-party notices normally appear. The contents
                  of the NOTICE file are for informational purposes only and
                  do not modify the License. You may add Your own attribution
                  notices within Derivative Works that You distribute, alongside
                  or as an addendum to the NOTICE text from the Work, provided
                  that such additional attribution notices cannot be construed
                  as modifying the License.

              You may add Your own copyright statement to Your modifications and
              may provide additional or different license terms and conditions
              for use, reproduction, or distribution of Your modifications, or
              for any such Derivative Works as a whole, provided Your use,
              reproduction, and distribution of the Work otherwise complies with
              the conditions stated in this License.

           5. Submission of Contributions. Unless You explicitly state otherwise,
              any Contribution intentionally submitted for inclusion in the Work
              by You to the Licensor shall be under the terms and conditions of
              this License, without any additional terms or conditions.
              Notwithstanding the above, nothing herein shall supersede or modify
              the terms of any separate license agreement you may have executed
              with Licensor regarding such Contributions.

           6. Trademarks. This License does not grant permission to use the trade
              names, trademarks, service marks, or product names of the Licensor,
              except as required for reasonable and customary use in describing the
              origin of the Work and reproducing the content of the NOTICE file.

           7. Disclaimer of Warranty. Unless required by applicable law or
              agreed to in writing, Licensor provides the Work (and each
              Contributor provides its Contributions) on an "AS IS" BASIS,
              WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
              implied, including, without limitation, any warranties or conditions
              of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
              PARTICULAR PURPOSE. You are solely responsible for determining the
              appropriateness of using or redistributing the Work and assume any
              risks associated with Your exercise of permissions under this License.

           8. Limitation of Liability. In no event and under no legal theory,
              whether in tort (including negligence), contract, or otherwise,
              unless required by applicable law (such as deliberate and grossly
              negligent acts) or agreed to in writing, shall any Contributor be
              liable to You for damages, including any direct, indirect, special,
              incidental, or consequential damages of any character arising as a
              result of this License or out of the use or inability to use the
              Work (including but not limited to damages for loss of goodwill,
              work stoppage, computer failure or malfunction, or any and all
              other commercial damages or losses), even if such Contributor
              has been advised of the possibility of such damages.

           9. Accepting Warranty or Additional Liability. While redistributing
              the Work or Derivative Works thereof, You may choose to offer,
              and charge a fee for, acceptance of support, warranty, indemnity,
              or other liability obligations and/or rights consistent with this
              License. However, in accepting such obligations, You may act only
              on Your own behalf and on Your sole responsibility, not on behalf
              of any other Contributor, and only if You agree to indemnify,
              defend, and hold each Contributor harmless for any liability
              incurred by, or claims asserted against, such Contributor by reason
              of your accepting any such warranty or additional liability.

           END OF TERMS AND CONDITIONS

           APPENDIX: How to apply the Apache License to your work.

              To apply the Apache License to your work, attach the following
              boilerplate notice, with the fields enclosed by brackets "{}"
              replaced with your own identifying information. (Don't include
              the brackets!)  The text should be enclosed in the appropriate
              comment syntax for the file format. We also recommend that a
              file or class name and description of purpose be included on the
              same "printed page" as the copyright notice for easier
              identification within third-party archives.

           Copyright 2017 - 2022 R. Thomas
           Copyright 2017 - 2022 Quarkslab

           Licensed under the Apache License, Version 2.0 (the "License");
           you may not use this file except in compliance with the License.
           You may obtain a copy of the License at

               http://www.apache.org/licenses/LICENSE-2.0

           Unless required by applicable law or agreed to in writing, software
           distributed under the License is distributed on an "AS IS" BASIS,
           WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
           See the License for the specific language governing permissions and
           limitations under the License.
      """
  """

- OpenSSL, located at deps/openssl, is licensed as follows:
  """
                                     Apache License
                               Version 2.0, January 2004
                            https://www.apache.org/licenses/

       TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

       1. Definitions.

          "License" shall mean the terms and conditions for use, reproduction,
          and distribution as defined by Sections 1 through 9 of this document.

          "Licensor" shall mean the copyright owner or entity authorized by
          the copyright owner that is granting the License.

          "Legal Entity" shall mean the union of the acting entity and all
          other entities that control, are controlled by, or are under common
          control with that entity. For the purposes of this definition,
          "control" means (i) the power, direct or indirect, to cause the
          direction or management of such entity, whether by contract or
          otherwise, or (ii) ownership of fifty percent (50%) or more of the
          outstanding shares, or (iii) beneficial ownership of such entity.

          "You" (or "Your") shall mean an individual or Legal Entity
          exercising permissions granted by this License.

          "Source" form shall mean the preferred form for making modifications,
          including but not limited to software source code, documentation
          source, and configuration files.

          "Object" form shall mean any form resulting from mechanical
          transformation or translation of a Source form, including but
          not limited to compiled object code, generated documentation,
          and conversions to other media types.

          "Work" shall mean the work of authorship, whether in Source or
          Object form, made available under the License, as indicated by a
          copyright notice that is included in or attached to the work
          (an example is provided in the Appendix below).

          "Derivative Works" shall mean any work, whether in Source or Object
          form, that is based on (or derived from) the Work and for which the
          editorial revisions, annotations, elaborations, or other modifications
          represent, as a whole, an original work of authorship. For the purposes
          of this License, Derivative Works shall not include works that remain
          separable from, or merely link (or bind by name) to the interfaces of,
          the Work and Derivative Works thereof.

          "Contribution" shall mean any work of authorship, including
          the original version of the Work and any modifications or additions
          to that Work or Derivative Works thereof, that is intentionally
          submitted to Licensor for inclusion in the Work by the copyright owner
          or by an individual or Legal Entity authorized to submit on behalf of
          the copyright owner. For the purposes of this definition, "submitted"
          means any form of electronic, verbal, or written communication sent
          to the Licensor or its representatives, including but not limited to
          communication on electronic mailing lists, source code control systems,
          and issue tracking systems that are managed by, or on behalf of, the
          Licensor for the purpose of discussing and improving the Work, but
          excluding communication that is conspicuously marked or otherwise
          designated in writing by the copyright owner as "Not a Contribution."

          "Contributor" shall mean Licensor and any individual or Legal Entity
          on behalf of whom a Contribution has been received by Licensor and
          subsequently incorporated within the Work.

       2. Grant of Copyright License. Subject to the terms and conditions of
          this License, each Contributor hereby grants to You a perpetual,
          worldwide, non-exclusive, no-charge, royalty-free, irrevocable
          copyright license to reproduce, prepare Derivative Works of,
          publicly display, publicly perform, sublicense, and distribute the
          Work and such Derivative Works in Source or Object form.

       3. Grant of Patent License. Subject to the terms and conditions of
          this License, each Contributor hereby grants to You a perpetual,
          worldwide, non-exclusive, no-charge, royalty-free, irrevocable
          (except as stated in this section) patent license to make, have made,
          use, offer to sell, sell, import, and otherwise transfer the Work,
          where such license applies only to those patent claims licensable
          by such Contributor that are necessarily infringed by their
          Contribution(s) alone or by combination of their Contribution(s)
          with the Work to which such Contribution(s) was submitted. If You
          institute patent litigation against any entity (including a
          cross-claim or counterclaim in a lawsuit) alleging that the Work
          or a Contribution incorporated within the Work constitutes direct
          or contributory patent infringement, then any patent licenses
          granted to You under this License for that Work shall terminate
          as of the date such litigation is filed.

       4. Redistribution. You may reproduce and distribute copies of the
          Work or Derivative Works thereof in any medium, with or without
          modifications, and in Source or Object form, provided that You
          meet the following conditions:

          (a) You must give any other recipients of the Work or
              Derivative Works a copy of this License; and

          (b) You must cause any modified files to carry prominent notices
              stating that You changed the files; and

          (c) You must retain, in the Source form of any Derivative Works
              that You distribute, all copyright, patent, trademark, and
              attribution notices from the Source form of the Work,
              excluding those notices that do not pertain to any part of
              the Derivative Works; and

          (d) If the Work includes a "NOTICE" text file as part of its
              distribution, then any Derivative Works that You distribute must
              include a readable copy of the attribution notices contained
              within such NOTICE file, excluding those notices that do not
              pertain to any part of the Derivative Works, in at least one
              of the following places: within a NOTICE text file distributed
              as part of the Derivative Works; within the Source form or
              documentation, if provided along with the Derivative Works; or,
              within a display generated by the Derivative Works, if and
              wherever such third-party notices normally appear. The contents
              of the NOTICE file are for informational purposes only and
              do not modify the License. You may add Your own attribution
              notices within Derivative Works that You distribute, alongside
              or as an addendum to the NOTICE text from the Work, provided
              that such additional attribution notices cannot be construed
              as modifying the License.

          You may add Your own copyright statement to Your modifications and
          may provide additional or different license terms and conditions
          for use, reproduction, or distribution of Your modifications, or
          for any such Derivative Works as a whole, provided Your use,
          reproduction, and distribution of the Work otherwise complies with
          the conditions stated in this License.

       5. Submission of Contributions. Unless You explicitly state otherwise,
          any Contribution intentionally submitted for inclusion in the Work
          by You to the Licensor shall be under the terms and conditions of
          this License, without any additional terms or conditions.
          Notwithstanding the above, nothing herein shall supersede or modify
          the terms of any separate license agreement you may have executed
          with Licensor regarding such Contributions.

       6. Trademarks. This License does not grant permission to use the trade
          names, trademarks, service marks, or product names of the Licensor,
          except as required for reasonable and customary use in describing the
          origin of the Work and reproducing the content of the NOTICE file.

       7. Disclaimer of Warranty. Unless required by applicable law or
          agreed to in writing, Licensor provides the Work (and each
          Contributor provides its Contributions) on an "AS IS" BASIS,
          WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
          implied, including, without limitation, any warranties or conditions
          of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
          PARTICULAR PURPOSE. You are solely responsible for determining the
          appropriateness of using or redistributing the Work and assume any
          risks associated with Your exercise of permissions under this License.

       8. Limitation of Liability. In no event and under no legal theory,
          whether in tort (including negligence), contract, or otherwise,
          unless required by applicable law (such as deliberate and grossly
          negligent acts) or agreed to in writing, shall any Contributor be
          liable to You for damages, including any direct, indirect, special,
          incidental, or consequential damages of any character arising as a
          result of this License or out of the use or inability to use the
          Work (including but not limited to damages for loss of goodwill,
          work stoppage, computer failure or malfunction, or any and all
          other commercial damages or losses), even if such Contributor
          has been advised of the possibility of such damages.

       9. Accepting Warranty or Additional Liability. While redistributing
          the Work or Derivative Works thereof, You may choose to offer,
          and charge a fee for, acceptance of support, warranty, indemnity,
          or other liability obligations and/or rights consistent with this
          License. However, in accepting such obligations, You may act only
          on Your own behalf and on Your sole responsibility, not on behalf
          of any other Contributor, and only if You agree to indemnify,
          defend, and hold each Contributor harmless for any liability
          incurred by, or claims asserted against, such Contributor by reason
          of your accepting any such warranty or additional liability.

       END OF TERMS AND CONDITIONS
  """

- Punycode.js, located at lib/punycode.js, is licensed as follows:
  """
    Copyright Mathias Bynens <https://mathiasbynens.be/>

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  """

- V8, located at deps/v8, is licensed as follows:
  """
    This license applies to all parts of V8 that are not externally
    maintained libraries.  The externally maintained libraries used by V8
    are:

      - PCRE test suite, located in
        test/mjsunit/third_party/regexp-pcre/regexp-pcre.js.  This is based on the
        test suite from PCRE-7.3, which is copyrighted by the University
        of Cambridge and Google, Inc.  The copyright notice and license
        are embedded in regexp-pcre.js.

      - Layout tests, located in test/mjsunit/third_party/object-keys.  These are
        based on layout tests from webkit.org which are copyrighted by
        Apple Computer, Inc. and released under a 3-clause BSD license.

      - Strongtalk assembler, the basis of the files assembler-arm-inl.h,
        assembler-arm.cc, assembler-arm.h, assembler-ia32-inl.h,
        assembler-ia32.cc, assembler-ia32.h, assembler-x64-inl.h,
        assembler-x64.cc, assembler-x64.h, assembler.cc and assembler.h.
        This code is copyrighted by Sun Microsystems Inc. and released
        under a 3-clause BSD license.

      - Valgrind client API header, located at third_party/valgrind/valgrind.h
        This is released under the BSD license.

      - The Wasm C/C++ API headers, located at third_party/wasm-api/wasm.{h,hh}
        This is released under the Apache license. The API's upstream prototype
        implementation also formed the basis of V8's implementation in
        src/wasm/c-api.cc.

    These libraries have their own licenses; we recommend you read them,
    as their terms may differ from the terms below.

    Further license information can be found in LICENSE files located in
    sub-directories.

    Copyright 2014, the V8 project authors. All rights reserved.
    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are
    met:

        * Redistributions of source code must retain the above copyright
          notice, this list of conditions and the following disclaimer.
        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials provided
          with the distribution.
        * Neither the name of Google Inc. nor the names of its
          contributors may be used to endorse or promote products derived
          from this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
    "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
    LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
    A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
    LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  """

- SipHash, located at deps/v8/src/third_party/siphash, is licensed as follows:
  """
    SipHash reference C implementation

    Copyright (c) 2016 Jean-Philippe Aumasson <jeanphilippe.aumasson@gmail.com>

    To the extent possible under law, the author(s) have dedicated all
    copyright and related and neighboring rights to this software to the public
    domain worldwide. This software is distributed without any warranty.
  """

- zlib, located at deps/zlib, is licensed as follows:
  """
    zlib.h -- interface of the 'zlib' general purpose compression library
    version 1.3.2.1, February xxth, 2026

    Copyright (C) 1995-2026 Jean-loup Gailly and Mark Adler

    This software is provided 'as-is', without any express or implied
    warranty.  In no event will the authors be held liable for any damages
    arising from the use of this software.

    Permission is granted to anyone to use this software for any purpose,
    including commercial applications, and to alter it and redistribute it
    freely, subject to the following restrictions:

    1. The origin of this software must not be misrepresented; you must not
    claim that you wrote the original software. If you use this software
    in a product, an acknowledgment in the product documentation would be
    appreciated but is not required.
    2. Altered source versions must be plainly marked as such, and must not be
    misrepresented as being the original software.
    3. This notice may not be removed or altered from any source distribution.

    Jean-loup Gailly        Mark Adler
    jloup@gzip.org          madler@alumni.caltech.edu
  """

- simdjson, located at deps/simdjson, is licensed as follows:
  """
                                     Apache License
                               Version 2.0, January 2004
                            http://www.apache.org/licenses/

       TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

       1. Definitions.

          "License" shall mean the terms and conditions for use, reproduction,
          and distribution as defined by Sections 1 through 9 of this document.

          "Licensor" shall mean the copyright owner or entity authorized by
          the copyright owner that is granting the License.

          "Legal Entity" shall mean the union of the acting entity and all
          other entities that control, are controlled by, or are under common
          control with that entity. For the purposes of this definition,
          "control" means (i) the power, direct or indirect, to cause the
          direction or management of such entity, whether by contract or
          otherwise, or (ii) ownership of fifty percent (50%) or more of the
          outstanding shares, or (iii) beneficial ownership of such entity.

          "You" (or "Your") shall mean an individual or Legal Entity
          exercising permissions granted by this License.

          "Source" form shall mean the preferred form for making modifications,
          including but not limited to software source code, documentation
          source, and configuration files.

          "Object" form shall mean any form resulting from mechanical
          transformation or translation of a Source form, including but
          not limited to compiled object code, generated documentation,
          and conversions to other media types.

          "Work" shall mean the work of authorship, whether in Source or
          Object form, made available under the License, as indicated by a
          copyright notice that is included in or attached to the work
          (an example is provided in the Appendix below).

          "Derivative Works" shall mean any work, whether in Source or Object
          form, that is based on (or derived from) the Work and for which the
          editorial revisions, annotations, elaborations, or other modifications
          represent, as a whole, an original work of authorship. For the purposes
          of this License, Derivative Works shall not include works that remain
          separable from, or merely link (or bind by name) to the interfaces of,
          the Work and Derivative Works thereof.

          "Contribution" shall mean any work of authorship, including
          the original version of the Work and any modifications or additions
          to that Work or Derivative Works thereof, that is intentionally
          submitted to Licensor for inclusion in the Work by the copyright owner
          or by an individual or Legal Entity authorized to submit on behalf of
          the copyright owner. For the purposes of this definition, "submitted"
          means any form of electronic, verbal, or written communication sent
          to the Licensor or its representatives, including but not limited to
          communication on electronic mailing lists, source code control systems,
          and issue tracking systems that are managed by, or on behalf of, the
          Licensor for the purpose of discussing and improving the Work, but
          excluding communication that is conspicuously marked or otherwise
          designated in writing by the copyright owner as "Not a Contribution."

          "Contributor" shall mean Licensor and any individual or Legal Entity
          on behalf of whom a Contribution has been received by Licensor and
          subsequently incorporated within the Work.

       2. Grant of Copyright License. Subject to the terms and conditions of
          this License, each Contributor hereby grants to You a perpetual,
          worldwide, non-exclusive, no-charge, royalty-free, irrevocable
          copyright license to reproduce, prepare Derivative Works of,
          publicly display, publicly perform, sublicense, and distribute the
          Work and such Derivative Works in Source or Object form.

       3. Grant of Patent License. Subject to the terms and conditions of
          this License, each Contributor hereby grants to You a perpetual,
          worldwide, non-exclusive, no-charge, royalty-free, irrevocable
          (except as stated in this section) patent license to make, have made,
          use, offer to sell, sell, import, and otherwise transfer the Work,
          where such license applies only to those patent claims licensable
          by such Contributor that are necessarily infringed by their
          Contribution(s) alone or by combination of their Contribution(s)
          with the Work to which such Contribution(s) was submitted. If You
          institute patent litigation against any entity (including a
          cross-claim or counterclaim in a lawsuit) alleging that the Work
          or a Contribution incorporated within the Work constitutes direct
          or contributory patent infringement, then any patent licenses
          granted to You under this License for that Work shall terminate
          as of the date such litigation is filed.

       4. Redistribution. You may reproduce and distribute copies of the
          Work or Derivative Works thereof in any medium, with or without
          modifications, and in Source or Object form, provided that You
          meet the following conditions:

          (a) You must give any other recipients of the Work or
              Derivative Works a copy of this License; and

          (b) You must cause any modified files to carry prominent notices
              stating that You changed the files; and

          (c) You must retain, in the Source form of any Derivative Works
              that You distribute, all copyright, patent, trademark, and
              attribution notices from the Source form of the Work,
              excluding those notices that do not pertain to any part of
              the Derivative Works; and

          (d) If the Work includes a "NOTICE" text file as part of its
              distribution, then any Derivative Works that You distribute must
              include a readable copy of the attribution notices contained
              within such NOTICE file, excluding those notices that do not
              pertain to any part of the Derivative Works, in at least one
              of the following places: within a NOTICE text file distributed
              as part of the Derivative Works; within the Source form or
              documentation, if provided along with the Derivative Works; or,
              within a display generated by the Derivative Works, if and
              wherever such third-party notices normally appear. The contents
              of the NOTICE file are for informational purposes only and
              do not modify the License. You may add Your own attribution
              notices within Derivative Works that You distribute, alongside
              or as an addendum to the NOTICE text from the Work, provided
              that such additional attribution notices cannot be construed
              as modifying the License.

          You may add Your own copyright statement to Your modifications and
          may provide additional or different license terms and conditions
          for use, reproduction, or distribution of Your modifications, or
          for any such Derivative Works as a whole, provided Your use,
          reproduction, and distribution of the Work otherwise complies with
          the conditions stated in this License.

       5. Submission of Contributions. Unless You explicitly state otherwise,
          any Contribution intentionally submitted for inclusion in the Work
          by You to the Licensor shall be under the terms and conditions of
          this License, without any additional terms or conditions.
          Notwithstanding the above, nothing herein shall supersede or modify
          the terms of any separate license agreement you may have executed
          with Licensor regarding such Contributions.

       6. Trademarks. This License does not grant permission to use the trade
          names, trademarks, service marks, or product names of the Licensor,
          except as required for reasonable and customary use in describing the
          origin of the Work and reproducing the content of the NOTICE file.

       7. Disclaimer of Warranty. Unless required by applicable law or
          agreed to in writing, Licensor provides the Work (and each
          Contributor provides its Contributions) on an "AS IS" BASIS,
          WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
          implied, including, without limitation, any warranties or conditions
          of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
          PARTICULAR PURPOSE. You are solely responsible for determining the
          appropriateness of using or redistributing the Work and assume any
          risks associated with Your exercise of permissions under this License.

       8. Limitation of Liability. In no event and under no legal theory,
          whether in tort (including negligence), contract, or otherwise,
          unless required by applicable law (such as deliberate and grossly
          negligent acts) or agreed to in writing, shall any Contributor be
          liable to You for damages, including any direct, indirect, special,
          incidental, or consequential damages of any character arising as a
          result of this License or out of the use or inability to use the
          Work (including but not limited to damages for loss of goodwill,
          work stoppage, computer failure or malfunction, or any and all
          other commercial damages or losses), even if such Contributor
          has been advised of the possibility of such damages.

       9. Accepting Warranty or Additional Liability. While redistributing
          the Work or Derivative Works thereof, You may choose to offer,
          and charge a fee for, acceptance of support, warranty, indemnity,
          or other liability obligations and/or rights consistent with this
          License. However, in accepting such obligations, You may act only
          on Your own behalf and on Your sole responsibility, not on behalf
          of any other Contributor, and only if You agree to indemnify,
          defend, and hold each Contributor harmless for any liability
          incurred by, or claims asserted against, such Contributor by reason
          of your accepting any such warranty or additional liability.

       END OF TERMS AND CONDITIONS

       APPENDIX: How to apply the Apache License to your work.

          To apply the Apache License to your work, attach the following
          boilerplate notice, with the fields enclosed by brackets "{}"
          replaced with your own identifying information. (Don't include
          the brackets!)  The text should be enclosed in the appropriate
          comment syntax for the file format. We also recommend that a
          file or class name and description of purpose be included on the
          same "printed page" as the copyright notice for easier
          identification within third-party archives.

       Copyright 2018-2025 The simdjson authors

       Licensed under the Apache License, Version 2.0 (the "License");
       you may not use this file except in compliance with the License.
       You may obtain a copy of the License at

           http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing, software
       distributed under the License is distributed on an "AS IS" BASIS,
       WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
       See the License for the specific language governing permissions and
       limitations under the License.
  """

- simdutf, located at deps/v8/third_party/simdutf, is licensed as follows:
  """
    Copyright 2021 The simdutf authors

    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    the Software, and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
    FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
    COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
    IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  """

- ada, located at deps/ada, is licensed as follows:
  """
    Copyright 2023 Yagiz Nizipli and Daniel Lemire

    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    the Software, and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
    FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
    COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
    IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  """

- minimatch, located at deps/minimatch, is licensed as follows:
  """
    # Blue Oak Model License

    Version 1.0.0

    ## Purpose

    This license gives everyone as much permission to work with
    this software as possible, while protecting contributors
    from liability.

    ## Acceptance

    In order to receive this license, you must agree to its
    rules. The rules of this license are both obligations
    under that agreement and conditions to your license.
    You must not do anything with this software that triggers
    a rule that you cannot or will not follow.

    ## Copyright

    Each contributor licenses you to do everything with this
    software that would otherwise infringe that contributor's
    copyright in it.

    ## Notices

    You must ensure that everyone who gets a copy of
    any part of this software from you, with or without
    changes, also gets the text of this license or a link to
    <https://blueoakcouncil.org/license/1.0.0>.

    ## Excuse

    If anyone notifies you in writing that you have not
    complied with [Notices](#notices), you can keep your
    license by taking all practical steps to comply within 30
    days after the notice. If you do not do so, your license
    ends immediately.

    ## Patent

    Each contributor licenses you to do everything with this
    software that would otherwise infringe any patent claims
    they can license or become able to license.

    ## Reliability

    No contributor can revoke this license.

    ## No Liability

    **_As far as the law allows, this software comes as is,
    without any warranty or condition, and no contributor
    will be liable to anyone for any damages related to this
    software or this license, under any kind of legal claim._**
  """

- npm, located at deps/npm, is licensed as follows:
  """
    The npm application
    Copyright (c) npm, Inc. and Contributors
    Licensed on the terms of The Artistic License 2.0

    Node package dependencies of the npm application
    Copyright (c) their respective copyright owners
    Licensed on their respective license terms

    The npm public registry at https://registry.npmjs.org
    and the npm website at https://www.npmjs.com
    Operated by npm, Inc.
    Use governed by terms published on https://www.npmjs.com

    "Node.js"
    Trademark Joyent, Inc., https://joyent.com
    Neither npm nor npm, Inc. are affiliated with Joyent, Inc.

    The Node.js application
    Project of Node Foundation, https://nodejs.org

    The npm Logo
    Copyright (c) Mathias Pettersson and Brian Hammond

    "Gubblebum Blocky" typeface
    Copyright (c) Tjarda Koster, https://jelloween.deviantart.com
    Used with permission

    --------

    The Artistic License 2.0

    Copyright (c) 2000-2006, The Perl Foundation.

    Everyone is permitted to copy and distribute verbatim copies
    of this license document, but changing it is not allowed.

    Preamble

    This license establishes the terms under which a given free software
    Package may be copied, modified, distributed, and/or redistributed.
    The intent is that the Copyright Holder maintains some artistic
    control over the development of that Package while still keeping the
    Package available as open source and free software.

    You are always permitted to make arrangements wholly outside of this
    license directly with the Copyright Holder of a given Package.  If the
    terms of this license do not permit the full use that you propose to
    make of the Package, you should contact the Copyright Holder and seek
    a different licensing arrangement.

    Definitions

        "Copyright Holder" means the individual(s) or organization(s)
        named in the copyright notice for the entire Package.

        "Contributor" means any party that has contributed code or other
        material to the Package, in accordance with the Copyright Holder's
        procedures.

        "You" and "your" means any person who would like to copy,
        distribute, or modify the Package.

        "Package" means the collection of files distributed by the
        Copyright Holder, and derivatives of that collection and/or of
        those files. A given Package may consist of either the Standard
        Version, or a Modified Version.

        "Distribute" means providing a copy of the Package or making it
        accessible to anyone else, or in the case of a company or
        organization, to others outside of your company or organization.

        "Distributor Fee" means any fee that you charge for Distributing
        this Package or providing support for this Package to another
        party.  It does not mean licensing fees.

        "Standard Version" refers to the Package if it has not been
        modified, or has been modified only in ways explicitly requested
        by the Copyright Holder.

        "Modified Version" means the Package, if it has been changed, and
        such changes were not explicitly requested by the Copyright
        Holder.

        "Original License" means this Artistic License as Distributed with
        the Standard Version of the Package, in its current version or as
        it may be modified by The Perl Foundation in the future.

        "Source" form means the source code, documentation source, and
        configuration files for the Package.

        "Compiled" form means the compiled bytecode, object code, binary,
        or any other form resulting from mechanical transformation or
        translation of the Source form.

    Permission for Use and Modification Without Distribution

    (1)  You are permitted to use the Standard Version and create and use
    Modified Versions for any purpose without restriction, provided that
    you do not Distribute the Modified Version.

    Permissions for Redistribution of the Standard Version

    (2)  You may Distribute verbatim copies of the Source form of the
    Standard Version of this Package in any medium without restriction,
    either gratis or for a Distributor Fee, provided that you duplicate
    all of the original copyright notices and associated disclaimers.  At
    your discretion, such verbatim copies may or may not include a
    Compiled form of the Package.

    (3)  You may apply any bug fixes, portability changes, and other
    modifications made available from the Copyright Holder.  The resulting
    Package will still be considered the Standard Version, and as such
    will be subject to the Original License.

    Distribution of Modified Versions of the Package as Source

    (4)  You may Distribute your Modified Version as Source (either gratis
    or for a Distributor Fee, and with or without a Compiled form of the
    Modified Version) provided that you clearly document how it differs
    from the Standard Version, including, but not limited to, documenting
    any non-standard features, executables, or modules, and provided that
    you do at least ONE of the following:

        (a)  make the Modified Version available to the Copyright Holder
        of the Standard Version, under the Original License, so that the
        Copyright Holder may include your modifications in the Standard
        Version.

        (b)  ensure that installation of your Modified Version does not
        prevent the user installing or running the Standard Version. In
        addition, the Modified Version must bear a name that is different
        from the name of the Standard Version.

        (c)  allow anyone who receives a copy of the Modified Version to
        make the Source form of the Modified Version available to others
        under

            (i)  the Original License or

            (ii)  a license that permits the licensee to freely copy,
            modify and redistribute the Modified Version using the same
            licensing terms that apply to the copy that the licensee
            received, and requires that the Source form of the Modified
            Version, and of any works derived from it, be made freely
            available in that license fees are prohibited but Distributor
            Fees are allowed.

    Distribution of Compiled Forms of the Standard Version
    or Modified Versions without the Source

    (5)  You may Distribute Compiled forms of the Standard Version without
    the Source, provided that you include complete instructions on how to
    get the Source of the Standard Version.  Such instructions must be
    valid at the time of your distribution.  If these instructions, at any
    time while you are carrying out such distribution, become invalid, you
    must provide new instructions on demand or cease further distribution.
    If you provide valid instructions or cease distribution within thirty
    days after you become aware that the instructions are invalid, then
    you do not forfeit any of your rights under this license.

    (6)  You may Distribute a Modified Version in Compiled form without
    the Source, provided that you comply with Section 4 with respect to
    the Source of the Modified Version.

    Aggregating or Linking the Package

    (7)  You may aggregate the Package (either the Standard Version or
    Modified Version) with other packages and Distribute the resulting
    aggregation provided that you do not charge a licensing fee for the
    Package.  Distributor Fees are permitted, and licensing fees for other
    components in the aggregation are permitted. The terms of this license
    apply to the use and Distribution of the Standard or Modified Versions
    as included in the aggregation.

    (8) You are permitted to link Modified and Standard Versions with
    other works, to embed the Package in a larger work of your own, or to
    build stand-alone binary or bytecode versions of applications that
    include the Package, and Distribute the result without restriction,
    provided the result does not expose a direct interface to the Package.

    Items That are Not Considered Part of a Modified Version

    (9) Works (including, but not limited to, modules and scripts) that
    merely extend or make use of the Package, do not, by themselves, cause
    the Package to be a Modified Version.  In addition, such works are not
    considered parts of the Package itself, and are not subject to the
    terms of this license.

    General Provisions

    (10)  Any use, modification, and distribution of the Standard or
    Modified Versions is governed by this Artistic License. By using,
    modifying or distributing the Package, you accept this license. Do not
    use, modify, or distribute the Package, if you do not accept this
    license.

    (11)  If your Modified Version has been derived from a Modified
    Version made by someone other than you, you are nevertheless required
    to ensure that your Modified Version complies with the requirements of
    this license.

    (12)  This license does not grant you the right to use any trademark,
    service mark, tradename, or logo of the Copyright Holder.

    (13)  This license includes the non-exclusive, worldwide,
    free-of-charge patent license to make, have made, use, offer to sell,
    sell, import and otherwise transfer the Package with respect to any
    patent claims licensable by the Copyright Holder that are necessarily
    infringed by the Package. If you institute patent litigation
    (including a cross-claim or counterclaim) against any party alleging
    that the Package constitutes direct or contributory patent
    infringement, then this Artistic License to you shall terminate on the
    date that such litigation is filed.

    (14)  Disclaimer of Warranty:
    THE PACKAGE IS PROVIDED BY THE COPYRIGHT HOLDER AND CONTRIBUTORS "AS
    IS' AND WITHOUT ANY EXPRESS OR IMPLIED WARRANTIES. THE IMPLIED
    WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
    NON-INFRINGEMENT ARE DISCLAIMED TO THE EXTENT PERMITTED BY YOUR LOCAL
    LAW. UNLESS REQUIRED BY LAW, NO COPYRIGHT HOLDER OR CONTRIBUTOR WILL
    BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
    DAMAGES ARISING IN ANY WAY OUT OF THE USE OF THE PACKAGE, EVEN IF
    ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

    --------
  """

- GYP, located at tools/gyp, is licensed as follows:
  """
    Copyright (c) 2020 Node.js contributors. All rights reserved.
    Copyright (c) 2009 Google Inc. All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are
    met:

       * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
       * Redistributions in binary form must reproduce the above
    copyright notice, this list of conditions and the following disclaimer
    in the documentation and/or other materials provided with the
    distribution.
       * Neither the name of Google Inc. nor the names of its
    contributors may be used to endorse or promote products derived from
    this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
    "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
    LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
    A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
    LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  """

- inspector_protocol, located at deps/inspector_protocol, is licensed as follows:
  """
    // Copyright 2016 The Chromium Authors.
    //
    // Redistribution and use in source and binary forms, with or without
    // modification, are permitted provided that the following conditions are
    // met:
    //
    //    * Redistributions of source code must retain the above copyright
    // notice, this list of conditions and the following disclaimer.
    //    * Redistributions in binary form must reproduce the above
    // copyright notice, this list of conditions and the following disclaimer
    // in the documentation and/or other materials provided with the
    // distribution.
    //    * Neither the name of Google Inc. nor the names of its
    // contributors may be used to endorse or promote products derived from
    // this software without specific prior written permission.
    //
    // THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
    // "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
    // LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
    // A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    // OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    // SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
    // LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    // DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    // THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    // (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    // OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  """

- jinja2, located at tools/inspector_protocol/jinja2, is licensed as follows:
  """
    Copyright (c) 2009 by the Jinja Team, see AUTHORS for more details.

    Some rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are
    met:

        * Redistributions of source code must retain the above copyright
          notice, this list of conditions and the following disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials provided
          with the distribution.

        * The names of the contributors may not be used to endorse or
          promote products derived from this software without specific
          prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
    "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
    LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
    A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
    LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  """

- markupsafe, located at tools/inspector_protocol/markupsafe, is licensed as follows:
  """
    Copyright (c) 2010 by Armin Ronacher and contributors.  See AUTHORS
    for more details.

    Some rights reserved.

    Redistribution and use in source and binary forms of the software as well
    as documentation, with or without modification, are permitted provided
    that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.

    * Redistributions in binary form must reproduce the above
      copyright notice, this list of conditions and the following
      disclaimer in the documentation and/or other materials provided
      with the distribution.

    * The names of the contributors may not be used to endorse or
      promote products derived from this software without specific
      prior written permission.

    THIS SOFTWARE AND DOCUMENTATION IS PROVIDED BY THE COPYRIGHT HOLDERS AND
    CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT
    NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
    A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER
    OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
    EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
    LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
    NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE AND DOCUMENTATION, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
    DAMAGE.
  """

- cpplint.py, located at tools/cpplint.py, is licensed as follows:
  """
    Copyright (c) 2009 Google Inc. All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are
    met:

       * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
       * Redistributions in binary form must reproduce the above
    copyright notice, this list of conditions and the following disclaimer
    in the documentation and/or other materials provided with the
    distribution.
       * Neither the name of Google Inc. nor the names of its
    contributors may be used to endorse or promote products derived from
    this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
    "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
    LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
    A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
    LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  """

- gypi_to_gn.py, located at tools/gypi_to_gn.py, is licensed as follows:
  """
    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are
    met:

       * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
       * Redistributions in binary form must reproduce the above
    copyright notice, this list of conditions and the following disclaimer
    in the documentation and/or other materials provided with the
    distribution.
       * Neither the name of Google LLC nor the names of its
    contributors may be used to endorse or promote products derived from
    this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
    "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
    LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
    A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
    LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  """

- gtest, located at deps/googletest, is licensed as follows:
  """
    Copyright 2008, Google Inc.
    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are
    met:

        * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
        * Redistributions in binary form must reproduce the above
    copyright notice, this list of conditions and the following disclaimer
    in the documentation and/or other materials provided with the
    distribution.
        * Neither the name of Google Inc. nor the names of its
    contributors may be used to endorse or promote products derived from
    this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
    "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
    LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
    A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
    LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  """

- nghttp2, located at deps/nghttp2, is licensed as follows:
  """
    The MIT License

    Copyright (c) 2012, 2014, 2015, 2016 Tatsuhiro Tsujikawa
    Copyright (c) 2012, 2014, 2015, 2016 nghttp2 contributors

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  """

- large_pages, located at src/large_pages, is licensed as follows:
  """
     Copyright (C) 2018 Intel Corporation

     Permission is hereby granted, free of charge, to any person obtaining a copy
     of this software and associated documentation files (the "Software"),
     to deal in the Software without restriction, including without limitation
     the rights to use, copy, modify, merge, publish, distribute, sublicense,
     and/or sell copies of the Software, and to permit persons to whom
     the Software is furnished to do so, subject to the following conditions:

     The above copyright notice and this permission notice shall be included
     in all copies or substantial portions of the Software.

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
     OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
     THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
     OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
     ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
     OR OTHER DEALINGS IN THE SOFTWARE.
  """

- caja, located at lib/internal/freeze_intrinsics.js, is licensed as follows:
  """
     Adapted from SES/Caja - Copyright (C) 2011 Google Inc.
     Copyright (C) 2018 Agoric

     Licensed under the Apache License, Version 2.0 (the "License");
     you may not use this file except in compliance with the License.
     You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

     Unless required by applicable law or agreed to in writing, software
     distributed under the License is distributed on an "AS IS" BASIS,
     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     See the License for the specific language governing permissions and
     limitations under the License.
  """

- brotli, located at deps/brotli, is licensed as follows:
  """
    Copyright (c) 2009, 2010, 2013-2016 by the Brotli Authors.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
  """

- zstd, located at deps/zstd, is licensed as follows:
  """
    BSD License

    For Zstandard software

    Copyright (c) Meta Platforms, Inc. and affiliates. All rights reserved.

    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:

     * Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.

     * Redistributions in binary form must reproduce the above copyright notice,
       this list of conditions and the following disclaimer in the documentation
       and/or other materials provided with the distribution.

     * Neither the name Facebook, nor Meta, nor the names of its contributors may
       be used to endorse or promote products derived from this software without
       specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
    ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
    WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
    ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
    ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  """

- HdrHistogram, located at deps/histogram, is licensed as follows:
  """
    The code in this repository code was Written by Gil Tene, Michael Barker,
    and Matt Warren, and released to the public domain, as explained at
    http://creativecommons.org/publicdomain/zero/1.0/

    For users of this code who wish to consume it under the "BSD" license
    rather than under the public domain or CC0 contribution text mentioned
    above, the code found under this directory is *also* provided under the
    following license (commonly referred to as the BSD 2-Clause License). This
    license does not detract from the above stated release of the code into
    the public domain, and simply represents an additional license granted by
    the Author.

    -----------------------------------------------------------------------------
    ** Beginning of "BSD 2-Clause License" text. **

     Copyright (c) 2012, 2013, 2014 Gil Tene
     Copyright (c) 2014 Michael Barker
     Copyright (c) 2014 Matt Warren
     All rights reserved.

     Redistribution and use in source and binary forms, with or without
     modification, are permitted provided that the following conditions are met:

     1. Redistributions of source code must retain the above copyright notice,
        this list of conditions and the following disclaimer.

     2. Redistributions in binary form must reproduce the above copyright notice,
        this list of conditions and the following disclaimer in the documentation
        and/or other materials provided with the distribution.

     THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
     ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
     LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
     CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
     SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
     INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
     CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
     ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
     THE POSSIBILITY OF SUCH DAMAGE.
  """

- node-heapdump, located at src/heap_utils.cc, is licensed as follows:
  """
    ISC License

    Copyright (c) 2012, Ben Noordhuis <info@bnoordhuis.nl>

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted, provided that the above
    copyright notice and this permission notice appear in all copies.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
    WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
    MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
    ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
    WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
    ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
    OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

    === src/compat.h src/compat-inl.h ===

    ISC License

    Copyright (c) 2014, StrongLoop Inc.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted, provided that the above
    copyright notice and this permission notice appear in all copies.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
    WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
    MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
    ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
    WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
    ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
    OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
  """

- rimraf, located at lib/internal/fs/rimraf.js, is licensed as follows:
  """
    The ISC License

    Copyright (c) Isaac Z. Schlueter and Contributors

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted, provided that the above
    copyright notice and this permission notice appear in all copies.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
    WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
    MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
    ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
    WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
    ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
    IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
  """

- uvwasi, located at deps/uvwasi, is licensed as follows:
  """
    MIT License

    Copyright (c) 2019 Colin Ihrig and Contributors

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  """

- ngtcp2, located at deps/ngtcp2/ngtcp2/, is licensed as follows:
  """
    The MIT License

    Copyright (c) 2016 ngtcp2 contributors

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  """

- nghttp3, located at deps/ngtcp2/nghttp3/, is licensed as follows:
  """
    The MIT License

    Copyright (c) 2019 nghttp3 contributors

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  """

- node-fs-extra, located at lib/internal/fs/cp, is licensed as follows:
  """
    (The MIT License)

    Copyright (c) 2011-2017 JP Richardson

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
    (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify,
     merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
     furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
    WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
    OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
     ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  """

- on-exit-leak-free, located at lib/internal/process/finalization, is licensed as follows:
  """
    MIT License

    Copyright (c) 2021 Matteo Collina

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  """

- sonic-boom, located at lib/internal/streams/fast-utf8-stream.js, is licensed as follows:
  """
    MIT License

    Copyright (c) 2017 Matteo Collina

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  """
~~~~
<!-- drittlizenzen-erzeugen:lizenztexte:ende -->
