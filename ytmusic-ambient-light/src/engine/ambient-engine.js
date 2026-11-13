/**
 * Ambient Light for YouTube Music™ - Core Ambient Engine
 * Responsible for media sampling, hardware-accelerated 3-tier canvas projection
 * (Viewport Atmosphere + Expansive Far Halo + Crisp Near Bloom), frame blending,
 * and seamless integration with the YouTube Music player lifecycle.
 */

class YTALAmbientEngine {
  constructor(arg1, arg2, arg3) {
    let opts = {};
    if (arg1 && typeof arg1 === 'object' && !arg1.tagName && !arg1.nodeType) {
      opts = arg1;
    } else {
      opts = {
        playerPageElem: arg1,
        playerElem: arg2,
        settings: arg3,
        platform: 'ytmusic'
      };
    }

    this.options = opts;
    this.platform = opts.platform || 'ytmusic';
    this.playerPageElem = opts.playerPageElem || null;
    this.playerElem = opts.playerElem || null;
    this.sourceProvider = opts.sourceProvider || null;
    this.isPlayingProvider = opts.isPlayingProvider || null;
    this.isOpenProvider = opts.isOpenProvider || null;
    this.settings = { ...window.YTAL_DEFAULT_SETTINGS, ...opts.settings };

    this.BUFFER_WIDTH = 64;
    this.TRANSITION_FRAMES = 24;
    this.BARS_CLIP_MARGIN = 2; // px

    this.enabled = false;
    this.isVideoMode = false;
    this.isPlayerPageOpen = false;
    this.isFullscreen = false;
    this.currentSourceKey = null;
    this.transitionFramesLeft = 0;
    this.scheduledFrameId = null;
    this.scheduledVideoFrameId = null;
    this.scheduledLayoutId = null;
    this.barsClip = { horizontal: 0, vertical: 0 };

    this.barDetector = new window.YTALBarDetection();

    this.initDOM();
    this.initObservers();
    this.applySettings(this.settings);
  }

  get videoElem() {
    return this.playerElem ? this.playerElem.querySelector('#song-video video.html5-main-video, #song-video video') : null;
  }

  get coverElem() {
    return this.playerElem ? this.playerElem.querySelector('#song-image img, #thumbnail img') : null;
  }

  initDOM() {
    // 1. Root container attached to body
    this.container = document.createElement('div');
    this.container.className = 'ytal-music';
    this.container.setAttribute('aria-hidden', 'true');

    // 2. Full-Screen Viewport Backdrop Canvas (Atmosphere Wash across entire display)
    this.viewportCanvas = document.createElement('canvas');
    this.viewportCanvas.className = 'ytal-music__viewport-aura';
    this.viewportCanvas.width = 128;
    this.viewportCanvas.height = 128;
    this.viewportCtx = this.viewportCanvas.getContext('2d', { alpha: false });
    this.container.appendChild(this.viewportCanvas);

    // 3. Localized Glow Wrapper tracking the media bounding box
    this.glowWrapper = document.createElement('div');
    this.glowWrapper.className = 'ytal-music__glow';
    this.container.appendChild(this.glowWrapper);

    // 4. Offscreen sampling buffer
    this.buffer = document.createElement('canvas');
    this.buffer.width = this.BUFFER_WIDTH;
    this.buffer.height = this.BUFFER_WIDTH;
    this.bufferCtx = this.buffer.getContext('2d', { alpha: false, willReadFrequently: true });

    // 5. Dual Projection Layers inside the glow wrapper:
    //    Far: Expansive volumetric aura
    //    Near: High-vibrancy edge contour
    this.layers = ['far', 'near'].map((type) => {
      const canvas = document.createElement('canvas');
      canvas.className = `ytal-music__layer ytal-music__layer--${type}`;
      this.glowWrapper.appendChild(canvas);
      return {
        type,
        canvas,
        ctx: canvas.getContext('2d', { alpha: false })
      };
    });

    // Insert ambient container as the first element of document body (behind ytmusic-app)
    if (document.body.firstChild) {
      document.body.insertBefore(this.container, document.body.firstChild);
    } else {
      document.body.appendChild(this.container);
    }
  }

