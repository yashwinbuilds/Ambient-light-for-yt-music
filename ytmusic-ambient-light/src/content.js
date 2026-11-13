/**
 * Ambient Light for Anything - Content Script Router
 * Dynamically routes to the appropriate platform adapter:
 * - Spotify Web Player (open.spotify.com)
 * - YouTube Music (music.youtube.com)
 * - YouTube Desktop (www.youtube.com)
 */

(function bootstrapAmbientAnything() {
  if (window.__YTAL_INITIALIZED__) return;
  window.__YTAL_INITIALIZED__ = true;

  const hostname = window.location.hostname;
  console.log(`[Ambient-Anything] Initializing for ${hostname}...`);

  const settingsController = new window.YTALSettingsController((newSettings) => {
    if (window.__YTAL_ENGINE__) {
      window.__YTAL_ENGINE__.applySettings(newSettings);
    }
    if (window.__YTAL_MENU__) {
      window.__YTAL_MENU__.updateUI(newSettings);
    }
  });

  const route = () => {
    if (hostname.includes('spotify.com')) {
      window.__YTAL_ADAPTER__ = new window.SpotifyAdapter(settingsController);
    } else if (hostname.includes('music.youtube.com')) {
      window.__YTAL_ADAPTER__ = new window.YTMusicAdapter(settingsController);
    } else if (hostname.includes('youtube.com')) {
      window.__YTAL_ADAPTER__ = new window.YouTubeAdapter(settingsController);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', route);
  } else {
    route();
  }
})();
