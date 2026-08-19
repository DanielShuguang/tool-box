use std::fs;

#[tauri::command]
pub fn get_system_fonts() -> Result<Vec<String>, String> {
    let mut fonts = Vec::new();

    #[cfg(target_os = "windows")]
    {
        collect_fonts_from_dir("C:\\Windows\\Fonts", &mut fonts);

        let hkcu = winreg::RegKey::predef(winreg::enums::HKEY_CURRENT_USER);
        if let Ok(software) =
            hkcu.open_subkey("Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts")
        {
            for result in software.enum_values().flatten() {
                let (name, _) = result;
                if !fonts.contains(&name) {
                    fonts.push(name);
                }
            }
        }

        if let Ok(software) =
            hkcu.open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Fonts")
        {
            for result in software.enum_values().flatten() {
                let (name, _) = result;
                if !fonts.contains(&name) {
                    fonts.push(name);
                }
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        collect_fonts_from_dir("/System/Library/Fonts", &mut fonts);
        collect_fonts_from_dir("/Library/Fonts", &mut fonts);
        if let Some(home) = std::env::var_os("HOME") {
            let user_fonts = std::path::Path::new(&home).join("Library/Fonts");
            if let Some(dir) = user_fonts.to_str() {
                collect_fonts_from_dir(dir, &mut fonts);
            }
        }
    }

    fonts.sort();
    Ok(fonts)
}

fn collect_fonts_from_dir(dir: &str, fonts: &mut Vec<String>) {
    if let Ok(font_dir) = fs::read_dir(dir) {
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
