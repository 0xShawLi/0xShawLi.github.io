/**
 * Terminal core: command parsing, output rendering, fuzzy matching.
 *
 * Depends on: SITE_DATA (from data.js), Typewriter (from typewriter.js)
 */
class Terminal {
  /**
   * @param {HTMLElement} outputEl - terminal output container
   * @param {HTMLElement} inputEl  - text input element
   */
  constructor(outputEl, inputEl) {
    this.outputEl = outputEl;
    this.inputEl = inputEl;
    this.commandHistory = [];
    this.historyIndex = -1;
    this.isAnimating = false;
    this._typewriter = null;
    this._skipHandlerBound = null;
    this._skipClickBound = null;

    // ── Command definitions ──
    this.commands = {
      help:      { fn: this._cmdHelp.bind(this),      desc: "Show available commands" },
      whoami:    { fn: this._cmdWhoami.bind(this),     desc: "Who am I?" },
      skills:    { fn: this._cmdSkills.bind(this),     desc: "Show tech stack" },
      education: { fn: this._cmdEducation.bind(this),  desc: "Show education background" },
      projects:  { fn: this._cmdProjects.bind(this),   desc: "Show projects / portfolio" },
      resume:    { fn: this._cmdResume.bind(this),     desc: "Download resume PDF" },
      download:  { fn: this._cmdResume.bind(this),     desc: "Alias for /resume" },
      ask:       { fn: this._cmdAsk.bind(this),        desc: "Got questions?" },
      exit:      { fn: this._cmdExit.bind(this),       desc: "Skip to profile page" },
      clear:     { fn: this._cmdClear.bind(this),      desc: "Clear terminal" },
    };

    this._bindEvents();
  }

  // ═══════════════════════════════════════════
  //  Event Binding
  // ═══════════════════════════════════════════

  /** @private */
  _bindEvents() {
    var self = this;

    this.inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        self._executeCommand(self.inputEl.value);
        self.inputEl.value = "";
        self._updateCursor(0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        self._navigateHistory(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        self._navigateHistory(1);
      }
    });

    // Keep cursor position in sync
    this.inputEl.addEventListener("input", function () {
      self._updateCursor(self.inputEl.selectionStart);
    });

    this.inputEl.addEventListener("click", function () {
      self._updateCursor(self.inputEl.selectionStart);
    });

    this.inputEl.addEventListener("keyup", function () {
      self._updateCursor(self.inputEl.selectionStart);
    });

