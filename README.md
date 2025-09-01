# LEXA - Legal to XML AI Translator

## What is LEXA?

LEXA is a browser-based AI application that translates legal statutory text to structured XML and vice versa. It runs entirely in your browser using WebLLM - no servers, no API keys, no data leaves your machine.

## Features

- **Bidirectional Translation**: Convert legal text ↔ XML with semantic structure
- **Browser-Native AI**: Runs Phi-3.5-mini model directly in your browser via WebGPU
- **Privacy First**: All processing happens locally - your legal documents never leave your device
- **No Setup Required**: Static website deployment, no backend infrastructure needed
- **Cached Loading**: Model downloads once (~4-8GB), then loads instantly on subsequent visits

## Technical Requirements

### Browser Support
- **Chrome/Chromium 113+** (recommended)
- **Edge 113+**
- **Safari 16.4+** (macOS only)

### System Requirements
- **Memory**: 8-16GB RAM recommended
- **GPU**: WebGPU-compatible graphics card
- **Storage**: 8GB available space for model caching
- **Platform**: Desktop only (mobile devices not supported)

## How It Works

1. **First Visit**: Downloads Phi-3.5-mini AI model to browser (~4-8GB, 2-5 minutes)
2. **Subsequent Visits**: Loads cached model instantly
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

## Deployment

This is a static HTML/CSS/JS application that can be deployed to any web server or GitHub Pages.

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

- **First Load**: 2-5 minutes depending on internet speed
- **Model Size**: ~4-8GB cached in browser storage
- **Translation Speed**: 2-10 seconds depending on text length and hardware
- **Memory Usage**: 6-12GB RAM during active translation

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
- **Phi-3.5-mini**: Microsoft's efficient instruction-tuned language model
- **Vanilla JavaScript**: No frameworks, minimal dependencies
- **Modern CSS**: Responsive design with CSS Grid/Flexbox