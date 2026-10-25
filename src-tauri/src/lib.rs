use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

mod demo;
mod drucken;
mod logdatei;
mod produktlizenz;

const PORT: u16 = 4747;

struct SidecarZustand {
    kind: Mutex<Option<CommandChild>>,
    ausgabe: Mutex<Vec<String>>,
}

const MAX_AUSGABE_ZEILEN: usize = 200;

fn status_url() -> String {
    format!("http://127.0.0.1:{PORT}/api/status")
}

fn haupt_url() -> String {
    format!("http://127.0.0.1:{PORT}/")
}

const SPLASH_LABEL: &str = "splash";

async fn ist_server_erreichbar() -> bool {
    match reqwest::Client::new()
        .get(status_url())
        .timeout(Duration::from_millis(500))
        .send()
        .await
    {
        Ok(antwort) => antwort.status().is_success(),
        Err(_) => false,
    }
}

#[derive(Debug, Clone, PartialEq)]
enum PortBefund {
    Frei,
    FremdesProgramm,
    ElEasyCad { version: String, oberflaeche: bool },
}

#[derive(Debug, PartialEq)]
enum StartEntscheidung {
    SidecarStarten,
    Andocken,
    Abbrechen(String),
}

fn entscheide_start(befund: &PortBefund, eigene_version: &str) -> StartEntscheidung {
    match befund {
        PortBefund::Frei => StartEntscheidung::SidecarStarten,
        PortBefund::FremdesProgramm => StartEntscheidung::Abbrechen(format!(
            "Port {PORT} wird von einem anderen Programm belegt. el.easy.CAD braucht diesen Port \
             für seinen Begleitserver.\n\nBitte beenden Sie das andere Programm oder starten \
             Sie den Rechner neu."
        )),
        PortBefund::ElEasyCad {
            oberflaeche: false, ..
        } => StartEntscheidung::Abbrechen(format!(
            "Auf diesem Rechner läuft bereits ein el.easy.CAD-Entwicklungsserver (pnpm dev) auf \
             Port {PORT}.\n\nBitte beenden Sie ihn und starten Sie el.easy.CAD erneut."
        )),
        PortBefund::ElEasyCad { version, .. } if version != eigene_version => {
            StartEntscheidung::Abbrechen(format!(
                "el.easy.CAD {version} läuft bereits auf diesem Rechner.\n\nBitte schließen Sie \
                 diese Version und starten Sie el.easy.CAD {eigene_version} erneut."
            ))
        }
        PortBefund::ElEasyCad { .. } => StartEntscheidung::Andocken,
    }
}

fn status_auswerten(text: &str) -> Option<(String, Option<bool>)> {
    let wert: serde_json::Value = serde_json::from_str(text).ok()?;
    if wert.get("name")?.as_str()? != "el.easy.CAD" {
        return None;
    }
    let version = wert.get("version")?.as_str()?.to_string();
    Some((version, wert.get("oberflaeche").and_then(|o| o.as_bool())))
}

async fn liefert_oberflaeche(client: &reqwest::Client) -> bool {
    match client
        .get(haupt_url())
        .timeout(Duration::from_millis(800))
        .send()
        .await
    {
        Ok(antwort) => {
            antwort.status().is_success()
                && antwort
                    .headers()
                    .get(reqwest::header::CONTENT_TYPE)
                    .and_then(|typ| typ.to_str().ok())
                    .is_some_and(|typ| typ.contains("text/html"))
        }
        Err(_) => false,
    }
}

async fn ermittle_port_befund() -> PortBefund {
    let client = reqwest::Client::new();
    match client
        .get(status_url())
        .timeout(Duration::from_millis(800))
        .send()
        .await
    {
        Ok(antwort) if antwort.status().is_success() => {
            let text = antwort.text().await.unwrap_or_default();
            match status_auswerten(&text) {
                Some((version, Some(oberflaeche))) => PortBefund::ElEasyCad {
                    version,
                    oberflaeche,
                },
                Some((version, None)) => PortBefund::ElEasyCad {
                    version,
                    oberflaeche: liefert_oberflaeche(&client).await,
                },
                None => PortBefund::FremdesProgramm,
            }
        }
        Ok(_) => PortBefund::FremdesProgramm,
        Err(_) => {
            let adresse = std::net::SocketAddr::from(([127, 0, 0, 1], PORT));
            if std::net::TcpStream::connect_timeout(&adresse, Duration::from_millis(300)).is_ok() {
                PortBefund::FremdesProgramm
            } else {
                PortBefund::Frei
            }
        }
    }
}

