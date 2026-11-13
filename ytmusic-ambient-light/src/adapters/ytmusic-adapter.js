/**
 * Ambient Light for Anything - YouTube Music™ Adapter
 * Supports music.youtube.com with 3-tier projection, Liquid Glass player bar,
 * and seamless navigation isolation.
 */

class YTMusicAdapter {
  constructor(settingsController) {
    this.settingsController = settingsController;
    this.ambientEngine = null;
    this.inPageMenu = null;

    this.init();
  }

  async init() {
    console.log('[Ambient-Anything] Initializing YouTube Music Adapter...');

    const elems = await this.waitForPlayer();
    if (!elems) return;

    const { appElem, playerPageElem, playerElem } = elems;
    const initialSettings = await this.settingsController.load();

    this.ambientEngine = new window.YTALAmbientEngine({
      platform: 'ytmusic',
      playerPageElem,
      playerElem,
      settings: initialSettings
    });

    this.inPageMenu = new window.YTALInPageMenu(
      this.ambientEngine,
      this.settingsController,
      appElem
    );

    window.__YTAL_ENGINE__ = this.ambientEngine;
    window.__YTAL_MENU__ = this.inPageMenu;
    console.log('[Ambient-Anything] YouTube Music Adapter active and running.');
  }

  findPlayerElements() {
    const appElem = document.querySelector('ytmusic-app');
    const playerPageElem = document.querySelector('ytmusic-app ytmusic-player-page, ytmusic-player-page#player-page');
    const playerElem = playerPageElem?.querySelector('ytmusic-player#player') || document.querySelector('ytmusic-player#player');

    if (!appElem || !playerPageElem || !playerElem) {
      return null;
    }
    return { appElem, playerPageElem, playerElem };
  }

  waitForPlayer() {
    return new Promise((resolve) => {
      const existing = this.findPlayerElements();
      if (existing) return resolve(existing);

      const observer = new MutationObserver(() => {
        const found = this.findPlayerElements();
        if (found) {
          observer.disconnect();
          resolve(found);
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    });
  }
}

if (typeof window !== 'undefined') {
  window.YTMusicAdapter = YTMusicAdapter;
}
