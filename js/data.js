/**
 * Data loader — fetches all config JSON files and merges into SITE_DATA.
 *
 * Config files (edit these to customize your portfolio):
 *   config/basic.json      — name, title, social links, about, resumeUrl
 *   config/skills.json     — skill groups
 *   config/projects.json   — project list
 *   config/experience.json — work experience
 *   config/education.json  — education background
 */
var SITE_DATA = null;

var SITE_DATA_PROMISE = (function () {
  var files = [
    "/config/basic.json",
    "/config/skills.json",
    "/config/projects.json",
    "/config/experience.json",
    "/config/education.json",
  ];

  return Promise.all(
    files.map(function (url) {
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error("Failed to load " + url + ": " + r.status);
        return r.json();
      });
    })
  ).then(function (results) {
    var basic = results[0];
    SITE_DATA = {
      name: basic.name,
      title: basic.title,
      description: basic.description,
      social: basic.social,
      about: basic.about,
      resumeUrl: basic.resumeUrl,
      skills: results[1],
      projects: results[2],
      experience: results[3],
      education: results[4],
    };
    return SITE_DATA;
  });
})();
