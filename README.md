# Ambient Light for Anything (Spotify, YouTube Music, YouTube)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Hardware Accelerated](https://img.shields.io/badge/GPU-Hardware%20Accelerated-orange.svg)]()
[![Platform Compatibility](https://img.shields.io/badge/Supported-Spotify%20|%20YT%20Music%20|%20YouTube-purple.svg)]()

A high-performance, hardware-accelerated Chrome Extension (Manifest V3) that brings dynamic, room-filling ambient lighting and translucent **Liquid Glass** aesthetics to your favorite music and video web players:
* **Spotify Web Player** (`open.spotify.com`)
* **YouTube Music™** (`music.youtube.com`)
* **YouTube™ Desktop** (`youtube.com`)

---

## Key Features

### 1. 3-Tier Hardware-Accelerated Projection Engine
Rather than applying a single heavy blur filter that washes out colors, the ambient engine utilizes a calibrated multi-layer projection architecture:
* **Tier 1: Full-Screen Viewport Aura (`.ytal-music__viewport-aura`)**: An expansive, atmospheric room wash filling the display edges, backgrounding sidebars, and illuminating the browser viewport.
* **Tier 2: Far Volumetric Halo (`.ytal-music__layer--far`)**: An expansive, high-diffusion glow providing broad, soft radiant light around the active player.
* **Tier 3: Near Edge Bloom (`.ytal-music__layer--near`)**: A tight, high-chroma bloom contouring album artwork or video boundaries to provide sharp, vibrant edge definition.

### 2. Multi-Platform Adapter Pattern
Clean, modular adapter architecture that isolates platform-specific DOM lifecycles and playback states:
* `SpotifyAdapter`: Listens for track changes on the Now Playing bar, samples high-resolution album artwork or Spotify Canvas video streams, and injects Liquid Glass styling across sidebars.
* `YTMusicAdapter`: Supports dual-media sources (HTML5 music videos and static album covers), isolates player overlays from underlying browse pages, and mounts player controls.
* `YouTubeAdapter`: Samples active HTML5 video frames in real time with synchronized aspect ratio adjustments.

### 3. Liquid Glass UI Styling
Replaces harsh opaque `#000` sidebars and player bars with frosted, translucent surfaces (`backdrop-filter: blur(28px) saturate(160%)`) with adjustable opacity and blur sliders.

### 4. Smart Letterbox & Pillarbox Auto-Crop
Music videos with 21:9 anamorphic aspect ratios or 4:3 letterboxing are analyzed in real time. Black border scanlines are detected and cropped dynamically with CSS `clip-path` masks, preventing dead black halos.

### 5. Temporal Frame Blending (Exponential Moving Average)
Incoming video frames are blended using an Exponential Moving Average (EMA) algorithm:
$$\text{Alpha} = \max(0.12, 1.0 - \text{Smoothness} \times 0.88)$$
This eliminates harsh strobe flickers during rapid video cuts while maintaining silky-smooth transitions between songs.

### 6. Zero Idle GPU Consumption
When static album art is displayed, the frame pipeline renders once on song transition and enters a zero-cost idle state. Rendering is completely paused when the browser tab is hidden or minimized.

---

## Quick Start & Installation

### Option A: Install from Source (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/yashwinbuilds/Ambient-light-for-yt-music.git
   ```
2. Open Google Chrome, Microsoft Edge, or Brave and navigate to:
   ```
   chrome://extensions/
   ```
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the **`ytmusic-ambient-light`** folder inside the cloned repository.
6. Open [YouTube Music](https://music.youtube.com), [Spotify](https://open.spotify.com), or [YouTube](https://www.youtube.com) and start playing music!

---

## In-Player Controls & Presets

Click the **Sun icon** in the player bar (or use the toolbar popup) to open the floating settings panel:

* **Presets**:
  * **Subtle Glow**: Soft, gentle warmth that accents the player without visual fatigue.
  * **Balanced (Default)**: Calibrated room-filling ambiance matching high-end ambilight systems.
  * **Vivid & Punchy**: High-chroma edge pop and deep color saturation.
  * **Liquid Cinema**: Ultra-wide edge-to-edge illumination with crystalline optical glass.
* **Manual Sliders**:
  * **Spread**: Adjusts halo radius ($10\% - 150\%$).
  * **Blur Radius**: Controls diffusion sharpness ($15\% - 80\%$).
  * **Brightness & Contrast**: Fine-tunes luminescence for OLED or IPS monitors.
  * **Saturation Boost**: Enhances chromatic vibrancy ($50\% - 200\%$).
  * **Smoothness**: Governs temporal blending speed.
  * **Liquid Glass Opacity & Blur**: Adjusts UI translucency and frosted diffusion.

---

## Directory Structure

```
Ambient-light-for-yt-music/
├── LICENSE                        # MIT Open Source License
├── README.md                      # Documentation & Quick Start
├── CONTRIBUTING.md                # Contribution guidelines
├── PRIVACY-POLICY.md              # Privacy Policy & permissions disclosure
├── scripts/
│   └── pack.js                    # Automated extension packaging script
├── dist/
│   └── ytmusic-ambient-light-v1.0.0.zip  # Production distribution archive
└── ytmusic-ambient-light/         # Extension Source Root
    ├── manifest.json              # Manifest V3 configuration
    ├── package.json               # Extension metadata & scripts
    ├── icons/                     # Extension branding icons (16px to 128px)
    └── src/
        ├── background.js          # Service worker for lifecycle management
        ├── content.js             # Route coordinator for target platforms
        ├── adapters/
        │   ├── spotify-adapter.js # Spotify Web Player lifecycle & DOM hooks
        │   ├── ytmusic-adapter.js # YouTube Music lifecycle & DOM hooks
        │   └── youtube-adapter.js # YouTube Desktop video watcher
        ├── engine/
        │   ├── ambient-engine.js  # 3-tier canvas projector & EMA blender
        │   ├── bar-detection.js   # Letterbox & pillarbox scanline detector
        │   └── presets.js         # Curated visual presets & defaults
        ├── ui/
        │   ├── in-page-menu.js    # In-player floating controls modal
        │   └── settings-controller.js # Multi-tab synchronized storage
        ├── popup/
        │   ├── popup.html         # Toolbar action popup
        │   ├── popup.css          # Dark mode popup styles
        │   └── popup.js           # Popup controller
        └── styles/
            ├── ambient.css        # Core canvas layers & GPU blur transforms
            ├── spotify.css        # Spotify Liquid Glass styling
            └── ytmusic.css        # YouTube Music Liquid Glass & isolation
```

---

## Building & Packaging

To generate a clean `.zip` archive ready for distribution or manual installation:

```bash
node scripts/pack.js
```
The packaged archive will be generated in `dist/ytmusic-ambient-light-v1.0.0.zip`.

---

## Privacy & Permissions

This extension is built with a strict **Privacy-First** architecture:
* **Zero Telemetry**: No tracking scripts, analytics, or external network requests.
* **100% Client-Side**: All video/album art sampling happens entirely in your local browser memory.
* **Minimal Permissions**: Uses `storage` solely to remember your slider preferences locally.

See [PRIVACY-POLICY.md](PRIVACY-POLICY.md) for full disclosure.

---

## Contributing

Contributions, bug reports, and suggestions are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

---

## License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.
