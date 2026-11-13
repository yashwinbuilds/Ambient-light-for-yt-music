# Privacy Policy

**Ambient Light for Anything** is committed to protecting user privacy. This Privacy Policy details our data practices and principles.

---

### 1. Zero Data Collection
* **No Personal Data**: We do not collect, store, transmit, or sell any personally identifiable information (PII).
* **No Browsing History**: We do not track, log, or monitor the websites you visit, your search queries, or your browsing activity.
* **No Telemetry or Tracking**: The extension does not contain analytics scripts, third-party trackers, beacons, or advertising SDKs.

---

### 2. Local Processing & Execution
* **100% Client-Side**: All video frame sampling, album artwork color extraction, and canvas rendering occur entirely on your local machine using hardware-accelerated Web APIs (HTML5 Canvas 2D and CSS filter transforms).
* **No External Servers**: The extension does not communicate with any external backend, API, or telemetry server. All network requests initiated by YouTube Music, Spotify, or YouTube are strictly handled by those respective platforms.

---

### 3. Permissions & Justification
* **`storage`**: Used exclusively to store your visual configuration preferences (e.g. glow spread, blur radius, brightness, presets, and Liquid Glass opacity) in Chrome's local storage sandbox (`chrome.storage.sync` / `chrome.storage.local`).
* **Host Permissions (`*://music.youtube.com/*`, `*://open.spotify.com/*`, `*://*.youtube.com/*`)**: Required solely to inject content scripts and styles into supported media players to render the ambient lighting canvas and apply translucent UI themes.

---

### 4. Open Source Transparency
The complete source code of this extension is publicly available on GitHub under the MIT License:
[https://github.com/yashwinbuilds/Ambient-light-for-yt-music](https://github.com/yashwinbuilds/Ambient-light-for-yt-music)

---

### 5. Contact
For any questions regarding this Privacy Policy or the extension's data practices, please open an issue on the [GitHub repository](https://github.com/yashwinbuilds/Ambient-light-for-yt-music/issues).