async fn warte_auf_bereitschaft(max_versuche: u32) -> bool {
    for _ in 0..max_versuche {
        if ist_server_erreichbar().await {
            return true;
        }
        tokio::time::sleep(Duration::from_millis(300)).await;
    }
    false
}

fn zeige_fehler_und_beende(app: &AppHandle, text: &str) {
    logdatei::schreibe(app, &format!("[fehler] {text}"));
    schliesse_splashfenster(app);
    app.dialog()
        .message(text)
        .title("el.easy.CAD - Fehler beim Start")
        .kind(MessageDialogKind::Error)
        .blocking_show();
    app.exit(1);
}

fn oeffne_splashfenster(app: &AppHandle) -> tauri::Result<()> {
    WebviewWindowBuilder::new(
        app,
        SPLASH_LABEL,
        WebviewUrl::App("splashscreen.html".into()),
    )
    .title("el.easy.CAD Community wird gestartet …")
    .inner_size(360.0, 280.0)
    .resizable(false)
    .decorations(false)
    .shadow(true)
    .center()
    .build()?;
    Ok(())
}

fn schliesse_splashfenster(app: &AppHandle) {
    if let Some(fenster) = app.get_webview_window(SPLASH_LABEL) {
        let _ = fenster.close();
    }
}

fn oeffne_hauptfenster(app: &AppHandle) -> tauri::Result<()> {
    WebviewWindowBuilder::new(
        app,
        "haupt",
        WebviewUrl::External(haupt_url().parse().expect("feste URL ist immer gueltig")),
    )
    .title("el.easy.CAD Community – © 2026 Thomas Marx")
    .theme(Some(tauri::Theme::Light))
    .inner_size(1400.0, 900.0)
    .min_inner_size(900.0, 600.0)
    .devtools(cfg!(debug_assertions))
    .disable_drag_drop_handler()
    .build()?;
    Ok(())
}

