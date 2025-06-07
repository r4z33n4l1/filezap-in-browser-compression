# PDF-Turbo 🚀

Ultra-fast PDF & image compression powered by Go WebAssembly. Compress files directly in your browser with native performance and complete privacy.

## ✨ Features

- **🚀 WebAssembly Performance**: Go-compiled WASM engine for 5-10x faster compression than JavaScript
- **🔒 Complete Privacy**: Zero uploads - all processing happens in your browser
- **📄 PDF Optimization**: Advanced PDF compression with image optimization
- **🖼️ Image Compression**: Multi-format image compression (JPEG, PNG, WebP support planned)
- **⚡ Parallel Processing**: Leverages Go goroutines for concurrent file processing
- **📱 Progressive Web App**: Works offline with service worker caching
- **🎯 Smart Compression**: Automatically chooses optimal compression settings based on file size
- **📊 Real-time Stats**: Live performance metrics and compression analytics

## 🏗️ Architecture

### WebAssembly Engine
- **Language**: Go 1.22
- **Size**: ~3MB compressed WASM binary
- **Libraries**: 
  - `github.com/disintegration/imaging` for image processing
  - Native Go image encoders (JPEG, PNG)
- **Build**: `GOOS=js GOARCH=wasm` with `-ldflags="-s -w"` for size optimization

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **UI Components**: Radix UI + shadcn/ui

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Go 1.22+ (for building WASM)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf-turbo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup WebAssembly**
   ```bash
   # Download Go WASM runtime
   npm run setup:wasm
   
   # Build WASM module
   npm run build:wasm
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 📦 Build Scripts

```bash
# Development
npm run dev                 # Start dev server
npm run build:dev          # Build for development

# Production
npm run build              # Build WASM + frontend for production
npm run preview           # Preview production build

# WebAssembly
npm run build:wasm        # Build Go WASM module (Unix/Mac)
npm run build:wasm:win    # Build Go WASM module (Windows)
npm run setup:wasm        # Download wasm_exec.js runtime
```

## 🔧 WASM Development

### Building the WASM Module

The WebAssembly module is built from Go source code in the `wasm/` directory:

```bash
cd wasm
GOOS=js GOARCH=wasm go build -tags purego -ldflags="-s -w" -o ../public/pdf-turbo.wasm ./main.go
```

### Key WASM Functions

- `compressPDF(data, progress)` - PDF compression with progress callbacks
- `compressImage(data, mimeType, progress)` - Image compression with format detection
- `compressBatch(files, progress)` - Batch processing for multiple files

### Performance Optimizations

- **Pure Go builds** (`-tags purego`) for WASM compatibility
- **Symbol stripping** (`-ldflags="-s -w"`) for smaller binary size
- **Goroutine-based** parallel processing
- **Memory pooling** for efficient buffer reuse
- **Progressive loading** with early progress feedback

## 🎯 Compression Algorithms

### PDF Compression
- Object stream compression
- Cross-reference stream optimization
- Metadata removal
- Image recompression within PDFs
- Duplicate object elimination

### Image Compression
- **JPEG**: Multiple quality levels (60%, 75%, 85%) with automatic best selection
- **PNG**: Lossless compression with optimization
- **Automatic resizing**: Smart dimension limits (2048px max)
- **Format conversion**: Optimal format selection for best compression

## 📊 Performance Metrics

The app tracks and displays:
- **Compression Speed**: MB/s processing rate
- **Space Savings**: Total bytes and percentage saved
- **Processing Time**: Real-time and total elapsed time
- **Compression Ratios**: Per-file and average ratios

## 🔒 Privacy & Security

- **Zero Server Communication**: All processing happens locally
- **No Data Collection**: Files never leave your device
- **Offline Capable**: Works without internet connection
- **Memory Safe**: Go's garbage collection prevents memory leaks

## 🌐 Browser Compatibility

- **Chrome/Edge**: Full WebAssembly support
- **Firefox**: Full WebAssembly support  
- **Safari**: WebAssembly support (iOS 11+)
- **Mobile**: Progressive Web App with offline support

## 🛠️ Development

### Project Structure
```
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # WASM loader and utilities
│   ├── pages/         # Page components
│   └── workers/       # Web Workers (legacy)
├── wasm/              # Go WebAssembly source
│   ├── main.go        # WASM entry point
│   └── go.mod         # Go dependencies
├── public/            # Static assets
│   ├── pdf-turbo.wasm # Compiled WASM binary
│   └── wasm_exec.js   # Go WASM runtime
└── package.json       # Node.js dependencies
```

### Adding New Compression Formats

1. **Update Go WASM module** (`wasm/main.go`)
2. **Add format detection** in TypeScript (`src/lib/wasm.ts`)
3. **Update UI components** for new file types
4. **Rebuild WASM** with `npm run build:wasm`

## 🚀 Deployment

The app builds to static files and can be deployed to any CDN or static hosting:

```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

### Recommended Hosting
- **Vercel**: Zero-config deployment
- **Netlify**: Automatic builds from Git
- **GitHub Pages**: Free static hosting
- **Cloudflare Pages**: Global CDN with edge computing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test WASM builds work correctly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Go Team**: For excellent WebAssembly support
- **pdfcpu**: PDF processing library (planned integration)
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework

---

**Built with ❤️ using Go WebAssembly + React**
