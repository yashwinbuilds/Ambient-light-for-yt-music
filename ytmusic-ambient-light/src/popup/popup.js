/**
 * Ambient Light for YouTube Music™ - Popup Controller
 */

(async function initPopup() {
  const STORAGE_KEY = 'ambientSettings';
  let currentSettings = { ...window.YTAL_DEFAULT_SETTINGS };
  let saveTimeout = null;

  const $ = (sel) => document.querySelector(sel);

  // 1. Load initial settings
  async function loadSettings() {
    try {
      const res = await chrome.storage.sync.get(STORAGE_KEY);
      if (res && res[STORAGE_KEY]) {
        currentSettings = { ...window.YTAL_DEFAULT_SETTINGS, ...res[STORAGE_KEY] };
      }
    } catch {
      try {
        const localRes = await chrome.storage.local.get(STORAGE_KEY);
        if (localRes && localRes[STORAGE_KEY]) {
          currentSettings = { ...window.YTAL_DEFAULT_SETTINGS, ...localRes[STORAGE_KEY] };
        }
      } catch (err) {
        console.warn('Fallback to defaults', err);
      }
    }
    renderUI();
  }

  // 2. Render UI
  function renderUI() {
    $('#toggle-enabled').checked = Boolean(currentSettings.enabled);
    $('#controls-body').classList.toggle('controls-body--disabled', !currentSettings.enabled);

    $('#toggle-bars').checked = Boolean(currentSettings.detectBlackBars);
    $('#toggle-glass').checked = Boolean(currentSettings.liquidGlass);
    $('#toggle-browsing').checked = Boolean(currentSettings.ambientWhileBrowsing);

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      const p = btn.getAttribute('data-preset');
      btn.classList.toggle('preset-btn--active', currentSettings.preset === p);
    });

    // Sliders
    ['spread', 'blur', 'brightness', 'saturation', 'smoothness'].forEach((name) => {
      const range = $(`#range-${name}`);
      const val = $(`#val-${name}`);
      if (range && val && currentSettings[name] !== undefined) {
        range.value = currentSettings[name];
        val.textContent = `${currentSettings[name]}%`;
      }
    });

    // Glass Sliders
    const opRange = $('#range-opacity');
    const opVal = $('#val-opacity');
    if (opRange && opVal && currentSettings.glassOpacity !== undefined) {
      opRange.value = currentSettings.glassOpacity;
      opVal.textContent = `${currentSettings.glassOpacity}%`;
    }

    const blurRange = $('#range-glassblur');
    const blurVal = $('#val-glassblur');
    if (blurRange && blurVal && currentSettings.glassBlur !== undefined) {
      blurRange.value = currentSettings.glassBlur;
      blurVal.textContent = `${currentSettings.glassBlur}px`;
    }
  }

  // 3. Persist settings with debouncing
  function persistSettings() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      try {
        await chrome.storage.sync.set({ [STORAGE_KEY]: currentSettings });
      } catch {
        try {
          await chrome.storage.local.set({ [STORAGE_KEY]: currentSettings });
        } catch (err) {
          console.error('Failed to save settings:', err);
        }
      }
    }, 150);
  }

  // 4. Bind Events
  function bindEvents() {
    $('#toggle-enabled').addEventListener('change', (e) => {
      currentSettings.enabled = e.target.checked;
      renderUI();
      persistSettings();
    });

    $('#toggle-bars').addEventListener('change', (e) => {
      currentSettings.detectBlackBars = e.target.checked;
      persistSettings();
    });

    $('#toggle-glass').addEventListener('change', (e) => {
      currentSettings.liquidGlass = e.target.checked;
      persistSettings();
    });

    $('#toggle-browsing').addEventListener('change', (e) => {
      currentSettings.ambientWhileBrowsing = e.target.checked;
      persistSettings();
    });

    $('#range-opacity').addEventListener('input', (e) => {
      const num = parseInt(e.target.value, 10);
      $('#val-opacity').textContent = `${num}%`;
      currentSettings.glassOpacity = num;
      persistSettings();
    });

    $('#range-glassblur').addEventListener('input', (e) => {
      const num = parseInt(e.target.value, 10);
      $('#val-glassblur').textContent = `${num}px`;
      currentSettings.glassBlur = num;
      persistSettings();
    });

    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const presetKey = btn.getAttribute('data-preset');
        if (window.YTAL_PRESETS && window.YTAL_PRESETS[presetKey]) {
          const p = window.YTAL_PRESETS[presetKey];
          currentSettings = {
            ...currentSettings,
            preset: presetKey,
            spread: p.spread,
            blur: p.blur,
            brightness: p.brightness,
            contrast: p.contrast,
            saturation: p.saturation,
            smoothness: p.smoothness
          };
          renderUI();
          persistSettings();
        }
      });
    });

    ['spread', 'blur', 'brightness', 'saturation', 'smoothness'].forEach((name) => {
      const range = $(`#range-${name}`);
      const val = $(`#val-${name}`);
      range.addEventListener('input', (e) => {
        const num = parseInt(e.target.value, 10);
        val.textContent = `${num}%`;
        currentSettings[name] = num;
        currentSettings.preset = 'custom';
        // unmark preset buttons
        document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('preset-btn--active'));
        persistSettings();
      });
    });
  }

  // 5. Detect if YouTube Music tab is active
  async function checkActiveTab() {
    try {
      const tabs = await chrome.tabs.query({ url: '*://music.youtube.com/*' });
      const statusIndicator = $('#status-indicator');
      const statusText = $('#status-text');

      if (tabs && tabs.length > 0) {
        statusText.textContent = `YT Music active (${tabs.length})`;
        statusIndicator.classList.remove('status-indicator--inactive');
      } else {
        statusText.textContent = 'YT Music not open';
        statusIndicator.classList.add('status-indicator--inactive');
      }
    } catch {
      // Ignore tabs permission limitations
    }
  }

  await loadSettings();
  bindEvents();
  checkActiveTab();
})();
