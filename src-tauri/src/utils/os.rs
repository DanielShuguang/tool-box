use sysinfo::System;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime as TauriRuntime,
};

#[tauri::command]
pub fn get_cpu_info() -> usize {
    let mut sys = System::new_all();
    sys.refresh_cpu_usage();

    sys.cpus().len()
}

pub fn init<R: TauriRuntime>() -> TauriPlugin<R> {
    println!("OS plugin init");

    Builder::new("os")
        .invoke_handler(tauri::generate_handler![get_cpu_info])
        .build()
}
