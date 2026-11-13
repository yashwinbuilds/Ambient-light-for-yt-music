/**
 * Ambient Light for Anything - YouTube Desktop Adapter
 * Supports www.youtube.com with 60fps video-synchronized Ambilight.
 */

class YouTubeAdapter {
  constructor(settingsController) {
    this.settingsController = settingsController;
    this.ambientEngine = null;
    this.inPageMenu = null;

    this.init();
  }

  async init() {
    console.log('[Ambient-Anything] Initializing YouTube Desktop Adapter...');

    const playerElem = await this.waitForPlayer();
    if (!playerElem) return;

    const initialSettings = await this.settingsController.load();

    this.ambientEngine = new window.YTALAmbientEngine({
      platform: 'youtube',
      playerElem,
      settings: initialSettings,
      sourceProvider: () => this.getSource(),
      isPlayingProvider: () => this.isPlaying(),
      isOpenProvider: () => window.location.pathname.startsWith('/watch')
    });

    this.initControls();
    this.ambientEngine.update();
    console.log('[Ambient-Anything] YouTube Desktop Adapter active and running.');
  }

  waitForPlayer() {
    return new Promise((resolve) => {
      const check = () => document.querySelector('#movie_player, .html5-video-player');
      const existing = check();
      if (existing) return resolve(existing);

      const observer = new MutationObserver(() => {
        const found = check();
        if (found) {
          observer.disconnect();
          resolve(found);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  getSource() {
    const video = document.querySelector('#movie_player video.html5-main-video, video.html5-main-video');
    if (!video || !video.videoWidth || !video.videoHeight || video.readyState < 2) {
      return null;
    }
    return {
      key: `yt_video_${video.currentSrc || 'stream'}`,
      elem: video,
      width: video.videoWidth,
      height: video.videoHeight,
      fit: 'contain',
      isVideo: true
    };
  }

  isPlaying() {
    const video = document.querySelector('video.html5-main-video');
    return video ? (!video.paused && !video.ended) : false;
  }

  initControls() {
    const video = document.querySelector('video.html5-main-video');
    if (video) {
      ['playing', 'seeked', 'loadeddata'].forEach((ev) => {
        video.addEventListener(ev, () => this.ambientEngine.update());
      });
    }

    document.addEventListener('yt-navigate-finish', () => {
      setTimeout(() => this.ambientEngine.update(), 100);
    });
  }
}

if (typeof window !== 'undefined') {
  window.YouTubeAdapter = YouTubeAdapter;
}
