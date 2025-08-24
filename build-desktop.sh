#!/bin/bash
echo "🚀 Construyendo aplicación de escritorio para macOS..."

# Limpiar puertos ocupados
echo "🧹 Limpiando puertos..."
pkill -f "vite" 2>/dev/null || true
pkill -f "1420" 2>/dev/null || true
lsof -ti:1420 | xargs kill -9 2>/dev/null || true
sleep 2

# Configurar variables de entorno para macOS
export MACOSX_DEPLOYMENT_TARGET=11.0
export RUSTFLAGS="-C target-cpu=native"
export CARGO_BUILD_JOBS=1

# Limpiar caché
echo "🗑️ Limpiando caché de Cargo..."
cd src-tauri
rm -rf target/ 2>/dev/null || true
cargo clean 2>/dev/null || true

# Construir aplicación
echo "🔨 Compilando aplicación de escritorio..."
cd ..
npm run tauri build

echo "✅ ¡Aplicación de escritorio lista!"
echo "📱 Busca el archivo .dmg en src-tauri/target/release/bundle/dmg/"
