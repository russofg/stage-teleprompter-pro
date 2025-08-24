#!/bin/bash

# Script para construir Stage Teleprompter Pro para todas las plataformas
# Uso: ./scripts/build-all.sh [--clean] [--release]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Variables
CLEAN_BUILD=false
RELEASE_BUILD=false
BUILD_DIR="src-tauri/target-build"

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --release)
            RELEASE_BUILD=true
            BUILD_DIR="src-tauri/target-release"
            shift
            ;;
        -h|--help)
            echo "Uso: $0 [--clean] [--release]"
            echo ""
            echo "Opciones:"
            echo "  --clean     Limpiar builds anteriores"
            echo "  --release   Construir en modo release (optimizado)"
            echo "  -h, --help  Mostrar esta ayuda"
            exit 0
            ;;
        *)
            print_error "Argumento desconocido: $1"
            exit 1
            ;;
    esac
done

print_status "🚀 Iniciando build de Stage Teleprompter Pro"
print_status "Modo: $([ "$RELEASE_BUILD" = true ] && echo "Release" || echo "Debug")"
print_status "Directorio de build: $BUILD_DIR"

# Verificar dependencias
print_status "Verificando dependencias..."

if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    print_error "Rust/Cargo no está instalado"
    exit 1
fi

if ! command -v tauri &> /dev/null; then
    print_status "Instalando Tauri CLI..."
    cargo install tauri-cli --version "1.4.0"
fi

print_success "Dependencias verificadas"

# Limpiar builds anteriores si se solicita
if [ "$CLEAN_BUILD" = true ]; then
    print_status "Limpiando builds anteriores..."
    rm -rf "$BUILD_DIR"
    rm -rf "dist"
    print_success "Builds anteriores limpiados"
fi

# Instalar dependencias del frontend
print_status "Instalando dependencias del frontend..."
npm ci
print_success "Dependencias del frontend instaladas"

# Construir frontend
print_status "Construyendo frontend..."
npm run build
print_success "Frontend construido"

# Crear directorio de build si no existe
mkdir -p "$BUILD_DIR"

# Construir para macOS Intel
print_status "Construyendo para macOS Intel (x64)..."
if cargo tauri build --target x86_64-apple-darwin --target-dir "$BUILD_DIR" $([ "$RELEASE_BUILD" = true ] && echo "--release"); then
    print_success "Build de macOS Intel completado"
else
    print_error "Falló el build de macOS Intel"
    exit 1
fi

# Construir para macOS Apple Silicon
print_status "Construyendo para macOS Apple Silicon (ARM64)..."
if cargo tauri build --target aarch64-apple-darwin --target-dir "$BUILD_DIR" $([ "$RELEASE_BUILD" = true ] && echo "--release"); then
    print_success "Build de macOS Apple Silicon completado"
else
    print_error "Falló el build de macOS Apple Silicon"
    exit 1
fi

# Construir para Windows (solo si estamos en macOS o Linux)
if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "cygwin" ]]; then
    print_status "Construyendo para Windows (x64)..."
    if cargo tauri build --target x86_64-pc-windows-msvc --target-dir "$BUILD_DIR" $([ "$RELEASE_BUILD" = true ] && echo "--release"); then
        print_success "Build de Windows completado"
    else
        print_warning "Falló el build de Windows (esto es normal en macOS/Linux)"
    fi
else
    print_status "Construyendo para Windows (x64)..."
    if cargo tauri build --target x86_64-pc-windows-msvc --target-dir "$BUILD_DIR" $([ "$RELEASE_BUILD" = true ] && echo "--release"); then
        print_success "Build de Windows completado"
    else
        print_error "Falló el build de Windows"
        exit 1
    fi
fi

print_success "🎉 ¡Todos los builds completados exitosamente!"
print_status "Los ejecutables se encuentran en: $BUILD_DIR"

# Mostrar archivos generados
print_status "Archivos generados:"
find "$BUILD_DIR" -name "*.dmg" -o -name "*.pkg" -o -name "*.msi" -o -name "*.exe" -o -name "*.app" | while read -r file; do
    echo "  📁 $(basename "$file")"
done

print_status "Para crear un release en GitHub, ejecuta:"
print_status "  git tag v1.0.0"
print_status "  git push origin v1.0.0"
