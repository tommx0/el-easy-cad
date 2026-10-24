use base64::Engine;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use serde_json::Value;
use std::fs;
use std::path::Path;

use crate::demo::{epoch_tage_aus_iso, heutige_epoch_tage};

const OEFFENTLICHER_SCHLUESSEL: [u8; 32] = [
    0xd9, 0x03, 0x5b, 0xed, 0x1b, 0xe6, 0x7a, 0xc9, 0x8e, 0xfb, 0x01, 0x43, 0x03, 0x38, 0x55, 0x2e,
    0xc6, 0xc9, 0x99, 0xec, 0x97, 0x7b, 0x3b, 0x7d, 0xd9, 0x8a, 0xab, 0x8b, 0x33, 0x33, 0x56, 0x55,
];

const DEMO_DAUER_TAGE: i64 = 30;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Zugriffserlaubnis {
    Erlaubt,
    Gesperrt,
}

fn kanonisches_json(wert: &Value) -> String {
    match wert {
        Value::Array(elemente) => {
            let teile: Vec<String> = elemente.iter().map(kanonisches_json).collect();
            format!("[{}]", teile.join(","))
        }
        Value::Object(map) => {
            let mut schluessel: Vec<&String> = map.keys().collect();
            schluessel.sort();
            let teile: Vec<String> = schluessel
                .iter()
                .map(|k| {
                    format!(
                        "{}:{}",
                        Value::String((*k).clone()),
                        kanonisches_json(&map[*k])
                    )
                })
                .collect();
            format!("{{{}}}", teile.join(","))
        }
        _ => wert.to_string(),
    }
}

fn signatur_gueltig(daten: &Value) -> bool {
    let Some(objekt) = daten.as_object() else {
        return false;
    };
    if objekt.get("formatVersion").and_then(Value::as_i64) != Some(1) {
        return false;
    }
    if !objekt.get("lizenznehmer").is_some_and(Value::is_string) {
        return false;
    }
    if !objekt.get("gueltigAb").is_some_and(Value::is_string) {
        return false;
    }
    if !objekt.get("gueltigBis").is_some_and(Value::is_string) {
        return false;
    }
    if !objekt.get("zusatz").is_some_and(Value::is_object) {
        return false;
    }
    let Some(signatur_base64) = objekt.get("signatur").and_then(Value::as_str) else {
        return false;
    };

    let mut ohne_signatur = objekt.clone();
    ohne_signatur.remove("signatur");
    let signierte_daten = kanonisches_json(&Value::Object(ohne_signatur));

    let Ok(signatur_bytes) = base64::engine::general_purpose::STANDARD.decode(signatur_base64)
    else {
        return false;
    };
    let Ok(signatur_array) = <[u8; 64]>::try_from(signatur_bytes.as_slice()) else {
        return false;
    };
    let signatur = Signature::from_bytes(&signatur_array);
    let Ok(schluessel) = VerifyingKey::from_bytes(&OEFFENTLICHER_SCHLUESSEL) else {
        return false;
    };
    schluessel
        .verify(signierte_daten.as_bytes(), &signatur)
        .is_ok()
}

fn datum_im_bereich(objekt: &serde_json::Map<String, Value>, heute_iso: &str) -> bool {
    let gueltig_ab = objekt
        .get("gueltigAb")
        .and_then(Value::as_str)
        .unwrap_or("");
    let gueltig_bis = objekt
        .get("gueltigBis")
        .and_then(Value::as_str)
        .unwrap_or("");
    heute_iso >= gueltig_ab && heute_iso <= gueltig_bis
}

fn heute_iso() -> String {
    let tage = heutige_epoch_tage();
    epoch_tage_zu_iso(tage)
}

fn epoch_tage_zu_iso(tage: i64) -> String {
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
    format!("{y:04}-{m:02}-{d:02}")
}

fn lese_lizenzdatei(datenordner: &Path) -> Option<Value> {
    let inhalt = fs::read_to_string(datenordner.join("lizenz.json")).ok()?;
    serde_json::from_str(&inhalt).ok()
}

pub(crate) fn pruefe_zugriffserlaubnis(datenordner: &Path, demo_start: &str) -> Zugriffserlaubnis {
    let heute_iso = heute_iso();

    match lese_lizenzdatei(datenordner) {
        Some(daten) => {
            let Some(objekt) = daten.as_object() else {
                return Zugriffserlaubnis::Gesperrt;
            };
            if signatur_gueltig(&daten) && datum_im_bereich(objekt, &heute_iso) {
                Zugriffserlaubnis::Erlaubt
            } else {
                Zugriffserlaubnis::Gesperrt
            }
        }
        None => {
            let Some(start_tage) = epoch_tage_aus_iso(demo_start) else {
                return Zugriffserlaubnis::Erlaubt;
            };
            let vergangene_tage = heutige_epoch_tage() - start_tage;
            if vergangene_tage < DEMO_DAUER_TAGE {
                Zugriffserlaubnis::Erlaubt
            } else {
                Zugriffserlaubnis::Gesperrt
            }
        }
    }
}
