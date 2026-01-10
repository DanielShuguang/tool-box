use std::path::Path;

use crate::utils::output::MessageSender;

use super::DownloadProgress;

pub fn extract_filename_from_url(url: &str) -> Option<String> {
    url.split('/').last().map(|s| s.to_string())
}

pub fn handle_filename_conflict(base_path: &str, _dir_path: &str) -> String {
    if !Path::new(base_path).exists() {
        return base_path.to_string();
    }
    
    let path = Path::new(base_path);
    let extension = path.extension().and_then(|e| e.to_str()).unwrap_or("");
    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("download");
    let parent = path.parent().unwrap_or(Path::new("."));
    
    for i in 1..=100 {
        let new_name = if extension.is_empty() {
            format!("{}({})", stem, i)
        } else {
            format!("{}({}).{}", stem, i, extension)
        };
        let new_path = parent.join(&new_name);
        if !new_path.exists() {
            return new_path.to_string_lossy().to_string();
        }
    }
    
    base_path.to_string()
}

pub fn generate_event_name(plugin_name: &str, event_type: Option<&str>) -> (String, String) {
    let event_base = match event_type {
        Some(et) => format!("{}:{}", plugin_name, et),
        None => format!("{}:download", plugin_name),
    };
    let progress_event = format!("{}:progress", event_base);
    (event_base, progress_event)
}

pub async fn report_progress(
    sender: &MessageSender,
    progress_event: &str,
    progress: DownloadProgress,
) {
    sender.send(progress_event, progress, false);
}
