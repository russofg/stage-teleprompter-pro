# Stage Teleprompter Pro

A professional cross-platform teleprompter desktop application built with **Electron**, React, and TypeScript. Perfect for presentations, video production, and live streaming.

## Features

### 🎬 Professional Teleprompter

- **Smooth scrolling**: Adjustable speed with real-time control
- **Dashboard + Stage view**: Separate control panel and display window
- **Mirror mode**: Support for glass teleprompters
- **Customizable display**: Font size, colors, line height, and background

### 📄 Multiple File Formats

- **Text files** (.txt): Plain text support
- **Word documents** (.docx): Full Microsoft Word compatibility
- **Manual input**: Type or paste content directly

### 🎛️ Real-time Controls

- **Play/Pause**: Space bar or dashboard controls
- **Speed adjustment**: Dynamic speed control (20-200 px/s)
- **Position reset**: Instant return to beginning
- **Keyboard shortcuts**: Stage view keyboard controls

### 🖥️ Cross-Platform

- **macOS**: Native app with full functionality
- **Windows**: Complete Windows compatibility
- **Desktop-first**: Optimized for desktop use

## 📥 Downloads

### Latest Release
Download the latest version from [GitHub Releases](https://github.com/russofg/stage-teleprompter-pro/releases):

- **macOS Intel (x64)**: `.dmg` installer
- **macOS Apple Silicon (ARM64)**: `.dmg` installer  
- **Windows x64**: `.msi` installer

### Development Builds
For the latest development builds, check the [Actions](https://github.com/russofg/stage-teleprompter-pro/actions) tab.

## Installation

- **Node.js** (v20.19+ required)
- **npm** or **yarn**

### Development Setup

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd stage-teleprompter-pro
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run in development mode**:
   ```bash
   npm run electron-dev
   ```

### Building for Production

#### Local Build
```bash
# Build for current platform
npm run electron-build

# Build for all platforms
npm run electron-pack
```

#### GitHub Actions (Automated)
We have automated CI/CD pipelines that build for all platforms:

- **Automatic builds**: Every push to `main` triggers builds for macOS and Windows
- **Manual builds**: Use GitHub Actions tab for custom builds
- **Releases**: Tag with `v*` to create official releases

```bash
# Create a release
git tag v1.0.0
git push origin v1.0.0
```

#### Build Targets
- **macOS**: `.dmg` installer (Intel + Apple Silicon)
- **Windows**: `.msi` installer + `.exe` portable
- **Linux**: `.AppImage` (coming soon)
