class BackgroundTransition {
  /**
   * The DOM element we are controlling (e.g., a canvas or div).
   * @type {HTMLElement}
   */
  element;

  /**
   * The URL of the background we are currently fading TO or are fully displaying.
   * @type {string | null}
   */
  currentBackgroundUrl = null;

  /**
   * The URL of the background we are fading FROM.
   * @type {string | null}
   */
  previousBackgroundUrl = null;

  /**
   * Initializes the transition manager for a given DOM element.
   * @param {HTMLElement} element The canvas, div, or other element to apply the background to.
   */
  constructor(element) {
    if (!element) {
      throw new Error('BackgroundTransition requires a valid DOM element.');
    }
    this.element = element;

    // Automatically add the required CSS class to the element.
    this.element.classList.add('bg-transition-container');
  }

  /**
   * Updates the background cross-fade. Call this on every frame of your animation.
   * @param {string} newImageUrl The URL string for the target background image.
   * @param {number} progress The progress of the fade, from 0.0 (fully previous) to 1.0 (fully new).
   */
  changeBackground(newImageUrl, progress) {
    // 1. Handle the very first time a background is set.
    if (!this.currentBackgroundUrl) {
      this.element.style.backgroundImage = `url(${newImageUrl})`;
      this.currentBackgroundUrl = newImageUrl;
      return; // No transition needed, so we're done.
    }

    // 2. Detect when to start a NEW transition.
    // If the requested image is different from our current target, it means
    // we need to start a new fade. The old "current" becomes the "previous".
    if (newImageUrl !== this.currentBackgroundUrl) {
      this.previousBackgroundUrl = this.currentBackgroundUrl;
      this.currentBackgroundUrl = newImageUrl;

      // Set the "FROM" background on the main element (bottom layer).
      this.element.style.backgroundImage = `url(${this.previousBackgroundUrl})`;

      // Set the "TO" background on the pseudo-element (top layer).
      this.element.style.setProperty('--new-bg-image', `url(${this.currentBackgroundUrl})`);
    }

    // 3. Update the fade progress on every call.
    // Clamp the progress value between 0 and 1 to be safe.
    const opacity = Math.max(0, Math.min(1, progress));

    // Set the opacity on the pseudo-element (top layer).
    this.element.style.setProperty('--fade-opacity', opacity.toString());
  }
}
export default BackgroundTransition