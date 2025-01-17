use sysinfo::{Disks, System};

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

#[tauri::command]
pub fn get_harddisk_info() -> Vec<String> {
    let mut disks = Disks::new();
    disks.refresh(true);

    let mut list = vec![];
    disks
        .list()
        .iter()
        .for_each(|disk| match disk.mount_point().to_str() {
            Some(str) => list.push(str.to_string()),
            None => println!("获取硬盘名称失败"),
        });
    list
}