fn ohne_verbatim_praefix(pfad: &std::path::Path) -> String {
    let text = pfad.to_string_lossy().to_string();
    text.strip_prefix(r"\\?\")
        .map(str::to_string)
        .unwrap_or(text)
}

fn starte_begleitserver(handle: &AppHandle) -> Result<CommandChild, String> {
    let ressourcen = handle
        .path()
        .resource_dir()
        .map_err(|fehler| format!("Ressourcenverzeichnis nicht gefunden: {fehler}"))?;
    let server_datei_pfad = ressourcen.join("server.cjs");
    let statisch_verzeichnis_pfad = ressourcen.join("dist");
    let server_datei = ohne_verbatim_praefix(&server_datei_pfad);
    let statisch_verzeichnis = ohne_verbatim_praefix(&statisch_verzeichnis_pfad);

    if !server_datei_pfad.is_file() {
        return Err(format!(
            "server.cjs nicht gefunden - erwartet unter: {server_datei} \
             (Ressourcenverzeichnis: {})",
            ressourcen.display()
        ));
    }

    let demo_start = demo::demo_start_datum_ermitteln();

    let (mut rx, kind) = handle
        .shell()
        .sidecar("node")
        .map_err(|fehler| format!("Sidecar 'node' nicht im Bundle gefunden: {fehler}"))?
        .current_dir(&ressourcen)
        .args([server_datei.clone()])
        .env("EL_EASY_CAD_STATISCH", statisch_verzeichnis.clone())
        .env("EL_EASY_CAD_DEMO_START", demo_start)
        .env("EL_EASY_CAD_ENTWICKLUNGSLIZENZ", "")
        .spawn()
        .map_err(|fehler| {
            format!(
                "Begleitserver konnte nicht gestartet werden: {fehler}\n\
                 (Sidecar-Argument: {server_datei}, EL_EASY_CAD_STATISCH: {statisch_verzeichnis})"
            )
        })?;

    let start_zeile = format!(
        "[start] node.exe {server_datei} (cwd={}, EL_EASY_CAD_STATISCH={statisch_verzeichnis})",
        ressourcen.display()
    );
    handle
        .state::<SidecarZustand>()
        .ausgabe
        .lock()
        .unwrap()
        .push(start_zeile.clone());
    logdatei::schreibe(handle, &start_zeile);

    let handle_fuer_ausgabe = handle.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(ereignis) = rx.recv().await {
            let zeile = match ereignis {
                CommandEvent::Stdout(bytes) => {
                    format!("[stdout] {}", String::from_utf8_lossy(&bytes))
                }
                CommandEvent::Stderr(bytes) => {
                    format!("[stderr] {}", String::from_utf8_lossy(&bytes))
                }
                CommandEvent::Error(text) => format!("[fehler] {text}"),
                CommandEvent::Terminated(payload) => {
                    format!(
                        "[beendet] code={:?} signal={:?}",
                        payload.code, payload.signal
                    )
                }
                _ => continue,
            };
            logdatei::schreibe(&handle_fuer_ausgabe, &zeile);
            let zustand = handle_fuer_ausgabe.state::<SidecarZustand>();
            let mut ausgabe = zustand.ausgabe.lock().unwrap();
            ausgabe.push(zeile);
            if ausgabe.len() > MAX_AUSGABE_ZEILEN {
                ausgabe.remove(0);
            }
        }
    });

    Ok(kind)
}

const LIZENZ_WAECHTER_INTERVALL: Duration = Duration::from_secs(5 * 60);
const LIZENZ_WAECHTER_SCHWELLE: u32 = 2;

async fn server_antwortet_ohne_sperre() -> bool {
    match reqwest::Client::new()
        .get(format!("http://127.0.0.1:{PORT}/api/kunden"))
        .timeout(Duration::from_secs(3))
        .send()
        .await
    {
        Ok(antwort) => antwort.status() != reqwest::StatusCode::FORBIDDEN,
        Err(_) => false,
    }
}

async fn lizenz_waechter(handle: AppHandle) {
    let mut fehlschlaege = 0u32;
    let mut intervall = tokio::time::interval(LIZENZ_WAECHTER_INTERVALL);
    intervall.tick().await;
    loop {
        intervall.tick().await;

        let laeuft_eigener_sidecar = handle
            .state::<SidecarZustand>()
            .kind
            .lock()
            .unwrap()
            .is_some();
        if !laeuft_eigener_sidecar {
            continue;
        }

        let Ok(datenordner) = handle
            .path()
            .home_dir()
            .map(|h| h.join("el.easy.CAD Community"))
        else {
            continue;
        };
        let demo_start = demo::demo_start_datum_ermitteln();
        let erlaubnis = produktlizenz::pruefe_zugriffserlaubnis(&datenordner, &demo_start);

        if erlaubnis == produktlizenz::Zugriffserlaubnis::Erlaubt {
            fehlschlaege = 0;
            continue;
        }

        if server_antwortet_ohne_sperre().await {
            fehlschlaege += 1;
        } else {
            fehlschlaege = 0;
        }

        if fehlschlaege >= LIZENZ_WAECHTER_SCHWELLE {
            logdatei::schreibe(
                &handle,
                "[lizenz-waechter] Begleitserver antwortet trotz erwarteter Sperre - beende Sidecar",
            );
            if let Some(kind) = handle.state::<SidecarZustand>().kind.lock().unwrap().take() {
                let _ = kind.kill();
            }
            return;
        }
    }
}

