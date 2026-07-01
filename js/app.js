/**
 * Application entry: view switching, profile rendering, initialization.
 *
 * Depends on: SITE_DATA_PROMISE (from data.js), Terminal (from terminal.js)
 */
var App = (function () {
  "use strict";

  function App() {
    this.terminalView = document.getElementById("terminal-view");
    this.profileView = document.getElementById("profile-view");
    this.terminal = null;
  }

  App.prototype.init = function () {
    this._bindNavigation();
    this._initTerminal();
    this._consoleWelcome();
  };

  // ── Terminal Init ──

  App.prototype._initTerminal = function () {
    var outputEl = document.getElementById("terminal-output");
    var inputEl = document.getElementById("terminal-input");
    this.terminal = new Terminal(outputEl, inputEl);
    this.terminal.showWelcome();
  };

  // ── Navigation ──

  App.prototype._bindNavigation = function () {
    var self = this;

    // [skip →] → profile
    document.getElementById("skip-link").addEventListener("click", function (e) {
      e.preventDefault();
      self.switchToProfile();
    });

    // [$ ] → terminal
    document.getElementById("back-to-terminal").addEventListener("click", function (e) {
      e.preventDefault();
      self.switchToTerminal();
    });
  };

  App.prototype.switchToProfile = function () {
    this.terminalView.classList.remove("active");
    this.profileView.classList.add("active");
    document.body.style.overflow = "";
    this.profileView.scrollTop = 0;
  };

  App.prototype.switchToTerminal = function () {
    this.profileView.classList.remove("active");
    this.terminalView.classList.add("active");
    document.body.style.overflow = "hidden";

    var inputEl = document.getElementById("terminal-input");
    setTimeout(function () {
      inputEl.focus();
    }, 350);
  };

  // ── Profile Rendering ──

  App.prototype._renderProfile = function () {
    var data = SITE_DATA;

    // Page title
    document.title = data.name + " | " + data.title;

    // Header frontmatter
    document.getElementById("profile-name").textContent = data.name;
    document.getElementById("profile-title").textContent = data.title;
    document.getElementById("profile-about").innerHTML = data.about;

    // Email in frontmatter
    var emailEl = document.getElementById("profile-email");
    if (data.social.email) {
      emailEl.innerHTML = '<a href="mailto:' + escapeHtml(data.social.email) + '">' + escapeHtml(data.social.email) + '</a>';
    }

    // Skills
    var skillsContainer = document.getElementById("skills-content");
    skillsContainer.innerHTML = data.skills
      .map(function (group) {
        return (
          '<div class="skill-card">' +
          '<div class="skill-card-title">' +
          escapeHtml(group.category) +
          "</div>" +
          '<div class="skill-card-items">' +
          group.items
            .map(function (item) {
              return '<span class="skill-tag">' + escapeHtml(item) + "</span>";
            })
            .join("") +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    // Projects
    var projectsContainer = document.getElementById("projects-content");
    projectsContainer.innerHTML = data.projects
      .map(function (proj) {
        return (
          '<div class="project-card">' +
          '<div class="project-card-header">' +
          '<span class="project-card-name">' + escapeHtml(proj.name) + "</span>" +
          (proj.link
            ? '<a href="' + escapeHtml(proj.link) + '" target="_blank" rel="noopener" class="project-card-link">\u2197 source</a>'
            : "") +
          "</div>" +
          '<div class="project-card-desc">' + escapeHtml(proj.description) + "</div>" +
          '<div class="project-card-tech">' +
          proj.tech
            .map(function (t) {
              return '<span class="tech-tag">' + escapeHtml(t) + "</span>";
            })
            .join("") +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    // Experience
    var expContainer = document.getElementById("experience-content");
    expContainer.innerHTML = data.experience
      .map(function (exp) {
        return (
          '<div class="experience-item">' +
          '<div class="experience-header">' +
          '<span class="experience-company">' + escapeHtml(exp.company) + "</span>" +
          '<span class="experience-period">' + escapeHtml(exp.period) + "</span>" +
          "</div>" +
          '<div class="experience-title">' + escapeHtml(exp.title) + "</div>" +
          '<ul class="experience-bullets">' +
          exp.bullets
            .map(function (b) {
              return "<li>" + escapeHtml(b) + "</li>";
            })
            .join("") +
          "</ul>" +
          "</div>"
        );
      })
      .join("");

    // Education
    var eduContainer = document.getElementById("education-content");
    eduContainer.innerHTML = data.education
      .map(function (edu) {
        return (
          '<div class="education-item">' +
          '<div class="education-header">' +
          '<span class="education-school">' + escapeHtml(edu.school) + "</span>" +
          '<span class="education-period">' + escapeHtml(edu.period) + "</span>" +
          "</div>" +
          '<div class="education-degree">' + escapeHtml(edu.degree) + "</div>" +
          (edu.details
            ? '<ul class="education-details">' +
              edu.details
                .map(function (d) {
                  return "<li>" + escapeHtml(d) + "</li>";
                })
                .join("") +
              "</ul>"
            : "") +
          "</div>"
        );
      })
      .join("");

    // Contact
    var contactContainer = document.getElementById("contact-content");
    var links = [];
    if (data.social.email) {
      links.push(
        '<a href="mailto:' + escapeHtml(data.social.email) + '" class="contact-link">\u2709 ' + escapeHtml(data.social.email) + "</a>"
      );
    }
    if (data.social.github) {
      links.push(
        '<a href="' + escapeHtml(data.social.github) + '" target="_blank" rel="noopener" class="contact-link">\u2325 GitHub</a>'
      );
    }
    if (data.social.linkedin) {
      links.push(
        '<a href="' + escapeHtml(data.social.linkedin) + '" target="_blank" rel="noopener" class="contact-link">\u2325 LinkedIn</a>'
      );
    }
    if (data.social.twitter) {
      links.push(
        '<a href="' + escapeHtml(data.social.twitter) + '" target="_blank" rel="noopener" class="contact-link">\u2325 Twitter</a>'
      );
    }
    contactContainer.innerHTML = links.join("");
  };

  // ── Console Easter Egg ──

  App.prototype._consoleWelcome = function () {
    var email = SITE_DATA.social ? SITE_DATA.social.email : "";
    console.log(
      "%c\n" +
      "  ╔══════════════════════════════════════════════╗\n" +
      "  ║                                              ║\n" +
      "  ║   Hey, curious developer! 👋                 ║\n" +
      "  ║                                              ║\n" +
      "  ║   Thanks for peeking under the hood.         ║\n" +
      "  ║   I'm " + (SITE_DATA.name || "the author") + " — reach me at:              ║\n" +
      "  ║   📧 " + (email || "check the terminal") + "          ║\n" +
      "  ║                                              ║\n" +
      "  ║   ── Hidden goodies you might enjoy ──       ║\n" +
      "  ║                                              ║\n" +
      "  ║   > rm -rf /        (delete this resume?)    ║\n" +
      "  ║   > sudo su         (root access?)           ║\n" +
      "  ║   > /raft           (watch consensus work)   ║\n" +
      "  ║                                              ║\n" +
      "  ╚══════════════════════════════════════════════╝\n",
      "font-family: monospace; color: #79c0ff; font-size: 12px;"
    );
  };

  // ── Utility ──

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  return App;
})();

// ── Bootstrap (async: wait for config JSON files) ──
document.addEventListener("DOMContentLoaded", function () {
  SITE_DATA_PROMISE.then(function () {
    window.app = new App();
    window.app.init();
    window.app._renderProfile();
  }).catch(function (err) {
    console.error("Failed to load portfolio config:", err);
    var output = document.getElementById("terminal-output");
    if (output) {
      output.innerHTML =
        '<div class="output-block"><div class="output-line error">Error: Failed to load config files. Check browser console.</div></div>';
    }
  });
});
