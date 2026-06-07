mod capture;

pub use capture::{
    capture_region, capture_screen, capture_window, create_capture_window, create_editor_window,
    create_preview_window, get_screenshot_data, get_windows, ScreenshotState,
};