#[tauri::command]
fn programm_beenden(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn programm_neu_starten(app: AppHandle) {
    if let Some(kind) = app.state::<SidecarZustand>().kind.lock().unwrap().take() {
        logdatei::schreibe(&app, "[app] Neustart nach Lizenz-Import, stoppe Sidecar");
        let _ = kind.kill();
    }
    tauri::process::restart(&app.env());
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(fenster) = app.get_webview_window("haupt") {
                let _ = fenster.set_focus();
                let _ = fenster.emit("eula-erneut-oeffnen", ());
            }
        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            programm_beenden,
            programm_neu_starten,
            drucken::drucken
        ])
        .manage(SidecarZustand {
            kind: Mutex::new(None),
            ausgabe: Mutex::new(Vec::new()),
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let handle = app.handle().clone();
            logdatei::bereite_vor(&handle);
            logdatei::schreibe(
                &handle,
                &format!("[app] Start Version {}", app.package_info().version),
            );

            let ueber_metadaten = tauri::menu::AboutMetadata {
                name: Some(app.package_info().name.clone()),
                version: Some(app.package_info().version.to_string()),
                copyright: Some("© 2026 Thomas Marx".into()),
                credits: Some("github.com/tommx0/el-easy-cad".into()),
                ..Default::default()
            };
            let fenster_menu = tauri::menu::Submenu::with_id_and_items(
                &handle,
                tauri::menu::WINDOW_SUBMENU_ID,
                "Window",
                true,
                &[
                    &tauri::menu::PredefinedMenuItem::minimize(&handle, None)?,
                    &tauri::menu::PredefinedMenuItem::maximize(&handle, None)?,
                    #[cfg(target_os = "macos")]
                    &tauri::menu::PredefinedMenuItem::separator(&handle)?,
                    &tauri::menu::PredefinedMenuItem::close_window(&handle, None)?,
                ],
            )?;
            let hilfe_menu = tauri::menu::Submenu::with_id_and_items(
                &handle,
                tauri::menu::HELP_SUBMENU_ID,
                "Help",
                true,
                &[
                    #[cfg(not(target_os = "macos"))]
                    &tauri::menu::PredefinedMenuItem::about(&handle, None, Some(ueber_metadaten))?,
                ],
            )?;
            let menu = tauri::menu::Menu::with_items(
                &handle,
                &[
                    #[cfg(target_os = "macos")]
                    &tauri::menu::Submenu::with_items(
                        &handle,
                        app.package_info().name.clone(),
                        true,
                        &[
                            &tauri::menu::PredefinedMenuItem::about(
                                &handle,
                                None,
                                Some(ueber_metadaten),
                            )?,
                            &tauri::menu::PredefinedMenuItem::separator(&handle)?,
                            &tauri::menu::PredefinedMenuItem::services(&handle, None)?,
                            &tauri::menu::PredefinedMenuItem::separator(&handle)?,
                            &tauri::menu::PredefinedMenuItem::hide(&handle, None)?,
                            &tauri::menu::PredefinedMenuItem::hide_others(&handle, None)?,
                            &tauri::menu::PredefinedMenuItem::separator(&handle)?,
                            &tauri::menu::PredefinedMenuItem::quit(&handle, None)?,
                        ],
                    )?,
                    #[cfg(not(any(
                        target_os = "linux",
                        target_os = "dragonfly",
                        target_os = "freebsd",
                        target_os = "netbsd",
                        target_os = "openbsd"
                    )))]
                    &tauri::menu::Submenu::with_items(
                        &handle,
                        "File",
                        true,
                        &[
                            &tauri::menu::PredefinedMenuItem::close_window(&handle, None)?,
                            #[cfg(not(target_os = "macos"))]
                            &tauri::menu::PredefinedMenuItem::quit(&handle, None)?,
                        ],
                    )?,
                    &tauri::menu::Submenu::with_items(
                        &handle,
                        "Edit",
                        true,
                        &[
                            &tauri::menu::PredefinedMenuItem::undo(&handle, None)?,
                            &tauri::menu::PredefinedMenuItem::redo(&handle, None)?,
                            &tauri::menu::PredefinedMenuItem::separator(&handle)?,
                            &tauri::menu::PredefinedMenuItem::cut(&handle, None)?,
                            &tauri::menu::PredefinedMenuItem::copy(&handle, None)?,
                            &tauri::menu::PredefinedMenuItem::paste(&handle, None)?,
                            &tauri::menu::PredefinedMenuItem::select_all(&handle, None)?,
                        ],
                    )?,
                    #[cfg(target_os = "macos")]
                    &tauri::menu::Submenu::with_items(
                        &handle,
                        "View",
                        true,
                        &[&tauri::menu::PredefinedMenuItem::fullscreen(&handle, None)?],
                    )?,
                    &fenster_menu,
                    &hilfe_menu,
                ],
            )?;
            handle.set_menu(menu)?;

            if let Err(fehler) = oeffne_splashfenster(&handle) {
                log::warn!("Splashfenster konnte nicht geoeffnet werden: {fehler}");
            }

            tauri::async_runtime::spawn(async move {
                let befund = ermittle_port_befund().await;
                let eigene_version = handle.package_info().version.to_string();
                logdatei::schreibe(&handle, &format!("[app] Port {PORT}: {befund:?}"));
                match entscheide_start(&befund, &eigene_version) {
                    StartEntscheidung::Andocken => {
                        logdatei::schreibe(
                            &handle,
                            "[app] Begleitserver laeuft bereits, docke nur an",
                        );
                    }
                    StartEntscheidung::Abbrechen(meldung) => {
                        zeige_fehler_und_beende(&handle, &meldung);
                        return;
                    }
                    StartEntscheidung::SidecarStarten => match starte_begleitserver(&handle) {
                        Ok(kind) => {
                            *handle.state::<SidecarZustand>().kind.lock().unwrap() = Some(kind);
                        }
                        Err(fehlertext) => {
                            zeige_fehler_und_beende(&handle, &fehlertext);
                            return;
                        }
                    },
                }

                if warte_auf_bereitschaft(50).await {
                    if let Err(fehler) = oeffne_hauptfenster(&handle) {
                        zeige_fehler_und_beende(
                            &handle,
                            &format!("Hauptfenster konnte nicht erzeugt werden: {fehler}"),
                        );
                    } else {
                        logdatei::schreibe(
                            &handle,
                            "[app] Begleitserver bereit, oeffne Hauptfenster",
                        );
                        schliesse_splashfenster(&handle);
                        tauri::async_runtime::spawn(lizenz_waechter(handle.clone()));
                    }
                } else {
                    let ausgabe = handle
                        .state::<SidecarZustand>()
                        .ausgabe
                        .lock()
                        .unwrap()
                        .join("\n");
                    zeige_fehler_und_beende(
                        &handle,
                        &format!(
                            "el.easy.CAD konnte seinen Begleitserver nicht starten \
                             ({} antwortet nicht).\n\n\
                             Das hilft in der Regel:\n\
                             - el.easy.CAD neu starten\n\
                             - pruefen, ob ein Virenschutz- oder Firewall-Programm die \
                             Verbindung zu 127.0.0.1 blockiert, und el.easy.CAD dort als \
                             Ausnahme zulassen\n\
                             - den Rechner neu starten, falls ein alter Prozess auf Port {PORT} \
                             haengen geblieben ist\n\n\
                             Technische Ausgabe des Begleitservers:\n{}",
                            status_url(),
                            if ausgabe.is_empty() {
                                "(keine)"
                            } else {
                                &ausgabe
                            }
                        ),
                    );
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Fehler beim Erzeugen der Tauri-App")
        .run(|app_handle, event| {
            if matches!(
                event,
                tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit
            ) {
                if let Some(kind) = app_handle
                    .state::<SidecarZustand>()
                    .kind
                    .lock()
                    .unwrap()
                    .take()
                {
                    logdatei::schreibe(app_handle, "[app] Beende, stoppe Sidecar");
                    let _ = kind.kill();
                } else {
                    logdatei::schreibe(app_handle, "[app] Beende");
                }
            }
        });
}
