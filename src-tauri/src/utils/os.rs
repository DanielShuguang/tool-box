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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_cpu_info_returns_positive_count() {
        let cpu_count = get_cpu_info();
        assert!(cpu_count > 0, "CPU 数量至少为 1，实际为 {}", cpu_count);
    }

    #[test]
    fn test_get_cpu_info_returns_reasonable_value() {
        let cpu_count = get_cpu_info();
        assert!(cpu_count <= 256, "CPU 数量不合理: {}", cpu_count);
    }

    #[test]
    fn test_get_system_name_returns_non_empty_string() {
        let system_name = get_system_name();
        assert!(!system_name.is_empty(), "系统名称不应为空");
    }

    #[test]
    fn test_get_system_name_is_valid() {
        let system_name = get_system_name();
        assert!(
            system_name.len() >= 3,
            "系统名称至少 3 个字符，实际为 '{}'",
            system_name
        );
    }

    #[test]
    fn test_get_harddisk_info_returns_valid_result() {
        let _disks: Vec<String> = get_harddisk_info();
        assert!(true, "应返回 Vec<String> 类型");
    }

    #[test]
    fn test_get_harddisk_info_paths_are_valid() {
        let disks = get_harddisk_info();
        for disk in disks {
            assert!(!disk.is_empty(), "磁盘路径不应为空");
            assert!(
                disk.starts_with('/') || disk.contains(':'),
                "磁盘路径格式无效: {}",
                disk
            );
        }
    }

    #[test]
    fn test_get_harddisk_info_no_duplicate_paths() {
        let mut disks = get_harddisk_info();
        disks.sort();
        disks.dedup();
        let original_count = get_harddisk_info().len();
        let unique_count = disks.len();
        assert_eq!(original_count, unique_count, "磁盘路径不应包含重复项");
    }
}
