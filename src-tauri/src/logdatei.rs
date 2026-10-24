use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Manager};

const MAX_GROESSE_BYTES: u64 = 20 * 1024 * 1024;

fn logdatei_pfad(app: &AppHandle) -> Option<PathBuf> {
    let ordner = app.path().home_dir().ok()?.join("el.easy.CAD Community");
    Some(ordner.join("sidecar.log"))
}

pub fn bereite_vor(app: &AppHandle) {
    let Some(pfad) = logdatei_pfad(app) else {
        return;
    };
    if let Some(ordner) = pfad.parent() {
        let _ = fs::create_dir_all(ordner);
    }
    if let Ok(metadaten) = fs::metadata(&pfad) {
        if metadaten.len() > MAX_GROESSE_BYTES {
            let _ = fs::write(&pfad, []);
        }
    }
}

fn civil_from_days(tage: i64) -> (i64, u32, u32) {
    let z = tage + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = (z - era * 146097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}

fn jetzt_iso() -> String {
    let sekunden = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|dauer| dauer.as_secs())
        .unwrap_or(0);
    let tage = (sekunden / 86400) as i64;
    let tagessekunden = sekunden % 86400;
    let (jahr, monat, tag) = civil_from_days(tage);
    let stunde = tagessekunden / 3600;
    let minute = (tagessekunden % 3600) / 60;
    let sekunde = tagessekunden % 60;
    format!("{jahr:04}-{monat:02}-{tag:02}T{stunde:02}:{minute:02}:{sekunde:02}Z")
}

pub fn schreibe(app: &AppHandle, zeile: &str) {
    let Some(pfad) = logdatei_pfad(app) else {
        return;
    };
    let Ok(mut datei) = OpenOptions::new().create(true).append(true).open(&pfad) else {
        return;
    };
    let _ = writeln!(datei, "[{}] {zeile}", jetzt_iso());
}
