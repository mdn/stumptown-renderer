/**
 * @prettier
 */
const util = require("./util.js");
const Templates = require("../templates.js");

const DUMMY_BASE_URL = "https://example.com";
const L10N_COMMON_STRINGS = new Templates().getLocalizedCommonStrings();

const _warned = new Map();
// The purpose of this function is to make sure `console.warn` is only called once
// per 'macro' per 'href'.
// There are some macros that use `smartLink` within themselves and these macros
// might be buggy and that's not the fault of the person using the wrapping
// macro. And because these might be used over and over and over we don't want
// to bombard stdout with warnings more than once.
// For example, there are X pages that use the CSS sidebar macro `CSSRef` and it
// might contain something like `smartLink(URL + 'oops', ...)` which leads to a
// broken link. But that problem lies with the `CSSRef.ejs` macro, which we
// don't entirely want to swallow and forget. But we don't want to point this
// out on every single page that *uses* that `CSSRef` macro.
function warnBrokenFlawByMacro(macro, href, extra = "") {
  if (!_warned.has(macro)) {
    _warned.set(macro, new Set());
  }
  if (!_warned.get(macro).has(href)) {
    _warned.get(macro).add(href);
    console.warn(
      `In ${macro} the smartLink to ${href} is broken${
        extra ? ` (${extra})` : ""
      }`
    );
  }
}

module.exports = {
  // Insert a hyperlink.
  link(uri, text, title, target) {
    const out = [`<a href="${util.spacesToUnderscores(util.htmlEscape(uri))}"`];
    if (title) {
      out.push(` title="${util.htmlEscape(title)}"`);
    }
    if (target) {
      out.push(` target="${util.htmlEscape(target)}"`);
    }
    out.push(">", util.htmlEscape(text || uri), "</a>");
    return out.join("");
  },

  smartLink(href, title, content, subpath, basepath, ignoreFlawMacro = null) {
    let flaw;
    let flawAttribute = "";
    const page = this.info.getPageByURL(href);
    // Get the pathname only (no hash) of the incoming "href" URI.
    const hrefpath = this.info.getPathname(href);
    // Save the hash portion, if any, for appending to the "href" attribute later.
    const hrefhash = new URL(href, DUMMY_BASE_URL).hash;
    if (page.url) {
      if (hrefpath.toLowerCase() !== page.url.toLowerCase()) {
        if (page.url.startsWith(basepath)) {
          let suggested = page.url.replace(basepath, "");
          if (
            /\//.test(suggested) &&
            !title &&
            basepath.endsWith("/Web/API/")
          ) {
            // This is the exception! When `smartLink` is used from the DOMxRef.ejs
            // macro, the xref macro notation should use a `.` instead of a `/`.
            // E.g. `{{domxref("GlobalEventHandlers.onload")}}
            // because, when displayed we want the HTML to become:
            //
            //   <a href="/en-US/docs/Web/API/GlobalEventHandlers/onload">
            //     <code>GlobalEventHandlers.onload</code>
            //   </a>
            //
            // Note the `<code>GlobalEventHandlers.onload</code>` label.
            // However, some uses of DOMxRef uses a custom title. E.g.
            // {{domxref("WindowOrWorkerGlobalScope/fetch","fetch()")}}
            // which needs to become:
            //
            //   <a href="/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch">
            //     <code>fetch()</code>
            //   </a>
            //
            // So those with titles we ignore.
            suggested = suggested.replace(/\//g, ".");
          }
          if (ignoreFlawMacro) {
            warnBrokenFlawByMacro(
              ignoreFlawMacro,
              href,
              `redirects to ${page.url}`
            );
          } else {
            flaw = this.env.recordNonFatalError(
              "redirected-link",
              `${hrefpath} redirects to ${page.url}`,
              {
                current: subpath,
                suggested,
              }
            );
            flawAttribute = ` data-flaw="${
              flaw.id
            }" data-flaw-src="${util.htmlEscape(flaw.macroSource)}"`;
          }
        } else {
          flaw = this.env.recordNonFatalError(
            "wrong-xref-macro",
            "wrong xref macro used (consider changing which macro you use)",
            {
              current: subpath,
            }
          );
          flawAttribute = ` data-flaw="${
            flaw.id
          }" data-flaw-src="${util.htmlEscape(flaw.macroSource)}"`;
        }
      }
      const titleAttribute = title ? ` title="${title}"` : "";
      return `<a href="${
        page.url + hrefhash
      }"${titleAttribute}${flawAttribute}>${content}</a>`;
    }
    if (!href.toLowerCase().startsWith("/en-us/")) {
      // Before flagging this as a broken-link flaw, see if it's possible to
      // change it to the en-US URL instead.
      const hrefSplit = href.split("/");
      hrefSplit[1] = "en-US";
      const enUSPage = this.info.getPageByURL(hrefSplit.join("/"));
      if (enUSPage.url) {
        // But it's still a flaw. Record it so that translators can write a
        // translated document to "fill the hole".
        if (ignoreFlawMacro) {
          warnBrokenFlawByMacro(ignoreFlawMacro, href);
        } else {
          flaw = this.env.recordNonFatalError(
            "broken-link",
            `${hrefpath} does not exist but fallbacked on ${enUSPage.url}`
          );
          flawAttribute = ` data-flaw="${
            flaw.id
          }" data-flaw-src="${util.htmlEscape(flaw.macroSource)}"`;
        }
        return (
          '<a class="only-in-en-us" ' +
          'title="Currently only available in English (US)" ' +
          `href="${enUSPage.url}"${flawAttribute}>${content} <span>(en-US)</span></a>`
        );
      }
    }
    if (ignoreFlawMacro) {
      warnBrokenFlawByMacro(ignoreFlawMacro, href);
    } else {
      flaw = this.env.recordNonFatalError(
        "broken-link",
        `${hrefpath} does not exist`
      );
      flawAttribute = ` data-flaw="${flaw.id}" data-flaw-src="${util.htmlEscape(
        flaw.macroSource
      )}"`;
    }
    // Let's get a potentially localized title for when the document is missing.
    const titleWhenMissing = this.mdn.getLocalString(
      L10N_COMMON_STRINGS,
      "summary"
    );
    return `<a class="page-not-created" title="${titleWhenMissing}"${flawAttribute}>${content}</a>`;
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
