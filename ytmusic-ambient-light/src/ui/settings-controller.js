/**
 * Ambient Light for YouTube Music™ - Settings Controller
 * Synchronizes user settings across Chrome storage, the in-page menu, and the toolbar popup.
 */

class YTALSettingsController {
  constructor(onChange) {
    this.onChange = onChange;
    this.settings = { ...window.YTAL_DEFAULT_SETTINGS };
    this.saveTimeout = null;
    this.storageKey = 'ambientSettings';

    this.initStorageListener();
  }

  async load() {
    try {
      const result = await chrome.storage.sync.get(this.storageKey);
      if (result && result[this.storageKey]) {
        this.settings = { ...window.YTAL_DEFAULT_SETTINGS, ...result[this.storageKey] };
      }
    } catch {
      try {
        const localResult = await chrome.storage.local.get(this.storageKey);
        if (localResult && localResult[this.storageKey]) {
          this.settings = { ...window.YTAL_DEFAULT_SETTINGS, ...localResult[this.storageKey] };
        }
      } catch (err) {
        console.warn('[AmbientLight-YTM] Storage load fallback to defaults:', err);
      }
    }
    return this.settings;
  }

  initStorageListener() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (changes[this.storageKey] && changes[this.storageKey].newValue) {
        this.settings = { ...this.settings, ...changes[this.storageKey].newValue };
        if (typeof this.onChange === 'function') {
          this.onChange(this.settings);
        }
      }
    });
  }

  get() {
    return { ...this.settings };
  }

  set(partial) {
    this.settings = { ...this.settings, ...partial };
    if (typeof this.onChange === 'function') {
      this.onChange(this.settings);
    }
    this.scheduleSave();
  }

  applyPreset(presetKey) {
    if (window.YTAL_PRESETS && window.YTAL_PRESETS[presetKey]) {
      const p = window.YTAL_PRESETS[presetKey];
      this.set({
        preset: presetKey,
        spread: p.spread,
        blur: p.blur,
        brightness: p.brightness,
        contrast: p.contrast,
        saturation: p.saturation,
        smoothness: p.smoothness
      });
    }
  }

  scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      try {
        await chrome.storage.sync.set({ [this.storageKey]: this.settings });
      } catch {
        try {
          await chrome.storage.local.set({ [this.storageKey]: this.settings });
        } catch (err) {
          console.error('[AmbientLight-YTM] Failed to persist settings:', err);
        }
      }
    }, 250);
  }
}

if (typeof window !== 'undefined') {
  window.YTALSettingsController = YTALSettingsController;
}
