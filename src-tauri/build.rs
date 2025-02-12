use tauri_build::{build, try_build, Attributes, WindowsAttributes};

fn main() {
    // 判断系统类型
    if cfg!(windows) {
        // 打包时需要管理员权限可在 manifest 文件中设置 level 为 requireAdministrator
        let windows =
            WindowsAttributes::new().app_manifest(include_str!("windows-app-manifest.xml"));

        try_build(Attributes::new().windows_attributes(windows))
            .expect("Failed to build Tauri application");
    } else {
        build();
    }
}
