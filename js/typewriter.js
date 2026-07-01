/**
 * Typewriter animation engine with skip support.
 *
 * Usage:
 *   const tw = new Typewriter(containerEl, { speed: 30 });
 *   tw.addLine("Hello, world!");
 *   tw.addLine("Second line", "dim");
 *   tw.start();
 *   // later: tw.skip();
 */
class Typewriter {
  /**
   * @param {HTMLElement} element - container to append lines into
   * @param {Object} options
   * @param {number} [options.speed=30] - ms per character
   * @param {Function} [options.onComplete] - callback when done or skipped
   */
  constructor(element, options = {}) {
    this.element = element;
    this.speed = options.speed || 30;
    this.onComplete = options.onComplete || function () {};
    this.isSkipping = false;
    this.isComplete = false;
    this.queue = [];
    this._aborted = false;
  }

  /**
   * Add a line to the typewriter queue.
   * @param {string} text
   * @param {string} [className] - extra CSS class for the line element
   * @returns {Typewriter} this (for chaining)
   */
  addLine(text, className) {
    this.queue.push({ text: text, className: className || "" });
    return this;
  }

  /**
   * Start the typewriter animation.
   * @returns {Promise<void>}
   */
  async start() {
    this.isComplete = false;

    for (var i = 0; i < this.queue.length; i++) {
      if (this._aborted) break;

      var item = this.queue[i];
      var lineEl = document.createElement("div");
      lineEl.className = ("output-line " + item.className).trim();
      this.element.appendChild(lineEl);

      // Type each character
      for (var j = 0; j < item.text.length; j++) {
        if (this.isSkipping || this._aborted) {
          lineEl.textContent = item.text;
          break;
        }
        lineEl.textContent = item.text.substring(0, j + 1);
        await this._delay(this.speed);
      }

      // Ensure full text is visible
      lineEl.textContent = item.text;
      this._scrollToBottom();
    }

    this.isComplete = true;
    this.onComplete();
  }

  /**
   * Skip the animation and show all remaining content immediately.
   */
  skip() {
    if (this.isComplete) return;
    this.isSkipping = true;

    // Render all remaining lines
    var existingLines = this.element.querySelectorAll(".output-line");
    for (var i = 0; i < this.queue.length; i++) {
      var item = this.queue[i];
      if (i >= existingLines.length) {
        var lineEl = document.createElement("div");
        lineEl.className = ("output-line " + item.className).trim();
        lineEl.textContent = item.text;
        this.element.appendChild(lineEl);
      } else {
        existingLines[i].textContent = item.text;
      }
    }

    this.isComplete = true;
    this._scrollToBottom();
    this.onComplete();
  }

  /**
   * Abort the typewriter (used when switching views).
   */
  abort() {
    this._aborted = true;
    this.isComplete = true;
  }

  /** @private */
  _delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  /** @private */
  _scrollToBottom() {
    var el = this.element;
    el.scrollTop = el.scrollHeight;
  }
}
