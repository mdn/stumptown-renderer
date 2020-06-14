/**
 * @prettier
 */
const util = require("./util.js");
const Templates = require("../templates.js");

const DUMMY_BASE_URL = "https://example.com";
const L10N_COMMON_STRINGS = new Templates().getLocalizedCommonStrings();

module.exports = {
  // Insert a hyperlink.
  link(uri, text, title, target) {
    var out = [
      '<a href="' + util.spacesToUnderscores(util.htmlEscape(uri)) + '"',
    ];
    if (title) {
      out.push(' title="' + util.htmlEscape(title) + '"');
    }
    if (target) {
      out.push(' target="' + util.htmlEscape(target) + '"');
    }
    out.push(">", util.htmlEscape(text || uri), "</a>");
    return out.join("");
  },

  smartLink(href, title, content, subpath, basepath) {
    const page = this.info.getPage(href);
    // Get the pathname only (no hash) of the incoming "href" URI.
    const hrefpath = this.info.getPathname(href);
    // Save the hash portion, if any, for appending to the "href" attribute later.
    const hrefhash = new URL(href, DUMMY_BASE_URL).hash;
    if (page.url) {
      if (hrefpath.toLowerCase() !== page.url.toLowerCase()) {
        this.env.recordNonFatalError(`${hrefpath} redirects to ${page.url}`, {
          current: subpath,
          suggested: page.url.replace(basepath, ""),
        });
      }
      const titleAttribute = title ? ` title="${title}"` : "";
      return `<a href="${page.url + hrefhash}"${titleAttribute}>${content}</a>`;
    }
    this.env.recordNonFatalError(`${hrefpath} does not exist`);
    // Let's get a potentially localized title for when the document is missing.
    const titleWhenMissing = this.mdn.getLocalString(
      L10N_COMMON_STRINGS,
      "summary"
    );
    return `<a class="new" title="${titleWhenMissing}">${content}</a>`;
  },

  // Try calling "decodeURIComponent", but if there's an error, just
  // return the text unmodified.
  safeDecodeURIComponent: util.safeDecodeURIComponent,

  // Given a URL, convert all spaces to underscores. This lets us fix a
  // bunch of places where templates assume this is done automatically
  // by the API, like MindTouch did.
  spacesToUnderscores: util.spacesToUnderscores,

  // Turn the text content of a header into a slug for use in an ID.
  // Remove unsafe characters, and collapse whitespace gaps into
  // underscores.
  slugify: util.slugify,
};
