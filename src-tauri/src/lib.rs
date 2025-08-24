// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[tauri::command]
fn quit_app() {
    // Cerrar completamente la aplicación
    std::process::exit(0);
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, quit_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
