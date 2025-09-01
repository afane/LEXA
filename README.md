# LEXA - Legal to XML AI Translator

## What is LEXA?

LEXA is a browser-based AI application that translates legal statutory text to structured XML and vice versa. It runs entirely in your browser using WebLLM — no servers, no API keys, no data leaves your machine.

## Features

- **Bidirectional Translation**: Convert legal text ↔ XML with semantic structure
- **Browser-Native AI**: Runs small, browser-friendly models via WebGPU (no backend)
- **Privacy First**: All processing happens locally - your legal documents never leave your device
- **No Setup Required**: Static website deployment, no backend infrastructure needed
- **Cached Loading**: First load downloads a small model (hundreds of MB), then loads fast from cache

## Technical Requirements

### Browser Support
- **Chrome/Chromium 113+** (recommended)
- **Edge 113+**
- **Safari 16.4+** (macOS only)

### System Requirements
- **Memory**: 8–16GB RAM recommended
- **GPU**: WebGPU-compatible graphics card
- **Storage**: ~0.5–1GB available space for model caching
- **Platform**: Desktop only (mobile devices not supported)

## How It Works

1. **First Visit**: Downloads a small AI model to your browser cache (hundreds of MB)
2. **Subsequent Visits**: Loads cached model quickly
3. **Translation**: Enter legal text or XML, select direction, click translate
4. **Local Processing**: AI runs entirely in browser memory using WebGPU acceleration

## Usage

### Legal Text → XML
Input statutory text like:
```
Section 101. Definitions. 
For purposes of this Act:
(a) The term "person" means an individual, partnership, corporation...
```

Output structured XML:
```xml
<section number="101" title="Definitions">
    <provision>For purposes of this Act:</provision>
    <subsection letter="a">
        <definition term="person">means an individual, partnership, corporation...</definition>
    </subsection>
</section>
```

### XML → Legal Text
Reverse process converts structured XML back to readable statutory language.

## Quick Start (GitHub Pages)

This is a static HTML/CSS/JS app — perfect for GitHub Pages.

1. Push this repo to GitHub
2. Enable GitHub Pages for the repo
3. Open `https://<your-user>.github.io/<repo>/`

## File Structure

```
LEXA/
├── index.html          # Main application interface
├── app.js             # WebLLM integration and translation logic
├── style.css          # Responsive UI styling
└── README.md          # This file
```

## Browser Compatibility Check

The application automatically detects WebGPU support and shows warnings for incompatible browsers. If you see a compatibility warning:

1. Enable hardware acceleration in browser settings
2. Update to latest browser version
3. Try Chrome/Edge if using other browsers
4. Ensure graphics drivers are updated

## Performance Notes

- **First Load**: A few minutes depending on internet speed
- **Model Size**: Hundreds of MB cached in browser storage
- **Translation Speed**: Seconds to tens of seconds depending on text length and hardware
- **Memory Usage**: Several GB RAM during active translation (8–16GB recommended)

## Privacy & Security

- **No Network Calls**: After initial model download, works completely offline
- **No Data Collection**: No analytics, logging, or telemetry
- **Local Storage Only**: All data remains in browser cache
- **HTTPS Required**: Secure context needed for WebGPU access

## Limitations

- Desktop browsers only (WebGPU not available on mobile)
- Large memory footprint (8GB+ RAM recommended)
- Initial setup time for first-time users
- Context window limits (~4000 tokens for very long documents)
- English language optimized (other languages may have reduced accuracy)

## Troubleshooting

### Model Won't Load
- Check browser console for WebGPU errors
- Ensure sufficient RAM/storage space
- Try clearing browser cache and reloading
- Verify browser supports WebGPU at [webgpu.io](https://webgpu.io)

### Poor Translation Quality
- Break very long documents into smaller sections
- Ensure input text is properly formatted
- Legal XML should use semantic tags (section, provision, etc.)

### Performance Issues
- Close other memory-intensive applications
- Use latest browser version
- Check graphics driver updates
- Monitor system RAM usage during translation

## Technical Architecture

Built with:
- **WebLLM**: Browser-native LLM inference via WebAssembly + WebGPU
- Small instruction-tuned models (e.g., TinyLlama, Qwen 0.5B, Phi‑3 mini)
- **Vanilla JavaScript**: No frameworks, minimal dependencies
- **Modern CSS**: Responsive design with CSS Grid/Flexbox