    // Click anywhere in terminal to focus input
    document.getElementById("terminal-view").addEventListener("click", function (e) {
      if (!e.target.closest(".skip-link")) {
        self.inputEl.focus();
      }
    });
  }

  /** @private */
  _updateCursor(pos) {
    var cursor = document.getElementById("cursor-block");
    if (!cursor) return;

    // Measure text width up to cursor position
    var temp = document.createElement("span");
    var computed = window.getComputedStyle(this.inputEl);
    temp.style.font = computed.font;
    temp.style.visibility = "hidden";
    temp.style.position = "absolute";
    temp.style.whiteSpace = "pre";
    temp.textContent = this.inputEl.value.substring(0, pos);
    document.body.appendChild(temp);
    cursor.style.left = temp.offsetWidth + "px";
    document.body.removeChild(temp);
  }

  // ═══════════════════════════════════════════
  //  Command Execution
  // ═══════════════════════════════════════════

  /**
   * Parse and execute a command.
   * @private
   */
  _executeCommand(raw) {
    var input = raw.trim();
    if (!input) return;

    // Add to history
    this.commandHistory.unshift(input);
    this.historyIndex = -1;

    // Echo the command
    this._echoCommand(input);

    // Parse: strip leading /, lowercase
    var cmd = input.toLowerCase().replace(/^\//, "").trim();

    // Check hidden easter eggs first
    if (this._checkEasterEgg(cmd, input)) {
      return;
    }

    // Look up
    if (this.commands[cmd]) {
      this.commands[cmd].fn();
    } else {
      // Fuzzy match
      var match = this._fuzzyMatch(cmd);
      if (match) {
        this._appendSegments([
          { text: "Command not found. Did you mean ", cls: "" },
          { text: "/" + match, cls: "highlight" },
          { text: "?", cls: "" },
        ]);
      } else {
        this._appendSegments([
          { text: "Unknown command: ", cls: "error" },
          { text: input, cls: "" },
        ]);
        this._appendSegments([
          { text: "Type ", cls: "dim" },
          { text: "/help", cls: "highlight" },
          { text: " to see available commands.", cls: "dim" },
        ]);
      }
    }
  }

  // ═══════════════════════════════════════════
  //  Fuzzy Matching
  // ═══════════════════════════════════════════

  /** @private */
  _fuzzyMatch(input) {
    var cmdNames = Object.keys(this.commands);

    // Prefix match first
    var prefix = cmdNames.find(function (n) { return n.startsWith(input); });
    if (prefix) return prefix;

    // Levenshtein distance <= 2
    var bestMatch = null;
    var bestDist = Infinity;
    for (var i = 0; i < cmdNames.length; i++) {
      var dist = this._levenshtein(input, cmdNames[i]);
      if (dist < bestDist && dist <= 2) {
        bestDist = dist;
        bestMatch = cmdNames[i];
      }
    }
    return bestMatch;
  }

  /** @private */
  _levenshtein(a, b) {
    var matrix = [];
    var i, j;
    for (i = 0; i <= b.length; i++) matrix[i] = [i];
    for (j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b[i - 1] === a[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // ═══════════════════════════════════════════
  //  History Navigation
  // ═══════════════════════════════════════════

  /** @private */
  _navigateHistory(direction) {
    if (direction === -1 && this.historyIndex < this.commandHistory.length - 1) {
      this.historyIndex++;
    } else if (direction === 1 && this.historyIndex > 0) {
      this.historyIndex--;
    }

    if (this.historyIndex >= 0) {
      this.inputEl.value = this.commandHistory[this.historyIndex];
    } else {
      this.inputEl.value = "";
    }
    this._updateCursor(this.inputEl.value.length);
  }

  // ═══════════════════════════════════════════
  //  Output Helpers
  // ═══════════════════════════════════════════

  /** @private */
  _echoCommand(cmd) {
    var block = document.createElement("div");
    block.className = "output-block";
    block.innerHTML =
      '<span class="command-echo"><span class="echo-prompt">$</span> ' +
      this._escapeHtml(cmd) +
      "</span>";
    this.outputEl.appendChild(block);
    this._scrollToBottom();
  }

  /**
   * Append a line made of styled segments.
   * @private
   */
  _appendSegments(segments) {
    var block = document.createElement("div");
    block.className = "output-block";

    var line = document.createElement("div");
    line.className = "output-line";

    segments.forEach(function (seg) {
      var span = document.createElement("span");
      span.className = seg.cls || "";
      span.textContent = seg.text;
      line.appendChild(span);
    });

    block.appendChild(line);
    this.outputEl.appendChild(block);
    this._scrollToBottom();
  }

  /**
   * Append multiple lines (each can be HTML string or segment array).
   * @private
   */
  _appendLines(lines) {
    var block = document.createElement("div");
    block.className = "output-block";

    lines.forEach(function (lineData) {
      if (typeof lineData === "string") {
        var line = document.createElement("div");
        line.className = "output-line";
        line.innerHTML = lineData;
        block.appendChild(line);
      } else if (lineData.html !== undefined) {
        var line2 = document.createElement("div");
        line2.className = ("output-line " + (lineData.cls || "")).trim();
        line2.innerHTML = lineData.html;
        block.appendChild(line2);
      }
    });

    this.outputEl.appendChild(block);
    this._scrollToBottom();
  }

  // ═══════════════════════════════════════════
  //  Command Implementations
  // ═══════════════════════════════════════════

  /** @private */
  _cmdHelp() {
    var self = this;
    var lines = [
      { html: '<span class="dim">Available commands:</span>' },
    ];

    Object.keys(this.commands).forEach(function (name) {
      if (name === "download") return; // hide alias
      var cmd = self.commands[name];
      var padding = "         ";
      var pad = padding.substring(name.length + 1);
      if (pad.length < 1) pad = " ";
      lines.push({
        html:
          '<span class="cmd-name">&gt; /' + name + "</span>" +
          '<span class="cmd-desc">' + pad + cmd.desc + "</span>",
      });
    });

    lines.push({ html: "" });
    lines.push({
      html:
        '<span class="dim">Tip: you can type commands with or without the leading /</span>',
    });

    this._appendLines(lines);
  }

  /** @private */
  _cmdWhoami() {
    var self = this;
    var d = SITE_DATA;
    var lines = [
      { html: '<span class="highlight">' + self._escapeHtml(d.name) + '</span>' },
      { html: '<span class="dim">' + self._escapeHtml(d.title) + '</span>' },
      { html: '' },
      { html: '<span class="dim">email   :</span> <a href="mailto:' + self._escapeHtml(d.social.email) + '">' + self._escapeHtml(d.social.email) + '</a>' },
    ];
    if (d.social.github) {
      lines.push({ html: '<span class="dim">github  :</span> <a href="' + self._escapeHtml(d.social.github) + '" target="_blank" rel="noopener">' + self._escapeHtml(d.social.github) + '</a>' });
    }
    if (d.social.linkedin) {
      lines.push({ html: '<span class="dim">linkedin:</span> <a href="' + self._escapeHtml(d.social.linkedin) + '" target="_blank" rel="noopener">' + self._escapeHtml(d.social.linkedin) + '</a>' });
    }
    lines.push({ html: '' });
    this._appendLines(lines);
  }

  /** @private */
  _cmdSkills() {
    var self = this;
    var lines = [{ html: '<span class="dim">\u2500\u2500 Tech Stack \u2500\u2500</span>' }, { html: "" }];

    SITE_DATA.skills.forEach(function (group) {
      lines.push({
        html:
          '<span class="skill-category-name">' +
          self._escapeHtml(group.category) +
          "</span>" +
          '<span class="skill-items">  ' +
          group.items.join(", ") +
          "</span>",
      });
    });

    lines.push({ html: "" });
    lines.push({
      html:
        '<span class="dim">Visit the </span><span class="highlight">profile page</span>' +
        '<span class="dim"> for a richer view \u2192 type </span><span class="highlight">/exit</span>',
    });

    this._appendLines(lines);
  }

  /** @private */
  _cmdEducation() {
    var self = this;
    var lines = [{ html: '<span class="dim">\u2500\u2500 Education \u2500\u2500</span>' }, { html: "" }];

    SITE_DATA.education.forEach(function (edu) {
      lines.push({
        html: '<span class="edu-degree">' + self._escapeHtml(edu.degree) + "</span>",
      });
      lines.push({
        html:
          '<span class="edu-school">' + self._escapeHtml(edu.school) + "</span>" +
          ' <span class="edu-period">(' + self._escapeHtml(edu.period + ")") + "</span>",
      });
      if (edu.details) {
        edu.details.forEach(function (d) {
          lines.push({ html: '  <span class="dim">\u2022</span> ' + self._escapeHtml(d) });
        });
      }
      lines.push({ html: "" });
    });

    this._appendLines(lines);
  }

  /** @private */
  _cmdProjects() {
    var self = this;
    var lines = [{ html: '<span class="dim">\u2500\u2500 Projects \u2500\u2500</span>' }, { html: "" }];

    SITE_DATA.projects.forEach(function (proj, i) {
      lines.push({ html: '<span class="project-name">' + self._escapeHtml(proj.name) + "</span>" });
      lines.push({ html: '<span class="project-desc">' + self._escapeHtml(proj.description) + "</span>" });
      lines.push({ html: '<span class="project-tech">[' + proj.tech.join(" \u00b7 ") + "]</span>" });
      if (proj.link) {
        lines.push({
          html:
            '<span class="dim">\u2192</span> <a href="' +
            self._escapeHtml(proj.link) +
            '" target="_blank" rel="noopener">' +
            self._escapeHtml(proj.link) +
            "</a>",
        });
      }
      if (i < SITE_DATA.projects.length - 1) lines.push({ html: "" });
    });

    this._appendLines(lines);
  }

  /** @private */
  _cmdResume() {
    this._appendLines([
      { html: '<span class="success">\u2192 Downloading resume...</span>' },
      {
        html:
          '<span class="dim">  If download didn\'t start, try: </span>' +
          '<a href="' + this._escapeHtml(SITE_DATA.resumeUrl) + '" download>direct link</a>',
      },
    ]);

    // Trigger download
    var a = document.createElement("a");
    a.href = SITE_DATA.resumeUrl;
    a.download = "";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /** @private */
  _cmdAsk() {
    this._appendLines([
      { html: "" },
      { html: '<span class="warn">  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510</span>' },
      { html: '<span class="warn">  \u2502</span>  Nope, no real LLM here. (Budget constraints.)  <span class="warn">\u2502</span>' },
      { html: '<span class="warn">  \u2502</span>  But I do read emails \u2014 usually within 24h.     <span class="warn">\u2502</span>' },
      { html: '<span class="warn">  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518</span>' },
      { html: "" },
      {
        html:
          '  <span class="dim">Reach me at \u2192</span> <a href="mailto:' +
          this._escapeHtml(SITE_DATA.social.email) +
          '">' +
          this._escapeHtml(SITE_DATA.social.email) +
          "</a>",
      },
      { html: '  <span class="dim">Or type</span> <span class="highlight">/exit</span> <span class="dim">for more contact options.</span>' },
      { html: "" },
    ]);
  }

  /** @private */
  _cmdExit() {
    this._appendLines([{ html: '<span class="dim">Switching to profile view...</span>' }]);
    var self = this;
    setTimeout(function () {
      if (window.app) {
        window.app.switchToProfile();
      }
    }, 300);
  }

  /** @private */
  _cmdClear() {
    this.outputEl.innerHTML = "";
  }

  // ═══════════════════════════════════════════
  //  Easter Eggs (Hidden Commands)
  // ═══════════════════════════════════════════

  /**
   * Check for hidden easter egg commands.
   * Returns true if an easter egg was triggered.
   * @private
   */
  _checkEasterEgg(cmd, rawInput) {
    // rm -rf / or any rm variant
    if (cmd === "rm" || cmd.startsWith("rm ") || cmd.startsWith("rm-")) {
      this._eggRm(rawInput);
      return true;
    }

    // sudo, sudo su, etc.
    if (cmd === "sudo" || cmd.startsWith("sudo ")) {
      this._eggSudo(rawInput);
      return true;
    }

    // consensus / raft
    if (cmd === "consensus" || cmd === "raft") {
      this._eggRaft();
      return true;
    }

    if (cmd.startsWith("ls") || cmd.startsWith("ll") || cmd === "pwd"){
      this._eggLs();
      return true;
    }

    return false;
  }

  /** @private */
  _eggLs(input) {
    this._appendLines([
      { html: '<span class="dim">This is not real shell, of course </span>' },
      { html: '<span class="dim">but your browser does</span>' },
    ]);
  }

  /** @private */
  _eggRm(input) {
    this._appendLines([
      { html: '<span class="warn">⚠  Are you serious?</span>' },
      { html: '' },
      { html: '<span class="dim">This file system is append-only. Why not work with me to extend it?</span>' },
      { html: '<span class="dim">I promise I\'m more fun than rm -rf.</span>' },
    ]);
  }

  /** @private */
  _eggSudo(input) {
    this._appendLines([
      { html: '<span class="error">Permission denied: you are not root on this machine.</span>' },
      { html: '' },
      { html: '<span class="dim">But hey — why not hire me to execute as root on <em>your</em> infrastructure?</span>' },
      { html: '<span class="dim">Type <span class="highlight">/ask</span> for my email.</span>' },
    ]);
  }

  /** @private */
  _eggRaft() {
    var self = this;
    var term = Math.floor(Math.random() * 10) + 1;

    var lines = [
      { html: '<span class="dim">── Raft Consensus Simulation ──</span>' },
      { html: '' },
      { html: '<span class="dim">Cluster: [node-0, node-1, node-2]</span>' },
      { html: '<span class="dim">Current term: ' + (term - 1) + '</span>' },
      { html: '' },
      { html: '<span class="dim">[node-0] Follower, term ' + (term - 1) + '</span>' },
      { html: '<span class="dim">[node-1] Follower, term ' + (term - 1) + '</span>' },
      { html: '<span class="dim">[node-2] Follower, term ' + (term - 1) + '</span>' },
      { html: '' },
      { html: '<span class="dim">[node-1] Election timeout! Starting election for term ' + term + '...</span>' },
      { html: '<span class="highlight">[node-1] Requesting votes from [node-0, node-2]</span>' },
      { html: '<span class="dim">[node-0] Granting vote to node-1 (term ' + term + ')</span>' },
      { html: '<span class="dim">[node-2] Granting vote to node-1 (term ' + term + ')</span>' },
      { html: '' },
      { html: '<span class="success">[node-1] Received majority (2/3) — elected LEADER (term ' + term + ')</span>' },
      { html: '' },
      { html: '<span class="dim">[node-1] Sending AppendEntries heartbeat to [node-0, node-2]</span>' },
      { html: '<span class="dim">[node-0] Acknowledged leader node-1</span>' },
      { html: '<span class="dim">[node-2] Acknowledged leader node-1</span>' },
      { html: '' },
      { html: '<span class="success">✓ Cluster stable. Leader: node-1 | Term: ' + term + '</span>' },
      { html: '' },
      { html: '<span class="dim">Yes, I actually understand distributed consensus. </span><span class="highlight">/ask</span><span class="dim"> me about it.</span>' },
    ];

    // Animate lines with delay for effect
    this._appendLines([lines[0], lines[1], lines[2], lines[3], lines[4]]);

    var idx = 5;
    var interval = setInterval(function() {
      if (idx >= lines.length) {
        clearInterval(interval);
        return;
      }
      self._appendLines([lines[idx]]);
      idx++;
    }, 200);
  }

  // ═══════════════════════════════════════════
  //  Welcome Animation
  // ═══════════════════════════════════════════

  /**
   * Show welcome message with typewriter effect.
   * User can press any key or click to skip.
   */
  async showWelcome() {
    this.isAnimating = true;

    var welcomeLines = [
      "Welcome to " + SITE_DATA.name + "'s terminal portfolio.",
      "",
      "This is an interactive terminal. Type commands to explore.",
      "Type /help to see what's available, or just look around.",
      "",
      "Hint: press any key or click to skip this animation.",
      "",
    ];

    var self = this;
    var typewriter = new Typewriter(this.outputEl, {
      speed: 25,
      onComplete: function () {
        self.isAnimating = false;
        self.inputEl.focus();
      },
    });
    this._typewriter = typewriter;

    welcomeLines.forEach(function (line) {
      typewriter.addLine(line);
    });

    // Skip handlers
    var skipped = false;
    function skipHandler(e) {
      // Don't skip on modifier-only keys or input keys
      if (e.type === "keydown" && (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta")) {
        return;
      }
      if (!skipped && self.isAnimating) {
        skipped = true;
        typewriter.skip();
        self.isAnimating = false;
        self.inputEl.focus();
        cleanup();
      }
    }

    function skipClickHandler(e) {
      if (!e.target.closest(".skip-link")) {
        skipHandler(e);
      }
    }

    function cleanup() {
      document.removeEventListener("keydown", skipHandler);
      var tv = document.getElementById("terminal-view");
      if (tv) tv.removeEventListener("click", skipClickHandler);
    }

    document.addEventListener("keydown", skipHandler);
    document.getElementById("terminal-view").addEventListener("click", skipClickHandler);

    // Start animation
    await typewriter.start();

    // Show help after welcome
    this._cmdHelp();
    this.inputEl.focus();

    cleanup();
  }

  // ═══════════════════════════════════════════
  //  Utilities
  // ═══════════════════════════════════════════

  /** @private */
  _escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /** @private */
  _scrollToBottom() {
    var el = this.outputEl;
    requestAnimationFrame(function () {
      el.scrollTop = el.scrollHeight;
    });
  }
}
