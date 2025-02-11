use tauri_build::{build, try_build, Attributes, WindowsAttributes};

fn main() {
    // 判断系统类型
    if cfg!(windows) {
        let windows =
            WindowsAttributes::new().app_manifest(include_str!("windows-app-manifest.xml"));

        try_build(Attributes::new().windows_attributes(windows))
            .expect("Failed to build Tauri application");
    } else {
        build();
    }
}
