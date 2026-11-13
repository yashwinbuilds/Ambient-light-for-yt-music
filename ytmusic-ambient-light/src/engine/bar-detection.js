/**
 * Ambient Light for YouTube Music™ - Intelligent Black Bar Detection
 * Detects letterboxing (top/bottom) and pillarboxing (left/right) in music videos
 * so the ambient glow samples true media content rather than black borders.
 */

class YTALBarDetection {
  constructor() {
    this.barsClip = { horizontal: 0, vertical: 0 }; // percentage (0 - 40)
    this.threshold = 18; // Max RGB luminance to consider 'black'
    this.maxClip = 35;   // Prevent clipping full-frame dark scenes
    this.stableCount = 0;
    this.candidateClip = { horizontal: 0, vertical: 0 };
    this.currentSrc = '';
  }

  reset() {
    this.barsClip = { horizontal: 0, vertical: 0 };
    this.candidateClip = { horizontal: 0, vertical: 0 };
    this.stableCount = 0;
  }

  /**
   * Evaluates pixel data from a rendered buffer canvas to determine black bar dimensions
   * @param {CanvasRenderingContext2D} ctx - Context of the downscaled buffer
   * @param {number} width - Buffer width
   * @param {number} height - Buffer height
   * @param {string} videoSrc - Current video source URL (to detect track change)
   * @returns {{horizontal: number, vertical: number}} detected bar percentages
   */
  detect(ctx, width, height, videoSrc) {
    if (videoSrc !== this.currentSrc) {
      this.currentSrc = videoSrc;
      this.reset();
    }

    if (width <= 0 || height <= 0) return this.barsClip;

    let imgData;
    try {
      imgData = ctx.getImageData(0, 0, width, height);
    } catch {
      // If canvas is tainted or context unavailable, fallback gracefully
      return this.barsClip;
    }

    const data = imgData.data;
    const isDark = (r, g, b) => r < this.threshold && g < this.threshold && b < this.threshold;

    // 1. Detect Top Bar
    let topBars = 0;
    for (let y = 0; y < Math.floor(height * (this.maxClip / 100)); y++) {
      let isRowDark = true;
      // Sample 7 points along the row
      for (let step = 1; step <= 7; step++) {
        const x = Math.floor((width * step) / 8);
        const idx = (y * width + x) * 4;
        if (!isDark(data[idx], data[idx + 1], data[idx + 2])) {
          isRowDark = false;
          break;
        }
      }
      if (isRowDark) {
        topBars++;
      } else {
        break;
      }
    }

    // 2. Detect Bottom Bar
    let bottomBars = 0;
    for (let y = height - 1; y >= height - Math.floor(height * (this.maxClip / 100)); y--) {
      let isRowDark = true;
      for (let step = 1; step <= 7; step++) {
        const x = Math.floor((width * step) / 8);
        const idx = (y * width + x) * 4;
        if (!isDark(data[idx], data[idx + 1], data[idx + 2])) {
          isRowDark = false;
          break;
        }
      }
      if (isRowDark) {
        bottomBars++;
      } else {
        break;
      }
    }

    // 3. Detect Left & Right Pillarbox
    let leftBars = 0;
    for (let x = 0; x < Math.floor(width * (this.maxClip / 100)); x++) {
      let isColDark = true;
      for (let step = 1; step <= 7; step++) {
        const y = Math.floor((height * step) / 8);
        const idx = (y * width + x) * 4;
        if (!isDark(data[idx], data[idx + 1], data[idx + 2])) {
          isColDark = false;
          break;
        }
      }
      if (isColDark) {
        leftBars++;
      } else {
        break;
      }
    }

    let rightBars = 0;
    for (let x = width - 1; x >= width - Math.floor(width * (this.maxClip / 100)); x--) {
      let isColDark = true;
      for (let step = 1; step <= 7; step++) {
        const y = Math.floor((height * step) / 8);
        const idx = (y * width + x) * 4;
        if (!isDark(data[idx], data[idx + 1], data[idx + 2])) {
          isColDark = false;
          break;
        }
      }
      if (isColDark) {
        rightBars++;
      } else {
        break;
      }
    }

    // Symmetrical clip calculations
    const horizontalPct = Math.round((Math.min(topBars, bottomBars) / height) * 100);
    const verticalPct = Math.round((Math.min(leftBars, rightBars) / width) * 100);

    // Hysteresis filter: candidate must be observed for multiple cycles to prevent flicker
    if (
      Math.abs(horizontalPct - this.candidateClip.horizontal) <= 1 &&
      Math.abs(verticalPct - this.candidateClip.vertical) <= 1
    ) {
      this.stableCount++;
      if (this.stableCount >= 4) {
        this.barsClip = {
          horizontal: horizontalPct,
          vertical: verticalPct
        };
      }
    } else {
      this.candidateClip = { horizontal: horizontalPct, vertical: verticalPct };
      this.stableCount = 0;
    }

    return this.barsClip;
  }
}

if (typeof window !== 'undefined') {
  window.YTALBarDetection = YTALBarDetection;
}
