/**
 * Ambient Light for Anything - Spotify Web Player Adapter
 * Supports open.spotify.com with real-time album art / Canvas video sampling,
 * Liquid Glass styling, and in-player settings menu.
 */

class SpotifyAdapter {
  constructor(settingsController) {
    this.settingsController = settingsController;
    this.ambientEngine = null;
    this.inPageMenu = null;
    this.button = null;

    this.init();
  }

  async init() {
    console.log('[Ambient-Anything] Initializing Spotify Web Adapter...');
    if (document.body) {
      document.body.classList.add('ytal-spotify-active');
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body?.classList.add('ytal-spotify-active');
      });
    }

    // Wait for Spotify UI to mount
    await this.waitForSpotify();

    const initialSettings = await this.settingsController.load();

    // Instantiate ambient engine with Spotify provider
    this.ambientEngine = new window.YTALAmbientEngine({
      platform: 'spotify',
      settings: initialSettings,
      sourceProvider: () => this.getSource(),
      isPlayingProvider: () => this.isPlaying(),
      isOpenProvider: () => true // Spotify is always active when playing
    });

    // Mount settings button into player bar
    this.initPlayerBarButton();

    // Track observers
    this.initObservers();

    // Initial render
    this.ambientEngine.update();
    console.log('[Ambient-Anything] Spotify Web Adapter active and running.');
  }

  waitForSpotify() {
    return new Promise((resolve) => {
      const check = () => {
        const bar = document.querySelector('footer[data-testid="now-playing-bar"], .Root__now-playing-bar, [data-testid="now-playing-widget"]');
        if (bar) return true;
        return false;
      };

      if (check()) return resolve();

      const observer = new MutationObserver(() => {
        if (check()) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  getSource() {
    // 1. Check for Spotify Canvas Video in Now Playing view
    const canvasVideo = document.querySelector('[data-testid="canvas-video"], [data-testid="now-playing-view"] video');
    if (canvasVideo && canvasVideo.videoWidth && canvasVideo.videoHeight && canvasVideo.readyState >= 2) {
      return {
        key: `spotify_canvas_${canvasVideo.currentSrc || 'stream'}`,
        elem: canvasVideo,
        width: canvasVideo.videoWidth,
        height: canvasVideo.videoHeight,
        fit: 'cover',
        isVideo: true
      };
    }

    // 2. Check for large cover art in Now Playing view / right sidebar
    let cover = document.querySelector('[data-testid="now-playing-view"] img, aside[aria-label="Now playing view"] img');

    // 3. Fallback to bottom player bar cover art
    if (!cover || !cover.complete || (cover.naturalWidth && cover.naturalWidth <= 1)) {
      cover = document.querySelector('[data-testid="cover-art-image"], [data-testid="now-playing-widget"] img, footer[data-testid="now-playing-bar"] img');
    }

    if (!cover || !cover.complete || (cover.naturalWidth && cover.naturalWidth <= 1)) {
      return null;
    }

    return {
      key: `spotify_cover_${cover.currentSrc || cover.src}`,
      elem: cover,
      width: cover.naturalWidth || 300,
      height: cover.naturalHeight || 300,
      fit: 'cover',
      isVideo: false
    };
  }

  isPlaying() {
    const playPauseBtn = document.querySelector('button[data-testid="control-button-playpause"]');
    if (playPauseBtn) {
      const label = playPauseBtn.getAttribute('aria-label') || playPauseBtn.title || '';
      if (label.toLowerCase().includes('pause')) return true;
      if (label.toLowerCase().includes('play')) return false;
    }
    if (navigator.mediaSession && navigator.mediaSession.playbackState) {
      return navigator.mediaSession.playbackState === 'playing';
    }
    const audio = document.querySelector('audio');
    if (audio) return !audio.paused;
    return true;
  }

  initObservers() {
    // 1. Observe Now Playing Bar for track changes
    const widget = document.querySelector('[data-testid="now-playing-widget"]') || document.querySelector('footer[data-testid="now-playing-bar"]') || document.body;
    this.trackObserver = new MutationObserver(() => {
      this.ambientEngine.update();
    });
    this.trackObserver.observe(widget, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'href']
    });

    // 2. Observe Play/Pause Button
    const playPauseBtn = document.querySelector('button[data-testid="control-button-playpause"]');
    if (playPauseBtn) {
      this.playPauseObserver = new MutationObserver(() => {
        this.ambientEngine.update();
      });
      this.playPauseObserver.observe(playPauseBtn, {
        attributes: true,
        attributeFilter: ['aria-label', 'title']
      });
    }

    // 3. Window resize
    window.addEventListener('resize', () => {
      this.ambientEngine.scheduleLayoutUpdate();
    });
  }

  initPlayerBarButton() {
    const mount = () => {
      if (this.button && this.button.isConnected) return;

      const rightControls = document.querySelector(
        '[data-testid="playback-extra-controls"], .Root__right-controls, footer [data-testid="now-playing-bar"] > div:last-child, .now-playing-bar-segment--right'
      );
      if (!rightControls) return;

      this.button = document.createElement('button');
      this.button.id = 'ytal-spotify-btn';
      this.button.type = 'button';
      this.button.className = 'ytal-btn--spotify';
      this.button.title = 'Ambient Light Settings';
      this.button.setAttribute('aria-label', 'Ambient Light Settings');
      this.button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 8h8a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm1 2v4h6v-4H9ZM11 2h2v3h-2V2Zm0 17h2v3h-2v-3ZM2 11h3v2H2v-2Zm17 0h3v2h-3v-2ZM4.22 5.64l1.42-1.42 2.12 2.12-1.42 1.42-2.12-2.12Zm12.02 12.02 1.42-1.42 2.12 2.12-1.42 1.42-2.12-2.12Zm-12.02 0 2.12-2.12 1.42 1.42-2.12 2.12-1.42-1.42ZM16.24 6.34l2.12-2.12 1.42 1.42-2.12 2.12-1.42-1.42Z"/>
        </svg>
      `;

      this.button.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.inPageMenu) {
          this.inPageMenu.toggleMenu();
        }
      });

      const queueBtn = rightControls.querySelector('[data-testid="control-button-queue"], [data-testid="lyrics-button"]');
      rightControls.insertBefore(this.button, queueBtn || rightControls.firstChild);

      // Mount floating settings menu
      this.inPageMenu = new window.YTALInPageMenu(
        this.ambientEngine,
        this.settingsController,
        document.body,
        this.button
      );
    };

    mount();
    const btnObserver = new MutationObserver(() => mount());
    btnObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }
}

if (typeof window !== 'undefined') {
  window.SpotifyAdapter = SpotifyAdapter;
}
