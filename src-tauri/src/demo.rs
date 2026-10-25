use keyring::Entry;

const KEYRING_DIENST: &str = "de.eleasycad.community";
const KEYRING_KONTO: &str = "demo-start";

fn keyring_eintrag() -> Result<Entry, String> {
    Entry::new(KEYRING_DIENST, KEYRING_KONTO)
        .map_err(|fehler| format!("Schluesselbund nicht erreichbar: {fehler}"))
}

fn civil_from_days(z: i64) -> (i64, u32, u32) {
    let z = z + 719468;
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

fn days_from_civil(y: i64, m: u32, d: u32) -> i64 {
    let y = if m <= 2 { y - 1 } else { y };
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = (y - era * 400) as u64;
    let doy = (153 * (if m > 2 { m - 3 } else { m + 9 }) as u64 + 2) / 5 + d as u64 - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146097 + doe as i64 - 719468
}

pub(crate) fn heutige_epoch_tage() -> i64 {
    let sekunden = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    (sekunden / 86400) as i64
}

pub(crate) fn epoch_tage_aus_iso(iso: &str) -> Option<i64> {
    let teile: Vec<&str> = iso.split('-').collect();
    let [jahr_text, monat_text, tag_text] = teile[..] else {
        return None;
    };
    let jahr: i64 = jahr_text.parse().ok()?;
    let monat: u32 = monat_text.parse().ok()?;
    let tag: u32 = tag_text.parse().ok()?;
    if !(1..=12).contains(&monat) || !(1..=31).contains(&tag) {
        return None;
    }
    Some(days_from_civil(jahr, monat, tag))
}

fn heutiges_datum_utc() -> String {
    let (jahr, monat, tag) = civil_from_days(heutige_epoch_tage());
    format!("{jahr:04}-{monat:02}-{tag:02}")
}

pub fn demo_start_datum_ermitteln() -> String {
    match keyring_eintrag() {
        Ok(eintrag) => match eintrag.get_password() {
            Ok(datum) => datum,
            Err(_) => {
                let heute = heutiges_datum_utc();
                let _ = eintrag.set_password(&heute);
                heute
            }
        },
        Err(_) => heutiges_datum_utc(),
    }
}