  initObservers() {
    // 1. Observer for Player State & Mode changes
    if (this.playerElem) {
      this.playerObserver = new MutationObserver(() => this.update());
      this.playerObserver.observe(this.playerElem, {
        attributes: true,
        attributeFilter: ['video-mode', 'player-page-open', 'player-ui-state', 'is-open']
      });
    }

    if (this.playerPageElem && this.playerPageElem !== this.playerElem) {
      this.playerPageObserver = new MutationObserver(() => this.update());
      this.playerPageObserver.observe(this.playerPageElem, {
        attributes: true,
        attributeFilter: ['is-open', 'opened', 'player-ui-state']
      });
    }

    // 2. SPA Navigation Events (Home / Explore / Library / Watch transitions)
    this.onNavigate = () => {
      setTimeout(() => this.update(), 50);
    };
    window.addEventListener('popstate', this.onNavigate);
    document.addEventListener('yt-navigate-finish', this.onNavigate);

    // 3. Observer for Album Art changes
    if (this.playerElem) {
      this.coverContainer = this.playerElem.querySelector('#song-image') || this.playerElem;
      this.coverObserver = new MutationObserver(() => this.update());
      this.coverObserver.observe(this.coverContainer, {
        attributes: true,
        attributeFilter: ['src', 'currentSrc'],
        childList: true,
        subtree: true
      });

      this.onCoverLoad = () => this.update();
      this.coverContainer.addEventListener('load', this.onCoverLoad, { capture: true });
    }

    // 4. Layout changes (window resize, side panel toggles)
    this.resizeObserver = new ResizeObserver(() => this.scheduleLayoutUpdate());
    if (this.playerPageElem) this.resizeObserver.observe(this.playerPageElem);
    if (this.playerElem) this.resizeObserver.observe(this.playerElem);
    window.addEventListener('resize', () => this.scheduleLayoutUpdate());

    // 5. Page transitions & scrolling
    this.onTransitionEnd = () => this.scheduleLayoutUpdate();
    if (this.playerPageElem) {
      this.playerPageElem.addEventListener('transitionend', this.onTransitionEnd);
      this.playerPageElem.addEventListener('animationend', this.onTransitionEnd);
      this.onScroll = () => this.scheduleLayoutUpdate();
      this.playerPageElem.addEventListener('scroll', this.onScroll, { passive: true, capture: true });
    }

    // 5. Video Media Events
    this.onVideoEvent = (e) => {
      if (e.type === 'playing' || e.type === 'seeked' || e.type === 'loadeddata') {
        this.update();
      } else if (e.type === 'pause' || e.type === 'ended') {
        this.cancelScheduledVideoFrame();
      }
    };
    if (this.playerElem) {
      this.playerElem.addEventListener('playing', this.onVideoEvent, { capture: true });
      this.playerElem.addEventListener('seeked', this.onVideoEvent, { capture: true });
      this.playerElem.addEventListener('loadeddata', this.onVideoEvent, { capture: true });
      this.playerElem.addEventListener('pause', this.onVideoEvent, { capture: true });
      this.playerElem.addEventListener('ended', this.onVideoEvent, { capture: true });
      this.playerElem.addEventListener('resize', this.onVideoEvent, { capture: true });
    }

    // 6. Tab Visibility (Pause rendering when tab is hidden to save 100% GPU)
    this.onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        this.cancelScheduledDraw();
        this.cancelScheduledVideoFrame();
      } else {
        this.update();
      }
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  applySettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    const {
      spread,
      blur,
      brightness,
      contrast,
      saturation,
      viewportAura,
      enabled,
      liquidGlass,
      glassOpacity,
      glassBlur
    } = this.settings;

