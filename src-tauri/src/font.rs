use std::fs;

#[tauri::command]
pub fn get_system_fonts() -> Result<Vec<String>, String> {
    let mut fonts = Vec::new();

    if let Ok(font_dir) = fs::read_dir("C:\\Windows\\Fonts") {
        for entry in font_dir.flatten() {
            if let Some(file_name) = entry.file_name().to_str() {
                let lower = file_name.to_lowercase();
                if lower.ends_with(".ttf")
                    || lower.ends_with(".ttc")
                    || lower.ends_with(".otf")
                    || lower.ends_with(".fon")
                {
                    let font_name = remove_font_extension(file_name);
                    if !font_name.is_empty() && !fonts.contains(&font_name) {
                        fonts.push(font_name);
                    }
                }
            }
        }
    }

    let hkcu = winreg::RegKey::predef(winreg::enums::HKEY_CURRENT_USER);
    if let Ok(software) = hkcu.open_subkey("Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts")
    {
        for result in software.enum_values().flatten() {
            let (name, _) = result;
            if !fonts.contains(&name) {
                fonts.push(name);
            }
        }
    }

    let hkcu = winreg::RegKey::predef(winreg::enums::HKEY_CURRENT_USER);
    if let Ok(software) = hkcu.open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Fonts") {
        for result in software.enum_values().flatten() {
            let (name, _) = result;
            if !fonts.contains(&name) {
                fonts.push(name);
            }
        }
    }

    fonts.sort();
    Ok(fonts)
}

fn remove_font_extension(file_name: &str) -> String {
    let removes = [".ttf", ".ttc", ".otf", ".fon"];
    let mut result = file_name.to_string();
    for ext in &removes {
        if let Some(suffix) = result.strip_suffix(*ext) {
            result = suffix.to_string();
            break;
        }
    }
    result
}
