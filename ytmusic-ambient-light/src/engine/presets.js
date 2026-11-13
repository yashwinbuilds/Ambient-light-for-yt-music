/**
 * Ambient Light for YouTube Music™ - Presets & Configuration Defaults
 * Tuned for full-screen immersive ambiance and Liquid Glass transparency.
 */

const YTAL_DEFAULT_SETTINGS = {
  enabled: true,
  preset: 'balanced',
  spread: 45,            // % (10 - 150) - expansive halo reaching screen boundaries
  blur: 42,              // % (15 - 80) - rich diffusion
  brightness: 120,       // % (50 - 180) - vibrant radiant glow
  contrast: 108,         // % (50 - 150)
  saturation: 140,       // % (50 - 200) - punchy chromatic pop matching reference
  smoothness: 65,        // % (0 - 95) - silky temporal blending
  viewportAura: true,    // full-screen ambient backdrop wash
  detectBlackBars: true, // auto letterbox/pillarbox detection
  showInPlayerBar: true, // quick access button in bottom player bar

  // Liquid Glass Translucency Settings
  liquidGlass: true,          // Ultra-transparent frosted glass across all YT Music
  glassOpacity: 32,           // % (10 - 70) lower = more transparent liquid glass
  glassBlur: 28,              // px (10 - 50) frosted glass diffusion radius
  ambientWhileBrowsing: true  // Keep ambient glow active across Home/Library/Explore
};

const YTAL_PRESETS = {
  subtle: {
    name: 'Subtle Glow',
    description: 'Soft, gentle warmth that accents the player without distraction',
    spread: 30,
    blur: 40,
    brightness: 105,
    contrast: 102,
    saturation: 115,
    smoothness: 80,
    viewportAura: true,
    liquidGlass: true,
    glassOpacity: 38,
    glassBlur: 26,
    ambientWhileBrowsing: true
  },
  balanced: {
    name: 'Balanced (Default)',
    description: 'Expansive room-filling ambiance matching YouTube Ambilight',
    spread: 45,
    blur: 42,
    brightness: 120,
    contrast: 108,
    saturation: 140,
    smoothness: 65,
    viewportAura: true,
    liquidGlass: true,
    glassOpacity: 32,
    glassBlur: 28,
    ambientWhileBrowsing: true
  },
  vivid: {
    name: 'Vivid & Punchy',
    description: 'Deep saturation and high-chroma contrast with radiant edge bloom',
    spread: 60,
    blur: 38,
    brightness: 130,
    contrast: 116,
    saturation: 165,
    smoothness: 50,
    viewportAura: true,
    liquidGlass: true,
    glassOpacity: 28,
    glassBlur: 32,
    ambientWhileBrowsing: true
  },
  immersive: {
    name: 'Liquid Cinema',
    description: 'Ultra-wide edge-to-edge illumination with crystalline optical glass',
    spread: 80,
    blur: 50,
    brightness: 135,
    contrast: 120,
    saturation: 155,
    smoothness: 60,
    viewportAura: true,
    liquidGlass: true,
    glassOpacity: 22,
    glassBlur: 34,
    ambientWhileBrowsing: true
  }
};

if (typeof window !== 'undefined') {
  window.YTAL_DEFAULT_SETTINGS = YTAL_DEFAULT_SETTINGS;
  window.YTAL_PRESETS = YTAL_PRESETS;
}
