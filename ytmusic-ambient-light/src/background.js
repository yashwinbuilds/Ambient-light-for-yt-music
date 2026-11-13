/**
 * Ambient Light for YouTube Music™ - Background Service Worker
 */

const DEFAULT_SETTINGS = {
  enabled: true,
  preset: 'balanced',
  spread: 35,           // % of media size (10 - 70)
  blur: 42,             // blur softness factor (15 - 80)
  brightness: 115,      // % (50 - 180)
  contrast: 108,        // % (50 - 150)
  saturation: 135,      // % (50 - 200)
  smoothness: 65,       // frame blending smoothness % (0 - 95)
  viewportAura: true,   // full-screen ambient wash
  detectBlackBars: true, // automatic letterbox/pillarbox detection
  showInPlayerBar: true,
  liquidGlass: true,    // Liquid Glass transparency across all YT Music
  glassOpacity: 32,     // % (10 - 70)
  glassBlur: 28,        // px (10 - 50)
  ambientWhileBrowsing: true
};

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const existing = await chrome.storage.sync.get('ambientSettings');
    if (!existing.ambientSettings) {
      await chrome.storage.sync.set({ ambientSettings: DEFAULT_SETTINGS });
    }
    console.log('[AmbientLight-YTM] Extension installed and default settings provisioned.');
  }
});
