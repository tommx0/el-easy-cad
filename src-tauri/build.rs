fn main() {
    let attribute =
        tauri_build::Attributes::new().app_manifest(tauri_build::AppManifest::new().commands(&[
            "programm_beenden",
            "programm_neu_starten",
            "drucken",
        ]));
    tauri_build::try_build(attribute).expect("Fehler beim Ausfuehren von tauri-build")
}
