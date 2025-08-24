# GitHub Actions Workflows

Este directorio contiene los workflows de GitHub Actions para automatizar la construcción y distribución de **Stage Teleprompter Pro**.

## 📋 Workflows Disponibles

### 1. **Build Tauri App** (`build.yml`)
**Trigger:** Push a `main`, Pull Requests, Manual
- Construye la aplicación para todas las plataformas
- Crea releases automáticos en GitHub
- Genera ejecutables para macOS (Intel/ARM64) y Windows (x64)

### 2. **Manual Build** (`build-manual.yml`)
**Trigger:** Solo Manual
- Permite construir para plataformas específicas
- No crea releases automáticos
- Útil para testing y builds de desarrollo

### 3. **Release Production Build** (`release.yml`)
**Trigger:** Tags `v*`, Manual
- Construye versiones de producción
- Crea releases con versionado semántico
- Optimizado para distribución final

## 🚀 Cómo Usar

### Build Automático (Recomendado)
1. Haz push a la rama `main`
2. El workflow se ejecuta automáticamente
3. Se crea un release con el número de build
4. Descarga los ejecutables desde la pestaña "Releases"

### Build Manual
1. Ve a **Actions** en GitHub
2. Selecciona **Manual Build**
3. Elige la plataforma (all, macos, windows)
4. Haz click en **Run workflow**

### Release de Producción
1. Crea un tag: `git tag v1.0.0`
2. Push el tag: `git push origin v1.0.0`
3. El workflow se ejecuta automáticamente
4. Se crea un release oficial con versionado

## 📱 Plataformas Soportadas

| Plataforma | Arquitectura | Formato | Archivo |
|------------|--------------|---------|---------|
| macOS | Intel (x64) | DMG | `macos-x64.dmg` |
| macOS | Apple Silicon (ARM64) | DMG | `macos-arm64.dmg` |
| Windows | x64 | MSI | `windows-x64.msi` |

## 🔧 Configuración Técnica

- **Node.js:** 18.x
- **Rust:** Stable
- **Tauri CLI:** 1.0.4
- **Build Target:** `src-tauri/target-build` (dev) / `src-tauri/target-release` (prod)
- **Cache:** npm dependencies y Rust toolchain

## 📥 Descargar Ejecutables

### Desde GitHub Releases
1. Ve a la pestaña **Releases**
2. Selecciona la versión deseada
3. Descarga el archivo para tu plataforma

### Desde GitHub Actions
1. Ve a **Actions**
2. Selecciona el workflow ejecutado
3. Descarga los artifacts generados

## 🛠️ Troubleshooting

### Error: "Build failed"
- Verifica que el código compile localmente
- Revisa los logs del workflow
- Asegúrate de que las dependencias estén actualizadas

### Error: "Release creation failed"
- Verifica que tienes permisos de write en el repositorio
- Asegúrate de que el tag no exista ya
- Revisa que el workflow de build haya sido exitoso

### Error: "Artifact not found"
- Los artifacts se mantienen por 30-90 días
- Para releases, se mantienen por 1 año
- Si necesitas un build específico, ejecuta el workflow manual

## 📚 Recursos Adicionales

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Tauri Build Documentation](https://tauri.app/v1/guides/getting-started/setup/)
- [Rust Cross-compilation](https://rust-lang.github.io/rustup/cross-compilation.html)

## 🤝 Contribuir

Para modificar estos workflows:
1. Haz los cambios en tu rama
2. Prueba localmente si es posible
3. Crea un Pull Request
4. Los workflows se ejecutarán automáticamente para validar los cambios

---

**Nota:** Estos workflows están optimizados para Tauri 1.4. Si actualizas a Tauri 2.x, necesitarás actualizar la configuración.
