/**
 * Ambient Light for YouTube Music™ - In-Page Quick Access Button & Settings Menu
 * Integrates directly into the YouTube Music bottom player bar.
 */

class YTALInPageMenu {
  constructor(ambientEngine, settingsController, appElem, anchorBtn) {
    this.ambientEngine = ambientEngine;
    this.settingsController = settingsController;
    this.appElem = appElem || document.querySelector('ytmusic-app') || document.body;
    this.isOpen = false;

    if (anchorBtn) {
      this.button = anchorBtn;
      this.button.setAttribute('aria-haspopup', 'dialog');
      this.button.setAttribute('aria-expanded', 'false');
      this.button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMenu();
      });
    } else {
      this.initButton();
      this.initAppObserver();
    }

    this.initMenu();
    this.updateUI(this.settingsController.get());
  }

  createSvgIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('fill', 'currentColor');

    // Ambient light monitor icon with radiating beams
    svg.innerHTML = `
      <path d="M8 8h8a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm1 2v4h6v-4H9ZM11 2h2v3h-2V2Zm0 17h2v3h-2v-3ZM2 11h3v2H2v-2Zm17 0h3v2h-3v-2ZM4.22 5.64l1.42-1.42 2.12 2.12-1.42 1.42-2.12-2.12Zm12.02 12.02 1.42-1.42 2.12 2.12-1.42 1.42-2.12-2.12Zm-12.02 0 2.12-2.12 1.42 1.42-2.12 2.12-1.42-1.42ZM16.24 6.34l2.12-2.12 1.42 1.42-2.12 2.12-1.42-1.42Z"/>
    `;
    return svg;
  }

  initButton() {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.className = 'ytal-btn ytal-btn--playerbar';
    this.button.title = 'Ambient Light Settings';
    this.button.setAttribute('aria-label', 'Ambient Light Settings');
    this.button.setAttribute('aria-haspopup', 'dialog');
    this.button.setAttribute('aria-expanded', 'false');

    this.button.appendChild(this.createSvgIcon());

    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    this.insertButton();
  }

  insertButton() {
    if (this.button.isConnected) return;

    const playerBar = this.appElem.querySelector('ytmusic-player-bar:not(#top-player-bar)');
    if (!playerBar) return;

    // Try finding candidate locations in player bar
    const buttonsContainer = playerBar.querySelector('.right-controls-buttons');
    if (buttonsContainer) {
      const expandBtn = buttonsContainer.querySelector('.expand-button');
      buttonsContainer.insertBefore(this.button, expandBtn || buttonsContainer.firstChild);
      return;
    }

    const miniplayerRight = this.appElem.querySelector('ytmusic-miniplayer .ytMusicMiniPlayerRightSection');
    if (miniplayerRight) {
      const volumeWrapper = miniplayerRight.querySelector('.ytMusicMiniPlayerVolumeWrapper');
      miniplayerRight.insertBefore(this.button, volumeWrapper || miniplayerRight.firstChild);
      return;
    }

    const volumeElem = playerBar.querySelector('.volume');
    if (volumeElem && volumeElem.parentElement) {
      volumeElem.parentElement.insertBefore(this.button, volumeElem);
      return;
    }

    const rightControls = playerBar.querySelector('.right-controls');
    if (rightControls) {
      rightControls.appendChild(this.button);
    }
  }

  initAppObserver() {
    this.appObserver = new MutationObserver(() => {
      if (!this.button.isConnected) {
        this.insertButton();
      }
    });
    this.appObserver.observe(this.appElem, { childList: true, subtree: true });
  }

  initMenu() {
    this.menu = document.createElement('div');
    this.menu.className = 'ytal-menu';
    this.menu.setAttribute('role', 'dialog');
    this.menu.setAttribute('aria-label', 'Ambient Light Controls');
    this.menu.hidden = true;

    this.menu.innerHTML = `
      <div class="ytal-menu__header">
        <div class="ytal-menu__title-row">
          <span class="ytal-menu__title">Ambient Light</span>
          <span class="ytal-menu__badge">v1.1</span>
        </div>
        <div class="ytal-menu__subtitle">Full-Screen Ambiance + Liquid Glass</div>
      </div>

      <div class="ytal-menu__section ytal-menu__section--toggle">
        <div class="ytal-menu__toggle-label">
          <span>Active Ambient Mode</span>
          <span class="ytal-menu__hint">Full-screen ambient illumination</span>
        </div>
        <label class="ytal-switch">
          <input type="checkbox" id="ytal-toggle-enabled">
          <span class="ytal-switch__slider"></span>
        </label>
      </div>

      <div class="ytal-menu__section" id="ytal-controls-group">
        <div class="ytal-menu__label">Preset</div>
        <div class="ytal-preset-grid">
          <button type="button" class="ytal-preset-btn" data-preset="subtle">Subtle</button>
          <button type="button" class="ytal-preset-btn" data-preset="balanced">Balanced</button>
          <button type="button" class="ytal-preset-btn" data-preset="vivid">Vivid</button>
          <button type="button" class="ytal-preset-btn" data-preset="immersive">Cinema</button>
        </div>

        <div class="ytal-slider-group">
          <div class="ytal-slider-item">
            <div class="ytal-slider-item__header">
              <span>Spread</span>
              <span class="ytal-slider-item__val" id="ytal-val-spread">45%</span>
            </div>
            <input type="range" class="ytal-range" id="ytal-range-spread" min="10" max="150" step="1">
          </div>

          <div class="ytal-slider-item">
            <div class="ytal-slider-item__header">
              <span>Blur & Softness</span>
              <span class="ytal-slider-item__val" id="ytal-val-blur">42%</span>
            </div>
            <input type="range" class="ytal-range" id="ytal-range-blur" min="15" max="80" step="1">
          </div>

          <div class="ytal-slider-item">
            <div class="ytal-slider-item__header">
              <span>Brightness</span>
              <span class="ytal-slider-item__val" id="ytal-val-brightness">115%</span>
            </div>
            <input type="range" class="ytal-range" id="ytal-range-brightness" min="50" max="180" step="5">
          </div>

          <div class="ytal-slider-item">
            <div class="ytal-slider-item__header">
              <span>Saturation</span>
              <span class="ytal-slider-item__val" id="ytal-val-saturation">135%</span>
            </div>
            <input type="range" class="ytal-range" id="ytal-range-saturation" min="50" max="200" step="5">
          </div>

          <div class="ytal-slider-item">
            <div class="ytal-slider-item__header">
              <span>Smoothness</span>
              <span class="ytal-slider-item__val" id="ytal-val-smoothness">65%</span>
            </div>
            <input type="range" class="ytal-range" id="ytal-range-smoothness" min="0" max="95" step="5">
          </div>
        </div>

        <!-- LIQUID GLASS TRANSLUCENCY CONTROLS -->
        <div class="ytal-menu__section ytal-menu__section--inline">
          <div class="ytal-menu__toggle-label">
            <span>Liquid Glass Mode</span>
            <span class="ytal-menu__hint">Ultra-transparent frosted UI across all of YT Music</span>
          </div>
          <label class="ytal-switch">
            <input type="checkbox" id="ytal-toggle-glass">
            <span class="ytal-switch__slider"></span>
          </label>
        </div>

        <div id="ytal-glass-controls" class="ytal-slider-group" style="margin-top: 10px;">
          <div class="ytal-slider-item">
            <div class="ytal-slider-item__header">
              <span>Glass Transparency</span>
              <span class="ytal-slider-item__val" id="ytal-val-opacity">32%</span>
            </div>
            <input type="range" class="ytal-range" id="ytal-range-opacity" min="10" max="70" step="2">
          </div>

          <div class="ytal-slider-item">
            <div class="ytal-slider-item__header">
              <span>Glass Frosted Blur</span>
              <span class="ytal-slider-item__val" id="ytal-val-glassblur">28px</span>
            </div>
            <input type="range" class="ytal-range" id="ytal-range-glassblur" min="10" max="50" step="2">
          </div>

          <div class="ytal-menu__section ytal-menu__section--inline" style="margin-top: 8px;">
            <div class="ytal-menu__toggle-label">
              <span>Glow While Browsing</span>
              <span class="ytal-menu__hint">Ambient aura active on Home/Explore/Library</span>
            </div>
            <label class="ytal-switch">
              <input type="checkbox" id="ytal-toggle-browsing">
              <span class="ytal-switch__slider"></span>
            </label>
          </div>
        </div>

        <!-- FEATURE TOGGLE: BLACK BARS -->
        <div class="ytal-menu__section ytal-menu__section--inline">
          <div class="ytal-menu__toggle-label">
            <span>Remove Black Bars</span>
            <span class="ytal-menu__hint">Autoclip letterboxing in music videos</span>
          </div>
          <label class="ytal-switch">
            <input type="checkbox" id="ytal-toggle-bars">
            <span class="ytal-switch__slider"></span>
          </label>
        </div>
      </div>
    `;

    document.body.appendChild(this.menu);
    this.bindMenuEvents();
  }

  bindMenuEvents() {
    const $ = (sel) => this.menu.querySelector(sel);

    // Master toggle
    $('#ytal-toggle-enabled').addEventListener('change', (e) => {
      this.settingsController.set({ enabled: e.target.checked });
    });

    // Liquid Glass toggle
    $('#ytal-toggle-glass').addEventListener('change', (e) => {
      this.settingsController.set({ liquidGlass: e.target.checked });
    });

    // Ambient while browsing toggle
    $('#ytal-toggle-browsing').addEventListener('change', (e) => {
      this.settingsController.set({ ambientWhileBrowsing: e.target.checked });
    });

    // Black bars toggle
    $('#ytal-toggle-bars').addEventListener('change', (e) => {
      this.settingsController.set({ detectBlackBars: e.target.checked });
    });

    // Preset buttons
    this.menu.querySelectorAll('.ytal-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        this.settingsController.applyPreset(preset);
      });
    });

    // Standard Sliders
    const bindSlider = (name) => {
      const range = $(`#ytal-range-${name}`);
      const valDisplay = $(`#ytal-val-${name}`);
      range.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        valDisplay.textContent = `${val}%`;
        this.settingsController.set({ [name]: val, preset: 'custom' });
      });
    };
    ['spread', 'blur', 'brightness', 'saturation', 'smoothness'].forEach(bindSlider);

    // Liquid Glass Sliders
    $('#ytal-range-opacity').addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      $('#ytal-val-opacity').textContent = `${val}%`;
      this.settingsController.set({ glassOpacity: val });
    });

    $('#ytal-range-glassblur').addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      $('#ytal-val-glassblur').textContent = `${val}px`;
      this.settingsController.set({ glassBlur: val });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.menu.contains(e.target) && !this.button.contains(e.target)) {
        this.closeMenu();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.closeMenu();
      }
    });
  }

  updateUI(settings) {
    if (!this.menu) return;
    const $ = (sel) => this.menu.querySelector(sel);

    // Button active state
    this.button.classList.toggle('ytal-btn--active', Boolean(settings.enabled));

    // Master toggle
    $('#ytal-toggle-enabled').checked = Boolean(settings.enabled);

    // Controls container visibility
    const controlsGroup = $('#ytal-controls-group');
    controlsGroup.classList.toggle('ytal-controls-group--disabled', !settings.enabled);

    // Liquid Glass state
    $('#ytal-toggle-glass').checked = Boolean(settings.liquidGlass);
    $('#ytal-controls-group').classList.toggle('ytal-glass-disabled', !settings.liquidGlass);
    $('#ytal-toggle-browsing').checked = Boolean(settings.ambientWhileBrowsing);

    const opacityRange = $('#ytal-range-opacity');
    const opacityVal = $('#ytal-val-opacity');
    if (opacityRange && opacityVal && settings.glassOpacity !== undefined) {
      opacityRange.value = settings.glassOpacity;
      opacityVal.textContent = `${settings.glassOpacity}%`;
    }

    const glassBlurRange = $('#ytal-range-glassblur');
    const glassBlurVal = $('#ytal-val-glassblur');
    if (glassBlurRange && glassBlurVal && settings.glassBlur !== undefined) {
      glassBlurRange.value = settings.glassBlur;
      glassBlurVal.textContent = `${settings.glassBlur}px`;
    }

    // Black bars
    $('#ytal-toggle-bars').checked = Boolean(settings.detectBlackBars);

    // Presets active class
    this.menu.querySelectorAll('.ytal-preset-btn').forEach((btn) => {
      const p = btn.getAttribute('data-preset');
      btn.classList.toggle('ytal-preset-btn--active', settings.preset === p);
    });

    // Sliders & value displays
    ['spread', 'blur', 'brightness', 'saturation', 'smoothness'].forEach((name) => {
      const range = $(`#ytal-range-${name}`);
      const valDisplay = $(`#ytal-val-${name}`);
      if (range && valDisplay && settings[name] !== undefined) {
        range.value = settings[name];
        valDisplay.textContent = `${settings[name]}%`;
      }
    });
  }

  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.isOpen = true;
    this.menu.hidden = false;
    this.button.setAttribute('aria-expanded', 'true');
    this.positionMenu();
  }

  closeMenu() {
    this.isOpen = false;
    this.menu.hidden = true;
    this.button.setAttribute('aria-expanded', 'false');
  }

  positionMenu() {
    const btnRect = this.button.getBoundingClientRect();
    const menuWidth = 330;
    const menuHeight = this.menu.offsetHeight || 520;

    // Anchor menu above the button
    let left = btnRect.left + (btnRect.width / 2) - (menuWidth / 2);
    // Keep inside viewport horizontally
    left = Math.max(16, Math.min(window.innerWidth - menuWidth - 16, left));

    let top = btnRect.top - menuHeight - 12;
    if (top < 16) {
      // If doesn't fit on top, display slightly shifted
      top = Math.max(16, btnRect.bottom + 12);
    }

    this.menu.style.left = `${Math.round(left)}px`;
    this.menu.style.top = `${Math.round(top)}px`;
  }
}

if (typeof window !== 'undefined') {
  window.YTALInPageMenu = YTALInPageMenu;
}
