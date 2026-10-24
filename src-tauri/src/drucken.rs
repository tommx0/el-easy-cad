#[tauri::command]
pub fn drucken(fenster: tauri::WebviewWindow, breite_mm: f64, hoehe_mm: f64) -> Result<(), String> {
    if !(breite_mm > 0.0 && hoehe_mm > 0.0) {
        return Err(format!(
            "Ungueltige Papiergroesse {breite_mm} x {hoehe_mm} mm"
        ));
    }
    #[cfg(target_os = "macos")]
    {
        fenster
            .with_webview(move |webview| unsafe {
                mac::drucke(webview.inner(), breite_mm, hoehe_mm)
            })
            .map_err(|fehler| fehler.to_string())
    }
    #[cfg(not(target_os = "macos"))]
    {
        fenster.print().map_err(|fehler| fehler.to_string())
    }
}

#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
fn mm_zu_punkt(mm: f64) -> f64 {
    mm / 25.4 * 72.0
}

#[cfg(target_os = "macos")]
mod mac {
    use objc2::msg_send;
    use objc2::rc::Retained;
    use objc2_app_kit::{NSPaperOrientation, NSPrintInfo};
    use objc2_foundation::NSSize;
    use objc2_web_kit::WKWebView;

    use super::mm_zu_punkt;

    pub unsafe fn drucke(webview: *mut std::ffi::c_void, breite_mm: f64, hoehe_mm: f64) {
        let Some(webview) = (webview as *const WKWebView).as_ref() else {
            return;
        };
        let geteilt = NSPrintInfo::sharedPrintInfo();
        let info: Retained<NSPrintInfo> = msg_send![&*geteilt, copy];

        let quer = breite_mm > hoehe_mm;
        let kurz = mm_zu_punkt(breite_mm.min(hoehe_mm));
        let lang = mm_zu_punkt(breite_mm.max(hoehe_mm));
        info.setPaperSize(NSSize::new(kurz, lang));
        info.setOrientation(if quer {
            NSPaperOrientation::Landscape
        } else {
            NSPaperOrientation::Portrait
        });
        let ist = info.paperSize();
        if (ist.width > ist.height) != quer {
            info.setPaperSize(if quer {
                NSSize::new(lang, kurz)
            } else {
                NSSize::new(kurz, lang)
            });
        }
        info.setTopMargin(0.0);
        info.setBottomMargin(0.0);
        info.setLeftMargin(0.0);
        info.setRightMargin(0.0);

        let operation = webview.printOperationWithPrintInfo(&info);
        operation.setCanSpawnSeparateThread(true);
        let Some(fenster) = webview.window() else {
            return;
        };
        operation.runOperationModalForWindow_delegate_didRunSelector_contextInfo(
            &fenster,
            None,
            None,
            std::ptr::null_mut(),
        );
    }
}
