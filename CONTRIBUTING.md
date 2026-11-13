# Contributing to Ambient Light for Anything

Thank you for your interest in contributing! This project is open-source under the MIT License and welcomes pull requests, bug reports, and suggestions.

---

### Getting Started

1. **Fork the Repository**:
   Fork [yashwinbuilds/Ambient-light-for-yt-music](https://github.com/yashwinbuilds/Ambient-light-for-yt-music) on GitHub.

2. **Clone Locally**:
   ```bash
   git clone https://github.com/<your-username>/Ambient-light-for-yt-music.git
   cd Ambient-light-for-yt-music
   ```

3. **Load in Chrome / Edge / Brave**:
   - Open `chrome://extensions/`.
   - Enable **Developer mode** (top-right).
   - Click **Load unpacked** and select the `ytmusic-ambient-light` directory.

4. **Make Changes**:
   - Platform adapters are located in `ytmusic-ambient-light/src/adapters/`.
   - The core canvas projector is in `ytmusic-ambient-light/src/engine/ambient-engine.js`.
   - UI controls are in `ytmusic-ambient-light/src/ui/`.
   - Stylesheets are in `ytmusic-ambient-light/src/styles/`.

5. **Package the Extension**:
   ```bash
   node scripts/pack.js
   ```
   This generates a distribution zip in `dist/`.

---

### Code Architecture Standards

* **Zero Fluff & Performance-First**: All rendering operations must respect the 64px sampling economy to minimize memory footprint and avoid dropped frames.
* **Adapter Isolation**: Platform-specific logic (DOM queries, player bar selectors, mutation observers) must remain inside dedicated adapter classes (`src/adapters/*-adapter.js`).
* **Clean Design**: Follow the high-contrast neutral theme and WCAG AA accessibility standards. Avoid generic, oversaturated AI-style color gradients.

---

### Submitting a Pull Request

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with clear, descriptive commit messages.
3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a Pull Request against the `main` branch.