    // Apply CSS custom properties for hardware transforms
    this.container.style.setProperty('--ytal-spread', (spread / 100).toFixed(3));
    this.container.style.setProperty('--ytal-blur', (blur / 100).toFixed(3));
    this.container.style.setProperty('--ytal-viewport-opacity', viewportAura ? '0.85' : '0');

    // Liquid Glass CSS Variables
    const opacityVal = (Math.max(8, Math.min(80, glassOpacity || 32)) / 100).toFixed(2);
    const blurVal = Math.max(8, Math.min(60, glassBlur || 28));
    document.documentElement.style.setProperty('--ytal-glass-opacity', opacityVal);
    document.documentElement.style.setProperty('--ytal-glass-blur', `${blurVal}px`);

    // Toggle Liquid Glass Class
    document.body.classList.toggle('ytal-liquid-glass', Boolean(enabled && liquidGlass));

    // High performance CSS filter string
    const filters = [];
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
    const filterSuffix = filters.length > 0 ? ' ' + filters.join(' ') : '';

    this.glowWrapper.style.filter = filters.length > 0 ? filters.join(' ') : 'none';
    this.viewportCanvas.style.filter = `blur(70px)${filterSuffix}`;

    if (!enabled) {
      this.hide();
    } else {
      this.update();
    }
  }

  getSource() {
    if (this.sourceProvider) {
      return this.sourceProvider();
    }

    if (!this.playerElem) return null;

    this.isVideoMode = this.playerElem.hasAttribute('video-mode');

    if (this.isVideoMode) {
      const video = this.videoElem;
      if (video && video.videoWidth && video.videoHeight && video.readyState >= 2) {
        return {
          key: `video_${video.currentSrc || 'stream'}`,
          elem: video,
          width: video.videoWidth,
          height: video.videoHeight,
          fit: 'contain',
          isVideo: true
        };
      }
    }

    let cover = this.coverElem;
    if (!cover || !cover.complete || (cover.naturalWidth && cover.naturalWidth <= 1)) {
      cover = document.querySelector('ytmusic-player-bar .image img, ytmusic-player-bar #thumbnail img');
    }

    if (!cover || !cover.complete || (cover.naturalWidth && cover.naturalWidth <= 1)) {
      return null;
    }

    const fit = window.getComputedStyle(cover).objectFit === 'contain' ? 'contain' : 'cover';
    return {
      key: `cover_${cover.currentSrc || cover.src}`,
      elem: cover,
      width: cover.naturalWidth || 500,
      height: cover.naturalHeight || 500,
      fit,
      isVideo: false
    };
  }

  checkPlayerPageOpen() {
    if (this.isOpenProvider) return this.isOpenProvider();
    if (this.platform !== 'ytmusic') return true;

    const isWatchUrl = window.location.pathname.includes('/watch');
    const hasOpenAttr =
      this.playerElem?.hasAttribute?.('player-page-open') ||
      this.playerPageElem?.hasAttribute?.('player-page-open') ||
      this.playerPageElem?.hasAttribute?.('is-open');
    const uiState =
      this.playerPageElem?.getAttribute?.('player-ui-state') ||
      this.playerElem?.getAttribute?.('player-ui-state');
    const isStateOpen = uiState === 'DEFAULT' || uiState === 'FULLSCREEN';
    const isStateMini = uiState === 'MINIPLAYER' || uiState === 'INACTIVE';

    if (isWatchUrl) return true;
    if (isStateMini) return false;
    return Boolean(hasOpenAttr || isStateOpen);
  }

  update() {
    this.isVideoMode = this.playerElem ? this.playerElem.hasAttribute('video-mode') : false;
    this.isPlayerPageOpen = this.checkPlayerPageOpen();

    this.isFullscreen =
      (this.playerElem && this.playerElem.getAttribute('player-ui-state') === 'FULLSCREEN') ||
      document.fullscreenElement != null;

    const isPlaying = this.isPlayingProvider ? this.isPlayingProvider() : !document.querySelector('video')?.paused;
    const shouldBeActive =
      this.settings.enabled &&
      (this.isPlayerPageOpen || (this.settings.ambientWhileBrowsing && isPlaying)) &&
      !this.isFullscreen &&
      document.visibilityState !== 'hidden';

    // Synchronize body class for hiding #browse-page when player is open
    if (this.platform === 'ytmusic') {
      document.body.classList.toggle('ytal-player-open', Boolean(this.isPlayerPageOpen && this.settings.enabled));
    }

    if (!shouldBeActive) {
      if (this.enabled) this.hide();
      return;
    }

    const source = this.getSource();
    if (!source) {
      this.container.classList.remove('ytal-music--visible');
      return;
    }

    this.enabled = true;
    this.container.classList.add('ytal-music--active');

    // Trigger crossfade transition if source changed
    if (source.key !== this.currentSourceKey) {
      this.transitionFramesLeft = this.currentSourceKey === null ? 0 : this.TRANSITION_FRAMES;
      this.currentSourceKey = source.key;
      this.barDetector.reset();
    }

    this.updateLayout();
    this.container.classList.add('ytal-music--visible');
    this.scheduleDraw();
  }

  hide() {
    this.enabled = false;
    this.container.classList.remove('ytal-music--active', 'ytal-music--visible');
    document.body.classList.remove('ytal-player-open');
    this.cancelScheduledDraw();
    this.cancelScheduledVideoFrame();
    this.updateVideoClip(null);
  }

  scheduleLayoutUpdate() {
    if (this.scheduledLayoutId !== null) return;
    this.scheduledLayoutId = requestAnimationFrame(() => {
      this.scheduledLayoutId = null;
      this.updateLayout();
    });
  }

  updateLayout() {
    if (!this.enabled) return;

    if (!this.isPlayerPageOpen && this.platform === 'ytmusic') {
      this.glowWrapper.style.opacity = '0';
      return;
    } else {
      this.glowWrapper.style.opacity = '1';
    }

    const source = this.getSource();
    if (!source) return;

    let left = 0, top = 0, width = 0, height = 0;
    if (source.elem && source.elem.getBoundingClientRect) {
      const elemRect = source.elem.getBoundingClientRect();
      left = elemRect.left;
      top = elemRect.top;
      width = elemRect.width;
      height = elemRect.height;
    }

    // Adjust for contain letterboxing
    if (source.fit === 'contain' && source.width && source.height) {
      const scale = Math.min(width / source.width, height / source.height);
      const contentWidth = source.width * scale;
      const contentHeight = source.height * scale;
      left += (width - contentWidth) / 2;
      top += (height - contentHeight) / 2;
      width = contentWidth;
      height = contentHeight;
    }

    // Spotify fallback: if browsing without open Now Playing view, center halo gracefully
    if ((!width || !height || width < 80) && this.platform === 'spotify') {
      width = 500;
      height = 500;
      left = (window.innerWidth - width) / 2;
      top = (window.innerHeight - height) / 2;
    }

    if (!width || !height) return;

    // Clip detected black bars for videos
    if (source.isVideo && this.settings.detectBlackBars) {
      const { horizontal, vertical } = this.barsClip;
      const clipX = (width * vertical) / 100 + (vertical > 0 ? this.BARS_CLIP_MARGIN : 0);
      const clipY = (height * horizontal) / 100 + (horizontal > 0 ? this.BARS_CLIP_MARGIN : 0);
      left += clipX;
      top += clipY;
      width -= clipX * 2;
      height -= clipY * 2;
      this.updateVideoClip(source.elem);
    } else {
      this.updateVideoClip(null);
    }

    // Position the glow wrapper behind the media
    const style = this.glowWrapper.style;
    style.left = `${Math.round(left)}px`;
    style.top = `${Math.round(top)}px`;
    style.width = `${Math.round(width)}px`;
    style.height = `${Math.round(height)}px`;

    const minDimension = Math.round(Math.min(width, height));
    this.container.style.setProperty('--ytal-size', `${minDimension}px`);

    // Dynamically size buffer canvas matching aspect ratio
    const bufferHeight = Math.max(1, Math.round((this.BUFFER_WIDTH * height) / width));
    if (this.buffer.width !== this.BUFFER_WIDTH || this.buffer.height !== bufferHeight) {
      this.buffer.width = this.BUFFER_WIDTH;
      this.buffer.height = bufferHeight;

      for (const layer of this.layers) {
        layer.canvas.width = this.BUFFER_WIDTH;
        layer.canvas.height = bufferHeight;
      }
      this.transitionFramesLeft = 0;
      this.scheduleDraw();
    }
  }

  scheduleDraw() {
    if (this.scheduledFrameId !== null) return;
    this.scheduledFrameId = requestAnimationFrame(() => {
      this.scheduledFrameId = null;
      this.draw(false);
    });
  }

  cancelScheduledDraw() {
    if (this.scheduledFrameId !== null) {
      cancelAnimationFrame(this.scheduledFrameId);
      this.scheduledFrameId = null;
    }
  }

  scheduleVideoFrame(video) {
    if (this.scheduledVideoFrameId !== null) return;

    if ('requestVideoFrameCallback' in video) {
      this.scheduledVideoFrameVideo = video;
      this.scheduledVideoFrameId = video.requestVideoFrameCallback(() => {
        this.scheduledVideoFrameId = null;
        this.draw(true);
      });
    } else {
      this.scheduledVideoFrameId = requestAnimationFrame(() => {
        this.scheduledVideoFrameId = null;
        this.draw(true);
      });
    }
  }

  cancelScheduledVideoFrame() {
    if (this.scheduledVideoFrameId !== null) {
      if (this.scheduledVideoFrameVideo && 'cancelVideoFrameCallback' in this.scheduledVideoFrameVideo) {
        this.scheduledVideoFrameVideo.cancelVideoFrameCallback(this.scheduledVideoFrameId);
      } else {
        cancelAnimationFrame(this.scheduledVideoFrameId);
      }
      this.scheduledVideoFrameId = null;
      this.scheduledVideoFrameVideo = null;
    }
  }

  draw(isVideoCallback = false) {
    if (!this.enabled) return;

    const source = this.getSource();
    if (!source) return;

    const isVideo = source.isVideo;
    const isPlaying = isVideo && !source.elem.paused && !source.elem.ended;

    // Temporal frame blending calculation
    let alpha = 1.0;
    if (this.transitionFramesLeft > 0) {
      this.transitionFramesLeft--;
      alpha = this.transitionFramesLeft ? 0.15 : 1.0;
    } else if (isVideoCallback && isPlaying) {
      const smoothness = this.settings.smoothness;
      // Exponential moving average: lower alpha = heavier temporal blend
      alpha = Math.max(0.12, 1.0 - (smoothness / 100) * 0.88);
    }

    this.renderSource(source, alpha);

    // Run black bar detection when playing video
    if (isVideo && isPlaying && this.settings.detectBlackBars) {
      const newClip = this.barDetector.detect(
        this.bufferCtx,
        this.buffer.width,
        this.buffer.height,
        source.elem.currentSrc
      );
      if (
        newClip.horizontal !== this.barsClip.horizontal ||
        newClip.vertical !== this.barsClip.vertical
      ) {
        this.barsClip = newClip;
        this.updateLayout();
      }
    }

    // Schedule next frame
    if (this.transitionFramesLeft > 0) {
      this.scheduleDraw();
    } else if (isPlaying) {
      this.scheduleVideoFrame(source.elem);
    }
  }

  renderSource(source, alpha) {
    const ctx = this.bufferCtx;
    const { width: bWidth, height: bHeight } = this.buffer;

    let sx = 0;
    let sy = 0;
    let sWidth = source.width;
    let sHeight = source.height;

    // Exclude black bars from source crop
    if (source.isVideo && this.settings.detectBlackBars) {
      const { horizontal, vertical } = this.barsClip;
      sx = (sWidth * vertical) / 100;
      sy = (sHeight * horizontal) / 100;
      sWidth -= sx * 2;
      sHeight -= sy * 2;
    } else if (source.fit === 'cover') {
      const scale = Math.max(bWidth / sWidth, bHeight / sHeight);
      sWidth = bWidth / scale;
      sHeight = bHeight / scale;
      sx = (source.width - sWidth) / 2;
      sy = (source.height - sHeight) / 2;
    }

    ctx.globalAlpha = alpha;
    try {
      ctx.drawImage(source.elem, sx, sy, sWidth, sHeight, 0, 0, bWidth, bHeight);
    } catch {
      // Gracefully ignore frame draw exception (e.g. video decoder transition)
      return;
    }

    // 1. Blit to the Fullscreen Viewport Aura
    this.viewportCtx.drawImage(
      this.buffer,
      0,
      0,
      bWidth,
      bHeight,
      0,
      0,
      this.viewportCanvas.width,
      this.viewportCanvas.height
    );

    // 2. Blit to the Near and Far localized projection layers
    for (const layer of this.layers) {
      layer.ctx.drawImage(this.buffer, 0, 0);
    }
  }

  updateVideoClip(video) {
    if (this.clippedVideo && this.clippedVideo !== video) {
      this.clippedVideo.style.removeProperty('--ytal-video-clip');
      this.clippedVideo.classList.remove('ytal-video-clip');
      this.clippedVideo = null;
    }
    if (!video || !this.settings.detectBlackBars) return;

    const { horizontal, vertical } = this.barsClip;
    if (horizontal === 0 && vertical === 0) {
      video.style.removeProperty('--ytal-video-clip');
      video.classList.remove('ytal-video-clip');
      return;
    }

    const clipY = `calc(${horizontal}% + ${this.BARS_CLIP_MARGIN}px)`;
    const clipX = `calc(${vertical}% + ${this.BARS_CLIP_MARGIN}px)`;
    video.style.setProperty('--ytal-video-clip', `inset(${clipY} ${clipX})`);
    video.classList.add('ytal-video-clip');
    this.clippedVideo = video;
  }

  destroy() {
    this.hide();
    if (this.playerObserver) this.playerObserver.disconnect();
    if (this.playerPageObserver) this.playerPageObserver.disconnect();
    if (this.coverObserver) this.coverObserver.disconnect();
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.coverContainer) this.coverContainer.removeEventListener('load', this.onCoverLoad, { capture: true });
    if (this.playerPageElem) {
      this.playerPageElem.removeEventListener('transitionend', this.onTransitionEnd);
      this.playerPageElem.removeEventListener('animationend', this.onTransitionEnd);
      this.playerPageElem.removeEventListener('scroll', this.onScroll, { capture: true });
    }
    if (this.playerElem) {
      this.playerElem.removeEventListener('playing', this.onVideoEvent, { capture: true });
      this.playerElem.removeEventListener('seeked', this.onVideoEvent, { capture: true });
      this.playerElem.removeEventListener('loadeddata', this.onVideoEvent, { capture: true });
      this.playerElem.removeEventListener('pause', this.onVideoEvent, { capture: true });
      this.playerElem.removeEventListener('ended', this.onVideoEvent, { capture: true });
      this.playerElem.removeEventListener('resize', this.onVideoEvent, { capture: true });
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.onNavigate) {
      window.removeEventListener('popstate', this.onNavigate);
      document.removeEventListener('yt-navigate-finish', this.onNavigate);
    }
    document.body.classList.remove('ytal-player-open', 'ytal-liquid-glass');
    this.container.remove();
  }
}

if (typeof window !== 'undefined') {
  window.YTALAmbientEngine = YTALAmbientEngine;
}
