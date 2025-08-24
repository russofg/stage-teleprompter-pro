# Stage Teleprompter Pro

A professional cross-platform teleprompter desktop application built with Tauri v2, React, and TypeScript. Perfect for presentations, video production, and live streaming.

## Features

### 🎬 Professional Teleprompter

- **Smooth scrolling**: Adjustable speed with real-time control
- **Dashboard + Stage view**: Separate control panel and display window
- **Mirror mode**: Support for glass teleprompters
- **Customizable display**: Font size, colors, line height, and background

### 📄 Multiple File Formats

- **Text files** (.txt): Plain text support
- **Word documents** (.docx): Full Microsoft Word compatibility
- **URL loading**: Load content directly from web URLs
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

- **Node.js** (v18 or later)
- **Rust** (latest stable)
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
   npm run tauri dev
   ```

### Building for Production

#### Local Build
```bash
# Build for current platform
npm run tauri build

# Build for all platforms using our script
./scripts/build-all.sh --release

# Clean build (removes previous builds)
./scripts/build-all.sh --clean --release
```

#### GitHub Actions (Automated)
We have automated CI/CD pipelines that build for all platforms:

- **Automatic builds**: Every push to `main` triggers builds for macOS (Intel/ARM64) and Windows
- **Manual builds**: Use GitHub Actions tab for custom builds
- **Releases**: Tag with `v*` to create official releases

```bash
# Create a release
git tag v1.0.0
git push origin v1.0.0
```

#### Build Targets
- **macOS Intel (x64)**: `x86_64-apple-darwin`
- **macOS Apple Silicon (ARM64)**: `aarch64-apple-darwin`  
- **Windows x64**: `x86_64-pc-windows-msvc`

For more details, see [`.github/README.md`](.github/README.md).

## Usage

### Quick Start

1. **Launch the application**
2. **Load your content**:
   - Upload a .txt or .docx file
   - Enter a URL to load web content
   - Type directly in the text area
3. **Adjust settings** in the dashboard:
   - Font size and colors
   - Scrolling speed
   - Line height and mirroring
4. **Open Stage View** for your teleprompter display
5. **Control playback** with dashboard or keyboard shortcuts

### Keyboard Shortcuts (Stage View)

- **Space**: Play/Pause
- **Home**: Reset to beginning
- **Escape**: Exit fullscreen

### Professional Tips

- **Dual monitor setup**: Run dashboard on primary monitor, stage view on secondary
- **Glass teleprompter**: Enable mirror mode for traditional teleprompter setups
- **Speed optimization**: Start slow (40-60 px/s) and adjust based on reading speed
- **Font size**: Larger fonts (60-80px) work better for camera distance

## Technical Architecture

### Frontend

- **React 18**: Modern UI components with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Professional styling
- **Vite**: Fast development and building

### Backend

- **Tauri v2**: Rust-based desktop framework
- **Multi-window**: Dashboard and stage view synchronization
- **Event system**: Real-time communication between windows

### File Processing

- **mammoth.js**: DOCX file parsing
- **DOMPurify**: Content sanitization
- **Fetch API**: URL content loading

## Development

### Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx     # Main control interface
│   ├── Stage.tsx         # Stage view component
│   ├── Controls.tsx      # Control panel
│   └── StageView.tsx     # Teleprompter display
├── lib/
│   └── fileLoaders.ts    # File processing utilities
├── types.ts              # TypeScript definitions
├── App.tsx               # Main dashboard app
└── stage.tsx             # Stage view entry point

src-tauri/
├── src/
│   └── main.rs           # Rust backend
└── tauri.conf.json       # Tauri configuration
```

### Adding Features

1. **New file formats**: Extend `fileLoaders.ts`
2. **UI components**: Add to `components/` directory
3. **State management**: Update `PrompterState` interface
4. **Backend features**: Modify Rust code in `src-tauri/`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions:

- Open an issue on GitHub
- Check the documentation
- Review existing issues and discussions

---

**Stage Teleprompter Pro** - Professional teleprompter software for modern content creators.
