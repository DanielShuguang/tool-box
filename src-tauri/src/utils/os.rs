use sysinfo::System;

#[tauri::command]
pub fn get_cpu_info() -> usize {
    let mut sys = System::new_all();
    sys.refresh_cpu_usage();

    sys.cpus().len()
}

pub fn get_system_name() -> String {
    let mut sys = System::new_all();
    sys.refresh_all();
    match sysinfo::System::name() {
        Some(name) => name,
        None => String::from("Unknown"),
    }
}
