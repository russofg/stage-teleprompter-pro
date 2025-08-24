/// <reference types="vite/client" />

// Ambient types for Tauri global shortcut plugin (JS side provides runtime)
declare module '@tauri-apps/plugin-global-shortcut' {
	export function register(shortcut: string, handler: () => void): Promise<void>;
	export function registerAll(shortcuts: string[], handler: (shortcut: string) => void): Promise<void>;
	export function isRegistered(shortcut: string): Promise<boolean>;
	export function unregister(shortcut: string): Promise<void>;
	export function unregisterAll(): Promise<void>;
}
